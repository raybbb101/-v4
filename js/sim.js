// ゲームの計算（描画しない）。ソロでも、マルチのホストでも同じものが動く。
// 結果は view（見た目に必要なものだけ）と events（エフェクト・音・数字）として外に出す。
import { SPELL, SPELLS, spellAt, tierOf, MAX_LV, BASIC, RELICS, RELIC } from './spells.js';
import { BIOMES, ROOMS_PER_BIOME, ENEMIES, BOSSES, DIFFS } from './enemies.js';
import { modelInfo } from './stack.js';

const TAU = Math.PI * 2;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// エフェクトの「見た目の着弾」までの時間（ダメージの瞬間に合わせるため、先に出す）
const FX_LEAD = { smite: 0.42, holyPillar: 0.25, lightningStrike: 0.3, starFall: 0.55, meteor: 0.85, orbital: 0.15, holyBlade: 0.3, arrowRain: 0.25 };

export const XP_NEXT = (lv) => Math.round(9 + lv * 7 + lv * lv * 0.7);
export const PCOLORS = ['#8a7cff', '#ff6a7a', '#5ad890', '#ffd24a'];

export function createGame({ players, diff = 1, meta = {}, local = false }) {
  const G = {
    t: 0, nextId: 1, events: [], diff: DIFFS[diff] || DIFFS[1], diffIdx: diff,
    floor: 0, room: 0, roomType: 'start', biome: BIOMES[0], depth: 0,
    phase: 'pick', phaseT: 0, w: 640, h: 420, obstacles: [], props: [],
    players: [], enemies: [], shots: [], bullets: [], zones: [], strikes: [], summons: [], mines: [], pickups: [], teles: [], scripts: [], exits: [],
    waves: null, boss: null, timeStop: 0, local, kills: 0, crystals: 0, shake: 0, paused: false, over: false, won: false, shop: null,
  };
  players.forEach((pl, i) => G.players.push(newPlayer(G, pl, i, meta)));
  for (const p of G.players) offerStart(G, p);
  return G;
}

function newPlayer(G, pl, i, meta) {
  const m = meta || {};
  return {
    id: pl.id, name: pl.name || '魔法使い', slot: i, col: PCOLORS[i % 4], x: G.w / 2 + (i - 1.5) * 30, y: G.h / 2 + 60, vx: 0, vy: 0,
    a: -Math.PI / 2, hp: 100 + (m.hp || 0) * 10, maxHp: 100 + (m.hp || 0) * 10, lv: 1, xp: 0, gold: 0,
    spells: [], relics: [], basicCd: 0, dashCd: 0, dashT: 0, dashVx: 0, dashVy: 0, iframe: 0, hurtT: 0, shield: 0, dead: false, ghost: 0, reviveT: 0,
    buffs: [], choices: null, choiceKind: null, rerolls: (m.reroll || 0) + 1, startLv: 1 + (m.start || 0), metaPow: (m.pow || 0) * 0.05, metaSpd: (m.spd || 0) * 0.04, metaGold: (m.gold || 0) * 0.1,
    reviveUsed: 0, aegisT: 0, walk: 0, kills: 0, dmgDone: 0, auto: true, input: null, castFlash: 0, regenAcc: 0,
  };
}

// ---------- 能力値 ----------
export function stats(p) {
  const s = { power: 1 + p.metaPow, speed: 1 + p.metaSpd, cdr: 0, area: 1, lifesteal: 0, crit: 0.05, regen: 0, extra: 0, pickup: 1, luck: 0, gold: 1 + p.metaGold, revive: 0,
    procShock: 0, procSlow: 0, procBurn: 0, aegis: 0, berserk: 0, summon: 1, pierce: 0, dodge: 0, shotSpd: 1, ultCdr: 0, armor: 0, thorns: 0, basic: 0, maxHp: 0, dmgUp: 0, invuln: 0 };
  for (const id of p.relics) { const m = RELIC[id].mod; for (const k in m) s[k] = (s[k] || 0) + (k === 'area' || k === 'speed' || k === 'power' || k === 'pickup' || k === 'gold' || k === 'summon' || k === 'shotSpd' ? m[k] : m[k]); }
  for (const b of p.buffs) { if (b.haste) s.speed += b.haste; if (b.cdr) s.cdr += b.cdr; if (b.dmgUp) s.dmgUp += b.dmgUp; if (b.crit) s.crit += b.crit; if (b.invuln) s.invuln = 1; }
  if (s.berserk && p.hp < p.maxHp * 0.5) s.dmgUp += s.berserk;
  s.cdr = Math.min(0.8, s.cdr);
  return s;
}

// ---------- イベント ----------
const ev = (G, e) => { G.events.push(e); return e; };
const fx = (G, k, x, y, o) => ev(G, { e: 'fx', k, x: Math.round(x), y: Math.round(y), o });
const sfx = (G, s, x, y) => ev(G, { e: 'sfx', s, x, y });
const toast = (G, text, pid) => ev(G, { e: 'toast', text, pid });

// ---------- 部屋づくり ----------
function enterRoom(G, type, reward) {
  const B = G.biome;
  G.roomType = type; G.reward = reward; G.phase = 'intro'; G.phaseT = 1.2;
  G.enemies = []; G.shots = []; G.bullets = []; G.zones = []; G.strikes = []; G.mines = []; G.pickups = []; G.teles = []; G.exits = []; G.props = []; G.boss = null; G.shop = null;
  G.summons = G.summons.filter((s) => s.type === 'decoy' ? false : true);
  const big = type === 'boss';
  G.w = big ? 760 : Math.round(rnd(560, 720)); G.h = big ? 520 : Math.round(rnd(380, 480));
  G.obstacles = [];
  const nObs = type === 'boss' ? 4 : type === 'shop' || type === 'rest' ? 4 : Math.round(rnd(6, 12));
  for (let i = 0; i < nObs * 4 && G.obstacles.length < nObs; i++) {
    const model = pick(B.props), M = modelInfo(model), r = Math.min(14, M ? M.r : 6);
    const x = rnd(40, G.w - 40), y = rnd(50, G.h - 40);
    if (Math.hypot(x - G.w / 2, y - G.h / 2) < 90) continue;
    if (y > G.h - 90 && Math.abs(x - G.w / 2) < 80) continue;
    if (G.obstacles.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 26)) continue;
    G.obstacles.push({ x, y, r, model, a: rnd(TAU) });
  }
  // 入口に並べる
  G.players.forEach((p, i) => { p.x = G.w / 2 + (i - (G.players.length - 1) / 2) * 26; p.y = G.h - 46; p.vx = p.vy = 0; p.a = -Math.PI / 2; if (p.dead) { p.dead = false; p.hp = Math.round(p.maxHp * 0.3); fx(G, 'resurrection', p.x, p.y); } });
  G.summons.forEach((s) => { const o = G.players.find((p) => p.id === s.owner) || G.players[0]; s.x = o.x; s.y = o.y; });
  const n = G.players.length, dm = G.diff;
  const hpMul = dm.hp * (1 + 0.55 * (n - 1)) * (1 + G.depth * 0.42 + G.room * 0.05) * (1 + Math.max(0, G.floor - 3) * 0.6);
  G.hpMul = hpMul; G.dmgMul = dm.dmg * (1 + G.depth * 0.16 + Math.max(0, G.floor - 3) * 0.25);
  if (type === 'fight' || type === 'elite') {
    const budget = Math.round((7 + G.room * 2 + G.depth * 3) * (1 + 0.4 * (n - 1)) * (type === 'elite' ? 0.7 : 1));
    G.waves = { left: budget, timer: 0.6, eliteRoom: type === 'elite', n: 0 };
  } else if (type === 'boss') {
    G.waves = null;
    const id = B.boss, d = BOSSES[id];
    const e = spawnEnemy(G, id, G.w / 2, 150, { boss: true });
    G.boss = e.id;
    ev(G, { e: 'bossIntro', name: d.name, title: d.title });
  } else {
    G.waves = null;
    if (type === 'shop') { G.props.push({ model: 'merchant', x: G.w / 2, y: G.h / 2 - 30, a: Math.PI / 2 }); G.shop = makeShop(G); }
    if (type === 'rest') { G.props.push({ model: 'fountain', x: G.w / 2, y: G.h / 2 - 20, a: 0 }); G.pickups.push({ id: G.nextId++, k: 'fountain', x: G.w / 2, y: G.h / 2 - 20, r: 26 }); }
    if (type === 'treasure') { for (let i = 0; i < Math.max(1, n); i++) G.pickups.push({ id: G.nextId++, k: 'chest', x: G.w / 2 + (i - (n - 1) / 2) * 40, y: G.h / 2 - 20, r: 14, owner: null }); }
  }
  ev(G, { e: 'room', w: G.w, h: G.h, biome: BIOMES.indexOf(B), obstacles: G.obstacles, type, floor: G.floor, room: G.room, depth: G.depth });
}

function roomLabel(G) {
  if (G.roomType === 'boss') return 'ボス';
  return ['', '戦い', '精鋭', '宝物庫', '泉', '商人'][['', 'fight', 'elite', 'treasure', 'rest', 'shop'].indexOf(G.roomType)] || '';
}

function openExits(G) {
  G.phase = 'exits';
  const last = G.room >= ROOMS_PER_BIOME, bossDone = G.roomType === 'boss';
  let opts;
  if (bossDone) opts = [{ type: 'fight', reward: 'spell', next: true }];
  else if (last) opts = [{ type: 'boss', reward: 'boss' }];
  else {
    const pool = [
      { type: 'fight', reward: 'spell' }, { type: 'fight', reward: 'spell' }, { type: 'fight', reward: 'gold' }, { type: 'fight', reward: 'heal' },
      { type: 'elite', reward: 'relic' }, { type: 'treasure', reward: 'spell' },
    ];
    if (G.room >= 2) pool.push({ type: 'shop', reward: 'shop' }, { type: 'rest', reward: 'rest' });
    shuffle(pool);
    opts = []; const seen = new Set();
    for (const o of pool) { const k = o.type + o.reward; if (seen.has(k)) continue; seen.add(k); opts.push(o); if (opts.length >= (Math.random() < 0.4 ? 3 : 2)) break; }
  }
  const n = opts.length;
  G.exits = opts.map((o, i) => ({ ...o, id: i, x: G.w / 2 + (i - (n - 1) / 2) * 150, y: 44, r: 26, hold: 0 }));
  sfx(G, 'open');
  toast(G, '扉が開いた。次の部屋を選ぼう');
}

// ---------- 敵 ----------
function spawnEnemy(G, kind, x, y, o = {}) {
  const boss = !!o.boss, D = boss ? BOSSES[kind] : ENEMIES[kind];
  const M = modelInfo(D.model);
  const elite = !!o.elite;
  const hp = Math.round(D.hp * G.hpMul * (elite ? 3.2 : 1));
  const e = {
    id: G.nextId++, kind, D, boss, elite, x, y, vx: 0, vy: 0, a: Math.PI / 2, hp, maxHp: hp,
    r: boss ? D.r : (M ? Math.min(10, M.r) : 6) * (elite ? 1.3 : 1), scale: elite ? 1.3 : 1,
    spd: D.spd * rnd(0.9, 1.1) * (elite ? 1.1 : 1), st: {}, cd: rnd(0.5, 2), state: 'move', stT: 0, flash: 0, contactCd: 0,
    pat: 0, patCd: 2, phase2: false, spawnT: o.instant ? 0 : 0.7, wob: rnd(TAU), poison: 0,
  };
  G.enemies.push(e);
  if (!o.instant) { fx(G, boss ? 'spawnPortal' : 'summonPoof', x, y); }
  return e;
}

function spawnWave(G) {
  const W = G.waves, B = G.biome, n = G.players.length;
  const size = Math.min(W.left, Math.round(rnd(3, 5) + G.room * 0.4 + G.depth * 0.6 + (n - 1)));
  for (let i = 0; i < size; i++) {
    const kind = pick(B.enemies), D = ENEMIES[kind];
    const elite = W.eliteRoom ? Math.random() < 0.45 : Math.random() < 0.06 + G.depth * 0.03;
    const cnt = D.group || 1;
    let x, y, tries = 0;
    do { x = rnd(40, G.w - 40); y = rnd(50, G.h - 60); tries++; } while (tries < 20 && G.players.some((p) => !p.dead && Math.hypot(p.x - x, p.y - y) < 130));
    for (let k = 0; k < cnt; k++) spawnEnemy(G, kind, x + rnd(-14, 14), y + rnd(-14, 14), { elite: elite && cnt === 1 });
  }
  W.left -= size; W.n++;
  W.timer = 13;
}

function targetsFor(G) {
  const t = G.players.filter((p) => !p.dead && !p.buffs.some((b) => b.stealth));
  if (!t.length) for (const p of G.players) if (!p.dead) t.push({ x: p.x + 200, y: p.y, fake: true });
  for (const s of G.summons) if (s.type === 'decoy') t.push(s);
  return t;
}
function nearest(list, x, y, maxD = 1e9) {
  let best = null, bd = maxD * maxD;
  for (const o of list) { const d = (o.x - x) ** 2 + (o.y - y) ** 2; if (d < bd) { bd = d; best = o; } }
  return best;
}

