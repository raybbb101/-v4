// 通信。どのつなぎ方でも同じ形（Host / Guest）で使えるようにしてある。
//  peer   … PeerJS（インターネット経由でルームコード）
//  lan    … 同じ Wi-Fi の PC で server.mjs を動かし、その PC の部屋に入る（WebSocket）
//  direct … サーバーなし。招待コードと返事コードを交換して、端末どうしを直接つなぐ（WebRTC）
// ホストのブラウザが戦いを計算し、ゲストには結果を送る。
const PREFIX = 'mahou-sensou-v4-';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] };
const TIMEOUT_MS = 15000;
const MAX_GUESTS = 3;

const errText = (err) => {
  const t = err && err.type;
  if (t === 'peer-unavailable') return 'そのルームが見つかりません。コードを確認してください。';
  if (t === 'network' || t === 'server-error' || t === 'socket-error') return '接続サーバーに届きません。「同じ Wi-Fi で遊ぶ」も試してください。';
  if (t === 'browser-incompatible') return 'このブラウザはオンライン対戦に対応していません。';
  return '接続できませんでした（' + (t || err) + '）。「同じ Wi-Fi で遊ぶ」も試してください。';
};

// PeerJS の読み込み（unpkg がだめなら jsDelivr から）
function ensurePeer() {
  if (window.Peer) return Promise.resolve(true);
  return new Promise((res) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload = () => res(!!window.Peer); s.onerror = () => res(false);
    document.head.appendChild(s);
  });
}

// ================= PeerJS =================
class PeerHost {
  constructor(H) { this.H = H; this.conns = new Set(); ensurePeer().then((ok) => (ok ? this.open() : H.error('通信ライブラリを読み込めませんでした。「同じ Wi-Fi で遊ぶ」を試してください。'))); }
  open() {
    let code = '';
    for (let i = 0; i < 5; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
    this.peer = new window.Peer(PREFIX + code, { debug: 0, config: ICE });
    const to = setTimeout(() => { if (!this.code) this.H.error('接続サーバーから返事がありません。「同じ Wi-Fi で遊ぶ」を試してください。'); }, TIMEOUT_MS);
    this.peer.on('open', () => { clearTimeout(to); this.code = code; this.H.ready(code); });
    this.peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { this.peer.destroy(); this.open(); }
      else if (!this.code) { clearTimeout(to); this.H.error(errText(err)); }
    });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch { /* 無視 */ } });
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        if (this.conns.size >= MAX_GUESTS || this.locked) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
        this.conns.add(conn); this.H.join(conn);
      });
      conn.on('data', (m) => { if (m && m.t) this.H.message(conn, m); });
      const gone = () => { if (this.conns.delete(conn)) this.H.leave(conn); };
      conn.on('close', gone); conn.on('error', gone);
    });
  }
  send(conn, m) { if (conn.open) conn.send(m); }
  broadcast(m) { for (const c of this.conns) if (c.open) c.send(m); }
  close() { try { this.peer && this.peer.destroy(); } catch { /* 無視 */ } }
}
class PeerGuest {
  constructor(code, H) {
    this.H = H;
    let settled = false;
    const fail = (t) => { if (!settled) { settled = true; H.error(t); this.close(); } };
    ensurePeer().then((ok) => {
      if (!ok) return fail('通信ライブラリを読み込めませんでした。「同じ Wi-Fi で遊ぶ」を試してください。');
      this.peer = new window.Peer({ debug: 0, config: ICE });
      this.peer.on('error', (err) => fail(errText(err)));
      this.peer.on('open', () => {
        const conn = this.peer.connect(PREFIX + code.trim().toUpperCase(), { reliable: true, serialization: 'json' });
        this.conn = conn;
        conn.on('open', () => { settled = true; H.open(); });
        conn.on('data', (m) => { if (m && m.t) H.message(m); });
        conn.on('close', () => { if (settled) H.close(); });
        conn.on('error', () => {});
      });
      setTimeout(() => fail('接続がタイムアウトしました。コードを確認するか、「同じ Wi-Fi で遊ぶ」を試してください。'), TIMEOUT_MS);
    });
  }
  send(m) { if (this.conn && this.conn.open) this.conn.send(m); }
  close() { try { this.peer && this.peer.destroy(); } catch { /* 無視 */ } }
}

// ================= 同じ Wi-Fi の PC（server.mjs） =================
const wsUrl = () => (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
/** server.mjs から開いているときだけ { urls: [...] } が返る */
export async function lanInfo() {
  if (location.protocol === 'file:') return null;
  try { const r = await fetch('lan.json', { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); return j && j.lan ? j : null; } catch { return null; }
}
class LanHost {
  constructor(H) {
    this.H = H; this.conns = new Map();
    const ws = (this.ws = new WebSocket(wsUrl()));
    ws.onopen = () => ws.send(JSON.stringify({ t: 'create' }));
    ws.onerror = () => H.error('この PC のサーバーにつながりません。');
    ws.onclose = () => { for (const c of this.conns.values()) { c.open = false; H.leave(c); } this.conns.clear(); };
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.t === 'created') { this.code = m.code; H.ready(m.code); }
      else if (m.t === 'peer-join') {
        if (this.conns.size >= MAX_GUESTS || this.locked) { ws.send(JSON.stringify({ t: 'to', id: m.id, m: { t: 'full' } })); return; }
        const c = { id: m.id, open: true, send: (x) => ws.send(JSON.stringify({ t: 'to', id: m.id, m: x })) };
        this.conns.set(m.id, c); H.join(c);
      } else if (m.t === 'peer-leave') { const c = this.conns.get(m.id); if (c) { c.open = false; this.conns.delete(m.id); H.leave(c); } }
      else if (m.t === 'from') { const c = this.conns.get(m.id); if (c && m.m && m.m.t) H.message(c, m.m); }
    };
  }
  send(conn, m) { if (conn.open) conn.send(m); }
  broadcast(m) { if (this.ws.readyState === 1 && this.conns.size) this.ws.send(JSON.stringify({ t: 'all', m })); }
  close() { try { this.ws.close(); } catch { /* 無視 */ } }
}
class LanGuest {
  constructor(code, H) {
    this.H = H;
    let settled = false;
    const ws = (this.ws = new WebSocket(wsUrl()));
    ws.onopen = () => ws.send(JSON.stringify({ t: 'join', code: String(code).trim() }));
    ws.onerror = () => { if (!settled) { settled = true; H.error('この PC のサーバーにつながりません。'); } };
    ws.onclose = () => { if (settled) H.close(); };
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.t === 'joined') { settled = true; H.open(); }
      else if (m.t === 'error') { settled = true; H.error(m.msg); }
      else if (m.t === 'rel' && m.m && m.m.t) H.message(m.m);
    };
  }
  send(m) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify({ t: 'rel', m })); }
  close() { try { this.ws.close(); } catch { /* 無視 */ } }
}

