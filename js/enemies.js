// 魔物とボス、そして 4 つの世界（バイオーム）
export const BIOMES = [
  { id: 'forest', name: '魔導の森', sub: 'ファンタジーの層', wall: 'wall_forest', props: ['tree', 'tree', 'pine', 'rock', 'bigshroom', 'ruin', 'crystal'],
    enemies: ['slime', 'slime', 'mushroom', 'wolf', 'wisp', 'golem'], boss: 'treant', weather: 'fireflies',
    floor: { base: '#1c2a1e', a: '#22351f', b: '#2c4426', line: '#16221a', accent: '#5a7e3c', glow: '#9ad86a' }, bullet: '#c8f070', bgm: 0 },
  { id: 'city', name: '鋼鉄の街', sub: '現代の層', wall: 'wall_city', props: ['crate', 'crate', 'barrel', 'car', 'lamp', 'barrier', 'vending'],
    enemies: ['drone', 'robodog', 'soldier', 'bomber', 'turret', 'drone'], boss: 'tank', weather: 'rain',
    floor: { base: '#1c1c24', a: '#22222c', b: '#2a2a36', line: '#e8c050', accent: '#3e3e48', glow: '#ffb84a' }, bullet: '#ffb84a', bgm: 1 },
  { id: 'station', name: '星界ステーション', sub: '未来の層', wall: 'wall_station', props: ['server', 'pylon', 'console', 'cryopod', 'server'],
    enemies: ['knight', 'cannon', 'nano', 'nano', 'gravorb', 'spider'], boss: 'mech', weather: 'stars',
    floor: { base: '#141a2c', a: '#18203a', b: '#1e2848', line: '#3b5cff', accent: '#45507a', glow: '#7ff6ff' }, bullet: '#7ff6ff', bgm: 2 },
  { id: 'void', name: '虚無の果て', sub: '最終層', wall: 'wall_void', props: ['spire', 'voidcrystal', 'spire', 'ruin'],
    enemies: ['voideye', 'shade', 'shade', 'wisp', 'gravorb', 'knight', 'golem'], boss: 'voidlord', weather: 'fog',
    floor: { base: '#0e0a16', a: '#140c20', b: '#1c1028', line: '#8a5aff', accent: '#341648', glow: '#c69bff' }, bullet: '#d27de6', bgm: 3 },
];
export const ROOMS_PER_BIOME = 6;

