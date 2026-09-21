// STL / 3MF parsing — pure functions, browser-side only.

/** Normalize whatever byte container the caller hands us into an ArrayBuffer. */
export function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  if (data && typeof data === "object" && typeof data.byteLength === "number" && data.buffer) {
    return toArrayBuffer(data.buffer.slice(data.byteOffset ?? 0, (data.byteOffset ?? 0) + data.byteLength));
  }
  throw Error("无法识别的文件内容类型");
}

function finishMesh(data, triangles) {
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < data.length; i += 6) {
    for (let j = 0; j < 3; j++) {
      lo[j] = Math.min(lo[j], data[i + j]);
      hi[j] = Math.max(hi[j], data[i + j]);
    }
  }
  if (!Number.isFinite(lo[0])) throw Error("模型坐标无效");
  const center = lo.map((x, i) => (x + hi[i]) / 2);
  const size = lo.map((x, i) => hi[i] - x);
  const radius = Math.hypot(...size) / 2 || 1;
  const volume = meshVolume(data);
  return { data, triangles, lo, hi, size, center, radius, volume };
}

/** Signed-tetrahedron sum over the position stream (6-float vertex stride). Returns mm³. */
export function meshVolume(data) {
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
  if (buf.byteLength < 84) throw Error("STL 文件过短");
  const n = dv.getUint32(80, true);
  if (n > 5000000) throw Error("模型超过 500 万三角面限制");
  if (84 + n * 50 > buf.byteLength) throw Error("STL 三角面数据不完整");
  const out = new Float32Array(n * 18);
  let p = 0;
  for (let i = 0, o = 84; i < n; i++, o += 50) {
    let nx = dv.getFloat32(o, true), ny = dv.getFloat32(o + 4, true), nz = dv.getFloat32(o + 8, true);
    const ax = dv.getFloat32(o + 12, true), ay = dv.getFloat32(o + 16, true), az = dv.getFloat32(o + 20, true);
    const bx = dv.getFloat32(o + 24, true), by = dv.getFloat32(o + 28, true), bz = dv.getFloat32(o + 32, true);
    const cx = dv.getFloat32(o + 36, true), cy = dv.getFloat32(o + 40, true), cz = dv.getFloat32(o + 44, true);
    if (!Number.isFinite(nx + ny + nz) || Math.hypot(nx, ny, nz) < 1e-8) {
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx;
    }
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (const v of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) {
      out[p++] = v[0]; out[p++] = v[1]; out[p++] = v[2];
      out[p++] = nx; out[p++] = ny; out[p++] = nz;
    }
  }
  return finishMesh(out, n);
}

function parseAsciiStl(buf) {
  const text = new TextDecoder().decode(buf);
  const re = /facet\s+normal\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)[\s\S]*?outer\s+loop([\s\S]*?)endloop/gi;
  const a = [];
  let m;
  while ((m = re.exec(text))) {
    const n = [+m[1], +m[2], +m[3]];
    const verts = [...m[4].matchAll(/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/gi)].slice(0, 3);
    if (verts.length === 3) for (const v of verts) a.push(+v[1], +v[2], +v[3], ...n);
  }
  if (!a.length) throw Error("无法识别 ASCII STL");
  return finishMesh(new Float32Array(a), a.length / 18);
}

export function parseStl(buf) {
  if (buf.byteLength >= 84) {
    const n = new DataView(buf).getUint32(80, true);
    if (84 + n * 50 <= buf.byteLength) return parseBinaryStl(buf);
  }
  return parseAsciiStl(buf);
}

