# Maputnik as a React Component — POC

## Outcome and baseline

Maputnik can run as a child component inside a separate React root without an iframe. The POC wraps the existing editor, reusing its layer, source, property, filter, and JSON editors, along with RevisionStore and MapLibre.

Based on [maplibre/maputnik](https://github.com/maplibre/maputnik), commit `d802049d029e37adfc75e1c8e6b4eecaf0a10ec9`, Maputnik 3.1.0. Fork: [deniial00/maputnik](https://github.com/deniial00/maputnik). The POC changes are on `feature/embeddable-editor`; `main` remains at the upstream baseline. No packages have been published. The upstream lockfile is unchanged.

## Getting started

Clone the fork's POC branch and start the demo:

```sh
git clone --branch feature/embeddable-editor https://github.com/deniial00/maputnik.git
cd maputnik
npm ci
npm run start:embed
```

The separate host application runs at `http://localhost:5173/`. It imports `src/editor` directly from source and has its own entry point, React root, and Vite configuration. Its dependencies come from the installation at the repository root; no additional `npm install` is needed in the example directory.

```sh
npm run build:embed         # Type checking + host production build in dist-embed/
npm run start              # Original web app at :8888/maputnik/
npm run build              # Original production build in dist/
npx playwright install chromium
npm run test -- e2e/embed.spec.ts --workers=2
npm run test-unit -- --run
npm run lint
npm run lint-css
```

The test runner starts both development servers automatically or reuses running servers. The embed test requires the host on port 5173 even when `E2E_NO_WEBSERVER=1`. The upstream `.nvmrc` specifies Node 22.13; this POC was tested with Node 26.7.0, React 19.2.8, MapLibre GL 6.5.0, and Vite 8.2.2 from the existing lockfile.

The demo deliberately uses local, illustrative GeoJSON geometry. It does not depend on a basemap, API key, or Maputnik backend. “Save snapshot” stores a copy in the host's React state and displays it as JSON. This is not persistent storage; the copy is lost on reload.

## Integration

```tsx
import { useRef, useState } from "react";
import {
  MaputnikEditor,
  type MaputnikEditorHandle,
  type StyleSpecification,
} from "./maputnik/src/editor";

export function StyleDesigner({ initialStyle }: { initialStyle: StyleSpecification }) {
  const editor = useRef<MaputnikEditorHandle>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<StyleSpecification>();

  return <>
    <button disabled={!dirty} onClick={() => {
      const style = editor.current?.getStyle();
      if (!style) return;
      setSaved(style); // The host can make its own API call here.
      setDirty(false);
    }}>Save</button>
    <div style={{ height: 650 }}>
      <MaputnikEditor
        ref={editor}
        initialStyle={initialStyle}
        onStyleChange={() => setDirty(true)}
      />
    </div>
    {saved && <pre>{JSON.stringify(saved, null, 2)}</pre>}
  </>;
}
```

The import loads the editor SCSS automatically. Do not additionally import `src/index.jsx` or `src/styles/index.scss`: those belong to the fullscreen web app. The host needs an explicit height, preferably at least 600 px; approximately 1000 px of width is practical for the existing desktop editor. The component itself has a minimum height of 400 px. The example allows horizontal scrolling of the editor in narrower windows.

In another Vite application, React and ReactDOM must resolve to the same installation (`resolve.dedupe` in the example). The build must support Sass, JSON imports, Vite's `?worker&url`, and asset imports. `global: "globalThis"` is required, as in upstream. The existing RTL plugin asset must be available under `BASE_URL`; `copy-rtl-text-plugin` and the demo configuration handle this. Other bundlers and React versions are outside the scope of this verification.

## API contract

| API | Behavior |
|---|---|
| `initialStyle` | Complete MapLibre style, copied on mount. Later prop changes do not replace the document. |
| `onStyleChange?: () => void` | Signal after a committed style change, including undo/redo, `setStyle`, and `reset`. No signal for initialization, layer selection alone, map movement, or identical documents. |
| `getStyle()` | Synchronous, independent deep copy of the complete editor document, including unknown metadata, URLs, and values edited in the UI. |
| `setStyle(style)` | Copies and replaces the document; clears selection, the source data cache, file handle, and undo history. An immediate `getStyle()` call returns the new document, even before the React commit. The map position comes from the new style, defaulting to `[0,0]` / zoom `0` when absent. |
| `reset()` | Same as `setStyle`, but uses the original style captured on mount. `setStyle` does not change this reset baseline. |
| `className`, `style` | Optional attributes for the outer container. Not a comprehensive theming API. |

`StyleSpecification` comes directly from `@maplibre/maplibre-gl-style-spec`. The component is uncontrolled; the host's style is not continuously fed back into the editor. Call ref methods only after mount; the ref is `null` after unmount.

`getStyle()` deliberately reads the editor document, not `map.getStyle()`: the map may temporarily contain a style sanitized for preview or an inspection style. Maputnik continues to display validation errors as before. The host must perform its own validation before persistent storage if needed; the API does not guarantee that all returned documents are valid.

### Why a change signal?

The callback does not carry an additional complete style JSON object. Deep copies are made at the API boundaries (`initialStyle`, `setStyle`, `getStyle`). Existing style validation, MapLibre diffing, history, and an equality comparison remain in place. This does not imply constant runtime or low memory usage for very large styles. Load testing with large real styles belongs in phase 2. Multiple changes in a React batch may produce multiple signals; the host should use the signal to mark the document dirty, not as an event sourcing log.

## Architecture and dependencies

```text
External React host
  └── MaputnikEditor: public ref + initial snapshot + CSS/language scope
       └── App (embedded)
            ├── Existing style state + RevisionStore
            ├── Existing layer/source/property/filter/JSON UI
            └── Dedicated MapLibre map + ResizeObserver

src/index.jsx → App (standalone) → Existing StyleStore / URL / desktop mode
```

`App.tsx` remains the internal editor core. The POC deliberately avoids extracting it into many new modules. An internal `embedded` flag disables only the application integrations. The original web app does not yet need to consume the new public component.

| Area | Upstream dependency | POC adaptation / remaining limitation |
|---|---|---|
| Persistence | `createStyleStore` loads browser storage or the desktop API. `StyleStore` accesses LocalStorage directly. | The factory is never called in embedded mode; `saveStyle` does not persist there. No memory store is needed as a storage substitute. |
| URL / history | `App` reads/writes search parameters; MapLibre writes the hash. | Both integrations are disabled in embedded mode. Host routing is unchanged. |
| Keyboard | Anonymous body keyup listener in the constructor; global keydown listener. | Listeners are registered after mount and removed on unmount; shortcuts are scoped to the editor. Host inputs retain undo; input fields and CodeMirror use their own undo. |
| CSS | Global resets, `html`/`body`, fullscreen layout, and a fixed toolbar. | SCSS is compiled under `.maputnik-editor`; the toolbar and main area are positioned relative to the container. No `body { overflow: hidden }` in the host. |
| Dialogs | Portals under `body`, global scroll locking. | Existing AriaModal renders into a slot inside the editor; no body scroll locking. The dialog focus trap intentionally remains active. Only one editor is supported. |
| Language | Global i18next detector with a storage cache; `body.dir` set during render. | Dedicated i18next instance without a detector or storage; starts in English and can be changed through the existing toolbar. Direction is applied to the editor layout, not the host body. |
| Map | Dedicated MapLibre instance, previously without `remove()`. | The map is removed on unmount, ResizeObserver is disconnected, the popup React root is released, and language listeners/inspector timers are cleaned up. |
| Inspector | `maplibre-gl-inspect` 1.9.0 has a private timeout that cannot be cancelled. | A render guard on each instance prevents access to removed maps. The short internal timeout still expires naturally; a complete fix would require an upstream change. |
| CodeMirror / color | Missing `destroy()`, throttled color callback. | CodeMirror is destroyed and the color callback is cancelled. Color picker coordinates are relative to the container in embedded mode. |
| Source metadata | Asynchronous fetches and LayerWatcher throttling. | Own HTTP fetches receive an abort signal on style replacement and unmount; stale results are ignored; the watcher is cleared/cancelled. Requests inside PMTiles/Inspector cannot all be cancelled by this component. |
| Import / export | File picker, downloads, optional public style URLs. | Existing features remain available; browser APIs are used following user actions. Host saving is independent and uses the ref. |
| OpenLayers | Alternative renderer selected through style metadata. | Still available, with basic disposal added. POC acceptance and the demo focus on MapLibre; OpenLayers has not been comprehensively tested. |

### Remaining global dependencies

The embedded entry point includes the standalone HTML shell's SVG color filters with dedicated IDs.

There is no Shadow DOM: aggressive global host CSS can still affect the editor. Vendor CSS from MapLibre, Geocoder, and OpenLayers remains global under the libraries' own classes; hosts using additional maps from those libraries must check for conflicts. Roboto font faces remain globally registered. Some autocomplete menus still use the window height and may be clipped at container boundaries.

The MapLibre worker URL, RTL plugin, and PMTiles protocol are still registered at module scope or when the map mounts. This is an intentional remainder of the upstream architecture; hosts with their own MapLibre configuration need further decoupling. The required `window.Buffer` polyfill is added only if it does not already exist. Importing the source requires a browser environment and is not SSR safe.

### External resources

`sources`, `sprite`, `glyphs`, `layers`, and `metadata` are not replaced by a custom data model. The map loads sources, sprites, and glyphs itself; there is no new proxy or required Maputnik backend. CORS, CSP, availability, and required tokens remain the responsibility of the host or resource provider. Relative resource URLs resolve in the context of the host origin. Existing Maputnik token substitution remains active.

The URL GeoJSON path is tested with real MapLibre and an intercepted HTTP response. Live third-party services, PMTiles archives, and complete sprite/glyph rendering combinations have not been comprehensively tested. Multi-sprite styles are passed through to MapLibre; the existing icon metadata suggestion list supports only a simple string sprite in this POC.

## Tests and acceptance

Automated embed tests are in `e2e/embed.spec.ts`, with the corresponding driver in `e2e/embed-driver.ts`. The small API fixture under `examples/react-embed/tests` is loaded only by the development server and is not included in the production build. It uses the same real editor, not a UI mock. Every embed test runs with LocalStorage and SessionStorage getters that throw; uncaught browser errors are also checked.

| Criterion | Evidence |
|---|---|
| AC1 Mounting | Separate React root, no iframe, React StrictMode |
| AC2 Initial style | Complete initial style, correct initial map position |
| AC3 Editor | Paint/layout, adding/selecting layers, sources dialog, MapLibre style updates, and undo |
| AC4 Reading | Snapshot includes metadata/sources; mutations of returned values are isolated |
| AC5 Changes | Dirty signal, current callback, no signal for identical documents |
| AC6 Replacement | `setStyle` immediately readable, new history baseline, `reset` to the mount baseline |
| AC7 Backend | Local demo without a backend; external GeoJSON source through MapLibre |
| AC8 Persistence | Tests with unavailable storage; no storage fallback required |
| AC9 Existing app | Separate production build and existing regression tests |

Completed checks and remaining limitations are documented in [verification.md](verification.md).

## Assessment and phase 2

| Criterion | Assessment | Rationale |
|---|---|---|
| Initial extraction effort | Medium | The style/UI core is reusable; lifecycle and global effects require several targeted changes. |
| Changes to Maputnik | Medium | No second UI, but changes touch App, the map, dialogs, and individual input components. |
| Ease of merging future upstream changes | Medium | Small, localized adaptations; central `App` code remains a potential conflict point. |
| Global dependencies | Medium | URL/storage/body behavior is isolated; worker/protocol/vendor CSS/polyfill dependencies remain. |
| React integration | Good | Uncontrolled API, stable ref, snapshot boundaries, StrictMode tests. |
| API complexity | Low | One initial prop, one signal, three methods. |
| Fork maintainability | Medium | The POC is manageable; global initialization and access to private MapLibre/Inspector internals remain risks. |

**Recommendation: phase 2 is technically worthwhile** for embedding a single editor in a desktop browser application. Before producing a production library, extract application integrations into adapters, make map globals configurable, complete portal/CSS isolation, and add a library build with peer dependencies, type declarations, and explicit CSS/worker exports. Then test large real styles, host routers, host i18n, strict CSP, resize scenarios, and a browser matrix. Multiple editors, SSR, comprehensive theming, and an external map instance remain separate work items.
