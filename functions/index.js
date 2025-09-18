
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "asia-southeast1" });

const CAPTURE_SERVICE_URL = "https://tradingviewcapture-721483185057.asia-southeast1.run.app";
const INTER_CALL_DELAY_MS = 3000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureChart(ticker, timeframe) {
  const apiUrl = new URL(`${CAPTURE_SERVICE_URL}/capture`);
  apiUrl.searchParams.append("ticker", ticker);
  apiUrl.searchParams.append("tf", timeframe);
  
  console.log(`Đang gọi service chụp ảnh: ${apiUrl.toString()}`);

  try {
    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lỗi từ service chụp ảnh (status ${response.status}) cho ${timeframe}:`, errorText);
      return null;
    }
    const data = await response.json();
    if (data.ok && data.url) {
      console.log(`Chụp ảnh ${timeframe} thành công!`);
      return data.url;
    }
    console.error(`Service chụp ảnh không trả về URL cho ${timeframe}.`, data);
    return null;
  } catch (error) {
    console.error(`Lỗi mạng khi gọi service chụp ảnh cho ${timeframe}:`, error);
    return null;
  }
}

exports.autoCaptureTradeChart = onDocumentWritten("users/{userId}/trades/{tradeId}", async (event) => {
    const { userId, tradeId } = event.params;
    
    // Dữ liệu null nếu là event create/delete
    const beforeData = event.data.before ? event.data.before.data() : null;
    // Dữ liệu null nếu là event delete
    const afterData = event.data.after ? event.data.after.data() : null;

    // Thoát sớm nếu trade bị xóa
    if (!afterData) {
        console.log(`Trade [${tradeId}] đã bị xóa. Bỏ qua.`);
        return null;
    }

    // --- LOGIC ĐÃ SỬA: CHỈ CHẠY KHI CÓ YÊU CẦU CHỤP ẢNH ---
    // Điều kiện này sẽ bắt cả lệnh TẠO MỚI và ĐÓNG LỆNH, miễn là frontend đã set captureStatus: 'pending'.
    if (afterData.captureStatus === 'pending' && beforeData?.captureStatus !== 'pending') {
        console.log(`[${tradeId}] Yêu cầu chụp ảnh được kích hoạt (captureStatus: pending).`);
        const ticker = afterData.pair;
        const updates = {};
        
        try {
            // Trường hợp 1: Chụp ảnh VÀO LỆNH (trade mới hoặc chưa có ảnh vào)
            if (!afterData.entryImage) {
                console.log(`[${tradeId}] Chụp ảnh VÀO LỆNH...`);
                const entryUrlH4 = await captureChart(ticker, "H4");
                await delay(INTER_CALL_DELAY_MS);
                const entryUrlM15 = await captureChart(ticker, "M15");

                if (entryUrlH4) updates.entryImage = entryUrlH4;
                if (entryUrlM15) updates.entryImageM15 = entryUrlM15;
            } 
            // Trường hợp 2: Chụp ảnh ĐÓNG LỆNH (trade đã có ảnh vào)
            else if (!afterData.exitImage) {
                console.log(`[${tradeId}] Chụp ảnh ĐÓNG LỆNH...`);
                const exitUrlH4 = await captureChart(ticker, "H4");
                await delay(INTER_CALL_DELAY_MS);
                const exitUrlM15 = await captureChart(ticker, "M15");

                if (exitUrlH4) updates.exitImage = exitUrlH4;
                if (exitUrlM15) updates.exitImageM15 = exitUrlM15;
            } else {
                 console.log(`[${tradeId}] Đã có đủ ảnh vào và đóng lệnh, không cần chụp lại.`);
            }

            // Đánh dấu đã hoàn thành dù có chụp được ảnh hay không
            updates.captureStatus = 'completed';
            console.log(`[${tradeId}] Quá trình xử lý ảnh hoàn tất. Đang cập nhật Firestore...`);
            return db.collection("users").doc(userId).collection("trades").doc(tradeId).update(updates);

        } catch (error) {
            console.error(`[${tradeId}] Quá trình chụp ảnh thất bại:`, error);
            // Đánh dấu thất bại để có thể debug
            return db.collection("users").doc(userId).collection("trades").doc(tradeId).update({
                captureStatus: 'failed',
                captureError: error.message
            });
        }
    }
    
    // Không làm gì nếu không có sự thay đổi captureStatus sang 'pending'
    return null;
});
