// このゲームのボクセルモデル（すべてコードで組み立てるオリジナル）。x の正方向が「前」。
import { defineModel, hash3, fbm, TAU } from './stack.js';

// ---------- 魔法使い（プレイヤー） ----------
function mage(robe, orb, hatTip) {
  return (V, f) => {
    const c = 9, bob = f === 1 ? 1 : 0;
    V.cone(c, c, 0, c, c, 15, 6.6, 3.8, robe);
    V.paint((x, y, z) => z < 1.6, 'dark');
    V.paint((x, y, z, xi, yi, zi, n) => n === robe && z > 9 && z < 10.6, 'gold');
    V.paint((x, y, z, xi, yi, zi, n) => n === robe && x > c + 3 && z < 9 && Math.abs(y - c) < 0.9, 'white');
    for (const s of [-1, 1]) V.seg(c, c + s * 4, 14, c + 3, c + s * 5, 9.5, 1.6, robe);
    V.ball(c + 3.4, c + 5.2, 9, 1.2, 'skin'); V.ball(c + 3.4, c - 5.2, 9, 1.2, 'skin');
    V.ball(c, c, 18.5 + bob, 3.9, 'skin');
    V.ell(c - 1.3, c, 19.3 + bob, 3.7, 4.2, 3.3, 'hair');
    V.put(c + 3.6, c - 1.4, 18 + bob, 'dark'); V.put(c + 3.6, c + 1.4, 18 + bob, 'dark');
    V.put(c + 3.6, c - 1.4, 19 + bob, 'e_white'); V.put(c + 3.6, c + 1.4, 19 + bob, 'e_white');
    V.cyl(c, c, 7, 21.5 + bob, 22.6 + bob, robe);
    V.cone(c, c, 22 + bob, c - 3, c, 33 + bob, 4.4, 0.5, robe);
    V.paint((x, y, z, xi, yi, zi, n) => n === robe && z > 22.6 + bob && z < 24.2 + bob, 'gold');
    V.ball(c - 3.2, c, 33 + bob, 1.1, hatTip);
    V.seg(c + 3.6, c + 5.6, 1, c + 4.2, c + 5.6, 24, 0.7, 'wood');
    V.ball(c + 4.2, c + 5.6, 25.4, 1.7, orb);
  };
}
const ROBES = ['robe0', 'robe1', 'robe2', 'robe3'], ORBS = ['e_cyan', 'e_fire2', 'e_green', 'e_yellow'];
for (let i = 0; i < 4; i++) defineModel('mage' + i, 19, 19, 35, mage(ROBES[i], ORBS[i], ORBS[i]), { frames: 2, r: 5 });
defineModel('holo', 19, 19, 35, mage('glass', 'e_cyan', 'e_cyan'), { frames: 2, r: 5 });

