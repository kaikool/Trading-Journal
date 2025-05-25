/**
 * TradingView Chart Capture Service
 * 
 * Sử dụng Puppeteer và browserless API để tự động lấy ảnh từ TradingView
 * Hỗ trợ các timeframe H4 và M15 cho currency pairs
 */

import puppeteer from 'puppeteer-core';

// Browserless API configuration
const BROWSERLESS_TOKEN = '2SNEoq2by4gxiCk0a5f541b86a7b35f16883c01d0e808ed67';
const BROWSERLESS_ENDPOINT = `https://chrome.browserless.io`;

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
}

/**
 * Tạo URL TradingView cho cặp tiền và timeframe cụ thể
 */
function buildTradingViewUrl(pair: string, timeframe: string): string {
  // Chuyển đổi format pair từ EURUSD thành EURUSD
  const formattedPair = pair.replace('/', '').toUpperCase();
  
  // Mapping timeframe để tương thích với TradingView
  const timeframeMap: Record<string, string> = {
    'H4': '240',  // 4 hours = 240 minutes
    'M15': '15'   // 15 minutes
  };
  
  const tvTimeframe = timeframeMap[timeframe] || '240';
  
  // Construct TradingView URL with minimal UI
  const baseUrl = 'https://www.tradingview.com/chart/';
  const params = new URLSearchParams({
    symbol: `FX:${formattedPair}`,
    interval: tvTimeframe,
    theme: 'dark',
    style: '1', // Candlestick
    timezone: 'Etc/UTC',
    toolbar: '0', // Hide toolbar
    withdateranges: '0', // Hide date ranges
    hideideas: '1', // Hide ideas
    hidevolume: '1', // Hide volume
    studies_overrides: '{}',
    enabled_features: '[]',
    disabled_features: '[header_symbol_search,header_resolutions,header_chart_type,header_settings,header_indicators,header_compare,header_undo_redo,header_screenshot,header_fullscreen_button]'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Chụp ảnh chart từ TradingView sử dụng Browserless REST API
 */
export async function captureTradingViewChart(options: CaptureOptions): Promise<CaptureResult> {
  const { pair, timeframe, width = 1200, height = 600 } = options;
  
  try {
    console.log(`📸 Bắt đầu chụp ảnh ${pair} ${timeframe}...`);
    
    // Tạo URL TradingView
    const url = buildTradingViewUrl(pair, timeframe);
    console.log(`🔗 Đang truy cập: ${url}`);
    
    // Sử dụng Browserless REST API để chụp screenshot
    const response = await fetch(`https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        options: {
          type: 'png',
          fullPage: true,
          viewport: {
            width: width,
            height: height
          }
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000
        },
        waitFor: 3000 // Đợi 3 giây cho chart load
      })
    });

    if (!response.ok) {
      throw new Error(`Browserless API error: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    console.log(`✅ Chụp ảnh thành công ${pair} ${timeframe}`);
    
    return {
      success: true,
      imageBuffer
    };
    
  } catch (error) {
    console.error('❌ Lỗi khi chụp ảnh:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
  console.log(`🎯 Bắt đầu chụp ảnh cho ${pair} - cả H4 và M15`);
  
  const [h4Result, m15Result] = await Promise.allSettled([
    captureTradingViewChart({ pair, timeframe: 'H4' }),
    captureTradingViewChart({ pair, timeframe: 'M15' })
  ]);
  
  return {
    h4: h4Result.status === 'fulfilled' ? h4Result.value : { success: false, error: 'Failed to capture H4' },
    m15: m15Result.status === 'fulfilled' ? m15Result.value : { success: false, error: 'Failed to capture M15' }
  };
}