/**
 * TradingView Chart Capture Service
 * 
 * Sử dụng Puppeteer và browserless API để tự động lấy ảnh từ TradingView
 * Hỗ trợ các timeframe H4 và M15 cho currency pairs
 * 
 * Updated: Bổ sung hệ thống logging chi tiết để debug
 */

import puppeteer from 'puppeteer-core';
import { promises as fs } from 'fs';
import path from 'path';

// Browserless API configuration
const BROWSERLESS_TOKEN = '2SNFWNm3X1hjs1m0c442cdb7b81440b4c7068211b7b3956a5';
const BROWSERLESS_ENDPOINT = `https://chrome.browserless.io`;

// Debug configuration
const DEBUG_MODE = true; // Force debug mode untuk debugging
const ORIGINAL_DEBUG_MODE = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
const LOG_TO_FILE = process.env.LOG_TRADINGVIEW === 'true';
const LOG_DIR = path.join(process.cwd(), 'logs');

// Logging utility
class CaptureLogger {
  private logEntries: string[] = [];
  private startTime: number = Date.now();

  constructor(private sessionId: string, private pair: string, private timeframe: string) {
    this.log('🚀 SESSION_START', `Bắt đầu session chụp ảnh ${pair} ${timeframe}`);
  }

  log(step: string, message: string, isError: boolean = false) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const prefix = isError ? '❌' : '📋';
    
    const logMessage = `[${timestamp}] [+${elapsed}ms] ${prefix} ${step}: ${message}`;
    this.logEntries.push(logMessage);

