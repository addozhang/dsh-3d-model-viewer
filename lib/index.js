import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { extname, resolve, relative, sep } from 'node:path';

export const inject = ['webServer'];
const ROOT = resolve(process.cwd());
const EXTENSIONS = new Set(['.stl', '.3mf']);
const SKIP = new Set(['node_modules', '.git', '.svn', '.hg', '.dsh']);

function insideRoot(path) {
  const rel = relative(ROOT, path);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !rel.startsWith(sep);
}

async function models() {
  const found = [];
  async function walk(dir, depth) {
    if (depth > 5 || found.length >= 200) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (found.length >= 200) break;
      if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(full, depth + 1);
      else if (entry.isFile() && EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        try {
          const info = await stat(full);
          found.push({ path: relative(ROOT, full).split(sep).join('/'), name: entry.name, size: info.size, mtime: info.mtimeMs });
        } catch {}
      }
    }
  }
  await walk(ROOT, 0);
  return found.sort((a, b) => b.mtime - a.mtime);
}

export function apply(ctx) {
  ctx.webServer.register({
    kind: 'exact',
    path: '/3d-model-viewer/files',
    async handler(req, res) {
      if (req.method !== 'GET') { res.writeHead(405).end(); return; }
      const url = new URL(req.url ?? '', 'http://localhost');
      const requested = url.searchParams.get('path');
      if (requested === null) {
        const body = JSON.stringify({ root: ROOT, files: await models() });
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(body) });
        res.end(body);
        return;
      }
      const full = resolve(ROOT, requested);
      if (!insideRoot(full) || !EXTENSIONS.has(extname(full).toLowerCase())) { res.writeHead(403).end(); return; }
      let info;
      try { info = await stat(full); } catch { res.writeHead(404).end(); return; }
      if (!info.isFile() || info.size > 250 * 1024 * 1024) { res.writeHead(413).end(); return; }
      res.writeHead(200, {
        'content-type': extname(full).toLowerCase() === '.3mf' ? 'model/3mf' : 'model/stl',
        'content-length': info.size,
        'cache-control': 'no-store',
        'x-model-mtime': String(info.mtimeMs),
      });
      createReadStream(full).pipe(res);
    },
  });
}
