// Unit tests for the pure parsing / geometry math.
import { test } from "node:test";
import assert from "node:assert/strict";
import { meshVolume, parseStl, toArrayBuffer, parseHexColor } from "../src/parse.js";
import { hexCss, rgbCss, sameColor, VIEW_PRESETS, PRINTER_PROFILES, rayMesh, orthoHalfSize } from "../src/viewer.js";
import { readFileSync } from "node:fs";

test("meshVolume of an outward-wound cube", () => {
  // cube [0,s]^3 generated with guaranteed outward CCW winding
  const s = 10;
  const tris = [];
  for (let axis = 0; axis < 3; axis++) {
    for (const dir of [1, -1]) {
      const n = [0, 0, 0]; n[axis] = dir;
      const u = [0, 0, 0], v = [0, 0, 0];
      u[(axis + 1) % 3] = 1; v[(axis + 2) % 3] = 1;
      const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const [uu, vv] = cross[axis] === dir ? [u, v] : [v, u];
      const base = n.map(x => x > 0 ? s : 0);
      const c0 = base;
      const c1 = base.map((x, i) => x + uu[i] * s);
      const c2 = base.map((x, i) => x + (uu[i] + vv[i]) * s);
      const c3 = base.map((x, i) => x + vv[i] * s);
      tris.push([c0, c1, c2], [c0, c2, c3]);
    }
  }
  const data = new Float32Array(tris.length * 18);
  let p = 0;
  for (const t of tris) for (const v of t) { data[p++]=v[0]; data[p++]=v[1]; data[p++]=v[2]; data[p++]=0; data[p++]=1; data[p++]=0; }
  assert.equal(tris.length, 12);
  assert.equal(Math.round(meshVolume(data)), 1000); // mm³ = s³
});

test("toArrayBuffer handles views with byteOffset", () => {
  const whole = new Uint8Array([0,0,0,1,2,3,4,0]);
  const view = whole.subarray(3, 6);
  const buf = toArrayBuffer(view);
  assert.ok(buf instanceof ArrayBuffer);
  assert.equal(new Uint8Array(buf).join(","), "1,2,3");
});

test("parseStl reads the generated layout fixture", () => {
  const bytes = readFileSync(new URL("../fixtures/layout.stl", import.meta.url));
  const mesh = parseStl(toArrayBuffer(bytes));
  assert.equal(mesh.triangles, 24);
  assert.deepEqual(mesh.size.map(v => +v.toFixed(1)), [17.2, 12.6, 12.3]);
  // two 5.4 x 12.6 x 12.3 boxes = 2 * 836.892 mm³
  assert.ok(Math.abs(mesh.volume - 1673.784) < 0.5, `volume in mm³: ${mesh.volume}`);
});

test("color helpers round-trip", () => {
  const c = [.18, .62, .95];
  assert.equal(hexCss(c), "#2e9ef2");
  assert.equal(rgbCss(c), "rgb(46,158,242)");
  assert.ok(sameColor(c, [.18, .62, .95]));
  assert.ok(!sameColor(c, [.93, .94, .96]));
});

test("axis view presets are orthographic, iso is not", () => {
  for (const [key, label, [yaw, pitch, ortho]] of VIEW_PRESETS) {
    if (key === "iso") assert.equal(ortho, false);
    else assert.equal(ortho, true, `${label} should be ortho`);
  }
});

test("printer profiles default to X2D", () => {
  assert.equal(PRINTER_PROFILES[0][0], "X2D");
  assert.deepEqual(PRINTER_PROFILES[0].slice(1), [256, 256, 260]);
  assert.ok(PRINTER_PROFILES.some(p => p[0] === "H2D" && p[1] === 350));
});