// ---------- 森の魔物 ----------
defineModel('slime', 16, 16, 14, (V, f) => {
  const h = f ? 10 : 13, r = f ? 7.4 : 6.4;
  V.ell(8, 8, h * 0.45, r, r, h * 0.55, 'slime');
  V.paint((x, y, z) => z < 1, 'green');
  for (const s of [-1, 1]) { V.box(8 + r * 0.8, 8 + s * 2.4 - 0.5, h * 0.45, 8 + r + 1, 8 + s * 2.4 + 1, h * 0.45 + 2, 'dark'); V.put(8 + r * 0.9, 8 + s * 2.4, h * 0.45 + 1.4, 'e_white'); }
  V.ball(5.5, 5.5, h * 0.75, 1.3, 'white');
}, { frames: 2, r: 6 });
defineModel('mushroom', 16, 16, 20, (V, f) => {
  V.cyl(8, 8, 3.2, 0, 11, 'bone');
  for (const s of [-1, 1]) V.box(6 + (f ? s : -s), 8 + s * 2.4 - 1, 0, 8 + (f ? s : -s), 8 + s * 2.4 + 1, 2, 'bark');
  V.ell(8, 8, 13, 7.4, 7.4, 4.6, 'cap');
  V.paint((x, y, z) => z < 11, 'bone');
  V.paint((x, y, z, xi, yi, zi) => z > 13 && hash3(xi >> 1, yi >> 1, zi >> 1, 5) < 0.2, 'white');
  V.box(10.6, 6, 7, 11.4, 7, 9, 'dark'); V.box(10.6, 9, 7, 11.4, 10, 9, 'dark');
}, { frames: 2, r: 6 });
defineModel('golem', 18, 18, 22, (V, f) => {
  const s = f ? 1 : 0;
  V.box(4, 5, 0, 8, 8, 6 + s, 'stone'); V.box(4, 10, 0, 8, 13, 6 - s, 'stone');
  V.ell(9, 9, 11, 6.5, 7.2, 6, 'stone');
  V.ell(9.5, 9, 18, 3.6, 3.6, 3.2, 'stone');
  V.seg(9, 2.5, 14, 11 + s * 2, 1.5, 6, 2, 'stone'); V.seg(9, 15.5, 14, 11 - s * 2, 16.5, 6, 2, 'stone');
  V.paint((x, y, z, xi, yi, zi) => z > 14 && fbm(xi * 0.3, yi * 0.3, zi * 0.3, 4) > 0.55, 'moss');
  V.put(12.6, 8, 18, 'e_cyan'); V.put(12.6, 10, 18, 'e_cyan');
  V.put(14.8, 9, 11, 'e_cyan');
}, { frames: 2, r: 8 });
defineModel('wisp', 10, 10, 10, (V) => {
  V.ball(5, 5, 5, 3.4, 'e_cyan'); V.ball(5, 5, 5, 2.2, 'e_white');
  V.cone(3, 5, 5, 0, 5, 7, 1.6, 0.3, 'e_blue');
}, { r: 4, glowK: 1.1 });
defineModel('wolf', 20, 12, 12, (V, f) => {
  const s = f ? 1.4 : -1.4;
  V.ell(9, 6, 7, 6.5, 3.4, 3.2, 'stone');
  V.ell(16, 6, 8.5, 2.8, 2.6, 2.4, 'stone');
  V.cone(17.5, 6, 8, 20, 6, 7.4, 1.6, 0.8, 'stone');
  for (const sy of [-1, 1]) V.cone(15.6, 6 + sy * 1.6, 10.4, 15, 6 + sy * 1.8, 12, 0.9, 0.2, 'stone');
  for (const [lx, ly, d] of [[5, 4, 1], [5, 8, -1], [13, 4, -1], [13, 8, 1]]) V.seg(lx, ly, 5, lx + s * d, ly, 0, 1, 'dark');
  V.cone(3, 6, 8, -1, 6, 10, 1.4, 0.5, 'stone');
  V.put(17.6, 4.6, 9, 'e_red'); V.put(17.6, 7.4, 9, 'e_red');
  V.paint((x, y, z) => z > 9 && x < 14, 'hair');
}, { frames: 2, r: 6 });
defineModel('treant', 40, 40, 48, (V, f) => {
  const c = 20;
  V.cone(c, c, 0, c, c, 30, 8.5, 6, 'bark');
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; V.cone(c, c, 3, c + Math.cos(a) * 15, c + Math.sin(a) * 15, 0, 3, 1.2, 'bark'); }
  for (const s of [-1, 1]) V.cone(c, c + s * 5, 24, c + 6 + (f ? 2 : 0), c + s * 15, 16, 2.6, 1.2, 'bark');
  V.ell(c - 1, c, 38, 15, 15, 9, 'leaf');
  V.ell(c + 3, c - 6, 43, 8, 8, 5, 'leaf'); V.ell(c - 4, c + 6, 42, 8, 8, 5, 'leaf');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && fbm(xi * 0.25, yi * 0.25, zi * 0.25, 9) < 0.38, 'moss');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && hash3(xi, yi, zi, 3) < 0.02, 'e_pinkL');
  V.box(c + 7, c - 4, 19, c + 9, c - 1, 21, 'e_lime'); V.box(c + 7, c + 1, 19, c + 9, c + 4, 21, 'e_lime');
  V.box(c + 7, c - 2, 13, c + 9, c + 2, 15, 'dark');
}, { frames: 2, r: 15 });

