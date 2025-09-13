/**
 * API Service for image upload and management
 *
 * Cloudinary đã bị loại bỏ hoàn toàn.
 * Giữ nguyên chữ ký hàm để tránh vỡ chỗ gọi, nhưng không còn thực hiện upload/xoá Cloudinary.
 */

import { debug } from './debug';
// ====== NEW: dùng API để chụp 2 timeframe và trả URL ======
import { requestCaptureWithRetry } from './capture';

/**
 * Mapping giữa UI image type và storage type (vẫn giữ để đồng bộ tên)
 */
const IMAGE_TYPE_MAP = {
  'h4chart': 'entry-h4',
  'm15chart': 'entry-m15',
  'h4exit': 'exit-h4',
  'm15exit': 'exit-m15'
} as const;

type UiImageType = keyof typeof IMAGE_TYPE_MAP;
type StorageImageType = typeof IMAGE_TYPE_MAP[UiImageType];

/**
 * Upload ảnh trade — ĐÃ TẮT (Cloudinary removed).
 * Vẫn giữ chữ ký để caller không lỗi runtime, nhưng trả về lỗi rõ ràng.
 */
export async function uploadTradeImage(
  userId: string,
  tradeId: string,
  file: File,
  imageType: string,
  progressCallback?: (progress: number) => void
): Promise<{ success: boolean; imageUrl: string; publicId?: string }> {
  debug(`API Service: uploadTradeImage(type=${imageType}) — Cloudinary removed`);

  if (!file) {
    throw new Error('Không có file để tải lên');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error(
      `Kích thước file vượt quá giới hạn 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  // Chuyển kiểu (để giữ logic cũ nếu nơi khác có log)
  const storageType = (IMAGE_TYPE_MAP[imageType as UiImageType] || 'entry-h4') as StorageImageType;
  debug(`Đã chuyển đổi từ UI type "${imageType}" sang storage type "${storageType}"`);

  // Tắt tiến trình (nếu UI có thanh progress)
  if (progressCallback) progressCallback(0);

  // THÔNG BÁO RÕ RÀNG: Upload đã bị vô hiệu hoá vì Cloudinary đã bỏ
  throw new Error('Upload ảnh đã bị tắt (Cloudinary removed).');
}

/**
 * Xoá ảnh trade — ĐÃ TẮT (Cloudinary removed).
 * Trả về false để UI xử lý êm.
 */
export async function deleteTradeImage(
  userId: string,
  tradeId: string,
  imageData: string
): Promise<boolean> {
  debug(`API Service: deleteTradeImage(${imageData?.slice(0, 30)}) — Cloudinary removed`);
  // Không ném lỗi để UI không crash; chỉ trả về false.
  return false;
}

/**
 * Capture ảnh H4 & M15 qua service riêng (giữ nguyên, không liên quan Cloudinary)
 */
export async function captureTradeImages(
  pair: string
): Promise<{ entryH4?: string; entryM15?: string }> {
  const h4 = await requestCaptureWithRetry('H4', pair);
  const m15 = await requestCaptureWithRetry('M15', pair);

  const result: { entryH4?: string; entryM15?: string } = {};
  if (h4.ok && h4.url) result.entryH4 = h4.url;
  if (m15.ok && m15.url) result.entryM15 = m15.url;

  if (!result.entryH4 && !result.entryM15) {
    throw new Error(h4.error || m15.error || 'Capture failed');
  }
  return result;
}
