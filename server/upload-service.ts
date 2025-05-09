import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { log } from './vite';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { uploadImage, generateThumbnailUrl, deleteImage, getPublicIdFromUrl } from './cloudinary-service';

// Đảm bảo thư mục upload tạm tồn tại để lưu trữ tạm thời
const uploadTempDir = path.join(os.tmpdir(), 'uploads_temp');

if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

// Tạo diskStorage cho lưu trữ tạm thời
const tempDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadTempDir);
  },
  filename: function (req, file, cb) {
    const userId = (req as any).user?.uid || 'anonymous';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    cb(null, `${userId}-${timestamp}-${randomString}-${safeFilename}`);
  }
});

// Multer middleware chỉ sử dụng disk storage tạm thời
const upload = multer({ 
  storage: tempDiskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Ghi log thông tin file để debug
    log(`Multer xử lý file: ${file.originalname}, MIME type: ${file.mimetype}, Size: ${file.size || 'N/A'}`, 'upload-service');
    
    // Kiểm tra tên file có an toàn không
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    if (safeFilename !== file.originalname) {
      log(`Đã chuẩn hóa tên file: ${file.originalname} -> ${safeFilename}`, 'upload-service');
      file.originalname = safeFilename;
    }
    
    // Chỉ chấp nhận file hình ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      log(`File bị từ chối: ${file.originalname} - không phải là hình ảnh (${file.mimetype})`, 'upload-service');
      cb(new Error('Only image files are allowed!') as any);
    }
  }
});

// Middleware để xác thực Firebase token
const verifyFirebaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Bỏ qua xác thực nếu đang trong môi trường dev local
  if (process.env.NODE_ENV === 'development') {
    log('DEV MODE: Skipping Firebase auth token verification', 'upload-service');
    // Sử dụng uid từ body nếu có, hoặc dùng anonymous-dev
    (req as any).user = { uid: req.body?.userId || 'anonymous-dev' };
    return next();
  }

  // Lấy token từ header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log('Unauthorized request: No token provided', 'upload-service');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: No token provided' 
    });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Xác thực token với Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    log(`Firebase token verified for user: ${decodedToken.uid}`, 'upload-service');
    
    // Gắn thông tin người dùng vào request để sử dụng sau này
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    log(`Firebase token verification failed: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Invalid token' 
    });
  }
};

// Legacy Firebase Admin initialization - giữ lại để hỗ trợ Firebase Auth
function initFirebaseAuth() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      log('Firebase Admin initialized for authentication', 'upload-service');
    } else {
      log('Firebase Admin already initialized, reusing existing instance', 'upload-service');
    }
    return true;
  } catch (error) {
    log(`ERROR: Firebase Admin initialization failed: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
    return false;
  }
}