// ---------- 街の魔物 ----------
defineModel('drone', 16, 16, 8, (V, f) => {
  V.ell(8, 8, 4, 4, 4, 2.2, 'steel');
  for (const [x, y] of [[2.5, 2.5], [13.5, 2.5], [2.5, 13.5], [13.5, 13.5]]) {
    V.seg(8, 8, 4, x, y, 4.5, 0.7, 'metal');
    V.torus(x, y, 5.5, 2.2, 0.5, f ? 'white' : 'metal');
  }
  V.put(12, 8, 4, 'e_red'); V.put(11, 8, 3, 'e_red');
}, { frames: 2, r: 6 });
defineModel('robodog', 18, 12, 12, (V, f) => {
  const s = f ? 1.3 : -1.3;
  V.box(4, 3, 5, 14, 9, 9, 'steel');
  V.box(13, 4, 7, 18, 8, 11, 'steel');
  V.put(17, 5, 9, 'e_red'); V.put(17, 7, 9, 'e_red');
  for (const [lx, ly, d] of [[5, 3, 1], [5, 9, -1], [12, 3, -1], [12, 9, 1]]) V.seg(lx, ly, 5, lx + s * d, ly, 0, 0.9, 'metal');
  V.seg(4, 6, 8, 1, 6, 10, 0.6, 'metal');
  V.box(6, 4, 9, 12, 8, 10, 'e_yellow');
}, { frames: 2, r: 6 });
defineModel('soldier', 16, 16, 22, (V, f) => {
  const c = 8;
  V.box(c - 2.5, c - 3, 0, c + 1.5, c - 1, 8, 'olive'); V.box(c - 2.5, c + 1, 0, c + 1.5, c + 3, 8, 'olive');
  V.box(c - 3, c - 4, 8, c + 2.5, c + 4, 15, 'olive');
  V.box(c - 2.4, c - 3.4, 9, c + 2.8, c + 3.4, 14, 'steel');
  V.ball(c, c, 17.5, 2.8, 'skin'); V.ell(c, c, 18.6, 3.2, 3.2, 2.4, 'olive');
  V.box(c + 2, c - 1.4, 16.8, c + 3.2, c + 1.4, 17.8, 'e_cyan');
  // 盾
  V.box(c + 4, c - 6, 2, c + 5.4, c + 6, 16, 'steel'); V.box(c + 5.2, c - 5, 6, c + 5.6, c + 5, 8, 'e_yellow');
  V.seg(c, c - 4.5, 13, c + 4, c - 4, 10 + (f ? 1 : 0), 1, 'olive');
}, { frames: 2, r: 6 });
defineModel('bomber', 14, 14, 14, (V, f) => {
  V.ball(7, 7, 6, 5, 'dark'); V.paint((x, y, z) => Math.abs(z - 6) < 0.8, 'red');
  V.seg(7, 7, 10, 6, 7, 13, 0.6, 'metal'); V.ball(6, 7, 13.4, 1, f ? 'e_fire' : 'e_red');
  V.put(11.6, 5, 7, 'e_white'); V.put(11.6, 9, 7, 'e_white');
}, { frames: 2, r: 5 });
defineModel('turret', 14, 14, 14, (V) => {
  V.cyl(7, 7, 6, 0, 3, 'concrete'); V.cyl(7, 7, 4, 3, 8, 'steel');
  V.box(7, 5.5, 8, 14, 8.5, 11, 'metal'); V.box(4, 4, 8, 9, 10, 12, 'steel');
  V.put(13, 7, 9, 'e_red');
}, { r: 6 });
defineModel('tank', 44, 32, 24, (V, f) => {
  V.box(4, 2, 0, 40, 9, 7, 'dark'); V.box(4, 23, 0, 40, 30, 7, 'dark');
  V.paint((x, y, z, xi) => (xi + f) % 3 === 0 && z > 5, 'metal');
  V.box(6, 6, 5, 38, 26, 12, 'olive');
  V.box(14, 9, 12, 30, 23, 18, 'olive');
  V.seg(28, 16, 15, 44, 16, 15, 1.8, 'steel');
  V.seg(24, 11, 18, 30, 11, 21, 0.5, 'metal');
  V.box(16, 12, 18, 22, 20, 19, 'e_red');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'olive' && fbm(xi * 0.2, yi * 0.2, zi * 0.2, 8) > 0.6, 'moss');
}, { frames: 2, r: 16 });

