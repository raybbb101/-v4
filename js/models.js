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

// 敵のモデルは enemymodels.js

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

import './enemymodels.js';