test("ray picking hits the model and misses the background", () => {
  // solid cube [0,10]^3 built with outward winding (see volume test)
  const s = 10;
  const tris = [];
  for (let axis = 0; axis < 3; axis++) {
    for (const dir of [1, -1]) {
      const n = [0, 0, 0]; n[axis] = dir;
      const u = [0, 0, 0], v = [0, 0, 0];
      u[(axis + 1) % 3] = 1; v[(axis + 2) % 3] = 1;
      const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const [uu, vv] = cross[axis] === dir ? [u, v] : [v, u];
      const base = n.map(x => x > 0 ? s : 0);
      const c0 = base, c1 = base.map((x, i) => x + uu[i] * s), c2 = base.map((x, i) => x + (uu[i] + vv[i]) * s), c3 = base.map((x, i) => x + vv[i] * s);
      tris.push([c0, c1, c2], [c0, c2, c3]);
    }
  }
  const data = new Float32Array(tris.length * 18);
  let p = 0;
  for (const t of tris) for (const v of t) { data[p++] = v[0]; data[p++] = v[1]; data[p++] = v[2]; data[p++] = 0; data[p++] = 1; data[p++] = 0; }
  const mesh = { lo: [0, 0, 0], hi: [10, 10, 10], triangles: tris.length, data };
  assert.ok(rayMesh([5, 5, 20], [0, 0, -1], mesh), "frontal ray hits");
  assert.ok(rayMesh([5, -20, 5], [0, 1, 0], mesh), "side ray hits");
  assert.ok(!rayMesh([-5, 5, 20], [0, 0, -1], mesh), "parallel offset ray misses");
  assert.ok(!rayMesh([5, 5, 20], [0, 0, 1], mesh), "ray pointing away misses");
  assert.equal(rayMesh([50, 50, 50], [1, 0, 0], mesh), false, "ray outside bbox misses fast");
});

test("orthographic zoom maps wheel distance to view half-height", () => {
  assert.equal(orthoHalfSize(5.5), 1.15);           // default zoom = base margin
  assert.equal(orthoHalfSize(11), 2.3);             // zoom out halves the model size
  assert.ok(orthoHalfSize(1.2) < orthoHalfSize(5.5));
  assert.ok(orthoHalfSize(20) > orthoHalfSize(11));
});

test("parseHexColor accepts spec 3MF color forms", () => {
  assert.deepEqual(parseHexColor("#ff0000"), [1, 0, 0]);
  assert.deepEqual(parseHexColor("#00ff00"), [0, 1, 0]);
  assert.deepEqual(parseHexColor("#f00"), [1, 0, 0]);
  assert.deepEqual(parseHexColor("#ff0000aa"), [1, 0, 0]);
  assert.equal(parseHexColor("red"), null);
  assert.equal(parseHexColor("#12"), null);
  assert.equal(parseHexColor(null), null);
});

test("ASCII STL is not misread as binary (offset-80 facet-count trap)", () => {
  const bytes = readFileSync(new URL("../fixtures/box-ascii.stl", import.meta.url));
  const mesh = parseStl(toArrayBuffer(bytes));
  assert.equal(mesh.triangles, 12);
  assert.ok(Math.abs(mesh.volume / 1000 - 0.24) < 0.001, `volume: ${mesh.volume}`);
  assert.deepEqual(mesh.size.map(v => +v.toFixed(2)), [4, 10, 6]);
});

test("3MF row-vector transform math", async () => {
  const { mat4FromTransform, mat4Mul, mat4Apply, MAT4_IDENTITY } = await import("../src/parse.js");
  // identity / absent
  assert.equal(mat4FromTransform(null), MAT4_IDENTITY);
  assert.deepEqual(mat4FromTransform("1 0 0 0 1 0 0 0 1 0 0 0"), MAT4_IDENTITY);
  // translation only
  const t = mat4FromTransform("1 0 0 0 1 0 0 0 1 10 20 30");
  assert.deepEqual(mat4Apply(t, 0, 0, 0), [10, 20, 30]);
  assert.deepEqual(mat4Apply(t, 1, 2, 3), [11, 22, 33]);
  // the 90°-about-Y rotation + translation seen in real multi-plate files
  const r = mat4FromTransform("2.22044605e-16 0 -1 0 1 0 1 0 2.22044605e-16 128.849129 128 0");
  const [x, y, z] = mat4Apply(r, 1, 0, 0);
  assert.ok(Math.abs(x - 128.849129) < 1e-6, `x: ${x}`);
  assert.ok(Math.abs(y - 128) < 1e-6, `y: ${y}`);
  assert.ok(Math.abs(z + 1) < 1e-6, `z: ${z}`);
  // compose: child translation then parent translation = summed
  const child = mat4FromTransform("1 0 0 0 1 0 0 0 1 1 2 3");
  const parent = mat4FromTransform("1 0 0 0 1 0 0 0 1 10 20 30");
  assert.deepEqual(mat4Apply(mat4Mul(child, parent), 0, 0, 0), [11, 22, 33]);
  // rotation composes with r's own translation:
  // (0,0,1) --r--> (129.849, 128, ~0) --pure 90°-Y--> (~0, 128, -129.849)
  const r2 = mat4Mul(r, mat4FromTransform("2.22044605e-16 0 -1 0 1 0 1 0 2.22044605e-16 0 0 0"));
  const [px, py, pz] = mat4Apply(r2, 0, 0, 1);
  assert.ok(Math.abs(px) < 1e-9, `px: ${px}`);
  assert.ok(Math.abs(py - 128) < 1e-6, `py: ${py}`);
  assert.ok(Math.abs(pz + 129.849129) < 1e-6, `pz: ${pz}`);
  // malformed input throws
  assert.throws(() => mat4FromTransform("1 2 3"));
  assert.throws(() => mat4FromTransform("a b c d e f g h i j k l"));
});