// ---------- 星の魔物 ----------
defineModel('knight', 16, 16, 26, (V, f) => {
  const c = 8;
  V.cone(c, c, 0, c, c, 14, 4, 3, 'navy');
  V.box(c - 3, c - 4.4, 12, c + 3, c + 4.4, 18, 'hull');
  V.ball(c, c, 21, 3, 'hull'); V.box(c + 2, c - 2, 20.5, c + 3.2, c + 2, 21.6, 'e_cyan');
  V.cone(c, c, 23, c - 2, c, 26, 1, 0.3, 'e_cyan');
  V.seg(c, c + 5, 15, c + 7, c + 6, 4 + f * 3, 0.7, 'e_cyan');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'hull' && zi % 3 === 0, 'e_blue');
}, { frames: 2, r: 6 });
defineModel('cannon', 16, 16, 16, (V) => {
  V.cyl(8, 8, 7, 0, 3, 'hull'); V.ball(8, 8, 8, 5, 'purp');
  V.seg(8, 8, 9, 16, 8, 10, 2.2, 'hull'); V.ball(15.5, 8, 10, 1.6, 'e_violet');
  V.torus(8, 8, 8, 5.5, 0.6, 'e_violet');
}, { r: 7 });
defineModel('nano', 10, 10, 10, (V, f) => {
  for (let k = 0; k < 9; k++) {
    const a = k * 2.4 + f, r = 1.5 + hash3(k, 1, 1, 3) * 2.5;
    V.ball(5 + Math.cos(a) * r, 5 + Math.sin(a) * r, 3 + hash3(k, 2, 2, 4) * 5, 0.9, k % 3 ? 'steel' : 'e_lime');
  }
}, { frames: 3, r: 4 });
defineModel('gravorb', 16, 16, 16, (V, f) => {
  V.ball(8, 8, 8, 4.4, 'void'); V.ball(8, 8, 8, 2.4, 'e_violet');
  V.torus(8, 8, 8, 6.6, 0.6, 'purp', f ? 'y' : 'x'); V.torus(8, 8, 8, 6.6, 0.6, 'hull');
}, { frames: 2, r: 6 });
defineModel('spider', 22, 22, 12, (V, f) => {
  const c = 11;
  V.ell(c - 1, c, 7, 5, 4.5, 3.2, 'hull'); V.ell(c + 4, c, 7, 2.6, 2.6, 2.2, 'metal');
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
    const x = c - 4 + k * 2.6, sw = ((k + (s > 0 ? 1 : 0) + f) % 2) ? 1.4 : -1.4;
    V.seg(x, c + s * 3, 7, x + sw, c + s * 8, 9, 0.6, 'metal'); V.seg(x + sw, c + s * 8, 9, x + sw * 1.4, c + s * 10, 0, 0.6, 'metal');
  }
  V.put(c + 6, c - 1, 7, 'e_red'); V.put(c + 6, c + 1, 7, 'e_red'); V.put(c + 6, c, 8, 'e_red');
}, { frames: 2, r: 8 });
defineModel('mech', 44, 44, 44, (V, f) => {
  const c = 22;
  for (const s of [-1, 1]) { V.box(c - 4, c + s * 9 - 3, 0, c + 4, c + s * 9 + 3, 14, 'hull'); V.box(c - 6, c + s * 9 - 4, 0, c + 6, c + s * 9 + 4, 3, 'metal'); }
  V.ell(c, c, 22, 11, 13, 9, 'hull');
  V.box(c + 6, c - 6, 20, c + 12, c + 6, 26, 'glass');
  for (const s of [-1, 1]) {
    V.seg(c, c + s * 13, 26, c + 6, c + s * 18, 18, 3, 'metal');
    V.seg(c + 6, c + s * 18, 18, c + 20, c + s * 18, 20 + f * 2, 2.4, 'steel');
    V.ball(c + 20, c + s * 18, 20 + f * 2, 1.6, 'e_cyan');
  }
  V.cone(c - 4, c, 30, c - 8, c, 42, 2, 0.5, 'steel'); V.ball(c - 8, c, 42, 1.4, 'e_red');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'hull' && zi % 4 === 0 && z > 14, 'e_cyan');
}, { frames: 2, r: 17 });

