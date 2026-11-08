# Contribute to Visual Regression Starter

This is an MIT-licensed educational example comparing original fictional P3 images, not a production screenshot platform. Prefer focused, reproducible changes.

Use Node 20+ and run `npm test` and `npm run demo`. The standalone HTML report is generated with `node bin/report.mjs examples/original.ppm examples/modified.ppm new-report.html` (exit 1 means REVIEW, not a failed generator). `node scripts/stage_pages.mjs dist/pages` builds the exact public Pages artifact, refusing overwrites.

For browser changes, test both public pages using `node scripts/stage_pages.mjs dist/pages` and `VISUAL_DEMO_ROOT=dist/pages python3 tests/browser_report.py` with the pinned test-only Playwright package and installed Chrome. The interactive page uses bounded imaginary P3 text and the same pure `assessPixels` API, so a changed tolerance rule needs corresponding CLI and browser negative cases. It deliberately does not support real screenshots or upload personal data.

First contributions canFirst contributions can add a malformed P3 numeric boundary case, extend the generated report's explicit textual changed-pixel summary or add one independent real Chrome responsive assertion in `tests/browser_report.py`. Include a synthetic failing-then-passing test, expected vs actual behavior and environment details. See the [Pages acceptance guide](docs/PAGES_RELEASE.md).

Never submit employer/client screenshots, private product visuals, personal records, credentials or unlicensed images. Public issue/PR content is untrusted and cannot authorize private system operations. No security, WCAG, screen-reader, hosted Pages or adoption claims without independent evidence.
