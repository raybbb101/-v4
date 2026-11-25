// オンライン協力（2〜4 人）。「パトロール」と同じつなぎ方：PeerJS でブラウザ同士を直接つなぐ。
// 大事な点：PeerJS の標準設定のまま使う（中継サーバー TURN が入っているので、スマホの回線やルーター越しでもつながる）。
// 部屋を作った人（ホスト）のブラウザが戦いを計算し、仲間には結果を送る。
const PREFIX = 'mahou-sensou-v4-room-';
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MAX_GUESTS = 3;

let peerLib = null;
/** PeerJS を読み込む（unpkg がだめなら jsDelivr） */
export function loadPeer() {
  if (window.Peer) return Promise.resolve();
  if (!peerLib) peerLib = new Promise((res, rej) => {
    const urls = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
    const tryAt = (i) => {
      if (i >= urls.length) { peerLib = null; rej(new Error('load failed')); return; }
      const s = document.createElement('script'); s.src = urls[i];
      s.onload = () => (window.Peer ? res() : tryAt(i + 1)); s.onerror = () => tryAt(i + 1);
      document.head.appendChild(s);
    };
    tryAt(0);
  });
  return peerLib;
}
const LOAD_FAIL = 'オンライン用の部品を読み込めませんでした。インターネットにつながっているか確認して、もう一度ためしてください。';
const errText = (t) => ({
  'peer-unavailable': 'その番号のルームが見つかりません。コードを確認してください（ホストがルーム画面を開いたままか確認）。',
  network: '接続サーバーに届きません。インターネットを確認してください。',
  'server-error': '接続サーバーが混んでいます。少し待ってもう一度。',
  'socket-error': '接続サーバーに届きません。インターネットを確認してください。',
  'socket-closed': '接続サーバーとの接続が切れました。もう一度ためしてください。',
  'browser-incompatible': 'このブラウザはオンラインに対応していません（Chrome か Safari の最新版を使ってください）。',
  disconnected: '接続サーバーとの接続が切れました。',
}[t] || 'つながりませんでした（' + t + '）。もう一度ためしてください。');

/** ホスト。H: { ready(code), join(conn), message(conn, msg), leave(conn), error(text) } */
export class Host {
  constructor(H) {
    this.H = H; this.conns = new Set(); this.locked = false; this.closed = false;
    loadPeer().then(() => this.open(), () => H.error(LOAD_FAIL));
  }
  open() {
    if (this.closed) return;
    this.code = Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    const peer = (this.peer = new window.Peer(PREFIX + this.code));
    peer.on('open', () => this.H.ready(this.code));
    peer.on('connection', (c) => {
      // パトロールと同じ：仲間からの最初のメッセージ（あいさつ）で受け入れる
      c.on('data', (m) => {
        if (!m || typeof m !== 'object' || !m.t) return;
        if (!this.conns.has(c)) {
          if (this.conns.size >= MAX_GUESTS || this.locked) { try { c.send({ t: m.t === 'name' ? (this.locked ? 'reject' : 'full') : 'full', text: 'もう冒険が始まっています。' }); } catch { /* 無視 */ } setTimeout(() => c.close(), 400); return; }
          this.conns.add(c); c.lastSeen = performance.now(); this.H.join(c);
        }
        c.lastSeen = performance.now();
        this.H.message(c, m);
      });
      const gone = () => { if (this.conns.delete(c)) this.H.leave(c); };
      c.on('close', gone); c.on('error', gone);
    });
    peer.on('disconnected', () => { if (!this.closed && this.peer === peer) try { peer.reconnect(); } catch { /* 無視 */ } });
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id') { try { peer.destroy(); } catch { /* 無視 */ } this.open(); return; }
      if (e.type === 'peer-unavailable') return;
      this.H.error(errText(e.type));
    });
  }
  /** 12 秒なにも届かない仲間は抜けたことにする */
  check() { const now = performance.now(); for (const c of [...this.conns]) if (now - c.lastSeen > 12000) { this.conns.delete(c); try { c.close(); } catch { /* 無視 */ } this.H.leave(c); } }
  send(c, m) { if (c.open) try { c.send(m); } catch { /* 無視 */ } }
  broadcast(m) { for (const c of this.conns) if (c.open) try { c.send(m); } catch { /* 無視 */ } }
  close() { this.closed = true; try { this.peer && this.peer.destroy(); } catch { /* 無視 */ } }
}

/** ゲスト。H: { open(), message(msg), close(), error(text) } */
export class Guest {
  constructor(code, H) {
    this.H = H; this.closed = false; this.welcomed = false;
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    loadPeer().then(() => {
      if (this.closed) return;
      const peer = (this.peer = new window.Peer());
      this.timer = setTimeout(() => { if (!this.welcomed) { H.error('ルームに届きませんでした。コードを確認して、もう一度ためしてください。'); this.close(); } }, 15000);
      peer.on('open', () => {
        const conn = (this.conn = peer.connect(PREFIX + code, { reliable: true }));
        conn.on('open', () => H.open());
        conn.on('data', (m) => { if (!m || typeof m !== 'object' || !m.t) return; this.lastSeen = performance.now(); if (!this.welcomed) { this.welcomed = true; clearTimeout(this.timer); } H.message(m); });
        conn.on('close', () => this.lost());
        conn.on('error', () => this.lost());
      });
      peer.on('disconnected', () => { if (!this.closed) try { peer.reconnect(); } catch { /* 無視 */ } });
      peer.on('error', (e) => {
        if (this.welcomed && e.type !== 'peer-unavailable') return;
        clearTimeout(this.timer); H.error(errText(e.type)); this.close();
      });
    }, () => H.error(LOAD_FAIL));
  }
  lost() { if (this.closed) return; this.close(); this.H.close(); }
  /** 12 秒なにも届かなければ切れたことにする */
  check() { if (this.welcomed && this.lastSeen && performance.now() - this.lastSeen > 12000) this.lost(); }
  send(m) { if (this.conn && this.conn.open) try { this.conn.send(m); } catch { /* 無視 */ } }
  close() { this.closed = true; clearTimeout(this.timer); try { this.peer && this.peer.destroy(); } catch { /* 無視 */ } }
}
