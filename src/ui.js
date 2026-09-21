// React UI: standalone dialog, session drawer, and the sidebar document body.
import { React, h, useStore } from "./core.js";
import { toArrayBuffer, parseStl, parse3mf } from "./parse.js";
import { Viewer, ViewPresetBar, DEFAULT_COLOR, PRINTER_PROFILES, MATERIALS, INFILL_OPTIONS } from "./viewer.js";

export const M3D_DOC_ID = "@local/dsh-3d-model-viewer/model3d";

function docFileName(address) {
  try { const m = decodeURIComponent(String(address)).match(/\/([^\/?#]+)$/); return m ? m[1] : ""; } catch { return ""; }
}

function fileSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Build-volume fit check, mesh volume, and a filament weight estimate. */
export function PrintInsights({ mesh }) {
  const [printer, setPrinter] = React.useState(PRINTER_PROFILES[0][0]);
  const [material, setMaterial] = React.useState(MATERIALS[0][0]);
  const [infill, setInfill] = React.useState(15);
  const prof = PRINTER_PROFILES.find(p => p[0] === printer) || PRINTER_PROFILES[0];
  const fits = mesh.size[0] <= prof[1] && mesh.size[1] <= prof[2] && mesh.size[2] <= prof[3];
  const density = (MATERIALS.find(m => m[0] === material) || MATERIALS[0])[1];
  const volCm3 = mesh.volume / 1000;
  // solid shells/roof overhead approximated as 25% of the non-infilled volume
  const grams = volCm3 * density * (infill / 100 + (1 - infill / 100) * 0.25);
  const select = (value, onChange, options, label) =>
    h("label", null, label + " ", h("select", { value, onChange: e => onChange(e.target.value) },
      options.map(o => h("option", { key: o.value, value: o.value }, o.label))));
  return h("div", { className: "d3v-check" },
    h("span", { className: fits ? "d3v-check-ok" : "d3v-check-warn" },
      fits ? `✓ 适配 ${printer}` : `⚠ 超出 ${printer} (${prof[1]}×${prof[2]}×${prof[3]})`),
    select(printer, setPrinter, PRINTER_PROFILES.map(p => ({ value: p[0], label: `${p[0]} ${p[1]}×${p[2]}×${p[3]}` })), "打印机"),
    h("span", null, `体积 ${volCm3.toFixed(2)} cm³`),
    select(material, setMaterial, MATERIALS.map(m => ({ value: m[0], label: m[0] })), "材料"),
    select(String(infill), v => setInfill(+v), INFILL_OPTIONS.map(v => ({ value: String(v), label: v + "%" })), "填充"),
    h("span", null, `≈ ${grams.toFixed(1)} g`));
}

/** Sidebar document-preview body: bytes in, viewer + tools out. */
export function Model3dBody({ content, resourceAddress, t }) {
  const tt = (key, params) => { try { if (typeof t === "function") return t(key, params); } catch {} return key; };
  const name = docFileName(resourceAddress), is3mf = /\.3mf$/i.test(name);
  const bytes = content && content.kind === "bytes" ? content.data : undefined;
  const [state, setState] = React.useState({ status: bytes ? "loading" : "waiting" });
  const [view, setView] = React.useState();
  const [color, setColor] = React.useState(DEFAULT_COLOR);
  React.useEffect(() => {
    if (!bytes) return;
    let live = true;
    setState({ status: "loading" });
    Promise.resolve().then(() => { const buf = toArrayBuffer(bytes); return is3mf ? parse3mf(buf) : parseStl(buf); })
      .then(mesh => { if (live) setState({ status: "ready", mesh }); })
      .catch(e => { if (live) setState({ status: "error", message: e instanceof Error ? e.message : String(e) }); });
    return () => { live = false; };
  }, [bytes, is3mf]);
  return h("div", { className: "d3v-doc", "data-dsh-3d-docbody": "" },
    state.status === "ready" && h(Viewer, { mesh: state.mesh, resetToken: 0, view, color }),
    state.status === "ready" && h(ViewPresetBar, { onPick: (yaw, pitch, ortho) => setView({ yaw, pitch, ortho }), color, onPickColor: setColor }),
    state.status === "loading" && h("div", { className: "d3v-doc-status" }, tt("loading")),
    state.status === "waiting" && h("div", { className: "d3v-doc-status" }, tt("waiting")),
    state.status === "error" && h("div", { className: "d3v-error" }, tt("failed", { message: state.message })),
    state.status === "ready" && h("div", { className: "d3v-doc-foot" },
      h("div", { className: "d3v-doc-stats" },
        `${name} · ${state.mesh.triangles.toLocaleString()} △ · ${state.mesh.size.map(v => v.toFixed(1)).join(" × ")} mm`),
      h(PrintInsights, { mesh: state.mesh })),
    state.status === "ready" && h("div", { className: "d3v-help" }, "拖动旋转 · 滚轮缩放 · 正交视图显示尺寸"));
}

async function readWorkspaceModel(path) {
  const r = await fetch(`/3d-model-viewer/files?path=${encodeURIComponent(path)}`, { cache: "no-store" });
  if (!r.ok) throw Error(`读取模型失败（HTTP ${r.status}）`);
  const buf = await r.arrayBuffer();
  return path.toLowerCase().endsWith(".3mf") ? parse3mf(buf) : parseStl(buf);
}

/** Standalone dialog for opening local STL/3MF files (drop or file picker). */
export function Overlay({ store }) {
  const s = useStore(store), input = React.useRef(null);
  const [drag, setDrag] = React.useState(false), [reset, setReset] = React.useState(0);
  const [view, setView] = React.useState(), [color, setColor] = React.useState(DEFAULT_COLOR);
  React.useEffect(() => {
    if (!s.open) return;
    const key = e => { if (e.key === "Escape") store.set({ open: false }); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [s.open]);
  if (!s.open) return null;
  const load = async file => {
    if (!file) return;
    if (file.size > 250 * 1024 * 1024) { store.set({ error: "文件超过 250 MB 限制" }); return; }
    store.set({ loading: true, error: "", name: file.name });
    try {
      const buf = await file.arrayBuffer(), ext = file.name.toLowerCase();
      const mesh = ext.endsWith(".3mf") ? await parse3mf(buf) : parseStl(buf);
      store.set({ mesh, loading: false });
      setReset(x => x + 1);
    } catch (e) {
      store.set({ error: e instanceof Error ? e.message : String(e), loading: false, mesh: null });
    }
  };
  const drop = e => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]); };
  return h("div", { className: "d3v-backdrop", onMouseDown: e => { if (e.target === e.currentTarget) store.set({ open: false }); } },
    h("section", { className: "d3v-dialog", role: "dialog", "aria-modal": "true", "aria-label": "3D 模型预览" },
      h("header", { className: "d3v-header" },
        h("div", null,
          h("div", { className: "d3v-title" }, "3D 模型预览"),
          h("div", { className: "d3v-sub", title: s.name }, s.name || "STL / 3MF · 文件仅在浏览器本地解析")),
        h("div", { className: "d3v-spacer" }),
        s.mesh && h("button", { className: "d3v-btn", onClick: () => setReset(x => x + 1) }, "重置视角"),
        h("button", { className: "d3v-btn", onClick: () => input.current?.click() }, s.loading ? "读取中…" : "打开文件"),
        h("input", { ref: input, className: "d3v-input", type: "file", accept: ".stl,.3mf,model/stl,model/3mf", onChange: e => load(e.target.files[0]) }),
        h("button", { className: "d3v-btn d3v-close", "aria-label": "关闭", onClick: () => store.set({ open: false }) }, "×")),
      h("main", { className: "d3v-stage" + (drag ? " d3v-drop" : ""), onDragOver: e => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false), onDrop: drop },
        s.mesh && h(Viewer, { mesh: s.mesh, resetToken: reset, view, color }),
        s.mesh && h(ViewPresetBar, { onPick: (yaw, pitch, ortho) => setView({ yaw, pitch, ortho }), color, onPickColor: setColor }),
        !s.mesh && !s.error && h("div", { className: "d3v-empty" },
          h("div", { className: "d3v-empty-card" },
            h("div", { className: "d3v-empty-icon" }, "◇"),
            h("div", null, s.loading ? "正在解析模型…" : "将 STL / 3MF 拖到这里"),
            h("div", { className: "d3v-empty-note" }, "或点击右上角“打开文件”"))),
        s.error && h("div", { className: "d3v-error" }, s.error),
        s.mesh && h("div", { className: "d3v-help" }, "拖动旋转 · 滚轮缩放 · 正交视图显示尺寸")),
      h("footer", { className: "d3v-footer" },
        s.mesh ? h(React.Fragment, null,
          h("span", { className: "d3v-stat" }, "三角面：", h("b", null, s.mesh.triangles.toLocaleString())),
          h("span", { className: "d3v-stat" }, "尺寸：", h("b", null, s.mesh.size.map(v => v.toFixed(2)).join(" × ") + " mm")),
          h("span", { className: "d3v-stat" }, "体积：", h("b", null, (s.mesh.volume / 1000).toFixed(2) + " cm³")),
          h(PrintInsights, { mesh: s.mesh }))
          : h("span", null, "支持二进制/ASCII STL，以及包含网格的 3MF"))));
}

function SessionAction({ sessionStore, openView }) {
  const s = useStore(sessionStore);
  if (!s.files.length) return null;
  return h("button", { type: "button", className: "d3v-session-btn", "data-dsh-3d-session-trigger": "", title: `预览 ${s.files.length} 个 3D 模型`, onClick: () => openView("3d-preview", s.selected || s.files[0].path) }, `◇ 3D 预览 (${s.files.length})`);
}

function SessionDrawer({ sessionStore, viewRequest, completeViewRequest }) {
  const s = useStore(sessionStore);
  const [reset, setReset] = React.useState(0), [query, setQuery] = React.useState("");
  const [view, setView] = React.useState(), [color, setColor] = React.useState(DEFAULT_COLOR);
  const selected = s.files.find(x => x.path === s.selected) || s.files[0];
  const shown = s.files.filter(f => f.path.toLowerCase().includes(query.trim().toLowerCase()));
  const load = React.useCallback(async path => {
    if (!path) return;
    sessionStore.set({ selected: path, loading: true, error: "" });
    try {
      const mesh = await readWorkspaceModel(path);
      const row = sessionStore.getSnapshot().files.find(x => x.path === path);
      sessionStore.set({ mesh, loading: false, mtime: row?.mtime || 0 });
      setReset(x => x + 1);
    } catch (e) {
      sessionStore.set({ mesh: null, loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  }, [sessionStore]);
  React.useEffect(() => {
    if (viewRequest?.view !== "3d-preview") return;
    if (viewRequest.focus) load(viewRequest.focus);
    completeViewRequest();
  }, [viewRequest]);
  React.useEffect(() => { if (selected && !s.mesh && !s.loading) load(selected.path); }, [selected?.path]);
  React.useEffect(() => {
    if (!selected) return;
    const timer = setInterval(async () => {
      try {
        const j = await fetch('/3d-model-viewer/files', { cache: 'no-store' }).then(r => r.json());
        const row = j.files.find(x => x.path === selected.path);
        if (row && row.mtime !== sessionStore.getSnapshot().mtime) { sessionStore.set({ files: j.files }); load(row.path); }
      } catch {}
    }, 1500);
    return () => clearInterval(timer);
  }, [selected?.path, load]);
  return h("div", { className: "d3v-drawer-body", "data-dsh-3d-drawer": "" },
    h("aside", { className: "d3v-browser" },
      h("div", { className: "d3v-search-wrap" },
        h("input", { className: "d3v-search", type: "search", placeholder: "搜索 3D 文件…", value: query, onChange: e => setQuery(e.target.value) })),
      h("div", { className: "d3v-files" },
        shown.map(f => h("button", {
          key: f.path, className: "d3v-file" + (f.path === selected?.path ? " active" : ""), title: f.path, onClick: () => load(f.path),
        },
          h("span", { className: "d3v-file-icon" }, f.name.toLowerCase().endsWith('.3mf') ? '3MF' : 'STL'),
          h("span", { className: "d3v-file-main" },
            h("span", { className: "d3v-file-name" }, f.name),
            h("span", { className: "d3v-file-meta" },
              h("span", null, fileSize(f.size)),
              h("span", null, new Date(f.mtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))))),
        !shown.length && h("div", { className: "d3v-empty-note", style: { padding: "12px" } }, "没有匹配文件")),
      h("div", { className: "d3v-browser-foot" }, `${shown.length} / ${s.files.length} 个模型`)),
    h("section", { className: "d3v-preview-column" },
      h("div", { className: "d3v-stage" },
        s.mesh && h(Viewer, { mesh: s.mesh, resetToken: reset, view, color }),
        s.mesh && h(ViewPresetBar, { onPick: (yaw, pitch, ortho) => setView({ yaw, pitch, ortho }), color, onPickColor: setColor }),
        s.loading && h("div", { className: "d3v-loading" }, "正在更新模型…"),
        s.error && h("div", { className: "d3v-error" }, s.error),
        s.mesh && h("div", { className: "d3v-help" }, "拖动旋转 · 滚轮缩放 · 文件变化时自动更新")),
      h("footer", { className: "d3v-footer" },
        s.mesh ? h(React.Fragment, null,
          h("span", { className: "d3v-live" }, "实时"),
          h("span", { className: "d3v-stat" }, "三角面：", h("b", null, s.mesh.triangles.toLocaleString())),
          h("span", { className: "d3v-stat" }, "尺寸：", h("b", null, s.mesh.size.map(v => v.toFixed(2)).join(" × ") + " mm")),
          h(PrintInsights, { mesh: s.mesh }),
          h("button", { className: "d3v-btn", onClick: () => setReset(x => x + 1) }, "重置视角"))
          : h("span", null, "暂无可预览模型"))));
}

export function SessionDrawerOverlay({ sessionStore, layoutStore }) {
  const s = useStore(layoutStore);
  if (!s.open) return null;
  return h("div", { className: "d3v-drawer-wrap" },
    h("div", { className: "d3v-drawer-backdrop", onClick: () => layoutStore.set({ open: false }) }),
    h("aside", { className: "d3v-drawer", role: "complementary", "aria-label": "3D 实时预览" },
      h("header", { className: "d3v-drawer-head" },
        h("div", { className: "d3v-title" }, "3D 实时预览"),
        h("div", { className: "d3v-spacer" }),
        h("button", { className: "d3v-btn d3v-close", onClick: () => layoutStore.set({ open: false }) }, "×")),
      h(SessionDrawer, { sessionStore, viewRequest: null, completeViewRequest: () => {} })));
}


function modelReferenceText(window) {
  let text = "";
  for (const entry of window?.entries || []) { try { text += "\n" + JSON.stringify(entry.event || entry).toLowerCase(); } catch {} }
  return text.replace(/\\\\/g, "/");
}

function sessionModels(all, text) {
  if (!text) return [];
  return all.filter(file => text.includes(file.name.toLowerCase()) || text.includes(file.path.toLowerCase().replace(/\\/g, "/")));
}

export function SessionBridge({ sessionId, sessions, stores, layoutStore }) {
  const sessionStore = stores.get(sessionId);
  const binding = sessions.binding(sessionId);
  const window = React.useSyncExternalStore(binding.eventSource.subscribe, binding.eventSource.getSnapshot, binding.eventSource.getSnapshot);
  const s = useStore(sessionStore);
  React.useEffect(() => {
    let live = true, timer;
    const refresh = async () => {
      try {
        const j = await fetch('/3d-model-viewer/files', { cache: 'no-store' }).then(r => r.json());
        if (!live) return;
        const eventText = modelReferenceText(binding.eventSource.getSnapshot());
        const pageText = (document.body.innerText + "\n" + [...document.querySelectorAll('[title]')].map(x => x.getAttribute('title') || '').join('\n')).toLowerCase();
        const files = sessionModels(j.files, eventText + "\n" + pageText);
        const current = sessionStore.getSnapshot();
        sessionStore.set({
          files,
          selected: files.some(x => x.path === current.selected) ? current.selected : (files[0]?.path || ""),
          ...(files.length ? {} : { mesh: null, error: "", loading: false, mtime: 0 }),
        });
      } catch {}
      timer = setTimeout(refresh, 1500);
    };
    refresh();
    return () => { live = false; clearTimeout(timer); };
  }, [sessionId, window.revision]);
  if (!s.files.length) return null;
  return h(SessionAction, {
    sessionStore,
    openView: (view, focus) => {
      layoutStore.set({ open: true, sessionId });
      if (focus && focus !== sessionStore.getSnapshot().selected) sessionStore.set({ selected: focus, mesh: null });
    },
  });
}