// ---------- 虚無の魔物 ----------
defineModel('voideye', 16, 16, 16, (V, f) => {
  V.ball(8, 8, 8, 5.5, 'bone');
  V.paint((x, y, z) => x > 11.5, 'purp'); V.paint((x, y, z) => x > 12.6 && Math.hypot(y - 8, z - 8) < 1.6, 'e_violet');
  V.paint((x, y, z) => x > 12.4 && Math.hypot(y - 8, z - 8) < 0.8, 'dark');
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + f * 0.4; V.cone(5, 8, 6, 5 + Math.cos(a) * 3 - 3, 8 + Math.sin(a) * 6, 0, 0.9, 0.3, 'void'); }
}, { frames: 2, r: 6 });
defineModel('shade', 16, 16, 24, (V, f) => {
  const c = 8;
  V.cone(c, c, 0, c, c, 16, 5.5 + f * 0.5, 2.6, 'void');
  V.paint((x, y, z, xi, yi, zi) => z < 4 && hash3(xi, yi, 0, 9 + f) < 0.4, '');
  V.ball(c, c, 18, 3, 'dark'); V.cone(c, c, 18, c - 2, c, 24, 3.4, 0.4, 'void');
  V.put(c + 2.8, c - 1, 18, 'e_violet'); V.put(c + 2.8, c + 1, 18, 'e_violet');
  for (const s of [-1, 1]) V.seg(c, c + s * 3, 14, c + 5, c + s * 5, 10 + f, 1, 'void');
}, { frames: 2, r: 6 });
defineModel('voidlord', 34, 34, 52, (V, f) => {
  const c = 17;
  V.cone(c, c, 0, c, c, 32, 11, 6, 'void');
  V.paint((x, y, z, xi, yi, zi) => z < 5 && hash3(xi, yi, 0, 3 + f) < 0.35, '');
  V.box(c - 6, c - 7, 24, c + 6, c + 7, 32, 'obsid');
  V.ball(c, c, 36, 5, 'dark');
  for (const s of [-1, 1]) V.cone(c, c + s * 3, 39, c - 3, c + s * 9, 50, 1.6, 0.4, 'bone');
  V.box(c + 4, c - 2.6, 36, c + 5.4, c - 1, 37.4, 'e_violet'); V.box(c + 4, c + 1, 36, c + 5.4, c + 2.6, 37.4, 'e_violet');
  for (const s of [-1, 1]) { V.seg(c, c + s * 7, 30, c + 8, c + s * 13, 22 + f * 3, 2, 'void'); V.ball(c + 8, c + s * 13, 22 + f * 3, 2.2, 'e_violet'); }
  V.torus(c, c, 42, 9, 0.6, 'e_violet');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'obsid' && zi % 3 === 0, 'purp');
}, { frames: 2, r: 13 });

// ---------- 召喚・味方 ----------
defineModel('allydrone', 12, 12, 8, (V, f) => {
  V.ell(6, 6, 4, 3, 3, 2, 'hull');
  for (const [x, y] of [[1.5, 1.5], [10.5, 1.5], [1.5, 10.5], [10.5, 10.5]]) { V.seg(6, 6, 4, x, y, 4.5, 0.5, 'metal'); V.torus(x, y, 5.2, 1.6, 0.4, f ? 'white' : 'glass'); }
  V.put(9, 6, 4, 'e_cyan');
}, { frames: 2, r: 4 });
defineModel('fortress', 22, 22, 14, (V, f) => {
  V.ell(11, 11, 6, 7, 7, 3.4, 'hull');
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; const x = 11 + Math.cos(a) * 9, y = 11 + Math.sin(a) * 9; V.seg(11, 11, 6, x, y, 6.5, 0.6, 'metal'); V.torus(x, y, 7.2, 2, 0.4, f ? 'white' : 'glass'); }
  V.box(14, 9, 5, 20, 13, 7, 'steel'); V.put(19, 11, 6, 'e_cyan'); V.ball(11, 11, 9, 2, 'e_cyan');
}, { frames: 2, r: 8 });

