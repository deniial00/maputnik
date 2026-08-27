# POC Verification Report

Verification date: August 27, 2026. Environment: macOS ARM64, Node 26.7.0, Chromium 151 / Playwright 1.62.1. Upstream baseline: `d802049d029e37adfc75e1c8e6b4eecaf0a10ec9`. Local branch: `feature/embeddable-editor`.

## Checks performed

| Check | Result |
|---|---|
| `npm ci` | Successfully installed dependencies from the unchanged upstream lockfile |
| `npm run build` | Type checking and the original web app build passed |
| `npm run build:embed` | Type checking and the independent React host production build passed |
| `npm run lint` | Passed |
| `npm run lint-css` | Passed |
| `npx stylelint src/editor/editor.scss` | Passed |
| `npm run test-unit -- --run` | 50 tests passed across 9 files |
| Combined browser test run | 136 tests passed: 16 embed tests at that point, plus 120 existing regression tests |
| Final targeted run after additional source safeguards | 25 tests passed: 17 embed, 6 map, and 2 history tests |
| API test fixture type checking | Passed separately using the project's compiler options |
| Negative test control | Deliberately changed the expected initial style: the test failed on the incorrect name. Restored the original file and reran the positive tests successfully. |
| `git diff --check` | Passed |
| Visual inspection in the Codex browser | Checked the real editor inside the host, paint changes, style replacement, the source dialog, layout visibility, and SVG color filters |

In total, **17 new embed tests and 120 distinct existing browser tests** were run successfully. The remainder of the upstream E2E suite was not run. The 120 existing tests are from:

```text
e2e/map.spec.ts
e2e/history.spec.ts
e2e/keyboard.spec.ts
e2e/layer-editor.spec.ts
e2e/modals.spec.ts
e2e/i18n.spec.ts
```

Command to reproduce the combined run on the completed implementation (now 137 tests):

```sh
npm run test -- e2e/embed.spec.ts e2e/map.spec.ts e2e/history.spec.ts \
  e2e/keyboard.spec.ts e2e/layer-editor.spec.ts e2e/modals.spec.ts \
  e2e/i18n.spec.ts --workers=3
```

All embed tests use the real editor with React StrictMode, a real MapLibre map, and unavailable LocalStorage/SessionStorage. Uncaught browser errors fail the corresponding test. The lifecycle test also waits for the private inspector timeout to expire. The additional source test delays metadata responses while replacing the document.

## Issues found and fixed during implementation

- The body keyup listener was registered in the constructor and never removed.
- The MapLibre instance, popup React root, and language listener lacked complete cleanup.
- CodeMirror was not destroyed on unmount; StrictMode created duplicate editors.
- A private inspector timeout attempted to call `setStyle()` on a removed map after unmount. A guard on each instance prevents this.
- Stale source requests could access the new source collection after a style replacement. Abort signals, a captured request snapshot, and result guards prevent this.
- A toolbar import loaded the global i18next initialization. Language configuration and the embedded instance are now separate.
- Fullscreen CSS positioning, body scroll locking, and portals outside the editor prevented clean host integration.

## Build and security warnings

Vite still warns about large bundles. The host build includes the existing editor, including OpenLayers. Its main JavaScript bundle is approximately **3.43 MB uncompressed / 955 KB gzip**, plus workers, CSS, and fonts. This is a POC built from source, not an optimized library distribution. The additional build directory is outside the example root; Vite intentionally does not empty it automatically. Use a clean build directory when producing deployment artifacts.

`npm audit --json` reported **6 affected dependencies in the existing lockfile: 1 low, 4 moderate, and 1 high**. The reported packages were `@babel/core`, `ajv`, `istanbul-lib-processinfo`, `js-yaml`, `qs`, and the transitive dependency `uuid`. The high severity finding concerns `js-yaml`. Neither `npm audit fix` nor package upgrades were run, to keep upstream dependency changes separate from the POC. A separate dependency review and update are required before production use. This is not a complete security audit.

## Not covered by this verification

Desktop/backend mode, Safari/Firefox, React versions other than the installed upstream version, SSR, multiple editors, a production host backend, authentication, arbitrary CSP rules, large real styles, live third-party services, complete sprite/glyph/PMTiles combinations, and comprehensive OpenLayers compatibility.

Global MapLibre initialization, vendor CSS, and a short private inspector timeout remain known dependencies. For details and the phase 2 recommendation, see the [integration guide and architecture report](embeddable-editor.md).

## Handoff

The GitHub fork is [deniial00/maputnik](https://github.com/deniial00/maputnik), and the POC branch is `feature/embeddable-editor`. The original source remains configured locally as the `origin` remote; the personal fork uses the `fork` remote. No upstream pull request has been opened and no package has been published. The additional patch included in the local handoff contains both modified and new files; it can be applied to the upstream baseline above with `git apply`.