// ai: chase / shooter / charger / exploder / slammer / turret / teleporter / orbiter / swarm / puller
export const ENEMIES = {
  slime: { name: 'スライム', model: 'slime', hp: 26, spd: 52, dmg: 9, ai: 'chase', xp: 2, hop: true },
  mushroom: { name: '胞子茸', model: 'mushroom', hp: 30, spd: 34, dmg: 8, ai: 'shooter', xp: 3, range: 190, shot: { rate: 2.4, n: 3, spread: 0.5, spd: 105, r: 3 } },
  wolf: { name: '影狼', model: 'wolf', hp: 38, spd: 72, dmg: 12, ai: 'charger', xp: 3, charge: { spd: 270, dur: 0.45, cd: 3 } },
  wisp: { name: '鬼火', model: 'wisp', hp: 18, spd: 80, dmg: 7, ai: 'orbiter', xp: 2, fly: 10, shot: { rate: 1.8, n: 1, spd: 150, r: 3 } },
  golem: { name: '苔の石兵', model: 'golem', hp: 150, spd: 28, dmg: 18, ai: 'slammer', xp: 8, slam: { rad: 54, cd: 3.6 }, heavy: true },
  drone: { name: '警備ドローン', model: 'drone', hp: 22, spd: 70, dmg: 7, ai: 'shooter', xp: 2, fly: 12, range: 170, shot: { rate: 1.5, n: 2, burst: 0.12, spd: 170, r: 2.5 } },
  robodog: { name: '暴走ロボ犬', model: 'robodog', hp: 36, spd: 76, dmg: 12, ai: 'charger', xp: 3, charge: { spd: 300, dur: 0.4, cd: 2.6 } },
  soldier: { name: '装甲兵', model: 'soldier', hp: 90, spd: 36, dmg: 10, ai: 'shooter', xp: 6, range: 160, armor: 0.35, shot: { rate: 2.6, n: 5, spread: 0.4, spd: 140, r: 3 }, heavy: true },
  bomber: { name: '自爆ボット', model: 'bomber', hp: 20, spd: 90, dmg: 26, ai: 'exploder', xp: 2 },
  turret: { name: '自動砲台', model: 'turret', hp: 70, spd: 0, dmg: 8, ai: 'turret', xp: 5, shot: { rate: 0.14, spd: 120, r: 3 }, heavy: true },
  knight: { name: 'ホロ騎士', model: 'knight', hp: 60, spd: 50, dmg: 14, ai: 'teleporter', xp: 5, shot: { rate: 3, n: 5, spread: 0.6, spd: 160, r: 3 } },
  cannon: { name: 'プラズマ砲台', model: 'cannon', hp: 80, spd: 0, dmg: 16, ai: 'shooter', xp: 5, range: 260, shot: { rate: 2.6, n: 1, spd: 120, r: 6, boom: 40 }, heavy: true },
  nano: { name: 'ナノ虫', model: 'nano', hp: 9, spd: 95, dmg: 5, ai: 'swarm', xp: 1, group: 4 },
  gravorb: { name: '重力球', model: 'gravorb', hp: 70, spd: 26, dmg: 10, ai: 'puller', xp: 5, fly: 8, shot: { rate: 3.2, n: 10, spread: 6.28, spd: 110, r: 3 } },
  spider: { name: '機械蜘蛛', model: 'spider', hp: 48, spd: 64, dmg: 12, ai: 'charger', xp: 4, charge: { spd: 250, dur: 0.5, cd: 3.2 }, web: true },
  voideye: { name: '虚ろの眼', model: 'voideye', hp: 55, spd: 30, dmg: 10, ai: 'shooter', xp: 5, fly: 10, range: 220, shot: { rate: 2.2, n: 12, spread: 6.28, spd: 100, r: 3 } },
  shade: { name: '影法師', model: 'shade', hp: 46, spd: 66, dmg: 13, ai: 'teleporter', xp: 4, shot: { rate: 2.6, n: 3, spread: 0.3, spd: 170, r: 3 } },
};

// ボス：pattern を順に使う。phase2 は HP 半分から（速く・増える）
export const BOSSES = {
  treant: { name: '古樹の守護者', title: '森の主', model: 'treant', hp: 1500, spd: 22, dmg: 18, r: 18, patterns: ['rootLines', 'sporeRing', 'slam', 'summon', 'sporeRing'], summon: 'slime', col: '#9ad86a' },
  tank: { name: '鋼鉄の重戦車', title: '街の主', model: 'tank', hp: 2600, spd: 34, dmg: 20, r: 18, patterns: ['spray', 'missiles', 'charge', 'summon', 'spray'], summon: 'drone', col: '#ffb84a' },
  mech: { name: '星喰いの機神', title: '星の主', model: 'mech', hp: 3800, spd: 30, dmg: 22, r: 18, patterns: ['laserLines', 'spiral', 'orbital', 'summon', 'spiral'], summon: 'nano', col: '#7ff6ff' },
  voidlord: { name: '虚無の魔王', title: '終わりの主', model: 'voidlord', hp: 6000, spd: 34, dmg: 26, r: 15, patterns: ['blackholes', 'teleRing', 'novaLines', 'spiral', 'summon', 'laserLines'], summon: 'shade', col: '#c69bff' },
};

export const DIFFS = [
  { id: 'easy', name: 'やさしい', hp: 0.7, dmg: 0.55, desc: '魔法を楽しみたい人に' },
  { id: 'normal', name: 'ふつう', hp: 1, dmg: 1, desc: 'おすすめ' },
  { id: 'hard', name: 'むずかしい', hp: 1.5, dmg: 1.4, desc: '魔石 +50%' },
  { id: 'maou', name: '魔王', hp: 2.3, dmg: 2, desc: '魔石 2 倍。覚悟して' },
];
