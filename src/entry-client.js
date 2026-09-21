// Browser entry: registers the plugin with the DSH module loader.
import { INJECT, apply } from "./app.js";
import { setReact } from "./core.js";
import { injectStyles } from "./styles.js";
import * as Viewer from "./viewer.js";
import * as Parse from "./parse.js";

injectStyles();

window.__ModuleLoader__.load({
  id: "@local/dsh-3d-model-viewer",
  factory: (require) => {
    setReact(require("react"));
    const module = { exports: {} };
    module.exports.inject = INJECT;
    module.exports.apply = apply;
    return module.exports;
  },
});

// Debug/test hook (no dependencies; used by the Playwright harness).
window.__D3V_DEBUG__ = { Viewer, Parse };