function enemyBullet(G, e, ang, spd, r, o = {}) {
  G.bullets.push({ x: e.x + Math.cos(ang) * (e.r + 2), y: e.y + Math.sin(ang) * (e.r + 2), vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r, dmg: (o.dmg ?? e.D.dmg) * G.dmgMul, col: o.col || G.biome.bullet, life: o.life || 5, boom: o.boom || 0, id: G.nextId++ });
}
function fan(G, e, ang, n, spread, spd, r, o) {
  for (let i = 0; i < n; i++) { const a = n === 1 ? ang : spread >= 6 ? ang + (i / n) * TAU : ang - spread / 2 + (spread * i) / (n - 1); enemyBullet(G, e, a, spd, r, o); }
}
function tele(G, t) { t.id = G.nextId++; t.max = t.t; G.teles.push(t); return t; }

function updateEnemy(G, e, dt) {
  const D = e.D, st = e.st;
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  for (const k in st) { st[k] -= dt; if (st[k] <= 0) delete st[k]; }
  e.flash = Math.max(0, e.flash - dt);
  if (st.burn) { e.burnAcc = (e.burnAcc || 0) + dt; if (e.burnAcc > 0.5) { e.burnAcc = 0; hitEnemy(G, e, 3 + e.maxHp * 0.012 * (e.boss ? 0.15 : 1), e.burnOwner, { dot: true, col: 'burn' }); } }
  if (st.poison) { e.poisAcc = (e.poisAcc || 0) + dt; if (e.poisAcc > 0.5) { e.poisAcc = 0; hitEnemy(G, e, 2 + e.poison * 2, e.poisOwner, { dot: true, col: 'poison' }); } } else e.poison = 0;
  if (e.hp <= 0) return;
  const frozen = st.freeze || st.stun, rooted = frozen || st.root;
  let spdMul = st.slow ? 0.5 : 1;
  const targets = targetsFor(G);
  let tgt = nearest(targets, e.x, e.y);
  if (st.confuse) tgt = nearest(G.enemies.filter((o) => o !== e && o.spawnT <= 0), e.x, e.y) || tgt;
  if (!tgt) return;
  const d = Math.hypot(tgt.x - e.x, tgt.y - e.y), ang = Math.atan2(tgt.y - e.y, tgt.x - e.x);
  if (!frozen) e.a = lerpAng(e.a, ang, Math.min(1, dt * 6));
  e.cd -= dt; e.contactCd -= dt;
  let mx = 0, my = 0;
  if (e.boss) return updateBoss(G, e, dt, tgt, d, ang, frozen, spdMul);
  if (frozen) { e.vx *= 0.8; e.vy *= 0.8; }
  else switch (D.ai) {
    case 'chase': case 'swarm': {
      const w = D.ai === 'swarm' ? Math.sin(G.t * 5 + e.wob) * 0.9 : 0;
      mx = Math.cos(ang + w); my = Math.sin(ang + w);
      if (D.web && Math.random() < dt * 2) G.zones.push(enemyZone(G, e.x, e.y, 18, 4, 'slime'));
      break;
    }
    case 'roller': {
      // 一直線に転がり、壁と物にぶつかると跳ね返る。ときどき狙い直す
      if (e.rollA == null || e.cd <= 0) { e.rollA = ang + rnd(-0.3, 0.3); e.cd = rnd(2.5, 4); }
      const sp = D.roll / e.spd; mx = Math.cos(e.rollA) * sp; my = Math.sin(e.rollA) * sp;
      const px = e.x, py = e.y;
      if (px < 30 || px > G.w - 30) e.rollA = Math.PI - e.rollA;
      if (py < 36 || py > G.h - 28) e.rollA = -e.rollA;
      for (const ob of G.obstacles) if (dist2(ob, e) < (ob.r + e.r + 2) ** 2) { e.rollA = angTo(ob, e) + rnd(-0.4, 0.4); break; }
      break;
    }
    case 'shooter': {
      const R = D.range || 180;
      if (d > R) { mx = Math.cos(ang); my = Math.sin(ang); } else if (d < R * 0.55) { mx = -Math.cos(ang); my = -Math.sin(ang); } else { mx = Math.cos(ang + 1.57) * 0.5 * Math.sin(e.wob + G.t * 0.7); my = Math.sin(ang + 1.57) * 0.5 * Math.sin(e.wob + G.t * 0.7); }
      if (e.cd <= 0 && d < R * 1.3) { shootPattern(G, e, ang); e.cd = D.shot.rate * rnd(0.85, 1.15) / (e.elite ? 1.3 : 1); }
      break;
    }
    case 'orbiter': {
      const a2 = ang + Math.PI / 2 + (d > 110 ? -0.6 : 0.6);
      mx = Math.cos(a2); my = Math.sin(a2);
      if (e.cd <= 0) { shootPattern(G, e, ang); e.cd = D.shot.rate * rnd(0.8, 1.2); }
      break;
    }
    case 'charger': {
      if (e.state === 'wind') { e.stT -= dt; if (e.stT <= 0) { e.state = 'dash'; e.stT = D.charge.dur; e.dashA = e.lockA; sfx(G, 'whoosh', e.x, e.y); } }
      else if (e.state === 'dash') { e.stT -= dt; mx = Math.cos(e.dashA) * D.charge.spd / e.spd; my = Math.sin(e.dashA) * D.charge.spd / e.spd; if (D.web && Math.random() < dt * 8) G.zones.push(enemyZone(G, e.x, e.y, 20, 3, 'web')); if (e.stT <= 0) { e.state = 'move'; e.cd = D.charge.cd; if (D.shot) shootPattern(G, e, angTo(e, tgt)); } }
      else {
        mx = Math.cos(ang); my = Math.sin(ang);
        if (e.cd <= 0 && d < 170) { e.state = 'wind'; e.stT = 0.55; e.lockA = ang; tele(G, { kind: 'line', x: e.x, y: e.y, ang, len: D.charge.spd * D.charge.dur, w: e.r * 2 + 4, t: 0.55, dmg: 0, follow: e.id }); }
      }
      break;
    }
    case 'exploder': {
      if (e.state === 'fuse') { e.stT -= dt; e.flash = 0.1; if (e.stT <= 0) { e.hp = 0; boomAt(G, e.x, e.y, 46, D.dmg * G.dmgMul, 'enemy'); fx(G, 'smallBoom', e.x, e.y); killEnemy(G, e, null); return; } }
      else { mx = Math.cos(ang); my = Math.sin(ang); if (d < 30) { e.state = 'fuse'; e.stT = 0.6; tele(G, { kind: 'circle', x: e.x, y: e.y, r: 46, t: 0.6, dmg: 0 }); sfx(G, 'fuse', e.x, e.y); } }
      break;
    }
    case 'slammer': {
      if (e.state === 'wind') { e.stT -= dt; if (e.stT <= 0) { e.state = 'move'; e.cd = D.slam.cd; } }
      else { mx = Math.cos(ang); my = Math.sin(ang); if (e.cd <= 0 && d < 70) { e.state = 'wind'; e.stT = 0.9; tele(G, { kind: 'circle', x: e.x, y: e.y, r: D.slam.rad * (e.elite ? 1.3 : 1), t: 0.85, dmg: D.dmg * 1.4 * G.dmgMul, fx: 'groundSlam' }); } }
      break;
    }
    case 'turret': {
      if (e.cd <= 0) { e.spin = (e.spin || 0) + 0.45; enemyBullet(G, e, e.spin, D.shot.spd, D.shot.r); enemyBullet(G, e, e.spin + Math.PI, D.shot.spd, D.shot.r); e.cd = D.shot.rate * (e.elite ? 0.7 : 1); }
      break;
    }
    case 'teleporter': {
      mx = Math.cos(ang) * 0.4; my = Math.sin(ang) * 0.4;
      if (e.cd <= 0) {
        e.cd = D.shot.rate * rnd(0.9, 1.3);
        const a2 = rnd(TAU), nx = clamp(tgt.x + Math.cos(a2) * 110, 30, G.w - 30), ny = clamp(tgt.y + Math.sin(a2) * 110, 40, G.h - 30);
        fx(G, 'blinkOut', e.x, e.y); e.x = nx; e.y = ny; fx(G, 'blinkIn', e.x, e.y); e.spawnT = 0.35;
        e.pendingShot = 0.4;
      }
      if (e.pendingShot != null) { e.pendingShot -= dt; if (e.pendingShot <= 0) { shootPattern(G, e, angTo(e, tgt)); e.pendingShot = null; } }
      break;
    }
    case 'puller': {
      mx = Math.cos(ang) * 0.6; my = Math.sin(ang) * 0.6;
      for (const p of G.players) if (!p.dead && dist2(p, e) < 150 * 150) { const a = angTo(p, e); p.x += Math.cos(a) * 26 * dt; p.y += Math.sin(a) * 26 * dt; }
      if (e.cd <= 0) { shootPattern(G, e, rnd(TAU)); e.cd = D.shot.rate; }
      break;
    }
  }
  if (rooted) { mx = my = 0; }
  const sp = e.spd * spdMul * (e.state === 'dash' ? 1 : 1);
  e.vx += (mx * sp - e.vx) * Math.min(1, dt * 8); e.vy += (my * sp - e.vy) * Math.min(1, dt * 8);
  // 群れが重ならないように
  for (const o of G.enemies) { if (o === e || o.boss) continue; const dx = e.x - o.x, dy = e.y - o.y, rr = e.r + o.r; const dd = dx * dx + dy * dy; if (dd < rr * rr && dd > 0.01) { const k = (rr - Math.sqrt(dd)) * 4; e.vx += dx * k * dt * 4; e.vy += dy * k * dt * 4; } }
  e.x += e.vx * dt; e.y += e.vy * dt;
  collideWorld(G, e);
  // 体当たり
  if (e.contactCd <= 0) for (const p of G.players) if (!p.dead && dist2(p, e) < (e.r + 7) ** 2) { hurtPlayer(G, p, D.dmg * G.dmgMul * (e.elite ? 1.4 : 1), e); e.contactCd = 0.7; }
}

function shootPattern(G, e, ang) {
  const s = e.D.shot; if (!s) return;
  const n = (s.n || 1) + (e.elite ? 2 : 0);
  if (s.burst) { for (let i = 0; i < n; i++) G.scripts.push({ t: i * s.burst, fn: () => { if (e.hp > 0) enemyBullet(G, e, angTo(e, nearest(targetsFor(G), e.x, e.y) || e), s.spd, s.r); } }); }
  else fan(G, e, ang, n, s.spread || 0, s.spd, s.r, { boom: s.boom });
  sfx(G, 'eshot', e.x, e.y);
}

function enemyZone(G, x, y, r, dur, k) { return { id: G.nextId++, enemy: true, k, x, y, r, dur, t: 0, tick: 0.5, tt: 0, dmg: 0, slowP: true }; }

