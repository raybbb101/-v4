// 魔法の一覧。どの魔法も Lv1〜10 まで育ち、Lv で段階が変わる（形も名前も変わる）。
//   Lv1-2 初級 / Lv3-5 中級 / Lv6-9 上級 / Lv10 アルティメット
// kind（ふるまい）: bolt 弾 / nova 自分のまわり / strike 地点に落ちる / chain 連鎖 / beam 光線 / cone 前方に放射 /
//   zone 場に残る / orbit まわりを回る / summon 呼び出す / buff 自分を強化 / dash 瞬間移動 / mine 罠 / ult 専用の大技
export const TIER_NAMES = ['初級', '中級', '上級', 'アルティメット'];
export const TIER_COLORS = ['#9ad0ff', '#7dff8a', '#ffc23d', '#ff5ad8'];
export const MAX_LV = 10;
export const tierOf = (lv) => (lv >= 10 ? 3 : lv >= 6 ? 2 : lv >= 3 ? 1 : 0);
export const SCHOOLS = { fantasy: 'ファンタジー', real: '現代', future: '未来' };

const S = (k, dur, chance = 1, pow = 1) => ({ k, dur, chance, pow });

export const SPELLS = [
  // ===================== ファンタジー =====================
  { id: 'fire', name: '火炎', school: 'fantasy', glyph: '炎', color: '#ff8a2a', tiers: [
    { name: '火の玉', desc: '燃える火球を撃つ。当たると燃やす。', kind: 'bolt', cd: 0.9, dmg: 16, spd: 230, fx: 'fireball', hit: 'smallBoom', st: S('burn', 2.5, 0.5) },
    { name: '爆炎弾', desc: '着弾で爆発する火球。', kind: 'bolt', cd: 1.0, dmg: 20, spd: 230, fx: 'fireball', boom: 34, boomFx: 'smallBoom', st: S('burn', 3, 0.7) },
    { name: '紅蓮三連弾', desc: '爆ぜる火球を扇状に 3 発。', kind: 'bolt', cd: 1.05, dmg: 22, spd: 250, n: 3, spread: 0.5, fx: 'fireball', boom: 40, boomFx: 'smallBoom', st: S('burn', 3, 0.8) },
    { name: '紅蓮の抱擁', en: 'Crimson Wrap', desc: '真紅の炎が画面中の敵に巻きつき、締め上げてから一斉に爆ぜる。', kind: 'ult', ult: 'crimson', cd: 9, dmg: 60 },
  ] },
  { id: 'ice', name: '氷結', school: 'fantasy', glyph: '氷', color: '#62c8f4', tiers: [
    { name: '氷の矢', desc: '貫く氷の矢。当たると遅くする。', kind: 'bolt', cd: 0.8, dmg: 13, spd: 300, pierce: 1, fx: 'iceLance', hit: 'iceHit', st: S('slow', 2) },
    { name: '氷槍', desc: '2 体貫き、ときどき凍らせる。', kind: 'bolt', cd: 0.85, dmg: 18, spd: 320, pierce: 2, fx: 'iceLance', hit: 'iceHit', st: S('freeze', 1.2, 0.3) },
    { name: '氷槍乱舞', desc: '氷槍を 5 本ばらまく。', kind: 'bolt', cd: 1.0, dmg: 20, spd: 330, n: 5, spread: 0.9, pierce: 2, fx: 'iceLance', hit: 'iceHit', st: S('freeze', 1.4, 0.35) },
    { name: '絶対零度', en: 'Absolute Zero', desc: '世界の熱を奪う。全ての敵を凍らせ、氷の棘で砕く。', kind: 'ult', ult: 'abszero', cd: 10, dmg: 55 },
  ] },
  { id: 'thunder', name: '雷鳴', school: 'fantasy', glyph: '雷', color: '#ffe26b', tiers: [
    { name: '雷撃', desc: '近くの敵に雷。2 体に跳ねる。', kind: 'chain', cd: 1.0, dmg: 15, jumps: 2, range: 150, st: S('stun', 0.3, 0.3) },
    { name: '連鎖雷', desc: '5 体に跳ねる。', kind: 'chain', cd: 1.0, dmg: 18, jumps: 5, range: 170, st: S('stun', 0.4, 0.35) },
    { name: '雷霆', desc: '8 体に跳ね、しびれさせる。', kind: 'chain', cd: 1.1, dmg: 22, jumps: 8, range: 190, st: S('stun', 0.6, 0.5) },
    { name: '神鳴り', desc: '天から 12 本の雷が降る。', kind: 'strike', cd: 7, dmg: 70, rad: 34, n: 12, interval: 0.12, target: 'random', fx: 'lightningStrike', st: S('stun', 1.2) },
  ] },
  { id: 'holy', name: '聖光', school: 'fantasy', glyph: '聖', color: '#fff0a0', tiers: [
    { name: '聖なる裁き', desc: '敵の頭上に光の一撃。', kind: 'strike', cd: 1.6, dmg: 30, rad: 30, delay: 0.25, fx: 'smite' },
    { name: '光の柱', desc: '太い光の柱が立つ。', kind: 'strike', cd: 1.7, dmg: 40, rad: 44, delay: 0.3, fx: 'holyPillar' },
    { name: '審判の光', desc: '3 か所に光の柱。', kind: 'strike', cd: 2, dmg: 44, rad: 44, n: 3, interval: 0.18, delay: 0.3, fx: 'holyPillar' },
    { name: '天使の審判', desc: '光輪が広がり、敵を焼き味方を癒す。', kind: 'nova', cd: 8, dmg: 90, rad: 190, fx: 'sunburstUlt', heal: 30, knock: 120 },
  ] },
  { id: 'dark', name: '闇', school: 'fantasy', glyph: '闇', color: '#a868f0', tiers: [
    { name: '影の手', desc: '地面から手が伸び、敵をつかんで止める。', kind: 'zone', cd: 2.2, dmg: 8, rad: 34, dur: 2, tick: 0.4, fx: 'graspingHands', st: S('root', 1) , at: 'target' },
    { name: '影の触手', desc: '触手が広く敵を締める。', kind: 'zone', cd: 2.4, dmg: 11, rad: 50, dur: 2.6, tick: 0.35, fx: 'shadowTendrils', st: S('root', 1), at: 'target' },
    { name: '呪縛の刻印', desc: '呪いで受けるダメージを 1.5 倍に。', kind: 'zone', cd: 2.6, dmg: 14, rad: 60, dur: 3, tick: 0.35, fx: 'hexSigil', st: S('curse', 4), at: 'target' },
    { name: '虚無の門', desc: '黒い穴が全てを吸い込む。', kind: 'zone', cd: 8, dmg: 26, rad: 120, dur: 4.5, tick: 0.25, pull: 140, fx: 'blackHole', at: 'target', st: S('curse', 3) },
  ] },
  { id: 'nature', name: '大樹', school: 'fantasy', glyph: '樹', color: '#7ee84c', tiers: [
    { name: '茨の棘', desc: '前方に茨が走る。', kind: 'strike', cd: 1.4, dmg: 22, rad: 30, n: 3, line: 34, fx: 'thorns', st: S('slow', 1.5) },
    { name: '大地の棘', desc: '岩の棘が一列に突き出る。', kind: 'strike', cd: 1.5, dmg: 28, rad: 32, n: 5, line: 34, interval: 0.07, fx: 'earthSpike', st: S('root', 0.6, 0.5) },
    { name: '森の怒り', desc: '木の葉の嵐が自分のまわりを裂く。', kind: 'zone', cd: 3, dmg: 12, rad: 70, dur: 3, tick: 0.25, fx: 'leafStorm', at: 'follow' },
    { name: '世界樹ユグドラシル', en: 'Yggdrasil', desc: '世界樹が芽吹く。根が敵を貫き、味方の命を満たす。', kind: 'ult', ult: 'yggdrasil', cd: 11, dmg: 50 },
  ] },
  { id: 'water', name: '水流', school: 'fantasy', glyph: '水', color: '#62c8f4', tiers: [
    { name: '水泡弾', desc: '重い水の玉。押し返す。', kind: 'bolt', cd: 1.0, dmg: 16, spd: 200, fx: 'waterOrb', hit: 'splash', knock: 90, size: 0.5 },
    { name: '激流', desc: '前に大波を起こす。', kind: 'cone', cd: 1.8, dmg: 26, range: 110, arc: 0.9, dur: 0.01, fx: 'waveCrash', knock: 160 },
    { name: '渦潮', desc: '渦が敵を引き寄せる。', kind: 'zone', cd: 2.6, dmg: 12, rad: 60, dur: 3, tick: 0.3, pull: 80, fx: 'whirlpool', at: 'target', st: S('slow', 1) },
    { name: '妖精の潮', en: 'Fairy Tide', desc: '妖精たちが光る潮を連れてくる。波が何度も押し寄せ、敵を洗い流す。', kind: 'ult', ult: 'fairytide', cd: 10, dmg: 45 },
  ] },
  { id: 'arcane', name: '秘術', school: 'fantasy', glyph: '秘', color: '#c684ff', tiers: [
    { name: '魔法の矢', desc: '追いかける光の矢 2 本。', kind: 'bolt', cd: 1.0, dmg: 10, spd: 210, n: 2, spread: 1.2, home: 5, fx: 'arcaneDart', hit: 'manaPop' },
    { name: '魔弾連射', desc: '追尾弾 4 本。', kind: 'bolt', cd: 1.0, dmg: 12, spd: 230, n: 4, spread: 1.8, home: 6, fx: 'arcaneDart', hit: 'manaPop' },
    { name: '秘術の奔流', desc: '貫く紫の光線。', kind: 'beam', cd: 1.6, dmg: 34, len: 260, w: 12, fx: 'arcaneBeam' },
    { name: '星降りの夜', desc: '夜空から星が 16 個降る。', kind: 'strike', cd: 7, dmg: 50, rad: 30, n: 16, interval: 0.09, target: 'random', fx: 'starFall' },
  ] },
  { id: 'heal', name: '癒し', school: 'fantasy', glyph: '癒', color: '#a8f0a0', tiers: [
    { name: '癒しの光', desc: '自分を回復する。', kind: 'buff', cd: 6, heal: 18, fx: 'heal' },
    { name: '癒しの花', desc: 'まわりの味方も回復。', kind: 'buff', cd: 6, heal: 24, allies: 160, fx: 'healingBloom' },
    { name: '祝福', desc: '回復して、しばらく与えるダメージ +25%。', kind: 'buff', cd: 7, heal: 26, allies: 200, dmgUp: 0.25, dur: 6, fx: 'blessing' },
    { name: '生命の奇跡', desc: '全員を全回復し、倒れた仲間を起こす。', kind: 'buff', cd: 20, heal: 999, allies: 9999, revive: true, dmgUp: 0.3, dur: 8, fx: 'resurrection' },
  ] },
  { id: 'flamering', name: '炎環', school: 'fantasy', glyph: '環', color: '#ff5a2a', tiers: [
    { name: '炎の輪', desc: '自分のまわりに炎の輪。', kind: 'nova', cd: 2.2, dmg: 22, rad: 70, fx: 'fireRing', st: S('burn', 2, 0.6) },
    { name: '炎の衛星', desc: '火の玉が 3 つ自分を回る。', kind: 'orbit', cd: 5, dmg: 12, n: 3, rad: 34, dur: 4, fx: 'fireball', st: S('burn', 2, 0.5) },
    { name: '炎陣', desc: '足元に燃える陣。ついてくる。', kind: 'zone', cd: 4, dmg: 10, rad: 64, dur: 4, tick: 0.25, fx: 'fireField', at: 'follow', st: S('burn', 2, 0.4) },
    { name: '氷炎反転', en: 'Frost to Inferno', desc: '一瞬で全てを凍らせ、次の瞬間その氷が業火に反転して爆ぜる。', kind: 'ult', ult: 'frostinferno', cd: 10, dmg: 50 },
  ] },
  { id: 'soul', name: '魂喰い', school: 'fantasy', glyph: '魂', color: '#ff6ab0', tiers: [
    { name: '魂吸い', desc: '敵の命を吸って回復する光線。', kind: 'beam', cd: 1.8, dmg: 22, len: 150, w: 10, fx: 'soulDrain', lifesteal: 0.3 },
    { name: '生命吸収', desc: 'まとめて吸い取る。', kind: 'beam', cd: 1.8, dmg: 30, len: 180, w: 16, fx: 'soulDrain', lifesteal: 0.35 },
    { name: '死霊の行進', desc: '骸骨の魂が 4 つ周りを回る。', kind: 'orbit', cd: 5, dmg: 18, n: 4, rad: 42, dur: 5, fx: 'skullOrb', lifesteal: 0.1 },
    { name: '冥府の門', desc: '闇の爆発。倒した数だけ回復。', kind: 'nova', cd: 8, dmg: 110, rad: 170, fx: 'darkExplosion', lifesteal: 0.15 },
  ] },
  { id: 'time', name: '時の魔法', school: 'fantasy', glyph: '時', color: '#f2d27a', tiers: [
    { name: '時の遅延', desc: 'まわりの敵の時間を遅くする。', kind: 'nova', cd: 4, dmg: 6, rad: 100, fx: 'timeRing', st: S('slow', 3) },
    { name: '時の牢獄', desc: 'まわりの敵を止める。', kind: 'nova', cd: 5, dmg: 10, rad: 110, fx: 'timeRing', st: S('stun', 1.6) },
    { name: '時間加速', desc: '自分の時間を早める。速さと詠唱 +30%。', kind: 'buff', cd: 9, haste: 0.3, cdr: 0.3, dur: 5, fx: 'haste' },
    { name: '時間停止', desc: '時計の針が止まる。全ての敵と弾が 4 秒止まる。', kind: 'ult', ult: 'timestop', cd: 14, dmg: 10 },
  ] },
  { id: 'earth', name: '大地', school: 'fantasy', glyph: '岩', color: '#c8a070', tiers: [
    { name: '岩石弾', desc: '重い岩を投げる。押し返す。', kind: 'bolt', cd: 1.2, dmg: 24, spd: 180, fx: 'rock', hit: 'bluntHit', knock: 140, size: 6 },
    { name: '地震', desc: 'まわりを揺らして止める。', kind: 'nova', cd: 3, dmg: 30, rad: 100, fx: 'quake', st: S('stun', 0.7) },
    { name: '岩槍', desc: '前方に大きな岩の棘。', kind: 'strike', cd: 1.6, dmg: 42, rad: 36, n: 6, line: 30, interval: 0.05, fx: 'earthSpike' },
    { name: '大地崩壊', desc: '大地が裂け、巨岩の雨が降る。', kind: 'strike', cd: 8, dmg: 80, rad: 46, n: 9, interval: 0.15, target: 'random', fx: 'groundSlam', st: S('stun', 1) },
  ] },
  { id: 'wind', name: '疾風', school: 'fantasy', glyph: '風', color: '#b8f0d8', tiers: [
    { name: '風の刃', desc: '速く貫く風の刃。', kind: 'bolt', cd: 0.6, dmg: 9, spd: 380, pierce: 3, fx: 'windBlade', hit: 'hitSpark' },
    { name: '旋風', desc: '小さな竜巻が進む。', kind: 'zone', cd: 2.4, dmg: 9, rad: 36, dur: 3, tick: 0.2, fx: 'tornado', at: 'self', move: 90, pull: 40 },
    { name: '鎌鼬', desc: '風の刃を 7 方向に。', kind: 'bolt', cd: 0.8, dmg: 12, spd: 400, n: 7, spread: 6.28, pierce: 4, fx: 'windBlade', hit: 'hitSpark' },
    { name: '桜嵐', desc: '花びらの刃の大竜巻。', kind: 'zone', cd: 7, dmg: 18, rad: 110, dur: 5, tick: 0.15, fx: 'sakura', at: 'follow', pull: 30 },
  ] },
  { id: 'spirit', name: '霊剣', school: 'fantasy', glyph: '剣', color: '#d0e0ff', tiers: [
    { name: '霊剣', desc: '光の剣 2 本が周りを回る。', kind: 'orbit', cd: 4, dmg: 12, n: 2, rad: 30, dur: 4, fx: 'swordOrb' },
    { name: '双霊剣', desc: '剣 4 本。', kind: 'orbit', cd: 4, dmg: 14, n: 4, rad: 36, dur: 4.5, fx: 'swordOrb' },
    { name: '剣舞', desc: '剣 6 本が広く回る。', kind: 'orbit', cd: 4, dmg: 16, n: 6, rad: 46, dur: 5, fx: 'swordOrb' },
    { name: '神剣召喚', desc: '巨大な光の剣を突き立てる。', kind: 'strike', cd: 6, dmg: 200, rad: 80, delay: 0.5, fx: 'holyBlade', st: S('stun', 1.5) },
  ] },
  { id: 'bow', name: '光弓', school: 'fantasy', glyph: '弓', color: '#ffd23c', tiers: [
    { name: '光の矢', desc: 'まっすぐ速い矢。', kind: 'bolt', cd: 0.55, dmg: 11, spd: 420, fx: 'arrow', hit: 'hitSpark' },
    { name: '三連矢', desc: '3 本同時に射る。', kind: 'bolt', cd: 0.6, dmg: 12, spd: 440, n: 3, spread: 0.3, pierce: 1, fx: 'arrow', hit: 'hitSpark' },
    { name: '天弓', desc: '空へ放った矢が 6 本降り注ぐ。', kind: 'strike', cd: 1.4, dmg: 26, rad: 22, n: 6, interval: 0.06, target: 'random', fx: 'arrowRain' },
    { name: '射日・九陽落とし', en: 'Hou Yi Shoots Down the Suns', desc: '空に九つの太陽。弓で射落とし、落ちた太陽が敵を焼き尽くす。', kind: 'ult', ult: 'houyi', cd: 12, dmg: 70 },
  ] },

  // ===================== 現代 =====================
  { id: 'gun', name: '銃撃', school: 'real', glyph: '銃', color: '#ffb84a', tiers: [
    { name: '拳銃', desc: '素早い弾。', kind: 'bolt', cd: 0.4, dmg: 8, spd: 520, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: '二丁拳銃', desc: '2 発ずつ撃つ。', kind: 'bolt', cd: 0.4, dmg: 9, spd: 540, n: 2, spread: 0.12, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: 'ショットガン', desc: '散弾 7 発。近いほど痛い。', kind: 'bolt', cd: 0.9, dmg: 9, spd: 480, n: 7, spread: 0.7, life: 0.4, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzleShotgun', knock: 40 },
    { name: 'ガトリング掃射', desc: '3 秒間、弾の嵐。', kind: 'cone', cd: 7, dmg: 12, range: 240, arc: 0.5, dur: 3, tick: 0.05, fx: 'gatling', bullets: true },
  ] },
  { id: 'grenade', name: '爆弾', school: 'real', glyph: '爆', color: '#ff6a3a', tiers: [
    { name: '手榴弾', desc: '投げて少しして爆発。', kind: 'strike', cd: 1.8, dmg: 36, rad: 46, delay: 0.7, fx: 'grenadeBoom', lob: true },
    { name: '破片手榴弾', desc: '爆発が大きい。', kind: 'strike', cd: 1.8, dmg: 46, rad: 60, delay: 0.7, fx: 'grenadeBoom', lob: true },
    { name: 'クラスター爆弾', desc: '親爆弾から 6 つの子爆弾。', kind: 'strike', cd: 2.4, dmg: 34, rad: 44, n: 7, scatter: 60, interval: 0.07, delay: 0.7, fx: 'grenadeBoom', lob: true },
    { name: '絨毯爆撃', desc: '爆撃機が一直線に爆弾を落とす。', kind: 'strike', cd: 8, dmg: 90, rad: 60, n: 12, line: 40, interval: 0.1, delay: 0.6, fx: 'bigBoom' },
  ] },
  { id: 'flamer', name: '火炎放射', school: 'real', glyph: '焼', color: '#ff7a2a', tiers: [
    { name: '火炎放射器', desc: '前方を焼き続ける。', kind: 'cone', cd: 3, dmg: 6, range: 90, arc: 0.5, dur: 1.5, tick: 0.1, fx: 'flamethrower', st: S('burn', 2, 0.3) },
    { name: '高火力放射', desc: '長く、遠くまで焼く。', kind: 'cone', cd: 3, dmg: 8, range: 120, arc: 0.55, dur: 2, tick: 0.1, fx: 'flamethrower', st: S('burn', 3, 0.4) },
    { name: '火炎旋回', desc: '回りながら焼く。', kind: 'cone', cd: 3.4, dmg: 10, range: 120, arc: 0.6, dur: 2.2, tick: 0.08, fx: 'flamethrower', spin: 4, st: S('burn', 3, 0.5) },
    { name: 'ナパーム', desc: '一帯を火の海にする。', kind: 'zone', cd: 8, dmg: 22, rad: 140, dur: 5, tick: 0.2, fx: 'napalm', at: 'target', st: S('burn', 3) },
  ] },
  { id: 'rocket', name: 'ミサイル', school: 'real', glyph: '弾', color: '#d8d8e8', tiers: [
    { name: 'ロケット弾', desc: '大きく爆ぜるロケット。', kind: 'bolt', cd: 1.6, dmg: 30, spd: 260, fx: 'rocket', boom: 50, boomFx: 'smallBoom' },
    { name: '誘導ミサイル', desc: '敵を追う。', kind: 'bolt', cd: 1.6, dmg: 34, spd: 240, home: 4, fx: 'rocket', boom: 52, boomFx: 'smallBoom' },
    { name: '多弾頭ミサイル', desc: '誘導ミサイル 4 発。', kind: 'bolt', cd: 2, dmg: 30, spd: 230, n: 4, spread: 1.6, home: 5, fx: 'rocket', boom: 46, boomFx: 'smallBoom' },
    { name: '戦略核', desc: '警告の後、すべてを焼き払うきのこ雲。', kind: 'strike', cd: 16, dmg: 600, rad: 400, delay: 1.6, fx: 'nuke', target: 'center', st: S('burn', 4) },
  ] },
  { id: 'smoke', name: '煙幕', school: 'real', glyph: '煙', color: '#a8a0b8', tiers: [
    { name: '煙幕弾', desc: '煙の中の敵は遅くなり、弾が当たりにくい。', kind: 'zone', cd: 4, dmg: 3, rad: 60, dur: 4, tick: 0.5, fx: 'smokeBomb', at: 'self', st: S('slow', 1), cover: true },
    { name: '催涙ガス', desc: '煙が敵を混乱させる。', kind: 'zone', cd: 4, dmg: 6, rad: 70, dur: 4, tick: 0.4, fx: 'smokeBomb', at: 'target', st: S('confuse', 1.5, 0.6) },
    { name: '毒ガス', desc: '毒の雲。', kind: 'zone', cd: 4, dmg: 9, rad: 80, dur: 5, tick: 0.3, fx: 'poisonCloud', at: 'target', st: S('poison', 4, 1, 1) },
    { name: '閃光の嵐', desc: '閃光弾の連続。全ての敵を眩ませる。', kind: 'nova', cd: 9, dmg: 60, rad: 400, fx: 'flashbang', st: S('stun', 2.5) },
  ] },
  { id: 'mine', name: '地雷', school: 'real', glyph: '罠', color: '#e8c050', tiers: [
    { name: '地雷', desc: '足元に地雷を置く。', kind: 'mine', cd: 2, dmg: 40, rad: 44, n: 1 },
    { name: '地雷原', desc: '3 つまき散らす。', kind: 'mine', cd: 2.4, dmg: 44, rad: 46, n: 3, scatter: 50 },
    { name: '指向性地雷', desc: '5 つ、爆発も大きい。', kind: 'mine', cd: 2.6, dmg: 52, rad: 56, n: 5, scatter: 70 },
    { name: 'ドラム缶爆破', desc: '自分のまわりに爆薬の輪。', kind: 'strike', cd: 7, dmg: 120, rad: 60, n: 8, ring: 90, interval: 0.06, delay: 0.4, fx: 'barrelBoom' },
  ] },
  { id: 'taser', name: '電撃銃', school: 'real', glyph: '電', color: '#78b8ff', tiers: [
    { name: 'スタンガン', desc: '近くの敵をしびれさせる。', kind: 'chain', cd: 1.1, dmg: 10, jumps: 1, range: 90, st: S('stun', 0.8), pal: 'volt' },
    { name: 'テーザー網', desc: '3 体をしびれさせる。', kind: 'chain', cd: 1.2, dmg: 13, jumps: 3, range: 120, st: S('stun', 1), pal: 'volt' },
    { name: '高圧電流', desc: '6 体、強くしびれさせる。', kind: 'chain', cd: 1.3, dmg: 17, jumps: 6, range: 150, st: S('stun', 1.2), pal: 'volt' },
    { name: '落雷誘導塔', desc: '雷を呼ぶ塔を建てる。', kind: 'summon', cd: 9, type: 'tesla', n: 1, dur: 8, dmg: 40, rate: 0.3, range: 200 },
  ] },
  { id: 'cannon', name: '大砲', school: 'real', glyph: '砲', color: '#b0a8c0', tiers: [
    { name: '砲弾', desc: '重く遅い弾。大きく押し返す。', kind: 'bolt', cd: 1.6, dmg: 36, spd: 170, pierce: 2, fx: 'cannonball', hit: 'bluntHit', knock: 200, size: 5 },
    { name: '炸裂弾', desc: '当たると爆ぜる。', kind: 'bolt', cd: 1.6, dmg: 40, spd: 180, fx: 'cannonball', boom: 56, boomFx: 'dirtBoom', knock: 160, size: 5 },
    { name: '三連砲', desc: '炸裂弾を 3 発。', kind: 'bolt', cd: 1.9, dmg: 40, spd: 190, n: 3, spread: 0.45, fx: 'cannonball', boom: 56, boomFx: 'dirtBoom', size: 5 },
    { name: '艦砲射撃', desc: '遠くの艦が砲弾を降らせる。', kind: 'strike', cd: 8, dmg: 110, rad: 56, n: 10, interval: 0.16, target: 'random', delay: 0.6, fx: 'dirtBoom' },
  ] },
  { id: 'hose', name: '放水', school: 'real', glyph: '放', color: '#5ab0ff', tiers: [
    { name: '高圧放水', desc: '水で押し流す。', kind: 'cone', cd: 2.6, dmg: 4, range: 130, arc: 0.25, dur: 1.4, tick: 0.1, fx: 'waterJet', knock: 50 },
    { name: '放水砲', desc: '太く強い水流。', kind: 'cone', cd: 2.6, dmg: 6, range: 160, arc: 0.3, dur: 1.8, tick: 0.1, fx: 'waterJet', knock: 70, st: S('slow', 1) },
    { name: '間欠泉', desc: '敵の足元から水柱。', kind: 'strike', cd: 1.8, dmg: 34, rad: 34, n: 3, target: 'random', interval: 0.15, fx: 'geyser', knock: 60 },
    { name: '消防ヘリ', desc: '空から大量の水。全ての敵を押し流し、遅くする。', kind: 'nova', cd: 8, dmg: 80, rad: 400, fx: 'downpour', knock: 200, st: S('slow', 3) },
  ] },

  // ===================== 未来 =====================
  { id: 'laser', name: 'レーザー', school: 'future', glyph: '光', color: '#ff3a6a', tiers: [
    { name: 'レーザー弾', desc: '速い光の弾。', kind: 'bolt', cd: 0.45, dmg: 9, spd: 560, fx: 'laser', hit: 'zap', pal: 'laserRed' },
    { name: '連射レーザー', desc: '3 連射。', kind: 'bolt', cd: 0.7, dmg: 10, spd: 580, n: 3, burst: 0.07, fx: 'laser', hit: 'zap', pal: 'laserRed' },
    { name: '貫通光線', desc: '全てを貫く光線。', kind: 'beam', cd: 1.4, dmg: 40, len: 320, w: 8, fx: 'laserBeam' },
    { name: '衛星軌道砲', desc: '宇宙から極太の光が降り、なぞった跡を焼く。', kind: 'strike', cd: 9, dmg: 160, rad: 60, n: 5, line: 50, interval: 0.2, delay: 1, fx: 'orbital' },
  ] },
  { id: 'plasma', name: 'プラズマ', school: 'future', glyph: '球', color: '#7ff6ff', tiers: [
    { name: 'プラズマ弾', desc: '小さく爆ぜる弾。', kind: 'bolt', cd: 0.9, dmg: 16, spd: 280, fx: 'plasma', boom: 28, boomFx: 'plasmaBoom' },
    { name: 'プラズマ爆発', desc: '大きく爆ぜる。', kind: 'bolt', cd: 1.1, dmg: 24, spd: 280, fx: 'plasma', boom: 50, boomFx: 'plasmaBoom' },
    { name: 'プラズマ球', desc: 'ゆっくり進み、触れた敵を焼き続ける球。', kind: 'zone', cd: 3, dmg: 10, rad: 40, dur: 4, tick: 0.15, fx: 'plasmaBall', at: 'self', move: 60 },
    { name: '恒星崩壊', desc: '小さな星が潰れ、大爆発。', kind: 'strike', cd: 9, dmg: 220, rad: 140, delay: 1.2, fx: 'starCollapse', target: 'dense' },
  ] },
  { id: 'drone', name: 'ドローン', school: 'future', glyph: '機', color: '#9ad8ff', tiers: [
    { name: '攻撃ドローン', desc: 'レーザーを撃つドローン 1 機。', kind: 'summon', cd: 10, type: 'drone', n: 1, dur: 9, dmg: 8, rate: 0.6, range: 200 },
    { name: 'ドローン編隊', desc: '2 機。', kind: 'summon', cd: 10, type: 'drone', n: 2, dur: 9, dmg: 10, rate: 0.5, range: 220 },
    { name: '強襲ドローン', desc: '3 機、ミサイルも撃つ。', kind: 'summon', cd: 10, type: 'drone', n: 3, dur: 10, dmg: 12, rate: 0.45, range: 240, missile: true },
    { name: '機動要塞', desc: '巨大な要塞ドローンが全方位に撃つ。', kind: 'summon', cd: 14, type: 'fortress', n: 1, dur: 10, dmg: 16, rate: 0.12, range: 300 },
  ] },
  { id: 'emp', name: 'EMP', school: 'future', glyph: '波', color: '#ff5ad8', tiers: [
    { name: 'EMPパルス', desc: 'まわりの敵を止め、弾を消す。', kind: 'nova', cd: 4, dmg: 14, rad: 70, fx: 'emp', st: S('stun', 0.8), clearBullets: true },
    { name: '拡大EMP', desc: '範囲が広い。', kind: 'nova', cd: 4, dmg: 18, rad: 110, fx: 'emp', st: S('stun', 1), clearBullets: true },
    { name: '連鎖EMP', desc: '3 回続けて広がる。', kind: 'nova', cd: 5, dmg: 18, rad: 120, n: 3, interval: 0.35, fx: 'emp', st: S('stun', 1), clearBullets: true },
    { name: 'オーバードライブ', en: 'Overdrive', desc: '限界を超える。詠唱がほぼ止まらず、体から電撃があふれる。', kind: 'ult', ult: 'overdrive', cd: 18, dmg: 20 },
  ] },
  { id: 'shield', name: '力場', school: 'future', glyph: '盾', color: '#7fd8ff', tiers: [
    { name: '力場シールド', desc: '一定量のダメージを防ぐ。', kind: 'buff', cd: 8, shield: 25, fx: 'forceField' },
    { name: '反射フィールド', desc: '防ぎ、近くの弾をはね返す。', kind: 'buff', cd: 8, shield: 35, reflect: 3, fx: 'forceField' },
    { name: '拡張力場', desc: '味方全員にシールド。', kind: 'buff', cd: 9, shield: 45, allies: 9999, reflect: 3, fx: 'forceField' },
    { name: '絶対防壁', desc: '3 秒間無敵。触れた敵を焼く。', kind: 'buff', cd: 16, invuln: 3, shield: 60, aura: 30, auraRad: 50, dur: 3, fx: 'divineShield' },
  ] },
  { id: 'disc', name: '回転刃', school: 'future', glyph: '刃', color: '#7fffd0', tiers: [
    { name: 'エナジーディスク', desc: '戻ってくる刃。', kind: 'bolt', cd: 1.1, dmg: 14, spd: 300, pierce: 99, boomerang: 0.55, fx: 'disc', hit: 'hitSpark' },
    { name: '双刃', desc: '2 枚。', kind: 'bolt', cd: 1.1, dmg: 16, spd: 300, n: 2, spread: 0.4, pierce: 99, boomerang: 0.55, fx: 'disc', hit: 'hitSpark' },
    { name: '四方刃', desc: '4 方向に。', kind: 'bolt', cd: 1.2, dmg: 18, spd: 320, n: 4, spread: 4.71, pierce: 99, boomerang: 0.6, fx: 'disc', hit: 'hitSpark' },
    { name: '回転刃の嵐', desc: '8 枚の刃がまわりを高速で回る。', kind: 'orbit', cd: 8, dmg: 24, n: 8, rad: 60, dur: 6, fx: 'disc', spin: 5 },
  ] },
  { id: 'warp', name: 'ワープ', school: 'future', glyph: '跳', color: '#c69bff', tiers: [
    { name: '短距離ワープ', desc: '向いた方へ瞬間移動。出た所で衝撃。', kind: 'dash', cd: 3, dist: 90, dmg: 18, rad: 40 },
    { name: '位相ワープ', desc: '通った道の敵も切る。', kind: 'dash', cd: 2.8, dist: 110, dmg: 24, rad: 46, trail: true },
    { name: '連続ワープ', desc: 'より遠く、より強く。', kind: 'dash', cd: 2.4, dist: 130, dmg: 30, rad: 52, trail: true },
    { name: '次元断裂', desc: 'ワープの跡に裂け目。敵を吸って弾ける。', kind: 'dash', cd: 6, dist: 150, dmg: 90, rad: 100, trail: true, rift: true },
  ] },
  { id: 'gravity', name: '重力', school: 'future', glyph: '重', color: '#8a5aff', tiers: [
    { name: '重力弾', desc: '当たると周りを引き寄せる弾。', kind: 'bolt', cd: 1.4, dmg: 16, spd: 200, fx: 'voidOrb', boom: 50, boomFx: 'implosion', pull: true },
    { name: '重力井戸', desc: '敵を集める井戸。', kind: 'zone', cd: 3, dmg: 6, rad: 80, dur: 3, tick: 0.3, pull: 110, fx: 'gravWell', at: 'target' },
    { name: '特異点', desc: '強く吸い、最後に潰す。', kind: 'zone', cd: 4, dmg: 10, rad: 100, dur: 3, tick: 0.25, pull: 150, fx: 'gravWell', at: 'target', endBoom: 60 },
    { name: '特異点ノヴァ', en: 'Singularity Nova', desc: '星を一点に押し潰し、光の超新星として解き放つ。', kind: 'ult', ult: 'singularity', cd: 12, dmg: 80 },
  ] },
  { id: 'holo', name: 'ホログラム', school: 'future', glyph: '幻', color: '#7ff6ff', tiers: [
    { name: 'おとり', desc: '敵の気を引く分身を置く。', kind: 'summon', cd: 8, type: 'decoy', n: 1, dur: 5, dmg: 0 },
    { name: '爆ぜるおとり', desc: '消えるときに爆発する。', kind: 'summon', cd: 8, type: 'decoy', n: 1, dur: 5, boom: 60, dmg: 50 },
    { name: '分身', desc: '2 体の分身が魔弾を撃つ。', kind: 'summon', cd: 9, type: 'decoy', n: 2, dur: 6, boom: 60, dmg: 50, shoot: 10 },
    { name: '分身軍団', desc: '分身 5 体が一斉に戦う。', kind: 'summon', cd: 14, type: 'decoy', n: 5, dur: 8, boom: 70, dmg: 70, shoot: 14 },
  ] },
  { id: 'nano', name: 'ナノ', school: 'future', glyph: '粒', color: '#d8ff5a', tiers: [
    { name: 'ナノ修復', desc: '少しずつ回復する。', kind: 'buff', cd: 8, regen: 3, dur: 6, fx: 'scanner' },
    { name: 'ナノ群体', desc: '機械の群れがまわりの敵をかじる。', kind: 'zone', cd: 5, dmg: 7, rad: 60, dur: 5, tick: 0.2, fx: 'nanoCloud', at: 'follow' },
    { name: '侵食ナノ', desc: '群れが広がり、敵を腐食（毒）させる。', kind: 'zone', cd: 5, dmg: 9, rad: 80, dur: 6, tick: 0.2, fx: 'nanoCloud', at: 'follow', st: S('poison', 3, 0.3, 1) },
    { name: 'グレイ・グー', desc: '群れが画面を覆い、全ての敵を分解する。', kind: 'nova', cd: 10, dmg: 40, rad: 400, n: 4, interval: 0.5, fx: 'disintegrate', st: S('poison', 5, 1, 2) },
  ] },
];

export const SPELL = Object.fromEntries(SPELLS.map((s) => [s.id, s]));

/** 基本攻撃（クリック／自動）: 魔弾 */
export const BASIC = { name: '魔弾', kind: 'bolt', cd: 0.32, dmg: 7, spd: 360, fx: 'magicBolt', hit: 'manaPop' };

/** その Lv の能力（数値は Lv で伸びる） */
export function spellAt(id, lv) {
  const sp = SPELL[id], t = sp.tiers[tierOf(lv)], inTier = lv - [1, 3, 6, 10][tierOf(lv)];
  const mul = 1 + 0.14 * (lv - 1) + 0.06 * inTier;
  return { ...t, id, lv, tier: tierOf(lv), dmg: (t.dmg || 0) * mul, cd: t.cd * Math.max(0.6, 1 - 0.02 * (lv - 1)), color: sp.color, school: sp.school };
}

// ---------- 秘宝（パッシブ） ----------
export const RELICS = [
  { id: 'sage', name: '賢者の石', glyph: '石', desc: '魔法のダメージ +20%', mod: { power: 0.2 } },
  { id: 'boots', name: '疾風の靴', glyph: '靴', desc: '移動速度 +15%', mod: { speed: 0.15 } },
  { id: 'sand', name: '時の砂', glyph: '砂', desc: '詠唱の待ち時間 -12%', mod: { cdr: 0.12 } },
  { id: 'giant', name: '巨人の指輪', glyph: '巨', desc: '範囲 +20%', mod: { area: 0.2 } },
  { id: 'fang', name: '吸血の牙', glyph: '牙', desc: '与えたダメージの 2% を回復', mod: { lifesteal: 0.02 } },
  { id: 'star', name: '星のかけら', glyph: '星', desc: '会心率 +10%（会心は 2 倍）', mod: { crit: 0.1 } },
  { id: 'heart', name: '鉄の心臓', glyph: '心', desc: '最大 HP +30', mod: { maxHp: 30 } },
  { id: 'leaf', name: '再生の葉', glyph: '葉', desc: '毎秒 HP を 1 回復', mod: { regen: 1 } },
  { id: 'mirror', name: '双子の鏡', glyph: '鏡', desc: '弾の数 +1', mod: { extra: 1 } },
  { id: 'magnet', name: '磁石', glyph: '磁', desc: '拾える距離 +60%', mod: { pickup: 0.6 } },
  { id: 'coin', name: '幸運の金貨', glyph: '運', desc: '選べるカード +1、金貨 +30%', mod: { luck: 1, gold: 0.3 } },
  { id: 'phoenix', name: '不死鳥の羽', glyph: '羽', desc: '一度だけ倒れても HP 半分で起き上がる', mod: { revive: 1 } },
  { id: 'storm', name: '雷の指輪', glyph: '轟', desc: '当てると 12% で小さな雷が跳ねる', mod: { procShock: 0.12 } },
  { id: 'frost', name: '霜の指輪', glyph: '霜', desc: '当てると 15% で遅くする', mod: { procSlow: 0.15 } },
  { id: 'ember', name: '熾火の指輪', glyph: '熾', desc: '当てると 15% で燃やす', mod: { procBurn: 0.15 } },
  { id: 'aegis', name: '守護の紋章', glyph: '護', desc: '10 秒ごとに 15 のシールド', mod: { aegis: 15 } },
  { id: 'berserk', name: '狂戦士の仮面', glyph: '狂', desc: 'HP が半分以下でダメージ +40%', mod: { berserk: 0.4 } },
  { id: 'engine', name: '魔導エンジン', glyph: '機', desc: '呼び出したものが強く長くなる +50%', mod: { summon: 0.5 } },
  { id: 'belt', name: '弾帯', glyph: '帯', desc: '弾が 1 体多く貫く', mod: { pierce: 1 } },
  { id: 'cloak', name: '影の外套', glyph: '套', desc: '回避の無敵が長く、回避の待ちが短い', mod: { dodge: 0.5 } },
  { id: 'scope', name: '照準器', glyph: '照', desc: '弾の速さ +30%、会心 +5%', mod: { shotSpd: 0.3, crit: 0.05 } },
  { id: 'crown', name: '魔王の冠', glyph: '冠', desc: 'アルティメットの待ち -30%', mod: { ultCdr: 0.3 } },
  { id: 'thorn', name: '茨の鎧', glyph: '茨', desc: '受けたダメージ -15%、触れた敵に反撃', mod: { armor: 0.15, thorns: 8 } },
  { id: 'focus', name: '集中の数珠', glyph: '珠', desc: '基本の魔弾が 2 発になり強くなる', mod: { basic: 1 } },
];
export const RELIC = Object.fromEntries(RELICS.map((r) => [r.id, r]));

// ---------- 永続強化（魔石で買う） ----------
export const META = [
  { id: 'hp', name: '生命の器', desc: '最大 HP +10', max: 5, cost: (l) => 20 + l * 20 },
  { id: 'pow', name: '魔力の泉', desc: 'ダメージ +5%', max: 5, cost: (l) => 25 + l * 25 },
  { id: 'spd', name: '風の加護', desc: '移動速度 +4%', max: 5, cost: (l) => 15 + l * 15 },
  { id: 'reroll', name: '運命の糸', desc: '引き直し +1', max: 3, cost: (l) => 30 + l * 30 },
  { id: 'start', name: '見習いの知恵', desc: '最初の魔法が Lv+1', max: 2, cost: (l) => 60 + l * 60 },
  { id: 'gold', name: '黄金の手', desc: '金貨 +10%', max: 5, cost: (l) => 15 + l * 15 },
];
