// client/src/lib/capture.ts
export type CaptureResult = { ok: boolean; url?: string; public_id?: string; error?: string };

const BASE =
  (import.meta.env.VITE_CAPTURE_BASE as string) ||
  "https://tradingviewcapture-721483185057.asia-southeast1.run.app";

export function buildCaptureUrl(tf: "M15" | "H4", pair: string, w = 1440, h = 900) {
  return `${BASE.replace(/\/$/, "")}/capture?tf=${tf}&w=${w}&h=${h}&ticker=${encodeURIComponent(
    `OANDA:${pair.trim().toUpperCase()}`
  )}`;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function requestCaptureWithRetry(
  tf: "M15" | "H4",
  pair: string,
  { maxAttempts = 8, baseDelayMs = 1500 }: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<CaptureResult> {
  const url = buildCaptureUrl(tf, pair);
  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      const data = JSON.parse(text) as CaptureResult;
      if (data.ok && data.url) return data;
    } catch {}
    await sleep(baseDelayMs * Math.pow(2, attempt - 1)); // 1.5s, 3s, 6s...
    attempt++;
  }
  return { ok: false, error: `Capture ${tf} not ready after ${maxAttempts} attempts` };
}