// ---------- 置き物：森 ----------
defineModel('tree', 22, 22, 34, (V) => {
  const c = 11;
  V.cone(c, c, 0, c, c, 16, 2.6, 1.8, 'bark');
  for (let k = 0; k < 3; k++) { const a = k * 2.1; V.cone(c, c, 2, c + Math.cos(a) * 5, c + Math.sin(a) * 5, 0, 1.4, 0.6, 'bark'); }
  V.ell(c, c, 20, 9, 9, 6, 'leaf'); V.ell(c - 1, c + 1, 26, 7, 7, 5, 'leaf'); V.ell(c + 1, c - 1, 31, 4, 4, 3, 'leaf');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && fbm(xi * 0.3, yi * 0.3, zi * 0.3, 2) < 0.4, 'green');
}, { r: 5 });
defineModel('pine', 18, 18, 36, (V) => {
  const c = 9;
  V.cyl(c, c, 1.6, 0, 8, 'bark');
  for (let k = 0; k < 4; k++) V.cone(c, c, 6 + k * 7, c, c, 14 + k * 7, 8 - k * 1.6, 0.6, 'leaf');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && hash3(xi, yi, zi, 6) < 0.06, 'white');
}, { r: 4 });
defineModel('rock', 16, 14, 10, (V) => {
  V.ell(8, 7, 3, 7, 6, 6, 'rock'); V.ell(10, 6, 6, 4, 4, 4, 'rock');
  V.paint((x, y, z, xi, yi, zi) => z > 6 && fbm(xi * 0.4, yi * 0.4, zi * 0.4, 3) > 0.5, 'moss');
}, { r: 7 });
defineModel('bigshroom', 20, 20, 26, (V) => {
  V.cone(10, 10, 0, 10, 10, 16, 3, 2, 'bone');
  V.ell(10, 10, 18, 9.5, 9.5, 5, 'purp'); V.paint((x, y, z) => z < 17, 'bone');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'purp' && hash3(xi >> 1, yi >> 1, zi >> 1, 9) < 0.15, 'e_pinkL');
}, { r: 5, glowK: 0.6 });
defineModel('ruin', 14, 14, 30, (V) => {
  V.box(1, 1, 0, 13, 13, 3, 'stone'); V.cyl(7, 7, 4.4, 3, 27, 'stone'); V.box(1, 1, 27, 13, 13, 30, 'stone');
  V.paint((x, y, z, xi, yi, zi) => z > 20 && z < 27 && hash3(xi, yi, zi, 1) < 0.5 && Math.hypot(x - 7, y - 7) > 3.5, '');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'stone' && fbm(xi * 0.3, yi * 0.3, zi * 0.2, 7) > 0.56, 'moss');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'stone' && Math.floor(Math.atan2(y - 7, x - 7) * 3) % 2 === 0 && z > 3 && z < 27 && Math.hypot(x - 7, y - 7) > 3.8, undefined);
}, { r: 6 });
defineModel('crystal', 16, 16, 22, (V) => {
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3, r = k ? 3.5 : 0, L = k ? 10 + k * 2 : 20;
    V.cone(8 + Math.cos(a) * r, 8 + Math.sin(a) * r, 0, 8 + Math.cos(a) * r * 1.6, 8 + Math.sin(a) * r * 1.6, L, 2.2 - k * 0.2, 0.2, 'cryst');
  }
  V.paint((x, y, z, xi, yi, zi) => hash3(xi, yi, zi, 4) < 0.05, 'e_cyan');
}, { r: 6, glowK: 0.5 });
defineModel('hedge', 16, 16, 12, (V) => {
  V.box(0, 0, 0, 16, 16, 5, 'stone');
  V.paint((x, y, z, xi, yi, zi) => (zi % 2 === 1 && (xi + (zi >> 1) * 3) % 6 === 0) || (zi % 2 === 0 && (yi + zi * 2) % 7 === 0), 'dark');
  V.ell(8, 8, 8, 8.5, 8.5, 5, 'leaf');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && fbm(xi * 0.35, yi * 0.35, zi * 0.35, 5) < 0.42, 'green');
});

// ---------- 置き物：街 ----------
defineModel('crate', 14, 14, 12, (V) => {
  V.box(1, 1, 0, 13, 13, 12, 'wood');
  V.paint((x, y, z) => x < 2 || x > 12 || y < 2 || y > 12 || z > 11 || z < 1 || Math.abs((x - 1) - z) < 0.8, 'bark');
}, { r: 6 });
defineModel('barrel', 10, 10, 13, (V) => {
  V.cyl(5, 5, 4.4, 0, 13, 'red'); V.paint((x, y, z) => Math.abs(z - 3) < 0.6 || Math.abs(z - 10) < 0.6, 'metal');
  V.paint((x, y, z) => z > 12.4 && Math.hypot(x - 5, y - 5) < 2, 'e_yellow');
}, { r: 4 });
defineModel('car', 36, 18, 14, (V) => {
  V.box(2, 2, 2, 34, 16, 7, 'navy'); V.box(9, 3, 7, 26, 15, 12, 'navy'); V.box(10, 3.6, 7, 25, 14.4, 11.4, 'glass');
  V.paint((x, y, z) => z > 11.5 || Math.abs(x - 17.5) < 0.6, 'navy');
  for (const [x, y] of [[8, 1.5], [28, 1.5], [8, 16.5], [28, 16.5]]) V.ell(x, y, 3, 3, 1.5, 3, 'dark');
  V.box(33.4, 3.5, 4, 34, 6, 6, 'e_yellow'); V.box(33.4, 12, 4, 34, 14.5, 6, 'e_yellow'); V.box(2, 3.5, 4, 2.6, 6, 6, 'e_red'); V.box(2, 12, 4, 2.6, 14.5, 6, 'e_red');
}, { r: 9 });
defineModel('lamp', 10, 10, 34, (V) => {
  V.cyl(5, 5, 2.6, 0, 2, 'concrete'); V.cyl(5, 5, 0.9, 2, 30, 'steel'); V.seg(5, 5, 30, 9, 5, 31, 0.8, 'steel'); V.box(7.5, 4, 29, 10, 6, 30, 'e_eye');
}, { r: 3 });
defineModel('barrier', 22, 10, 10, (V) => {
  V.region([0, 22, 0, 10, 0, 10], (x, y, z) => Math.abs(y - 5) < 4.6 - z * 0.3 && x > 1 && x < 21, 'concrete');
  V.paint((x, y, z) => z > 6 && Math.floor(x / 3) % 2 === 0, 'red'); V.paint((x, y, z) => z > 6 && Math.floor(x / 3) % 2 === 1, 'white');
}, { r: 6 });
defineModel('vending', 14, 12, 22, (V) => {
  V.box(1, 1, 0, 13, 11, 22, 'red'); V.box(12.4, 2, 6, 13, 10, 19, 'glass'); V.box(12.4, 2.5, 2, 13, 6, 4, 'dark');
  V.paint((x, y, z, xi, yi, zi) => x > 12.4 && z > 7 && z < 18 && yi % 2 === 0 && zi % 3 === 0, 'e_yellow');
}, { r: 6 });
defineModel('wall_city', 16, 16, 14, (V) => {
  V.box(0, 0, 0, 16, 16, 14, 'brick');
  V.paint((x, y, z, xi, yi, zi) => zi % 3 === 2 || ((xi + yi + (zi / 3 | 0) * 4) % 8 === 0), 'concrete');
  V.box(0, 0, 13, 16, 16, 14, 'concrete');
});

