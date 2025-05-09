/**
 * API Service for image upload and management
 * 
 * This service handles image uploads and deletions through Cloudinary using our server API.
 * It maintains backward compatibility for older Firebase Storage images still in use.
 */

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
 * Upload an image for a trade through the server API (Cloudinary)
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
): Promise<{ success: boolean; imageUrl: string; publicId?: string }> {
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
  
  try {
    // Cập nhật tiến trình ban đầu
    if (progressCallback) progressCallback(5);
    
    // Tạo form data để gửi lên server
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);
    formData.append('tradeId', tradeId);
    formData.append('imageType', storageType);
    formData.append('context', 'trade'); // Xác định context cho API thống nhất
    
    // Simulate progress since we can't track it directly through fetch
    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 5;
    
    if (progressCallback) {
      progressInterval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress >= 90) {
          clearInterval(progressInterval!);
          progressInterval = null;
        }
        progressCallback(currentProgress);
      }, 200);
    }
    
    // Gửi API request đến endpoint thống nhất mới
    debug('Gửi request tải lên ảnh đến endpoint /api/images/upload');
    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
      // No need to set Content-Type header, browser will do that with correct boundary for FormData
    });
    
    // Clear progress interval if it exists
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      debug(`Upload failed with status ${response.status}: ${errorText}`);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Đảm bảo tiến trình hoàn thành là 100%
    if (progressCallback) progressCallback(100);
    
    debug('Ảnh đã được tải lên thành công: ' + data.imageUrl);
    
    return {
      success: true, 
      imageUrl: data.imageUrl,
      publicId: data.publicId || undefined
    };
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
 * Delete a trade image through the server API
 * 
 * @param userId - User ID
 * @param tradeId - Trade ID
 * @param imageData - Can be:
 *   1. Full URL of the image (Cloudinary URL or Firebase URL)
 *   2. Public ID of the Cloudinary image
 * @returns Promise with result as boolean
 */
export async function deleteTradeImage(
  userId: string,
  tradeId: string,
  imageData: string
): Promise<boolean> {
  debug(`API Service: Xóa ảnh cho ${imageData.substring(0, 30)}...`);
  
  try {
    let url = null;
    let publicId = null;
    
    // Xác định loại dữ liệu được truyền vào
    if (imageData.startsWith('http') || imageData.startsWith('https')) {
      url = imageData;
      
      debug('Đã nhận diện URL, sẽ xóa ảnh qua API');
      
      // Xác định loại URL
      if (imageData.includes('cloudinary.com')) {
        debug('URL Cloudinary được phát hiện');
      } else if (imageData.includes('firebasestorage.googleapis.com')) {
        debug('URL Firebase Storage được phát hiện (hỗ trợ ngược)');
      } else {
        debug('URL không được hỗ trợ');
        return false;
      }
    } 
    // Nếu đây là public ID của Cloudinary
    else if (!imageData.startsWith('http') && !imageData.includes('/')) {
      publicId = imageData;
      debug('Đã nhận diện Public ID Cloudinary');
    }
    // Nếu không xác định được loại
    else {
      debug('Không thể xác định loại dữ liệu ảnh, không thể xóa');
      return false;
    }
    
    // Tạo query params
    const params = new URLSearchParams();
    if (url) params.append('url', url);
    if (publicId) params.append('publicId', publicId);
    
    // Gọi API để xóa ảnh
    debug('Gửi request xóa ảnh đến server');
    
    const response = await fetch(`/api/images/delete?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      debug(`Xóa ảnh thất bại: ${response.status} - ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    
    debug(`Kết quả xóa ảnh: ${result.success ? 'Thành công' : 'Thất bại'}`);
    
    return result.success;
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh:`, error);
    
    // Ghi log chi tiết hơn về lỗi
    if (error instanceof Error) {
      debug(`Lỗi xóa ảnh: ${error.message}`);
    }
    
    // Không ném lỗi, trả về false để UI có thể xử lý một cách êm dịu
    return false;
  }
}