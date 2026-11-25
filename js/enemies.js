// 魔物とボス、そして 4 つの世界（バイオーム）
export const BIOMES = [
  { id: 'forest', name: '魔導の森', sub: 'ファンタジーの層', wall: 'wall_forest', props: ['tree', 'tree', 'pine', 'rock', 'bigshroom', 'ruin', 'crystal'],
    enemies: ['mossball', 'lanterncap', 'antler', 'seedwasp', 'rootwarden', 'mossball'], boss: 'flowerqueen', weather: 'fireflies',
    floor: { base: '#1c2a1e', a: '#22351f', b: '#2c4426', line: '#16221a', accent: '#5a7e3c', glow: '#9ad86a' }, bullet: '#c8f070', bgm: 0 },
  { id: 'city', name: '鋼鉄の街', sub: '現代の層', wall: 'wall_city', props: ['crate', 'crate', 'barrel', 'car', 'lamp', 'barrier', 'vending'],
    enemies: ['courier', 'camspider', 'hydrant', 'signal', 'vendmimic', 'camspider'], boss: 'excavator', weather: 'rain',
    floor: { base: '#1c1c24', a: '#22222c', b: '#2a2a36', line: '#e8c050', accent: '#3e3e48', glow: '#ffb84a' }, bullet: '#ffb84a', bgm: 1 },
  { id: 'station', name: '星界ステーション', sub: '未来の層', wall: 'wall_station', props: ['server', 'pylon', 'console', 'cryopod', 'server'],
    enemies: ['eyesat', 'crystalslug', 'podling', 'mirrorknight', 'gravjelly', 'eyesat'], boss: 'starwhale', weather: 'stars',
    floor: { base: '#141a2c', a: '#18203a', b: '#1e2848', line: '#3b5cff', accent: '#45507a', glow: '#7ff6ff' }, bullet: '#7ff6ff', bgm: 2 },
  { id: 'void', name: '虚無の果て', sub: '最終層', wall: 'wall_void', props: ['spire', 'voidcrystal', 'spire', 'ruin'],
    enemies: ['moonmask', 'fluff', 'invspire', 'hollowhand', 'clockrev', 'clockrev'], boss: 'nameless', weather: 'fog',
    floor: { base: '#0e0a16', a: '#140c20', b: '#1c1028', line: '#8a5aff', accent: '#341648', glow: '#c69bff' }, bullet: '#d27de6', bgm: 3 },
];
export const ROOMS_PER_BIOME = 6;

