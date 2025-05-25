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
 * Chụp ảnh chart từ TradingView
 */
export async function captureTradingViewChart(options: CaptureOptions): Promise<CaptureResult> {
  const { pair, timeframe, width = 1200, height = 600 } = options;
  
  let browser;
  
  try {
    console.log(`📸 Bắt đầu chụp ảnh ${pair} ${timeframe}...`);
    
    // Sử dụng browserless với limit và retry
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}&--window-size=${width},${height}`,
    });
    
    const page = await browser.newPage();
    
    // Thiết lập kích thước viewport
    await page.setViewport({ width, height });
    
    // Thiết lập User Agent để tránh detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Tạo URL TradingView
    const url = buildTradingViewUrl(pair, timeframe);
    console.log(`🔗 Đang truy cập: ${url}`);
    
    // Navigate to TradingView
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Đợi chart load xong
    console.log('⏳ Đang đợi chart load...');
    
    // Đợi chart container xuất hiện
    await page.waitForSelector('[data-name="legend-source-item"]', { timeout: 15000 });
    
    // Đợi thêm để chart render đầy đủ
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ẩn các popup, banner và toolbar
    await page.evaluate(() => {
      // Ẩn các popup thông báo
      const popups = document.querySelectorAll('[data-name="popup"], [class*="popup"], [class*="modal"], [class*="banner"]');
      popups.forEach((popup: Element) => {
        (popup as HTMLElement).style.display = 'none';
      });
      
      // Ẩn toolbar và header
      const toolbars = document.querySelectorAll('[data-name="toolbar"], [class*="toolbar"], header, [class*="header"]');
      toolbars.forEach((toolbar: Element) => {
        (toolbar as HTMLElement).style.display = 'none';
      });
      
      // Ẩn các widget sidebar
      const sidebars = document.querySelectorAll('[class*="sidebar"], [data-name="sidebar"]');
      sidebars.forEach((sidebar: Element) => {
        (sidebar as HTMLElement).style.display = 'none';
      });
      
      // Ẩn footer
      const footers = document.querySelectorAll('footer, [class*="footer"]');
      footers.forEach((footer: Element) => {
        (footer as HTMLElement).style.display = 'none';
      });
      
      // Ẩn các notification
      const notifications = document.querySelectorAll('[class*="notification"], [class*="toast"]');
      notifications.forEach((notification: Element) => {
        (notification as HTMLElement).style.display = 'none';
      });
    });
    
    // Tìm chart container và chụp ảnh chỉ vùng chart
    const chartElement = await page.$('[data-name="legend-source-item"]').then(() => {
      // Tìm chart container chính
      return page.$('div[id*="tradingview_"]') || page.$('[class*="chart-container"]') || page.$('body');
    });
    
    if (!chartElement) {
      throw new Error('Không tìm thấy chart container');
    }
    
    console.log('📷 Đang chụp ảnh chart...');
    
    // Chụp ảnh chỉ vùng chart
    const imageBuffer = Buffer.from(await chartElement.screenshot({
      type: 'png',
      omitBackground: false,
    }));
    
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
  } finally {
    if (browser) {
      await browser.disconnect();
    }
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