// ---------- 置き物：星 ----------
defineModel('server', 14, 10, 26, (V) => {
  V.box(1, 1, 0, 13, 9, 26, 'metal'); V.box(12.4, 2, 2, 13, 8, 24, 'dark');
  V.paint((x, y, z, xi, yi, zi) => x > 12.4 && zi % 3 === 0 && hash3(xi, yi, zi, 1) < 0.6, (x, y, z, xi, yi, zi) => (hash3(xi, yi, zi, 2) < 0.5 ? 'e_green' : 'e_cyan'));
}, { r: 6 });
defineModel('pylon', 14, 14, 32, (V) => {
  V.cyl(7, 7, 6, 0, 3, 'hull'); V.cone(7, 7, 3, 7, 7, 24, 3, 1.4, 'hull'); V.ball(7, 7, 27, 3, 'e_cyan');
  V.torus(7, 7, 18, 4, 0.6, 'e_blue'); V.torus(7, 7, 10, 4.6, 0.6, 'e_blue');
}, { r: 5 });
defineModel('console', 18, 12, 14, (V) => {
  V.box(1, 2, 0, 17, 10, 8, 'hull');
  V.region([1, 17, 2, 10, 8, 14], (x, y, z) => z < 8 + (10 - y) * 0.7, 'hull');
  V.paint((x, y, z) => z > 8.6 && z < 13.6 && x > 2 && x < 16 && y > 3, 'glass');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'glass' && hash3(xi, yi, zi, 3) < 0.25, 'e_cyan');
}, { r: 7 });
defineModel('cryopod', 12, 12, 24, (V) => {
  V.cyl(6, 6, 5.4, 0, 3, 'hull'); V.cyl(6, 6, 4.4, 3, 21, 'glass'); V.cyl(6, 6, 5.4, 21, 24, 'hull');
  V.ell(6, 6, 12, 2, 2, 6, 'e_cyan');
}, { r: 5, glowK: 0.5 });
defineModel('wall_station', 16, 16, 14, (V) => {
  V.box(0, 0, 0, 16, 16, 14, 'hull');
  V.paint((x, y, z, xi, yi, zi) => xi % 8 === 0 || yi % 8 === 0 || zi % 7 === 0, 'metal');
  V.box(0, 0, 12, 16, 16, 13, 'e_blue');
});

