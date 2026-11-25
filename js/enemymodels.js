// このゲームのオリジナルの魔物（20 体）とボス（4 体）、味方の召喚物。すべてボクセルを組んだスプライトスタック。x 正方向が「前」。
import { defineModel, hash3, fbm, TAU } from './stack.js';

// ================= 魔導の森 =================
// 苔玉ころがし：苔に覆われた丸い岩。転がりながら突っこむ
defineModel('mossball', 16, 16, 16, (V, f) => {
  V.ball(8, 8, 8, 7, 'stone');
  V.paint((x, y, z, xi, yi, zi) => fbm(xi * 0.3 + f * 2, yi * 0.3, zi * 0.3, 3) > 0.45, 'moss');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'moss' && hash3(xi, yi, zi, 5 + f) < 0.06, 'e_pinkL');
  V.box(14, 5, 8, 15.4, 7, 10, 'e_yellow'); V.box(14, 9, 8, 15.4, 11, 10, 'e_yellow');
  V.box(14, 6, 5, 15.4, 10, 6, 'dark');
}, { frames: 2, r: 7 });
// ランタン茸：傘の裏に灯りをともす背の高いきのこ
defineModel('lanterncap', 16, 16, 24, (V, f) => {
  V.cone(8, 8, 0, 8, 8, 14, 2.6, 1.8, 'bone');
  V.cone(8, 8, 13, 8, 8, 22, 5.4, 1, 'cap');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'cap' && z < 14.6, 'e_fire2');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'cap' && hash3(xi >> 1, yi >> 1, zi >> 1, 2) < 0.18, 'bone');
  V.seg(8, 13, 13, 8, 14, 9, 0.4, 'metal'); V.ball(8, 14, 8 + f, 1.4, 'e_fire');
  V.put(10.4, 7, 9, 'dark'); V.put(10.4, 9, 9, 'dark');
}, { frames: 2, r: 6, glowK: 0.5 });
// 枝角の亡霊鹿：半透明の体と枯れ枝の角
defineModel('antler', 24, 14, 24, (V, f) => {
  const s = f ? 1.4 : -1.4;
  V.ell(10, 7, 9, 7, 3.4, 3.4, 'glass');
  V.ell(17.5, 7, 13, 2.6, 2.2, 2.4, 'glass'); V.cone(19, 7, 12.5, 22, 7, 11.5, 1.6, 0.7, 'glass');
  for (const [lx, ly, d] of [[5, 5, 1], [5, 9, -1], [14, 5, -1], [14, 9, 1]]) V.seg(lx, ly, 7, lx + s * d, ly, 0, 0.8, 'glass');
  for (const sy of [-1, 1]) {
    V.seg(17, 7 + sy * 1.5, 15, 15, 7 + sy * 5, 21, 0.6, 'bark');
    V.seg(16, 7 + sy * 3.5, 18, 19, 7 + sy * 6, 22, 0.5, 'bark');
    V.seg(15, 7 + sy * 5, 21, 13, 7 + sy * 6.5, 24, 0.5, 'bark');
  }
  V.put(19.6, 5.6, 13.5, 'e_cyan'); V.put(19.6, 8.4, 13.5, 'e_cyan');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'glass' && hash3(xi, yi, zi, 3) < 0.08, 'e_cyan');
}, { frames: 2, r: 7, glowK: 0.9 });
// 種まき蜂：木の実の体と葉の羽
defineModel('seedwasp', 12, 12, 10, (V, f) => {
  V.ell(6, 6, 5, 3.6, 2.4, 2.4, 'wood');
  V.paint((x, y, z, xi) => xi % 2 === 0, 'gold');
  V.ball(9.6, 6, 5.4, 1.8, 'bark'); V.put(11, 5, 6, 'e_red'); V.put(11, 7, 6, 'e_red');
  V.cone(2.6, 6, 5, 0, 6, 4, 1, 0.2, 'dark');
  for (const sy of [-1, 1]) V.ell(6, 6 + sy * 4, 7 + (f ? 1.5 : 0), 2.4, 2.6, 0.6, 'leaf');
}, { frames: 2, r: 4 });
// 根の番人：切り株の体にひとつ目の灯り
defineModel('rootwarden', 20, 20, 22, (V, f) => {
  const c = 10;
  V.cone(c, c, 0, c, c, 16, 7, 6, 'bark');
  V.paint((x, y, z) => z > 15, 'wood');
  V.paint((x, y, z, xi, yi) => z > 15.2 && (Math.floor(Math.hypot(x - c, y - c)) % 2 === 0), 'bark');
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; V.cone(c, c, 2, c + Math.cos(a) * 10, c + Math.sin(a) * 10, 0, 2, 0.6, 'bark'); }
  for (const s of [-1, 1]) V.seg(c, c + s * 6, 12, c + 6 + f * 2, c + s * 9, 5, 1.4, 'bark');
  V.ball(c + 6.4, c, 10, 2, 'e_lime'); V.ball(c + 7.2, c, 10, 0.8, 'dark');
  V.ell(c, c, 17, 5, 5, 3, 'moss');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'moss' && hash3(xi, yi, zi, 7) < 0.1, 'e_pinkL');
}, { frames: 2, r: 9 });
// ボス：喰花の女王（巨大な食虫花）
defineModel('flowerqueen', 48, 48, 40, (V, f) => {
  const c = 24;
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; V.cone(c + Math.cos(a) * 4, c + Math.sin(a) * 4, 1, c + Math.cos(a) * 22, c + Math.sin(a) * 22, 0, 3, 1, 'leaf'); }
  V.cone(c, c, 0, c, c, 14, 7, 5, 'green');
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * TAU + (f ? 0.1 : 0);
    V.ell(c + Math.cos(a) * 11, c + Math.sin(a) * 11, 20 + Math.sin(a * 2) * 2, 9, 9, 3, 'cap');
  }
  V.paint((x, y, z, xi, yi, zi, n) => n === 'cap' && hash3(xi >> 1, yi >> 1, zi >> 1, 4) < 0.2, 'bone');
  V.cyl(c, c, 8, 18, 26, 'dark');
  V.cyl(c, c, 6.5, 22, 27, '');
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; V.cone(c + Math.cos(a) * 7, c + Math.sin(a) * 7, 24, c + Math.cos(a) * 5, c + Math.sin(a) * 5, 28, 0.8, 0.2, 'bone'); }
  V.cone(c, c, 18, c, c, 34 + f * 2, 2.2, 0.8, 'gold'); V.ball(c, c, 35 + f * 2, 2, 'e_yellow');
  for (const s of [-1, 1]) { V.seg(c, c + s * 9, 16, c + 14, c + s * 18, 24 + f * 3, 1.6, 'green'); V.ball(c + 14, c + s * 18, 24 + f * 3, 2.4, 'cap'); }
}, { frames: 2, r: 18, glowK: 0.7 });

