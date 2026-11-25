// PeerJS（WebRTC）でブラウザ同士を直接つなぐ。サーバーは要らない（GitHub Pages だけで動く）。
// ホストが「ルームコード」を作り、ゲストはそのコードを入力して入る。戦いの計算はホストのブラウザで行う。
const PREFIX = 'mahou-sensou-v4-';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] };
const TIMEOUT_MS = 15000;

const errText = (err) => {
  const t = err && err.type;
  if (t === 'peer-unavailable') return 'そのルームが見つかりません。コードを確認してください。';
  if (t === 'network' || t === 'server-error' || t === 'socket-error') return '接続サーバーに届きません。インターネット接続を確認してください。';
  if (t === 'browser-incompatible') return 'このブラウザはオンライン対戦に対応していません。';
  return '接続できませんでした（' + (t || err) + '）';
};

/** ホスト。H: { ready(code), join(conn), message(conn, msg), leave(conn), error(text) } 最大 4 人 */
export class Host {
  constructor(H) { this.H = H; this.conns = new Set(); this.open(); }
  open() {
    if (!window.Peer) { this.H.error('通信ライブラリ（PeerJS）を読み込めませんでした。'); return; }
    let code = '';
    for (let i = 0; i < 5; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
    this.peer = new window.Peer(PREFIX + code, { debug: 0, config: ICE });
    this.peer.on('open', () => { this.code = code; this.H.ready(code); });
    this.peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { this.peer.destroy(); this.open(); }
      else if (!this.code) this.H.error(errText(err));
    });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch { /* 無視 */ } });
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        if (this.conns.size >= 3 || this.locked) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
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

/** ゲスト。H: { open(), message(msg), close(), error(text) } */
export class Guest {
  constructor(code, H) {
    this.H = H;
    let settled = false;
    const fail = (t) => { if (!settled) { settled = true; H.error(t); this.close(); } };
    if (!window.Peer) { fail('通信ライブラリ（PeerJS）を読み込めませんでした。'); return; }
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
    setTimeout(() => fail('接続がタイムアウトしました。コードを確認するか、もう一度試してください。'), TIMEOUT_MS);
  }
  send(m) { if (this.conn && this.conn.open) this.conn.send(m); }
  close() { try { this.peer && this.peer.destroy(); } catch { /* 無視 */ } }
}
