// 起動・入力・ゲームの流れ・通信のまとめ役
import './models.js';
import { warm, drawModel, SQ } from './stack.js';
import { createGame, step, makeView, choose, buy, roomInfo, setPaused, PCOLORS, devJump } from './sim.js';
import { Renderer } from './render.js';
import { Host, Guest } from './net.js';
import { initAudio, sfx, playSong, setMuted, isMuted } from './audio.js';
import { SPELL, META, MAX_LV } from './spells.js';
import { DIFFS, BIOMES } from './enemies.js';
import * as UI from './ui.js';
import { createFrame, clearFrame, createFx, composite } from '../pixelfx/src/core/index.js';
import * as F from './fxmods.js';
import { PALS } from './fxreg.js';

const $ = UI.$;
const SAVE_KEY = 'mahou-sensou-v4';

// ---------- 保存 ----------
function loadSave() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { /* 無視 */ }
  return Object.assign({ name: '', diff: 1, crystals: 0, meta: {}, seen: {}, best: 0, runs: 0, muted: false }, s || {});
}
const save = loadSave();
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 無視 */ } }

// ---------- 状態 ----------
const S = { mode: 'title', G: null, me: 'p0', host: null, guest: null, lobby: [], snaps: [], lastView: null, paused: false, choiceOpen: false, shopOpen: false, ended: false, sendT: 0, inT: 0, code: '', auto: true, startedAt: 0 };
const canvas = $('game');
const R = new Renderer(canvas);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// ---------- 入力 ----------
const keys = new Set();
const latch = { dash: false, cast: [false, false, false, false, false, false], use: false };
const mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
const stick = { x: 0, y: 0, id: null };
const typing = () => document.activeElement && (document.activeElement.tagName === 'INPUT');

addEventListener('keydown', (e) => {
  initAudio();
  if (typing()) {
    if (e.key === 'Escape') { document.activeElement.blur(); $('chatIn').classList.add('hidden'); }
    return;
  }
  const k = e.key.toLowerCase();
  if (S.mode === 'play') {
    if (S.choiceOpen && /^[1-5]$/.test(k)) { const btn = $('cards').querySelectorAll('.card')[+k - 1]; if (btn) btn.click(); return; }
    if (/^[1-6]$/.test(k)) { latch.cast[+k - 1] = true; e.preventDefault(); }
    if (k === ' ') { latch.dash = true; e.preventDefault(); }
    if (k === 't') { S.auto = !S.auto; UI.toast(S.auto ? '自動詠唱：魔法を自動で撃つ' : '手動詠唱：1〜6 キーとマウスで狙う'); }
    if (k === 'e') latch.use = true;
    if (k === 'escape') { if (S.shopOpen) closeShop(); else togglePause(); }
    if (k === 'enter' && (S.host || S.guest)) { $('chatIn').classList.remove('hidden'); $('chatIn').focus(); e.preventDefault(); }
  }
  if (k === 'f' && !typing()) toggleFull();
  if (k === 'm') { setMuted(!isMuted()); save.muted = isMuted(); writeSave(); UI.toast(isMuted() ? '音を消した' : '音を出した'); }
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; } });
canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  if (e.pointerType !== 'mouse') return;
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) latch.dash = true;
});
addEventListener('pointerup', (e) => { if (e.button === 0) mouse.down = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// タッチのスティック
if (isTouch) {
  const st = $('stick'), knob = $('knob');
  const move = (e) => {
    const r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    stick.x = dx; stick.y = dy; knob.style.transform = `translate(${dx * 35}px, ${dy * 35}px)`;
  };
  st.addEventListener('pointerdown', (e) => { stick.id = e.pointerId; st.setPointerCapture(e.pointerId); move(e); initAudio(); });
  st.addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) move(e); });
  const end = (e) => { if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; } };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  $('tDash').addEventListener('pointerdown', (e) => { e.preventDefault(); latch.dash = true; });
  $('tUse').addEventListener('pointerdown', (e) => { e.preventDefault(); latch.use = true; });
}