// ================= 鋼鉄の街 =================
// 暴走配達ロボ：段ボールの体に車輪、点滅する警告灯（自爆）
defineModel('courier', 14, 14, 14, (V, f) => {
  V.box(2, 2, 3, 12, 12, 11, 'wood'); V.paint((x, y, z) => z > 10.4 || Math.abs(x - 7) < 0.6, 'orange');
  V.box(2, 6, 7, 2.4, 8, 9, 'white');
  for (const [x, y] of [[3, 1.5], [11, 1.5], [3, 12.5], [11, 12.5]]) V.ell(x, y, 2, 1.8, 1, 1.8, 'dark');
  V.seg(7, 7, 11, 7, 7, 14, 0.4, 'metal'); V.ball(7, 7, 13.6, 1, f ? 'e_red' : 'e_yellow');
  V.box(12, 4, 6, 12.6, 6, 8, 'e_cyan'); V.box(12, 8, 6, 12.6, 10, 8, 'e_cyan');
}, { frames: 2, r: 6 });
// 監視カメラ蜘蛛：赤いレンズの頭に細い 4 本脚
defineModel('camspider', 18, 18, 16, (V, f) => {
  const c = 9;
  V.box(c - 4, c - 3, 8, c + 4, c + 3, 13, 'concrete'); V.box(c + 4, c - 2.4, 9, c + 6, c + 2.4, 12, 'dark');
  V.ball(c + 6, c, 10.5, 1.4, 'e_red');
  V.seg(c - 2, c, 13, c - 3, c, 16, 0.4, 'metal'); V.put(c - 3, c, 15, f ? 'e_green' : 'dark');
  for (const [dx, dy, k] of [[1, 1, 0], [1, -1, 1], [-1, 1, 1], [-1, -1, 0]]) { const sw = (k + f) % 2 ? 1.2 : -1.2; V.seg(c + dx * 2, c + dy * 2, 9, c + dx * 6 + sw, c + dy * 7, 6, 0.6, 'metal'); V.seg(c + dx * 6 + sw, c + dy * 7, 6, c + dx * 7 + sw, c + dy * 8, 0, 0.6, 'metal'); }
}, { frames: 2, r: 7 });
// 消火栓の暴れ者：赤い消火栓に太い腕
defineModel('hydrant', 18, 18, 22, (V, f) => {
  const c = 9;
  V.cyl(c, c, 5, 0, 2, 'red'); V.cyl(c, c, 4, 2, 15, 'red'); V.ell(c, c, 15, 4, 4, 3, 'red'); V.cyl(c, c, 1.4, 17, 20, 'gold'); V.box(c - 1.6, c - 1.6, 19.4, c + 1.6, c + 1.6, 20.4, 'gold');
  for (const s of [-1, 1]) { V.seg(c, c + s * 4, 11, c + 4, c + s * 7, 6 + f * 3, 1.8, 'red'); V.ball(c + 4, c + s * 7, 6 + f * 3, 2.4, 'gold'); }
  V.cyl(c + 4, c, 1.6, 7, 9, 'gold'); V.box(c + 3.6, c - 2, 12, c + 4.2, c - 0.6, 13, 'e_yellow'); V.box(c + 3.6, c + 0.6, 12, c + 4.2, c + 2, 13, 'e_yellow');
  V.paint((x, y, z) => Math.abs(z - 5) < 0.5 || Math.abs(z - 11) < 0.5, 'white');
}, { frames: 2, r: 8 });
// 信号機の亡霊：三色の目がうつろう信号機
defineModel('signal', 12, 12, 30, (V, f) => {
  V.cyl(6, 6, 3, 0, 2, 'concrete'); V.cyl(6, 6, 0.9, 2, 18, 'steel');
  V.box(3.5, 3.5, 17, 8.5, 8.5, 30, 'dark');
  const lit = ['e_red', 'e_yellow', 'e_green'][f % 3];
  [['red', 27], ['yellow', 23.5], ['green', 20]].forEach(([c, z], i) => V.ell(8.6, 6, z, 0.6, 1.4, 1.4, i === f % 3 ? lit : 'metal'));
  for (const s of [-1, 1]) V.seg(6, 6 + s * 2, 14, 7, 6 + s * 6, 10 + (f % 2) * 3, 0.6, 'steel');
}, { frames: 3, r: 5, glowK: 1 });
// 自販機ミミック：歯の生えた自動販売機
defineModel('vendmimic', 18, 16, 24, (V, f) => {
  V.box(2, 2, 3, 15, 14, 24, 'navy');
  V.box(14.4, 3, 12, 15, 13, 22, 'glass');
  V.paint((x, y, z, xi, yi, zi) => x > 14.4 && z > 12 && zi % 3 === 0 && yi % 2 === 0, 'e_cyan');
  const open = f ? 3 : 1;
  V.box(14.4, 3, 6 - open / 2, 15.2, 13, 6 + open / 2, '');
  for (let y = 3.5; y < 13; y += 1.6) { V.put(14.6, y, 6 + open / 2, 'white'); V.put(14.6, y + 0.8, 6 - open / 2, 'white'); }
  V.put(14.6, 4, 9, 'e_red'); V.put(14.6, 12, 9, 'e_red');
  for (const [lx, ly] of [[4, 4], [4, 12], [13, 4], [13, 12]]) V.seg(lx, ly, 3, lx + (f ? 1 : -1), ly, 0, 0.8, 'metal');
}, { frames: 2, r: 8 });
// ボス：解体重機キメラ（ショベルの腕を持つ重機）
defineModel('excavator', 52, 40, 36, (V, f) => {
  V.box(4, 3, 0, 44, 11, 7, 'dark'); V.box(4, 29, 0, 44, 37, 7, 'dark');
  V.paint((x, y, z, xi) => (xi + f) % 3 === 0 && z > 5, 'metal');
  V.box(8, 9, 6, 40, 31, 15, 'gold');
  V.box(10, 12, 15, 28, 28, 27, 'gold'); V.box(24, 13, 18, 29, 21, 26, 'glass');
  V.paint((x, y, z) => (z > 8 && z < 10) && x > 8, 'dark');
  for (const sx of [12, 16]) V.cyl(sx, 26, 1.4, 27, 33, 'metal');
  V.seg(28, 26, 22, 40, 26, 34 - f * 3, 2.4, 'gold'); V.seg(40, 26, 34 - f * 3, 50, 26, 18 - f * 5, 2, 'gold');
  for (let k = 0; k < 4; k++) V.cone(50, 23 + k * 2, 18 - f * 5, 52, 23 + k * 2, 12 - f * 5, 0.9, 0.3, 'steel');
  V.box(29, 10, 14, 31, 12, 16, 'e_red'); V.box(29, 28, 14, 31, 30, 16, 'e_red');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'gold' && fbm(xi * 0.2, yi * 0.2, zi * 0.2, 8) > 0.62, 'orange');
}, { frames: 2, r: 18 });

