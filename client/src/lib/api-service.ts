/**
 * API Service for image upload and management
 * 
 * This service handles image uploads directly to Cloudinary API
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

// Cloudinary direct upload configuration
const CLOUDINARY_CONFIG = {
  cloud_name: 'dxi9ensjq',
  upload_preset: 'ml_default' // Preset name được cấu hình trong Cloudinary dashboard
};

// Cloudinary API URL cho unsigned upload (không yêu cầu chữ ký)
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;

// Type definitions to ensure type safety
type UiImageType = keyof typeof IMAGE_TYPE_MAP;
type StorageImageType = typeof IMAGE_TYPE_MAP[UiImageType];

/**
 * Upload an image for a trade directly to Cloudinary using unsigned upload
 * 
 * Sử dụng API Cloudinary trực tiếp với upload preset không cần chữ ký
 * 
 * @param userId - User ID (sử dụng làm một phần của folder path và tags)
 * @param tradeId - Trade ID (sử dụng làm một phần của folder path và tags)
 * @param file - File ảnh cần upload
 * @param imageType - Loại ảnh (h4chart, m15chart, h4exit, m15exit)
 * @param progressCallback - Callback để cập nhật tiến độ upload
 * @returns Promise với kết quả {success, imageUrl, publicId}
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
    
    debug('Tải lên trực tiếp đến Cloudinary...');
    
    // Xác định folder dựa vào context
    const folder = `trades/${userId}/${tradeId}`;
    
    // Tạo form data để gửi lên Cloudinary theo chuẩn unsigned upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset); // Upload preset cho phép unsigned upload
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name); // Tên cloud - quan trọng cho unsigned upload
    formData.append('folder', folder); // Folder trong Cloudinary để lưu trữ ảnh
    formData.append('tags', `user:${userId},trade:${tradeId},type:${storageType}`); // Tags để phân loại ảnh
    
    // Gửi request trực tiếp đến Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    
    // Clear progress interval if it exists
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      debug(`Upload failed: ${errorText}`);
      throw new Error(`Tải lên Cloudinary thất bại: ${response.statusText}`);
    }
    
    // Parse response from Cloudinary
    const cloudinaryData = await response.json();
    
    // Đảm bảo tiến trình hoàn thành là 100%
    if (progressCallback) progressCallback(100);
    
    debug('Tải lên Cloudinary thành công: ' + cloudinaryData.secure_url);
    
    return {
      success: true, 
      imageUrl: cloudinaryData.secure_url,
      publicId: cloudinaryData.public_id
    };
  } catch (error) {
    console.error("Lỗi tải ảnh lên Cloudinary:", error);
    
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
 * Trích xuất Public ID từ URL Cloudinary
 * 
 * @param url - URL Cloudinary của ảnh
 * @returns Public ID của ảnh hoặc null nếu không thể trích xuất
 */
function extractPublicIdFromCloudinaryUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // URL Cloudinary có dạng: https://res.cloudinary.com/cloud-name/image/upload/[transformations]/public-id
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) {
      return null;
    }

    // Phần sau upload/ có thể có transformations, nên cần tách từ sau dấu /
    let parts = urlParts[1].split('/');
    // Phần cuối cùng chứa public_id
    const publicIdWithExt = parts[parts.length - 1];
    
    // Loại bỏ phần extension để lấy public_id gốc
    const extIndex = publicIdWithExt.lastIndexOf('.');
    if (extIndex !== -1) {
      return publicIdWithExt.substring(0, extIndex);
    }

    return publicIdWithExt;
  } catch (e) {
    debug(`Lỗi khi trích xuất publicId từ URL: ${e}`);
    return null;
  }
}

/**
 * Delete a trade image directly from Cloudinary
 * 
 * @param userId - User ID
 * @param tradeId - Trade ID
 * @param imageData - Can be:
 *   1. Full URL of the image (Cloudinary URL)
 *   2. Public ID of the Cloudinary image
 * @returns Promise with result as boolean
 */
export async function deleteTradeImage(
  userId: string,
  tradeId: string,
  imageData: string
): Promise<boolean> {
  debug(`API Service: Xóa ảnh ${imageData.substring(0, 30)}...`);
  
  try {
    let publicId: string | null = null;
    
    // Xác định loại dữ liệu được truyền vào
    if (imageData.startsWith('http') || imageData.startsWith('https')) {
      // Là một URL
      if (imageData.includes('cloudinary.com')) {
        debug('URL Cloudinary được phát hiện, trích xuất public_id...');
        publicId = extractPublicIdFromCloudinaryUrl(imageData);
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
    
    if (!publicId) {
      debug('Không thể trích xuất public_id, không thể xóa ảnh');
      return false;
    }
    
    debug(`Đã xác định public_id: ${publicId}`);
    
    // Không thể xóa ảnh trực tiếp từ client vì cần phải ký chữ ký bảo mật
    // và chúng ta không muốn chia sẻ secret key với client. 
    // Vì vậy chúng ta vẫn phải gọi API server để xóa.
    
    // Tạo query params
    const params = new URLSearchParams();
    params.append('publicId', publicId);
    
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