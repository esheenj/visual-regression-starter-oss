import { assessPixels, readP3, PixelFault } from './p3-diff.mjs';

const rgbAt = (image, index) => image.rgb.slice(index * 3, index * 3 + 3);
const rgbCss = channels => `rgb(${channels.join(', ')})`;

/** Render only validated numeric P3 samples. Never embed filenames or raw input text. */
export function renderPixelReport(baseText, candidateText, settings = {}) {
  const result = assessPixels(baseText, candidateText, settings);
  if (result.verdict === 'BLOCKED') throw new PixelFault('Image dimensions differ; no report generated');
  const base = readP3(baseText);
  const current = readP3(candidateText);
  if (base.width > 32 || base.height > 32)
    throw new PixelFault('HTML preview is limited to 32 by 32 pixels');
  const tolerance = settings.tolerance ?? 0;
  const changes = [];
  for (let index = 0; index < base.width * base.height; index++) {
    const from = rgbAt(base, index), to = rgbAt(current, index);
    if (from.some((channel, i) => Math.abs(channel - to[i]) > tolerance)) {
      changes.push({ x: index % base.width, y: Math.floor(index / base.width), from, to });
    }
  }
  const changedPositions = new Set(changes.map(c => c.y * base.width + c.x));
  const tiles = image => Array.from({length:base.width * base.height}, (_, index) => {
    const p = rgbAt(image, index);
    return `<span class="pixel${changedPositions.has(index) ? ' changed' : ''}" style="background:${rgbCss(p)}"></span>`;
  }).join('');
  const panel = (label, image) => `<section><h2>${label}</h2><div class="grid" aria-hidden="true" style="grid-template-columns:repeat(${base.width}, minmax(1.5rem, 1fr))">${tiles(image)}</div></section>`;
  const summary = changes.length
    ? `<ol>${changes.slice(0, 100).map(c => `<li>Column ${c.x + 1}, row ${c.y + 1}: ${c.from.join(', ')} → ${c.to.join(', ')}</li>`).join('')}</ol>${changes.length > 100 ? `<p>${changes.length - 100} additional changed pixels omitted from the list.</p>` : ''}`
    : '<p>No pixels changed beyond the selected channel tolerance.</p>';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline pixel comparison</title><style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}body{max-width:65rem;margin:2rem auto;padding:0 1rem;line-height:1.5}.panels{display:flex;flex-wrap:wrap;gap:2rem}section{flex:1;min-width:12rem}.grid{display:grid;border:2px solid currentColor;gap:2px;max-width:30rem;overflow:auto}.pixel{min-height:1.5rem;aspect-ratio:1}.changed{outline:3px dashed #b10000;outline-offset:-3px}
</style></head><body><main><h1>Offline pixel comparison</h1>
<p><strong>Verdict: ${result.verdict}</strong>. ${result.differentPixels} of ${result.totalPixels} pixels differ (${result.percentage}%).</p>
<p>Channel tolerance: ${tolerance}; allowed changed pixels: ${settings.allowedPercentage ?? 0}%. Synthetic ASCII P3 only; not a screenshot or accessibility test.</p>
<div class="panels">${panel('Baseline',base)}${panel('Candidate',current)}</div><h2>Changed pixel coordinates</h2>${summary}
</main></body></html>
`;
  return { result, html };
}
