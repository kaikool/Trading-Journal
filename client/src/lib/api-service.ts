/**
 * API Service for image capture and management
 *
 * Cloudinary đã bị loại bỏ hoàn toàn.
 * File này chỉ còn tích hợp API Capture TradingView để lấy ảnh chart theo timeframe.
 */

import { debug } from "./debug";
import { requestCaptureWithRetry } from "./capture";

/* =========================
   GIỮ MAP CŨ (để không vỡ log/enum)
   ========================= */
const IMAGE_TYPE_MAP = {
  h4chart: "entry-h4",
  m15chart: "entry-m15",
  h4exit: "exit-h4",
  m15exit: "exit-m15",
} as const;

type UiImageType = keyof typeof IMAGE_TYPE_MAP;
type StorageImageType = (typeof IMAGE_TYPE_MAP)[UiImageType];

/* =========================
   GIỮ CHỮ KÝ CŨ (Upload/Delete) — vô hiệu hoá
   ========================= */

/**
 * Upload ảnh trade — ĐÃ TẮT (Cloudinary removed).
 * Vẫn giữ chữ ký để caller không lỗi runtime, nhưng trả về lỗi rõ ràng.
 */
export async function uploadTradeImage(
  userId: string,
  tradeId: string,
  file: File,
  imageType: string,
  progressCallback?: (progress: number) => void,
): Promise<{ success: boolean; imageUrl: string; publicId?: string }> {
  debug(
    `API Service: uploadTradeImage(type=${imageType}) — Cloudinary removed`,
  );

  if (!file) {
    throw new Error("Không có file để tải lên");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error(
      `Kích thước file vượt quá giới hạn 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );
  }

  const storageType = (IMAGE_TYPE_MAP[imageType as UiImageType] ||
    "entry-h4") as StorageImageType;
  debug(
    `Đã chuyển đổi từ UI type "${imageType}" sang storage type "${storageType}"`,
  );

  if (progressCallback) progressCallback(0);
  throw new Error("Upload ảnh thủ công đã bị tắt (đang dùng API capture).");
}

/**
 * Xoá ảnh trade — ĐÃ TẮT (Cloudinary removed).
 * Trả về false để UI xử lý êm.
 */
export async function deleteTradeImage(
  userId: string,
  tradeId: string,
  imageData: string,
): Promise<boolean> {
  debug(
    `API Service: deleteTradeImage(${imageData?.slice(0, 30)}) — Cloudinary removed`,
  );
  return false;
}

/* =========================
   HÀM CHÍNH: CAPTURE TIMEFRAMES
   ========================= */

/**
 * Capture ảnh H4 & M15 qua API mới.
 * - Gọi TUẦN TỰ để tránh đụng giới hạn session/lượt.
 * - Có retry + delay built-in (xử lý trong capture.ts).
 * - Trả về object chứa url (nếu có). Caller (firebase.ts) sẽ update Firestore hậu kỳ.
 *
 * @param pair Ví dụ: "XAUUSD" hoặc "OANDA:XAUUSD"
 * @returns { entryH4?: string; entryM15?: string }
 */
export async function captureTradeImages(
  pair: string,
): Promise<{ entryH4?: string; entryM15?: string }> {
  const h4 = await requestCaptureWithRetry("H4", pair);
  const m15 = await requestCaptureWithRetry("M15", pair);

  const result: { entryH4?: string; entryM15?: string } = {};
  if (h4.ok && h4.url) result.entryH4 = h4.url;
  if (m15.ok && m15.url) result.entryM15 = m15.url;

  if (!result.entryH4 && !result.entryM15) {
    throw new Error(h4.error || m15.error || "Capture failed");
  }

  return result;
}
