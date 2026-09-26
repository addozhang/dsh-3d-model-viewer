// generated from src/ — run `npm run build` after editing
(() => {
  // src/core.js
  var React = null;
  var h = null;
  function setReact(react) {
    React = react;
    h = react.createElement;
  }
  function makeStore() {
    let state = { open: false, name: "", mesh: null, error: "", loading: false };
    const listeners = /* @__PURE__ */ new Set();
    return {
      getSnapshot: () => state,
      subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
      set: (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((fn) => fn());
      }
    };
  }
  function makeSessionStore() {
    let state = { files: [], selected: "", mesh: null, error: "", loading: false, mtime: 0 };
    const listeners = /* @__PURE__ */ new Set();
    return {
      getSnapshot: () => state,
      subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
      set: (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((fn) => fn());
      }
    };
  }
  var useStore = (store) => React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // src/styles.js
  var CSS = `
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
  function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.querySelector('style[data-plugin-css="dsh-3d-model-viewer"]')) return;
    const tag = document.createElement("style");
    tag.dataset.pluginCss = "dsh-3d-model-viewer";
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  // src/parse.js
  function toArrayBuffer(data) {
    if (data instanceof ArrayBuffer) return data;
    if (ArrayBuffer.isView(data)) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    if (data && typeof data === "object" && typeof data.byteLength === "number" && data.buffer) {
      return toArrayBuffer(data.buffer.slice(data.byteOffset ?? 0, (data.byteOffset ?? 0) + data.byteLength));
    }
    throw Error("\u65E0\u6CD5\u8BC6\u522B\u7684\u6587\u4EF6\u5185\u5BB9\u7C7B\u578B");
  }
  function finishMesh(data, triangles) {
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < data.length; i += 6) {
      for (let j = 0; j < 3; j++) {
        lo[j] = Math.min(lo[j], data[i + j]);
        hi[j] = Math.max(hi[j], data[i + j]);
      }
    }
    if (!Number.isFinite(lo[0])) throw Error("\u6A21\u578B\u5750\u6807\u65E0\u6548");
    const center = lo.map((x, i) => (x + hi[i]) / 2);
    const size = lo.map((x, i) => hi[i] - x);
    const radius = Math.hypot(...size) / 2 || 1;
    const volume = meshVolume(data);
    return { data, triangles, lo, hi, size, center, radius, volume };
  }
  function meshVolume(data) {
    let v = 0;
    for (let i = 0; i < data.length; i += 18) {
      const ax = data[i], ay = data[i + 1], az = data[i + 2];
      const bx = data[i + 6], by = data[i + 7], bz = data[i + 8];
      const cx = data[i + 12], cy = data[i + 13], cz = data[i + 14];
      v += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
    }
    return Math.abs(v / 6);
  }
  function parseBinaryStl(buf) {
    const dv = new DataView(buf);
    if (buf.byteLength < 84) throw Error("STL \u6587\u4EF6\u8FC7\u77ED");
    const n = dv.getUint32(80, true);
    if (n > 5e6) throw Error("\u6A21\u578B\u8D85\u8FC7 500 \u4E07\u4E09\u89D2\u9762\u9650\u5236");
    if (84 + n * 50 > buf.byteLength) throw Error("STL \u4E09\u89D2\u9762\u6570\u636E\u4E0D\u5B8C\u6574");
    const out = new Float32Array(n * 18);
    let p = 0;
    for (let i = 0, o = 84; i < n; i++, o += 50) {
      let nx = dv.getFloat32(o, true), ny = dv.getFloat32(o + 4, true), nz = dv.getFloat32(o + 8, true);
      const ax = dv.getFloat32(o + 12, true), ay = dv.getFloat32(o + 16, true), az = dv.getFloat32(o + 20, true);
      const bx = dv.getFloat32(o + 24, true), by = dv.getFloat32(o + 28, true), bz = dv.getFloat32(o + 32, true);
      const cx = dv.getFloat32(o + 36, true), cy = dv.getFloat32(o + 40, true), cz = dv.getFloat32(o + 44, true);
      if (!Number.isFinite(nx + ny + nz) || Math.hypot(nx, ny, nz) < 1e-8) {
        const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
        nx = uy * vz - uz * vy;
        ny = uz * vx - ux * vz;
        nz = ux * vy - uy * vx;
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l;
      ny /= l;
      nz /= l;
      for (const v of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) {
        out[p++] = v[0];
        out[p++] = v[1];
        out[p++] = v[2];
        out[p++] = nx;
        out[p++] = ny;
        out[p++] = nz;
      }
    }
    return finishMesh(out, n);
  }
  function parseAsciiStl(buf) {
    const text = new TextDecoder().decode(buf);
    const re = /facet\s+normal\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)[\s\S]*?outer\s+loop([\s\S]*?)endloop/gi;
    const a = [];
    let m;
    while (m = re.exec(text)) {
      const n = [+m[1], +m[2], +m[3]];
      const verts = [...m[4].matchAll(/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/gi)].slice(0, 3);
      if (verts.length === 3) for (const v of verts) a.push(+v[1], +v[2], +v[3], ...n);
    }
    if (!a.length) throw Error("\u65E0\u6CD5\u8BC6\u522B ASCII STL");
    return finishMesh(new Float32Array(a), a.length / 18);
  }
  function parseStl(buf) {
    if (buf.byteLength >= 84) {
      const n = new DataView(buf).getUint32(80, true);
      if (n > 0 && 84 + n * 50 === buf.byteLength) return parseBinaryStl(buf);
      const head = new TextDecoder().decode(buf.slice(0, 512));
      if (/^\s*solid/i.test(head) && /facet/i.test(head)) return parseAsciiStl(buf);
      if (n > 0 && 84 + n * 50 <= buf.byteLength) return parseBinaryStl(buf);
    }
    return parseAsciiStl(buf);
  }
  async function unzip(buf) {
    const u = new Uint8Array(buf), dv = new DataView(buf), u64 = (o) => Number(dv.getBigUint64(o, true));
    let e = -1;
    for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 101010256) {
      e = i;
      break;
    }
    if (e < 0) throw Error("3MF ZIP \u76EE\u5F55\u7F3A\u5931");
    let count = dv.getUint16(e + 10, true), cd = dv.getUint32(e + 16, true);
    if (cd === 4294967295 || count === 65535) {
      const loc = e - 20;
      if (loc < 0 || dv.getUint32(loc, true) !== 117853008) throw Error("3MF ZIP64 \u5B9A\u4F4D\u5668\u7F3A\u5931");
      const z = u64(loc + 8);
      if (dv.getUint32(z, true) !== 101075792) throw Error("3MF ZIP64 \u76EE\u5F55\u635F\u574F");
      count = u64(z + 32);
      cd = u64(z + 48);
    }
    const files = [];
    let p = cd;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 33639248) throw Error("3MF ZIP \u76EE\u5F55\u635F\u574F");
      const method = dv.getUint16(p + 10, true), rawSize = dv.getUint32(p + 20, true), unSize = dv.getUint32(p + 24, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      const rawLo = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u.slice(p + 46, p + 46 + nl));
      let size = rawSize, lo = rawLo, ep = p + 46 + nl, end = ep + xl;
      while (ep + 4 <= end) {
        const tag = dv.getUint16(ep, true), len = dv.getUint16(ep + 2, true), q = ep + 4;
        if (tag === 1) {
          let k = q;
          if (unSize === 4294967295) k += 8;
          if (rawSize === 4294967295) {
            size = u64(k);
            k += 8;
          }
          if (rawLo === 4294967295) lo = u64(k);
        }
        ep = q + len;
      }
      const lnl = dv.getUint16(lo + 26, true), lxl = dv.getUint16(lo + 28, true), start = lo + 30 + lnl + lxl;
      const raw = u.slice(start, start + size);
      let data;
      if (method === 0) data = raw;
      else if (method === 8) {
        if (typeof DecompressionStream === "undefined") throw Error("\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 3MF \u89E3\u538B");
        const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        data = new Uint8Array(await new Response(stream).arrayBuffer());
      } else throw Error("\u4E0D\u652F\u6301\u7684 ZIP \u538B\u7F29\u65B9\u5F0F " + method);
      files.push({ name, data });
      p += 46 + nl + xl + cl;
    }
    return files;
  }
  function parseHexColor(value) {
    if (typeof value !== "string") return null;
    const m = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (!m) return null;
    let hex = m[1];
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  }
  var MAT4_IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  function mat4FromTransform(text) {
    if (typeof text !== "string") return MAT4_IDENTITY;
    const parts = text.trim().split(/\s+/);
    if (parts.length === 0 || parts.length === 1 && parts[0] === "") return MAT4_IDENTITY;
    if (parts.length !== 12) throw Error(`3MF \u53D8\u6362\u9700\u8981 12 \u4E2A\u6570\u5B57\uFF0C\u5F97\u5230 ${parts.length}`);
    const m = parts.map(Number);
    for (const v of m) if (!Number.isFinite(v)) throw Error("3MF \u53D8\u6362\u5305\u542B\u975E\u6570\u5B57");
    return [m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, m[9], m[10], m[11], 1];
  }
  function mat4Mul(child, parent) {
    const out = new Array(16);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      out[r * 4 + c] = child[r * 4] * parent[c] + child[r * 4 + 1] * parent[4 + c] + child[r * 4 + 2] * parent[8 + c] + child[r * 4 + 3] * parent[12 + c];
    }
    return out;
  }
  function mat4Apply(m, x, y, z) {
    return [
      x * m[0] + y * m[4] + z * m[8] + m[12],
      x * m[1] + y * m[5] + z * m[9] + m[13],
      x * m[2] + y * m[6] + z * m[10] + m[14]
    ];
  }
  var P_NS = "http://schemas.microsoft.com/3dmanufacturing/production/2015/06";
  async function parse3mf(buf) {
    const files = await unzip(buf);
    const models = files.filter((f) => /\.model$/i.test(f.name));
    if (!models.length) throw Error("3MF \u4E2D\u6CA1\u6709 .model \u7F51\u683C");
    const registry = /* @__PURE__ */ new Map();
    for (const f of models) {
      const doc = new DOMParser().parseFromString(new TextDecoder().decode(f.data), "application/xml");
      if (doc.querySelector("parsererror")) continue;
      const factor = { micron: 1e-3, millimeter: 1, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1e3 }[doc.documentElement.getAttribute("unit")] || 1;
      const materialMap = {};
      for (const bm of doc.getElementsByTagNameNS("*", "basematerials")) {
        materialMap[bm.getAttribute("id")] = [...bm.getElementsByTagNameNS("*", "base")].map((base) => parseHexColor(base.getAttribute("color")));
      }
      const objects = /* @__PURE__ */ new Map();
      for (const obj of doc.getElementsByTagNameNS("*", "object")) {
        if (obj.getAttribute("id") !== null) objects.set(obj.getAttribute("id"), obj);
      }
      registry.set(f.name.replace(/^\//, ""), { doc, factor, materialMap, objects, name: f.name.replace(/^\//, "") });
    }
    let rootName = "3D/3dmodel.model";
    const rels = files.find((f) => f.name.replace(/^\//, "") === "_rels/.rels");
    if (rels) {
      try {
        const relDoc = new DOMParser().parseFromString(new TextDecoder().decode(rels.data), "application/xml");
        for (const rel of relDoc.getElementsByTagNameNS("*", "Relationship")) {
          if ((rel.getAttribute("Type") || "").endsWith("/3dmodel")) {
            rootName = (rel.getAttribute("Target") || "").replace(/^\//, "");
            break;
          }
        }
      } catch {
      }
    }
    const root = registry.get(rootName) || registry.get("3D/3dmodel.model");
    if (!root) throw Error("3MF \u4E2D\u627E\u4E0D\u5230\u6839\u6A21\u578B");
    const vals = [], cols = [];
    let triangles = 0, sawColor = false;
    const emitMesh = (mesh2, objEl, M, fileRec) => {
      const materialColors = objEl ? fileRec.materialMap[objEl.getAttribute("pid")] || null : null;
      const objColor = materialColors ? materialColors[+(objEl.getAttribute("pindex") || 0)] || null : null;
      const verts = [...mesh2.getElementsByTagNameNS("*", "vertex")].map((v) => [+v.getAttribute("x") * fileRec.factor, +v.getAttribute("y") * fileRec.factor, +v.getAttribute("z") * fileRec.factor]);
      for (const t of mesh2.getElementsByTagNameNS("*", "triangle")) {
        const ids = [+t.getAttribute("v1"), +t.getAttribute("v2"), +t.getAttribute("v3")];
        const raw = [verts[ids[0]], verts[ids[1]], verts[ids[2]]];
        if (!raw[0] || !raw[1] || !raw[2]) continue;
        const pts = raw.map((p) => M === MAT4_IDENTITY ? p : mat4Apply(M, p[0], p[1], p[2]));
        const [a, b, c] = pts;
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
        for (const p of pts) vals.push(p[0], p[1], p[2], nx / l, ny / l, nz / l);
        let color = objColor;
        const matid = t.getAttribute("matid");
        if (materialColors && matid !== null && materialColors[+matid - 1]) color = materialColors[+matid - 1];
        if (color) {
          sawColor = true;
          cols.push(color[0], color[1], color[2], color[0], color[1], color[2], color[0], color[1], color[2]);
        } else {
          cols.push(0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
        triangles++;
        if (triangles > 5e6) throw Error("\u6A21\u578B\u8D85\u8FC7 500 \u4E07\u4E09\u89D2\u9762\u9650\u5236");
      }
    };
    const emitObject = (fileRec, objId, M, visiting) => {
      const obj = fileRec.objects.get(objId);
      if (!obj) return;
      const key = fileRec.name + "#" + objId;
      if (visiting.has(key)) return;
      visiting.add(key);
      const mesh2 = obj.getElementsByTagNameNS("*", "mesh")[0] || null;
      if (mesh2) emitMesh(mesh2, obj, M, fileRec);
      for (const comp of obj.getElementsByTagNameNS("*", "component")) {
        const path = comp.getAttributeNS(P_NS, "path");
        const childRec = path ? registry.get(path.replace(/^\//, "")) : fileRec;
        if (!childRec) continue;
        const cm = mat4FromTransform(comp.getAttribute("transform"));
        const combined = M === MAT4_IDENTITY && cm === MAT4_IDENTITY ? MAT4_IDENTITY : mat4Mul(cm, M);
        emitObject(childRec, comp.getAttribute("objectid"), combined, visiting);
      }
      visiting.delete(key);
    };
    const items = [...root.doc.getElementsByTagNameNS("*", "item")];
    if (items.length) {
      for (const item of items) {
        emitObject(root, item.getAttribute("objectid"), mat4FromTransform(item.getAttribute("transform")), /* @__PURE__ */ new Set());
      }
    } else {
      for (const id of root.objects.keys()) emitObject(root, id, MAT4_IDENTITY, /* @__PURE__ */ new Set());
    }
    if (!triangles) throw Error("3MF \u4E2D\u6CA1\u6709\u53EF\u663E\u793A\u7684\u4E09\u89D2\u7F51\u683C");
    const mesh = finishMesh(new Float32Array(vals), triangles);
    if (sawColor) mesh.colors = new Float32Array(cols);
    return mesh;
  }

  // src/viewer.js
  var VS = `attribute vec3 p;attribute vec3 n;attribute vec3 col;uniform mat4 mvp;uniform mat4 model;varying vec3 vn;varying vec3 vc;void main(){gl_Position=mvp*vec4(p,1.);vn=mat3(model)*n;vc=col;}`;
  var FS = `precision mediump float;varying vec3 vn;varying vec3 vc;uniform vec3 uColor;uniform float uUseVColor;void main(){vec3 N=normalize(vn);vec3 L=normalize(vec3(.5,.8,1.));float d=max(dot(N,L),0.);float rim=pow(1.-abs(N.z),2.);vec3 base=mix(uColor,vc,uUseVColor);vec3 c=base*(.28+.72*d)+rim*vec3(.08,.18,.28);gl_FragColor=vec4(c,1.);}`;
  var DEFAULT_COLOR = [0.18, 0.62, 0.95];
  var COLOR_PRESETS = [["\u84DD", [0.18, 0.62, 0.95]], ["\u6A59", [0.95, 0.55, 0.18]], ["\u7EFF", [0.25, 0.7, 0.4]], ["\u7EA2", [0.9, 0.3, 0.3]], ["\u7D2B", [0.6, 0.4, 0.9]], ["\u7070", [0.62, 0.65, 0.68]], ["\u767D", [0.93, 0.94, 0.96]]];
  var VIEW_PRESETS = [
    ["front", "\u524D", [0, Math.PI / 2, true]],
    ["back", "\u540E", [Math.PI, Math.PI / 2, true]],
    ["left", "\u5DE6", [-Math.PI / 2, 0, true]],
    ["right", "\u53F3", [Math.PI / 2, 0, true]],
    ["top", "\u9876", [0, 0, true]],
    ["bottom", "\u5E95", [0, Math.PI, true]],
    ["iso", "\u7B49\u8F74\u6D4B", [Math.PI / 4, -0.6155, false]]
  ];
  var PRINTER_PROFILES = [
    ["X2D", 256, 256, 260],
    ["H2D", 350, 320, 325],
    ["X1C / P1", 256, 256, 256],
    ["A1", 256, 210, 210],
    ["A1 mini", 180, 180, 180]
  ];
  var MATERIALS = [["PLA", 1.24], ["PETG", 1.27], ["PC", 1.2], ["ABS", 1.04], ["TPU", 1.21]];
  var INFILL_OPTIONS = [10, 15, 20, 30, 50, 100];
  var rgbCss = (c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
  var hexCss = (c) => "#" + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
  var sameColor = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);
  var SCREENSHOT_EVENT = "dsh-3d-model-shot";
  function shader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) || "\u7740\u8272\u5668\u7F16\u8BD1\u5931\u8D25");
    return s;
  }
  var mul = (a, b) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  };
  var rx = (a) => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
  var ry = (a) => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
  var buildRot = (yaw, pitch) => mul(ry(yaw), rx(pitch));
  var DEFAULT_ROT = () => buildRot(0.65, -0.45);
  var orthoHalfSize = (zoom) => 1.15 * (zoom / 5.5);
  function perspective(aspect) {
    const f = 1 / Math.tan(Math.PI / 8), near = 0.01, far = 100;
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
  }
  function orthographic(aspect, k) {
    const near = 0.01, far = 100;
    return new Float32Array([1 / (k * aspect), 0, 0, 0, 0, 1 / k, 0, 0, 0, 0, -2 / (far - near), 0, 0, 0, -(far + near) / (far - near), 1]);
  }
  function projectPoint(mvp, p, w, hh) {
    const x = p[0], y = p[1], z = p[2];
    const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
    const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
    const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15] || 1;
    return [(cx / cw * 0.5 + 0.5) * w, (0.5 - cy / cw * 0.5) * hh];
  }
  function ViewPresetBar({ onPick, color, onPickColor }) {
    return h(
      "div",
      { className: "d3v-viewtools", "data-dsh-3d-views": "" },
      h(
        "div",
        { className: "d3v-views" },
        VIEW_PRESETS.map(([k, label, ang]) => h("button", {
          key: k,
          type: "button",
          className: "d3v-view-btn",
          title: `${label}\uFF08${ang[2] ? "\u6B63\u4EA4" : "\u900F\u89C6"}\uFF0C\u5FEB\u6377\u952E ${VIEW_PRESETS.findIndex((p) => p[0] === k) + 1}\uFF09`,
          onPointerDown: (e) => e.stopPropagation(),
          onClick: () => onPick(ang[0], ang[1], ang[2])
        }, label)),
        h("button", {
          type: "button",
          className: "d3v-view-btn",
          title: "\u5BFC\u51FA\u5F53\u524D\u89C6\u56FE\u4E3A PNG",
          onPointerDown: (e) => e.stopPropagation(),
          onClick: () => {
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SCREENSHOT_EVENT));
          }
        }, "\u622A\u56FE")
      ),
      onPickColor && h(
        "div",
        { className: "d3v-colors" },
        COLOR_PRESETS.map(([label, c]) => h("button", {
          key: label,
          type: "button",
          className: "d3v-swatch" + (sameColor(color, c) ? " active" : ""),
          title: label,
          style: { background: rgbCss(c) },
          onPointerDown: (e) => e.stopPropagation(),
          onClick: () => onPickColor(c)
        })),
        h("input", {
          type: "color",
          className: "d3v-color-native",
          title: "\u81EA\u5B9A\u4E49\u989C\u8272",
          "aria-label": "\u81EA\u5B9A\u4E49\u6A21\u578B\u989C\u8272",
          value: hexCss(color),
          onPointerDown: (e) => e.stopPropagation(),
          onChange: (e) => {
            const m = e.target.value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (m) onPickColor([parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]);
          }
        })
      )
    );
  }
  var DIM_ANCHORS = (lo, hi, margin) => [
    ["x", [(lo[0] + hi[0]) / 2, lo[1] - margin, lo[2]]],
    ["y", [hi[0] + margin, (lo[1] + hi[1]) / 2, lo[2]]],
    ["z", [hi[0] + margin, lo[1], (lo[2] + hi[2]) / 2]]
  ];
  function Viewer({ mesh, resetToken, view, color }) {
    const ref = React.useRef(null);
    const orient = React.useRef({ rot: DEFAULT_ROT(), ortho: false });
    const pan = React.useRef([0, 0]);
    const redraw = React.useRef(() => {
    });
    const colorRef = React.useRef(null);
    React.useEffect(() => {
      if (!view) return;
      orient.current = { rot: buildRot(view.yaw, view.pitch), ortho: !!view.ortho };
      pan.current = [0, 0];
      redraw.current();
    }, [view]);
    React.useEffect(() => {
      if (!color) return;
      colorRef.current = color;
      redraw.current();
    }, [color]);
    React.useEffect(() => {
      const canvas = ref.current;
      if (!canvas || !mesh) return;
      const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
      if (!gl) return;
      let program, buff, colBuff = null, raf = 0, down = false, mode = "rotate", lx = 0, ly = 0, zoom = 5.5, shotPending = false;
      let lastModel = null;
      pan.current = [0, 0];
      const host = canvas.parentElement;
      const labelsBox = document.createElement("div");
      labelsBox.className = "d3v-labels";
      const labelEls = {};
      for (const axis of ["x", "y", "z"]) {
        const el = document.createElement("span");
        el.className = "d3v-dim d3v-dim-" + axis;
        el.style.display = "none";
        labelsBox.appendChild(el);
        labelEls[axis] = el;
      }
      if (host) host.appendChild(labelsBox);
      try {
        program = gl.createProgram();
        gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, VS));
        gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) || "\u7740\u8272\u5668\u94FE\u63A5\u5931\u8D25");
        buff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
        const ps = gl.getAttribLocation(program, "p"), ns = gl.getAttribLocation(program, "n"), cs = gl.getAttribLocation(program, "col");
        gl.enableVertexAttribArray(ps);
        gl.vertexAttribPointer(ps, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(ns);
        gl.vertexAttribPointer(ns, 3, gl.FLOAT, false, 24, 12);
        if (mesh.colors) {
          colBuff = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, colBuff);
          gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(cs);
          gl.vertexAttribPointer(cs, 3, gl.FLOAT, false, 12, 0);
        }
      } catch (e) {
        console.error(e);
        return;
      }
      const savePng = () => {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${mesh.name || "model"}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "")}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 5e3);
        });
      };
      const draw = () => {
        raf = 0;
        const o = orient.current, rot = o.rot;
        const d = Math.min(devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * d)), hh = Math.max(1, Math.round(canvas.clientHeight * d));
        if (canvas.width !== w || canvas.height !== hh) {
          canvas.width = w;
          canvas.height = hh;
        }
        gl.viewport(0, 0, w, hh);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const aspect = w / hh;
        const proj = o.ortho ? orthographic(aspect, orthoHalfSize(zoom)) : perspective(aspect);
        const scale = 1 / mesh.radius;
        const model = new Float32Array(rot);
        for (const idx of [0, 1, 2, 4, 5, 6, 8, 9, 10]) model[idx] *= scale;
        model[12] = -(model[0] * mesh.center[0] + model[4] * mesh.center[1] + model[8] * mesh.center[2]) + pan.current[0];
        model[13] = -(model[1] * mesh.center[0] + model[5] * mesh.center[1] + model[9] * mesh.center[2]) + pan.current[1];
        model[14] = -(model[2] * mesh.center[0] + model[6] * mesh.center[1] + model[10] * mesh.center[2]) - zoom;
        lastModel = model;
        gl.useProgram(program);
        const col = colorRef.current || DEFAULT_COLOR;
        gl.uniform3f(gl.getUniformLocation(program, "uColor"), col[0], col[1], col[2]);
        gl.uniform1f(gl.getUniformLocation(program, "uUseVColor"), mesh.colors ? 1 : 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, model);
        const mvp = mul(proj, model);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mvp"), false, mvp);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.data.length / 6);
        if (o.ortho) {
          const m = mesh.radius * 0.18;
          const inPlane = {
            x: Math.abs(rot[2]) < 0.9,
            y: Math.abs(rot[6]) < 0.9,
            z: Math.abs(rot[10]) < 0.9
          };
          const anchors = DIM_ANCHORS(mesh.lo, mesh.hi, m);
          for (const [axis, point] of anchors) {
            const el = labelEls[axis];
            if (!inPlane[axis]) {
              el.style.display = "none";
              continue;
            }
            const [sx, sy] = projectPoint(mvp, point, canvas.clientWidth, canvas.clientHeight);
            el.style.display = "";
            el.style.left = sx + "px";
            el.style.top = sy + "px";
            el.textContent = mesh.size[axis === "x" ? 0 : axis === "y" ? 1 : 2].toFixed(2);
          }
        } else {
          for (const el of Object.values(labelEls)) el.style.display = "none";
        }
        if (shotPending) {
          shotPending = false;
          savePng();
        }
      };
      const request = () => {
        if (!raf) raf = requestAnimationFrame(draw);
      };
      redraw.current = request;
      const panScale = () => {
        const rect = canvas.getBoundingClientRect();
        const hpx = rect.height || 1;
        return orient.current.ortho ? 2 * orthoHalfSize(zoom) / hpx : 2 * Math.tan(Math.PI / 8) * zoom / hpx;
      };
      const pd = (e) => {
        down = true;
        lx = e.clientX;
        ly = e.clientY;
        mode = e.button === 2 || e.button === 1 || e.shiftKey ? "pan" : "rotate";
        canvas.style.cursor = mode === "rotate" ? "grabbing" : "move";
        canvas.setPointerCapture(e.pointerId);
      };
      const pm = (e) => {
        if (!down) return;
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
        if (mode === "rotate") {
          const k = 0.01;
          orient.current.rot = mul(ry(dx * k), mul(rx(dy * k), orient.current.rot));
          orient.current.ortho = false;
        } else {
          const s = panScale();
          pan.current[0] += dx * s;
          pan.current[1] -= dy * s;
        }
        request();
      };
      const pu = () => {
        down = false;
        canvas.style.cursor = "";
      };
      const wh = (e) => {
        e.preventDefault();
        zoom = Math.max(1.2, Math.min(20, zoom * Math.exp(e.deltaY * 1e-3)));
        request();
      };
      const applyPreset = ([, , [yaw, pitch, ortho]]) => {
        orient.current = { rot: buildRot(yaw, pitch), ortho };
        pan.current = [0, 0];
        request();
      };
      const reset = () => {
        orient.current = { rot: DEFAULT_ROT(), ortho: false };
        pan.current = [0, 0];
        request();
      };
      const key = (e) => {
        const idx = parseInt(e.key, 10);
        if (idx >= 1 && idx <= VIEW_PRESETS.length) {
          e.preventDefault();
          applyPreset(VIEW_PRESETS[idx - 1]);
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          reset();
        }
      };
      const shot = () => {
        if (canvas.clientWidth === 0) return;
        shotPending = true;
        request();
      };
      const noMenu = (e) => e.preventDefault();
      const dbl = () => {
        orient.current = { rot: DEFAULT_ROT(), ortho: false };
        pan.current = [0, 0];
        request();
      };
      canvas.addEventListener("contextmenu", noMenu);
      canvas.addEventListener("dblclick", dbl);
      canvas.addEventListener("pointerdown", pd);
      canvas.addEventListener("pointermove", pm);
      canvas.addEventListener("pointerup", pu);
      canvas.addEventListener("pointercancel", pu);
      canvas.addEventListener("wheel", wh, { passive: false });
      canvas.addEventListener("keydown", key);
      window.addEventListener(SCREENSHOT_EVENT, shot);
      const ro = new ResizeObserver(request);
      ro.observe(canvas);
      request();
      return () => {
        redraw.current = () => {
        };
        cancelAnimationFrame(raf);
        ro.disconnect();
        labelsBox.remove();
        canvas.removeEventListener("contextmenu", noMenu);
        canvas.removeEventListener("dblclick", dbl);
        canvas.removeEventListener("pointerdown", pd);
        canvas.removeEventListener("pointermove", pm);
        canvas.removeEventListener("pointerup", pu);
        canvas.removeEventListener("pointercancel", pu);
        canvas.removeEventListener("wheel", wh);
        canvas.removeEventListener("keydown", key);
        window.removeEventListener(SCREENSHOT_EVENT, shot);
        if (buff) gl.deleteBuffer(buff);
        if (colBuff) gl.deleteBuffer(colBuff);
        if (program) gl.deleteProgram(program);
      };
    }, [mesh, resetToken]);
    return h("canvas", {
      ref,
      className: "d3v-canvas",
      "data-dsh-3d-canvas": "",
      tabIndex: 0,
      role: "img",
      "aria-label": "3D \u6A21\u578B\u89C6\u56FE\uFF1A\u5DE6\u952E\u62D6\u52A8\u65CB\u8F6C\uFF0C\u53F3\u952E\u6216 Shift \u62D6\u52A8\u5E73\u79FB\uFF0C\u6EDA\u8F6E\u7F29\u653E\uFF0C\u53CC\u51FB\u590D\u4F4D",
      onKeyDown: (e) => e.stopPropagation(),
      style: { outline: "none" }
    });
  }

  // src/ui.js
  var M3D_DOC_ID = "@addozhang/dsh-3d-model-viewer/model3d";
  function docFileName(address) {
    try {
      const m = decodeURIComponent(String(address)).match(/\/([^\/?#]+)$/);
      return m ? m[1] : "";
    } catch {
      return "";
    }
  }
  function fileSize(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1048576).toFixed(1)} MB`;
  }
  var PRINT_INSIGHTS_ENABLED = false;
  function PrintInsights({ mesh }) {
    const [printer, setPrinter] = React.useState(PRINTER_PROFILES[0][0]);
    const [material, setMaterial] = React.useState(MATERIALS[0][0]);
    const [infill, setInfill] = React.useState(15);
    const prof = PRINTER_PROFILES.find((p) => p[0] === printer) || PRINTER_PROFILES[0];
    const fits = mesh.size[0] <= prof[1] && mesh.size[1] <= prof[2] && mesh.size[2] <= prof[3];
    const density = (MATERIALS.find((m) => m[0] === material) || MATERIALS[0])[1];
    const volCm3 = mesh.volume / 1e3;
    const grams = volCm3 * density * (infill / 100 + (1 - infill / 100) * 0.25);
    const select = (value, onChange, options, label) => h("label", null, label + " ", h(
      "select",
      { value, onChange: (e) => onChange(e.target.value) },
      options.map((o) => h("option", { key: o.value, value: o.value }, o.label))
    ));
    return h(
      "div",
      { className: "d3v-check" },
      h(
        "span",
        { className: fits ? "d3v-check-ok" : "d3v-check-warn" },
        fits ? `\u2713 \u9002\u914D ${printer}` : `\u26A0 \u8D85\u51FA ${printer} (${prof[1]}\xD7${prof[2]}\xD7${prof[3]})`
      ),
      select(printer, setPrinter, PRINTER_PROFILES.map((p) => ({ value: p[0], label: `${p[0]} ${p[1]}\xD7${p[2]}\xD7${p[3]}` })), "\u6253\u5370\u673A"),
      h("span", null, `\u4F53\u79EF ${volCm3.toFixed(2)} cm\xB3`),
      select(material, setMaterial, MATERIALS.map((m) => ({ value: m[0], label: m[0] })), "\u6750\u6599"),
      select(String(infill), (v) => setInfill(+v), INFILL_OPTIONS.map((v) => ({ value: String(v), label: v + "%" })), "\u586B\u5145"),
      h("span", null, `\u2248 ${grams.toFixed(1)} g`)
    );
  }
  function Model3dBody({ content, resourceAddress, t }) {
    const tt = (key, params) => {
      try {
        if (typeof t === "function") return t(key, params);
      } catch {
      }
      return key;
    };
    const name = docFileName(resourceAddress), is3mf = /\.3mf$/i.test(name);
    const bytes = content && content.kind === "bytes" ? content.data : void 0;
    const [state, setState] = React.useState({ status: bytes ? "loading" : "waiting" });
    const [view, setView] = React.useState();
    const [color, setColor] = React.useState(DEFAULT_COLOR);
    React.useEffect(() => {
      if (!bytes) return;
      let live = true;
      setState({ status: "loading" });
      Promise.resolve().then(() => {
        const buf = toArrayBuffer(bytes);
        return is3mf ? parse3mf(buf) : parseStl(buf);
      }).then((mesh) => {
        mesh.name = name;
        if (live) setState({ status: "ready", mesh });
      }).catch((e) => {
        if (live) setState({ status: "error", message: e instanceof Error ? e.message : String(e) });
      });
      return () => {
        live = false;
      };
    }, [bytes, is3mf]);
    return h(
      "div",
      { className: "d3v-doc", "data-dsh-3d-docbody": "" },
      state.status === "ready" && h(Viewer, { mesh: state.mesh, resetToken: 0, view, color }),
      state.status === "ready" && h(ViewPresetBar, { onPick: (yaw, pitch, ortho) => setView({ yaw, pitch, ortho }), color, onPickColor: setColor }),
      state.status === "loading" && h("div", { className: "d3v-doc-status" }, tt("loading")),
      state.status === "waiting" && h("div", { className: "d3v-doc-status" }, tt("waiting")),
      state.status === "error" && h("div", { className: "d3v-error" }, tt("failed", { message: state.message })),
      state.status === "ready" && h(
        "div",
        { className: "d3v-doc-foot" },
        h(
          "div",
          { className: "d3v-doc-stats" },
          `${name} \xB7 ${state.mesh.triangles.toLocaleString()} \u25B3 \xB7 ${state.mesh.size.map((v) => v.toFixed(1)).join(" \xD7 ")} mm`
        ),
        PRINT_INSIGHTS_ENABLED && h(PrintInsights, { mesh: state.mesh })
      ),
      state.status === "ready" && h("div", { className: "d3v-help" }, "\u5DE6\u952E\u65CB\u8F6C \xB7 \u53F3\u952E/Shift \u5E73\u79FB \xB7 \u6EDA\u8F6E\u7F29\u653E \xB7 \u53CC\u51FB\u590D\u4F4D")
    );
  }
  async function readWorkspaceModel(path) {
    const r = await fetch(`/3d-model-viewer/files?path=${encodeURIComponent(path)}`, { cache: "no-store" });
    if (!r.ok) throw Error(`\u8BFB\u53D6\u6A21\u578B\u5931\u8D25\uFF08HTTP ${r.status}\uFF09`);
    const buf = await r.arrayBuffer();
    return path.toLowerCase().endsWith(".3mf") ? parse3mf(buf) : parseStl(buf);
  }
  function SessionAction({ sessionStore, openView }) {
    const s = useStore(sessionStore);
    if (!s.files.length) return null;
    return h("button", { type: "button", className: "d3v-session-btn", "data-dsh-3d-session-trigger": "", title: `\u9884\u89C8 ${s.files.length} \u4E2A 3D \u6A21\u578B`, onClick: () => openView("3d-preview", s.selected || s.files[0].path) }, `\u25C7 3D \u9884\u89C8 (${s.files.length})`);
  }
  function SessionDrawer({ sessionStore, viewRequest, completeViewRequest }) {
    const s = useStore(sessionStore);
    const [reset, setReset] = React.useState(0), [query, setQuery] = React.useState("");
    const [view, setView] = React.useState(), [color, setColor] = React.useState(DEFAULT_COLOR);
    const selected = s.files.find((x) => x.path === s.selected) || s.files[0];
    const shown = s.files.filter((f) => f.path.toLowerCase().includes(query.trim().toLowerCase()));
    const load = React.useCallback(async (path) => {
      if (!path) return;
      sessionStore.set({ selected: path, loading: true, error: "" });
      try {
        const mesh = await readWorkspaceModel(path);
        mesh.name = path.split("/").pop();
        const row = sessionStore.getSnapshot().files.find((x) => x.path === path);
        sessionStore.set({ mesh, loading: false, mtime: row?.mtime || 0 });
        setReset((x) => x + 1);
      } catch (e) {
        sessionStore.set({ mesh: null, loading: false, error: e instanceof Error ? e.message : String(e) });
      }
    }, [sessionStore]);
    React.useEffect(() => {
      if (viewRequest?.view !== "3d-preview") return;
      if (viewRequest.focus) load(viewRequest.focus);
      completeViewRequest();
    }, [viewRequest]);
    React.useEffect(() => {
      if (selected && !s.mesh && !s.loading) load(selected.path);
    }, [selected?.path]);
    React.useEffect(() => {
      if (!selected) return;
      const timer = setInterval(async () => {
        try {
          const j = await fetch("/3d-model-viewer/files", { cache: "no-store" }).then((r) => r.json());
          const row = j.files.find((x) => x.path === selected.path);
          if (row && row.mtime !== sessionStore.getSnapshot().mtime) {
            sessionStore.set({ files: j.files });
            load(row.path);
          }
        } catch {
        }
      }, 1500);
      return () => clearInterval(timer);
    }, [selected?.path, load]);
    return h(
      "div",
      { className: "d3v-drawer-body", "data-dsh-3d-drawer": "" },
      h(
        "aside",
        { className: "d3v-browser" },
        h(
          "div",
          { className: "d3v-search-wrap" },
          h("input", { className: "d3v-search", type: "search", placeholder: "\u641C\u7D22 3D \u6587\u4EF6\u2026", value: query, onChange: (e) => setQuery(e.target.value) })
        ),
        h(
          "div",
          { className: "d3v-files" },
          shown.map((f) => h(
            "button",
            {
              key: f.path,
              className: "d3v-file" + (f.path === selected?.path ? " active" : ""),
              title: f.path,
              onClick: () => load(f.path)
            },
            h("span", { className: "d3v-file-icon" }, f.name.toLowerCase().endsWith(".3mf") ? "3MF" : "STL"),
            h(
              "span",
              { className: "d3v-file-main" },
              h("span", { className: "d3v-file-name" }, f.name),
              h(
                "span",
                { className: "d3v-file-meta" },
                h("span", null, fileSize(f.size)),
                h("span", null, new Date(f.mtime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
              )
            )
          )),
          !shown.length && h("div", { className: "d3v-empty-note", style: { padding: "12px" } }, "\u6CA1\u6709\u5339\u914D\u6587\u4EF6")
        ),
        h("div", { className: "d3v-browser-foot" }, `${shown.length} / ${s.files.length} \u4E2A\u6A21\u578B`)
      ),
      h(
        "section",
        { className: "d3v-preview-column" },
        h(
          "div",
          { className: "d3v-stage" },
          s.mesh && h(Viewer, { mesh: s.mesh, resetToken: reset, view, color }),
          s.mesh && h(ViewPresetBar, { onPick: (yaw, pitch, ortho) => setView({ yaw, pitch, ortho }), color, onPickColor: setColor }),
          s.loading && h("div", { className: "d3v-loading" }, "\u6B63\u5728\u66F4\u65B0\u6A21\u578B\u2026"),
          s.error && h("div", { className: "d3v-error" }, s.error),
          s.mesh && h("div", { className: "d3v-help" }, "\u5DE6\u952E\u65CB\u8F6C \xB7 \u53F3\u952E/Shift \u5E73\u79FB \xB7 \u6EDA\u8F6E\u7F29\u653E \xB7 \u53CC\u51FB\u590D\u4F4D \xB7 \u6587\u4EF6\u53D8\u5316\u81EA\u52A8\u66F4\u65B0")
        ),
        h(
          "footer",
          { className: "d3v-footer" },
          s.mesh ? h(
            React.Fragment,
            null,
            h("span", { className: "d3v-live" }, "\u5B9E\u65F6"),
            h("span", { className: "d3v-stat" }, "\u4E09\u89D2\u9762\uFF1A", h("b", null, s.mesh.triangles.toLocaleString())),
            h("span", { className: "d3v-stat" }, "\u5C3A\u5BF8\uFF1A", h("b", null, s.mesh.size.map((v) => v.toFixed(2)).join(" \xD7 ") + " mm")),
            PRINT_INSIGHTS_ENABLED && h(PrintInsights, { mesh: s.mesh }),
            h("button", { className: "d3v-btn", onClick: () => setReset((x) => x + 1) }, "\u91CD\u7F6E\u89C6\u89D2")
          ) : h("span", null, "\u6682\u65E0\u53EF\u9884\u89C8\u6A21\u578B")
        )
      )
    );
  }
  function SessionDrawerOverlay({ sessionStore, layoutStore }) {
    const s = useStore(layoutStore);
    if (!s.open) return null;
    return h(
      "div",
      { className: "d3v-drawer-wrap" },
      h("div", { className: "d3v-drawer-backdrop", onClick: () => layoutStore.set({ open: false }) }),
      h(
        "aside",
        { className: "d3v-drawer", role: "complementary", "aria-label": "3D \u5B9E\u65F6\u9884\u89C8" },
        h(
          "header",
          { className: "d3v-drawer-head" },
          h("div", { className: "d3v-title" }, "3D \u5B9E\u65F6\u9884\u89C8"),
          h("div", { className: "d3v-spacer" }),
          h("button", { className: "d3v-btn d3v-close", onClick: () => layoutStore.set({ open: false }) }, "\xD7")
        ),
        h(SessionDrawer, { sessionStore, viewRequest: null, completeViewRequest: () => {
        } })
      )
    );
  }
  function modelReferenceText(window2) {
    let text = "";
    for (const entry of window2?.entries || []) {
      try {
        text += "\n" + JSON.stringify(entry.event || entry).toLowerCase();
      } catch {
      }
    }
    return text.replace(/\\\\/g, "/");
  }
  function sessionModels(all, text) {
    if (!text) return [];
    return all.filter((file) => text.includes(file.name.toLowerCase()) || text.includes(file.path.toLowerCase().replace(/\\/g, "/")));
  }
  function SessionBridge({ sessionId, sessions, stores, layoutStore }) {
    const sessionStore = stores.get(sessionId);
    const binding = sessions.binding(sessionId);
    const window2 = React.useSyncExternalStore(
      binding.eventSource.subscribe.bind(binding.eventSource),
      () => binding.eventSource.getSnapshot(),
      () => binding.eventSource.getSnapshot()
    );
    const s = useStore(sessionStore);
    React.useEffect(() => {
      let live = true, timer;
      const refresh = async () => {
        try {
          const j = await fetch("/3d-model-viewer/files", { cache: "no-store" }).then((r) => r.json());
          if (!live) return;
          const eventText = modelReferenceText(binding.eventSource.getSnapshot());
          const pageText = (document.body.innerText + "\n" + [...document.querySelectorAll("[title]")].map((x) => x.getAttribute("title") || "").join("\n")).toLowerCase();
          const files = sessionModels(j.files, eventText + "\n" + pageText);
          const current = sessionStore.getSnapshot();
          sessionStore.set({
            files,
            selected: files.some((x) => x.path === current.selected) ? current.selected : files[0]?.path || "",
            ...files.length ? {} : { mesh: null, error: "", loading: false, mtime: 0 }
          });
        } catch {
        }
        timer = setTimeout(refresh, 1500);
      };
      refresh();
      return () => {
        live = false;
        clearTimeout(timer);
      };
    }, [sessionId, window2.revision]);
    if (!s.files.length) return null;
    return h(SessionAction, {
      sessionStore,
      openView: (view, focus) => {
        layoutStore.set({ open: true, sessionId });
        if (focus && focus !== sessionStore.getSnapshot().selected) sessionStore.set({ selected: focus, mesh: null });
      }
    });
  }

  // src/app.js
  var INJECT = ["slots", "sessions", "locale", "documentPreviews"];
  function apply(ctx) {
    injectStyles();
    const layoutStore = makeStore();
    const sessionStores = /* @__PURE__ */ new Map();
    const stores = {
      get(id) {
        let s = sessionStores.get(id);
        if (!s) {
          s = makeSessionStore();
          sessionStores.set(id, s);
        }
        return s;
      }
    };
    function ActiveDrawer() {
      const layout = useStore(layoutStore);
      const list = React.useSyncExternalStore(ctx.sessions.list.subscribe, ctx.sessions.list.getSnapshot, ctx.sessions.list.getSnapshot);
      const id = layout.sessionId || list.current;
      const sessionStore = id ? stores.get(id) : makeSessionStore();
      return h(SessionDrawerOverlay, { sessionStore, layoutStore });
    }
    ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register(
      { name: "conversation.session.header.actions", id: "3d-model-preview-action", order: 70, inject: (owner) => ({ sessions: ctx.sessions, stores, layoutStore }) },
      SessionBridge
    ));
    ctx.slots.inject("shell.overlay", () => ctx.slots.register(
      { name: "shell.overlay", id: "3d-session-preview-drawer", order: 70 },
      ActiveDrawer
    ));
    const t = ctx.locale.bind("dsh3dDoc");
    ctx.effect(() => ctx.locale.register("dsh3dDoc", {
      zh: { title: "3D \u6A21\u578B", loading: "\u6B63\u5728\u89E3\u6790\u6A21\u578B\u2026", waiting: "\u7B49\u5F85\u6587\u4EF6\u5185\u5BB9\u2026", failed: "\u65E0\u6CD5\u89E3\u6790\u8FD9\u4E2A\u6A21\u578B\uFF1A{message}" },
      en: { title: "3D Model", loading: "Parsing model\u2026", waiting: "Waiting for file contents\u2026", failed: "This model could not be parsed: {message}" }
    }), "3d-model-viewer: doc dictionaries");
    ctx.effect(() => ctx.documentPreviews.register({
      id: M3D_DOC_ID,
      extensions: ["stl", "3mf"],
      binaryExtensions: ["stl", "3mf"],
      priority: "extension",
      title: () => t("title"),
      loading: "bytes-complete",
      wrap: false
    }), "3d-model-viewer: doc metadata");
    ctx.slots.inject("sidebar.right.tab.document", () => ctx.slots.register(
      { name: "sidebar.right.tab.document", key: M3D_DOC_ID, locale: "dsh3dDoc" },
      Model3dBody
    ));
  }

  // src/entry-client.js
  injectStyles();
  window.__ModuleLoader__.load({
    id: "@addozhang/dsh-3d-model-viewer",
    factory: (require2) => {
      setReact(require2("react"));
      const module = { exports: {} };
      module.exports.inject = INJECT;
      module.exports.apply = apply;
      return module.exports;
    }
  });
})();