// ================= 星界ステーション =================
// 眼球衛星：大きな目に太陽電池の翼
defineModel('eyesat', 24, 12, 12, (V, f) => {
  V.ball(11, 6, 6, 4.4, 'white');
  V.paint((x) => x > 14, 'navy'); V.paint((x, y, z) => x > 15 && Math.hypot(y - 6, z - 6) < 1.8, 'e_cyan'); V.paint((x, y, z) => x > 15.2 && Math.hypot(y - 6, z - 6) < 0.8, 'dark');
  for (const s of [-1, 1]) { V.seg(11, 6, 6, 11 + s * 6, 6, 6, 0.4, 'metal'); V.box(11 + s * 6 - (s > 0 ? 0 : 5), 1, 5, 11 + s * 6 + (s > 0 ? 5 : 0), 11, 7, 'glass'); }
  V.paint((x, y, z, xi, yi, zi, n) => n === 'glass' && (xi + yi) % 3 === 0, 'navy');
  V.seg(9, 6, 9, 8, 6, 12, 0.3, 'metal'); V.put(8, 6, 11.5, f ? 'e_red' : 'dark');
}, { frames: 2, r: 5 });
// 結晶ナメクジ：背中に水晶の棘
defineModel('crystalslug', 24, 12, 12, (V, f) => {
  V.ell(11, 6, 3, 10 - f, 4, 3, 'slime');
  V.ell(19 - f, 6, 4.4, 3, 3, 3, 'slime');
  for (const s of [-1, 1]) { V.seg(20 - f, 6 + s, 6.5, 22 - f, 6 + s * 2.4, 9, 0.4, 'slime'); V.put(22 - f, 6 + s * 2.4, 9.2, 'e_cyan'); }
  for (let k = 0; k < 5; k++) { const x = 5 + k * 3; V.cone(x, 6, 4, x - 1, 6 + (k % 2 ? 1 : -1), 9 + (k % 3), 1.4, 0.2, 'cryst'); }
  V.paint((x, y, z, xi, yi, zi, n) => n === 'cryst' && hash3(xi, yi, zi, 9) < 0.15, 'e_cyan');
}, { frames: 2, r: 6 });
// ポッド寄生体：小さなカプセルに触手
defineModel('podling', 10, 10, 10, (V, f) => {
  V.ell(5, 5, 6, 2.6, 2.6, 3, 'hull'); V.box(6.8, 4, 6, 7.8, 6, 8, 'e_lime');
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + f * 0.4; V.seg(5, 5, 4, 5 + Math.cos(a) * 4, 5 + Math.sin(a) * 4, 0, 0.5, 'green'); }
}, { frames: 2, r: 4 });
// 鏡面騎士：鏡の鎧と鏡の盾
defineModel('mirrorknight', 18, 18, 28, (V, f) => {
  const c = 9;
  V.box(c - 2.6, c - 3, 0, c + 1.4, c - 1, 9, 'steel'); V.box(c - 2.6, c + 1, 0, c + 1.4, c + 3, 9, 'steel');
  V.box(c - 3, c - 4, 9, c + 2.6, c + 4, 18, 'white');
  V.ball(c, c, 21, 3, 'white'); V.box(c + 2.4, c - 2, 20.5, c + 3.2, c + 2, 21.5, 'e_cyan');
  V.cone(c - 1, c, 23.5, c - 4, c, 27, 1, 0.3, 'e_violet');
  V.box(c + 4, c - 6, 4, c + 5, c + 4, 18, 'glass'); V.paint((x, y, z, xi, yi, zi, n) => n === 'glass' && (yi + zi) % 4 === 0, 'white');
  V.seg(c, c + 4.5, 15, c + 6, c + 6, 9 + f * 4, 0.7, 'e_white');
}, { frames: 2, r: 6, glowK: 0.7 });
// 重力クラゲ：紫に光る傘と垂れる触手
defineModel('gravjelly', 18, 18, 20, (V, f) => {
  const c = 9;
  V.ell(c, c, 14, 7, 7, 4.4, 'purp'); V.paint((x, y, z) => z < 13, '');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'purp' && z > 16 && Math.floor((Math.atan2(y - c, x - c) + Math.PI) / (TAU / 16)) % 2 === 0, 'pink');
  V.ball(c, c, 14, 2.4, 'e_violet');
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; const r = 4.6; V.seg(c + Math.cos(a) * r, c + Math.sin(a) * r, 12, c + Math.cos(a + f * 0.3) * (r + 1), c + Math.sin(a + f * 0.3) * (r + 1), 3 + (k % 3), 0.4, 'e_pinkL'); }
}, { frames: 2, r: 7, glowK: 0.8 });
// ボス：銀河鯨（装甲の宇宙クジラ）
defineModel('starwhale', 60, 34, 26, (V, f) => {
  const cy = 17;
  V.ell(30, cy, 12, 24, 11, 9, 'navy');
  V.ell(46, cy, 11, 10, 9, 7, 'navy');
  V.paint((x, y, z) => z < 8, 'hull');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'navy' && z > 17 && (xi % 6 === 0 || Math.abs(y - cy) < 0.6), 'metal');
  V.paint((x, y, z, xi, yi, zi, n) => (n === 'navy' || n === 'hull') && Math.abs(z - 9) < 0.6 && x > 10, 'e_cyan');
  for (const s of [-1, 1]) V.cone(32, cy + s * 9, 9, 26, cy + s * 18, 6 + f * 2, 3, 1, 'navy');
  V.cone(8, cy, 12, 0, cy, 14, 4, 1.4, 'navy'); V.box(0, cy - 8, 13 + f * 2, 4, cy + 8, 15 + f * 2, 'navy');
  V.ball(52, cy - 6, 14, 1.4, 'e_yellow'); V.ball(52, cy + 6, 14, 1.4, 'e_yellow');
  for (let k = 0; k < 6; k++) V.ball(20 + k * 4, cy, 21, 1, k % 2 ? 'e_cyan' : 'glass');
}, { frames: 2, r: 20, glowK: 0.35 });

