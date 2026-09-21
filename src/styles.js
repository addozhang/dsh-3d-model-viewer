// Styles, injected once per document as a <style> tag by the plugin.
export const CSS = `
.d3v-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(5,10,20,.62);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}
.d3v-dialog{width:min(1080px,calc(100vw - 40px));height:min(780px,calc(100vh - 40px));background:var(--dsw-specific-menu,#17191d);color:var(--dsw-alias-label-primary,#eee);border:1px solid var(--dsw-alias-border-l1,#444);border-radius:16px;box-shadow:0 22px 80px rgba(0,0,0,.45);display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}
.d3v-header{height:56px;display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l1,#333)}.d3v-title{font-size:16px;font-weight:600}.d3v-sub{color:var(--dsw-alias-label-tertiary,#999);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.d3v-spacer{flex:1}
.d3v-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2,#555);background:var(--dsw-alias-interactive-bg-hover,#292c31);color:inherit;border-radius:8px;padding:7px 11px;cursor:pointer;font:inherit;font-size:13px}.d3v-btn:hover{filter:brightness(1.12)}.d3v-close{font-size:20px;padding:3px 9px}
.d3v-stage{position:relative;min-height:0}
.d3v-stage,.d3v-doc{background-color:#e9ecef;background-image:linear-gradient(rgba(15,23,42,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.07) 1px,transparent 1px);background-size:22px 22px}
@media(prefers-color-scheme:dark){.d3v-stage,.d3v-doc{background-color:#14171d;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)}}
.d3v-canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}.d3v-canvas:active{cursor:grabbing}
.d3v-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}.d3v-empty-card{text-align:center;color:#4b5563}.d3v-empty-icon{font-size:52px;opacity:.7;margin-bottom:14px}.d3v-empty-note{font-size:13px;color:#6b7280;margin-top:7px}
@media(prefers-color-scheme:dark){.d3v-empty-card{color:#c8d0dc}.d3v-empty-note{color:#8993a3}}
.d3v-drop{outline:2px dashed #60a5fa;outline-offset:-10px}
.d3v-error{position:absolute;left:14px;right:14px;top:14px;padding:10px 12px;border-radius:9px;background:#591d25;color:#ffd6da;font-size:13px}
.d3v-help{position:absolute;right:13px;bottom:11px;color:#5b6472;background:rgba(129,138,150,.18);border-radius:7px;padding:5px 8px;font-size:11px;pointer-events:none}
@media(prefers-color-scheme:dark){.d3v-help{color:#9da8b8;background:rgba(10,12,17,.65)}}
.d3v-footer{min-height:44px;display:flex;align-items:center;gap:18px;padding:0 16px;border-top:1px solid var(--dsw-alias-border-l1,#333);font-size:12px;color:var(--dsw-alias-label-secondary,#bbb);flex-wrap:wrap}.d3v-stat b{color:var(--dsw-alias-label-primary,#eee);font-weight:500}.d3v-input{display:none}
.d3v-session-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2,#555);background:var(--dsw-alias-interactive-bg-hover,#292c31);color:var(--dsw-alias-label-primary,#eee);border-radius:8px;padding:5px 10px;cursor:pointer;font:inherit;font-size:12px}.d3v-session-btn:hover{filter:brightness(1.12)}
.d3v-drawer-wrap{position:fixed;inset:0;z-index:900;pointer-events:none}.d3v-drawer-backdrop{position:absolute;inset:0;background:rgba(5,10,20,.18);pointer-events:auto}.d3v-drawer{position:absolute;right:0;top:0;bottom:0;width:min(880px,72vw);min-width:560px;background:var(--dsw-specific-menu,#17191d);color:var(--dsw-alias-label-primary,#eee);border-left:1px solid var(--dsw-alias-border-l1,#444);box-shadow:-18px 0 55px rgba(0,0,0,.28);pointer-events:auto;display:grid;grid-template-rows:auto 1fr;overflow:hidden}.d3v-drawer-head{height:54px;display:flex;align-items:center;gap:10px;padding:0 13px;border-bottom:1px solid var(--dsw-alias-border-l1,#333)}.d3v-drawer-body{min-height:0;display:grid;grid-template-columns:240px minmax(0,1fr)}.d3v-browser{min-width:0;border-right:1px solid var(--dsw-alias-border-l1,#333);display:grid;grid-template-rows:auto 1fr auto;background:rgba(10,12,17,.16)}.d3v-search-wrap{padding:10px}.d3v-search{box-sizing:border-box;width:100%;height:34px;border:1px solid var(--dsw-alias-border-l2,#555);border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,#292c31);color:inherit;font:inherit;padding:0 10px;outline:none}.d3v-search:focus{border-color:#60a5fa}.d3v-files{min-height:0;overflow-y:auto;padding:0 7px 8px;display:flex;flex-direction:column;gap:3px}.d3v-file{appearance:none;width:100%;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;padding:8px;cursor:pointer;display:grid;grid-template-columns:32px minmax(0,1fr);gap:8px}.d3v-file:hover{background:var(--dsw-alias-interactive-bg-hover,#292c31)}.d3v-file.active{background:rgba(59,130,246,.16);box-shadow:inset 2px 0 #60a5fa}.d3v-file-icon{width:32px;height:32px;border-radius:7px;background:rgba(96,165,250,.13);color:#93c5fd;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}.d3v-file-main{min-width:0}.d3v-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px}.d3v-file-meta{color:var(--dsw-alias-label-tertiary,#8993a3);font-size:10px;line-height:15px;display:flex;gap:7px}.d3v-browser-foot{border-top:1px solid var(--dsw-alias-border-l1,#333);padding:8px 10px;color:var(--dsw-alias-label-tertiary,#8993a3);font-size:11px}.d3v-preview-column{min-width:0;min-height:0;display:grid;grid-template-rows:1fr auto}.d3v-live{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#86efac}.d3v-live:before{content:'';width:6px;height:6px;border-radius:50%;background:#22c55e}.d3v-loading{position:absolute;left:12px;top:12px;color:#cbd5e1;background:rgba(10,12,17,.7);padding:6px 9px;border-radius:7px;font-size:12px}
@media(max-width:760px){.d3v-drawer{width:100vw;min-width:0}.d3v-drawer-body{grid-template-columns:150px minmax(0,1fr)}}
.d3v-doc{position:relative;box-sizing:border-box;width:100%;height:100%;min-height:420px;overflow:hidden}
.d3v-doc .d3v-canvas{position:absolute;inset:0}
.d3v-doc-status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#4b5563;font-size:13px}
@media(prefers-color-scheme:dark){.d3v-doc-status{color:#c8d0dc}}
.d3v-doc-foot{position:absolute;left:12px;bottom:11px;display:flex;flex-direction:column;gap:4px;align-items:flex-start;z-index:2;max-width:calc(100% - 130px)}
.d3v-doc-stats{color:#3f4854;background:rgba(129,138,150,.18);border-radius:7px;padding:5px 9px;font-size:11px;pointer-events:none}
@media(prefers-color-scheme:dark){.d3v-doc-stats{color:#c8d0dc;background:rgba(10,12,17,.65)}}
.d3v-viewtools{position:absolute;top:11px;right:11px;display:flex;flex-direction:column;gap:4px;z-index:2;align-items:flex-end}
.d3v-views{display:flex;gap:3px;background:rgba(129,138,150,.18);border-radius:8px;padding:4px;flex-wrap:wrap;max-width:calc(100% - 20px);justify-content:flex-end}
@media(prefers-color-scheme:dark){.d3v-views{background:rgba(10,12,17,.65)}}
.d3v-view-btn{appearance:none;border:0;background:transparent;color:#3f4854;border-radius:6px;padding:4px 8px;cursor:pointer;font:inherit;font-size:11px;line-height:1.2;white-space:nowrap}
.d3v-view-btn:hover{background:rgba(96,165,250,.22);color:#173a63}
@media(prefers-color-scheme:dark){.d3v-view-btn{color:#c8d0dc}.d3v-view-btn:hover{color:#e8eef7}}
.d3v-colors{display:flex;gap:5px;align-items:center;background:rgba(129,138,150,.18);border-radius:8px;padding:5px}
@media(prefers-color-scheme:dark){.d3v-colors{background:rgba(10,12,17,.65)}}
.d3v-swatch{appearance:none;width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.18);cursor:pointer;padding:0}
.d3v-swatch:hover{transform:scale(1.15)}
.d3v-swatch.active{border-color:#e8eef7;box-shadow:0 0 0 1px rgba(0,0,0,.55)}
.d3v-color-native{width:22px;height:20px;padding:0;border:0;background:transparent;cursor:pointer}
.d3v-labels{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}
.d3v-dim{position:absolute;transform:translate(-50%,-50%);font-size:11px;font-weight:600;color:#f1f5f9;background:rgba(10,12,17,.72);border-radius:5px;padding:2px 6px;white-space:nowrap;box-shadow:inset 0 -2px 0 transparent}
.d3v-dim-x{box-shadow:inset 0 -2px 0 #ef4444}
.d3v-dim-y{box-shadow:inset 0 -2px 0 #22c55e}
.d3v-dim-z{box-shadow:inset 0 -2px 0 #3b82f6}
.d3v-check{display:flex;gap:10px;align-items:center;background:rgba(129,138,150,.18);border-radius:7px;padding:4px 9px;font-size:11px;color:#3f4854;flex-wrap:wrap}
@media(prefers-color-scheme:dark){.d3v-check{background:rgba(10,12,17,.65);color:#cbd5e1}}
.d3v-check select{appearance:none;border:1px solid rgba(63,72,84,.4);background:rgba(255,255,255,.75);color:inherit;border-radius:5px;font:inherit;font-size:11px;padding:1px 4px}
@media(prefers-color-scheme:dark){.d3v-check select{border-color:#555;background:rgba(20,23,29,.9)}}
.d3v-check-warn{color:#dc2626;font-weight:600}
@media(prefers-color-scheme:dark){.d3v-check-warn{color:#fca5a5}}
.d3v-check-ok{color:#16a34a;font-weight:500}
@media(prefers-color-scheme:dark){.d3v-check-ok{color:#86efac}}
`;

export function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="dsh-3d-model-viewer"]')) return;
  const tag = document.createElement("style");
  tag.dataset.pluginCss = "dsh-3d-model-viewer";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
