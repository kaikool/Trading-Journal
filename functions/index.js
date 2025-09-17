
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Khởi tạo Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Đặt khu vực cho tất cả các functions (quan trọng cho v2)
// Hãy đảm bảo nó cùng khu vực với Cloud Run service của bạn
setGlobalOptions({ region: "asia-southeast1" });

// =================================================================
const CAPTURE_SERVICE_URL = "https://tradingviewcapture-721483185057.asia-southeast1.run.app";
const INTER_CALL_DELAY_MS = 3000; // 3 giây
// =================================================================

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

/**
 * Cloud Function (v2) được kích hoạt mỗi khi một document trong collection 'trades'
 * được tạo hoặc cập nhật.
 */
exports.autoCaptureTradeChart = onDocumentWritten("trades/{tradeId}", async (event) => {
    const tradeId = event.params.tradeId;

    // Trong v2, dữ liệu nằm trong event.data
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Kịch bản 1: Trade vừa được TẠO MỚI
    if (!beforeData && afterData) {
        console.log(`Trade mới [${tradeId}] được tạo. Bắt đầu quy trình chụp ảnh vào lệnh...`);
        const ticker = afterData.pair;
        
        console.log(`Bước 1: Chụp ảnh H4...`);
        const entryUrlH4 = await captureChart(ticker, "H4");
        
        console.log(`Bước 2: Chờ ${INTER_CALL_DELAY_MS / 1000} giây...`);
        await delay(INTER_CALL_DELAY_MS);
        
        console.log(`Bước 3: Chụp ảnh M15...`);
        const entryUrlM15 = await captureChart(ticker, "M15");

        const updates = {};
        if (entryUrlH4) updates.entryImage = entryUrlH4;
        if (entryUrlM15) updates.entryImageM15 = entryUrlM15;
        
        if (Object.keys(updates).length > 0) {
            console.log(`Đang cập nhật URL ảnh vào lệnh cho trade [${tradeId}]...`);
            return db.collection("trades").doc(tradeId).update(updates);
        }
    }

    // Kịch bản 2: Trade vừa được CẬP NHẬT (ví dụ: đóng lệnh)
    if (beforeData && afterData) {
        if (beforeData.status !== "CLOSED" && afterData.status === "CLOSED") {
            console.log(`Trade [${tradeId}] vừa đóng. Bắt đầu quy trình chụp ảnh đóng lệnh...`);
            const ticker = afterData.pair;

            console.log(`Bước 1: Chụp ảnh H4...`);
            const exitUrlH4 = await captureChart(ticker, "H4");

            console.log(`Bước 2: Chờ ${INTER_CALL_DELAY_MS / 1000} giây...`);
            await delay(INTER_CALL_DELAY_MS);

            console.log(`Bước 3: Chụp ảnh M15...`);
            const exitUrlM15 = await captureChart(ticker, "M15");

            const updates = {};
            if (exitUrlH4) updates.exitImage = exitUrlH4;
            if (exitUrlM15) updates.exitImageM15 = exitUrlM15;

            if (Object.keys(updates).length > 0) {
                console.log(`Đang cập nhật URL ảnh đóng lệnh cho trade [${tradeId}]...`);
                return db.collection("trades").doc(tradeId).update(updates);
            }
        }
    }

    return null;
});
