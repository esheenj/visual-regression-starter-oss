# Visual Regression Starter — public static report

The Pages bundle now contains **two original public demonstrations**: the generated script-free comparison at `index.html` and an interactive local P3 editor at `playground.html`. The browser adapter imports only the original pixel validator and fictional fixture module; it neither uploads text nor calls a backend.

The original public pixel comparator can generateThe original public pixel comparator can generate a single **fictional, script-free** HTML report directly from its two checked-in P3 samples. The result is useful for showing the open-source MVP without installing Node in the viewer's browser.

## Test exact public artifact locally

```sh
npm test
node scripts/stage_pages.mjs dist/pages
python3 -m pip install -r tests/browser-requirements.txt
VISUAL_DEMO_ROOT=dist/pages python3 tests/browser_report.py
```

Chrome or Chromium is required for the pinned test-only Playwright tests; no browser package is needed to **view** the static report. The staging script generates just `index.html` and `.nojekyll`, excludes original raw fixtures, private history, repo metadata and test code, and rejects an existing destination. The demo reports exactly one changed fictional pixel and a `REVIEW` verdict, not product acceptance.

## One-time GitHub Pages setup

An authorized repository administrator must select **Settings → Pages → Build and deployment → Source → GitHub Actions** in `esheenj/visual-regression-starter-oss`. The standard GitHub Actions workflow token cannot turn the site on.

The `Publish CI-verified fictional pixel report` workflow runs after successful `Validate original P3 example` **main-push** CI. It checks out the exact CI SHA, rejects stale source if main has advanced, verifies Pages is already enabled for Actions, regenerates the static report and uploads it through first-party Pages actions. Pull request checks never publish; no broad administrator token or paid hosting is added.

## Live acceptance

After an actual successful Pages deployment, read its `page_url` and load the HTTPS address in a browser. Confirm both fictional color grids, the 25% pixel difference, changed-position textual description, no external requests, a single main heading and responsive 320px–desktop layout. Link the real URL in the README and central OSS directory **only after** independent HTTPS validation. Do not treat green CI as hosting proof.

This is not screenshot capture, perceptual visual regression, accessibility certification or user acceptance testing. Roll back by reverting the source and allowing a verified revert commit to deploy; admins can disable Pages urgently if needed.

Additional recurring infrastructure spend: R0.
