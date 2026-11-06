// Original educational parser for the plain-text P3 Portable Pixmap format.
// This intentionally is not a browser screenshot or perceptual-image engine.
export class PixelFault extends Error {
  constructor(message) { super(message); this.name = "PixelFault"; }
}
const uint = raw => /^(0|[1-9]\d*)$/.test(raw) ? Number(raw) : NaN;
export function readP3(input) {
  if (typeof input !== "string" || input.length > 300_000)
    throw new PixelFault("Expected a small text P3 fixture");
  const text = input.split(/\r?\n/).map(line => line.replace(/#.*$/, "")).join(" ");
  const parts = text.trim().split(/\s+/);
  if (parts.shift() !== "P3") throw new PixelFault("Only ASCII P3 files are supported");
  const w = uint(parts.shift() ?? ""), h = uint(parts.shift() ?? "");
  const max = uint(parts.shift() ?? "");
  if (!Number.isSafeInteger(w) || !Number.isSafeInteger(h) ||
      w < 1 || h < 1 || w > 128 || h > 128 || max !== 255)
    throw new PixelFault("Dimensions must be 1..128, color maximum 255");
  if (parts.length !== w * h * 3) throw new PixelFault("Unexpected RGB sample count");
  const rgb = parts.map(uint);
  if (rgb.some(x => !Number.isSafeInteger(x) || x < 0 || x > 255))
    throw new PixelFault("RGB channels must be integers from 0 to 255");
  return { width: w, height: h, rgb };
}
export function assessPixels(baseText, candidateText, settings = {}) {
  const baseline = readP3(baseText);
  const current = readP3(candidateText);
  if (!settings || typeof settings !== "object" || Array.isArray(settings))
    throw new PixelFault("Invalid comparison settings");
  const tolerance = settings.tolerance ?? 0;
  const limit = settings.allowedPercentage ?? 0;
  if (!Number.isInteger(tolerance) || tolerance < 0 || tolerance > 255 ||
    typeof limit !== "number" || !Number.isFinite(limit) || limit < 0 || limit > 100)
    throw new PixelFault("Comparison bounds are invalid");
  if (baseline.width !== current.width || baseline.height !== current.height)
    return { verdict: "BLOCKED", reason: "SIZE_CHANGED", differentPixels: null };
  const total = baseline.width * baseline.height;
  let different = 0;
  let minCol = baseline.width, minRow = baseline.height, maxCol = -1, maxRow = -1;
  for (let pos = 0; pos < total; pos++) {
    const offset = pos * 3;
    const gap = Math.max(...[0,1,2].map(ch => Math.abs(
      baseline.rgb[offset+ch] - current.rgb[offset+ch])));
    if (gap <= tolerance) continue;
    different++;
    const col = pos % baseline.width, row = Math.floor(pos / baseline.width);
    minCol = Math.min(minCol, col); minRow = Math.min(minRow, row);
    maxCol = Math.max(maxCol, col); maxRow = Math.max(maxRow, row);
  }
  const pct = Number((100 * different / total).toFixed(3));
  return {
    verdict: pct <= limit ? "PASS" : "REVIEW",
    reason: different ? "PIXELS_DIFFER" : "IDENTICAL_WITHIN_TOLERANCE",
    differentPixels: different, totalPixels: total, percentage: pct,
    rectangle: different ? { x1: minCol, y1: minRow, x2: maxCol, y2: maxRow } : null
  };
}