function readInput() {
  let mx = 0, my = 0;
  if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
  if (keys.has('d') || keys.has('arrowright')) mx += 1;
  if (keys.has('w') || keys.has('arrowup')) my -= 1;
  if (keys.has('s') || keys.has('arrowdown')) my += 1;
  if (stick.id != null) { mx = stick.x; my = stick.y; }
  // 画面の縦は床が縮んでいるので、見た目どおりに動くよう少し補正
  const w = R.toWorld(mouse.x, mouse.y);
  const inp = { mx, my, ax: Math.round(w.x), ay: Math.round(w.y + 12 / SQ), fire: mouse.down && !S.auto, dash: latch.dash, cast: latch.cast.slice(), auto: S.auto };
  return inp;
}
function clearLatch() { latch.dash = false; latch.cast.fill(false); latch.use = false; }

// ---------- 画面の切り替え ----------
function toTitle() {
  S.mode = 'title'; S.G = null; S.ended = false;
  if (S.host) { S.host.close(); S.host = null; } if (S.guest) { S.guest.close(); S.guest = null; }
  for (const id of ['hud', 'choice', 'shop', 'pause', 'result', 'lobby', 'book', 'altar']) UI.show(id, false);
  UI.show('title'); $('crystalCount').textContent = save.crystals; $('titleStatus').textContent = '';
  R.room = null; playSong(5);
}

function startRun(players, diff) {
  S.G = createGame({ players, diff, meta: save.meta });
  S.mode = 'play'; S.ended = false; S.startedAt = performance.now();
  for (const id of ['title', 'lobby', 'result']) UI.show(id, false);
  UI.show('hud'); UI.show('touch', isTouch); if (isTouch) S.auto = true;
  $('roomBox').classList.toggle('hidden', !S.host);
  $('hudCode').textContent = S.code;
  save.runs++; writeSave();
}

// ---------- ソロ ----------
$('btnSolo').onclick = () => { initAudio(); sfx('ui'); S.me = 'p0'; startRun([{ id: 'p0', name: myName() }], save.diff); };
function myName() { const n = $('nameInput').value.trim() || '魔法使い'; save.name = n; writeSave(); return n; }

