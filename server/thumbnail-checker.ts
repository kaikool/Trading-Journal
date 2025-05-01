import axios from 'axios';
import { log } from './vite';

/**
 * Tạo URL thumbnail từ URL gốc
 * 
 * @param originalUrl - URL gốc của ảnh
 * @param width - Chiều rộng của thumbnail (mặc định: 200) - không sử dụng
 * @param height - Chiều cao của thumbnail (mặc định: 200) - không sử dụng
 * @returns URL thumbnail đã được tạo
 */
export function getThumbnailUrl(
  originalUrl: string, 
  width: number = 200, 
  height: number = 200
): string {
  // Trả về URL gốc vì không còn hỗ trợ dịch vụ chuyển đổi hình ảnh
  log(`Trả về URL gốc cho thumbnail: ${originalUrl}`, 'thumbnail-checker');
  return originalUrl;
}

/**
 * Kiểm tra xem một URL thumbnail có thể truy cập được không
 * 
 * @param url - URL cần kiểm tra
 * @returns Promise<boolean> - true nếu URL có thể truy cập, false nếu không
 */
export async function checkThumbnail(url: string): Promise<boolean> {
  if (!url) {
    log('URL rỗng, không thể kiểm tra', 'thumbnail-checker');
    return false;
  }

  try {
    // Gửi yêu cầu HEAD đến URL để kiểm tra khả năng truy cập
    const response = await axios.head(url, {
      timeout: 5000, // Timeout 5 giây
      validateStatus: status => status === 200, // Chỉ chấp nhận status code 200
    });
    
    log(`Thumbnail có thể truy cập: ${url}`, 'thumbnail-checker');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 'không có phản hồi';
      log(`Thumbnail không thể truy cập (${statusCode}): ${url}`, 'thumbnail-checker');
    } else {
      log(`Lỗi khi kiểm tra thumbnail: ${error instanceof Error ? error.message : String(error)}`, 'thumbnail-checker');
    }
    return false;
  }
}

/**
 * Hàm kiểm tra đầy đủ - tạo thumbnail URL và kiểm tra khả năng truy cập
 * 
 * @param originalUrl - URL gốc của ảnh
 * @param width - Chiều rộng thumbnail (tùy chọn)
 * @param height - Chiều cao thumbnail (tùy chọn)
 * @returns Promise<{url: string, accessible: boolean}> - Kết quả kiểm tra
 */
export async function verifyThumbnail(
  originalUrl: string,
  width?: number,
  height?: number
): Promise<{url: string, accessible: boolean}> {
  const thumbnailUrl = getThumbnailUrl(originalUrl, width, height);
  const accessible = await checkThumbnail(thumbnailUrl);
  
  return {
    url: thumbnailUrl,
    accessible
  };
}