// ---------- 置き物：虚無 ----------
defineModel('spire', 16, 16, 38, (V) => {
  V.cone(8, 8, 0, 9, 7, 38, 6, 0.4, 'obsid'); V.cone(4, 10, 0, 2, 12, 16, 3, 0.3, 'obsid');
  V.paint((x, y, z, xi, yi, zi) => hash3(xi, yi, zi, 7) < 0.04, 'e_violet');
}, { r: 6, glowK: 0.7 });
defineModel('voidcrystal', 14, 14, 24, (V) => {
  V.cone(7, 7, 4, 7, 7, 22, 3.6, 0.2, 'purp'); V.cone(7, 7, 4, 7, 7, 0, 3.6, 0.6, 'purp');
  V.paint((x, y, z, xi, yi, zi) => hash3(xi, yi, zi, 5) < 0.2, 'e_violet');
}, { r: 5 });
defineModel('wall_void', 16, 16, 14, (V) => {
  V.box(0, 0, 0, 16, 16, 14, 'obsid');
  V.paint((x, y, z, xi, yi, zi) => fbm(xi * 0.3, yi * 0.3, zi * 0.3, 2) > 0.62, 'e_violet');
});
defineModel('wall_forest', 16, 16, 14, (V) => {
  V.box(0, 0, 0, 16, 16, 7, 'stone');
  V.paint((x, y, z, xi, yi, zi) => (zi % 3 === 2) || (((xi + (zi / 3 | 0) * 5) % 8) === 0), 'dark');
  V.ell(8, 8, 10, 8.6, 8.6, 5, 'leaf');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && fbm(xi * 0.35, yi * 0.35, zi * 0.35, 5) < 0.42, 'green');
});

// ---------- 拾うもの ----------
defineModel('chest', 14, 10, 11, (V, f) => {
  V.box(1, 1, 0, 13, 9, 7, 'wood'); V.ell(7, 5, 7, 6, 4, 3.4, 'wood'); V.paint((x, y, z) => z < 7 || true, undefined);
  V.paint((x, y, z) => Math.abs(x - 3) < 0.7 || Math.abs(x - 11) < 0.7 || Math.abs(z - 7) < 0.5, 'gold');
  V.box(12.6, 4, 5, 13.4, 6, 7.4, 'e_yellow');
}, { r: 6 });
defineModel('relic', 10, 10, 12, (V) => {
  V.cyl(5, 5, 4, 0, 2, 'stone'); V.cone(5, 5, 2, 5, 5, 6, 2, 1, 'stone');
  V.ball(5, 5, 9, 2.6, 'e_violet'); V.torus(5, 5, 9, 3.6, 0.5, 'gold');
}, { r: 4 });
defineModel('fountain', 22, 22, 14, (V) => {
  V.cyl(11, 11, 10, 0, 4, 'stone'); V.cyl(11, 11, 8.4, 2.6, 4, 'glass'); V.cyl(11, 11, 2, 4, 10, 'stone'); V.cyl(11, 11, 4, 9, 10, 'stone'); V.ball(11, 11, 12, 2, 'e_cyan');
}, { r: 10 });
defineModel('altar', 18, 18, 10, (V) => {
  V.box(1, 1, 0, 17, 17, 3, 'stone'); V.box(4, 4, 3, 14, 14, 6, 'stone'); V.box(6, 6, 6, 12, 12, 7, 'gold');
  V.paint((x, y, z, xi, yi) => z < 3 && (xi + yi) % 4 === 0, 'dark');
}, { r: 8 });
defineModel('merchant', 19, 19, 35, mage('wood', 'e_yellow', 'e_fire'), { frames: 2, r: 6 });

// ---------- 世界樹（ユグドラシル） ----------
defineModel('worldtree', 56, 56, 72, (V) => {
  const c = 28;
  V.cone(c, c, 0, c, c, 44, 9, 5, 'bark');
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; V.cone(c, c, 5, c + Math.cos(a) * 24, c + Math.sin(a) * 24, 0, 4, 1.2, 'bark'); }
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; V.cone(c, c, 34, c + Math.cos(a) * 16, c + Math.sin(a) * 16, 50, 3, 1.4, 'bark'); }
  V.ell(c, c, 56, 26, 26, 12, 'leaf'); V.ell(c - 6, c + 4, 64, 16, 16, 8, 'leaf'); V.ell(c + 6, c - 6, 66, 12, 12, 6, 'leaf');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && fbm(xi * 0.2, yi * 0.2, zi * 0.2, 4) < 0.4, 'green');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'leaf' && hash3(xi, yi, zi, 8) < 0.025, (x, y, z, xi, yi, zi) => (hash3(xi, yi, zi, 9) < 0.5 ? 'e_lime' : 'e_yellow'));
  V.paint((x, y, z, xi, yi, zi, n) => n === 'bark' && z < 40 && fbm(xi * 0.3, yi * 0.3, zi * 0.1, 6) > 0.62, 'e_green');
}, { r: 20, glowK: 0.45 });
