/**
 * Cấu hình tập trung cho tích hợp Cloudinary
 * 
 * File này chứa tất cả thông tin cấu hình cho Cloudinary để đảm bảo
 * thông tin cấu hình được tập trung và nhất quán trên toàn ứng dụng
 */

// Cấu hình cơ bản cho Cloudinary 
export const CLOUDINARY_CONFIG = {
  // Thông tin tài khoản Cloudinary
  cloud_name: 'dxi9ensjq',
  upload_preset: 'trading_journal_uploads', // Preset đã được cấu hình cho unsigned uploads
  
  // API URLs
  upload_url: 'https://api.cloudinary.com/v1_1/dxi9ensjq/image/upload',
  
  // Cấu trúc thư mục 
  folders: {
    trades: (userId: string, tradeId: string) => `trades/${userId}/${tradeId}`,
    profile: (userId: string) => `profiles/${userId}`,
    chart_templates: (userId: string) => `charts/${userId}`,
  },
  
  // Các transformation mặc định
  transformations: {
    // Không bo tròn góc - tránh thừa vùng đen
    no_corner_radius: 'c_limit,r_0',
    
    // Các preset chuẩn
    thumbnail: 'c_thumb,w_200,h_200,q_auto,f_auto,r_0',
    medium: 'c_limit,w_600,h_600,q_auto,f_auto,r_0',
    large: 'c_limit,w_1200,h_1200,q_auto,f_auto,r_0',
    
    // Preset cho ảnh giao dịch 
    chart: 'c_limit,w_1600,q_auto,f_auto,r_0',
    
    // Preset cho ảnh trong danh sách
    list_item: 'c_scale,w_300,q_auto,f_auto,r_0',
  }
};

/**
 * Tạo URL cho transformation Cloudinary
 * 
 * @param originalUrl URL gốc của ảnh Cloudinary
 * @param transformationType Tên transformation từ CLOUDINARY_CONFIG.transformations
 * @returns URL đã được biến đổi
 */
export function getTransformedUrl(
  originalUrl: string, 
  transformationType: keyof typeof CLOUDINARY_CONFIG.transformations
): string {
  // Kiểm tra xem URL có phải là URL Cloudinary hợp lệ không
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }
  
  const transformation = CLOUDINARY_CONFIG.transformations[transformationType];
  if (!transformation) {
    console.warn(`Transformation không hợp lệ: ${transformationType}`);
    return originalUrl;
  }
  
  // Phân tích URL Cloudinary
  const parts = originalUrl.split('/upload/');
  if (parts.length !== 2) {
    return originalUrl;
  }
  
  // Tạo URL mới với transformation
  return `${parts[0]}/upload/${transformation}/${parts[1]}`;
}

/**
 * Lấy public ID từ URL Cloudinary
 * 
 * @param url URL Cloudinary
 * @returns Public ID hoặc null nếu không phải URL Cloudinary
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  // URL Cloudinary có dạng: https://res.cloudinary.com/cloud-name/image/upload/[transformations]/public-id
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return null;
  }

  // Phần sau upload/ có thể có transformations, nên cần tách từ sau dấu /
  let parts = urlParts[1].split('/');
  // Phần cuối cùng chứa public_id
  const publicIdWithExtension = parts[parts.length - 1];
  
  // Loại bỏ extension nếu có
  const dotIndex = publicIdWithExtension.lastIndexOf('.');
  const publicId = dotIndex > 0 
    ? publicIdWithExtension.substring(0, dotIndex) 
    : publicIdWithExtension;
  
  return publicId;
}

export default CLOUDINARY_CONFIG;