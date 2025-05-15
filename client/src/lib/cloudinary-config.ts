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

// Các hàm transformation đã chuyển sang server/cloudinary-service.ts

export default CLOUDINARY_CONFIG;