// ================= 虚無の果て =================
// 欠けた月の仮面
defineModel('moonmask', 10, 18, 18, (V, f) => {
  V.region([0, 10, 0, 18, 0, 18], (x, y, z) => { const d = Math.hypot(y - 9, z - 9), d2 = Math.hypot(y - 12, z - 11); return d < 8 && d2 > 6.4 && Math.abs(x - 5 - (d < 4 ? 1 : 0)) < 1.4; }, 'bone');
  V.paint((x, y, z) => Math.hypot(y - 6, z - 11) < 1.2 && x > 5, 'e_violet');
  V.paint((x, y, z) => Math.hypot(y - 7, z - 6) < 0.9 && x > 5, 'dark');
  V.ball(3, 9, 9, 2, f ? 'e_violet' : 'void');
}, { frames: 2, r: 6, glowK: 0.8 });
// 影の綿毛
defineModel('fluff', 12, 12, 12, (V, f) => {
  V.ball(6, 6, 6, 4.2, 'void');
  V.paint((x, y, z, xi, yi, zi) => hash3(xi, yi, zi, 3 + f) < 0.35, 'obsid');
  V.all((x, y, z, xi, yi, zi) => { const d = Math.hypot(x - 6, y - 6, z - 6); return d > 4 && d < 5.6 && hash3(xi, yi, zi, 8 + f) < 0.18; }, 'void');
  V.put(9.6, 5, 7, 'e_white'); V.put(9.6, 7, 7, 'e_white');
}, { frames: 2, r: 5 });
// 逆さ塔：先が下を向いて浮く塔と、目の輪
defineModel('invspire', 16, 16, 28, (V, f) => {
  V.cone(8, 8, 4, 8, 8, 26, 0.4, 5, 'obsid');
  V.cyl(8, 8, 6, 26, 28, 'obsid');
  V.torus(8, 8, 14, 7, 0.6, 'e_violet');
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + f * 0.4; V.ball(8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, 14, 1.2, 'bone'); V.put(8 + Math.cos(a) * 7.8, 8 + Math.sin(a) * 7.8, 14, 'dark'); }
  V.paint((x, y, z, xi, yi, zi, n) => n === 'obsid' && hash3(xi, yi, zi, 4) < 0.05, 'e_violet');
}, { frames: 2, r: 6 });
// 虚ろの手：指で這う巨大な白い手
defineModel('hollowhand', 20, 18, 12, (V, f) => {
  V.ell(8, 9, 6, 6, 6, 2.6, 'bone');
  for (let k = 0; k < 4; k++) { const y = 3.6 + k * 3.6, up = (k + f) % 2 ? 2 : 0; V.seg(12, y, 6, 16, y, 7 + up, 1.1, 'bone'); V.seg(16, y, 7 + up, 19, y, 0, 1, 'bone'); }
  V.seg(7, 15, 6, 10, 17.5, 3, 1.1, 'bone');
  V.seg(4, 9, 6, 0, 9, 5, 2.4, 'void');
  V.ball(8, 9, 8.4, 1.6, 'e_violet'); V.put(8.8, 9, 8.8, 'dark');
}, { frames: 2, r: 8 });
// 時計仕掛けの亡者：頭が時計のローブ姿
defineModel('clockrev', 18, 18, 28, (V, f) => {
  const c = 9;
  V.cone(c, c, 0, c, c, 17, 6, 3, 'void');
  V.paint((x, y, z, xi, yi, zi) => z < 3 && hash3(xi, yi, 0, 2) < 0.4, '');
  V.cyl(c, c, 4.6, 18, 21, 'gold'); V.ell(c, c, 22, 4.4, 4.4, 4, 'gold');
  V.paint((x, y, z) => x > c + 3 && z > 18, 'white');
  V.seg(c + 4.4, c, 22, c + 4.4, c + (f ? 2.4 : 0), 22 + (f ? 0 : 2.6), 0.3, 'dark');
  V.torus(c, c, 10, 5, 0.6, 'gold');
  for (const s of [-1, 1]) V.seg(c, c + s * 3, 15, c + 5, c + s * 6, 10 + f, 1, 'void');
}, { frames: 2, r: 6 });
// ボス：名無しの王（顔のない王と浮かぶ冠）
defineModel('nameless', 36, 36, 58, (V, f) => {
  const c = 18;
  V.cone(c, c, 0, c, c, 34, 12, 6, 'void');
  V.paint((x, y, z, xi, yi, zi) => z < 4 && hash3(xi, yi, 0, 3 + f) < 0.35, '');
  V.paint((x, y, z, xi, yi, zi, n) => n === 'void' && Math.abs(Math.atan2(y - c, x - c)) < 0.25 && z < 30, 'gold');
  V.box(c - 6, c - 8, 26, c + 6, c + 8, 34, 'obsid');
  V.ball(c, c, 39, 5, 'white'); V.paint((x, y, z) => x > c + 3.5 && z > 36 && z < 42, 'dark');
  V.torus(c, c, 47 + f, 4.4, 0.8, 'gold');
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; V.cone(c + Math.cos(a) * 4.4, c + Math.sin(a) * 4.4, 47 + f, c + Math.cos(a) * 4.6, c + Math.sin(a) * 4.6, 51 + f, 0.8, 0.2, 'gold'); }
  V.torus(c, c, 30, 15, 0.6, 'e_violet');
  for (const s of [-1, 1]) { V.seg(c, c + s * 8, 32, c + 9, c + s * 14, 22 + f * 3, 2, 'void'); V.ball(c + 9, c + s * 14, 22 + f * 3, 2.4, 'e_violet'); }
}, { frames: 2, r: 14 });

