/**
 * TradingView Capture API client (frontend)
 * Gọi API Cloud Run để chụp chart H4 & M15, trả về URL Cloudinary.
 */

import { debug } from './debug';

const CAPTURE_API_ORIGIN = 'https://tradingviewcapture-721483185057.asia-southeast1.run.app';
const CAPTURE_PATH = '/capture';
const CAPTURE_ENDPOINT = `${CAPTURE_API_ORIGIN}${CAPTURE_PATH}`;

const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;

const MAX_RETRIES = 2;           // tổng 3 lần: 1 chính + 2 retry
const RETRY_DELAY_MS = 4000;
const INTER_CALL_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
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
    throw new Error(`Capture HTTP ${res.status} — ${text.slice(0, 200)}`);
  }

  if (!ct.includes('application/json')) {
    const snippet = await res.text().catch(() => '');
    throw new Error(
      `Capture returned non-JSON (${ct || 'unknown'}). Có thể gọi sai endpoint/params. Body: ${snippet.slice(0, 200)}`
    );
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

  let attempt = 0;
  let lastErr: any = null;

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

        if (!data?.ok) throw new Error(String(data?.error || 'Capture/Upload failed'));
        if (typeof data.url !== 'string' || !data.url) throw new Error('Response missing "url"');

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
      }
    }
    if (attempt === maxRetries) break;
    await sleep(retryDelay);
    attempt++;
  }

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
    throw new Error(h4.error || m15.error || 'Capture failed');
  }
  return result;
}