// ================= 直接つなぐ（サーバーなし・コード交換） =================
const b64u = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
async function pack(desc) {
  // 必要な行だけ残して小さくする
  const sdp = desc.sdp.split('\r\n').filter((l) => l && !/^a=(extmap|rtcp-fb|ssrc|msid|fmtp)/.test(l)).join('\n');
  const raw = new TextEncoder().encode((desc.type === 'offer' ? 'O' : 'A') + sdp);
  if (window.CompressionStream) {
    const cs = new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw')));
    return 'M4Z' + b64u(new Uint8Array(await cs.arrayBuffer()));
  }
  return 'M4P' + b64u(raw);
}
async function unpack(code) {
  code = String(code).replace(/\s+/g, '');
  const i = code.indexOf('M4'); if (i < 0) throw new Error('コードの形がちがいます');
  code = code.slice(i);
  const kind = code[2], data = unb64u(code.slice(3));
  let raw = data;
  if (kind === 'Z') raw = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  const text = new TextDecoder().decode(raw);
  return { type: text[0] === 'O' ? 'offer' : 'answer', sdp: text.slice(1).split('\n').join('\r\n') + '\r\n' };
}
function gathered(pc, ms = 4000) {
  return new Promise((res) => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, ms);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}
function wrapChannel(dc, pc, onOpen, onMsg, onClose) {
  const c = { open: false, pc, send: (m) => { if (dc.readyState === 'open') dc.send(JSON.stringify(m)); }, close: () => { try { pc.close(); } catch { /* 無視 */ } } };
  dc.onopen = () => { c.open = true; onOpen(c); };
  dc.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m && m.t) onMsg(c, m); } catch { /* 無視 */ } };
  dc.onclose = () => { if (c.open) { c.open = false; onClose(c); } };
  pc.onconnectionstatechange = () => { if ((pc.connectionState === 'failed' || pc.connectionState === 'closed') && c.open) { c.open = false; onClose(c); } };
  return c;
}
export class DirectHost {
  constructor(H) { this.H = H; this.conns = new Set(); this.pending = null; setTimeout(() => H.ready(''), 0); }
  /** 次の仲間のための招待コードを作る */
  async invite() {
    if (this.pending) try { this.pending.close(); } catch { /* 無視 */ }
    const pc = new RTCPeerConnection(ICE), dc = pc.createDataChannel('mahou', { ordered: true });
    const c = wrapChannel(dc, pc, (cc) => { if (this.conns.size >= MAX_GUESTS || this.locked) { cc.send({ t: 'full' }); setTimeout(() => cc.close(), 300); return; } this.conns.add(cc); this.pending = null; this.H.join(cc); }, (cc, m) => this.H.message(cc, m), (cc) => { if (this.conns.delete(cc)) this.H.leave(cc); });
    this.pending = c;
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    return pack(pc.localDescription);
  }
  /** 仲間から届いた返事コードを入れる */
  async accept(code) {
    if (!this.pending) throw new Error('先に招待コードを作ってください');
    const d = await unpack(code); if (d.type !== 'answer') throw new Error('それは「返事コード」ではありません');
    await this.pending.pc.setRemoteDescription(d);
  }
  send(conn, m) { if (conn.open) conn.send(m); }
  broadcast(m) { for (const c of this.conns) c.send(m); }
  close() { for (const c of this.conns) c.close(); if (this.pending) this.pending.close(); }
}
export class DirectGuest {
  constructor(H) { this.H = H; }
  /** 招待コードを入れると、ホストに返す返事コードができる */
  async answer(code) {
    const d = await unpack(code); if (d.type !== 'offer') throw new Error('それは「招待コード」ではありません');
    const pc = (this.pc = new RTCPeerConnection(ICE));
    pc.ondatachannel = (ev) => { this.c = wrapChannel(ev.channel, pc, () => this.H.open(), (c, m) => this.H.message(m), () => this.H.close()); };
    await pc.setRemoteDescription(d);
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    return pack(pc.localDescription);
  }
  send(m) { if (this.c) this.c.send(m); }
  close() { try { this.pc && this.pc.close(); } catch { /* 無視 */ } }
}

export function makeHost(kind, H) { return kind === 'lan' ? new LanHost(H) : kind === 'direct' ? new DirectHost(H) : new PeerHost(H); }
export function makeGuest(kind, code, H) { return kind === 'lan' ? new LanGuest(code, H) : kind === 'direct' ? new DirectGuest(H) : new PeerGuest(code, H); }