// ---------- ホスト ----------
$('btnHost').onclick = () => {
  initAudio(); sfx('ui');
  $('titleStatus').textContent = 'ルームを作っています…';
  S.me = 'p0'; S.lobby = [{ id: 'p0', name: myName(), conn: null }];
  S.host = new Host({
    ready: (code) => { S.code = code; openLobby(true); },
    join: (conn) => {
      const id = 'p' + (Date.now() % 100000) + Math.floor(Math.random() * 99);
      conn._pid = id; S.lobby.push({ id, name: '…', conn });
      S.host.send(conn, { t: 'hello', id, diff: save.diff, code: S.code });
      lobbyUpdate();
      if (S.mode === 'play') { S.host.send(conn, { t: 'reject', text: 'もう冒険が始まっています。次のルームで一緒に遊ぼう。' }); }
    },
    message: (conn, m) => hostMsg(conn, m),
    leave: (conn) => {
      const pl = S.lobby.find((q) => q.conn === conn); S.lobby = S.lobby.filter((q) => q.conn !== conn);
      if (pl) { sysChat(`${pl.name} が抜けました`); if (S.G) { const p = S.G.players.find((q) => q.id === pl.id); if (p) { p.dead = true; p.hp = 0; p.left = true; } } }
      lobbyUpdate();
    },
    error: (t) => { $('titleStatus').textContent = t; S.host = null; },
  });
};
const hostInputs = {};
function hostMsg(conn, m) {
  const pid = conn._pid;
  switch (m.t) {
    case 'name': { const pl = S.lobby.find((q) => q.conn === conn); if (pl) { pl.name = String(m.name || '仲間').slice(0, 10); sysChat(`${pl.name} が入りました`); lobbyUpdate(); } break; }
    case 'in': {
      const prev = hostInputs[pid] || {};
      const cast = (m.cast || []).map((v, i) => v || (prev.cast && prev.cast[i]));
      hostInputs[pid] = { ...m, cast, dash: m.dash || prev.dash };
      break;
    }
    case 'pick': if (S.G) choose(S.G, pid, m.idx); break;
    case 'buy': if (S.G) buy(S.G, pid, m.i); break;
    case 'chat': { const pl = S.lobby.find((q) => q.conn === conn); const text = String(m.text || '').slice(0, 80); if (pl && text) { S.host.broadcast({ t: 'chat', name: pl.name, text }); showChat(pl.name, text); } break; }
  }
}
function lobbyUpdate() {
  $('lobbyPlayers').innerHTML = S.lobby.map((q, i) => `<li style="--c:${PCOLORS[i % 4]}">${i === 0 ? '👑 ' : ''}${escapeHtml(q.name)}${q.id === S.me ? '（あなた）' : ''}</li>`).join('');
  if (S.host) S.host.broadcast({ t: 'lobby', list: S.lobby.map((q) => ({ id: q.id, name: q.name })) });
}
function openLobby(isHost) {
  S.mode = 'lobby';
  UI.show('title', false); UI.show('lobby');
  $('lobbyTitle').textContent = isHost ? 'ルームを作りました' : 'ルームに入りました';
  $('lobbyCode').textContent = S.code;
  $('codeBox').classList.toggle('hidden', !S.code);
  $('btnStart').classList.toggle('hidden', !isHost);
  $('lobbyHint').textContent = isHost ? '仲間にこのコードを伝えてください（最大 4 人）。そろったら「冒険を始める」。' : 'ホストが冒険を始めるのを待っています…';
  $('lobbyChat').innerHTML = '';
  lobbyUpdate();
}
$('copyCode').onclick = () => { navigator.clipboard?.writeText(S.code); UI.toast('コードをコピーしました'); };
$('copyLink').onclick = () => { const u = location.origin + location.pathname + '?room=' + S.code; navigator.clipboard?.writeText(u); UI.toast('招待リンクをコピーしました'); };
$('btnStart').onclick = () => {
  if (!S.host) return;
  S.host.locked = true;
  const players = S.lobby.map((q) => ({ id: q.id, name: q.name }));
  S.host.broadcast({ t: 'start', players });
  startRun(players, save.diff);
};
$('btnLeave').onclick = () => toTitle();

// ---------- ゲスト ----------
$('btnJoin').onclick = () => {
  initAudio(); sfx('ui');
  const code = $('codeInput').value.trim().toUpperCase();
  if (code.length < 5) { $('titleStatus').textContent = 'コードは 5 文字です'; return; }
  $('titleStatus').textContent = '接続しています…';
  S.code = code;
  S.guest = new Guest(code, {
    open: () => { S.guest.send({ t: 'name', name: myName() }); },
    message: (m) => guestMsg(m),
    close: () => { if (S.mode !== 'title') { UI.toast('ホストとの接続が切れました'); setTimeout(toTitle, 1500); } },
    error: (t) => { $('titleStatus').textContent = t; S.guest = null; },
  });
};
function guestMsg(m) {
  switch (m.t) {
    case 'hello': S.me = m.id; openLobby(false); break;
    case 'full': $('titleStatus').textContent = 'このルームは満員です'; break;
    case 'reject': $('titleStatus').textContent = m.text; break;
    case 'lobby': S.lobby = m.list; $('lobbyPlayers').innerHTML = m.list.map((q, i) => `<li style="--c:${PCOLORS[i % 4]}">${i === 0 ? '👑 ' : ''}${escapeHtml(q.name)}${q.id === S.me ? '（あなた）' : ''}</li>`).join(''); break;
    case 'start': S.mode = 'play'; S.snaps = []; for (const id of ['title', 'lobby']) UI.show(id, false); UI.show('hud'); UI.show('touch', isTouch); $('roomBox').classList.remove('hidden'); $('hudCode').textContent = S.code; break;
    case 'snap': {
      S.snaps.push({ t: performance.now(), v: m.v }); if (S.snaps.length > 6) S.snaps.shift();
      for (const e of m.ev) handleEvent(e);
      break;
    }
    case 'chat': showChat(m.name, m.text); break;
  }
}