// ================= 味方 =================
defineModel('k9', 18, 12, 14, (V, f) => {
  const s = f ? 1.3 : -1.3;
  V.ell(8, 6, 7, 6, 3.2, 3, 'navy'); V.ell(14.5, 6, 9, 2.6, 2.4, 2.4, 'navy'); V.cone(16, 6, 8.6, 18, 6, 8, 1.4, 0.8, 'navy');
  for (const sy of [-1, 1]) V.cone(14, 6 + sy * 1.4, 11, 13.4, 6 + sy * 1.8, 13.4, 0.8, 0.2, 'navy');
  for (const [lx, ly, d] of [[4, 4, 1], [4, 8, -1], [12, 4, -1], [12, 8, 1]]) V.seg(lx, ly, 5, lx + s * d, ly, 0, 0.9, 'dark');
  V.box(6, 4.6, 9.6, 10, 7.4, 10.4, f ? 'e_red' : 'e_blue'); V.put(15.6, 6, 10, 'e_yellow');
  V.cone(2, 6, 8, -1, 6, 11, 1, 0.4, 'navy');
}, { frames: 2, r: 5 });
defineModel('allyturret', 14, 14, 14, (V) => {
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; V.seg(7, 7, 6, 7 + Math.cos(a) * 6, 7 + Math.sin(a) * 6, 0, 0.6, 'metal'); }
  V.ball(7, 7, 8, 3, 'hull'); V.seg(7, 7, 8.5, 14, 7, 8.5, 1, 'steel'); V.put(13, 7, 8, 'e_cyan'); V.box(5, 5, 10.6, 9, 9, 11.4, 'e_cyan');
}, { r: 5 });
defineModel('doll', 10, 10, 16, (V) => {
  V.cone(5, 5, 0, 5, 5, 10, 2.4, 1.6, 'gold'); V.ball(5, 5, 12, 2.4, 'gold');
  for (const s of [-1, 1]) V.seg(5, 5, 8, 5, 5 + s * 4.6, 7, 0.7, 'gold');
  V.paint((x, y, z, xi, yi, zi) => zi % 2 === 0, 'wood');
  V.seg(4, 6, 12, 9, 6, 12, 0.3, 'metal'); V.put(7.4, 5, 12.6, 'dark');
}, { r: 4 });
// 暴走トラック（アルティメット用）
defineModel('bigtruck', 48, 22, 22, (V, f) => {
  V.box(2, 2, 3, 34, 20, 20, 'white'); V.paint((x, y, z) => Math.abs(z - 12) < 2, 'red');
  V.box(34, 3, 3, 46, 19, 15, 'red'); V.box(40, 4, 10, 45.6, 18, 14.6, 'glass');
  V.box(45.4, 4, 4, 46, 7, 6, 'e_yellow'); V.box(45.4, 15, 4, 46, 18, 6, 'e_yellow');
  for (const x of [8, 18, 28, 40]) for (const y of [1.5, 20.5]) V.ell(x, y, 3, 3.2, 1.4, 3.2, (f + x) % 2 ? 'dark' : 'metal');
  V.box(33.6, 2, 3, 34.4, 20, 18, 'metal');
}, { frames: 2, r: 12 });
