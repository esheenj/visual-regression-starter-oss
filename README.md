# Visual Regression Starter

**Explore the Esheen Labs gallery:** [Try 28 open-source browser demos and developer playgrounds](https://esheenj.github.io/compound-intelligence-starter/) across seven independent public repositories, including AI agent experiments, UX patterns and tooling. They use fictional examples; 28 demos does **not** mean 28 separate repositories.

**Who this is for:** Inspect visual differences and explore pixel-tolerance trade-offs in a browser.

**[Open the GitHub-deployed static P3 report and interactive comparison](https://esheenj.github.io/visual-regression-starter-oss/)** — [GitHub Pages deployment](https://github.com/esheenj/visual-regression-starter-oss/actions/runs/42485712445) succeeded on **9 November 2026**. The seven-project collection separately passed a bounded independent public HTTPS Chrome check on 11 November 2026 ([acceptance evidence](https://github.com/esheenj/compound-intelligence-starter/actions/runs/43064815195)); physical-device and assistive-technology acceptance are not claimed.

A small **offline pixel-comparison learning project**. It reads two plain-text P3 Portable Pixmap samples and produces a deterministic difference report with a bounding rectangle, without external packages or accounts.

## Try it

Requires Node.js 20+:

```sh
npm test
node bin/check.mjs examples/original.ppm examples/original.ppm
node bin/check.mjs examples/original.ppm examples/modified.ppm
node bin/check.mjs examples/original.ppm examples/modified.ppm 12
node bin/check.mjs examples/original.ppm examples/multiple-changes.ppm
node bin/check.mjs examples/original.ppm examples/multiple-changes.ppm 13 25
```

The examples are invented 2 × 2 pixel grids, not genuine screenshots. CLI exit **0** indicates PASS, **1** requests REVIEW, and **2** indicates BLOCKED/invalid input. The library in `src/p3-diff.mjs` exports `readP3` and `assessPixels`. Passing is based on explicitly supplied numerical tolerance, not automated product acceptance.

## Offline visual HTML report (new MVP slice)

Generate a **standalone, human-readable comparison** of two small, fictional P3 images; the colored cells are illustrative, and the text summary lists changed coordinates and RGB values:

```sh
node bin/report.mjs examples/original.ppm examples/modified.ppm report.html
```

Open `report.html` locally. The file contains no scripts, external resources, telemetry or server dependency. This command returns exit **0** for PASS, **1** for REVIEW (report still written) and **2** for invalid or blocked input; it **never overwrites** an existing file or symlink. Choose a new `.html` filename for each run. Optional positional values after the output path are channel tolerance (0–255) and allowed changed-pixel percentage (0–100).

The visual preview deliberately stops at **32 × 32 pixels**, while the original JSON-only `bin/check.mjs` continues to support the documented 128 × 128 limit. The report is a learning tool rather than production screenshot capture, perceptual diffing, or an accessibility audit.

## Public static report and contributions

To stage the **exact deterministic Pages artifact**, run `node scripts/stage_pages.mjs dist/pages`. It produces a standalone script-free fictional pixel comparison and excludes unrelated files. CI now tests the generated public artifact in real Chrome across narrow and desktop viewports.

[GitHub Pages setup and actual HTTPS acceptance](docs/PAGES_RELEASE.md) are required before advertising a live URL; public source and green CI do not establish that Pages is operational. The sample is explicitly a `REVIEW` verdict, not an error or formal visual acceptance. For a first original contribution, follow [CONTRIBUTING.md](CONTRIBUTING.md).

## Interactive, browser-only P3 comparison

The [interactive playground](playground.html) lets developers paste **fictional ASCII P3** grids, choose between one/two changed-pixel examples, set per-channel tolerance and allowed change percentage, and compare using the same `assessPixels` function as the CLI. Colored cells have a textual coordinate/percentage summary. All input is local to the open page; no uploads, telemetry, accounts or external scripts.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/playground.html` locally. The public Pages artifact contains both the original **script-free static report** (`index.html`) and the new interactive playground (`playground.html`). Stage exact files with `node scripts/stage_pages.mjs dist/pages`; GitHub CI checks the staged pages with real Chrome. **GitHub deployment completed successfully**, but external HTTPS/browser acceptance is pending.

## Constraints

This is **not browser screenshot capture**, image-diff PNG/JPEG support, perceptual or antialiasing analysis, accessibility testing, or WCAG compliance checking. Only bounded ASCII P3, 1–128 pixels in each dimension, 255 maximum channel values and input files up to 300 KB are supported. The comparison never modifies files. Real UI acceptance needs browser/device review.

Please contribute only original code and synthetic fixtures; never upload screenshots of private products or customer data. MIT license. The package intentionally has `private: true` to prevent accidental npm registry publication.

## Understand two different thresholds

The invented 2 × 2 fixture `multiple-changes.ppm` differs from the baseline at pixels **(0,0)** and **(1,1)**, using zero-based coordinates. A strict comparison reports **2/4 changed pixels = 50%** and a bounding rectangle `{x1:0,y1:0,x2:1,y2:1}`.

- **Channel tolerance** is checked *per pixel*, against the largest absolute RGB-channel difference at that pixel. For this fixture, setting tolerance to **13** ignores the 13-level top-left change but still counts the 20-level bottom-right difference (25% changed).
- **Allowed percentage** is applied *after* channel tolerance. With tolerance **13** and allowed percentage **25**, the report is PASS; with only allowed percentage **25**, it is REVIEW because 50% changed.
- These settings are illustrative acceptance thresholds, not automatic proof that a changed design is correct. An intentionally high tolerance can suppress meaningful differences.

The expanded tests also prove that invalid/malformed/oversized input files and linked files exit nonzero without echoing their contents. The sample data is fictional; please do not upload customer screenshots or proprietary UI assets.
