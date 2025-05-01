import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { log } from './vite';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

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

// Hàm khởi tạo Firebase Admin và cung cấp Bucket
function getFirebaseStorage() {
  // Kiểm tra xem Firebase Admin đã được khởi tạo chưa
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'trading-journal-b83e9.appspot.com',
      });
      log('Firebase Admin initialized for upload service', 'upload-service');
    } else {
      log('Firebase Admin already initialized, reusing existing instance', 'upload-service');
    }

    // Lấy Storage từ Firebase Admin
    const storage = getStorage();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'trading-journal-b83e9.appspot.com';
    
    // Lấy bucket chính xác từ Storage
    const bucket = storage.bucket(bucketName);
    log(`Firebase Storage bucket initialized: ${bucketName}`, 'upload-service');
    
    return { storage, bucket };
  } catch (error) {
    log(`ERROR: Firebase Storage initialization failed: ${error instanceof Error ? error.message : String(error)}`, 'upload-service');
    log('Continuing with local storage fallback only', 'upload-service');
    return { storage: null, bucket: null };
  }
}

export function setupUploadRoutes(app: express.Express) {
  // Khởi tạo Firebase Storage khi thiết lập routes
  const { bucket } = getFirebaseStorage();
  
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
      
      // Tạo đường dẫn lưu trữ trong Firebase Storage
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_');
      const storagePath = `charts/${userId}/${timestamp}-${randomString}-${safeFilename}`;
      
      // Upload lên Firebase Storage nếu bucket đã được khởi tạo thành công
      if (bucket) {
        try {
          // Đọc nội dung file từ đường dẫn local tạm thời
          const fileBuffer = fs.readFileSync(file.path);
          
          // Tạo file object trong Firebase Storage
          const fileRef = bucket.file(storagePath);
          
          // Thiết lập metadata
          const metadata = {
            contentType: file.mimetype,
            metadata: {
              userId: userId,
              uploadedAt: new Date().toISOString(),
              originalName: file.originalname,
              type: 'chart'
            }
          };
          
          // Tải lên Firebase Storage
          await fileRef.save(fileBuffer, {
            metadata: metadata,
            public: true,
            validation: 'md5'
          });
          
          // Tạo signed URL cho file
          const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500', // Thời gian hết hạn dài
          });
          
          // Xóa file tạm
          fs.unlinkSync(file.path);
          
          log(`Chart image uploaded to Firebase Storage: ${storagePath}`, 'upload-service');
          log(`Chart image URL: ${url}`, 'upload-service');
          
          // Trả về response với đường dẫn hình ảnh
          return res.status(200).json({
            success: true,
            filename: storagePath,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            imageUrl: url,
            storage: 'firebase'
          });
        } catch (storageError) {
          log(`Firebase Storage upload error: ${storageError instanceof Error ? storageError.message : String(storageError)}`, 'upload-service');
        }
      }
      
      // Fallback to local URL if Firebase upload fails or bucket not available
      const imageUrl = `/uploads/${file.filename}`;
      log(`Using local storage: ${imageUrl}`, 'upload-service');
      
      return res.status(200).json({
        success: true,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        imageUrl: imageUrl,
        storage: 'local'
      });
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
      
      // Tạo đường dẫn lưu trữ trong Firebase Storage
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_');
      
      // Tạo đường dẫn theo cấu trúc: trades/userId/tradeId/imageType-timestamp-randomString-filename
      const storagePath = `trades/${userId}/${tradeId}/${imageType}-${timestamp}-${randomString}-${safeFilename}`;
      
      // Upload lên Firebase Storage nếu bucket khả dụng
      if (bucket) {
        try {
          // Đọc nội dung file từ đường dẫn local tạm thời
          const fileBuffer = fs.readFileSync(file.path);
          
          // Tạo file object trong Firebase Storage
          const fileRef = bucket.file(storagePath);
          
          // Thiết lập metadata
          const metadata = {
            contentType: file.mimetype,
            metadata: {
              userId: userId,
              tradeId: tradeId,
              imageType: imageType,
              uploadedAt: new Date().toISOString(),
              originalName: file.originalname
            }
          };
          
          // Tải lên Firebase Storage
          await fileRef.save(fileBuffer, {
            metadata: metadata,
            public: true,
            validation: 'md5'
          });
          
          // Tạo signed URL cho file
          const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500', // Thời gian hết hạn dài
          });
          
          // Xóa file tạm
          fs.unlinkSync(file.path);
          
          log(`Trade image uploaded to Firebase Storage: ${storagePath}`, 'upload-service');
          log(`Trade image URL: ${url}`, 'upload-service');
          
          // Xóa timeout vì đã hoàn thành
          clearTimeout(responseTimeout);
          
          // Trả về response với đường dẫn hình ảnh
          return res.status(200).json({
            success: true,
            filename: storagePath,
            originalName: file.originalname,
            imageType: imageType,
            size: file.size,
            mimetype: file.mimetype,
            imageUrl: url,
            storage: {
              provider: 'firebase',
              path: storagePath,
              bucket: bucket.name
            }
          });
        } catch (storageError) {
          // Ghi log lỗi
          log(`Firebase Storage upload error: ${storageError instanceof Error ? storageError.message : String(storageError)}`, 'upload-service');
        }
      }
      
      // Fallback to local URL if Firebase upload fails or bucket not available
      const imageUrl = `/uploads/${file.filename}`;
      log(`Using local storage: ${imageUrl}`, 'upload-service');
      
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
      const { url, path: storagePath } = req.query;
      
      if (!url && !storagePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing URL or path parameter' 
        });
      }
      
      // Xử lý URL Firebase Storage
      if (url && typeof url === 'string' && url.includes('firebasestorage.googleapis.com')) {
        // Thumbnail đơn giản: trả về URL gốc vì Firebase Storage không hỗ trợ resize qua URL trực tiếp
        log(`Firebase Storage URL detected, using original as thumbnail: ${url}`, 'upload-service');
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: url // Trả về URL gốc làm thumbnail
        });
      } 
      // Xử lý Firebase Storage Path
      else if (storagePath && typeof storagePath === 'string' && bucket) {
        try {
          // Lấy file reference từ storage path
          const fileRef = bucket.file(storagePath as string);
          
          // Kiểm tra xem file có tồn tại không
          const [exists] = await fileRef.exists();
          if (!exists) {
            return res.status(404).json({
              success: false,
              error: 'File not found in Firebase Storage'
            });
          }
          
          // Tạo signed URL
          const [signedUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
          });
          
          log(`Firebase Storage thumbnail (original) URL generated: ${signedUrl}`, 'upload-service');
          return res.status(200).json({
            success: true,
            originalUrl: signedUrl,
            thumbnailUrl: signedUrl // Không có resize, sử dụng URL gốc
          });
        } catch (error) {
          log(`Error generating Firebase Storage thumbnail: ${error}`, 'upload-service');
          return res.status(500).json({
            success: false,
            error: 'Error generating thumbnail',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Xử lý local uploads
      else if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
        // Đường dẫn local (giữ lại cho tương thích ngược)
        log(`Local upload thumbnail not supported anymore: ${url}`, 'upload-service');
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: url // Trả về URL gốc làm thumbnail
        });
      }
      // Xử lý URL khác
      else if (url && typeof url === 'string' && url.startsWith('http')) {
        // URL khác - không hỗ trợ tạo thumbnail
        log(`Remote URL thumbnail not supported: ${url}`, 'upload-service');
        return res.status(200).json({
          success: true,
          originalUrl: url,
          thumbnailUrl: url // Trả về URL gốc làm thumbnail
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
  
  // API endpoint để xóa một ảnh (hỗ trợ Firebase Storage và local storage)
  app.delete('/api/images/delete', verifyFirebaseToken, async (req, res) => {
    try {
      const { url, path: storagePath, filename } = req.query;
      
      if (!url && !storagePath && !filename) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing URL, path, or filename parameter' 
        });
      }
      
      // Xác định loại lưu trữ
      let storageType = 'unknown';
      if (url && typeof url === 'string') {
        if (url.includes('firebasestorage.googleapis.com')) {
          storageType = 'firebase';
        } else if (url.startsWith('/uploads/')) {
          storageType = 'local';
        }
      } else if (storagePath && typeof storagePath === 'string') {
        storageType = 'firebase';
      } else if (filename && typeof filename === 'string') {
        storageType = 'local';
      }
      
      log(`Deleting image from ${storageType} storage`, 'upload-service');
      
      let success = false;
      let deleteMessage = '';
      
      if (storageType === 'firebase' && bucket) {
        // Xóa ảnh từ Firebase Storage
        let filePathInStorage = '';
        
        if (storagePath && typeof storagePath === 'string') {
          // Sử dụng path trực tiếp nếu được cung cấp
          filePathInStorage = storagePath;
        } else if (url && typeof url === 'string') {
          // Cố gắng trích xuất storage path từ URL Firebase
          try {
            // URL Firebase có dạng: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[encodedPath]?token=...
            const urlObj = new URL(url);
            const encodedPath = urlObj.pathname.split('/o/')[1];
            if (encodedPath) {
              filePathInStorage = decodeURIComponent(encodedPath.split('?')[0]);
              log(`Extracted storage path from URL: ${filePathInStorage}`, 'upload-service');
            }
          } catch (urlError) {
            log(`Error extracting path from Firebase URL: ${urlError}`, 'upload-service');
          }
        }
        
        if (!filePathInStorage) {
          return res.status(400).json({ 
            success: false, 
            error: 'Could not determine storage path from provided parameters' 
          });
        }
        
        // Xóa file từ Firebase Storage
        try {
          const fileRef = bucket.file(filePathInStorage);
          const [exists] = await fileRef.exists();
          
          if (exists) {
            await fileRef.delete();
            success = true;
            deleteMessage = 'Image deleted successfully from Firebase Storage';
            log(`Firebase Storage image deleted: ${filePathInStorage}`, 'upload-service');
          } else {
            deleteMessage = 'Image file not found in Firebase Storage';
            success = false;
            log(`Firebase Storage file not found: ${filePathInStorage}`, 'upload-service');
          }
        } catch (storageError) {
          log(`Firebase Storage deletion error: ${storageError}`, 'upload-service');
          return res.status(500).json({
            success: false,
            error: 'Error deleting image from Firebase Storage',
            message: storageError instanceof Error ? storageError.message : 'Unknown error'
          });
        }

      } else if (storageType === 'local') {
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