test("buildPlates groups item ranges with per-plate bounds", async () => {
  const { buildPlates } = await import("../src/parse.js");
  // 15 triangles: plate A (tris 0-9) near x=0, plate B (tris 10-14) near x=100
  const data = new Float32Array(15 * 18);
  for (let t = 0; t < 15; t++) {
    const bx = t < 10 ? 0 : 100;
    for (let v = 0; v < 3; v++) {
      const o = t * 18 + v * 6;
      data[o] = bx + v; data[o + 1] = v; data[o + 2] = 0;
      data[o + 3] = 0; data[o + 4] = 1; data[o + 5] = 0; // dummy normal
    }
  }
  const items = [
    { objectid: "2", startTri: 0, triCount: 6 },
    { objectid: "3", startTri: 6, triCount: 4 },
    { objectid: "4", startTri: 10, triCount: 5 },
  ];
  const map = new Map([["2", "1"], ["3", "1"], ["4", "2"]]);
  const meta = [{ id: "1", label: "左侧" }, { id: "2", label: "" }];
  const plates = buildPlates(items, map, meta, data);
  assert.ok(plates, "two plates detected");
  assert.equal(plates.length, 2);
  assert.deepEqual(plates.map(p => p.label), ["左侧", "盘 2"]);
  assert.deepEqual(plates.map(p => p.triangles), [10, 5]);
  assert.equal(plates[0].ranges.length, 2, "plate 1 has two ranges");
  assert.ok(Math.abs(plates[0].center[0] - 1) < 1e-6, `plate1 center.x: ${plates[0].center[0]}`);
  assert.ok(Math.abs(plates[1].center[0] - 101) < 1e-6, `plate2 center.x: ${plates[1].center[0]}`);
  // radii are plate-local (fit-to-plate), so equal here despite the 100mm offset
  assert.ok(Math.abs(plates[1].radius - plates[0].radius) < 1e-6, `radii: ${plates[0].radius} vs ${plates[1].radius}`);
  // degenerate: single plate -> no switcher
  assert.equal(buildPlates(items.slice(0, 2), map, meta, data), null);
  // no plate table -> no switcher
  assert.equal(buildPlates(items, new Map(), meta, data), null);
});

test("ViewPresetBar renders the plate switcher row", async () => {
  const { setReact } = await import("../src/core.js");
  const states = []; let calls = 0;
  const R = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(3) }),
    Fragment: "Fragment", useRef: v => ({ current: v }),
    useState: v => { const i = calls++; if (states[i] === undefined) states[i] = v; return [states[i], () => {}]; },
    useEffect: () => () => {}, useSyncExternalStore: (s, g) => g(), useCallback: f => f,
  };
  setReact(R);
  const { ViewPresetBar } = await import("../src/viewer.js");
  const plates = [
    { id: "1", label: "盘 1", triangles: 10, ranges: [], lo: [0,0,0], hi: [1,1,1], size: [1,1,1], center: [.5,.5,.5], radius: 1 },
    { id: "2", label: "盘 2", triangles: 5, ranges: [], lo: [0,0,0], hi: [1,1,1], size: [1,1,1], center: [.5,.5,.5], radius: 1 },
  ];
  const picked = [];
  const bar = ViewPresetBar({ onPick: () => {}, color: [0,0,0], onPickColor: null, plates, plate: 1, onPickPlate: i => picked.push(i) });
  const rows = bar.children.filter(c => c?.props?.className === "d3v-views");
  assert.equal(rows.length, 2, "plate row + preset row");
  const [plateRow, presetRow] = rows;
  assert.deepEqual(plateRow.children.map(b => b.children[0]), ["全部", "盘 1", "盘 2"]);
  assert.deepEqual(plateRow.children.map(b => b.props.className.includes("active")), [false, false, true]);
  plateRow.children[0].props.onClick();
  plateRow.children[2].props.onClick();  // 盘 2 is plates[1]
  assert.deepEqual(picked, [-1, 1]);
  // single plate -> no switcher row
  const bar1 = ViewPresetBar({ onPick: () => {}, color: [0,0,0], onPickColor: null, plates: plates.slice(0, 1), plate: -1, onPickPlate: () => {} });
  assert.equal(bar1.children.filter(c => c?.props?.className === "d3v-views").length, 1);
});