export function setupUploadRoutes(app: express.Express) {
  // Khởi tạo Cloudinary sẽ được thực hiện trong cloudinary-service.ts
  
  // API endpoint để upload ảnh biểu đồ cho phân tích AI
  app.post('/api/upload/chart', verifyFirebaseToken, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        log('No file uploaded to /api/upload/chart', 'upload-service');
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
      }
      
      // Lấy thông tin file sau khi upload
      const file = req.file as any;
      
      // Lấy thông tin người dùng từ request hoặc Firebase
      const userId = (req as any).user?.uid || req.body.userId || 'anonymous';
      
      try {
        // Tạo thông tin metadata
        const metadata = {
          userId: userId,
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname,
          type: 'chart'
        };
        
        // Tải lên Cloudinary
        log(`Uploading chart image to Cloudinary for user ${userId}`, 'upload-service');
        const folder = `charts/${userId}`;
        const uploadResult = await uploadImage(file.path, folder, metadata);
        
        // Xóa file tạm thời
        fs.unlinkSync(file.path);
        
        log(`Chart image uploaded to Cloudinary: ${uploadResult.publicId}`, 'upload-service');
        log(`Chart image URL: ${uploadResult.imageUrl}`, 'upload-service');
        
        // Trả về response với đường dẫn hình ảnh
        return res.status(200).json({
          success: true,
          publicId: uploadResult.publicId,
          originalName: file.originalname,
          size: uploadResult.bytes,
          imageUrl: uploadResult.imageUrl,
          storage: 'cloudinary',
          width: uploadResult.width,
          height: uploadResult.height
        });
      } catch (cloudinaryError) {
        log(`Cloudinary upload error: ${cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)}`, 'upload-service');
        
        // Fallback to local URL if Cloudinary upload fails
        const imageUrl = `/uploads/${file.filename}`;
        log(`Using local storage fallback: ${imageUrl}`, 'upload-service');
        
        return res.status(200).json({
          success: true,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          imageUrl: imageUrl,
          storage: 'local'
        });
      }
    } catch (error) {
      // Ghi log chi tiết hơn về lỗi
      log(`Chart upload error: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
      
      if (error instanceof Error) {
        log(`Error name: ${error.name}`, 'upload-service');
        log(`Error stack: ${error.stack}`, 'upload-service');
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Server error during upload',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // API endpoint để upload ảnh giao dịch 
  app.post('/api/trades/upload', verifyFirebaseToken, upload.single('image'), async (req, res) => {
    // Set timeout ngắn hơn để tránh chờ đợi quá lâu
    const responseTimeout = setTimeout(() => {
      log('Upload timed out after 15s', 'upload-service');
      // Chỉ trả về lỗi nếu chưa có response nào được gửi đi
      if (!res.headersSent) {
        return res.status(408).json({ 
          success: false, 
          error: 'Upload timed out',
          message: 'Quá trình tải ảnh mất quá nhiều thời gian. Vui lòng thử lại.' 
        });
      }
    }, 15000); // 15 giây timeout
    
    try {
      if (!req.file) {
        clearTimeout(responseTimeout);
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
      }
      
      // Lấy thông tin file từ multer
      const file = req.file as any;
      
      const userId = req.body.userId || (req as any).user?.uid || 'anonymous';
      const tradeId = req.body.tradeId || 'temp';
      const imageType = req.body.imageType || 'trade-image';
      
      try {
        // Tạo metadata
        const metadata = {
          userId: userId,
          tradeId: tradeId,
          imageType: imageType,
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname
        };
        
        try {
          // Tải lên Cloudinary
          log(`Uploading trade image to Cloudinary (type: ${imageType})`, 'upload-service');
          const folder = `trades/${userId}/${tradeId}`;
          
          // Có thể thêm tags để dễ dàng quản lý trong Cloudinary
          const tags = [`user:${userId}`, `trade:${tradeId}`, `type:${imageType}`];
          
          // Upload lên Cloudinary
          const uploadResult = await uploadImage(file.path, folder, metadata, undefined, tags);
          
          // Xóa file tạm
          fs.unlinkSync(file.path);
          
          log(`Trade image uploaded to Cloudinary: ${uploadResult.publicId}`, 'upload-service');
          log(`Trade image URL: ${uploadResult.imageUrl}`, 'upload-service');
          
          // Xóa timeout vì đã hoàn thành
          clearTimeout(responseTimeout);
          
          // Trả về response với đường dẫn hình ảnh
          return res.status(200).json({
            success: true,
            publicId: uploadResult.publicId,
            originalName: file.originalname,
            imageType: imageType,
            size: uploadResult.bytes,
            imageUrl: uploadResult.imageUrl,
            storage: {
              provider: 'cloudinary',
              publicId: uploadResult.publicId,
              format: uploadResult.format,
              width: uploadResult.width,
              height: uploadResult.height
            }
          });
        } catch (cloudinaryError) {
          log(`Cloudinary upload error: ${cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)}`, 'upload-service');
          throw cloudinaryError; // Re-throw error để được xử lý ở catch block bên ngoài
        }
      } catch (cloudinaryError) {
        log(`Cloudinary upload error: ${cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)}`, 'upload-service');
        
        // Fallback to local URL if Cloudinary upload fails
        const imageUrl = `/uploads/${file.filename}`;
        log(`Using local storage fallback: ${imageUrl}`, 'upload-service');
        
        // Xóa timeout vì đã hoàn thành
        clearTimeout(responseTimeout);
        
        return res.status(200).json({
          success: true,
          filename: file.filename,
          originalName: file.originalname,
          imageType: imageType,
          size: file.size,
          mimetype: file.mimetype,
          imageUrl: imageUrl,
          storage: {
            provider: 'local',
            path: file.path,
            filename: file.filename
          }
        });
      }
    } catch (error) {
      // Xóa timeout trong trường hợp lỗi
      clearTimeout(responseTimeout);
      
      // Ghi log chi tiết hơn về lỗi
      log(`Trade upload error: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
      
      if (error instanceof Error) {
        log(`Error name: ${error.name}`, 'upload-service');
        log(`Error stack: ${error.stack}`, 'upload-service');
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Server error during upload',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // API endpoint để lấy thumbnail cho một ảnh đã tồn tại
  app.get('/api/thumbnail', async (req, res) => {
    try {
      const { url, path: storagePath, width, height } = req.query;
      
      // Mặc định kích thước thumbnail là 200x200px nếu không được chỉ định
      const thumbWidth = width ? parseInt(width as string) : 200;
      const thumbHeight = height ? parseInt(height as string) : 200;
      
      if (!url && !storagePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing URL or path parameter' 
        });
      }
      
      // Xử lý URL Cloudinary
      if (url && typeof url === 'string' && url.includes('cloudinary.com')) {
        // Sử dụng các tính năng của Cloudinary để tạo thumbnail theo kích thước
        log(`Cloudinary URL detected, generating thumbnail: ${url}`, 'upload-service');
        const thumbnailUrl = generateThumbnailUrl(url, thumbWidth, thumbHeight);
        
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: thumbnailUrl
        });
      }
      // Xử lý URL Firebase Storage (hỗ trợ ngược với các hình ảnh cũ)
      else if (url && typeof url === 'string' && url.includes('firebasestorage.googleapis.com')) {
        // Thumbnail đơn giản: trả về URL gốc vì Firebase Storage không hỗ trợ resize qua URL trực tiếp
        log(`Firebase Storage URL detected (legacy support), using original as thumbnail: ${url}`, 'upload-service');
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: url, // Trả về URL gốc làm thumbnail
          provider: 'firebase'
        });
      }
      // Xử lý local uploads
      else if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
        // Đường dẫn local (giữ lại cho tương thích ngược)
        log(`Local upload thumbnail not supported anymore: ${url}`, 'upload-service');
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: url, // Trả về URL gốc làm thumbnail
          provider: 'local'
        });
      }
      // Xử lý URL khác
      else if (url && typeof url === 'string' && url.startsWith('http')) {
        // Thử xác định nếu đây là URL HTTP khác không phải Cloudinary hay Firebase
        log(`Remote URL thumbnail: ${url}`, 'upload-service');
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: url, // Trả về URL gốc làm thumbnail
          provider: 'remote'
        });
      } else {
        // URL không hợp lệ
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid image URL or path format',
          originalUrl: url || storagePath,
          thumbnailUrl: null
        });
      }
    } catch (error) {
      log(`Thumbnail generation error: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
      return res.status(500).json({ 
        success: false, 
        error: 'Server error during thumbnail generation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // API endpoint để xóa một ảnh (hỗ trợ Cloudinary, Firebase Storage và local storage)
  app.delete('/api/images/delete', verifyFirebaseToken, async (req, res) => {
    try {
      const { url, publicId, path: storagePath, filename } = req.query;
      
      if (!url && !storagePath && !filename && !publicId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing URL, publicId, path, or filename parameter' 
        });
      }
      
      // Xác định loại lưu trữ
      let storageType = 'unknown';
      if (url && typeof url === 'string') {
        if (url.includes('cloudinary.com')) {
          storageType = 'cloudinary';
        } else if (url.includes('firebasestorage.googleapis.com')) {
          storageType = 'firebase';
        } else if (url.startsWith('/uploads/')) {
          storageType = 'local';
        }
      } else if (publicId && typeof publicId === 'string') {
        storageType = 'cloudinary';
      } else if (storagePath && typeof storagePath === 'string') {
        storageType = 'firebase';
      } else if (filename && typeof filename === 'string') {
        storageType = 'local';
      }
      
      log(`Deleting image from ${storageType} storage`, 'upload-service');
      
      let success = false;
      let deleteMessage = '';
      
      // Xử lý Cloudinary
      if (storageType === 'cloudinary') {
        try {
          let publicIdToDelete = publicId as string;
          
          // Nếu không có publicId nhưng có URL, trích xuất publicId từ URL
          if (!publicIdToDelete && url && typeof url === 'string') {
            const extractedId = getPublicIdFromUrl(url);
            
            if (!extractedId) {
              return res.status(400).json({
                success: false,
                error: 'Could not extract public ID from Cloudinary URL'
              });
            }
            
            publicIdToDelete = extractedId;
            log(`Extracted public ID from URL: ${publicIdToDelete}`, 'upload-service');
          }
          
          // Xóa hình ảnh từ Cloudinary
          log(`Deleting image from Cloudinary with public ID: ${publicIdToDelete}`, 'upload-service');
          const deleteResult = await deleteImage(publicIdToDelete);
          
          if (deleteResult.success) {
            success = true;
            deleteMessage = 'Image deleted successfully from Cloudinary';
            log(`Cloudinary image deleted: ${publicIdToDelete}`, 'upload-service');
          } else {
            deleteMessage = `Failed to delete image from Cloudinary: ${deleteResult.result}`;
            success = false;
            log(`Cloudinary deletion failed: ${deleteResult.result}`, 'upload-service');
          }
        } catch (cloudinaryError) {
          log(`Cloudinary deletion error: ${cloudinaryError}`, 'upload-service');
          return res.status(500).json({
            success: false,
            error: 'Error deleting image from Cloudinary',
            message: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error'
          });
        }
      }
      // Hỗ trợ ngược cho Firebase Storage (di sản)
      else if (storageType === 'firebase') {
        // Xóa ảnh từ Firebase Storage - Giữ lại hàm này chỉ để hỗ trợ ảnh cũ
        log('Legacy Firebase Storage deletion not fully supported anymore', 'upload-service');
        deleteMessage = 'Firebase Storage images are now read-only legacy content';
        success = false;
      }
      // Hỗ trợ xóa file địa phương
      else if (storageType === 'local') {
        // Xóa ảnh từ lưu trữ local
        let filePath = '';
        
        if (filename && typeof filename === 'string') {
          filePath = path.join(uploadTempDir, filename as string);
        } else if (url && typeof url === 'string') {
          // Trích xuất tên file từ URL local
          const localFileName = url.replace('/uploads/', '');
          filePath = path.join(uploadTempDir, localFileName);
        }
        
        log(`Attempting to delete local file: ${filePath}`, 'upload-service');
        
        // Kiểm tra xem file có tồn tại không
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            success = true;
            deleteMessage = 'Image deleted successfully from local storage';
            log(`Local image deleted: ${filePath}`, 'upload-service');
          } catch (fsError) {
            log(`Error deleting local file: ${fsError}`, 'upload-service');
            deleteMessage = `Failed to delete local file: ${fsError instanceof Error ? fsError.message : fsError}`;
            success = false;
          }
        } else {
          log(`Local file not found: ${filePath}`, 'upload-service');
          deleteMessage = 'Image file not found in local storage';
          success = false;
        }
      } else {
        deleteMessage = 'Unknown storage type or invalid parameters';
        success = false;
      }
      
      // Trả về kết quả
      if (success) {
        return res.status(200).json({
          success: true,
          message: deleteMessage,
          storageType: storageType
        });
      } else {
        return res.status(400).json({
          success: false,
          error: deleteMessage
        });
      }
    } catch (error) {
      log(`Image deletion error: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
      return res.status(500).json({ 
        success: false, 
        error: 'Server error during image deletion',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Serve tệp đã upload (giữ lại cho khả năng tương thích ngược)
  app.use('/uploads', express.static(uploadTempDir));

  log('Upload service routes have been set up', 'upload-service');
}
