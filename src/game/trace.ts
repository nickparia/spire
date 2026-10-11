/**
 * A short memory of what the game just did and anything that went wrong,
 * for testers to read in Options when a phone misbehaves. Nothing leaves
 * the device.
 */
const KEEP = 24;
const lines: string[] = [];

export function trace(msg: string): void {
  const t = (performance.now() / 1000).toFixed(1);
  lines.push(`${t}s ${msg}`);
  if (lines.length > KEEP) lines.shift();
}

export function traceLines(): string[] {
  return [...lines];
}

/** Errors the page would otherwise swallow: a thrown error, a rejected promise. */
export function watchErrors(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => {
    trace(`error: ${e.message} @${(e.filename ?? "").split("/").pop()}:${e.lineno}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string } | string | undefined;
    trace(`rejected: ${typeof r === "string" ? r : (r?.message ?? String(r))}`.slice(0, 160));
  });
}
