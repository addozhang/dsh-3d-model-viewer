// WebGL viewer: flat-shaded mesh with true trackball rotation (drag on the
// model), canvas panning (drag on the background), view presets (axis views
// use an orthographic camera and bbox dimension labels), model color input,
// keyboard shortcuts, and PNG screenshot export.
import { React, h } from "./core.js";

export const VS = `attribute vec3 p;attribute vec3 n;attribute vec3 col;uniform mat4 mvp;uniform mat4 model;varying vec3 vn;varying vec3 vc;void main(){gl_Position=mvp*vec4(p,1.);vn=mat3(model)*n;vc=col;}`;
export const FS = `precision mediump float;varying vec3 vn;varying vec3 vc;uniform vec3 uColor;uniform float uUseVColor;void main(){vec3 N=normalize(vn);vec3 L=normalize(vec3(.5,.8,1.));float d=max(dot(N,L),0.);float rim=pow(1.-abs(N.z),2.);vec3 base=mix(uColor,vc,uUseVColor);vec3 c=base*(.28+.72*d)+rim*vec3(.08,.18,.28);gl_FragColor=vec4(c,1.);}`;

export const DEFAULT_COLOR = [.18, .62, .95];
export const COLOR_PRESETS = [["蓝", [.18, .62, .95]], ["橙", [.95, .55, .18]], ["绿", [.25, .7, .4]], ["红", [.9, .3, .3]], ["紫", [.6, .4, .9]], ["灰", [.62, .65, .68]], ["白", [.93, .94, .96]]];

// label, [yaw, pitch, ortho]
export const VIEW_PRESETS = [
  ["front", "前", [0, Math.PI / 2, true]],
  ["back", "后", [Math.PI, Math.PI / 2, true]],
  ["left", "左", [-Math.PI / 2, 0, true]],
  ["right", "右", [Math.PI / 2, 0, true]],
  ["top", "顶", [0, 0, true]],
  ["bottom", "底", [0, Math.PI, true]],
  ["iso", "等轴测", [Math.PI / 4, -0.6155, false]],
];

// name, X, Y, Z build volume (mm)
// X2D: main nozzle 256×256×260; dual-hotend/auxiliary use narrows X to 235.5.
export const PRINTER_PROFILES = [
  ["X2D", 256, 256, 260],
  ["H2D", 350, 320, 325],
  ["X1C / P1", 256, 256, 256],
  ["A1", 256, 210, 210],
  ["A1 mini", 180, 180, 180],
];

// name, density g/cm³
export const MATERIALS = [["PLA", 1.24], ["PETG", 1.27], ["PC", 1.20], ["ABS", 1.04], ["TPU", 1.21]];
export const INFILL_OPTIONS = [10, 15, 20, 30, 50, 100];

export const rgbCss = (c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
export const hexCss = (c) => "#" + c.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
export const sameColor = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);

export const SCREENSHOT_EVENT = "dsh-3d-model-shot";

function shader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) || "着色器编译失败");
  return s;
}

const mul = (a, b) => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
};
const rx = a => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
const ry = a => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
const IDENTITY = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const buildRot = (yaw, pitch) => mul(ry(yaw), rx(pitch));
const DEFAULT_ROT = () => buildRot(.65, -.45);

/** Orthographic half-height at the current wheel zoom: distance-independent. */
export const orthoHalfSize = (zoom) => 1.15 * (zoom / 5.5);

function perspective(aspect) {
  const f = 1 / Math.tan(Math.PI / 8), near = .01, far = 100;
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
}

function orthographic(aspect, k) {
  // Model is normalized to radius 1 at the origin; k is the view half-height.
  const near = .01, far = 100;
  return new Float32Array([1 / (k * aspect), 0, 0, 0, 0, 1 / k, 0, 0, 0, 0, -2 / (far - near), 0, 0, 0, -(far + near) / (far - near), 1]);
}

/** Project a model-space point (mm) through mvp into CSS pixel coords. */
function projectPoint(mvp, p, w, hh) {
  const x = p[0], y = p[1], z = p[2];
  const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
  const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
  const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15] || 1;
  return [(cx / cw * 0.5 + 0.5) * w, (0.5 - cy / cw * 0.5) * hh];
}

/** Slab-test a ray against the model-space AABB. */
export function rayBox(o, d, lo, hi) {
  let tmin = 0, tmax = Infinity;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
    } else {
      let t1 = (lo[i] - o[i]) / d[i], t2 = (hi[i] - o[i]) / d[i];
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

/** Möller–Trumbore over the position stream (6-float vertex stride). */
export function rayMesh(o, d, mesh, limitTriangles = 400000) {
  if (!rayBox(o, d, mesh.lo, mesh.hi)) return false;
  if (mesh.triangles > limitTriangles) return true; // bbox is close enough for huge meshes
  const data = mesh.data;
  for (let i = 0; i < data.length; i += 18) {
    const ax = data[i], ay = data[i + 1], az = data[i + 2];
    const bx = data[i + 6], by = data[i + 7], bz = data[i + 8];
    const cx = data[i + 12], cy = data[i + 13], cz = data[i + 14];
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (det > -1e-10 && det < 1e-10) continue;
    const inv = 1 / det;
    const tx = o[0] - ax, ty = o[1] - ay, tz = o[2] - az;
    const u = (tx * px + ty * py + tz * pz) * inv;
    if (u < 0 || u > 1) continue;
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
    const v = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
    if (v < 0 || u + v > 1) continue;
    return true;
  }
  return false;
}

export function ViewPresetBar({ onPick, color, onPickColor }) {
  return h("div", { className: "d3v-viewtools", "data-dsh-3d-views": "" },
    h("div", { className: "d3v-views" },
      VIEW_PRESETS.map(([k, label, ang]) =>
        h("button", {
          key: k, type: "button", className: "d3v-view-btn", title: `${label}（${ang[2] ? "正交" : "透视"}，快捷键 ${VIEW_PRESETS.findIndex(p => p[0] === k) + 1}）`,
          onPointerDown: e => e.stopPropagation(),
          onClick: () => onPick(ang[0], ang[1], ang[2]),
        }, label)),
      h("button", {
        type: "button", className: "d3v-view-btn", title: "导出当前视图为 PNG",
        onPointerDown: e => e.stopPropagation(),
        onClick: () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SCREENSHOT_EVENT)); },
      }, "截图")),
    onPickColor && h("div", { className: "d3v-colors" },
      COLOR_PRESETS.map(([label, c]) =>
        h("button", {
          key: label, type: "button", className: "d3v-swatch" + (sameColor(color, c) ? " active" : ""),
          title: label, style: { background: rgbCss(c) },
          onPointerDown: e => e.stopPropagation(), onClick: () => onPickColor(c),
        })),
      h("input", {
        type: "color", className: "d3v-color-native", title: "自定义颜色", "aria-label": "自定义模型颜色",
        value: hexCss(color), onPointerDown: e => e.stopPropagation(),
        onChange: e => {
          const m = e.target.value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
          if (m) onPickColor([parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]);
        },
      })));
}