// ---------- チャット ----------
function showChat(name, text) { UI.chatLine($('lobbyChat'), name, text); UI.chatLine($('chatLog'), name, text); if (S.mode === 'play') sfx('ui'); }
function sysChat(text) { UI.chatLine($('lobbyChat'), '', text, true); UI.chatLine($('chatLog'), '', text, true); }
function sendChat(text) {
  text = text.trim().slice(0, 80); if (!text) return;
  if (S.host) { const me = S.lobby[0]; S.host.broadcast({ t: 'chat', name: me.name, text }); showChat(me.name, text); }
  else if (S.guest) S.guest.send({ t: 'chat', text });
}
for (const id of ['lobbyChatIn', 'chatIn']) $(id).addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { sendChat(e.target.value); e.target.value = ''; if (id === 'chatIn') { e.target.blur(); e.target.classList.add('hidden'); } }
  e.stopPropagation();
});

// ---------- イベント（音・文字・絵） ----------
function handleEvent(e) {
  R.event(e);
  switch (e.e) {
    case 'sfx': sfx(e.s); break;
    case 'room': R.setRoom(e); R.camInit = false; playSong(e.type === 'boss' ? 4 : BIOMES[e.biome].bgm); closeShop(); break;
    case 'toast': if (!e.pid || e.pid === S.me) UI.toast(e.text); break;
    case 'banner': UI.banner(e.text, e.sub); break;
    case 'bossIntro': UI.banner(e.name, e.title); sfx('roar'); break;
    case 'bossDown': UI.banner(e.name + ' 撃破！', ''); break;
    case 'cutin': { const v = S.lastView; const who = v && v.players.length > 1 ? (v.players.find((q) => q.id === e.pid) || {}).name : ''; UI.cutin(e, who); break; }
    case 'levelup': if (e.pid === S.me) sfx('levelup'); break;
    case 'evolve': if (e.pid === S.me) { sfx('evolve'); const sp = SPELL[e.sid]; UI.banner(e.lv >= 10 ? 'アルティメット覚醒！' : '魔法が進化した！', sp.tiers[e.lv >= 10 ? 3 : e.lv >= 6 ? 2 : 1].name); } break;
    case 'hurt': if (e.pid === S.me) sfx('hurt'); break;
    case 'crystal': break;
    case 'victory': UI.banner('四つの世界を制した！', 'さらに深淵へ… 魔物は強くなっていく'); sfx('clear'); break;
    case 'gameover': endRun(); break;
    case 'travel': break;
  }
}

// ---------- 選択・店 ----------
function pickChoice(i) { sfx('pick'); if (S.guest) S.guest.send({ t: 'pick', idx: i }); else choose(S.G, S.me, i); UI.show('choice', false); S.choiceOpen = false; S.choiceSig = ''; }
function syncChoice(p) {
  if (!p || !p.ch) { if (S.choiceOpen) { UI.show('choice', false); S.choiceOpen = false; S.choiceSig = ''; } return; }
  const sig = JSON.stringify(p.ch) + p.rr;
  if (sig === S.choiceSig) return;
  S.choiceSig = sig; S.choiceOpen = true;
  UI.showChoices(p.ch, p.rr, pickChoice, () => { sfx('ui'); if (S.guest) S.guest.send({ t: 'pick', idx: 'reroll' }); else choose(S.G, S.me, 'reroll'); }, () => pickChoice('skip'));
}
function openShop(v) {
  const p = v.players.find((q) => q.id === S.me);
  S.shopOpen = true;
  UI.showShop(v.shop, S.me, p.gold, (i) => { if (S.guest) S.guest.send({ t: 'buy', i }); else buy(S.G, S.me, i); setTimeout(() => S.shopOpen && openShop(S.lastView), 120); });
}
function closeShop() { S.shopOpen = false; UI.show('shop', false); }
$('btnShopClose').onclick = closeShop;

