// Unit tests for the pure parsing / geometry math.
import { test } from "node:test";
import assert from "node:assert/strict";
import { meshVolume, parseStl, toArrayBuffer } from "../src/parse.js";
import { hexCss, rgbCss, sameColor, VIEW_PRESETS, PRINTER_PROFILES } from "../src/viewer.js";
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

test("parseStl reads the workspace pair STL", () => {
  const bytes = readFileSync(new URL("../fixtures/pair.stl", import.meta.url));
  const mesh = parseStl(toArrayBuffer(bytes));
  assert.equal(mesh.triangles, 392);
  assert.deepEqual(mesh.size.map(v => +v.toFixed(1)), [17.2, 12.6, 12.3]);
  assert.ok(mesh.volume > 0 && mesh.volume < 5000, `volume in mm³: ${mesh.volume}`);
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
