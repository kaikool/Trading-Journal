/**
 * TwelveData API proxy để tránh lộ API key
 */
import express, { Request, Response } from 'express';
import axios from 'axios';
import { rateLimit } from 'express-rate-limit';
import { log } from './vite';

// Cấu hình API client cho TwelveData
const twelveDataClient = axios.create({
  baseURL: 'https://api.twelvedata.com',
  timeout: 10000
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
    const apiKey = process.env.TWELVEDATA_API_KEY;
    if (!apiKey) {
      log('TwelveData API key not found in environment variables', 'error');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Chuẩn bị các tham số cho API call
    const params = {
      ...req.query, // Bao gồm các tham số gốc từ client
      apikey: apiKey // Thêm API key từ server
    };

    // Lấy đường dẫn endpoint từ URL gốc
    const endpoint = req.path.replace('/twelvedata/', '');
    
    log(`Proxying TwelveData API request: ${endpoint} for symbol ${symbol}`, 'api');
    
    // Gọi API TwelveData
    const response = await twelveDataClient.get(`/${endpoint}`, { params });
    
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