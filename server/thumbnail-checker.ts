import axios from 'axios';
import { log } from './vite';


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
    await axios.head(url, {
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



