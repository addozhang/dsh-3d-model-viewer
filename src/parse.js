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
    // Only trust binary when the facet count accounts for the whole file;
    // ASCII bytes at offset 80 otherwise masquerade as a small facet count.
    if (n > 0 && 84 + n * 50 === buf.byteLength) return parseBinaryStl(buf);
    const head = new TextDecoder().decode(buf.slice(0, 512));
    if (/^\s*solid/i.test(head) && /facet/i.test(head)) return parseAsciiStl(buf);
    if (n > 0 && 84 + n * 50 <= buf.byteLength) return parseBinaryStl(buf);
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

// ---- 3MF transforms (row-vector convention: v' = [x y z 1] · M) ----
// Stored row-major as length-16 arrays; the 12-number attribute is
// "m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32" with (m30..m32) the
// translation, exactly the 3MF production-extension layout.
export const MAT4_IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** 12-number transform attribute -> row-major 4x4, or MAT4_IDENTITY. */
export function mat4FromTransform(text) {
  if (typeof text !== "string") return MAT4_IDENTITY;
  const parts = text.trim().split(/\s+/);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "")) return MAT4_IDENTITY;
  if (parts.length !== 12) throw Error(`3MF 变换需要 12 个数字，得到 ${parts.length}`);
  const m = parts.map(Number);
  for (const v of m) if (!Number.isFinite(v)) throw Error("3MF 变换包含非数字");
  return [m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, m[9], m[10], m[11], 1];
}

/** Standard 4x4 product; compose(child, parent) applies child first. */
export function mat4Mul(child, parent) {
  const out = new Array(16);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    out[r * 4 + c] = child[r * 4] * parent[c] + child[r * 4 + 1] * parent[4 + c] + child[r * 4 + 2] * parent[8 + c] + child[r * 4 + 3] * parent[12 + c];
  }
  return out;
}

/** Apply a row-major 4x4 to [x,y,z]. */
export function mat4Apply(m, x, y, z) {
  return [
    x * m[0] + y * m[4] + z * m[8] + m[12],
    x * m[1] + y * m[5] + z * m[9] + m[13],
    x * m[2] + y * m[6] + z * m[10] + m[14],
  ];
}

const P_NS = "http://schemas.microsoft.com/3dmanufacturing/production/2015/06";

/**
 * Group build-item triangle ranges into plates using the plate table from
 * Bambu's Metadata/model_settings.config (plater_id + model_instance
 * object_id). Pure: testable without a DOM.
 *
 * @param items - [{objectid, startTri, triCount}] in emission order.
 * @param plateOfObject - Map objectid -> plateId (from the plate table).
 * @param plateMeta - [{id, label}] in display order; optional.
 * @param data - interleaved position/normal stream (6 floats per vertex).
 * @returns plates array [{id, label, ranges, lo, hi, size, center, radius,
 *   triangles}] or null when fewer than two plates.
 */
export function buildPlates(items, plateOfObject, plateMeta, data) {
  if (!plateOfObject || plateOfObject.size === 0) return null;
  const byPlate = new Map();
  for (const it of items) {
    const plate = plateOfObject.get(String(it.objectid));
    if (plate === undefined) continue;
    if (!byPlate.has(plate)) byPlate.set(plate, []);
    byPlate.get(plate).push(it);
  }
  if (byPlate.size < 2) return null;
  const metaById = new Map((plateMeta || []).map(m => [String(m.id), m]));
  const ids = [...byPlate.keys()].sort((a, b) => Number(a) - Number(b));
  const plates = [];
  for (const id of ids) {
    const ranges = byPlate.get(id).map(it => ({ startTri: it.startTri, triCount: it.triCount }));
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], triangles = 0;
    for (const r of ranges) {
      triangles += r.triCount;
      for (let i = r.startTri * 18; i < (r.startTri + r.triCount) * 18; i += 6) {
        for (let j = 0; j < 3; j++) {
          const v = data[i + j];
          if (v < lo[j]) lo[j] = v;
          if (v > hi[j]) hi[j] = v;
        }
      }
    }
    if (!Number.isFinite(lo[0])) continue;
    const size = lo.map((x, i) => hi[i] - x);
    plates.push({
      id,
      label: (metaById.get(String(id)) || {}).label || `盘 ${id}`,
      ranges,
      triangles,
      lo, hi, size,
      center: lo.map((x, i) => (x + hi[i]) / 2),
      radius: Math.hypot(...size) / 2 || 1,
    });
  }
  return plates.length > 1 ? plates : null;
}

