// client/src/lib/capture.ts
/**
 * TradingView Capture Client
 * - Gọi API: https://tradingviewcapture-721483185057.asia-southeast1.run.app/
 * - Tự xếp hàng (queue) để đảm bảo mỗi lượt cách nhau ~35-40s theo yêu cầu.
 * - Retry với backoff khi lỗi mạng/5xx.
 *
 * API (kỳ vọng) trả JSON:
 *  { "ok": true, "url": "https://.../tradingview/130925_1806_XAUUSD_M15.png", "public_id": "...", ... }
 *
 * Hàm public:
 *  - requestCaptureWithRetry(timeframe, pair): Promise<{ ok: boolean; url?: string; error?: string }>
 */

export type Timeframe = 'M15' | 'H4' | string;

export interface CaptureSuccess {
  ok: true;
  url: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  // các field khác nếu API có
  [k: string]: any;
}

export interface CaptureFail {
  ok: false;
  error: string;
  status?: number;
  // các field khác nếu API có
  [k: string]: any;
}

export type CaptureResult = CaptureSuccess | CaptureFail;

const BASE_URL = 'https://tradingviewcapture-721483185057.asia-southeast1.run.app/';

// ===== Queue & Throttle config =====
const MIN_GAP_MS = 35_000;        // nghỉ tối thiểu giữa 2 lượt (theo yêu cầu “~30s và mỗi lượt/session”)
const DEFAULT_TIMEOUT_MS = 60_000; // timeout 60s cho 1 call (API có thể mất ~30s)
const MAX_RETRIES = 2;            // tổng 1 lần chính + 2 retry = 3 nỗ lực
const INITIAL_BACKOFF_MS = 3_000; // backoff khi lỗi

// Hàng đợi tuần tự
let queue: Array<() => Promise<void>> = [];
let running = false;
let lastRunAt = 0;

// Tiện ích sleep
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Chạy hàng đợi
async function runQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length > 0) {
      const now = Date.now();
      const gap = now - lastRunAt;
      if (gap < MIN_GAP_MS) {
        await sleep(MIN_GAP_MS - gap);
      }
      const task = queue.shift();
      if (!task) break;
      lastRunAt = Date.now();
      await task();
    }
  } finally {
    running = false;
  }
}

/**
 * Đẩy một lời gọi API vào hàng đợi và nhận kết quả.
 */
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push(async () => {
      try {
        const out = await fn();
        resolve(out);
      } catch (err) {
        reject(err);
      }
    });
    // kích hoạt chạy queue
    runQueue().catch(() => {
      /* nuốt lỗi queue runner */
    });
  });
}

/**
 * Gọi fetch với timeout.
 */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Chuẩn hóa symbol/pair: loại bỏ khoảng trắng, upper-case.
 */
function normalizePair(pair: string): string {
  return String(pair || '').trim().toUpperCase();
}

/**
 * Xây URL GET dạng: ?tf=M15&pair=XAUUSD
 * (Nhiều triển khai Cloud Run cho phép GET hoặc POST. Ta ưu tiên GET với query.)
 */
function buildCaptureUrl(timeframe: Timeframe, pair: string): string {
  const tf = encodeURIComponent(String(timeframe).toUpperCase());
  const p = encodeURIComponent(normalizePair(pair));
  const url = `${BASE_URL}?tf=${tf}&pair=${p}`;
  return url;
}

/**
 * Parse JSON an toàn.
 */
async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    // fallback text → wrap
    try {
      const text = await res.text();
      return { ok: false, error: text || 'Invalid JSON' };
    } catch {
      return { ok: false, error: 'Unknown response' };
    }
  }
}

/**
 * Gọi API 1 lần (không retry).
 */
async function callOnce(timeframe: Timeframe, pair: string): Promise<CaptureResult> {
  const url = buildCaptureUrl(timeframe, pair);

  // Một số backend yêu cầu POST. Ta thử GET trước, nếu 405 -> fallback POST.
  let res: Response | null = null;
  try {
    res = await fetchWithTimeout(url, { method: 'GET' });
    if (res.status === 405) {
      // Fallback POST JSON
      res = await fetchWithTimeout(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tf: timeframe, pair: normalizePair(pair) }),
      });
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' };
  }

  const data = await safeJson(res);
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || data?.message || `HTTP ${res.status}`,
      status: res.status,
      ...data,
    };
  }

  // Đảm bảo field url tồn tại khi ok
  if (data?.ok && typeof data?.url === 'string' && data.url) {
    return data as CaptureSuccess;
  }

  // Một số backend trả {ok:true} nhưng chưa có url ngay → coi như lỗi “no url”
  if (data?.ok && !data?.url) {
    return { ok: false, error: 'Capture ok but no URL returned', ...data };
  }

  return {
    ok: false,
    error: data?.error || 'Unknown error',
    ...data,
  };
}

/**
 * Gọi API với retry + backoff, được xếp hàng để đảm bảo khoảng nghỉ giữa lượt.
 */
export async function requestCaptureWithRetry(
  timeframe: Timeframe,
  pair: string,
  opts?: { timeoutMs?: number; retries?: number }
): Promise<CaptureResult> {
  const retries = Math.max(0, opts?.retries ?? MAX_RETRIES);
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let attempt = 0;
  let lastError: string | undefined;
  let backoff = INITIAL_BACKOFF_MS;

  return enqueue<CaptureResult>(async () => {
    while (attempt <= retries) {
      attempt += 1;
      const result = await callOnce(timeframe, pair);
      if (result.ok) {
        return result;
      }
      lastError = result.error || `Unknown error (attempt ${attempt})`;

      // Không retry cho lỗi 4xx “logic” (ví dụ 400 input bad)
      const status = (result as any)?.status as number | undefined;
      if (status && status >= 400 && status < 500 && status !== 429) {
        // 429 (Too Many Requests) vẫn có thể retry
        break;
      }

      if (attempt <= retries) {
        await sleep(backoff);
        backoff = Math.min(backoff * 2, 20_000); // giới hạn backoff
      }
    }
    return { ok: false, error: lastError || 'Capture failed' };
  });
}

/**
 * Tiện ích gọi H4 rồi M15 tuần tự với khoảng nghỉ tự động từ queue.
 * Trả về { entryH4?: url, entryM15?: url }
 */
export async function captureH4AndM15(
  pair: string
): Promise<{ entryH4?: string; entryM15?: string; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const out: { entryH4?: string; entryM15?: string } = {};
  const p = normalizePair(pair);

  const h4 = await requestCaptureWithRetry('H4', p);
  if (h4.ok) out.entryH4 = h4.url;
  else errors.H4 = h4.error || 'unknown';

  const m15 = await requestCaptureWithRetry('M15', p);
  if (m15.ok) out.entryM15 = m15.url;
  else errors.M15 = m15.error || 'unknown';

  return Object.keys(errors).length ? { ...out, errors } : out;
}
