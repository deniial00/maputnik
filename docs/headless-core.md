# Headless editor core — first draft

## Goal

The headless draft separates Maputnik's style editing model from persistence, product navigation, and layout. It is additive: the standalone application and the full embeddable editor remain available. Consumers can adopt the framework-independent store, the React hooks, the optional Maputnik UI adapters, or all three.

## Module boundaries

```text
Host application
  ├── repository adapters: fetchStyle / updateStyle / listStyles
  ├── authentication, routing, notifications, conflicts
  └── product layout and design system
          │
          ▼
src/headless/core
  ├── owned StyleSpecification snapshot
  ├── commands and selection
  ├── undo / redo and clean baseline
  ├── validation issues
  └── external-store subscription
          │
          ├── src/headless/react
          │     ├── EditorProvider
          │     ├── useEditorSelector
          │     └── focused hooks and actions
          │
          └── src/headless/components (optional)
                ├── MaputnikUIRoot
                ├── HeadlessLayerList
                ├── HeadlessLayerEditor
                └── HeadlessMapPreview
```

The core imports no React, DOM, MapLibre renderer, storage, URL, or backend code. Persistence is an application concern. Published state snapshots are deeply frozen at runtime; callers use `getStyle()` when they need a mutable independent copy. `loadStyle()` establishes a new clean document and clears history; `replaceStyle()` is an undoable edit. `markClean()` records the version accepted by the host after a successful save.

## Must-have scope in this draft

| Capability | Why it is required | Draft API |
|---|---|---|
| Snapshot ownership | Host objects and returned snapshots must not mutate editor state | cloned input plus `getStyle()` |
| Load/replace/update | Required for repositories and style libraries | `loadStyle`, `replaceStyle`, `updateStyle` |
| Layer operations | Minimum useful editor command set | add, replace, remove, duplicate, move, visibility |
| Source operations | Layers and sources form one document | set, rename, guarded/cascading remove |
| Selection | Shared contract between custom and Maputnik UI | select by layer id |
| History | Expected editing behavior | bounded undo/redo |
| Dirty baseline | Async host persistence needs explicit acknowledgement | `dirty`, `markClean()` |
| Validation | Consumers must be able to block or annotate saves | style-spec validation issues |
| React integration | Efficient consumption without owning a second document | provider and selective hooks |
| Reference UI | Proves reuse of real Maputnik controls | list/editor/map adapters |

## Optional modules for later iterations

- Resource metadata service for TileJSON, sprites, glyphs, PMTiles, and vector-layer field discovery.
- Layer-bundle library with dependency collection, source/layer ID conflict policies, and sprite/font requirements.
- Transactions that group several commands into one history entry.
- Collaboration/version adapters, optimistic updates, merge conflicts, and autosave policies.
- Extension registry for custom layer types, fields, inspectors, validators, and toolbar actions.
- OpenLayers preview, inspect mode, geocoder configuration, and external-map adapters.
- Library package output with peer dependencies, declarations, stable exports, and semver guarantees.
- Multiple-editor coordination, SSR-safe imports, Shadow DOM or stronger CSS isolation, and theming tokens.

## React contract

`EditorProvider` accepts an existing store or creates one once from `initialStyle`. `useEditorSelector` keeps selector results stable and only rerenders a consumer when its selected value changes. Focused hooks cover style, layers, selection, dirty state, history, and validation. `useEditorActions()` returns the stable store command object.

The optional components deliberately remain opinionated Maputnik UI. They demonstrate progressive adoption rather than becoming the headless API themselves. A product can replace any of them with its own component while using the same store.

## Sample

`examples/headless-react` contains a separate Vite host. Its in-memory repository exposes asynchronous `fetchStyle`, `updateStyle`, and `listStyles` functions. Switching library entries calls `loadStyle`; saving calls `updateStyle` followed by `markClean`. The host owns all surrounding UI while the center workspace reuses the Maputnik layer list, layer editor, and map preview.

```sh
npm run start:headless
npm run build:headless
E2E_HEADLESS_ONLY=1 npm run test -- e2e/headless.spec.ts
```

## Known first-draft limitations

The adapters currently derive source choices directly from the style and do not fetch TileJSON, sprite, glyph, or vector-field metadata. Validation is synchronous. Map preview token substitution defaults to the existing Maputnik behavior but can be replaced. The existing Maputnik components still bring their i18n, vendor CSS, modal, and browser dependencies; consumers using only the core and hooks do not inherit those dependencies.

## Draft verification

Verified on August 30, 2026:

- Original web app, full embed host, and headless sample production builds passed.
- ESLint, upstream SCSS linting, editor/sample CSS linting, and `git diff --check` passed.
- 58 unit tests passed across 10 files, including 8 focused headless-core tests.
- 5 headless browser flows passed: composition without an iframe, edits and dirty state, undo/redo, clean style-library loading, and repository save/readback.
- The 5 headless flows and all 17 existing embed flows passed together (22 tests).
- A deliberately incorrect dirty-state expectation failed at the expected assertion and was restored before the final positive runs.

The builds retain Vite's existing large-chunk warning. The headless sample is a source-level architecture draft, not a published or size-optimized package.