/** Read Bambu's plate table: objectid -> plateId plus ordered labels. */
function readPlateTable(files) {
  const entry = files.find(f => f.name.replace(/^\//, "") === "Metadata/model_settings.config");
  if (!entry) return null;
  try {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(entry.data), "application/xml");
    if (doc.querySelector("parsererror")) return null;
    const plateOfObject = new Map();
    const plateMeta = [];
    for (const plate of doc.getElementsByTagName("plate")) {
      let id = null, label = "";
      for (const md of plate.getElementsByTagName("metadata")) {
        if (md.getAttribute("key") === "plater_id") id = md.getAttribute("value");
        if (md.getAttribute("key") === "plater_name" && md.getAttribute("value")) label = md.getAttribute("value");
      }
      if (id === null) continue;
      plateMeta.push({ id, label });
      for (const inst of plate.getElementsByTagName("model_instance")) {
        for (const md of inst.getElementsByTagName("metadata")) {
          if (md.getAttribute("key") === "object_id") {
            const objectId = md.getAttribute("value");
            if (!plateOfObject.has(objectId)) plateOfObject.set(objectId, id);
          }
        }
      }
    }
    return plateOfObject.size ? { plateOfObject, plateMeta } : null;
  } catch { return null; }
}

export async function parse3mf(buf) {
  const files = await unzip(buf);
  const models = files.filter(f => /\.model$/i.test(f.name));
  if (!models.length) throw Error("3MF 中没有 .model 网格");

  // Parse every model file once: object registry, unit factor, materials.
  const registry = new Map();
  for (const f of models) {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(f.data), "application/xml");
    if (doc.querySelector("parsererror")) continue;
    const factor = ({ micron: .001, millimeter: 1, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1000 }[doc.documentElement.getAttribute("unit")] || 1);
    const materialMap = {};
    for (const bm of doc.getElementsByTagNameNS("*", "basematerials")) {
      materialMap[bm.getAttribute("id")] = [...bm.getElementsByTagNameNS("*", "base")]
        .map(base => parseHexColor(base.getAttribute("color")));
    }
    const objects = new Map();
    for (const obj of doc.getElementsByTagNameNS("*", "object")) {
      if (obj.getAttribute("id") !== null) objects.set(obj.getAttribute("id"), obj);
    }
    registry.set(f.name.replace(/^\//, ""), { doc, factor, materialMap, objects, name: f.name.replace(/^\//, "") });
  }

  // Root model: the package relationship target, falling back to the conventional path.
  let rootName = "3D/3dmodel.model";
  const rels = files.find(f => f.name.replace(/^\//, "") === "_rels/.rels");
  if (rels) {
    try {
      const relDoc = new DOMParser().parseFromString(new TextDecoder().decode(rels.data), "application/xml");
      for (const rel of relDoc.getElementsByTagNameNS("*", "Relationship")) {
        if ((rel.getAttribute("Type") || "").endsWith("/3dmodel")) {
          rootName = (rel.getAttribute("Target") || "").replace(/^\//, "");
          break;
        }
      }
    } catch { /* keep conventional default */ }
  }
  const root = registry.get(rootName) || registry.get("3D/3dmodel.model");
  if (!root) throw Error("3MF 中找不到根模型");

  const vals = [], cols = [];
  let triangles = 0, sawColor = false;

  const emitMesh = (mesh, objEl, M, fileRec) => {
    const materialColors = objEl ? fileRec.materialMap[objEl.getAttribute("pid")] || null : null;
    const objColor = materialColors ? materialColors[+(objEl.getAttribute("pindex") || 0)] || null : null;
    const verts = [...mesh.getElementsByTagNameNS("*", "vertex")].map(v => [+v.getAttribute("x") * fileRec.factor, +v.getAttribute("y") * fileRec.factor, +v.getAttribute("z") * fileRec.factor]);
    for (const t of mesh.getElementsByTagNameNS("*", "triangle")) {
      const ids = [+t.getAttribute("v1"), +t.getAttribute("v2"), +t.getAttribute("v3")];
      const raw = [verts[ids[0]], verts[ids[1]], verts[ids[2]]];
      if (!raw[0] || !raw[1] || !raw[2]) continue;
      const pts = raw.map(p => M === MAT4_IDENTITY ? p : mat4Apply(M, p[0], p[1], p[2]));
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
      if (triangles > 5000000) throw Error("模型超过 500 万三角面限制");
    }
  };

  // Walk build items -> objects -> components recursively, composing the
  // row-vector transforms so multi-plate projects land at their true positions.
  const emitObject = (fileRec, objId, M, visiting) => {
    const obj = fileRec.objects.get(objId);
    if (!obj) return;
    const key = fileRec.name + "#" + objId;
    if (visiting.has(key)) return;
    visiting.add(key);
    const mesh = obj.getElementsByTagNameNS("*", "mesh")[0] || null;
    if (mesh) emitMesh(mesh, obj, M, fileRec);
    for (const comp of obj.getElementsByTagNameNS("*", "component")) {
      const path = comp.getAttributeNS(P_NS, "path");
      const childRec = path ? registry.get(path.replace(/^\//, "")) : fileRec;
      if (!childRec) continue;
      const cm = mat4FromTransform(comp.getAttribute("transform"));
      const combined = (M === MAT4_IDENTITY && cm === MAT4_IDENTITY) ? MAT4_IDENTITY : mat4Mul(cm, M);
      emitObject(childRec, comp.getAttribute("objectid"), combined, visiting);
    }
    visiting.delete(key);
  };

  const buildItems = [...root.doc.getElementsByTagNameNS("*", "item")];
  const itemRanges = [];
  if (buildItems.length) {
    for (const item of buildItems) {
      const start = triangles;
      emitObject(root, item.getAttribute("objectid"), mat4FromTransform(item.getAttribute("transform")), new Set());
      if (triangles > start) itemRanges.push({ objectid: item.getAttribute("objectid"), startTri: start, triCount: triangles - start });
    }
  } else {
    // No build section: emit everything reachable from this file's objects.
    for (const id of root.objects.keys()) emitObject(root, id, MAT4_IDENTITY, new Set());
  }
  if (!triangles) throw Error("3MF 中没有可显示的三角网格");
  const data = new Float32Array(vals);
  const mesh = finishMesh(data, triangles);
  if (sawColor) mesh.colors = new Float32Array(cols);
  const plateTable = readPlateTable(files);
  if (plateTable) {
    const plates = buildPlates(itemRanges, plateTable.plateOfObject, plateTable.plateMeta, data);
    if (plates) mesh.plates = plates;
  }
  return mesh;
}