const DIM_ANCHORS = (lo, hi, margin) => ([
  ["x", [(lo[0] + hi[0]) / 2, lo[1] - margin, lo[2]]],
  ["y", [hi[0] + margin, (lo[1] + hi[1]) / 2, lo[2]]],
  ["z", [hi[0] + margin, lo[1], (lo[2] + hi[2]) / 2]],
]);

export function Viewer({ mesh, resetToken, view, color }) {
  const ref = React.useRef(null);
  const orient = React.useRef({ rot: DEFAULT_ROT(), ortho: false });
  const pan = React.useRef([0, 0]);
  const redraw = React.useRef(() => {});
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
    // Dimension label overlay lives next to the canvas inside the stage.
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
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) || "着色器链接失败");
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
    } catch (e) { console.error(e); return; }

    const savePng = () => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${mesh.name || "model"}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      });
    };

    const draw = () => {
      raf = 0;
      const o = orient.current, rot = o.rot;
      const d = Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * d)), hh = Math.max(1, Math.round(canvas.clientHeight * d));
      if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
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

      // Dimension labels: only in orthographic views, only for axes lying in
      // the screen plane (rotation column's view-z near zero).
      if (o.ortho) {
        const m = mesh.radius * .18;
        const inPlane = {
          x: Math.abs(rot[2]) < .9,
          y: Math.abs(rot[6]) < .9,
          z: Math.abs(rot[10]) < .9,
        };
        const anchors = DIM_ANCHORS(mesh.lo, mesh.hi, m);
        for (const [axis, point] of anchors) {
          const el = labelEls[axis];
          if (!inPlane[axis]) { el.style.display = "none"; continue; }
          const [sx, sy] = projectPoint(mvp, point, canvas.clientWidth, canvas.clientHeight);
          el.style.display = "";
          el.style.left = sx + "px";
          el.style.top = sy + "px";
          el.textContent = mesh.size[axis === "x" ? 0 : axis === "y" ? 1 : 2].toFixed(2);
        }
      } else {
        for (const el of Object.values(labelEls)) el.style.display = "none";
      }
      if (shotPending) { shotPending = false; savePng(); }
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
    redraw.current = request;

    const panScale = () => {
      const rect = canvas.getBoundingClientRect();
      const hpx = rect.height || 1;
      return orient.current.ortho ? 2 * orthoHalfSize(zoom) / hpx : 2 * Math.tan(Math.PI / 8) * zoom / hpx;
    };

    // CAD-style drag semantics: left button always rotates (no pick guesswork
    // to deadlock); right / middle button or Shift pans; double-click resets.
    const pd = e => {
      down = true; lx = e.clientX; ly = e.clientY;
      mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? "pan" : "rotate";
      canvas.style.cursor = mode === "rotate" ? "grabbing" : "move";
      canvas.setPointerCapture(e.pointerId);
    };
    const pm = e => {
      if (!down) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      if (mode === "rotate") {
        // screen-space incremental rotation: true trackball, no gimbal limits
        const k = .01;
        orient.current.rot = mul(ry(dx * k), mul(rx(dy * k), orient.current.rot));
        orient.current.ortho = false;  // manual rotation leaves the measuring views
      } else {
        const s = panScale();
        pan.current[0] += dx * s;
        pan.current[1] -= dy * s;
      }
      request();
    };
    const pu = () => { down = false; canvas.style.cursor = ""; };
    const wh = e => { e.preventDefault(); zoom = Math.max(1.2, Math.min(20, zoom * Math.exp(e.deltaY * .001))); request(); };
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
    const key = e => {
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= VIEW_PRESETS.length) { e.preventDefault(); applyPreset(VIEW_PRESETS[idx - 1]); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); reset(); }
    };
    const shot = () => {
      if (canvas.clientWidth === 0) return;  // only the visible viewer answers
      shotPending = true;
      request();
    };
    const noMenu = e => e.preventDefault();
    const dbl = () => { orient.current = { rot: DEFAULT_ROT(), ortho: false }; pan.current = [0, 0]; request(); };
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
      redraw.current = () => {};
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
    ref, className: "d3v-canvas", "data-dsh-3d-canvas": "",
    tabIndex: 0, role: "img", "aria-label": "3D 模型视图：左键拖动旋转，右键或 Shift 拖动平移，滚轮缩放，双击复位",
    onKeyDown: e => e.stopPropagation(),
    style: { outline: "none" },
  });
}