// ---------- ボス ----------
function updateBoss(G, e, dt, tgt, d, ang, frozen, spdMul) {
  const D = e.D;
  if (!e.phase2 && e.hp < e.maxHp * 0.5) { e.phase2 = true; toast(G, `${D.name}が本気になった！`); fx(G, 'rage', e.x, e.y); G.shake = Math.max(G.shake, 0.5); sfx(G, 'roar'); }
  const fast = e.phase2 ? 0.7 : 1;
  if (!frozen && e.state !== 'charge') { const sp = e.spd * spdMul; const want = d > 120 ? 1 : d < 70 ? -0.5 : 0.2; e.vx += (Math.cos(ang) * sp * want - e.vx) * dt * 3; e.vy += (Math.sin(ang) * sp * want - e.vy) * dt * 3; }
  if (e.state === 'charge') { e.stT -= dt; e.vx = Math.cos(e.dashA) * 330; e.vy = Math.sin(e.dashA) * 330; if (e.stT <= 0) { e.state = 'move'; G.shake = Math.max(G.shake, 0.3); } }
  if (frozen) { e.vx *= 0.9; e.vy *= 0.9; }
  e.x += e.vx * dt; e.y += e.vy * dt; collideWorld(G, e);
  if (e.contactCd <= 0) for (const p of G.players) if (!p.dead && dist2(p, e) < (e.r + 8) ** 2) { hurtPlayer(G, p, D.dmg * G.dmgMul, e); e.contactCd = 0.8; }
  e.patCd -= dt * (frozen ? 0.3 : 1);
  if (e.patCd > 0) return;
  const pat = D.patterns[e.pat++ % D.patterns.length];
  e.patCd = 2.6 * fast;
  const dmg = D.dmg * G.dmgMul, live = G.players.filter((p) => !p.dead);
  switch (pat) {
    case 'rootLines': {
      for (let k = -2; k <= 2; k++) { const a = ang + k * 0.35; tele(G, { kind: 'line', x: e.x, y: e.y, ang: a, len: 380, w: 22, t: 1.0, dmg: dmg * 1.2, fx: 'earthSpike', fxStep: 34 }); }
      if (e.phase2) for (let k = 0; k < 8; k++) tele(G, { kind: 'line', x: e.x, y: e.y, ang: k / 8 * TAU + 0.2, len: 300, w: 18, t: 1.6, dmg, fx: 'thorns', fxStep: 40 });
      sfx(G, 'rumble'); break;
    }
    case 'sporeRing': {
      for (let w = 0; w < (e.phase2 ? 4 : 3); w++) G.scripts.push({ t: w * 0.4, fn: () => { if (e.hp > 0) { fan(G, e, w * 0.2, 18, TAU, 95 + w * 10, 3.5); sfx(G, 'eshot', e.x, e.y); } } });
      break;
    }
    case 'slam': {
      for (const p of live) tele(G, { kind: 'circle', x: p.x, y: p.y, r: 60, t: 1.1, dmg: dmg * 1.5, fx: 'groundSlam' });
      if (e.phase2) for (let k = 0; k < 4; k++) tele(G, { kind: 'circle', x: rnd(60, G.w - 60), y: rnd(60, G.h - 60), r: 50, t: 1.4, dmg: dmg, fx: 'groundSlam' });
      break;
    }
    case 'summon': {
      const n = e.phase2 ? 5 : 3;
      for (let k = 0; k < n; k++) { const a = k / n * TAU; spawnEnemy(G, D.summon, clamp(e.x + Math.cos(a) * 60, 30, G.w - 30), clamp(e.y + Math.sin(a) * 60, 40, G.h - 30)); }
      break;
    }
    case 'spray': {
      const T = e.phase2 ? 2.4 : 1.8;
      for (let k = 0; k < T / 0.07; k++) G.scripts.push({ t: k * 0.07, fn: () => { if (e.hp > 0) { const a = angTo(e, nearest(live, e.x, e.y) || e) + Math.sin(k * 0.5) * 0.6; enemyBullet(G, e, a, 190, 3); if (k % 3 === 0) sfx(G, 'eshot', e.x, e.y); } } });
      break;
    }
    case 'missiles': {
      const n = e.phase2 ? 10 : 6;
      for (let k = 0; k < n; k++) { const p = pick(live) || e; tele(G, { kind: 'circle', x: clamp(p.x + rnd(-70, 70), 20, G.w - 20), y: clamp(p.y + rnd(-60, 60), 30, G.h - 20), r: 40, t: 1 + k * 0.12, dmg: dmg * 1.2, fx: 'smallBoom' }); }
      sfx(G, 'alarm'); break;
    }
    case 'charge': {
      e.dashA = ang; tele(G, { kind: 'line', x: e.x, y: e.y, ang, len: 330 * 0.8, w: e.r * 2 + 10, t: 0.8, dmg: 0, follow: e.id });
      G.scripts.push({ t: 0.8, fn: () => { e.state = 'charge'; e.stT = 0.8; sfx(G, 'whoosh'); } });
      break;
    }
    case 'laserLines': {
      const n = e.phase2 ? 3 : 2;
      for (let k = 0; k < n; k++) G.scripts.push({ t: k * 0.6, fn: () => { if (e.hp <= 0) return; const p = pick(live) || e; const a = angTo(e, p); tele(G, { kind: 'line', x: e.x, y: e.y, ang: a, len: 700, w: 20, t: 0.8, dmg: dmg * 1.4, fx: 'laserBeamE' }); } });
      break;
    }
    case 'spiral': {
      const T = e.phase2 ? 3 : 2.2, arms = e.phase2 ? 4 : 3;
      for (let k = 0; k < T / 0.09; k++) G.scripts.push({ t: k * 0.09, fn: () => { if (e.hp > 0) for (let j = 0; j < arms; j++) enemyBullet(G, e, k * 0.23 + j * TAU / arms, 120, 3.5); } });
      break;
    }
    case 'orbital': {
      for (const p of live) for (let k = 0; k < 3; k++) tele(G, { kind: 'circle', x: p.x + rnd(-40, 40), y: p.y + rnd(-40, 40), r: 34, t: 1 + k * 0.35, dmg: dmg * 1.3, fx: 'orbitalE' });
      break;
    }
    case 'blackholes': {
      for (let k = 0; k < (e.phase2 ? 3 : 2); k++) { const z = { id: G.nextId++, enemy: true, k: 'voidWell', x: rnd(80, G.w - 80), y: rnd(80, G.h - 80), r: 90, dur: 5, t: 0, tick: 0.5, tt: 0, dmg: dmg * 0.4, pull: 60 }; G.zones.push(z); }
      break;
    }
    case 'teleRing': {
      const p = pick(live) || e; fx(G, 'blinkOut', e.x, e.y);
      e.x = clamp(p.x + rnd(-120, 120), 60, G.w - 60); e.y = clamp(p.y - 110, 60, G.h - 60); fx(G, 'blinkIn', e.x, e.y);
      for (let w = 0; w < 4; w++) G.scripts.push({ t: 0.5 + w * 0.3, fn: () => { if (e.hp > 0) fan(G, e, w * 0.15, 20, TAU, 110, 3.5); } });
      break;
    }
    case 'novaLines': {
      for (let k = 0; k < 10; k++) tele(G, { kind: 'line', x: e.x, y: e.y, ang: k / 10 * TAU + G.t, len: 420, w: 16, t: 1.1, dmg: dmg * 1.1, fx: 'shadowLine', fxStep: 44 });
      break;
    }
  }
}

function lerpAng(a, b, t) { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; }

function collideWorld(G, o) {
  const r = o.r || 6;
  o.x = clamp(o.x, 16 + r, G.w - 16 - r); o.y = clamp(o.y, 22 + r, G.h - 14 - r);
  for (const ob of G.obstacles) {
    const dx = o.x - ob.x, dy = o.y - ob.y, rr = ob.r + r, dd = dx * dx + dy * dy;
    if (dd < rr * rr) { const d = Math.sqrt(dd) || 1; o.x = ob.x + dx / d * rr; o.y = ob.y + dy / d * rr; }
  }
}

// ---------- ダメージ ----------
function hitEnemy(G, e, amount, owner, o = {}) {
  if (!e || e.hp <= 0 || e.spawnT > 0.2) return 0;
  const p = owner != null ? G.players.find((q) => q.id === owner) : null;
  const s = p ? stats(p) : null;
  let dmg = amount;
  let crit = false;
  if (!o.dot && s) { dmg *= s.power * (1 + s.dmgUp); if (Math.random() < s.crit) { dmg *= 2; crit = true; } }
  if (e.st.curse) dmg *= 1.5;
  if (e.D.armor && !o.dot) dmg *= 1 - e.D.armor;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.12;
  if (!o.dot) ev(G, { e: 'num', x: Math.round(e.x), y: Math.round(e.y - 20 * (e.scale || 1) - (e.boss ? 30 : 0)), v: dmg, c: crit ? 1 : 0, col: o.col });
  else if (Math.random() < 0.5) ev(G, { e: 'num', x: Math.round(e.x + rnd(-6, 6)), y: Math.round(e.y - 18), v: dmg, c: 0, col: o.col });
  if (p) {
    p.dmgDone += dmg;
    if (s.lifesteal || o.lifesteal) healPlayer(G, p, dmg * ((s.lifesteal || 0) + (o.lifesteal || 0)), true);
    if (!o.dot && !o.noProc) {
      if (s.procBurn && Math.random() < s.procBurn) applyStatus(e, { k: 'burn', dur: 2.5 }, p.id);
      if (s.procSlow && Math.random() < s.procSlow) applyStatus(e, { k: 'slow', dur: 2 }, p.id);
      if (s.procShock && Math.random() < s.procShock) chainFrom(G, e, 8, 2, 120, p.id, null, true);
    }
  }
  if (o.knock && !e.boss && !e.D.heavy) { const a = o.ka ?? angTo(o.from || e, e); e.vx += Math.cos(a) * o.knock; e.vy += Math.sin(a) * o.knock; }
  if (e.hp <= 0) killEnemy(G, e, p);
  return dmg;
}

function applyStatus(e, st, owner) {
  if (!st || Math.random() > (st.chance ?? 1)) return;
  let dur = st.dur;
  if (e.boss && (st.k === 'freeze' || st.k === 'stun' || st.k === 'root' || st.k === 'confuse')) dur *= 0.25;
  e.st[st.k] = Math.max(e.st[st.k] || 0, dur);
  if (st.k === 'burn') e.burnOwner = owner;
  if (st.k === 'poison') { e.poison = Math.min(8, (e.poison || 0) + (st.pow || 1)); e.poisOwner = owner; }
}

function killEnemy(G, e, p) {
  if (e.dead) return;
  e.dead = true; e.hp = 0;
  G.kills++; if (p) p.kills++;
  fx(G, e.boss ? 'bigBoom' : e.D.fly ? 'poof' : 'deathPop', e.x, e.y, { size: e.boss ? 2 : e.elite ? 1.4 : 1 });
  sfx(G, e.boss ? 'bossdie' : 'kill', e.x, e.y);
  const xp = (e.D.xp || 3) * (e.elite ? 4 : 1) * (e.boss ? 0 : 1);
  if (xp) for (let i = 0; i < Math.min(6, Math.ceil(xp / 3)); i++) G.pickups.push({ id: G.nextId++, k: 'xp', x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), v: xp / Math.ceil(xp / 3), r: 4, vx: rnd(-40, 40), vy: rnd(-40, 40) });
  if (Math.random() < 0.3 || e.elite) G.pickups.push({ id: G.nextId++, k: 'gold', x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), v: Math.round(rnd(2, 6) * (e.elite ? 4 : 1)), r: 4, vx: rnd(-50, 50), vy: rnd(-50, 50) });
  if (e.elite) G.pickups.push({ id: G.nextId++, k: 'crystal', x: e.x, y: e.y, v: 2, r: 5, vx: 0, vy: 0 });
  if (Math.random() < 0.025) G.pickups.push({ id: G.nextId++, k: 'heart', x: e.x, y: e.y, v: 15, r: 5, vx: 0, vy: 0 });
  if (e.boss) {
    G.shake = 1.2;
    for (let i = 0; i < 12; i++) G.pickups.push({ id: G.nextId++, k: 'gold', x: e.x + rnd(-30, 30), y: e.y + rnd(-30, 30), v: 10, r: 4, vx: rnd(-80, 80), vy: rnd(-80, 80) });
    G.pickups.push({ id: G.nextId++, k: 'crystal', x: e.x, y: e.y + 20, v: 10 + G.depth * 5, r: 6, vx: 0, vy: 0 });
    for (const q of G.players) G.pickups.push({ id: G.nextId++, k: 'relic', x: e.x + (q.slot - (G.players.length - 1) / 2) * 40, y: e.y + 50, r: 10, owner: q.id, relic: null });
    G.enemies.forEach((o) => { if (o !== e && !o.dead) { o.hp = 0; killEnemy(G, o, null); } });
    G.bullets = []; G.teles = [];
    ev(G, { e: 'bossDown', name: e.D.name });
  }
}

function healPlayer(G, p, v, quiet) {
  if (p.dead) return;
  const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + v);
  if (!quiet && p.hp - before >= 1) ev(G, { e: 'num', x: Math.round(p.x), y: Math.round(p.y - 30), v: Math.round(p.hp - before), heal: 1 });
}

function hurtPlayer(G, p, dmg, src) {
  if (p.dead || p.iframe > 0 || p.choices) return;
  const s = stats(p);
  if (s.invuln) return;
  dmg *= 1 - Math.min(0.6, s.armor);
  if (s.thorns && src && src.hp > 0) hitEnemy(G, src, s.thorns, p.id, { noProc: true });
  dmg = Math.round(dmg);
  if (p.shield > 0) { const a = Math.min(p.shield, dmg); p.shield -= a; dmg -= a; fx(G, 'shieldHit', p.x, p.y); }
  if (dmg <= 0) { p.iframe = 0.2; return; }
  p.hp -= dmg; p.iframe = 0.55; p.hurtT = 0.3;
  ev(G, { e: 'hurt', pid: p.id, v: dmg, x: Math.round(p.x), y: Math.round(p.y) });
  if (p.hp <= 0) {
    if (s.revive > p.reviveUsed) { p.reviveUsed++; p.hp = Math.round(p.maxHp / 2); p.iframe = 2; fx(G, 'resurrection', p.x, p.y); toast(G, `${p.name}は不死鳥の羽で甦った！`); return; }
    p.hp = 0; p.dead = true; p.reviveT = 0; fx(G, 'soulRise', p.x, p.y); sfx(G, 'pdie');
    toast(G, `${p.name}が倒れた…` + (G.players.length > 1 ? '（そばに立つと起こせる）' : ''));
  }
}

function boomAt(G, x, y, r, dmg, who, owner, o = {}) {
  if (who === 'enemy') { for (const p of G.players) if (!p.dead && (p.x - x) ** 2 + (p.y - y) ** 2 < (r + 6) ** 2) hurtPlayer(G, p, dmg, null); return; }
  let n = 0;
  for (const e of G.enemies) if (e.hp > 0 && (e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.r) ** 2) { hitEnemy(G, e, dmg, owner, { knock: o.knock, from: { x, y }, lifesteal: o.lifesteal }); applyStatus(e, o.st, owner); n++; }
  if (n) G.shake = Math.max(G.shake, Math.min(0.5, r / 200));
  return n;
}

// ---------- 魔法を撃つ ----------
function aimPoint(G, p, sp, inp, maxR = 280) {
  let target = null;
  const live = G.enemies.filter((e) => e.hp > 0 && e.spawnT <= 0.2);
  if (sp.target === 'random') return pick(live) || { x: p.x + Math.cos(p.a) * 100, y: p.y + Math.sin(p.a) * 100 };
  if (sp.target === 'center') return { x: G.w / 2, y: G.h / 2 };
  if (sp.target === 'dense') {
    let best = null, bn = -1;
    for (const e of live) { let n = 0; for (const o of live) if (dist2(e, o) < 90 * 90) n += o.boss ? 4 : 1; if (n > bn) { bn = n; best = e; } }
    return best || nearest(live, p.x, p.y) || { x: p.x + Math.cos(p.a) * 100, y: p.y + Math.sin(p.a) * 100 };
  }
  if (!p.auto && inp && inp.ax != null) {
    const dx = inp.ax - p.x, dy = inp.ay - p.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, maxR / d);
    return { x: p.x + dx * k, y: p.y + dy * k };
  }
  target = nearest(live, p.x, p.y, maxR + 60);
  return target ? { x: target.x, y: target.y, e: target } : { x: p.x + Math.cos(p.a) * 90, y: p.y + Math.sin(p.a) * 90 };
}