// ---------- 一時停止 ----------
function togglePause() {
  const open = $('pause').classList.contains('hidden');
  UI.show('pause', open);
  S.paused = open;
  if (S.G && !S.host && !S.guest) setPaused(S.G, open);
  if (open) UI.pauseSpells(S.lastView && S.lastView.players.find((q) => q.id === S.me));
}
$('btnPause').onclick = togglePause; $('btnResume').onclick = togglePause;
$('btnQuit').onclick = () => { if (S.G && !S.ended) { save.crystals += Math.round((S.G.crystals || 0) * 0.5); writeSave(); } toTitle(); };
$('btnSound').onclick = () => { setMuted(!isMuted()); save.muted = isMuted(); writeSave(); $('btnSound').textContent = '音: ' + (isMuted() ? 'OFF' : 'ON'); };
$('btnAuto').onclick = () => { S.auto = !S.auto; };
$('btnBook2').onclick = () => UI.showBook(save);

// ---------- 終わり ----------
function endRun() {
  if (S.ended) return; S.ended = true;
  const v = S.lastView; if (!v) return;
  const mul = [0.6, 1, 1.5, 2][save.diff] || 1;
  const gained = Math.round((v.crystals + v.kills * 0.05 + v.depth * 10) * mul);
  save.crystals += gained; save.best = Math.max(save.best, v.depth * 10 + v.room); writeSave();
  const p = v.players.find((q) => q.id === S.me);
  const time = Math.round((performance.now() - S.startedAt) / 1000);
  $('resultTitle').textContent = v.won ? '伝説の魔法使い' : '力尽きた…';
  $('resultBody').innerHTML = `<div class="big">${BIOMES[v.biome].name} ${v.roomType === 'boss' ? 'ボス' : v.room + ' 部屋目'}まで到達</div>
    倒した数 ${v.kills} ・ レベル ${p ? p.lv : '-'} ・ 与えたダメージ ${p ? p.dmg : 0} ・ ${Math.floor(time / 60)}分${time % 60}秒<br>
    魔石 <b style="color:#c69bff">+${gained}</b>（合計 ${save.crystals}）<br>
    ${p ? p.spells.map((s) => `<img src="${UI.spellIcon(s[0], s[1])}" width="28" height="28" style="image-rendering:pixelated;vertical-align:middle" title="${SPELL[s[0]].name} Lv${s[1]}">`).join(' ') : ''}`;
  UI.show('result');
  sfx('pdie');
}
$('btnAgain').onclick = toTitle;

// ---------- 魔導書・祭壇・全画面・インストール ----------
$('btnBook').onclick = () => { sfx('ui'); UI.showBook(save); };
$('btnBookClose').onclick = () => UI.show('book', false);
$('btnAltar').onclick = () => { sfx('ui'); openAltar(); };
function openAltar() { UI.showAltar(save, (id) => { const m = META.find((q) => q.id === id), l = save.meta[id] || 0; if (l >= m.max || save.crystals < m.cost(l)) return; save.crystals -= m.cost(l); save.meta[id] = l + 1; writeSave(); sfx('gem'); $('crystalCount').textContent = save.crystals; openAltar(); }); }
$('btnAltarClose').onclick = () => UI.show('altar', false);
function toggleFull() {
  if (!document.fullscreenElement) { (document.documentElement.requestFullscreen?.() || Promise.resolve()).then(() => { try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* 無視 */ } }).catch(() => {}); }
  else document.exitFullscreen?.();
}
$('btnFull').onclick = toggleFull; $('btnFull2').onclick = toggleFull;
let deferredInstall = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; $('btnInstall').classList.remove('hidden'); });
$('btnInstall').onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('btnInstall').classList.add('hidden'); };
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) { $('btnInstall').classList.remove('hidden'); $('btnInstall').onclick = () => UI.toast('共有ボタン → 「ホーム画面に追加」でインストールできます'); }
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

