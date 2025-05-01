/**
 * API Service for communicating with Firebase Storage
 * 
 * This service handles image uploads and deletions directly through Firebase Storage Web SDK
 * instead of going through server endpoints or Cloud Functions
 */

import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { initFirebase } from './firebase';
import { debug } from './debug';

/**
 * Mapping between image types in UI and image types in storage
 * 
 * This is how we synchronize names between UI and backend
 */
const IMAGE_TYPE_MAP = {
  // UI frontend name: Storage folder name
  'h4chart': 'entry-h4',
  'm15chart': 'entry-m15',
  'h4exit': 'exit-h4',
  'm15exit': 'exit-m15'
} as const;

// Type definitions to ensure type safety
type UiImageType = keyof typeof IMAGE_TYPE_MAP;
type StorageImageType = typeof IMAGE_TYPE_MAP[UiImageType];

/**
 * Upload an image for a trade directly to Firebase Storage
 * 
 * @param userId - User ID
 * @param tradeId - Trade ID
 * @param file - Image file to upload
 * @param imageType - Image type (h4chart, m15chart, h4exit, m15exit)
 * @param progressCallback - Callback to update progress
 * @returns Promise with result as {success, imageUrl}
 */
export async function uploadTradeImage(
  userId: string,
  tradeId: string,
  file: File,
  imageType: string,
  progressCallback?: (progress: number) => void
): Promise<{ success: boolean; imageUrl: string }> {
  debug(`API Service: Tải lên ảnh loại ${imageType}`);
  
  // Kiểm tra đầu vào
  if (!file) {
    throw new Error('Không có file để tải lên');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(`Kích thước file vượt quá giới hạn 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Chuyển đổi loại ảnh từ UI sang storage type
  const storageType = (IMAGE_TYPE_MAP[imageType as UiImageType] || 'entry-h4') as StorageImageType;
  debug(`Đã chuyển đổi từ UI type "${imageType}" sang storage type "${storageType}"`);
  
  // Khởi tạo Firebase nếu chưa
  const { storage, auth } = initFirebase();
  
  // Nếu chưa đăng nhập trong môi trường dev, tạo một UID giả để sử dụng
  if (!auth.currentUser) {
    debug('Không có người dùng đăng nhập, sử dụng userId được cung cấp:', userId);
  }
  
  try {
    // Cập nhật tiến trình ban đầu
    if (progressCallback) progressCallback(2);
    
    // Tạo đường dẫn lưu trữ độc nhất
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    
    // Đường dẫn trong Storage: images/{userId}/{tradeId}/{image-type}-{timestamp}-{random}-{filename}
    const storagePath = `images/${userId}/${tradeId}/${storageType}-${timestamp}-${randomString}-${safeFileName}`;
    
    // Tạo tham chiếu đến vị trí lưu trữ
    const storageRef = ref(storage, storagePath);
    
    // Tạo metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        userId,
        tradeId,
        imageType: storageType,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Tải lên với tiến trình
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    // Theo dõi tiến trình upload
    const urlPromise = new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', 
        // Progress observer
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (progress % 20 === 0 || progress === 100) { // Log only at 0%, 20%, 40%, 60%, 80%, 100%
            debug(`Upload progress: ${progress}%`);
          }
          
          if (progressCallback) progressCallback(progress);
        },
        // Error observer
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        // Completion observer
        async () => {
          // Lấy download URL khi tải lên hoàn tất
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            debug('File uploaded successfully');
            
            resolve(downloadURL);
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            reject(urlError);
          }
        }
      );
    });
    
    // Chờ URL từ promise
    const imageUrl = await urlPromise;
    
    // Đảm bảo tiến trình hoàn thành là 100%
    if (progressCallback) progressCallback(100);
    
    return {
      success: true,
      imageUrl,
      // Lưu thêm thông tin về đường dẫn Storage để xóa sau này
      storagePath
    } as any;
  } catch (error) {
    console.error("Lỗi tải ảnh lên:", error);
    
    // Đặt tiến trình về 0 để thể hiện lỗi
    if (progressCallback) progressCallback(0);
    
    // Tái định dạng thông báo lỗi để UI dễ hiểu
    let errorMessage = "Không thể tải ảnh lên";
    
    if (error instanceof Error) {
      if (error.message.includes("unauthorized") || error.message.includes("permission-denied")) {
        errorMessage = "Không có quyền tải lên. Vui lòng đăng nhập lại.";
      } else if (error.message.includes("network")) {
        errorMessage = "Lỗi kết nối mạng. Vui lòng thử lại sau.";
      } else {
        errorMessage = error.message;
      }
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Delete a trade image directly from Firebase Storage
 * 
 * @param userId - User ID
 * @param tradeId - Trade ID
 * @param fileOrType - Can be:
 *   1. Storage path (preferred: images/{userId}/{tradeId}/...)
 *   2. Full URL of the image (Firebase Storage URL)
 *   3. storagePath from upload result
 * @returns Promise with result as boolean
 */
export async function deleteTradeImage(
  userId: string,
  tradeId: string,
  fileOrType: string
): Promise<boolean> {
  debug(`API Service: Xóa ảnh cho ${fileOrType.substring(0, 30)}...`);
  
  // Khởi tạo Firebase
  const { storage } = initFirebase();
  
  // Xác định đường dẫn tới file trong Storage
  let storagePath: string | null = null;
  
  // Nếu là đường dẫn đầy đủ trong Storage (images/userId/tradeId/...)
  if (fileOrType.startsWith('images/') || fileOrType.startsWith('trades/') || fileOrType.startsWith('charts/')) {
    storagePath = fileOrType;
    debug(`Đã nhận dạng được Firebase Storage path`);
  }
  // Nếu là URL Firebase Storage
  else if (fileOrType.includes('firebasestorage.googleapis.com')) {
    try {
      // Phân tích URL để tìm path
      const urlObj = new URL(fileOrType);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
      
      if (pathMatch && pathMatch[1]) {
        // URL-decode đường dẫn vì trong URL nó được encode
        storagePath = decodeURIComponent(pathMatch[1]);
        debug(`Đã trích xuất path từ URL Firebase`);
      } else {
        throw new Error('Không thể trích xuất đường dẫn từ URL');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích URL Firebase Storage:', error);
      return false;
    }
  }
  // Nếu là URL không được hỗ trợ (legacy)
  else if (fileOrType.includes('cloudinary.com')) {
    debug(`URL Cloudinary không được hỗ trợ, không thể thực hiện xóa`);
    return false;
  }
  // Nếu là local file path (legacy)
  else if (fileOrType.startsWith('/uploads/')) {
    debug(`Local uploads không còn được hỗ trợ, không thể xóa`);
    return false;
  }
  // Nếu là loại ảnh từ UI, không có đủ thông tin để xóa
  else if (fileOrType in IMAGE_TYPE_MAP) {
    debug(`Loại ảnh UI không đủ thông tin để xóa, cần đường dẫn đầy đủ`);
    return false;
  }
  
  if (!storagePath) {
    console.warn(`Không có đủ thông tin để xác định vị trí file trong Storage`);
    return false;
  }
  
  try {
    debug(`Bắt đầu xóa ảnh từ Firebase Storage`);
    
    // Tạo reference đến file trong Storage
    const fileRef = ref(storage, storagePath);
    
    // Thực hiện xóa file
    await deleteObject(fileRef);
    
    debug(`Xóa ảnh thành công`);
    
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh:`, error);
    
    // Ghi log chi tiết hơn về lỗi
    if (error instanceof Error) {
      // Nếu lỗi là object-not-found, đây có thể là điều bình thường và không nghiêm trọng
      if (error.message.includes('object-not-found')) {
        debug(`File không tồn tại, có thể đã bị xóa trước đó`);
        return true; // Trả về true vì mục tiêu là file không còn tồn tại
      }
    }
    
    // Không ném lỗi, trả về false để UI có thể xử lý một cách êm dịu
    return false;
  }
}