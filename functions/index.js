
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

/**
 * SỬA LỖI: Lắng nghe đúng đường dẫn của sub-collection.
 * Đường dẫn này khớp với: collection(db, "users", userId, "trades") trong code frontend.
 */
exports.autoCaptureTradeChart = onDocumentWritten("users/{userId}/trades/{tradeId}", async (event) => {
    const { userId, tradeId } = event.params;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Kịch bản 1: Trade vừa được TẠO MỚI
    if (!beforeData && afterData) {
        console.log(`Trade mới [${tradeId}] của user [${userId}] được tạo. Bắt đầu chụp ảnh...`);
        const ticker = afterData.pair;
        
        const entryUrlH4 = await captureChart(ticker, "H4");
        await delay(INTER_CALL_DELAY_MS);
        const entryUrlM15 = await captureChart(ticker, "M15");

        const updates = {};
        if (entryUrlH4) updates.entryImage = entryUrlH4;
        if (entryUrlM15) updates.entryImageM15 = entryUrlM15;
        
        if (Object.keys(updates).length > 0) {
            console.log(`Đang cập nhật URL ảnh vào lệnh cho trade [${tradeId}]...`);
            return db.collection("users").doc(userId).collection("trades").doc(tradeId).update(updates);
        }
    }

    // Kịch bản 2: Trade vừa được CẬP NHẬT (đóng lệnh)
    if (beforeData && afterData) {
        if (beforeData.status !== "CLOSED" && afterData.status === "CLOSED") {
            console.log(`Trade [${tradeId}] của user [${userId}] vừa đóng. Bắt đầu chụp ảnh...`);
            const ticker = afterData.pair;

            const exitUrlH4 = await captureChart(ticker, "H4");
            await delay(INTER_CALL_DELAY_MS);
            const exitUrlM15 = await captureChart(ticker, "M15");

            const updates = {};
            if (exitUrlH4) updates.exitImage = exitUrlH4;
            if (exitUrlM15) updates.exitImageM15 = exitUrlM15;

            if (Object.keys(updates).length > 0) {
                console.log(`Đang cập nhật URL ảnh đóng lệnh cho trade [${tradeId}]...`);
                return db.collection("users").doc(userId).collection("trades").doc(tradeId).update(updates);
            }
        }
    }

    return null;
});