function shot(G, p, sp, ang, o = {}) {
  const s = stats(p);
  const spd = (sp.spd || 300) * s.shotSpd;
  const sh = {
    id: G.nextId++, owner: p.id, k: sp.fx, x: p.x + Math.cos(ang) * 10, y: p.y + Math.sin(ang) * 10, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, a: ang,
    r: 6 + (sp.size || 0) * 0.5, dmg: sp.dmg, pierce: (sp.pierce || 0) + s.pierce, hit: new Set(), life: sp.life || (sp.boomerang ? sp.boomerang * 2 : 1.6), t: 0,
    boom: (sp.boom || 0) * s.area, boomFx: sp.boomFx, home: sp.home || 0, st: sp.st, knock: sp.knock, hitFx: sp.hit, boomerang: sp.boomerang, pal: sp.pal, pull: sp.pull, lifesteal: sp.lifesteal, bounce: sp.bounce || 0, split: sp.split || 0,
    ...o,
  };
  G.shots.push(sh);
  return sh;
}

function castSpell(G, p, slot, inp) {
  const own = p.spells[slot]; if (!own) return false;
  const sp = spellAt(own.id, own.lv), s = stats(p);
  const area = s.area;
  const aim = aimPoint(G, p, sp, inp, sp.range || 280);
  const ang = Math.atan2(aim.y - p.y, aim.x - p.x);
  if (sp.kind !== 'buff' && sp.kind !== 'nova' && sp.kind !== 'zone' || sp.at === 'target') p.a = ang;
  p.castFlash = 0.25;
  ev(G, { e: 'cast', pid: p.id, sid: own.id, tier: sp.tier, x: Math.round(p.x), y: Math.round(p.y) });
  switch (sp.kind) {
    case 'bolt': {
      const n = (sp.n || 1) + s.extra;
      const spread = sp.spread ? sp.spread + (s.extra ? 0.15 * s.extra : 0) : s.extra ? 0.2 * s.extra : 0;
      const fire = () => { for (let i = 0; i < n; i++) { const a = n === 1 ? p.a : spread >= 6 ? p.a + (i / n) * TAU : p.a - spread / 2 + spread * i / (n - 1); shot(G, p, sp, a); } if (sp.muzzle) fx(G, sp.muzzle, p.x + Math.cos(p.a) * 10, p.y + Math.sin(p.a) * 10, { angle: p.a }); };
      if (sp.burst) for (let b = 0; b < 3; b++) G.scripts.push({ t: b * sp.burst, fn: fire }); else fire();
      sfx(G, sp.school === 'real' ? 'gun' : sp.school === 'future' ? 'laser' : 'cast', p.x, p.y);
      break;
    }
    case 'nova': {
      const reps = sp.n || 1;
      for (let k = 0; k < reps; k++) G.scripts.push({ t: k * (sp.interval || 0), fn: () => {
        fx(G, sp.fx, p.x, p.y, { scale: sp.rad * area / 100, pal: sp.pal });
        const n = boomAt(G, p.x, p.y, sp.rad * area, sp.dmg, 'player', p.id, { knock: sp.knock, st: sp.st, lifesteal: sp.lifesteal });
        if (sp.clearBullets) G.bullets = G.bullets.filter((b) => (b.x - p.x) ** 2 + (b.y - p.y) ** 2 > (sp.rad * area) ** 2);
        if (sp.heal) for (const q of G.players) healPlayer(G, q, sp.heal);
        sfx(G, 'nova', p.x, p.y);
      } });
      break;
    }
    case 'strike': {
      const n = sp.n || 1, delay = sp.delay ?? 0.15;
      for (let k = 0; k < n; k++) {
        let x, y;
        if (sp.line) { x = p.x + Math.cos(ang) * (30 + k * sp.line); y = p.y + Math.sin(ang) * (30 + k * sp.line); }
        else if (sp.ring) { const a = k / n * TAU; x = p.x + Math.cos(a) * sp.ring; y = p.y + Math.sin(a) * sp.ring; }
        else if (sp.target === 'random') { const t = aimPoint(G, p, sp, inp); x = t.x + rnd(-10, 10); y = t.y + rnd(-10, 10); }
        else if (sp.scatter && k > 0) { x = aim.x + rnd(-sp.scatter, sp.scatter); y = aim.y + rnd(-sp.scatter, sp.scatter); }
        else { x = aim.x; y = aim.y; }
        x = clamp(x, 10, G.w - 10); y = clamp(y, 16, G.h - 10);
        const t = delay + k * (sp.interval || 0);
        G.strikes.push({ t, x, y, r: sp.rad * area, dmg: sp.dmg, fx: sp.fx, st: sp.st, owner: p.id, knock: sp.knock, pal: sp.pal, fxDone: false, mark: delay > 0.3 });
      }
      sfx(G, 'cast', p.x, p.y);
      break;
    }
    case 'chain': chainFrom(G, p, sp.dmg, sp.jumps + s.extra, sp.range * area, p.id, sp.st, false, sp.pal); sfx(G, 'zap', p.x, p.y); break;
    case 'beam': {
      const len = sp.len * area, w = sp.w * area;
      fx(G, sp.fx, p.x, p.y, { angle: ang, len });
      const ex = p.x + Math.cos(ang) * len, ey = p.y + Math.sin(ang) * len;
      for (const e of G.enemies) if (e.hp > 0 && segDist(e.x, e.y, p.x, p.y, ex, ey) < w + e.r) { hitEnemy(G, e, sp.dmg, p.id, { lifesteal: sp.lifesteal }); applyStatus(e, sp.st, p.id); }
      sfx(G, 'beam', p.x, p.y);
      break;
    }
    case 'cone': {
      const z = { id: G.nextId++, owner: p.id, k: sp.fx, cone: true, x: p.x, y: p.y, a: ang, r: sp.range * area, arc: sp.arc, dur: sp.dur, t: 0, tick: sp.tick || 0.1, tt: 0, dmg: sp.dmg, st: sp.st, knock: sp.knock, spin: sp.spin, bullets: sp.bullets, follow: p.id };
      if (sp.dur < 0.05) { coneHit(G, z); fx(G, sp.fx, p.x + Math.cos(ang) * 20, p.y + Math.sin(ang) * 20, { angle: ang }); }
      else G.zones.push(z);
      sfx(G, sp.bullets ? 'gun' : sp.fx === 'waterJet' || sp.fx === 'waveCrash' ? 'water' : 'flame', p.x, p.y);
      break;
    }
    case 'zone': {
      const at = sp.at === 'target' ? aim : sp.at === 'dense' ? aimPoint(G, p, { target: 'dense' }, inp) : { x: p.x, y: p.y };
      const z = { id: G.nextId++, owner: p.id, k: sp.fx, x: at.x, y: at.y, r: sp.rad * area, dur: sp.dur, t: 0, tick: sp.tick, tt: 0, dmg: sp.dmg, st: sp.st, pull: sp.pull, follow: sp.at === 'follow' ? p.id : null, endBoom: sp.endBoom, cover: sp.cover, healTick: sp.healTick, revive: sp.revive, lifesteal: sp.lifesteal, pal: sp.pal };
      if (sp.move) { z.vx = Math.cos(ang) * sp.move; z.vy = Math.sin(ang) * sp.move; }
      G.zones.push(z);
      sfx(G, 'zone', at.x, at.y);
      break;
    }
    case 'orbit': {
      const n = sp.n + s.extra;
      for (let i = 0; i < n; i++) shot(G, p, { ...sp, spd: 0 }, 0, { orbit: { ang: i / n * TAU, rad: sp.rad * area, spin: sp.spin || 3.2 }, life: sp.dur * (1 + (s.summon - 1) * 0.3), pierce: 999, hitCd: new Map(), r: 8 });
      sfx(G, 'cast', p.x, p.y);
      break;
    }
    case 'summon': {
      const n = sp.n;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        const sm = { id: G.nextId++, owner: p.id, type: sp.type, x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, off: a, life: sp.dur * s.summon, t: 0, cd: 0.3 + i * 0.1, rate: sp.rate, dmg: sp.dmg * s.summon, range: sp.range, missile: sp.missile, boom: sp.boom, shoot: sp.shoot, r: 6, hp: 9999 };
        if (sp.type === 'decoy') { const t2 = aimPoint(G, p, sp, inp, 120); sm.x = clamp(t2.x + Math.cos(a) * 30 * (n > 1), 30, G.w - 30); sm.y = clamp(t2.y + Math.sin(a) * 30 * (n > 1), 40, G.h - 30); fx(G, 'warpIn', sm.x, sm.y); }
        if (sp.type === 'turret') { const a2 = (i / Math.max(1, n)) * TAU; sm.x = clamp(p.x + Math.cos(a2) * (n > 1 ? 40 : 24), 30, G.w - 30); sm.y = clamp(p.y + Math.sin(a2) * (n > 1 ? 40 : 24), 40, G.h - 30); fx(G, 'warpIn', sm.x, sm.y); }
        if (sp.type === 'hound') { sm.stun = sp.stun; fx(G, 'summonPoof', sm.x, sm.y); }
        if (sp.doll) sm.doll = true;
        if (sp.type === 'tesla') { sm.x = clamp(aim.x, 30, G.w - 30); sm.y = clamp(aim.y, 40, G.h - 30); fx(G, 'lightningStrike', sm.x, sm.y); }
        G.summons.push(sm);
      }
      sfx(G, 'summon', p.x, p.y);
      break;
    }
    case 'buff': {
      const who = sp.allies ? G.players.filter((q) => (!q.dead || sp.revive) && dist2(q, p) < sp.allies ** 2) : [p];
      for (const q of who) {
        if (q.dead && sp.revive) { q.dead = false; q.hp = 1; fx(G, 'resurrection', q.x, q.y); toast(G, `${q.name}が生き返った！`); }
        if (sp.heal) healPlayer(G, q, sp.heal);
        if (sp.shield) q.shield = Math.max(q.shield, sp.shield);
        if (sp.dur) q.buffs.push({ t: sp.dur, haste: sp.haste, cdr: sp.cdr, dmgUp: sp.dmgUp, crit: sp.crit, invuln: sp.invuln ? 1 : 0, regen: sp.regen, aura: sp.aura, auraRad: sp.auraRad, ls: sp.lifestealAura, stealth: sp.stealth, k: own.id });
        if (sp.invuln) q.buffs.push({ t: sp.invuln, invuln: 1, k: 'inv' });
        fx(G, sp.fx, q.x, q.y, { follow: q.id });
      }
      if (sp.reflect) for (const b of G.bullets) if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < 120 * 120) { b.vx *= -1.2; b.vy *= -1.2; b.ref = p.id; }
      sfx(G, sp.heal ? 'heal' : 'buff', p.x, p.y);
      break;
    }
    case 'dash': {
      const dist = sp.dist, x0 = p.x, y0 = p.y;
      fx(G, 'blinkOut', p.x, p.y);
      p.x = clamp(p.x + Math.cos(ang) * dist, 20, G.w - 20); p.y = clamp(p.y + Math.sin(ang) * dist, 26, G.h - 20); collideWorld(G, p);
      p.iframe = Math.max(p.iframe, 0.4);
      fx(G, 'blinkIn', p.x, p.y); fx(G, sp.rift ? 'implosion' : 'manaBurst', p.x, p.y);
      if (sp.trail) for (const e of G.enemies) if (e.hp > 0 && segDist(e.x, e.y, x0, y0, p.x, p.y) < 18 + e.r) hitEnemy(G, e, sp.dmg * 0.6, p.id);
      boomAt(G, p.x, p.y, sp.rad * area, sp.dmg, 'player', p.id, { knock: 80 });
      if (sp.rift) G.zones.push({ id: G.nextId++, owner: p.id, k: 'gravWell', x: (x0 + p.x) / 2, y: (y0 + p.y) / 2, r: 90 * area, dur: 2, t: 0, tick: 0.25, tt: 0, dmg: sp.dmg * 0.15, pull: 140, endBoom: 80 });
      sfx(G, 'warp', p.x, p.y);
      break;
    }
    case 'mine': {
      for (let i = 0; i < sp.n; i++) G.mines.push({ id: G.nextId++, owner: p.id, x: clamp(p.x + (i ? rnd(-sp.scatter, sp.scatter) : 0), 20, G.w - 20), y: clamp(p.y + (i ? rnd(-sp.scatter, sp.scatter) : 0), 26, G.h - 20), arm: 0.5, dmg: sp.dmg, r: sp.rad * area, st: sp.st, boomFx: sp.boomFx });
      sfx(G, 'click', p.x, p.y);
      break;
    }
    case 'ult': castUlt(G, p, sp, aim); break;
  }
  return true;
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / L; t = clamp(t, 0, 1);
  return Math.hypot(ax + dx * t - px, ay + dy * t - py);
}

function chainFrom(G, from, dmg, jumps, range, owner, st, small, pal) {
  let cur = from; const hit = new Set(); const pts = [{ x: from.x, y: from.y }];
  for (let j = 0; j < jumps + 1; j++) {
    const cands = G.enemies.filter((e) => e.hp > 0 && !hit.has(e) && e !== from && e.spawnT <= 0.2);
    const nx = nearest(cands, cur.x, cur.y, range); if (!nx) break;
    hit.add(nx); pts.push({ x: Math.round(nx.x), y: Math.round(nx.y) });
    hitEnemy(G, nx, dmg, owner, { noProc: small }); applyStatus(nx, st, owner);
    cur = nx;
  }
  if (pts.length > 1) ev(G, { e: 'chain', pts, pal: pal || (small ? 'volt' : 'electric') });
}

