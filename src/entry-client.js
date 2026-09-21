// Browser entry: registers the plugin with the DSH module loader.
import { INJECT, apply } from "./app.js";
import { setReact } from "./core.js";
import { injectStyles } from "./styles.js";
injectStyles();

window.__ModuleLoader__.load({
  id: "@addozhang/dsh-3d-model-viewer",
  factory: (require) => {
    setReact(require("react"));
    const module = { exports: {} };
    module.exports.inject = INJECT;
    module.exports.apply = apply;
    return module.exports;
  },
});

