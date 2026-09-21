# DSH 3D Model Viewer

[中文文档](README.zh-CN.md)

An interactive STL / 3MF viewer plugin for the DeepSeek Harness Web GUI.
Models can be inspected directly in the sidebar document preview — no
external tool needed — and the plugin doubles as a live preview drawer for
active sessions.

## Features

- **Native sidebar document preview** — clicking an `.stl` / `.3mf` in the
  Files panel opens it in the right-hand document tab, exactly like the
  builtin Markdown / PDF / image viewers (registered through the public
  `documentPreviews` + `sidebar.right.tab.document` extension points).
- **Live session drawer** — when the current session references models, a
  `3D 预览 (N)` button appears in the session header and opens a drawer with
  a searchable model list; files are re-parsed automatically ~1.5 s after
  they change on disk.
- **CAD-style navigation** — left-drag rotates (true trackball, no gimbal
  limits), right / middle / Shift-drag pans, wheel zooms (perspective and
  orthographic), double-click resets.
- **View presets** — front/back/left/right/top/bottom use an orthographic
  camera and show labelled bounding-box dimensions (mm); iso is the classic
  perspective view. Keyboard: `1-7` presets, `R` reset (when the canvas is
  focused).
- **Model color** — seven preset swatches (incl. white) plus a native color
  picker; STL stays single-color, 3MF part colors (`basematerials`) are
  rendered per-vertex when present.
- **Print checks** (currently disabled behind `PRINT_INSIGHTS_ENABLED`) —
  build-volume fit against printer profiles (X2D default), closed-mesh
  volume, and a filament weight estimate.
- **PNG screenshot export** — one click saves the current view.
- **System-aware theme** — flat light/dark background following
  `prefers-color-scheme`, with a subtle grid.

Everything is parsed in the browser; model files never leave the machine
(the drawer fetches files from a local plugin endpoint only).

## Install

```bash
dsh plugin --profile web add /path/to/dsh-3d-model-viewer
```

Then add to `$DSH_HOME/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: 3d-model-viewer
      name: '@local/dsh-3d-model-viewer'
```

Refresh the Web GUI; if the client roster did not update, restart
`dsh web` and refresh again.

## Development

```bash
npm install
npm run build    # esbuild: src/ -> lib/client.js
npm test         # unit + bundle smoke tests (node --test)
npm run test:e2e # boots a private dsh web + drives the real GUI (local only)
```

Source layout under `src/`: `core` (React holder, stores), `styles`,
`parse` (STL binary/ASCII, 3MF zip + basematerials, mesh volume),
`viewer` (WebGL renderer, presets, picking math), `ui` (document body,
drawer, print-insights panel), `app` (registration), `entry-client`.

The e2e script needs python3 + playwright + system Chrome and reads the
cookie-signing secret from `~/.dsh/.credentials.yaml` to mint a session
cookie for its private server instance. Env knobs: `E2E_WORKSPACE`,
`E2E_WORKSPACE_DIR`, `E2E_SESSION_SUBSTR`.

## Current limitations

- 3MF support covers mesh geometry + `basematerials` colors; build-item
  transforms, per-component overrides, and slicer-specific metadata are not
  reconstructed.
- Files are capped at 250 MB / 5 M triangles; meshes above 400 k triangles
  fall back to bounding-box-only picking (moot with button-based drag modes).
- This is a geometry previewer: no slicing, no printability analysis.

## License

MIT
