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