function coneHit(G, z) {
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - z.x, e.y - z.y); if (d > z.r + e.r) continue;
    let da = Math.abs(((Math.atan2(e.y - z.y, e.x - z.x) - z.a + Math.PI) % TAU + TAU) % TAU - Math.PI);
    if (da < z.arc / 2 + 0.15) { hitEnemy(G, e, z.dmg, z.owner, { knock: z.knock ? z.knock * 0.3 : 0, ka: z.a, noProc: z.tick < 0.1 && Math.random() < 0.6 }); applyStatus(e, z.st, z.owner); }
  }
}

// ---------- アルティメット ----------
function castUlt(G, p, sp, aim) {
  const sp0 = SPELL[sp.id];
  ev(G, { e: 'cutin', pid: p.id, name: sp.name, en: sp.en || '', col: sp0.color, glyph: sp0.glyph, ult: sp.ult });
  sfx(G, 'ult', p.x, p.y);
  G.shake = Math.max(G.shake, 0.4);
  const at = (t, fn) => G.scripts.push({ t, fn });
  const live = () => G.enemies.filter((e) => e.hp > 0 && e.spawnT <= 0.2);
  const dmg = sp.dmg * (1 + 0.1 * G.depth);
  switch (sp.ult) {
    case 'pyrecage': {
      // 焔獄の檻：すべての敵のまわりに炎の柱が立ち、閉じこめて焼く
      at(0.3, () => { for (const e of live().slice(0, 24)) { applyStatus(e, { k: 'root', dur: 1.8 }); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; fx(G, 'flamePillarSmall', e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18); } } sfx(G, 'flame'); });
      for (let k = 0; k < 4; k++) at(0.6 + k * 0.35, () => { for (const e of live()) { hitEnemy(G, e, dmg * 0.5, p.id, { noProc: true }); applyStatus(e, { k: 'burn', dur: 4 }, p.id); } });
      at(2.1, () => { for (const e of live().slice(0, 24)) fx(G, 'smallBoom', e.x, e.y); boomAt(G, p.x, p.y, 9999, dmg, 'player', p.id); G.shake = 0.8; sfx(G, 'boom'); });
      break;
    }
    case 'eclipse': {
      // 月蝕：世界が闇に沈み、全ての敵が呪われ、闇が弾ける
      at(0.1, () => { ev(G, { e: 'screen', k: 'dark', dur: 2.6 }); fx(G, 'eclipseFx', p.x, p.y - 60, {}); sfx(G, 'rumble'); });
      at(0.8, () => { for (const e of live()) { applyStatus(e, { k: 'curse', dur: 8 }); fx(G, 'curseFx', e.x, e.y); } });
      at(1.9, () => { for (const e of live()) { fx(G, 'darkPop', e.x, e.y); hitEnemy(G, e, dmg * 1.8, p.id); } G.shake = 0.9; sfx(G, 'boom'); });
      break;
    }
    case 'dragon': {
      // 龍王顕現：龍王が空を駆け抜け、通り道を炎の柱で焼く
      const tg = aimPoint(G, p, { target: 'dense' }, null), ang = Math.atan2(tg.y - p.y, tg.x - p.x);
      const x0 = p.x - Math.cos(ang) * 60, y0 = p.y - Math.sin(ang) * 60;
      ev(G, { e: 'dragonFly', x0: Math.round(x0), y0: Math.round(y0), ang: +ang.toFixed(2), len: 900 });
      for (let k = 0; k < 14; k++) at(0.2 + k * 0.06, () => {
        const x = x0 + Math.cos(ang) * k * 48, y = y0 + Math.sin(ang) * k * 48;
        if (x < 0 || y < 0 || x > G.w || y > G.h) return;
        fx(G, 'flamePillarSmall', x, y); boomAt(G, x, y, 54, dmg, 'player', p.id, { st: { k: 'burn', dur: 4 }, knock: 80 });
        if (k % 3 === 0) sfx(G, 'flame');
      });
      at(0.1, () => sfx(G, 'roar'));
      break;
    }
    case 'truck': {
      // 暴走トラック：画面の端から大型トラックが突っこむ
      const tg = aimPoint(G, p, { target: 'dense' }, null), fromLeft = tg.x > G.w / 2 ? false : true;
      const y = clamp(tg.y, 40, G.h - 30), dir = fromLeft ? 1 : -1;
      const pr = { model: 'bigtruck', x: fromLeft ? -40 : G.w + 40, y, a: fromLeft ? 0 : Math.PI, grow: 1, temp: true, life: 3, vx: dir * 520, hit: new Set(), dmg, owner: p.id, ram: true };
      G.props.push(pr); sfx(G, 'alarm');
      break;
    }
    case 'magstorm': {
      // 磁気嵐：敵を一点に集め、レールガン 6 連射
      const c = aimPoint(G, p, { target: 'dense' }, null);
      G.zones.push({ id: G.nextId++, owner: p.id, k: 'gravWell', x: c.x, y: c.y, r: 220, dur: 1.6, t: 0, tick: 0.3, tt: 0, dmg: dmg * 0.1, pull: 260 });
      for (let k = 0; k < 6; k++) at(1.2 + k * 0.16, () => {
        const a = Math.atan2(c.y - p.y, c.x - p.x) + (k - 2.5) * 0.06, len = 700;
        fx(G, 'railBeam', p.x, p.y, { angle: a, len });
        for (const e of live()) if (segDist(e.x, e.y, p.x, p.y, p.x + Math.cos(a) * len, p.y + Math.sin(a) * len) < 14 + e.r) hitEnemy(G, e, dmg, p.id);
        sfx(G, 'beam'); G.shake = 0.4;
      });
      break;
    }
    case 'quantum': {
      // 確率崩壊：3 度、ランダムな大ダメージが全員に
      for (let k = 0; k < 3; k++) at(0.4 + k * 0.5, () => {
        for (const e of live()) { const luck = Math.random(); fx(G, luck > 0.7 ? 'plasmaBoom' : 'quantumPop', e.x, e.y); hitEnemy(G, e, dmg * (0.4 + luck * 1.6), p.id); }
        ev(G, { e: 'screen', k: 'flash', col: '#5affd8', dur: 0.15 }); sfx(G, 'zap');
      });
      break;
    }
    case 'omni': {
      // 全知演算：魔法の待ちを消し、8 秒強化
      for (const o of p.spells) if (o.id !== sp.id) o.cd = 0;
      p.buffs.push({ t: 8, dmgUp: 0.5, crit: 0.35, cdr: 0.35, k: 'omni' });
      fx(G, 'chargeUp', p.x, p.y); fx(G, 'scanner', p.x, p.y, { follow: p.id, life: 8 });
      ev(G, { e: 'screen', k: 'flash', col: '#ffd24a', dur: 0.25 });
      break;
    }
    case 'timestop': {
      G.timeStop = 4; fx(G, 'clock', p.x, p.y); fx(G, 'timeStop', p.x, p.y); ev(G, { e: 'screen', k: 'timestop', dur: 4 });
      for (const e of live()) hitEnemy(G, e, dmg, p.id);
      break;
    }
  }
}

// ---------- 選択肢（レベルアップ・宝箱など） ----------
function offerStart(G, p) {
  const by = (sc) => shuffle(SPELLS.filter((s) => s.school === sc && s.tiers[0].kind !== 'buff'))[0];
  p.choices = [by('fantasy'), by('real'), by('future')].map((s) => ({ t: 'spell', id: s.id, lv: p.startLv, isNew: true }));
  p.choiceKind = 'start';
}

function cardsFor(G, p, kind) {
  const s = stats(p), n = 3 + (s.luck || 0);
  const out = [];
  const owned = p.spells.filter((o) => o.lv < MAX_LV);
  const unowned = SPELLS.filter((sp) => !p.spells.some((o) => o.id === sp.id));
  const pool = [];
  for (const o of owned) pool.push({ t: 'spell', id: o.id, lv: o.lv + 1, w: tierOf(o.lv + 1) !== tierOf(o.lv) ? 1.6 : 1.2 });
  if (p.spells.length < 6) for (const sp of shuffle(unowned).slice(0, 6)) pool.push({ t: 'spell', id: sp.id, lv: 1, isNew: true, w: p.spells.length < 3 ? 1.5 : 0.8 });
  if (kind === 'relic' || kind === 'boss') {
    const rs = shuffle(RELICS.filter((r) => !p.relics.includes(r.id))).slice(0, n);
    return rs.map((r) => ({ t: 'relic', id: r.id }));
  }
  while (out.length < n && pool.length) {
    let tot = pool.reduce((a, c) => a + c.w, 0), r = Math.random() * tot, i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    out.push(pool.splice(i, 1)[0]);
  }
  if (kind === 'chest') out.forEach((c) => { if (c.t === 'spell' && !c.isNew) c.lv = Math.min(MAX_LV, c.lv + 1); });
  if (!out.length) out.push({ t: 'heal', v: 40 }, { t: 'maxhp', v: 15 });
  return out;
}

export function offer(G, p, kind) {
  if (p.choices) { (p.queue = p.queue || []).push(kind); return; }
  p.choices = cardsFor(G, p, kind); p.choiceKind = kind;
}

export function choose(G, pid, idx) {
  const p = G.players.find((q) => q.id === pid); if (!p || !p.choices) return;
  if (idx === 'reroll') { if (p.rerolls > 0 && p.choiceKind !== 'start') { p.rerolls--; p.choices = cardsFor(G, p, p.choiceKind); } return; }
  if (idx === 'skip') { p.choices = null; next(); return; }
  const c = p.choices[idx]; if (!c) return;
  if (c.t === 'spell') {
    const o = p.spells.find((s) => s.id === c.id);
    if (o) { const before = tierOf(o.lv); o.lv = c.lv; if (tierOf(o.lv) !== before) { ev(G, { e: 'evolve', pid: p.id, sid: o.id, lv: o.lv }); fx(G, 'levelUpFx', p.x, p.y, { follow: p.id }); } }
    else p.spells.push({ id: c.id, lv: c.lv, cd: 0 });
  } else if (c.t === 'relic') {
    p.relics.push(c.id);
    const m = RELIC[c.id].mod; if (m.maxHp) { p.maxHp += m.maxHp; p.hp += m.maxHp; }
  } else if (c.t === 'heal') healPlayer(G, p, c.v);
  else if (c.t === 'maxhp') { p.maxHp += c.v; p.hp += c.v; }
  sfx(G, 'pick');
  p.choices = null;
  if (p.choiceKind === 'start') { p.choiceKind = null; if (G.players.every((q) => !q.choices && q.spells.length)) { G.phase = 'go'; } }
  next();
  function next() { p.choiceKind = null; if (p.queue && p.queue.length) offer(G, p, p.queue.shift()); }
}

// ---------- 店 ----------
function makeShop(G) {
  const items = [];
  const sp = shuffle(SPELLS.slice()).slice(0, 2);
  items.push({ t: 'up', name: '魔導書のページ', desc: '持っている魔法 1 つを Lv+1', price: 40 + G.depth * 15 });
  for (const s of sp) items.push({ t: 'spell', id: s.id, name: s.tiers[0].name, desc: s.tiers[0].desc, price: 50 + G.depth * 15 });
  const r = shuffle(RELICS.slice())[0];
  items.push({ t: 'relic', id: r.id, name: r.name, desc: r.desc, price: 90 + G.depth * 25 });
  items.push({ t: 'heal', name: '回復薬', desc: 'HP を 50 回復', price: 25 });
  return items.map((it, i) => ({ ...it, i, sold: {} }));
}
export function buy(G, pid, i) {
  const p = G.players.find((q) => q.id === pid), it = G.shop && G.shop[i];
  if (!p || !it || it.sold[pid] || p.gold < it.price) return;
  if (it.t === 'spell' && (p.spells.length >= 6 && !p.spells.some((s) => s.id === it.id))) { toast(G, '魔法はもう 6 つ持っている', pid); return; }
  p.gold -= it.price; it.sold[pid] = 1;
  if (it.t === 'up') offer(G, p, 'upgrade');
  else if (it.t === 'spell') { const o = p.spells.find((s) => s.id === it.id); if (o) o.lv = Math.min(MAX_LV, o.lv + 1); else p.spells.push({ id: it.id, lv: 1, cd: 0 }); }
  else if (it.t === 'relic') { p.relics.push(it.id); const m = RELIC[it.id].mod; if (m.maxHp) { p.maxHp += m.maxHp; p.hp += m.maxHp; } }
  else if (it.t === 'heal') healPlayer(G, p, 50);
  sfx(G, 'coin');
}

