/**
 * TradingView Capture API client (frontend)
 * Gọi API Cloud Run để chụp chart H4 & M15, trả về URL Cloudinary.
 */

import { debug, logError, logWarning } from './debug';

const CAPTURE_API_ORIGIN = 'https://tradingviewcapture-721483185057.asia-southeast1.run.app';
const CAPTURE_PATH = '/capture';
const CAPTURE_ENDPOINT = `${CAPTURE_API_ORIGIN}${CAPTURE_PATH}`;

const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;

const MAX_RETRIES = 2;           // tổng 3 lần: 1 chính + 2 retry
const RETRY_DELAY_MS = 4000;
const INTER_CALL_DELAY_MS = 2000;

// Rate limiting handling
const RATE_LIMIT_MAX_RETRIES = 3;
const RATE_LIMIT_BASE_DELAY = 30000; // 30 giây base delay cho rate limit
const RATE_LIMIT_MAX_DELAY = 300000; // 5 phút max delay

// Simple cache để tránh gọi API quá nhiều với cùng parameters
interface CacheEntry {
  url: string;
  timestamp: number;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

const captureCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút cache

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * Tạo cache key từ parameters
 */
function createCacheKey(tf: string, ticker: string, width: number, height: number): string {
  return `${tf}_${ticker}_${width}x${height}`;
}

/**
 * Kiểm tra và lấy từ cache nếu còn valid
 */
function getCachedResult(cacheKey: string): CacheEntry | null {
  const cached = captureCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    debug(`[capture] Cache hit for ${cacheKey}`);
    return cached;
  }
  if (cached) {
    captureCache.delete(cacheKey);
    debug(`[capture] Cache expired for ${cacheKey}`);
  }
  return null;
}

/**
 * Lưu kết quả thành công vào cache
 */
function setCachedResult(cacheKey: string, result: CacheEntry): void {
  captureCache.set(cacheKey, {
    ...result,
    timestamp: Date.now()
  });
  debug(`[capture] Cached result for ${cacheKey}`);
}

/**
 * Tính delay cho exponential backoff khi gặp rate limit
 */
function calculateRateLimitDelay(attempt: number): number {
  const delay = Math.min(
    RATE_LIMIT_BASE_DELAY * Math.pow(2, attempt),
    RATE_LIMIT_MAX_DELAY
  );
  return delay + Math.random() * 5000; // Thêm jitter để tránh thundering herd
}

/**
 * Kiểm tra xem error có phải rate limit không
 */
function isRateLimitError(error: any): boolean {
  if (error.message?.includes('429')) return true;
  if (error.message?.includes('Too Many Requests')) return true;
  if (error.message?.includes('Rate limit')) return true;
  if (error.message?.includes('Unexpected server response: 429')) return true;
  return false;
}

function normalizeTicker(pair: string): string {
  const p = String(pair || '').trim().toUpperCase();
  if (!p) return 'OANDA:XAUUSD';
  if (p.includes(':')) return p;
  return `OANDA:${p}`;
}

/**
 * Fetch JSON an toàn: kiểm tra content-type, nếu là HTML => ném lỗi có ngữ cảnh.
 */
