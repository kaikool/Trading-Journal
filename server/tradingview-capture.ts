

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
  const formattedPair = pair.replace('/', '').toUpperCase();
  
  const timeframeMap: Record<string, string> = {
    'H4': '240',
    'M15': '15'
  };
  
  const tvTimeframe = timeframeMap[timeframe] || '240';
  
  const baseUrl = 'https://www.tradingview.com/chart/';
  const params = new URLSearchParams({
    symbol: `FX:${formattedPair}`,
    interval: tvTimeframe,
    theme: 'light',
    style: '1',
    timezone: 'Etc/UTC',
    toolbar: '0',
    withdateranges: '0',
    hideideas: '1',
    hidevolume: '1',
    studies_overrides: '{}',
    enabled_features: '[move_logo_to_main_pane]',
    disabled_features: '[header_symbol_search,header_resolutions,header_chart_type,header_settings,header_indicators,header_compare,header_undo_redo,header_screenshot,header_fullscreen_button,left_toolbar,timeframes_toolbar]',
    'range': 'auto',
    'time': Math.floor(Date.now() / 1000).toString(),
    'hide_side_toolbar': '1'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Chụp ảnh chart từ TradingView sử dụng Browserless REST API
 */
export async function captureTradingViewChart(options: CaptureOptions): Promise<CaptureResult> {
  const { pair, timeframe, width = 1600, height = 900 } = options;
  
  const sessionId = `${pair}_${timeframe}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logger = new CaptureLogger(sessionId, pair, timeframe);
  
  try {
    logger.log('📸 CAPTURE_START', `Khởi tạo capture với viewport ${width}x${height}`);
    
    const url = buildTradingViewUrl(pair, timeframe, logger);
    
    const browserlessUrl = `https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_TOKEN}`;
    
    const requestPayload = {
      url: url,
      options: {
        type: 'png',
        fullPage: false,
        quality: 100,
        clip: {
          x: 50,
          y: 30,
          width: width - 100,
          height: height - 80
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
    
    if (!response.ok) {
      logger.error('❌ API_ERROR', `Browserless API error: ${response.status} ${response.statusText}`);
      throw new Error(`Browserless API error: ${response.status} ${response.statusText}`);
    }
    
    const startProcessTime = Date.now();
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const processTime = Date.now() - startProcessTime;
    
    logger.log('📊 BUFFER_INFO', `Buffer size: ${imageBuffer.length} bytes, xử lý trong ${processTime}ms`);
    
    if (imageBuffer.length === 0) {
      logger.error('❌ EMPTY_BUFFER', 'Image buffer rỗng');
      throw new Error('Received empty image buffer');
    }
    
    if (imageBuffer.length < 1000) {
      logger.error('❌ SUSPICIOUSLY_SMALL', `Image buffer quá nhỏ: ${imageBuffer.length} bytes`);
    }
    
    await logger.saveToFile();
    logger.log('✅ CAPTURE_SUCCESS', `Chụp ảnh thành công! Total duration: ${Date.now() - logger['startTime']}ms`);
    
    return {
      success: true,
      imageBuffer,
      logSummary: logger.getLogSummary()
    };
    
  } catch (error) {
    logger.error('❌ CAPTURE_FAILED', error);
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
  
  try {
    const h4Result = await captureTradingViewChart({ pair, timeframe: 'H4' });
    const m15Result = await captureTradingViewChart({ pair, timeframe: 'M15' });
    
    const successCount = (h4Result.success ? 1 : 0) + (m15Result.success ? 1 : 0);
    batchLogger.log('📊 BATCH_SUMMARY', `Kết quả: ${successCount}/2 thành công`);
    
    await batchLogger.saveToFile();
    
    return {
      h4: h4Result,
      m15: m15Result
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