// ---------- タイトル ----------
$('nameInput').value = save.name;
UI.showDiffs(save.diff, function pick(i) { save.diff = i; writeSave(); UI.showDiffs(i, pick); });
setMuted(save.muted); $('btnSound').textContent = '音: ' + (save.muted ? 'OFF' : 'ON');
const qs = new URLSearchParams(location.search).get('room');
if (qs) { $('codeInput').value = qs.toUpperCase(); $('titleStatus').textContent = '招待されたルームです。「参加する」を押してください。'; }
$('crystalCount').textContent = save.crystals;

const title = { cv: $('titleArt'), t: 0, fx: [] };
function drawTitle(dt) {
  const cv = title.cv, W = 240, H = 135;
  if (cv.width !== W) { cv.width = W; cv.height = H; title.frame = createFrame(W, H); title.img = new ImageData(W, H); title.tmp = document.createElement('canvas'); title.tmp.width = W; title.tmp.height = H; title.fx = [createFx(F.runeCircle, { x: 120, y: 98, palette: PALS.arcane }), createFx(F.sunOrb, { x: 200, y: 26, palette: PALS.violet })]; }
  title.t += dt;
  const g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120a2a'); gr.addColorStop(0.6, '#1e1440'); gr.addColorStop(1, '#0b0914');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#16102e'; g.beginPath(); g.ellipse(120, 100, 110, 22, 0, 0, Math.PI * 2); g.fill();
  const ox = innerWidth >= 1000 ? -58 : 0;
  g.setTransform(1, 0, 0, 1, ox, 0);
  title.frame.ox = -ox;
  clearFrame(title.frame);
  for (const f of title.fx) { f.update(dt); f.draw(title.frame); }
  const a = title.t * 0.6;
  drawModel(g, 'tree', 28, 98, 0.4); drawModel(g, 'pine', 210, 104, 1); drawModel(g, 'crystal', 60, 112, 2); drawModel(g, 'pylon', 180, 112, 0);
  composite(title.frame, title.img.data, null); title.tmp.getContext('2d').putImageData(title.img, 0, 0); g.drawImage(title.tmp, -ox, 0);
  [0, 1, 2, 3].forEach((i) => { const r = 26, x = 120 + Math.cos(a + i * Math.PI / 2) * r, y = 98 + Math.sin(a + i * Math.PI / 2) * r * 0.4; drawModel(g, 'mage' + i, Math.round(x), Math.round(y), a + i * Math.PI / 2 + Math.PI / 2, { frame: Math.floor(title.t * 3 + i) % 2 }); });
}