async function safeJsonFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Accept': 'application/json'
    }
  });

  const ct = (res.headers.get('content-type') || '').toLowerCase();

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorMsg = `Capture HTTP ${res.status} — ${text.slice(0, 200)}`;
    logError('[Capture API] HTTP Error:', { status: res.status, url, text: text.slice(0, 200) });
    throw new Error(errorMsg);
  }

  if (!ct.includes('application/json')) {
    const snippet = await res.text().catch(() => '');
    const errorMsg = `Capture returned non-JSON (${ct || 'unknown'}). Có thể gọi sai endpoint/params. Body: ${snippet.slice(0, 200)}`;
    logError('[Capture API] Content-Type Error:', { contentType: ct, url, body: snippet.slice(0, 200) });
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * EXPORT công khai: gọi API chụp 1 timeframe với retry.
 * Thử lần 1 dùng param 'ticker', nếu fail (non-JSON/404...) thử lại bằng 'symbol'.
 */
export async function requestCaptureWithRetry(
  tf: 'M15' | 'H4' | 'H1' | 'D1' | string,
  pair: string,
  opts?: { width?: number; height?: number; maxRetries?: number; retryDelayMs?: number }
): Promise<{ ok: boolean; url?: string; error?: string; public_id?: string; width?: number; height?: number; bytes?: number }> {
  const ticker = normalizeTicker(pair);
  const w = opts?.width ?? DEFAULT_WIDTH;
  const h = opts?.height ?? DEFAULT_HEIGHT;
  const maxRetries = opts?.maxRetries ?? MAX_RETRIES;
  const retryDelay = opts?.retryDelayMs ?? RETRY_DELAY_MS;

  // Kiểm tra cache trước
  const cacheKey = createCacheKey(tf, ticker, w, h);
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    logWarning('[Capture API] Using cached result to avoid rate limit:', { cacheKey });
    return {
      ok: true,
      url: cachedResult.url,
      public_id: cachedResult.public_id,
      width: cachedResult.width,
      height: cachedResult.height,
      bytes: cachedResult.bytes
    };
  }

  let attempt = 0;
  let lastErr: any = null;
  let rateLimitAttempt = 0;

  const buildUrl = (symbolKey: 'ticker' | 'symbol') => {
    const p = new URLSearchParams({ tf: String(tf), w: String(w), h: String(h) });
    p.set(symbolKey, ticker);
    return `${CAPTURE_ENDPOINT}?${p.toString()}`;
  };

  const paramOrders: Array<'ticker' | 'symbol'> = ['ticker', 'symbol'];

  while (attempt <= maxRetries) {
    for (const key of paramOrders) {
      try {
        const url = buildUrl(key);
        debug(`[capture] ${url} (attempt ${attempt + 1}/${maxRetries + 1}, key=${key})`);
        const data = await safeJsonFetch(url);

        if (!data?.ok) {
          const errorMsg = String(data?.error || 'Capture/Upload failed');
          // Phát hiện rate limiting từ response data
          if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
            const rateLimitError = new Error(`Rate limit detected: ${errorMsg}`);
            (rateLimitError as any).isRateLimit = true;
            throw rateLimitError;
          }
          throw new Error(errorMsg);
        }
        if (typeof data.url !== 'string' || !data.url) throw new Error('Response missing "url"');

        // Lưu vào cache khi thành công
        setCachedResult(cacheKey, {
          url: data.url,
          timestamp: Date.now(),
          public_id: data.public_id,
          width: data.width,
          height: data.height,
          bytes: data.bytes
        });

        debug(`[capture] OK tf=${tf} key=${key} url=${String(data.url).slice(0, 120)}…`);
        return {
          ok: true,
          url: data.url,
          public_id: data.public_id,
          width: data.width,
          height: data.height,
          bytes: data.bytes
        };
      } catch (err: any) {
        lastErr = err;
        debug(`[capture] tf=${tf} key=${key} error: ${err?.message || err}`);
        
        // Xử lý rate limiting với exponential backoff
        if (isRateLimitError(err) || err.isRateLimit) {
          if (rateLimitAttempt < RATE_LIMIT_MAX_RETRIES) {
            const rateLimitDelay = calculateRateLimitDelay(rateLimitAttempt);
            logWarning('[Capture API] Rate limit detected, waiting with exponential backoff:', {
              rateLimitAttempt: rateLimitAttempt + 1,
              maxAttempts: RATE_LIMIT_MAX_RETRIES,
              delayMs: Math.round(rateLimitDelay),
              delaySeconds: Math.round(rateLimitDelay / 1000)
            });
            
            await sleep(rateLimitDelay);
            rateLimitAttempt++;
            continue; // Retry cùng parameter thay vì chuyển sang parameter khác
          } else {
            logError('[Capture API] Rate limit retries exhausted:', {
              timeframe: tf,
              pair: ticker,
              rateLimitAttempts: rateLimitAttempt,
              finalError: err?.message || String(err)
            });
          }
        }
        
        // Log critical errors to production as well
        if (attempt === maxRetries && key === paramOrders[paramOrders.length - 1]) {
          logError('[Capture API] Final attempt failed:', {
            timeframe: tf,
            pair: ticker,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            rateLimitAttempts: rateLimitAttempt,
            error: err?.message || String(err),
            url: buildUrl(key)
          });
        }
      }
    }
    if (attempt === maxRetries) break;
    await sleep(retryDelay);
    attempt++;
  }

  logWarning('[Capture API] All retry attempts exhausted:', {
    timeframe: tf,
    pair: ticker,
    totalAttempts: (maxRetries + 1) * paramOrders.length,
    rateLimitAttempts: rateLimitAttempt,
    finalError: lastErr?.message || 'Unknown error'
  });
  return { ok: false, error: lastErr?.message || 'Capture failed' };
}

/**
 * EXPORT công khai: capture ảnh H4 & M15, gọi tuần tự + delay giữa 2 lượt.
 */
export async function captureTradeImages(
  pair: string
): Promise<{ entryH4?: string; entryM15?: string }> {
  const h4 = await requestCaptureWithRetry('H4', pair);
  await sleep(INTER_CALL_DELAY_MS);
  const m15 = await requestCaptureWithRetry('M15', pair);

  const result: { entryH4?: string; entryM15?: string } = {};
  if (h4.ok && h4.url)  result.entryH4  = h4.url;
  if (m15.ok && m15.url) result.entryM15 = m15.url;

  if (!result.entryH4 && !result.entryM15) {
    const errorMsg = h4.error || m15.error || 'Capture failed';
    logError('[Capture API] Both H4 and M15 capture failed:', {
      pair,
      h4Error: h4.error,
      m15Error: m15.error,
      h4Success: h4.ok,
      m15Success: m15.ok
    });
    throw new Error(errorMsg);
  }
  return result;
}