// ---------- 1 コマ進める ----------
export function step(G, dt, inputs) {
  if (G.over) return;
  const solo = G.players.length === 1;
  const choosing = G.players.some((p) => p.choices);
  if (G.phase === 'pick') { if (G.players.every((p) => !p.choices && p.spells.length)) { G.phase = 'go'; } else return; }
  if (G.phase === 'go') { G.floor = 0; G.room = 1; G.depth = 0; G.biome = BIOMES[0]; enterRoom(G, 'fight', 'spell'); return; }
  if (G.paused) return;
  if ((solo || G.local) && choosing) return;   // ソロと同じ画面のときは、選んでいる間は止まる
  G.t += dt;
  G.shake = Math.max(0, G.shake - dt * 2);

  // 予約した動き
  for (let i = G.scripts.length - 1; i >= 0; i--) { const s = G.scripts[i]; s.t -= dt; if (s.t <= 0) { G.scripts.splice(i, 1); s.fn(); } }

  for (const p of G.players) updatePlayer(G, p, dt, inputs[p.id] || {});

  if (G.phase === 'intro') { G.phaseT -= dt; if (G.phaseT <= 0) { G.phase = 'fight'; if (!G.waves && !G.boss) roomCleared(G); } }
  if (G.phase === 'fight' && G.waves) {
    const alive = G.enemies.filter((e) => e.hp > 0).length;
    G.waves.timer -= dt;
    if (G.waves.left > 0 && (alive <= 2 || G.waves.timer <= 0)) spawnWave(G);
    if (G.waves.left <= 0 && alive === 0) roomCleared(G);
  }
  if (G.phase === 'fight' && G.boss && !G.enemies.some((e) => e.id === G.boss && e.hp > 0)) { G.boss = null; roomCleared(G); }

  const frozenWorld = G.timeStop > 0;
  if (frozenWorld) G.timeStop -= dt;
  for (const e of G.enemies) if (!frozenWorld) updateEnemy(G, e, dt);
  G.enemies = G.enemies.filter((e) => e.hp > 0 || !e.dead && e.hp > 0);
  updateShots(G, dt);
  if (!frozenWorld) updateBullets(G, dt);
  updateZones(G, dt);
  updateStrikes(G, dt);
  if (!frozenWorld) updateTeles(G, dt);
  updateSummons(G, dt);
  updateMines(G, dt);
  updatePickups(G, dt);
  for (const pr of G.props) if (pr.temp) {
    pr.grow = Math.min(1, (pr.grow || 0) + dt * 1.5); pr.life -= dt;
    if (pr.vx) {
      pr.x += pr.vx * dt;
      if (pr.ram) for (const e of G.enemies) if (e.hp > 0 && !pr.hit.has(e.id) && Math.abs(e.x - pr.x) < 30 + e.r && Math.abs(e.y - pr.y) < 18 + e.r) { pr.hit.add(e.id); hitEnemy(G, e, pr.dmg, pr.owner, { knock: 320, ka: pr.vx > 0 ? -0.5 : Math.PI + 0.5 }); applyStatus(e, { k: 'stun', dur: 1.2 }); fx(G, 'cartoonPow', e.x, e.y); G.shake = Math.max(G.shake, 0.4); }
      if (pr.x < -80 || pr.x > G.w + 80) pr.life = 0;
    }
  }
  G.props = G.props.filter((pr) => !pr.temp || pr.life > 0);

  if (G.phase === 'exits') updateExits(G, dt);
  if (G.phase === 'travel') { G.phaseT -= dt; if (G.phaseT <= 0) travel(G); }

  // 全滅
  if (G.players.every((p) => p.dead)) { G.over = true; ev(G, { e: 'gameover' }); }
}

function roomCleared(G) {
  G.phase = 'clear';
  G.bullets = []; G.teles = [];
  sfx(G, 'clear');
  const R = G.reward;
  const cx = G.w / 2, cy = G.h / 2;
  if (G.roomType === 'boss') {
    // 宝はボスが落とした（relic ピックアップ）
    ev(G, { e: 'banner', text: '撃破！', sub: G.biome.name + ' を制した' });
  } else if (R === 'spell') G.pickups.push({ id: G.nextId++, k: 'tome', x: cx, y: cy, r: 12 });
  else if (R === 'relic') for (const q of G.players) G.pickups.push({ id: G.nextId++, k: 'relic', x: cx + (q.slot - (G.players.length - 1) / 2) * 40, y: cy, r: 10, owner: q.id });
  else if (R === 'gold') for (let i = 0; i < 14; i++) G.pickups.push({ id: G.nextId++, k: 'gold', x: cx + rnd(-30, 30), y: cy + rnd(-20, 20), v: 6 + G.depth * 3, r: 4, vx: rnd(-90, 90), vy: rnd(-90, 90) });
  else if (R === 'heal') G.pickups.push({ id: G.nextId++, k: 'heart', x: cx, y: cy, v: 40, r: 6 });
  if (G.roomType === 'fight' || G.roomType === 'elite') ev(G, { e: 'banner', text: '部屋を制圧', sub: '' });
  G.scripts.push({ t: 0.8, fn: () => openExits(G) });
}

function updateExits(G, dt) {
  const live = G.players.filter((p) => !p.dead);
  for (const ex of G.exits) {
    const on = live.filter((p) => dist2(p, ex) < (ex.r + 4) ** 2).length;
    if (on && on === live.length) { ex.hold += dt; if (ex.hold > 0.6) { G.phase = 'travel'; G.phaseT = 0.7; G.nextExit = ex; ev(G, { e: 'travel' }); sfx(G, 'warp'); } }
    else { if (on && ex.hold === 0 && G.players.length > 1) ex.waiting = 1; ex.hold = 0; }
  }
}

function travel(G) {
  const ex = G.nextExit;
  if (G.roomType === 'boss') {
    G.depth++; G.floor++; G.room = 1;
    if (G.floor === BIOMES.length && !G.won) { G.won = true; ev(G, { e: 'victory' }); }
    G.biome = BIOMES[G.floor % BIOMES.length];
    for (const p of G.players) { p.hp = p.maxHp; }
  } else G.room++;
  enterRoom(G, ex.type, ex.reward);
  ev(G, { e: 'banner', text: `${G.biome.name}  ${G.room <= ROOMS_PER_BIOME ? G.room + ' / ' + ROOMS_PER_BIOME : 'ボス'}`, sub: roomLabel(G) + (G.depth >= BIOMES.length ? `（深淵 ${G.depth - BIOMES.length + 1} 周目）` : '') });
}

// ---------- プレイヤー ----------
function updatePlayer(G, p, dt, inp) {
  if (p.choices && G.players.length > 1) { p.iframe = Math.max(p.iframe, 0.1); }
  if (p.dead) {
    // 仲間がそばにいると起きる
    const helper = G.players.find((q) => !q.dead && dist2(q, p) < 30 * 30);
    if (helper) { p.reviveT += dt; if (p.reviveT > 2.5) { p.dead = false; p.hp = Math.round(p.maxHp * 0.35); p.iframe = 1.5; fx(G, 'resurrection', p.x, p.y); toast(G, `${helper.name}が${p.name}を起こした！`); } }
    else p.reviveT = Math.max(0, p.reviveT - dt);
    return;
  }
  p.auto = inp.auto ?? p.auto;
  const s = stats(p);
  p.maxHp = Math.max(1, p.maxHp);
  for (const b of p.buffs) {
    b.t -= dt;
    if (b.regen) healPlayer(G, p, b.regen * dt, true);
    if (b.aura) { b.at = (b.at || 0) - dt; if (b.at <= 0) { b.at = 0.35; for (const e of G.enemies) if (e.hp > 0 && dist2(e, p) < (b.auraRad + e.r) ** 2) { hitEnemy(G, e, b.aura * 0.35, p.id, { noProc: true, lifesteal: b.ls || 0 }); if (b.ls && Math.random() < 0.3) ev(G, { e: 'chain', pts: [{ x: Math.round(p.x), y: Math.round(p.y - 12) }, { x: Math.round(e.x), y: Math.round(e.y) }], pal: 'blood' }); } } }
  }
  p.buffs = p.buffs.filter((b) => b.t > 0);
  if (s.regen) { p.regenAcc += s.regen * dt; if (p.regenAcc >= 1) { healPlayer(G, p, Math.floor(p.regenAcc), true); p.regenAcc %= 1; } }
  if (s.aegis) { p.aegisT -= dt; if (p.aegisT <= 0) { p.aegisT = 10; p.shield = Math.max(p.shield, s.aegis); } }
  p.iframe = Math.max(0, p.iframe - dt); p.hurtT = Math.max(0, p.hurtT - dt); p.castFlash = Math.max(0, p.castFlash - dt);
  p.dashCd -= dt; p.basicCd -= dt;
  const fighting = G.phase === 'fight' || G.phase === 'intro';
  // 移動
  let mx = inp.mx || 0, my = inp.my || 0; const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  if (p.slowT > 0) p.slowT -= dt;
  const spd = 108 * s.speed * (p.slowT > 0 ? 0.6 : 1);
  if (p.dashT > 0) { p.dashT -= dt; p.x += p.dashVx * dt; p.y += p.dashVy * dt; }
  else {
    p.vx += (mx * spd - p.vx) * Math.min(1, dt * 14); p.vy += (my * spd - p.vy) * Math.min(1, dt * 14);
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (inp.dash && p.dashCd <= 0 && (ml > 0.1)) {
      p.dashT = 0.16; p.dashVx = mx / (ml || 1) * 540; p.dashVy = my / (ml || 1) * 540; p.dashCd = 1.0 * (1 - s.dodge * 0.4); p.iframe = Math.max(p.iframe, 0.3 * (1 + s.dodge));
      fx(G, 'dashDust', p.x, p.y, { flip: mx < 0 }); sfx(G, 'dash', p.x, p.y);
    }
  }
  collideWorld(G, { ...p, r: 6 }); { const q = { x: p.x, y: p.y, r: 6 }; collideWorld(G, q); p.x = q.x; p.y = q.y; }
  // 同じ画面のときは、全員が画面に入るように離れすぎない
  if (G.local) {
    const others = G.players.filter((q) => q !== p && !q.dead);
    if (others.length) {
      const cx = others.reduce((a, q) => a + q.x, 0) / others.length, cy = others.reduce((a, q) => a + q.y, 0) / others.length;
      p.x = clamp(p.x, cx - 180, cx + 180); p.y = clamp(p.y, cy - 150, cy + 150);
    }
  }
  if (ml > 0.1) p.walk += dt * 10;
  // 向き
  const live = G.enemies.filter((e) => e.hp > 0 && e.spawnT <= 0.2);
  if (!p.auto && inp.ax != null) p.a = Math.atan2(inp.ay - p.y, inp.ax - p.x);
  else { const t = nearest(live, p.x, p.y, 300); if (t && fighting) p.a = angTo(p, t); else if (ml > 0.1) p.a = Math.atan2(my, mx); }
  // 魔法の待ち時間
  const cdMul = 1 - s.cdr;
  for (const o of p.spells) o.cd = Math.max(0, o.cd - dt);
  if (!fighting || p.choices) return;
  // 基本攻撃
  const wantBasic = p.auto ? live.some((e) => dist2(e, p) < 280 * 280) : inp.fire;
  if (wantBasic && p.basicCd <= 0) {
    const n = 1 + (s.basic ? 1 : 0);
    for (let i = 0; i < n; i++) shot(G, p, { ...BASIC, dmg: BASIC.dmg * (1 + p.lv * 0.06) * (s.basic ? 1.5 : 1) }, p.a + (n > 1 ? (i - 0.5) * 0.18 : 0));
    p.basicCd = BASIC.cd * (1 - s.cdr * 0.5);
    sfx(G, 'basic', p.x, p.y);
  }
  // 魔法
  for (let i = 0; i < p.spells.length; i++) {
    const o = p.spells[i]; if (o.cd > 0) continue;
    const sp = spellAt(o.id, o.lv);
    let want = inp.cast && inp.cast[i];
    if (p.auto) {
      if (sp.kind === 'buff') want = (sp.heal && p.hp < p.maxHp * 0.65) || (sp.revive && G.players.some((q) => q.dead)) || (!sp.heal && live.length > 0) || (sp.regen && p.hp < p.maxHp * 0.8);
      else if (sp.kind === 'dash') want = live.some((e) => dist2(e, p) < 120 * 120) && Math.random() < 0.02;
      else want = live.some((e) => dist2(e, p) < (sp.kind === 'nova' ? (sp.rad + 20) ** 2 : 300 * 300));
      if (sp.kind === 'ult') want = sp.ult === 'omni' ? live.length >= 2 : (live.length >= 3 || live.some((e) => e.boss));
    }
    if (want) {
      if (castSpell(G, p, i, inp)) o.cd = sp.cd * cdMul * (sp.kind === 'ult' ? 1 - s.ultCdr : 1);
      if (p.auto) break;   // 自動のときは 1 コマ 1 つ
    }
  }
}

