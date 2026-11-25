#!/usr/bin/env node
// 魔法戦争 v4 の「同じ Wi-Fi 用サーバー」。インストール不要（Node.js 18 以上だけ）。
//   node server.mjs [ポート]
// このゲームを配信し、同じ Wi-Fi の端末どうしの部屋（WebSocket の中継）を持つ。戦いの計算は部屋を作った人のブラウザで行う。
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = +(process.argv[2] || process.env.PORT || 8080);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

function lanUrls() {
  const out = [];
  for (const list of Object.values(networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) out.push(`http://${n.address}:${PORT}/`);
  return out;
}

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/lan.json') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ lan: true, urls: lanUrls() })); return; }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT) || !(await stat(file)).isFile()) throw 0;
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

// ---------- WebSocket（RFC 6455 の最小実装） ----------
function frame(text) {
  const data = Buffer.from(text), n = data.length;
  let head;
  if (n < 126) head = Buffer.from([0x81, n]);
  else if (n < 65536) head = Buffer.from([0x81, 126, n >> 8, n & 255]);
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([head, data]);
}
let nextId = 1;
class Conn {
  constructor(socket) {
    this.socket = socket; this.buf = Buffer.alloc(0); this.alive = true; this.id = 'g' + nextId++; this.frag = null;
    socket.on('data', (d) => this.feed(d));
    socket.on('close', () => this.close());
    socket.on('error', () => this.close());
  }
  close() { if (!this.alive) return; this.alive = false; this.socket.destroy(); onClose(this); }
  send(obj) { if (this.alive && this.socket.writable) this.socket.write(frame(typeof obj === 'string' ? obj : JSON.stringify(obj))); }
  feed(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (this.buf.length >= 2) {
      const fin = this.buf[0] & 128, op = this.buf[0] & 15, masked = this.buf[1] & 128;
      let len = this.buf[1] & 127, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      if (len > 4 << 20) return this.close();
      const total = off + (masked ? 4 : 0) + len;
      if (this.buf.length < total) return;
      let payload = this.buf.subarray(off + (masked ? 4 : 0), total);
      if (masked) { const m = this.buf.subarray(off, off + 4); payload = Buffer.from(payload.map((b, i) => b ^ m[i & 3])); }
      this.buf = this.buf.subarray(total);
      if (op === 8) return this.close();
      if (op === 9) { this.socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
      if (op === 1 || op === 2) this.frag = payload; else if (op === 0 && this.frag) this.frag = Buffer.concat([this.frag, payload]);
      if (fin && this.frag) { const p = this.frag; this.frag = null; try { onMessage(this, JSON.parse(p.toString())); } catch { /* 無視 */ } }
    }
  }
}

// ---------- 部屋（ホストとゲストの中継だけ） ----------
const rooms = new Map();
const newCode = () => { let c; do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (rooms.has(c)); return c; };
function onMessage(c, m) {
  if (m.t === 'create') { const code = newCode(); rooms.set(code, { host: c, guests: new Map() }); c.room = code; c.isHost = true; c.send({ t: 'created', code }); return; }
  if (m.t === 'join') {
    const r = rooms.get(String(m.code)); if (!r) return c.send({ t: 'error', msg: 'その部屋が見つかりません。番号を確認してください。' });
    r.guests.set(c.id, c); c.room = String(m.code); c.send({ t: 'joined' }); r.host.send({ t: 'peer-join', id: c.id }); return;
  }
  const r = rooms.get(c.room); if (!r) return;
  if (c.isHost) {
    if (m.t === 'to') { const g = r.guests.get(m.id); if (g) g.send({ t: 'rel', m: m.m }); }
    else if (m.t === 'all') { const s = JSON.stringify({ t: 'rel', m: m.m }); for (const g of r.guests.values()) g.send(s); }
  } else if (m.t === 'rel') r.host.send({ t: 'from', id: c.id, m: m.m });
}
function onClose(c) {
  const r = rooms.get(c.room); if (!r) return;
  if (c.isHost) { for (const g of r.guests.values()) g.close(); rooms.delete(c.room); }
  else { r.guests.delete(c.id); r.host.send({ t: 'peer-leave', id: c.id }); }
}
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.setNoDelay(true);
  new Conn(socket);
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  魔法戦争 v4   http://localhost:${PORT}/`);
  const u = lanUrls();
  if (u.length) { console.log('\n  同じ Wi-Fi の仲間は、スマホや PC のブラウザでこれを開いてください:'); for (const x of u) console.log('    ' + x); }
  console.log('\n  止めるときは Ctrl + C\n');
});
