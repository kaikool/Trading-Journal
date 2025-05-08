/**
 * TwelveData API proxy để tránh lộ API key
 */
import express, { Request, Response } from 'express';
import axios from 'axios';
import { rateLimit } from 'express-rate-limit';
import { log } from './vite';

// Cấu hình API client cho TwelveData
// Theo tài liệu: https://support.twelvedata.com/en/articles/5609168-introduction-to-twelve-data
const twelveDataClient = axios.create({
  baseURL: 'https://api.twelvedata.com',
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

// Rate limiting để tránh vượt quá giới hạn API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 50, // Giới hạn 50 request mỗi IP trong khoảng thời gian
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Hàm proxy API
async function proxyTwelveDataRequest(req: Request, res: Response) {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    // Đảm bảo rằng API key được cung cấp
    // Kiểm tra header X-API-KEY trước (từ client settings)
    let apiKey = req.headers['x-api-key'] as string;
    
    // Nếu không có API key trong header, sử dụng API key từ môi trường
    if (!apiKey) {
      // Thử lấy từ Firebase Functions config (2-part key format)
      let envApiKey = process.env.FIREBASE_CONFIG 
        ? JSON.parse(process.env.FIREBASE_CONFIG).twelvedata?.apikey 
        : null;
      
      // Nếu không tìm thấy trong Firebase config, thử biến môi trường thông thường
      if (!envApiKey) {
        envApiKey = process.env.TWELVEDATA_API_KEY;
      }
      
      if (!envApiKey) {
        log('TwelveData API key not found in request or environment variables', 'error');
        return res.status(500).json({ error: 'API key not configured' });
      }
      apiKey = envApiKey;
    }

    // Chuẩn bị các tham số cho API call theo hướng dẫn TwelveData
    // Theo tài liệu: https://support.twelvedata.com/en/articles/5609168-introduction-to-twelve-data
    const params = {
      ...req.query, // Bao gồm các tham số gốc từ client
      apikey: apiKey, // Thêm API key từ server - lưu ý dùng apikey (lowercase) theo tài liệu
      dp: 4 // Độ chính xác mặc định 4 chữ số thập phân cho giá Forex
    };

    // Xây dựng đường dẫn endpoint đúng với API TwelveData
    // Đảm bảo loại bỏ tiền tố '/twelvedata/' và đường dẫn bắt đầu bằng '/'
    const endpoint = req.path.replace('/api/twelvedata/', '');
    
    log(`Proxying TwelveData API request: ${endpoint} for symbol ${symbol}`, 'api');
    
    // Gọi API TwelveData - đảm bảo rằng endpoint không bắt đầu bằng '/' vì baseURL đã có
    const response = await twelveDataClient.get(endpoint, { params });
    
    // Trả về dữ liệu cho client
    return res.json(response.data);
    
  } catch (error) {
    log('Error proxying TwelveData API request', 'error');
    
    if (axios.isAxiosError(error) && error.response) {
      // Trả về lỗi từ TwelveData API
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Lỗi khác
    return res.status(500).json({ 
      error: 'Error connecting to TwelveData API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Đăng ký các routes cho API TwelveData
export function registerTwelveDataRoutes(app: express.Express) {
  // Áp dụng rate limiting cho tất cả các routes TwelveData
  app.use('/api/twelvedata', apiLimiter);
  
  // Route cho endpoint price
  app.get('/api/twelvedata/price', proxyTwelveDataRequest);
  
  // Route cho endpoint time_series
  app.get('/api/twelvedata/time_series', proxyTwelveDataRequest);
  
  log('TwelveData API routes registered', 'startup');
}