function updateShots(G, dt) {
  for (const sh of G.shots) {
    sh.t += dt; sh.life -= dt;
    const p = G.players.find((q) => q.id === sh.owner);
    if (sh.orbit) {
      if (!p || p.dead) { sh.life = 0; continue; }
      sh.orbit.ang += sh.orbit.spin * dt;
      const rad = sh.orbit.rad * Math.min(1, sh.t * 4);
      sh.x = p.x + Math.cos(sh.orbit.ang) * rad; sh.y = p.y + Math.sin(sh.orbit.ang) * rad; sh.a = sh.orbit.ang + Math.PI / 2;
      for (const e of G.enemies) {
        if (e.hp <= 0 || (e.x - sh.x) ** 2 + (e.y - sh.y) ** 2 > (sh.r + e.r) ** 2) continue;
        const last = sh.hitCd.get(e.id) || -9; if (G.t - last < 0.4) continue;
        sh.hitCd.set(e.id, G.t); hitEnemy(G, e, sh.dmg, sh.owner, { lifesteal: sh.lifesteal }); applyStatus(e, sh.st, sh.owner);
        if (sh.hitFx) fx(G, sh.hitFx, e.x, e.y);
      }
      continue;
    }
    if (sh.home) {
      const t = nearest(G.enemies.filter((e) => e.hp > 0 && !sh.hit.has(e.id)), sh.x, sh.y, 300);
      if (t) { const want = Math.atan2(t.y - sh.y, t.x - sh.x), cur = Math.atan2(sh.vy, sh.vx), a = lerpAng(cur, want, Math.min(1, sh.home * dt)), sp = Math.hypot(sh.vx, sh.vy); sh.vx = Math.cos(a) * sp; sh.vy = Math.sin(a) * sp; }
    }
    if (sh.boomerang && sh.t > sh.boomerang && p) {
      const a = Math.atan2(p.y - sh.y, p.x - sh.x), sp = Math.hypot(sh.vx, sh.vy) || 300;
      sh.vx += (Math.cos(a) * sp - sh.vx) * Math.min(1, dt * 6); sh.vy += (Math.sin(a) * sp - sh.vy) * Math.min(1, dt * 6);
      if (dist2(sh, p) < 14 * 14 && sh.t > sh.boomerang + 0.1) sh.life = 0;
      if (sh.t - sh.boomerang > 0.3 && !sh.reset) { sh.reset = true; sh.hit.clear(); }
    }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.a = Math.atan2(sh.vy, sh.vx);
    if (sh.x < 4 || sh.y < 8 || sh.x > G.w - 4 || sh.y > G.h - 4) { if (!sh.boomerang) { sh.life = 0; if (sh.boom) explodeShot(G, sh); } continue; }
    for (const e of G.enemies) {
      if (e.hp <= 0 || e.spawnT > 0.2 || sh.hit.has(e.id)) continue;
      if ((e.x - sh.x) ** 2 + (e.y - sh.y) ** 2 > (sh.r + e.r) ** 2) continue;
      sh.hit.add(e.id);
      if (sh.boom) { explodeShot(G, sh); sh.life = 0; break; }
      hitEnemy(G, e, sh.dmg, sh.owner, { knock: sh.knock, ka: sh.a, lifesteal: sh.lifesteal }); applyStatus(e, sh.st, sh.owner);
      if (sh.hitFx) fx(G, sh.hitFx, sh.x, sh.y, { angle: sh.a, pal: sh.pal });
      if (sh.split && !sh.child) {
        for (let k = 0; k < sh.split; k++) { const a = sh.a + (k - (sh.split - 1) / 2) * 0.7 + Math.PI * 0.0; G.shots.push({ ...sh, id: G.nextId++, x: sh.x, y: sh.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, a, dmg: sh.dmg * 0.6, hit: new Set([e.id]), life: 0.6, t: 0, child: true, split: 0, pierce: 0 }); }
      }
      if (sh.bounce > 0) {
        sh.bounce--; const nx = nearest(G.enemies.filter((o) => o.hp > 0 && !sh.hit.has(o.id)), sh.x, sh.y, 220);
        if (nx) { const sp = Math.hypot(sh.vx, sh.vy), a = Math.atan2(nx.y - sh.y, nx.x - sh.x); sh.vx = Math.cos(a) * sp; sh.vy = Math.sin(a) * sp; sh.life = Math.max(sh.life, 0.6); break; }
      }
      if (sh.pierce-- <= 0) { sh.life = 0; break; }
    }
  }
  G.shots = G.shots.filter((s) => s.life > 0);
}
function explodeShot(G, sh) {
  fx(G, sh.boomFx || 'smallBoom', sh.x, sh.y, { size: sh.boom / 50 });
  boomAt(G, sh.x, sh.y, sh.boom, sh.dmg, 'player', sh.owner, { st: sh.st, knock: sh.knock });
  if (sh.pull) for (const e of G.enemies) if (e.hp > 0 && !e.boss && dist2(e, sh) < (sh.boom * 2) ** 2) { const a = angTo(e, sh); e.x += Math.cos(a) * 26; e.y += Math.sin(a) * 26; }
  sfx(G, 'boom', sh.x, sh.y);
}

function updateBullets(G, dt) {
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < 8 || b.y < 10 || b.x > G.w - 8 || b.y > G.h - 6) { b.life = 0; continue; }
    for (const ob of G.obstacles) if ((b.x - ob.x) ** 2 + (b.y - ob.y) ** 2 < ob.r * ob.r) { b.life = 0; break; }
    if (b.life <= 0) { if (b.boom) { fx(G, 'plasmaBoom', b.x, b.y, { size: 0.6 }); boomAt(G, b.x, b.y, b.boom, b.dmg, 'enemy'); } continue; }
    if (b.ref) { for (const e of G.enemies) if (e.hp > 0 && dist2(e, b) < (e.r + b.r) ** 2) { hitEnemy(G, e, b.dmg * 2, b.ref); b.life = 0; break; } continue; }
    for (const p of G.players) {
      if (p.dead) continue;
      if ((p.x - b.x) ** 2 + (p.y - 8 - b.y) ** 2 < (b.r + 5) ** 2) {
        if (p.iframe > 0 || stats(p).invuln) continue;
        // 煙幕の中は当たりにくい
        if (G.zones.some((z) => z.cover && dist2(z, p) < z.r * z.r) && Math.random() < 0.5) { b.life = 0; break; }
        hurtPlayer(G, p, b.dmg, null); b.life = 0;
        if (b.boom) { fx(G, 'plasmaBoom', b.x, b.y, { size: 0.6 }); boomAt(G, b.x, b.y, b.boom, b.dmg * 0.5, 'enemy'); }
        break;
      }
    }
  }
  G.bullets = G.bullets.filter((b) => b.life > 0);
  if (G.bullets.length > 400) G.bullets.splice(0, G.bullets.length - 400);
}

function updateZones(G, dt) {
  for (const z of G.zones) {
    z.t += dt; z.tt -= dt;
    if (z.follow != null) { const p = G.players.find((q) => q.id === z.follow); if (p) { z.x = p.x; z.y = p.y; if (z.cone) { z.a = z.spin ? z.a + z.spin * dt : p.a; } } }
    if (z.vx) { z.x = clamp(z.x + z.vx * dt, 10, G.w - 10); z.y = clamp(z.y + z.vy * dt, 16, G.h - 10); }
    if (z.enemy) {
      if (z.pull) for (const p of G.players) if (!p.dead && dist2(p, z) < z.r * z.r) { const a = angTo(p, z); p.x += Math.cos(a) * z.pull * dt; p.y += Math.sin(a) * z.pull * dt; }
      if (z.tt <= 0) { z.tt = z.tick; for (const p of G.players) if (!p.dead && dist2(p, z) < (z.k === 'web' || z.k === 'slime' ? z.r : z.r * 0.4) ** 2) { if (z.dmg) hurtPlayer(G, p, z.dmg, null); if (z.k === 'slime') p.slowT = 0.6; } }
      continue;
    }
    if (z.pull) for (const e of G.enemies) if (e.hp > 0 && !e.boss && dist2(e, z) < z.r * z.r) { const a = angTo(e, z), d = Math.sqrt(dist2(e, z)); if (d > 6) { e.x += Math.cos(a) * z.pull * dt; e.y += Math.sin(a) * z.pull * dt; } }
    if (z.tt <= 0) {
      z.tt = z.tick;
      if (z.cone) { coneHit(G, z); if (z.bullets) { for (let k = 0; k < 2; k++) { const a = z.a + rnd(-z.arc / 2, z.arc / 2); ev(G, { e: 'tracer', x: Math.round(z.x), y: Math.round(z.y - 8), a: +a.toFixed(2), l: Math.round(z.r) }); } } }
      else if (z.dmg) for (const e of G.enemies) if (e.hp > 0 && dist2(e, z) < (z.r + e.r) ** 2) { hitEnemy(G, e, z.dmg, z.owner, { noProc: Math.random() < 0.7, lifesteal: z.lifesteal }); applyStatus(e, z.st, z.owner); }
      if (z.healTick) for (const q of G.players) if (dist2(q, z) < z.r * z.r) {
        if (q.dead && z.revive) { q.dead = false; q.hp = Math.round(q.maxHp * 0.3); fx(G, 'resurrection', q.x, q.y); toast(G, `${q.name}が起き上がった！`); }
        healPlayer(G, q, z.healTick, true);
      }
    }
    if (z.t >= z.dur && z.endBoom) { fx(G, 'implosion', z.x, z.y); boomAt(G, z.x, z.y, z.r * 0.7, z.endBoom, 'player', z.owner, { knock: 60 }); sfx(G, 'boom', z.x, z.y); }
  }
  G.zones = G.zones.filter((z) => z.t < z.dur);
}

function updateStrikes(G, dt) {
  for (const s of G.strikes) {
    s.t -= dt;
    const lead = FX_LEAD[s.fx] || 0;
    if (!s.fxDone && s.t <= lead) { s.fxDone = true; fx(G, s.fx, s.x, s.y, { scale: s.r / 40, pal: s.pal }); }
    if (s.t <= 0) {
      boomAt(G, s.x, s.y, s.r, s.dmg, 'player', s.owner, { st: s.st, knock: s.knock });
      sfx(G, s.fx === 'lightningStrike' ? 'thunder' : s.fx === 'nuke' ? 'nuke' : 'boom', s.x, s.y);
      if (s.fx === 'nuke') { G.shake = 2; ev(G, { e: 'screen', k: 'flash', col: '#ffffff', dur: 0.6 }); }
    }
  }
  G.strikes = G.strikes.filter((s) => s.t > 0);
}

function updateTeles(G, dt) {
  for (const t of G.teles) {
    t.t -= dt;
    if (t.follow) { const e = G.enemies.find((o) => o.id === t.follow); if (e) { t.x = e.x; t.y = e.y; if (e.lockA != null && !e.boss) t.ang = e.lockA; else if (e.dashA != null) t.ang = e.dashA; } }
    if (t.t <= 0) {
      if (t.kind === 'circle') { if (t.dmg) boomAt(G, t.x, t.y, t.r, t.dmg, 'enemy'); if (t.fx) fx(G, t.fx, t.x, t.y, { scale: t.r / 50 }); }
      else if (t.kind === 'line') {
        if (t.dmg) for (const p of G.players) if (!p.dead && segDist(p.x, p.y, t.x, t.y, t.x + Math.cos(t.ang) * t.len, t.y + Math.sin(t.ang) * t.len) < t.w / 2 + 5) hurtPlayer(G, p, t.dmg, null);
        if (t.fx) {
          if (t.fxStep) for (let d = 20; d < t.len; d += t.fxStep) { const x = t.x + Math.cos(t.ang) * d, y = t.y + Math.sin(t.ang) * d; if (x > 0 && y > 0 && x < G.w && y < G.h) fx(G, t.fx, x, y); }
          else fx(G, t.fx, t.x, t.y, { angle: t.ang, len: t.len });
        }
      }
      if (t.dmg) sfx(G, 'boom', t.x, t.y);
    }
  }
  G.teles = G.teles.filter((t) => t.t > 0);
}

