# Visual Regression Starter

A small **offline pixel-comparison learning project**. It reads two plain-text P3 Portable Pixmap samples and produces a deterministic difference report with a bounding rectangle, without external packages or accounts.

## Try it

Requires Node.js 20+:

```sh
npm test
node bin/check.mjs examples/original.ppm examples/original.ppm
node bin/check.mjs examples/original.ppm examples/modified.ppm
node bin/check.mjs examples/original.ppm examples/modified.ppm 12
```

The examples are invented 2 × 2 pixel grids, not genuine screenshots. CLI exit **0** indicates PASS, **1** requests REVIEW, and **2** indicates BLOCKED/invalid input. The library in `src/p3-diff.mjs` exports `readP3` and `assessPixels`. Passing is based on explicitly supplied numerical tolerance, not automated product acceptance.

## Constraints

This is **not browser screenshot capture**, image-diff PNG/JPEG support, perceptual or antialiasing analysis, accessibility testing, or WCAG compliance checking. Only bounded ASCII P3, 1–128 pixels in each dimension, 255 maximum channel values and input files up to 300 KB are supported. The comparison never modifies files. Real UI acceptance needs browser/device review.

Please contribute only original code and synthetic fixtures; never upload screenshots of private products or customer data. MIT license. The package intentionally has `private: true` to prevent accidental npm registry publication.
