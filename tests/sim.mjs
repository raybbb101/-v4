// ボットで全部の世界・ボス・魔法（全段階）を通して、例外が出ないか確かめる
import '../js/models.js';
import { createGame, step, makeView, choose } from '../js/sim.js';
import { SPELLS } from '../js/spells.js';
const T0 = Date.now();
let errors = 0, maxEnemies = 0, maxShots = 0, maxBullets = 0, evCount = {};
function run(spellIds, lv, god, maxSec, diff = 1, nPlayers = 1) {
  const players = Array.from({ length: nPlayers }, (_, i) => ({ id: 'p' + i, name: 'bot' + i }));
  const G = createGame({ players, diff });
  for (const p of G.players) { choose(G, p.id, 0); p.spells = spellIds.map((id) => ({ id, lv, cd: 0 })); }
  let t = 0; const dt = 1 / 60; let rooms = 0, lastRoom = '';
  while (t < maxSec && !G.over) {
    const inputs = {};
    for (const p of G.players) {
      if (p.choices) choose(G, p.id, Math.floor(Math.random() * p.choices.length));
      if (god) { p.hp = p.maxHp; }
      let mx = 0, my = 0;
      if (G.phase === 'exits' && G.exits.length) { const e = G.exits[0]; mx = e.x - p.x; my = e.y - p.y; }
      else if (G.phase === 'clear') { const k = G.pickups.find((q) => q.k === 'tome' || q.k === 'relic' || q.k === 'chest' || q.k === 'heart' || q.k === 'fountain'); if (k) { mx = k.x - p.x; my = k.y - p.y; } }
      else { mx = Math.cos(t * 0.7 + p.slot) ; my = Math.sin(t * 0.9 + p.slot); }
      const l = Math.hypot(mx, my) || 1;
      inputs[p.id] = { mx: mx / l, my: my / l, auto: true, dash: Math.random() < 0.01, cast: [] };
    }
    if (G.shop) for (const p of G.players) { p.gold += 500; for (const it of G.shop) { const { buy } = { buy: null }; } }
    try { step(G, dt, inputs); } catch (e) { errors++; console.log('ERR', e.stack.split('\n').slice(0, 4).join(' | ')); if (errors > 5) process.exit(1); }
    for (const e of G.events) evCount[e.e === 'fx' ? 'fx:' + e.k : e.e] = (evCount[e.e === 'fx' ? 'fx:' + e.k : e.e] || 0) + 1;
    G.events.length = 0;
    const key = G.floor + ':' + G.room + G.roomType; if (key !== lastRoom) { lastRoom = key; rooms++; }
    maxEnemies = Math.max(maxEnemies, G.enemies.length); maxShots = Math.max(maxShots, G.shots.length); maxBullets = Math.max(maxBullets, G.bullets.length);
    if (t % 5 < dt) { const v = JSON.stringify(makeView(G)); if (v.length > 60000) console.log('big view', v.length); }
    t += dt;
  }
  return { G, rooms, t };
}
// 1) すべての魔法、すべての段階
for (const lv of [1, 3, 6, 10]) {
  for (let i = 0; i < SPELLS.length; i += 6) {
    const ids = SPELLS.slice(i, i + 6).map((s) => s.id);
    const r = run(ids, lv, true, 25);
    console.log(`lv${lv} ${ids.join(',')} rooms=${r.rooms} floor=${r.G.floor} kills=${r.G.kills}`);
  }
}
// 2) 長い通しプレイ（無敵、全部の世界とボス）
const r = run(['fire', 'thunder', 'laser', 'gun', 'drone', 'heal'], 10, true, 900, 1, 2);
console.log(`long run: rooms=${r.rooms} floor=${r.G.floor} depth=${r.G.depth} kills=${r.G.kills} t=${Math.round(r.t)} won=${r.G.won}`);
// 3) ふつうのボット（死ぬまで）
const r2 = run(['fire'], 1, false, 900, 1, 1);
console.log(`mortal run: rooms=${r2.rooms} floor=${r2.G.floor} room=${r2.G.room} kills=${r2.G.kills} lv=${r2.G.players[0].lv} over=${r2.G.over} t=${Math.round(r2.t)}`);
console.log({ errors, maxEnemies, maxShots, maxBullets, ms: Date.now() - T0 });
const missing = Object.keys(evCount).filter((k) => k.startsWith('fx:')).map((k) => k.slice(3));
console.log('fx used:', missing.length);
console.log(JSON.stringify(Object.fromEntries(Object.entries(evCount).filter(([k]) => !k.startsWith('fx:')))));
import('../js/fxreg.js').catch(() => {});
