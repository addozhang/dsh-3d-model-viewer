// Integration-style smoke test: loads the built bundle with DOM/React stubs,
// runs apply(), renders the document body with a real STL, and exercises the
// view-preset and color toolbars.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setReact } from "../src/core.js";

function makeStubReact() {
  const states = []; let calls = 0;
  const flat = (cs) => cs.flat(3);
  const R = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: flat(children) }),
    Fragment: "Fragment",
    useRef: () => ({ current: null }),
    useState: (v) => { const i = calls++; if (states[i] === undefined) states[i] = typeof v === "function" ? v() : v; return [states[i], (x) => { states[i] = typeof x === "function" ? x(states[i]) : x; }]; },
    useEffect: (fn) => { try { fn(); } catch (e) { console.error("effect threw:", e.message); } return () => {}; },
    useSyncExternalStore: (s, g) => g(),
    useCallback: (fn) => fn,
  };
  R.reset = () => { calls = 0; };
  R.states = states;
  return R;
}

function stubDom() {
  globalThis.window = {};
  globalThis.document = {
    head: { appendChild() {} },
    createElement: () => ({ style: {}, dataset: {}, className: "", remove() {} }),
    querySelector: () => null,
  };
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.requestAnimationFrame = (fn) => 0;
  globalThis.cancelAnimationFrame = () => {};
}

async function loadBundle() {
  stubDom();
  const loaded = {};
  globalThis.window.__ModuleLoader__ = { load(mod) { Object.assign(loaded, mod); } };
  const R = makeStubReact();
  const code = readFileSync(new URL("../lib/client.js", import.meta.url), "utf8");
  (0, eval)(code);
  const api = loaded.factory((name) => (name === "react" ? R : {}));
  return { api, R };
}

test("bundle registers document preview, slot, and locale", async () => {
  const { api } = await loadBundle();
  assert.deepEqual(api.inject, ["slots", "sessions", "locale", "documentPreviews"]);
  const regs = [];
  let DocBody = null;
  api.apply({
    effect: (fn) => { fn(); return () => {}; },
    locale: { bind: () => (k) => k, register: (ns) => regs.push(["locale", ns]) },
    documentPreviews: { register: (def) => { regs.push(["preview", def]); return () => {}; } },
    slots: {
      register: (o, c) => { if (o.key?.endsWith("/model3d")) DocBody = c; return o; },
      inject: (n, r) => { r(); },
    },
    sessions: { list: { subscribe() { return () => {}; }, getSnapshot: () => ({ current: "" }) } },
  });
  const def = regs.find(r => r[0] === "preview")[1];
  assert.equal(def.id, "@local/dsh-3d-model-viewer/model3d");
  assert.deepEqual(def.extensions, ["stl", "3mf"]);
  assert.equal(def.priority, "extension");
  assert.equal(def.loading, "bytes-complete");
  assert.ok(DocBody, "document body captured");
});

test("document body parses bytes and offers tools + print insights", async () => {
  const { api, R } = await loadBundle();
  let DocBody = null;
  api.apply({
    effect: (fn) => { fn(); return () => {}; },
    locale: { bind: () => (k) => k, register: () => {} },
    documentPreviews: { register: () => () => {} },
    slots: { register: (o, c) => { if (o.key?.endsWith("/model3d")) DocBody = c; return o; }, inject: (n, r) => { r(); } },
    sessions: { list: { subscribe() { return () => {}; }, getSnapshot: () => ({ current: "" }) } },
  });
  const bytes = new Uint8Array(readFileSync(new URL("../fixtures/pair.stl", import.meta.url)));
  const props = { content: { kind: "bytes", data: bytes }, resourceAddress: "dsh-resource://file/session/s/pair.stl" };
  R.reset();
  DocBody(props);
  await new Promise(r => setTimeout(r, 50));
  R.reset();
  const vnode = DocBody(props);
  const kids = vnode.children.filter(c => c && typeof c === "object");
  assert.ok(kids.some(c => c.type?.name === "Viewer"), "viewer rendered");
  const barHost = kids.find(c => c.type?.name === "ViewPresetBar");
  assert.ok(barHost, "toolbar rendered");
  const foot = kids.find(c => c.props?.className === "d3v-doc-foot");
  assert.ok(foot, "stats foot rendered");
  const insights = foot.children.find(c => c.type?.name === "PrintInsights");
  assert.ok(insights, "print insights rendered");
  const insightVdom = insights.type(insights.props);
  const text = JSON.stringify(insightVdom);
  assert.ok(text.includes("体积"), "volume shown");
  assert.ok(text.includes("适配 H2D") || text.includes("超出"), "fit check shown");
  assert.ok(text.includes("≈"), "weight estimate shown");

  // preset click passes ortho through to the Viewer
  const tools = barHost.type(barHost.props);
  const viewsRow = tools.children.find(c => c?.props?.className === "d3v-views");
  const labels = viewsRow.children.map(b => b.children[0]);
  assert.deepEqual(labels, ["前", "后", "左", "右", "顶", "底", "等轴测"]);
  const topBtn = viewsRow.children.find(b => b.children[0] === "顶");
  topBtn.props.onClick();
  await new Promise(r => setTimeout(r, 10));
  R.reset();
  const after = DocBody(props);
  const viewer = after.children.find(c => c?.props?.mesh);
  assert.deepEqual(viewer.props.view, { yaw: 0, pitch: 0, ortho: true });

  // color swatch click reaches the Viewer
  const colorsRow = tools.children.find(c => c?.props?.className === "d3v-colors");
  colorsRow.children.find(b => b?.props?.title === "橙").props.onClick();
  await new Promise(r => setTimeout(r, 10));
  R.reset();
  const colored = DocBody(props).children.find(c => c?.props?.mesh);
  assert.deepEqual(colored.props.color, [.95, .55, .18]);
});