    // Console logging based on debug mode
    if (DEBUG_MODE || isError) {
      if (isError) {
        console.error(logMessage);
      } else {
        console.log(logMessage);
      }
    }
  }

  error(step: string, error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log(step, errorMessage, true);
  }

  async saveToFile() {
    if (!LOG_TO_FILE) return;

    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
      const filename = `tradingview-capture-${this.sessionId}.log`;
      const filepath = path.join(LOG_DIR, filename);
      
      const content = [
        `=== TradingView Capture Log ===`,
        `Session: ${this.sessionId}`,
        `Pair: ${this.pair}`,
        `Timeframe: ${this.timeframe}`,
        `Start Time: ${new Date(this.startTime).toISOString()}`,
        `Total Duration: ${Date.now() - this.startTime}ms`,
        ``,
        ...this.logEntries,
        ``,
        `=== End of Log ===`
      ].join('\n');

      await fs.writeFile(filepath, content, 'utf8');
      this.log('📄 LOG_SAVED', `Log file saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save log file:', error);
    }
  }

  getLogSummary() {
    return {
      sessionId: this.sessionId,
      pair: this.pair,
      timeframe: this.timeframe,
      duration: Date.now() - this.startTime,
      totalSteps: this.logEntries.length,
      logs: this.logEntries
    };
  }
}

interface CaptureOptions {
  pair: string;
  timeframe: 'H4' | 'M15';
  width?: number;
  height?: number;
}

interface CaptureResult {
  success: boolean;
  imageBuffer?: Buffer;
  error?: string;
  logSummary?: {
    sessionId: string;
    pair: string;
    timeframe: string;
    duration: number;
    totalSteps: number;
    logs: string[];
  };
}

/**
 * Tạo URL TradingView cho cặp tiền và timeframe cụ thể
 */
function buildTradingViewUrl(pair: string, timeframe: string, logger: CaptureLogger): string {
  logger.log('🔧 URL_BUILD_START', `Bắt đầu tạo URL cho ${pair} ${timeframe}`);
  
  // Chuyển đổi format pair từ EURUSD thành EURUSD
  const formattedPair = pair.replace('/', '').toUpperCase();
  logger.log('📝 PAIR_FORMAT', `Cặp tiền được format: ${pair} -> ${formattedPair}`);
  
  // Mapping timeframe để tương thích với TradingView
  const timeframeMap: Record<string, string> = {
    'H4': '240',  // 4 hours = 240 minutes
    'M15': '15'   // 15 minutes
  };
  
  const tvTimeframe = timeframeMap[timeframe] || '240';
  logger.log('⏰ TIMEFRAME_MAP', `Timeframe mapping: ${timeframe} -> ${tvTimeframe} minutes`);
  
  // Construct TradingView URL với nền trắng và tự động căn giữa giá hiện tại
  const baseUrl = 'https://www.tradingview.com/chart/';
  const params = new URLSearchParams({
    symbol: `FX:${formattedPair}`,
    interval: tvTimeframe,
    theme: 'light', // Nền trắng
    style: '1', // Candlestick
    timezone: 'Etc/UTC',
    toolbar: '0', // Hide toolbar
    withdateranges: '0', // Hide date ranges
    hideideas: '1', // Hide ideas
    hidevolume: '1', // Hide volume
    studies_overrides: '{}',
    enabled_features: '[move_logo_to_main_pane]',
    disabled_features: '[header_symbol_search,header_resolutions,header_chart_type,header_settings,header_indicators,header_compare,header_undo_redo,header_screenshot,header_fullscreen_button,left_toolbar,timeframes_toolbar]',
    // Tự động căn giữa chart vào khu vực giá hiện tại
    'range': 'auto', // Tự động điều chỉnh phạm vi
    'time': Math.floor(Date.now() / 1000).toString(), // Thời gian hiện tại
    'hide_side_toolbar': '1' // Ẩn sidebar
  });
  
  const finalUrl = `${baseUrl}?${params.toString()}`;
  logger.log('🔗 URL_BUILD_COMPLETE', `URL được tạo thành công: ${finalUrl}`);
  
  return finalUrl;
}

/**
 * Chụp ảnh chart từ TradingView sử dụng Browserless REST API
 */
export async function captureTradingViewChart(options: CaptureOptions): Promise<CaptureResult> {
  const { pair, timeframe, width = 1600, height = 900 } = options;
  
  // Tạo session ID duy nhất để tracking
  const sessionId = `${pair}_${timeframe}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logger = new CaptureLogger(sessionId, pair, timeframe);
  
  try {
    console.log('🔥 DEBUG: New logging system started!', { sessionId, pair, timeframe });
    logger.log('📸 CAPTURE_START', `Khởi tạo capture với viewport ${width}x${height}`);
    
    // Bước 1: Tạo URL TradingView
    logger.log('🔧 URL_GENERATION', 'Bắt đầu tạo URL TradingView...');
    const url = buildTradingViewUrl(pair, timeframe, logger);
    console.log('🔥 DEBUG: URL created:', url);
    
    // Bước 2: Chuẩn bị request đến Browserless API
    logger.log('🌐 API_PREPARATION', 'Chuẩn bị request đến Browserless API...');
    const browserlessUrl = `https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_TOKEN}`;
    logger.log('🔑 API_ENDPOINT', `Endpoint: ${browserlessUrl.replace(BROWSERLESS_TOKEN, '***TOKEN***')}`);
    
    const requestPayload = {
      url: url,
      options: {
        type: 'png',
        fullPage: false,
        clip: {
          x: 50,         // Giảm thêm để lấy nhiều nội dung hơn
          y: 30,         // Giảm thêm để lấy nhiều nội dung hơn
          width: width - 100,  // Rộng hơn nữa
          height: height - 80  // Cao hơn nữa
        }
      },
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: 30000
      },
      viewport: {
        width: width,
        height: height
      }
    };
    
    logger.log('📋 REQUEST_PAYLOAD', `Payload: ${JSON.stringify(requestPayload, null, 2)}`);
    
    // Bước 3: Gửi request đến Browserless
    logger.log('🚀 API_REQUEST_START', 'Gửi request đến Browserless API...');
    const startRequestTime = Date.now();
    
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });
    
    const requestDuration = Date.now() - startRequestTime;
    logger.log('⏱️ API_REQUEST_COMPLETE', `Request hoàn thành sau ${requestDuration}ms`);
    
    // Bước 4: Kiểm tra response status
    logger.log('🔍 RESPONSE_CHECK', `Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      logger.error('❌ API_ERROR', `Browserless API error: ${response.status} ${response.statusText}`);
      
      // Thử đọc error body nếu có
      try {
        const errorBody = await response.text();
        logger.error('📄 ERROR_BODY', errorBody);
      } catch (e) {
        logger.error('📄 ERROR_BODY_READ_FAILED', 'Không thể đọc error response body');
      }
      
      throw new Error(`Browserless API error: ${response.status} ${response.statusText}`);
    }
    
    // Bước 5: Xử lý response data
    logger.log('📥 DATA_PROCESSING', 'Bắt đầu xử lý response data...');
    const startProcessTime = Date.now();
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const processTime = Date.now() - startProcessTime;
    
    logger.log('📊 BUFFER_INFO', `Buffer size: ${imageBuffer.length} bytes, xử lý trong ${processTime}ms`);
    
    // Bước 6: Validation
    if (imageBuffer.length === 0) {
      logger.error('❌ EMPTY_BUFFER', 'Image buffer rỗng');
      throw new Error('Received empty image buffer');
    }
    
    if (imageBuffer.length < 1000) {
      logger.error('❌ SUSPICIOUSLY_SMALL', `Image buffer quá nhỏ: ${imageBuffer.length} bytes`);
    }
    
    // Bước 7: Lưu log file nếu được bật
    await logger.saveToFile();
    
    logger.log('✅ CAPTURE_SUCCESS', `Chụp ảnh thành công! Total duration: ${Date.now() - logger['startTime']}ms`);
    
    return {
      success: true,
      imageBuffer,
      logSummary: logger.getLogSummary()
    };
    
  } catch (error) {
    logger.error('❌ CAPTURE_FAILED', error);
    
    // Phân loại lỗi để debug dễ hơn
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        logger.error('🌐 NETWORK_ERROR', 'Lỗi kết nối mạng đến Browserless API');
      } else if (error.message.includes('timeout')) {
        logger.error('⏰ TIMEOUT_ERROR', 'Timeout khi chờ page load hoặc API response');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        logger.error('🔑 AUTH_ERROR', 'Lỗi xác thực Browserless API token');
      } else if (error.message.includes('429')) {
        logger.error('📊 RATE_LIMIT_ERROR', 'Đã vượt quá rate limit Browserless API');
      }
    }
    
    // Lưu log file cho debugging
    await logger.saveToFile();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logSummary: logger.getLogSummary()
    };
  }
}

/**
 * Chụp ảnh cả H4 và M15 cho một cặp tiền
 */
export async function captureAllTimeframes(pair: string): Promise<{
  h4: CaptureResult;
  m15: CaptureResult;
}> {
  // Tạo session ID chung cho batch capture
  const batchSessionId = `batch_${pair}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const batchLogger = new CaptureLogger(batchSessionId, pair, 'H4+M15');
  
  batchLogger.log('🎯 BATCH_START', `Bắt đầu chụp ảnh batch cho ${pair} - cả H4 và M15`);
  
  try {
    batchLogger.log('🚀 SEQUENTIAL_CAPTURE', 'Khởi tạo capture tuần tự H4 rồi M15 để tránh rate limit...');
    const startTime = Date.now();
    
    // Capture tuần tự để tránh rate limit
    batchLogger.log('🔄 H4_START', 'Bắt đầu capture H4...');
    const h4Result = await captureTradingViewChart({ pair, timeframe: 'H4' });
    
    batchLogger.log('🔄 M15_START', 'Bắt đầu capture M15...');
    const m15Result = await captureTradingViewChart({ pair, timeframe: 'M15' });
    
    const batchDuration = Date.now() - startTime;
    batchLogger.log('⏱️ BATCH_COMPLETE', `Batch capture hoàn thành sau ${batchDuration}ms`);
    
    // Kiểm tra kết quả H4 và M15
    const h4Final = h4Result;
    const m15Final = m15Result;
    
    // Log kết quả tổng hợp
    const successCount = (h4Final.success ? 1 : 0) + (m15Final.success ? 1 : 0);
    batchLogger.log('📊 BATCH_SUMMARY', `Kết quả: ${successCount}/2 thành công`);
    
    if (h4Final.success) {
      batchLogger.log('✅ H4_SUCCESS', 'H4 capture thành công');
    } else {
      batchLogger.error('❌ H4_FAILED', h4Final.error || 'H4 capture thất bại');
    }
    
    if (m15Final.success) {
      batchLogger.log('✅ M15_SUCCESS', 'M15 capture thành công');
    } else {
      batchLogger.error('❌ M15_FAILED', m15Final.error || 'M15 capture thất bại');
    }
    
    // Lưu batch log
    await batchLogger.saveToFile();
    
    return {
      h4: h4Final,
      m15: m15Final
    };
    
  } catch (error) {
    batchLogger.error('❌ BATCH_ERROR', error);
    await batchLogger.saveToFile();
    
    return {
      h4: { success: false, error: 'Batch capture failed' },
      m15: { success: false, error: 'Batch capture failed' }
    };
  }
}

/**
 * Utility function để tạo debug logs summary
 */
export function getDebugInfo() {
  return {
    debugMode: DEBUG_MODE,
    logToFile: LOG_TO_FILE,
    logDirectory: LOG_DIR,
    environment: process.env.NODE_ENV,
    configuration: {
      DEBUG: process.env.DEBUG,
      LOG_TRADINGVIEW: process.env.LOG_TRADINGVIEW,
      NODE_ENV: process.env.NODE_ENV
    }
  };
}