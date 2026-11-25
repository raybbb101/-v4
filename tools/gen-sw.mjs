// sw.js を作り直す: ゲームに必要なファイルを全部先に取っておく（オフラインでも遊べる）
import { readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { createHash } from 'crypto';
const root = new URL('..', import.meta.url).pathname;
const files = ['./', 'index.html', 'style.css', 'manifest.webmanifest'];
const walk = (d) => { for (const f of readdirSync(join(root, d))) { const p = join(d, f); if (statSync(join(root, p)).isDirectory()) walk(p); else if (/\.(js|png)$/.test(f)) files.push(p); } };
walk('js'); walk('icons'); walk('pixelfx/src');
const h = createHash('sha1'); for (const f of files.slice(1)) h.update(readFileSync(join(root, f)));
const ver = h.digest('hex').slice(0, 10);
writeFileSync(join(root, 'sw.js'), `// 自動生成（node tools/gen-sw.mjs）。オフラインで遊べるように全部のファイルを持っておく。
const CACHE = 'mahou-v4-${ver}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith('mahou-v4-')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })));
});
`);
console.log('sw.js', files.length, 'files', ver);
