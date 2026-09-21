// WebGL viewer: flat-shaded mesh with orbit interaction, view presets
// (axis views use an orthographic camera and bbox dimension labels), and a
// model color input.
import { React, h } from "./core.js";

export const VS = `attribute vec3 p;attribute vec3 n;uniform mat4 mvp;uniform mat4 model;varying vec3 vn;void main(){gl_Position=mvp*vec4(p,1.);vn=mat3(model)*n;}`;
export const FS = `precision mediump float;varying vec3 vn;uniform vec3 uColor;void main(){vec3 N=normalize(vn);vec3 L=normalize(vec3(.5,.8,1.));float d=max(dot(N,L),0.);float rim=pow(1.-abs(N.z),2.);vec3 c=uColor*(.28+.72*d)+rim*vec3(.08,.18,.28);gl_FragColor=vec4(c,1.);}`;

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

function perspective(aspect) {
  const f = 1 / Math.tan(Math.PI / 8), near = .01, far = 100;
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
}

function orthographic(aspect) {
  // Model is normalized to radius 1 at the origin; show a little margin.
  const k = 1.15, near = .01, far = 100;
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

export function ViewPresetBar({ onPick, color, onPickColor }) {
  return h("div", { className: "d3v-viewtools", "data-dsh-3d-views": "" },
    h("div", { className: "d3v-views" }, VIEW_PRESETS.map(([k, label, ang]) =>
      h("button", {
        key: k, type: "button", className: "d3v-view-btn", title: label + (ang[2] ? "（正交）" : ""),
        onPointerDown: e => e.stopPropagation(),
        onClick: () => onPick(ang[0], ang[1], ang[2]),
      }, label))),
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
  const orient = React.useRef({ yaw: .65, pitch: -.45, ortho: false });
  const redraw = React.useRef(() => {});
  const colorRef = React.useRef(null);

  React.useEffect(() => {
    if (!view) return;
    orient.current = { yaw: view.yaw, pitch: view.pitch, ortho: !!view.ortho };
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
    let program, buff, raf = 0, down = false, lx = 0, ly = 0, zoom = 5.5;
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
      const ps = gl.getAttribLocation(program, "p"), ns = gl.getAttribLocation(program, "n");
      gl.enableVertexAttribArray(ps);
      gl.vertexAttribPointer(ps, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(ns);
      gl.vertexAttribPointer(ns, 3, gl.FLOAT, false, 24, 12);
    } catch (e) { console.error(e); return; }

    const draw = () => {
      raf = 0;
      const o = orient.current, { yaw, pitch } = o;
      const d = Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * d)), hh = Math.max(1, Math.round(canvas.clientHeight * d));
      if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
      gl.viewport(0, 0, w, hh);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const aspect = w / hh;
      const proj = o.ortho ? orthographic(aspect) : perspective(aspect);
      const scale = 1 / mesh.radius;
      const rot = mul(ry(yaw), rx(pitch));
      const model = new Float32Array(rot);
      for (const idx of [0, 1, 2, 4, 5, 6, 8, 9, 10]) model[idx] *= scale;
      model[12] = -(model[0] * mesh.center[0] + model[4] * mesh.center[1] + model[8] * mesh.center[2]);
      model[13] = -(model[1] * mesh.center[0] + model[5] * mesh.center[1] + model[9] * mesh.center[2]);
      model[14] = -(model[2] * mesh.center[0] + model[6] * mesh.center[1] + model[10] * mesh.center[2]) - zoom;
      gl.useProgram(program);
      const col = colorRef.current || DEFAULT_COLOR;
      gl.uniform3f(gl.getUniformLocation(program, "uColor"), col[0], col[1], col[2]);
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
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
    redraw.current = request;

    const pd = e => { down = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const pm = e => {
      if (!down) return;
      const o = orient.current;
      o.yaw += (e.clientX - lx) * .01;
      o.pitch = Math.max(-1.5, Math.min(1.5, o.pitch + (e.clientY - ly) * .01));
      o.ortho = false;  // manual rotation leaves the measuring views
      lx = e.clientX; ly = e.clientY;
      request();
    };
    const pu = () => { down = false; };
    const wh = e => { e.preventDefault(); zoom = Math.max(1.2, Math.min(20, zoom * Math.exp(e.deltaY * .001))); request(); };
    canvas.addEventListener("pointerdown", pd);
    canvas.addEventListener("pointermove", pm);
    canvas.addEventListener("pointerup", pu);
    canvas.addEventListener("pointercancel", pu);
    canvas.addEventListener("wheel", wh, { passive: false });
    const ro = new ResizeObserver(request);
    ro.observe(canvas);
    request();
    return () => {
      redraw.current = () => {};
      cancelAnimationFrame(raf);
      ro.disconnect();
      labelsBox.remove();
      canvas.removeEventListener("pointerdown", pd);
      canvas.removeEventListener("pointermove", pm);
      canvas.removeEventListener("pointerup", pu);
      canvas.removeEventListener("pointercancel", pu);
      canvas.removeEventListener("wheel", wh);
      if (buff) gl.deleteBuffer(buff);
      if (program) gl.deleteProgram(program);
    };
  }, [mesh, resetToken]);
  return h("canvas", { ref, className: "d3v-canvas", "data-dsh-3d-canvas": "" });
}
