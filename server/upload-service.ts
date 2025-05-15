import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { log } from './vite';
import admin from 'firebase-admin';

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

export { initFirebaseAuth, upload, verifyFirebaseToken };