function updateSummons(G, dt) {
  for (const s of G.summons) {
    s.t += dt; s.life -= dt; s.cd -= dt;
    const o = G.players.find((q) => q.id === s.owner);
    const live = G.enemies.filter((e) => e.hp > 0 && e.spawnT <= 0.2);
    if ((s.type === 'drone' || s.type === 'fortress') && o) {
      const a = s.off + G.t * 1.2, R = s.type === 'fortress' ? 0 : 26;
      const tx = o.x + Math.cos(a) * R, ty = o.y + Math.sin(a) * R - (s.type === 'fortress' ? 30 : 0);
      s.x += (tx - s.x) * Math.min(1, dt * 5); s.y += (ty - s.y) * Math.min(1, dt * 5);
      const t = nearest(live, s.x, s.y, s.range);
      if (t) s.a = angTo(s, t);
      if (s.cd <= 0 && t) {
        s.cd = s.rate;
        if (s.type === 'fortress') { s.spin = (s.spin || 0) + 0.5; for (let k = 0; k < 6; k++) G.shots.push({ id: G.nextId++, owner: s.owner, k: 'laser', x: s.x, y: s.y, vx: Math.cos(s.spin + k * TAU / 6) * 380, vy: Math.sin(s.spin + k * TAU / 6) * 380, a: s.spin + k * TAU / 6, r: 5, dmg: s.dmg, pierce: 1, hit: new Set(), life: 1, t: 0, hitFx: 'zap', pal: 'laserCyan' }); }
        else {
          G.shots.push({ id: G.nextId++, owner: s.owner, k: 'laser', x: s.x, y: s.y, vx: Math.cos(s.a) * 460, vy: Math.sin(s.a) * 460, a: s.a, r: 5, dmg: s.dmg, pierce: 0, hit: new Set(), life: 1, t: 0, hitFx: 'zap', pal: 'laserCyan' });
          if (s.missile && Math.random() < 0.25) G.shots.push({ id: G.nextId++, owner: s.owner, k: 'rocket', x: s.x, y: s.y, vx: Math.cos(s.a) * 200, vy: Math.sin(s.a) * 200, a: s.a, r: 6, dmg: s.dmg * 2.5, pierce: 0, hit: new Set(), life: 2, t: 0, boom: 40, boomFx: 'smallBoom', home: 4 });
        }
        sfx(G, 'laser', s.x, s.y);
      }
    } else if (s.type === 'hound') {
      const t = nearest(live, s.x, s.y, 400);
      const tx = t ? t.x : (o ? o.x + Math.cos(s.off + G.t) * 30 : s.x), ty = t ? t.y : (o ? o.y + Math.sin(s.off + G.t) * 30 : s.y);
      const a = Math.atan2(ty - s.y, tx - s.x), d = Math.hypot(tx - s.x, ty - s.y);
      s.a = a; if (d > 10) { s.x += Math.cos(a) * 150 * dt; s.y += Math.sin(a) * 150 * dt; s.walk = (s.walk || 0) + dt * 10; }
      collideWorld(G, s);
      if (t && d < t.r + 12 && s.cd <= 0) { s.cd = s.rate; hitEnemy(G, t, s.dmg, s.owner, { knock: 40, ka: a }); if (s.stun) applyStatus(t, { k: 'stun', dur: 0.5, chance: 0.4 }); fx(G, 'hitSpark', t.x, t.y); }
    } else if (s.type === 'turret') {
      const t = nearest(live, s.x, s.y, s.range);
      if (t) s.a = angTo(s, t);
      if (s.cd <= 0 && t) {
        s.cd = s.rate;
        G.shots.push({ id: G.nextId++, owner: s.owner, k: 'bullet', x: s.x, y: s.y, vx: Math.cos(s.a) * 520, vy: Math.sin(s.a) * 520, a: s.a, r: 5, dmg: s.dmg, pierce: 0, hit: new Set(), life: 0.8, t: 0, hitFx: 'bulletHit' });
        if (s.missile && Math.random() < 0.2) G.shots.push({ id: G.nextId++, owner: s.owner, k: 'rocket', x: s.x, y: s.y, vx: Math.cos(s.a) * 200, vy: Math.sin(s.a) * 200, a: s.a, r: 6, dmg: s.dmg * 2.5, pierce: 0, hit: new Set(), life: 2, t: 0, boom: 40, boomFx: 'smallBoom', home: 4 });
        sfx(G, 'gun', s.x, s.y);
      }
    } else if (s.type === 'tesla') {
      if (s.cd <= 0) { s.cd = s.rate; const t = nearest(live, s.x, s.y, s.range); if (t) { chainFrom(G, s, s.dmg, 2, 120, s.owner, { k: 'stun', dur: 0.3, chance: 0.5 }, false, 'volt'); if (Math.random() < 0.3) { fx(G, 'lightningStrike', t.x, t.y); } } }
    } else if (s.type === 'decoy') {
      if (s.shoot && s.cd <= 0) { s.cd = 0.5; const t = nearest(live, s.x, s.y, 260); if (t) { s.a = angTo(s, t); G.shots.push({ id: G.nextId++, owner: s.owner, k: 'magicBolt', x: s.x, y: s.y, vx: Math.cos(s.a) * 340, vy: Math.sin(s.a) * 340, a: s.a, r: 6, dmg: s.shoot, pierce: 0, hit: new Set(), life: 1, t: 0, hitFx: 'manaPop' }); } }
      if (s.life <= 0 && s.boom) { fx(G, 'plasmaBoom', s.x, s.y); boomAt(G, s.x, s.y, s.boom, s.dmg, 'player', s.owner); }
      if (s.life <= 0) fx(G, 'warpOut', s.x, s.y);
    }
  }
  G.summons = G.summons.filter((s) => s.life > 0);
}

function updateMines(G, dt) {
  for (const m of G.mines) {
    m.arm -= dt;
    if (m.arm > 0) continue;
    if (G.enemies.some((e) => e.hp > 0 && dist2(e, m) < (m.r * 0.6 + e.r) ** 2)) {
      m.gone = true; fx(G, m.boomFx || 'smallBoom', m.x, m.y, { size: m.r / 50 }); boomAt(G, m.x, m.y, m.r, m.dmg, 'player', m.owner, { knock: m.st ? 0 : 100, st: m.st }); sfx(G, 'boom', m.x, m.y);
    }
  }
  G.mines = G.mines.filter((m) => !m.gone);
}

function updatePickups(G, dt) {
  for (const k of G.pickups) {
    if (k.vx) { k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= 0.9; k.vy *= 0.9; if (Math.abs(k.vx) < 1) k.vx = 0; if (Math.abs(k.vy) < 1) k.vy = 0; }
    const auto = k.k === 'xp' || k.k === 'gold' || k.k === 'crystal';
    let best = null, bd = 1e9;
    for (const p of G.players) {
      if (p.dead) continue; if (k.owner && k.owner !== p.id) continue;
      const d = Math.hypot(p.x - k.x, p.y - k.y), R = auto ? 40 * stats(p).pickup * (G.phase !== 'fight' ? 6 : 1) : k.r + 8;
      if (d < R && d < bd) { bd = d; best = p; }
    }
    if (!best) continue;
    if (auto && bd > 10) { const a = angTo(k, best), sp = 260; k.x += Math.cos(a) * sp * dt; k.y += Math.sin(a) * sp * dt; continue; }
    collect(G, best, k);
  }
  G.pickups = G.pickups.filter((k) => !k.gone);
}

function collect(G, p, k) {
  const s = stats(p);
  switch (k.k) {
    case 'xp': {
      // 経験値は全員で共有
      for (const q of G.players) { q.xp += k.v; while (q.xp >= XP_NEXT(q.lv)) { q.xp -= XP_NEXT(q.lv); q.lv++; q.maxHp += 3; q.hp += 3; offer(G, q, 'level'); ev(G, { e: 'levelup', pid: q.id, lv: q.lv }); fx(G, 'levelUpFx', q.x, q.y, { follow: q.id }); } }
      sfx(G, 'xp'); k.gone = true; break;
    }
    case 'gold': for (const q of G.players) q.gold += Math.round(k.v * s.gold); sfx(G, 'coin'); k.gone = true; break;
    case 'crystal': G.crystals += k.v; ev(G, { e: 'crystal', v: k.v }); fx(G, 'collectBurst', k.x, k.y); sfx(G, 'gem'); k.gone = true; break;
    case 'heart': healPlayer(G, p, k.v); fx(G, 'heal', p.x, p.y, { follow: p.id }); sfx(G, 'heal'); k.gone = true; break;
    case 'tome': for (const q of G.players) offer(G, q, 'level'); fx(G, 'collectBurst', k.x, k.y); sfx(G, 'gem'); k.gone = true; break;
    case 'chest': fx(G, 'chestOpen', k.x, k.y); for (const q of G.players) offer(G, q, 'chest'); for (let i = 0; i < 8; i++) G.pickups.push({ id: G.nextId++, k: 'gold', x: k.x, y: k.y, v: 5, r: 4, vx: rnd(-80, 80), vy: rnd(-80, 80) }); k.gone = true; sfx(G, 'open'); break;
    case 'relic': offer(G, p, 'relic'); fx(G, 'collectBurst', k.x, k.y); k.gone = true; sfx(G, 'gem'); break;
    case 'fountain': if (!k.used) { k.used = true; for (const q of G.players) { healPlayer(G, q, q.maxHp * 0.5); q.maxHp += 5; } fx(G, 'healAoe', k.x, k.y); sfx(G, 'heal'); toast(G, '泉の水で全員回復した'); } break;
  }
}

// ---------- 見た目に必要なもの ----------
export function makeView(G) {
  const r = Math.round;
  return {
    t: +G.t.toFixed(3), phase: G.phase, w: G.w, h: G.h, biome: BIOMES.indexOf(G.biome), floor: G.floor, room: G.room, depth: G.depth, roomType: G.roomType,
    kills: G.kills, crystals: G.crystals, shake: +G.shake.toFixed(2), timeStop: G.timeStop > 0 ? 1 : 0, over: G.over, won: G.won,
    players: G.players.map((p) => ({
      id: p.id, name: p.name, slot: p.slot, x: r(p.x), y: r(p.y), a: +p.a.toFixed(2), hp: Math.ceil(p.hp), mhp: p.maxHp, lv: p.lv, xp: r(p.xp), xpn: XP_NEXT(p.lv), gold: p.gold,
      dead: p.dead ? 1 : 0, rev: +(p.reviveT / 2.5).toFixed(2), dash: p.dashT > 0 ? 1 : 0, ifr: p.iframe > 0 ? 1 : 0, hurt: p.hurtT > 0 ? 1 : 0, sh: Math.round(p.shield), walk: +(p.walk % 100).toFixed(1), cast: p.castFlash > 0 ? 1 : 0,
      spells: p.spells.map((o) => [o.id, o.lv, +(o.cd / spellAt(o.id, o.lv).cd).toFixed(2)]), relics: p.relics, dcd: +Math.max(0, p.dashCd).toFixed(2), auto: p.auto ? 1 : 0, rr: p.rerolls,
      ch: p.choices ? { k: p.choiceKind, c: p.choices } : null, buffs: p.buffs.map((b) => b.k).filter(Boolean), kills: p.kills, dmg: Math.round(p.dmgDone), inv: p.buffs.some((b) => b.invuln) ? 1 : 0,
    })),
    enemies: G.enemies.map((e) => ({ id: e.id, k: e.D.model, x: r(e.x), y: r(e.y), a: +e.a.toFixed(2), hp: Math.max(0, r(e.hp)), mhp: e.maxHp, el: e.elite ? 1 : 0, bo: e.boss ? 1 : 0, fl: e.flash > 0 ? 1 : 0, sc: e.scale, sp: e.spawnT > 0 ? 1 : 0, fly: e.D.fly || 0,
      st: (e.st.freeze ? 1 : 0) | (e.st.burn ? 2 : 0) | (e.st.poison ? 4 : 0) | (e.st.stun ? 8 : 0) | (e.st.slow ? 16 : 0) | (e.st.curse ? 32 : 0) | (e.st.root ? 64 : 0) | (e.state === 'fuse' ? 128 : 0) | (e.state === 'wind' ? 256 : 0) | (e.st.confuse ? 512 : 0),
      name: e.boss ? e.D.name : undefined, p2: e.phase2 ? 1 : 0 })),
    shots: G.shots.map((s) => ({ id: s.id, k: s.k, x: r(s.x), y: r(s.y), a: +s.a.toFixed(2), pal: s.pal, vx: r(s.vx || 0), vy: r(s.vy || 0) })),
    bullets: G.bullets.map((b) => [r(b.x), r(b.y), r(b.vx), r(b.vy), b.r, b.col, b.ref ? 1 : 0]),
    zones: G.zones.map((z) => ({ id: z.id, k: z.k, x: r(z.x), y: r(z.y), r: r(z.r), a: z.a != null ? +z.a.toFixed(2) : 0, e: z.enemy ? 1 : 0, f: z.follow ?? null, pal: z.pal })),
    teles: G.teles.map((t) => ({ k: t.kind, x: r(t.x), y: r(t.y), r: t.r, ang: t.ang != null ? +t.ang.toFixed(2) : 0, len: t.len, w: t.w, p: +(1 - t.t / t.max).toFixed(2), d: t.dmg ? 1 : 0 })),
    strikes: G.strikes.filter((s) => s.mark).map((s) => ({ x: r(s.x), y: r(s.y), r: r(s.r), t: +s.t.toFixed(2) })),
    summons: G.summons.map((s) => ({ id: s.id, type: s.type, x: r(s.x), y: r(s.y), a: +(s.a || 0).toFixed(2), slot: (G.players.find((q) => q.id === s.owner) || {}).slot || 0, life: +s.life.toFixed(1), doll: s.doll ? 1 : 0, w: +(s.walk || 0).toFixed(1) })),
    mines: G.mines.map((m) => [r(m.x), r(m.y), m.arm > 0 ? 0 : 1]),
    pickups: G.pickups.map((k) => ({ id: k.id, k: k.k, x: r(k.x), y: r(k.y), o: k.owner ?? null, u: k.used ? 1 : 0 })),
    exits: G.exits.map((e) => ({ x: e.x, y: e.y, type: e.type, reward: e.reward, hold: +e.hold.toFixed(2) })),
    props: G.props.map((p) => ({ m: p.model, x: r(p.x), y: r(p.y), a: p.a, g: p.grow ?? 1 })),
    stealth: G.players.filter((p) => p.buffs.some((b) => b.stealth)).map((p) => p.id),
    shop: G.shop ? G.shop.map((it) => ({ i: it.i, t: it.t, id: it.id, name: it.name, desc: it.desc, price: it.price, sold: it.sold })) : null,
    boss: G.enemies.find((e) => e.boss) ? (() => { const e = G.enemies.find((o) => o.boss); return { name: e.D.name, hp: Math.max(0, r(e.hp)), mhp: e.maxHp, p2: e.phase2 ? 1 : 0 }; })() : null,
    obstacles: null,
  };
}
export function roomInfo(G) { return { e: 'room', w: G.w, h: G.h, biome: BIOMES.indexOf(G.biome), obstacles: G.obstacles, type: G.roomType, floor: G.floor, room: G.room, depth: G.depth }; }
export function setPaused(G, v) { G.paused = v; }

/** 試験用：好きな世界・部屋へ飛ぶ（URL に ?dev=... を付けたときだけ使う） */
export function devJump(G, floor, type, spells) {
  G.floor = floor; G.depth = floor; G.room = type === 'boss' ? ROOMS_PER_BIOME + 1 : 2; G.biome = BIOMES[floor % BIOMES.length];
  for (const p of G.players) { p.choices = null; if (spells) p.spells = spells.map(([id, lv]) => ({ id, lv, cd: 0 })); p.lv = 12; p.maxHp = 400; p.hp = 400; }
  G.phase = 'fight';
  enterRoom(G, type, 'spell');
}