async function unzip(buf) {
  const u = new Uint8Array(buf), dv = new DataView(buf), u64 = o => Number(dv.getBigUint64(o, true));
  let e = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw Error("3MF ZIP 目录缺失");
  let count = dv.getUint16(e + 10, true), cd = dv.getUint32(e + 16, true);
  if (cd === 0xffffffff || count === 0xffff) {
    const loc = e - 20;
    if (loc < 0 || dv.getUint32(loc, true) !== 0x07064b50) throw Error("3MF ZIP64 定位器缺失");
    const z = u64(loc + 8);
    if (dv.getUint32(z, true) !== 0x06064b50) throw Error("3MF ZIP64 目录损坏");
    count = u64(z + 32); cd = u64(z + 48);
  }
  const files = [];
  let p = cd;
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw Error("3MF ZIP 目录损坏");
    const method = dv.getUint16(p + 10, true), rawSize = dv.getUint32(p + 20, true), unSize = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    const rawLo = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u.slice(p + 46, p + 46 + nl));
    let size = rawSize, lo = rawLo, ep = p + 46 + nl, end = ep + xl;
    while (ep + 4 <= end) {
      const tag = dv.getUint16(ep, true), len = dv.getUint16(ep + 2, true), q = ep + 4;
      if (tag === 1) {
        let k = q;
        if (unSize === 0xffffffff) k += 8;
        if (rawSize === 0xffffffff) { size = u64(k); k += 8; }
        if (rawLo === 0xffffffff) lo = u64(k);
      }
      ep = q + len;
    }
    const lnl = dv.getUint16(lo + 26, true), lxl = dv.getUint16(lo + 28, true), start = lo + 30 + lnl + lxl;
    const raw = u.slice(start, start + size);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) {
      if (typeof DecompressionStream === "undefined") throw Error("浏览器不支持 3MF 解压");
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      data = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw Error("不支持的 ZIP 压缩方式 " + method);
    files.push({ name, data });
    p += 46 + nl + xl + cl;
  }
  return files;
}

/** Parse #rgb / #rrggbb / #rrggbbaa into [r,g,b] 0..1, or null. */
export function parseHexColor(value) {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = [...hex].map(c => c + c).join("");
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
}

export async function parse3mf(buf) {
  const files = await unzip(buf);
  const models = files.filter(f => /\.model$/i.test(f.name));
  if (!models.length) throw Error("3MF 中没有 .model 网格");
  const vals = [], cols = [];
  let triangles = 0, sawColor = false;
  for (const f of models) {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(f.data), "application/xml");
    if (doc.querySelector("parsererror")) continue;
    const factor = ({ micron: .001, millimeter: 1, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1000 }[doc.documentElement.getAttribute("unit")] || 1);
    // basematerials resources: id -> [hexColor strings]
    const materialMap = {};
    for (const bm of doc.getElementsByTagNameNS("*", "basematerials")) {
      materialMap[bm.getAttribute("id")] = [...bm.getElementsByTagNameNS("*", "base")]
        .map(base => parseHexColor(base.getAttribute("color")));
    }
    const emit = (mesh, defaultColor, materialColors) => {
      const verts = [...mesh.getElementsByTagNameNS("*", "vertex")].map(v => [+v.getAttribute("x") * factor, +v.getAttribute("y") * factor, +v.getAttribute("z") * factor]);
      for (const t of mesh.getElementsByTagNameNS("*", "triangle")) {
        const ids = [+t.getAttribute("v1"), +t.getAttribute("v2"), +t.getAttribute("v3")];
        const a = verts[ids[0]], b = verts[ids[1]], c = verts[ids[2]];
        if (!a || !b || !c) continue;
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
        for (const v of [a, b, c]) vals.push(v[0], v[1], v[2], nx / l, ny / l, nz / l);
        let color = defaultColor;
        const matid = t.getAttribute("matid");
        if (materialColors && matid !== null && materialColors[+matid - 1]) color = materialColors[+matid - 1];
        if (color) sawColor = true;
        if (color) cols.push(color[0], color[1], color[2], color[0], color[1], color[2], color[0], color[1], color[2]);
        else cols.push(0, 0, 0, 0, 0, 0, 0, 0, 0);
        triangles++;
        if (triangles > 5000000) throw Error("模型超过 500 万三角面限制");
      }
    };
    // meshes grouped under objects (carrying pid/pindex material references)
    const objects = [...doc.getElementsByTagNameNS("*", "object")];
    for (const obj of objects) {
      const materialColors = materialMap[obj.getAttribute("pid")] || null;
      const objColor = materialColors ? materialColors[+(obj.getAttribute("pindex") || 0)] || null : null;
      for (const mesh of obj.getElementsByTagNameNS("*", "mesh")) emit(mesh, objColor, materialColors);
    }
    // bare meshes outside any object
    if (!objects.length) for (const mesh of doc.getElementsByTagNameNS("*", "mesh")) emit(mesh, null, null);
  }
  if (!triangles) throw Error("3MF 中没有可显示的三角网格");
  const mesh = finishMesh(new Float32Array(vals), triangles);
  if (sawColor) mesh.colors = new Float32Array(cols);
  return mesh;
}