// ai: chase / shooter / charger / exploder / slammer / turret / teleporter / orbiter / swarm / puller / roller
export const ENEMIES = {
  // 魔導の森
  mossball: { name: '苔玉ころがし', model: 'mossball', hp: 34, spd: 50, dmg: 11, ai: 'roller', xp: 3, roll: 190 },
  lanterncap: { name: 'ランタン茸', model: 'lanterncap', hp: 30, spd: 30, dmg: 8, ai: 'shooter', xp: 3, range: 190, shot: { rate: 2.4, n: 3, spread: 0.6, spd: 95, r: 3.5 } },
  antler: { name: '枝角の亡霊鹿', model: 'antler', hp: 44, spd: 66, dmg: 13, ai: 'charger', xp: 4, charge: { spd: 280, dur: 0.45, cd: 2.8 } },
  seedwasp: { name: '種まき蜂', model: 'seedwasp', hp: 10, spd: 96, dmg: 5, ai: 'swarm', xp: 1, fly: 12, group: 3 },
  rootwarden: { name: '根の番人', model: 'rootwarden', hp: 150, spd: 26, dmg: 18, ai: 'slammer', xp: 8, slam: { rad: 56, cd: 3.6 }, heavy: true },
  // 鋼鉄の街
  courier: { name: '暴走配達ロボ', model: 'courier', hp: 20, spd: 92, dmg: 26, ai: 'exploder', xp: 2 },
  camspider: { name: '監視カメラ蜘蛛', model: 'camspider', hp: 26, spd: 64, dmg: 7, ai: 'shooter', xp: 3, range: 180, shot: { rate: 1.5, n: 2, burst: 0.12, spd: 175, r: 2.5 } },
  hydrant: { name: '消火栓の暴れ者', model: 'hydrant', hp: 110, spd: 34, dmg: 16, ai: 'slammer', xp: 6, slam: { rad: 50, cd: 3 }, heavy: true },
  signal: { name: '信号機の亡霊', model: 'signal', hp: 70, spd: 0, dmg: 8, ai: 'turret', xp: 5, shot: { rate: 0.14, spd: 120, r: 3 }, heavy: true },
  vendmimic: { name: '自販機ミミック', model: 'vendmimic', hp: 70, spd: 46, dmg: 14, ai: 'charger', xp: 5, charge: { spd: 260, dur: 0.5, cd: 3 }, shot: { rate: 9, n: 4, spread: 0.8, spd: 140, r: 3 }, heavy: true },
  // 星界ステーション
  eyesat: { name: '眼球衛星', model: 'eyesat', hp: 22, spd: 80, dmg: 7, ai: 'orbiter', xp: 3, fly: 12, shot: { rate: 1.7, n: 1, spd: 160, r: 3 } },
  crystalslug: { name: '結晶ナメクジ', model: 'crystalslug', hp: 60, spd: 40, dmg: 12, ai: 'chase', xp: 4, web: true },
  podling: { name: 'ポッド寄生体', model: 'podling', hp: 9, spd: 98, dmg: 5, ai: 'swarm', xp: 1, group: 4 },
  mirrorknight: { name: '鏡面騎士', model: 'mirrorknight', hp: 64, spd: 50, dmg: 14, ai: 'teleporter', xp: 5, armor: 0.25, shot: { rate: 3, n: 5, spread: 0.6, spd: 160, r: 3 } },
  gravjelly: { name: '重力クラゲ', model: 'gravjelly', hp: 70, spd: 26, dmg: 10, ai: 'puller', xp: 5, fly: 8, shot: { rate: 3.2, n: 10, spread: 6.28, spd: 110, r: 3 } },
  // 虚無の果て
  moonmask: { name: '欠けた月の仮面', model: 'moonmask', hp: 55, spd: 30, dmg: 10, ai: 'shooter', xp: 5, fly: 12, range: 220, shot: { rate: 2.2, n: 12, spread: 6.28, spd: 100, r: 3 } },
  fluff: { name: '影の綿毛', model: 'fluff', hp: 12, spd: 92, dmg: 6, ai: 'swarm', xp: 1, fly: 8, group: 4 },
  invspire: { name: '逆さ塔', model: 'invspire', hp: 90, spd: 0, dmg: 10, ai: 'turret', xp: 6, fly: 6, shot: { rate: 0.12, spd: 110, r: 3.5 }, heavy: true },
  hollowhand: { name: '虚ろの手', model: 'hollowhand', hp: 60, spd: 62, dmg: 15, ai: 'charger', xp: 5, charge: { spd: 300, dur: 0.45, cd: 2.6 } },
  clockrev: { name: '時計仕掛けの亡者', model: 'clockrev', hp: 50, spd: 60, dmg: 13, ai: 'teleporter', xp: 4, shot: { rate: 2.6, n: 3, spread: 0.3, spd: 170, r: 3 } },
};

// ボス：pattern を順に使う。phase2 は HP 半分から（速く・増える）
export const BOSSES = {
  flowerqueen: { name: '喰花の女王', title: '森の主', model: 'flowerqueen', hp: 1500, spd: 18, dmg: 18, r: 18, patterns: ['rootLines', 'sporeRing', 'slam', 'summon', 'sporeRing'], summon: 'seedwasp', col: '#ff7a9a' },
  excavator: { name: '解体重機キメラ', title: '街の主', model: 'excavator', hp: 2600, spd: 32, dmg: 20, r: 18, patterns: ['spray', 'missiles', 'charge', 'summon', 'spray'], summon: 'courier', col: '#ffb84a' },
  starwhale: { name: '銀河鯨', title: '星の主', model: 'starwhale', hp: 3800, spd: 30, dmg: 22, r: 20, fly: 14, patterns: ['laserLines', 'spiral', 'orbital', 'summon', 'spiral'], summon: 'podling', col: '#7ff6ff' },
  nameless: { name: '名無しの王', title: '終わりの主', model: 'nameless', hp: 6000, spd: 34, dmg: 26, r: 15, patterns: ['blackholes', 'teleRing', 'novaLines', 'spiral', 'summon', 'laserLines'], summon: 'fluff', col: '#c69bff' },
};

export const DIFFS = [
  { id: 'easy', name: 'やさしい', hp: 0.7, dmg: 0.55, desc: '魔法を楽しみたい人に' },
  { id: 'normal', name: 'ふつう', hp: 1, dmg: 1, desc: 'おすすめ' },
  { id: 'hard', name: 'むずかしい', hp: 1.5, dmg: 1.4, desc: '魔石 +50%' },
  { id: 'maou', name: '魔王', hp: 2.3, dmg: 2, desc: '魔石 2 倍。覚悟して' },
];