// ---------- メインループ ----------
let last = performance.now(), acc = 0, snapAcc = 0, hostEv = [], seenT = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
  if (S.mode === 'title' || S.mode === 'lobby') { drawTitle(dt); requestAnimationFrame(frame); return; }
  if (S.mode !== 'play') { requestAnimationFrame(frame); return; }
  let view = null;
  if (S.G) {
    // ソロとホスト：計算する
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) {
      const inputs = { [S.me]: readInput() };
      if (S.host) for (const id in hostInputs) inputs[id] = hostInputs[id];
      step(S.G, STEP, inputs);
      clearLatch();
      if (S.host) for (const id in hostInputs) { hostInputs[id].dash = false; hostInputs[id].cast = []; }
      const ev = S.G.events.splice(0);
      for (const e of ev) handleEvent(e);
      if (S.host) hostEv.push(...ev);
      acc -= STEP; n++;
    }
    if (n === 6) acc = 0;
    view = makeView(S.G);
    if (S.host) {
      snapAcc += dt;
      if (snapAcc > 1 / 20) {
        snapAcc = 0;
        S.host.broadcast({ t: 'snap', v: view, ev: hostEv });
        hostEv = [];
      }
    }
  } else if (S.guest) {
    // ゲスト：入力を送り、届いた絵をなめらかにつなぐ
    S.inT += dt;
    if (S.inT > 1 / 30) { S.inT = 0; S.guest.send({ t: 'in', ...readInput() }); clearLatch(); }
    view = guestView(now);
  }
  if (!view) { R.draw({ players: [], enemies: [], shots: [], bullets: [], zones: [], teles: [], strikes: [], summons: [], mines: [], pickups: [], exits: [], props: [], w: 100, h: 100 }, dt, S.me); requestAnimationFrame(frame); return; }
  S.lastView = view;
  R.draw(view, dt, S.me);
  UI.hud(view, S.me, { onSlot: (i) => { latch.cast[i] = true; } });
  UI.exitLabels(view, (x, y) => R.toScreen(x, y));
  const p = view.players.find((q) => q.id === S.me);
  syncChoice(p);
  // 商人
  const nearShop = view.shop && p && view.props.some((pr) => pr.m === 'merchant' && Math.hypot(pr.x - p.x, pr.y - p.y) < 50);
  $('hint').classList.toggle('hidden', !nearShop || S.shopOpen);
  if (nearShop) $('hint').textContent = isTouch ? '「調べる」で商人と話す' : 'E で商人と話す';
  if (nearShop && latch.use) { openShop(view); latch.use = false; }
  if (!nearShop && S.shopOpen) closeShop();
  if (S.shopOpen) $('shopGold').textContent = '🪙 ' + (p ? p.gold : 0);
  // 見つけた魔法を魔導書に書く
  seenT += dt;
  if (seenT > 1 && p) { seenT = 0; let ch = false; for (const [id, lv] of p.spells) if ((save.seen[id] || 0) < lv) { save.seen[id] = lv; ch = true; } if (ch) writeSave(); }
  if (S.guest && view.over && !S.ended) endRun();
  requestAnimationFrame(frame);
}

// ゲストの補間
function guestView(now) {
  const sn = S.snaps; if (!sn.length) return null;
  const b = sn[sn.length - 1], a = sn.length > 1 ? sn[sn.length - 2] : b;
  const span = Math.max(16, b.t - a.t), k = Math.min(1.25, (now - b.t) / span);
  const v = { ...b.v };
  const lerpList = (A, B) => { const m = new Map(A.map((o) => [o.id, o])); return B.map((o) => { const p = m.get(o.id); if (!p) return o; return { ...o, x: p.x + (o.x - p.x) * Math.min(1, k), y: p.y + (o.y - p.y) * Math.min(1, k) }; }); };
  v.players = lerpList(a.v.players, b.v.players); v.enemies = lerpList(a.v.enemies, b.v.enemies); v.summons = lerpList(a.v.summons, b.v.summons);
  v.shots = b.v.shots.map((s) => ({ ...s, x: s.x + s.vx * (now - b.t) / 1000, y: s.y + s.vy * (now - b.t) / 1000 }));
  v._age = (now - b.t) / 1000;
  return v;
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

addEventListener('resize', () => R.resize());
toTitle();
// 最初に主なモデルを焼いておく
setTimeout(() => warm(['mage0', 'mage1', 'mage2', 'mage3', 'slime', 'mushroom', 'wolf', 'wisp', 'golem', 'wall_forest', 'tree', 'pine', 'rock'], 8), 50);
requestAnimationFrame(frame);
window.__S = S; window.__R = R;
// 試験用: ?dev=floor,type&sp=fire:10,ice:10
const DEV = new URLSearchParams(location.search).get('dev');
if (DEV) {
  const [fl, type] = DEV.split(','); const sp = (new URLSearchParams(location.search).get('sp') || 'fire:10').split(',').map((x) => { const [a, b] = x.split(':'); return [a, +b]; });
  S.me = 'p0'; startRun([{ id: 'p0', name: 'テスト' }], 1);
  devJump(S.G, +fl, type || 'fight', sp);
  for (const e of S.G.events.splice(0)) handleEvent(e);
  window.__dev = true;
}
