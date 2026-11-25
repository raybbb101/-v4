// 魔法の一覧（50 種）。どの魔法も Lv1〜10 まで育ち、Lv で段階が変わる（形も名前も変わる）。
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
  // ===================== ファンタジー（20） =====================
  { id: 'ember', name: '熾火', school: 'fantasy', glyph: '熾', color: '#ff8a2a', tiers: [
    { name: '熾火の礫', desc: '赤く燃える小石を投げる。当たると燃える。', kind: 'bolt', cd: 0.8, dmg: 14, spd: 240, fx: 'fireball', hit: 'smallBoom', st: S('burn', 2.5, 0.5) },
    { name: '熾火の散弾', desc: '燃える礫を扇に 3 つ。', kind: 'bolt', cd: 0.95, dmg: 15, spd: 250, n: 3, spread: 0.55, fx: 'fireball', hit: 'smallBoom', st: S('burn', 3, 0.6) },
    { name: '灰燼の驟雨', desc: '空から燃えさしが 6 つ降る。', kind: 'strike', cd: 1.6, dmg: 30, rad: 36, n: 6, interval: 0.08, target: 'random', fx: 'meteorFire', st: S('burn', 3) },
    { name: '焔獄の檻', desc: 'すべての敵のまわりに炎の柱が立ち並び、閉じこめて焼き尽くす。', kind: 'ult', ult: 'pyrecage', cd: 10, dmg: 60 },
  ] },
  { id: 'rime', name: '霧氷', school: 'fantasy', glyph: '霜', color: '#9bdcff', tiers: [
    { name: '霜の針', desc: '貫く細い氷。遅くする。', kind: 'bolt', cd: 0.7, dmg: 11, spd: 320, pierce: 1, fx: 'iceLance', hit: 'iceHit', st: S('slow', 2) },
    { name: '凍て刃', desc: '氷の刃 3 本。ときどき凍らせる。', kind: 'bolt', cd: 0.85, dmg: 15, spd: 330, n: 3, spread: 0.35, pierce: 2, fx: 'iceLance', hit: 'iceHit', st: S('freeze', 1.2, 0.3) },
    { name: '氷晶の花', desc: '足元に氷の花が咲き、まわりを凍らせる。', kind: 'nova', cd: 3, dmg: 34, rad: 90, fx: 'snowBurst', st: S('freeze', 1.6) },
    { name: '氷河の行進', desc: '前方へ巨大な氷柱が一列に突き進み、通り道をすべて凍らせて砕く。', kind: 'strike', cd: 8, dmg: 120, rad: 46, n: 12, line: 34, interval: 0.06, fx: 'iceSpikesAt', st: S('freeze', 2.5) },
  ] },
  { id: 'shiden', name: '紫電', school: 'fantasy', glyph: '紫', color: '#c69bff', tiers: [
    { name: '紫電', desc: '紫の雷が近くの敵へ 2 回跳ねる。', kind: 'chain', cd: 1, dmg: 14, jumps: 2, range: 150, pal: 'arcane' },
    { name: '迅雷', desc: '5 回跳ねる。', kind: 'chain', cd: 1, dmg: 18, jumps: 5, range: 170, pal: 'arcane', st: S('stun', 0.3, 0.3) },
    { name: '雷獣の牙', desc: '8 回跳ね、しびれさせる。', kind: 'chain', cd: 1.1, dmg: 22, jumps: 8, range: 190, pal: 'arcane', st: S('stun', 0.6, 0.5) },
    { name: '天穿つ雷柱', desc: '天を貫く雷柱が 14 本、次々と落ちる。', kind: 'strike', cd: 7, dmg: 70, rad: 36, n: 14, interval: 0.1, target: 'random', fx: 'lightningStrike', st: S('stun', 1) },
  ] },
  { id: 'dawn', name: '曙光', school: 'fantasy', glyph: '曙', color: '#fff0a0', tiers: [
    { name: '光の雫', desc: '敵を追う光の粒。', kind: 'bolt', cd: 0.8, dmg: 11, spd: 220, home: 5, fx: 'magicBolt', hit: 'manaPop', pal: 'holy' },
    { name: '陽だまりの輪', desc: '光の輪が敵を焼き、自分を少し癒す。', kind: 'nova', cd: 2.6, dmg: 24, rad: 80, fx: 'healAoe', heal: 6 },
    { name: '光輪の裁き', desc: '3 か所に光の柱。', kind: 'strike', cd: 2, dmg: 42, rad: 44, n: 3, interval: 0.18, delay: 0.3, fx: 'holyPillar' },
    { name: '黎明の剣', desc: '夜明けの光でできた巨大な剣が突き立ち、まわりを浄化する。', kind: 'strike', cd: 6, dmg: 220, rad: 90, delay: 0.5, fx: 'holyBlade', target: 'dense', st: S('stun', 1.5) },
  ] },
  { id: 'kage', name: '影縫い', school: 'fantasy', glyph: '縫', color: '#8048b8', tiers: [
    { name: '影縫い', desc: '影を縫いとめて動きを止める。', kind: 'zone', cd: 2.2, dmg: 8, rad: 34, dur: 2, tick: 0.4, fx: 'graspingHands', st: S('root', 1), at: 'target' },
    { name: '影の触手', desc: '広く締めつける。', kind: 'zone', cd: 2.4, dmg: 11, rad: 52, dur: 2.6, tick: 0.35, fx: 'shadowTendrils', st: S('root', 1), at: 'target' },
    { name: '夜帳', desc: '夜の帳を下ろし、受けるダメージを 1.5 倍にする。', kind: 'zone', cd: 2.8, dmg: 14, rad: 70, dur: 3.5, tick: 0.35, fx: 'hexSigil', st: S('curse', 4), at: 'target' },
    { name: '月蝕', desc: '月が欠け、世界が闇に沈む。全ての敵が呪われ、闇が弾ける。', kind: 'ult', ult: 'eclipse', cd: 10, dmg: 80 },
  ] },
  { id: 'ivy', name: '蔦', school: 'fantasy', glyph: '蔦', color: '#7ee84c', tiers: [
    { name: '蔦の鞭', desc: '前方を蔦で打つ。', kind: 'cone', cd: 0.9, dmg: 18, range: 80, arc: 0.7, dur: 0.01, fx: 'vineWhip', knock: 60 },
    { name: '絡みつく蔦', desc: '敵の足元から蔦が絡む。', kind: 'strike', cd: 1.8, dmg: 20, rad: 40, n: 3, target: 'random', interval: 0.1, fx: 'rootSnare', st: S('root', 1.4) },
    { name: '茨の城壁', desc: '自分のまわりに茨の壁が生える。', kind: 'strike', cd: 3, dmg: 34, rad: 36, n: 8, ring: 70, interval: 0.04, delay: 0.1, fx: 'thorns', st: S('slow', 2) },
    { name: '千年樹海', desc: '足元から千年の森が広がり、近づく敵を根で捕まえて裂き続ける。', kind: 'zone', cd: 9, dmg: 22, rad: 140, dur: 6, tick: 0.2, fx: 'leafStorm', at: 'follow', st: S('root', 0.6, 0.3), pull: 20 },
  ] },
  { id: 'bubble', name: '泡沫', school: 'fantasy', glyph: '泡', color: '#62c8f4', tiers: [
    { name: '泡沫弾', desc: 'ふわふわ進む大きな泡。押し返す。', kind: 'bolt', cd: 0.9, dmg: 14, spd: 170, fx: 'waterOrb', hit: 'splash', knock: 90 },
    { name: '泡の檻', desc: '泡が敵を包み遅くする。', kind: 'zone', cd: 2.4, dmg: 7, rad: 56, dur: 3, tick: 0.3, fx: 'bubbleField', at: 'target', st: S('slow', 1) },
    { name: '泡爆', desc: '割れると爆ぜる泡を 3 つ。', kind: 'bolt', cd: 1.3, dmg: 24, spd: 190, n: 3, spread: 0.6, fx: 'waterOrb', boom: 44, boomFx: 'splash', knock: 80 },
    { name: '深海の圧', desc: '深海の水圧が押し寄せ、全てを渦へ引き込んで潰す。', kind: 'zone', cd: 8, dmg: 30, rad: 150, dur: 4, tick: 0.25, pull: 150, fx: 'whirlpool', at: 'dense', endBoom: 150, st: S('slow', 1) },
  ] },
  { id: 'stardust', name: '星屑', school: 'fantasy', glyph: '星', color: '#ffe066', tiers: [
    { name: '星屑', desc: 'きらめく追尾弾 2 つ。', kind: 'bolt', cd: 0.9, dmg: 10, spd: 220, n: 2, spread: 1, home: 5, fx: 'arcaneDart', hit: 'manaPop', pal: 'gold' },
    { name: '流れ星', desc: '敵に星が落ちる。', kind: 'strike', cd: 1.6, dmg: 34, rad: 32, n: 2, interval: 0.2, target: 'random', fx: 'starFall' },
    { name: '星座の結び', desc: '星座のように 7 体を光でつなぐ。', kind: 'chain', cd: 1.3, dmg: 26, jumps: 7, range: 200, pal: 'gold' },
    { name: '銀河落とし', desc: '夜空ごと落ちてくる。18 個の星が降り注ぐ。', kind: 'strike', cd: 7, dmg: 54, rad: 34, n: 18, interval: 0.08, target: 'random', fx: 'starFall' },
  ] },
  { id: 'mend', name: '癒し', school: 'fantasy', glyph: '癒', color: '#a8f0a0', tiers: [
    { name: '癒しの雫', desc: '自分を回復する。', kind: 'buff', cd: 6, heal: 18, fx: 'heal' },
    { name: '癒しの泉', desc: '足元に泉。中にいる仲間を癒し続ける。', kind: 'zone', cd: 8, dmg: 0, rad: 60, dur: 5, tick: 0.5, healTick: 4, fx: 'bubbleField', at: 'self' },
    { name: '再生の祈り', desc: '仲間全員を回復し、少しずつ回復し続ける。', kind: 'buff', cd: 8, heal: 20, regen: 4, dur: 6, allies: 9999, fx: 'healingBloom' },
    { name: '女神の息吹', desc: '全員を全回復し、倒れた仲間を起こし、しばらく強くする。', kind: 'buff', cd: 20, heal: 999, allies: 9999, revive: true, dmgUp: 0.3, dur: 8, fx: 'resurrection' },
  ] },
  { id: 'gale', name: '疾風', school: 'fantasy', glyph: '颯', color: '#b8f0d8', tiers: [
    { name: '突風', desc: '速く貫く風。押し返す。', kind: 'bolt', cd: 0.6, dmg: 9, spd: 400, pierce: 3, knock: 50, fx: 'windBlade', hit: 'hitSpark' },
    { name: '風刃の輪', desc: '風の刃 3 枚が自分を回る。', kind: 'orbit', cd: 4.5, dmg: 13, n: 3, rad: 34, dur: 4, fx: 'windBlade', spin: 5 },
    { name: '竜巻', desc: '竜巻が敵を巻きこみながら進む。', kind: 'zone', cd: 2.4, dmg: 10, rad: 40, dur: 3, tick: 0.2, fx: 'tornado', at: 'self', move: 90, pull: 50 },
    { name: '天嵐', desc: '天まで届く嵐をまとう。近くの敵はすべて巻きこまれ切り刻まれる。', kind: 'zone', cd: 7, dmg: 18, rad: 120, dur: 5, tick: 0.15, fx: 'sakura', at: 'follow', pull: 60 },
  ] },
  { id: 'sand', name: '砂塵', school: 'fantasy', glyph: '砂', color: '#e8c070', tiers: [
    { name: '砂礫', desc: '砂粒を 3 つ短く飛ばす。', kind: 'bolt', cd: 0.6, dmg: 7, spd: 300, n: 3, spread: 0.5, life: 0.5, fx: 'rock', hit: 'bluntHit', pal: 'dust' },
    { name: '砂嵐', desc: '砂嵐で敵の目をくらます（混乱）。', kind: 'zone', cd: 3, dmg: 6, rad: 70, dur: 4, tick: 0.4, fx: 'sandStorm', at: 'target', st: S('confuse', 1.5, 0.5) },
    { name: '流砂', desc: '地面が流れ、敵を中心へ吸いこむ。', kind: 'zone', cd: 3, dmg: 9, rad: 80, dur: 3.5, tick: 0.3, pull: 90, fx: 'sandStorm', at: 'target', st: S('slow', 1) },
    { name: '砂漠の王墓', desc: '地の底から王墓がせり上がり、砂の柱が次々と噴き出す。', kind: 'strike', cd: 8, dmg: 90, rad: 50, n: 10, interval: 0.12, target: 'random', fx: 'sandBoom', st: S('stun', 1.2) },
  ] },
  { id: 'mirror', name: '鏡', school: 'fantasy', glyph: '鏡', color: '#d8e8ff', tiers: [
    { name: '鏡の破片', desc: '鋭い破片を 4 つ。', kind: 'bolt', cd: 0.8, dmg: 9, spd: 360, n: 4, spread: 0.6, pierce: 1, fx: 'shard', hit: 'hitSpark' },
    { name: '反射の鏡', desc: '盾を張り、近くの敵の弾をはね返す。', kind: 'buff', cd: 7, shield: 25, reflect: 3, fx: 'forceField' },
    { name: '万華鏡', desc: '全方位に 10 の破片。', kind: 'bolt', cd: 1, dmg: 12, spd: 360, n: 10, spread: 6.28, pierce: 2, fx: 'shard', hit: 'hitSpark' },
    { name: '鏡界', desc: '鏡の中から自分の分身が 5 人現れ、一斉に魔弾を撃つ。', kind: 'summon', cd: 13, type: 'decoy', n: 5, dur: 8, boom: 70, dmg: 70, shoot: 14 },
  ] },
  { id: 'kitsune', name: '狐火', school: 'fantasy', glyph: '狐', color: '#ff9ad8', tiers: [
    { name: '鬼火', desc: '青白い火の玉 2 つが自分を回る。', kind: 'orbit', cd: 4, dmg: 12, n: 2, rad: 30, dur: 4, fx: 'skullOrb' },
    { name: '狐火', desc: '燃やす火の玉 4 つ。', kind: 'orbit', cd: 4, dmg: 14, n: 4, rad: 36, dur: 4.5, fx: 'fireball', st: S('burn', 2, 0.5) },
    { name: '百鬼の灯', desc: '7 つの灯が大きく回る。', kind: 'orbit', cd: 4, dmg: 17, n: 7, rad: 48, dur: 5, fx: 'skullOrb', lifesteal: 0.05 },
    { name: '九尾の狐火', desc: '九つの狐火が敵を追って飛び、触れた敵を燃やし尽くす。', kind: 'bolt', cd: 6, dmg: 60, spd: 180, n: 9, spread: 6.28, home: 4, life: 3, fx: 'fireball', boom: 50, boomFx: 'smallBoom', st: S('burn', 4), pal: 'neon' },
  ] },
  { id: 'dragon', name: '龍', school: 'fantasy', glyph: '龍', color: '#ff5a3a', tiers: [
    { name: '龍の吐息', desc: '短く炎を吐く。', kind: 'cone', cd: 2.4, dmg: 7, range: 80, arc: 0.6, dur: 1.2, tick: 0.1, fx: 'flamethrower', st: S('burn', 2, 0.4) },
    { name: '龍鱗', desc: '龍の鱗で身を守る。', kind: 'buff', cd: 7, shield: 30, fx: 'divineShield' },
    { name: '双龍弾', desc: '追いかけて爆ぜる火の龍 2 匹。', kind: 'bolt', cd: 1.6, dmg: 34, spd: 200, n: 2, spread: 1.2, home: 4, fx: 'fireball', boom: 52, boomFx: 'smallBoom', st: S('burn', 3) },
    { name: '龍王顕現', desc: '龍王が空を駆け抜け、通り道を炎の柱で焼き払う。', kind: 'ult', ult: 'dragon', cd: 10, dmg: 90 },
  ] },
  { id: 'song', name: '魔歌', school: 'fantasy', glyph: '歌', color: '#f0a0ff', tiers: [
    { name: '子守唄', desc: 'まわりの敵を眠らせる（止める）。', kind: 'nova', cd: 4, dmg: 4, rad: 80, fx: 'noteRing', st: S('stun', 1.4) },
    { name: '戦の歌', desc: '仲間全員の速さと威力を上げる。', kind: 'buff', cd: 9, haste: 0.25, dmgUp: 0.2, dur: 6, allies: 9999, fx: 'blessing' },
    { name: '鎮魂歌', desc: '音の波がまわりを打ち、遅くする。', kind: 'nova', cd: 2.6, dmg: 30, rad: 110, n: 2, interval: 0.3, fx: 'noteRing', st: S('slow', 2) },
    { name: '終焉の交響曲', desc: '五つの楽章が響く。音の大波が 5 回、画面中を揺らす。', kind: 'nova', cd: 9, dmg: 70, rad: 260, n: 5, interval: 0.45, fx: 'noteRing', st: S('stun', 0.6), knock: 80 },
  ] },
  { id: 'curse', name: '呪詛', school: 'fantasy', glyph: '呪', color: '#a868f0', tiers: [
    { name: '呪いの釘', desc: '打ちこんだ敵を呪う（受けるダメージ 1.5 倍）。', kind: 'bolt', cd: 1, dmg: 12, spd: 340, fx: 'nail', hit: 'curseFx', st: S('curse', 3) },
    { name: '呪詛返し', desc: '呪いが 4 体に移っていく。', kind: 'chain', cd: 1.4, dmg: 16, jumps: 4, range: 160, pal: 'shadow', st: S('curse', 3) },
    { name: '藁人形', desc: '呪いの人形を置く。敵は人形を狙い、消えると呪いが弾ける。', kind: 'summon', cd: 8, type: 'decoy', n: 1, dur: 5, boom: 80, dmg: 80, doll: true },
    { name: '百呪の宴', desc: '百の呪いが一度に降りかかる。全ての敵を呪い、深く傷つける。', kind: 'nova', cd: 9, dmg: 90, rad: 400, fx: 'darkExplosion', st: S('curse', 6) },
  ] },
  { id: 'blood', name: '血の魔法', school: 'fantasy', glyph: '血', color: '#ff4a5a', tiers: [
    { name: '血の刃', desc: '当てた分だけ回復する刃。', kind: 'bolt', cd: 0.8, dmg: 13, spd: 320, fx: 'bloodBolt', hit: 'hitSpark', lifesteal: 0.2 },
    { name: '血の渦', desc: '渦の中の敵から血を吸う。', kind: 'zone', cd: 3, dmg: 9, rad: 60, dur: 3, tick: 0.3, fx: 'bloodWell', at: 'target', lifesteal: 0.25 },
    { name: '紅の槍', desc: '貫いて吸い取る光線。', kind: 'beam', cd: 1.6, dmg: 36, len: 220, w: 12, fx: 'soulDrain', lifesteal: 0.3 },
    { name: '血の契約', desc: '血の契約で 8 秒、威力 +60%。まわりの敵から命を吸い続ける。', kind: 'buff', cd: 14, dmgUp: 0.6, aura: 40, auraRad: 90, dur: 8, lifestealAura: 0.3, fx: 'rage' },
  ] },
  { id: 'chrono', name: '刻', school: 'fantasy', glyph: '刻', color: '#f2d27a', tiers: [
    { name: '刻の針', desc: '当たった敵の時間を遅くする針。', kind: 'bolt', cd: 0.8, dmg: 10, spd: 360, fx: 'nail', hit: 'manaPop', st: S('slow', 2.5), pal: 'gold' },
    { name: '時の澱み', desc: 'まわりの時間が止まる。', kind: 'nova', cd: 4.5, dmg: 10, rad: 110, fx: 'timeRing', st: S('stun', 1.6) },
    { name: '巻き戻し', desc: '少し前の自分に戻る（大きく回復し、詠唱が早まる）。', kind: 'buff', cd: 10, heal: 40, cdr: 0.3, dur: 4, fx: 'haste' },
    { name: '時の静寂', desc: '時計の針が止まる。4 秒間、敵も弾もすべて止まる。', kind: 'ult', ult: 'timestop', cd: 14, dmg: 10 },
  ] },
  { id: 'stone', name: '岩', school: 'fantasy', glyph: '岩', color: '#c8a070', tiers: [
    { name: '石礫', desc: '重い石。押し返す。', kind: 'bolt', cd: 1.1, dmg: 22, spd: 190, fx: 'rock', hit: 'bluntHit', knock: 130 },
    { name: '岩壁', desc: '前方に岩の棘が一列に突き出る。', kind: 'strike', cd: 1.6, dmg: 32, rad: 32, n: 5, line: 32, interval: 0.06, fx: 'earthSpike' },
    { name: '隕石', desc: '大きな岩が一つ落ちる。', kind: 'strike', cd: 2.4, dmg: 90, rad: 64, delay: 0.9, fx: 'meteorFire', target: 'dense', st: S('stun', 0.8) },
    { name: '大陸崩し', desc: '大地が裂け、巨岩が 10 個降る。', kind: 'strike', cd: 8, dmg: 90, rad: 52, n: 10, interval: 0.14, target: 'random', fx: 'groundSlam', st: S('stun', 1) },
  ] },
  { id: 'blade', name: '剣舞', school: 'fantasy', glyph: '剣', color: '#d0e0ff', tiers: [
    { name: '飛ぶ剣', desc: '投げると戻ってくる剣。', kind: 'bolt', cd: 1, dmg: 15, spd: 300, pierce: 99, boomerang: 0.5, fx: 'swordOrb', hit: 'hitSpark' },
    { name: '剣の輪', desc: '剣 3 本が回る。', kind: 'orbit', cd: 4, dmg: 14, n: 3, rad: 32, dur: 4.5, fx: 'swordOrb' },
    { name: '剣の雨', desc: '光の剣が 6 本降る。', kind: 'strike', cd: 1.6, dmg: 30, rad: 26, n: 6, interval: 0.07, target: 'random', fx: 'arrowRain', pal: 'metal' },
    { name: '万剣の墓標', desc: '自分を中心に、千の剣が円を描いて地面へ突き立つ。', kind: 'strike', cd: 8, dmg: 100, rad: 44, n: 16, ring: 110, interval: 0.04, delay: 0.3, fx: 'holyBladeSmall' },
  ] },

  // ===================== 現代（15） =====================
  { id: 'revolver', name: 'リボルバー', school: 'real', glyph: '銃', color: '#ffb84a', tiers: [
    { name: 'リボルバー', desc: '素早い弾。', kind: 'bolt', cd: 0.4, dmg: 8, spd: 520, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: '早撃ち', desc: '2 発ずつ。', kind: 'bolt', cd: 0.4, dmg: 9, spd: 540, n: 2, spread: 0.12, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: '散弾銃', desc: '散弾 7 発。近いほど痛い。', kind: 'bolt', cd: 0.9, dmg: 9, spd: 480, n: 7, spread: 0.7, life: 0.4, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzleShotgun', knock: 40 },
    { name: '弾幕の雨', desc: '3 秒間、弾の嵐を浴びせる。', kind: 'cone', cd: 7, dmg: 12, range: 240, arc: 0.5, dur: 3, tick: 0.05, fx: 'gatling', bullets: true },
  ] },
  { id: 'sniper', name: '狙撃', school: 'real', glyph: '狙', color: '#e8e0c0', tiers: [
    { name: '狙撃', desc: '遅いが重い一発。', kind: 'bolt', cd: 1.4, dmg: 36, spd: 700, pierce: 1, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: '徹甲弾', desc: '5 体を貫く。', kind: 'bolt', cd: 1.4, dmg: 44, spd: 760, pierce: 5, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: '跳弾', desc: '当たると次の敵へ 4 回跳ねる。', kind: 'bolt', cd: 1.3, dmg: 40, spd: 700, bounce: 4, fx: 'bullet', hit: 'bulletHit', muzzle: 'muzzlePistol' },
    { name: '一撃必殺', desc: '画面の端まで届く、すべてを貫く一発。', kind: 'beam', cd: 5, dmg: 400, len: 700, w: 10, fx: 'laserBeam' },
  ] },
  { id: 'bomb', name: '爆弾', school: 'real', glyph: '爆', color: '#ff6a3a', tiers: [
    { name: '手榴弾', desc: '投げて少しして爆発。', kind: 'strike', cd: 1.8, dmg: 36, rad: 46, delay: 0.7, fx: 'grenadeBoom' },
    { name: '粘着爆弾', desc: '敵にくっつき、大きく爆ぜる。', kind: 'strike', cd: 1.8, dmg: 48, rad: 58, delay: 0.6, fx: 'smallBoom' },
    { name: '子爆弾', desc: '親爆弾から 6 つの子爆弾。', kind: 'strike', cd: 2.4, dmg: 34, rad: 44, n: 7, scatter: 60, interval: 0.07, delay: 0.7, fx: 'grenadeBoom' },
    { name: 'クラスター爆撃', desc: '爆撃機が一直線に爆弾を落とす。', kind: 'strike', cd: 8, dmg: 90, rad: 60, n: 12, line: 40, interval: 0.1, delay: 0.6, fx: 'bigBoom' },
  ] },
  { id: 'torch', name: '火炎放射', school: 'real', glyph: '焼', color: '#ff7a2a', tiers: [
    { name: '火炎放射器', desc: '前方を焼き続ける。', kind: 'cone', cd: 3, dmg: 6, range: 90, arc: 0.5, dur: 1.5, tick: 0.1, fx: 'flamethrower', st: S('burn', 2, 0.3) },
    { name: '高熱放射', desc: '長く、遠くまで焼く。', kind: 'cone', cd: 3, dmg: 8, range: 120, arc: 0.55, dur: 2, tick: 0.1, fx: 'flamethrower', st: S('burn', 3, 0.4) },
    { name: '旋回放射', desc: '回りながら焼く。', kind: 'cone', cd: 3.4, dmg: 10, range: 120, arc: 0.6, dur: 2.2, tick: 0.08, fx: 'flamethrower', spin: 4, st: S('burn', 3, 0.5) },
    { name: '焼夷の海', desc: '一帯を火の海にする。', kind: 'zone', cd: 8, dmg: 22, rad: 140, dur: 5, tick: 0.2, fx: 'napalm', at: 'target', st: S('burn', 3) },
  ] },
  { id: 'missile', name: 'ミサイル', school: 'real', glyph: '弾', color: '#d8d8e8', tiers: [
    { name: 'ロケット弾', desc: '大きく爆ぜるロケット。', kind: 'bolt', cd: 1.6, dmg: 30, spd: 260, fx: 'rocket', boom: 50, boomFx: 'smallBoom' },
    { name: '誘導ミサイル', desc: '敵を追う。', kind: 'bolt', cd: 1.6, dmg: 34, spd: 240, home: 4, fx: 'rocket', boom: 52, boomFx: 'smallBoom' },
    { name: '多弾頭', desc: '誘導ミサイル 4 発。', kind: 'bolt', cd: 2, dmg: 30, spd: 230, n: 4, spread: 1.6, home: 5, fx: 'rocket', boom: 46, boomFx: 'smallBoom' },
    { name: '戦術核', desc: '警告の後、すべてを焼き払うきのこ雲。', kind: 'strike', cd: 16, dmg: 600, rad: 400, delay: 1.6, fx: 'nuke', target: 'center', st: S('burn', 4) },
  ] },
  { id: 'smoke', name: '煙幕', school: 'real', glyph: '煙', color: '#a8a0b8', tiers: [
    { name: '発煙筒', desc: '煙の中は敵が遅く、弾が当たりにくい。', kind: 'zone', cd: 4, dmg: 3, rad: 60, dur: 4, tick: 0.5, fx: 'smokeBomb', at: 'self', st: S('slow', 1), cover: true },
    { name: '催涙弾', desc: '煙が敵を混乱させる。', kind: 'zone', cd: 4, dmg: 6, rad: 70, dur: 4, tick: 0.4, fx: 'smokeBomb', at: 'target', st: S('confuse', 1.5, 0.6) },
    { name: '毒ガス', desc: '毒の雲。', kind: 'zone', cd: 4, dmg: 9, rad: 80, dur: 5, tick: 0.3, fx: 'poisonCloud', at: 'target', st: S('poison', 4, 1, 1) },
    { name: '閃光弾の嵐', desc: '閃光弾の連続。全ての敵を眩ませる。', kind: 'nova', cd: 9, dmg: 60, rad: 400, fx: 'flashbang', st: S('stun', 2.5) },
  ] },
  { id: 'mine', name: '地雷', school: 'real', glyph: '罠', color: '#e8c050', tiers: [
    { name: '地雷', desc: '足元に地雷を置く。', kind: 'mine', cd: 2, dmg: 40, rad: 44, n: 1 },
    { name: '地雷原', desc: '3 つまき散らす。', kind: 'mine', cd: 2.4, dmg: 44, rad: 46, n: 3, scatter: 50 },
    { name: '指向性地雷', desc: '5 つ、爆発も大きい。', kind: 'mine', cd: 2.6, dmg: 52, rad: 56, n: 5, scatter: 70 },
    { name: '爆薬の輪', desc: '自分のまわりに爆薬の輪。', kind: 'strike', cd: 7, dmg: 120, rad: 60, n: 8, ring: 90, interval: 0.06, delay: 0.4, fx: 'barrelBoom' },
  ] },
  { id: 'taser', name: '電撃銃', school: 'real', glyph: '電', color: '#78b8ff', tiers: [
    { name: 'スタンガン', desc: '近くの敵をしびれさせる。', kind: 'chain', cd: 1.1, dmg: 10, jumps: 1, range: 90, st: S('stun', 0.8), pal: 'volt' },
    { name: 'テーザー網', desc: '3 体をしびれさせる。', kind: 'chain', cd: 1.2, dmg: 13, jumps: 3, range: 120, st: S('stun', 1), pal: 'volt' },
    { name: '高圧電流', desc: '6 体、強くしびれさせる。', kind: 'chain', cd: 1.3, dmg: 17, jumps: 6, range: 150, st: S('stun', 1.2), pal: 'volt' },
    { name: '送電塔', desc: '雷を呼ぶ塔を建てる。', kind: 'summon', cd: 9, type: 'tesla', n: 1, dur: 8, dmg: 40, rate: 0.3, range: 200 },
  ] },
  { id: 'cannon', name: '大砲', school: 'real', glyph: '砲', color: '#b0a8c0', tiers: [
    { name: '砲弾', desc: '重く遅い弾。大きく押し返す。', kind: 'bolt', cd: 1.6, dmg: 36, spd: 170, pierce: 2, fx: 'cannonball', hit: 'bluntHit', knock: 200 },
    { name: '炸裂弾', desc: '当たると爆ぜる。', kind: 'bolt', cd: 1.6, dmg: 40, spd: 180, fx: 'cannonball', boom: 56, boomFx: 'dirtBoom', knock: 160 },
    { name: '三連砲', desc: '炸裂弾を 3 発。', kind: 'bolt', cd: 1.9, dmg: 40, spd: 190, n: 3, spread: 0.45, fx: 'cannonball', boom: 56, boomFx: 'dirtBoom' },
    { name: '艦砲射撃', desc: '遠くの艦が砲弾を降らせる。', kind: 'strike', cd: 8, dmg: 110, rad: 56, n: 10, interval: 0.16, target: 'random', delay: 0.6, fx: 'dirtBoom' },
  ] },
  { id: 'hose', name: '放水', school: 'real', glyph: '放', color: '#5ab0ff', tiers: [
    { name: '高圧放水', desc: '水で押し流す。', kind: 'cone', cd: 2.6, dmg: 4, range: 130, arc: 0.25, dur: 1.4, tick: 0.1, fx: 'waterJet', knock: 50 },
    { name: '放水砲', desc: '太く強い水流。', kind: 'cone', cd: 2.6, dmg: 6, range: 160, arc: 0.3, dur: 1.8, tick: 0.1, fx: 'waterJet', knock: 70, st: S('slow', 1) },
    { name: '間欠泉', desc: '敵の足元から水柱。', kind: 'strike', cd: 1.8, dmg: 34, rad: 34, n: 3, target: 'random', interval: 0.15, fx: 'geyser', knock: 60 },
    { name: '消防ヘリ', desc: '空から大量の水。全ての敵を押し流し、遅くする。', kind: 'nova', cd: 8, dmg: 80, rad: 400, fx: 'downpour', knock: 200, st: S('slow', 3) },
  ] },
  { id: 'k9', name: '警察犬', school: 'real', glyph: '犬', color: '#c8a878', tiers: [
    { name: '警察犬', desc: '敵にかみつく相棒を 1 匹呼ぶ。', kind: 'summon', cd: 10, type: 'hound', n: 1, dur: 10, dmg: 12, rate: 0.6 },
    { name: '二頭の相棒', desc: '2 匹。', kind: 'summon', cd: 10, type: 'hound', n: 2, dur: 10, dmg: 14, rate: 0.55 },
    { name: '追跡部隊', desc: '3 匹、かみつくとしびれさせる。', kind: 'summon', cd: 10, type: 'hound', n: 3, dur: 11, dmg: 16, rate: 0.5, stun: true },
    { name: '群狼部隊', desc: '6 匹の相棒が戦場を駆け回る。', kind: 'summon', cd: 14, type: 'hound', n: 6, dur: 12, dmg: 22, rate: 0.4, stun: true },
  ] },
  { id: 'saw', name: '丸鋸', school: 'real', glyph: '鋸', color: '#c0c8d8', tiers: [
    { name: '丸鋸投げ', desc: '貫いて戻ってくる丸鋸。', kind: 'bolt', cd: 1.1, dmg: 14, spd: 300, pierce: 99, boomerang: 0.55, fx: 'disc', hit: 'hitSpark', pal: 'metal' },
    { name: '二枚刃', desc: '2 枚投げる。', kind: 'bolt', cd: 1.1, dmg: 16, spd: 300, n: 2, spread: 0.4, pierce: 99, boomerang: 0.55, fx: 'disc', hit: 'hitSpark', pal: 'metal' },
    { name: '回転刃の盾', desc: '丸鋸 4 枚がまわりを回る。', kind: 'orbit', cd: 5, dmg: 18, n: 4, rad: 40, dur: 5, fx: 'disc', spin: 5, pal: 'metal' },
    { name: '処刑機械', desc: '10 枚の丸鋸が唸りを上げて高速で回る。', kind: 'orbit', cd: 8, dmg: 26, n: 10, rad: 64, dur: 6, fx: 'disc', spin: 6, pal: 'metal' },
  ] },
  { id: 'truck', name: '突撃', school: 'real', glyph: '突', color: '#ff9a4a', tiers: [
    { name: 'ショルダータックル', desc: '向いた方へ突進して体当たり。', kind: 'dash', cd: 3, dist: 80, dmg: 20, rad: 40 },
    { name: 'ニトロ', desc: 'もっと速く、通り道も吹き飛ばす。', kind: 'dash', cd: 2.6, dist: 110, dmg: 26, rad: 46, trail: true },
    { name: '連続突撃', desc: '遠くまで、強く。', kind: 'dash', cd: 2.2, dist: 140, dmg: 34, rad: 52, trail: true },
    { name: '暴走トラック', desc: '画面の端から大型トラックが突っこんでくる。進路の敵をすべてはね飛ばす。', kind: 'ult', ult: 'truck', cd: 9, dmg: 140 },
  ] },
  { id: 'medic', name: '救急', school: 'real', glyph: '救', color: '#ff7a8a', tiers: [
    { name: '救急箱', desc: 'すぐに回復。', kind: 'buff', cd: 6, heal: 20, fx: 'heal' },
    { name: '包帯', desc: '少しずつ回復し続ける。', kind: 'buff', cd: 8, heal: 8, regen: 5, dur: 6, fx: 'scanner' },
    { name: '除細動器', desc: 'まわりの敵をしびれさせ、仲間を回復する。', kind: 'nova', cd: 4, dmg: 20, rad: 90, fx: 'emp', st: S('stun', 1), heal: 15 },
    { name: '野戦病院', desc: '大きな救護所を開く。中にいる仲間は回復し続け、倒れた仲間も起きる。', kind: 'zone', cd: 16, dmg: 0, rad: 120, dur: 8, tick: 0.5, healTick: 10, revive: true, fx: 'bubbleField', at: 'self' },
  ] },
  { id: 'airstrike', name: '空爆要請', school: 'real', glyph: '空', color: '#9ab0c8', tiers: [
    { name: '迫撃砲', desc: '敵のいる所に砲弾 2 発。', kind: 'strike', cd: 2, dmg: 30, rad: 40, n: 2, interval: 0.25, target: 'random', delay: 0.8, fx: 'dirtBoom' },
    { name: '砲撃支援', desc: '4 発。', kind: 'strike', cd: 2.4, dmg: 34, rad: 44, n: 4, interval: 0.2, target: 'random', delay: 0.8, fx: 'dirtBoom' },
    { name: 'ミサイル支援', desc: '6 発、さらに大きく。', kind: 'strike', cd: 2.8, dmg: 40, rad: 50, n: 6, interval: 0.15, target: 'random', delay: 0.8, fx: 'smallBoom' },
    { name: '飽和攻撃', desc: '空が黒くなるほどの爆弾が、敵全員の上に落ちる。', kind: 'strike', cd: 10, dmg: 120, rad: 56, n: 20, interval: 0.07, target: 'random', delay: 0.9, fx: 'bigBoom' },
  ] },

  // ===================== 未来（15） =====================
  { id: 'laser', name: 'レーザー', school: 'future', glyph: '光', color: '#ff3a6a', tiers: [
    { name: 'レーザー弾', desc: '速い光の弾。', kind: 'bolt', cd: 0.45, dmg: 9, spd: 560, fx: 'laser', hit: 'zap', pal: 'laserRed' },
    { name: '連射レーザー', desc: '3 連射。', kind: 'bolt', cd: 0.7, dmg: 10, spd: 580, n: 3, burst: 0.07, fx: 'laser', hit: 'zap', pal: 'laserRed' },
    { name: '貫通光線', desc: '全てを貫く光線。', kind: 'beam', cd: 1.4, dmg: 40, len: 320, w: 8, fx: 'laserBeam' },
    { name: '衛星軌道砲', desc: '宇宙から極太の光が降り、なぞった跡を焼く。', kind: 'strike', cd: 9, dmg: 160, rad: 60, n: 5, line: 50, interval: 0.2, delay: 1, fx: 'orbital' },
  ] },
  { id: 'plasma', name: 'プラズマ', school: 'future', glyph: '漿', color: '#7ff6ff', tiers: [
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
    { name: '電磁嵐', desc: '画面中に電磁の嵐。4 度の大波で全ての敵を止め、弾を消し去る。', kind: 'nova', cd: 10, dmg: 50, rad: 400, n: 4, interval: 0.5, fx: 'emp', st: S('stun', 1.5), clearBullets: true },
  ] },
  { id: 'shield', name: '力場', school: 'future', glyph: '盾', color: '#7fd8ff', tiers: [
    { name: '力場シールド', desc: '一定量のダメージを防ぐ。', kind: 'buff', cd: 8, shield: 25, fx: 'forceField' },
    { name: '反射フィールド', desc: '防ぎ、近くの弾をはね返す。', kind: 'buff', cd: 8, shield: 35, reflect: 3, fx: 'forceField' },
    { name: '拡張力場', desc: '仲間全員にシールド。', kind: 'buff', cd: 9, shield: 45, allies: 9999, reflect: 3, fx: 'forceField' },
    { name: '絶対防壁', desc: '3 秒間無敵。触れた敵を焼く。', kind: 'buff', cd: 16, invuln: 3, shield: 60, aura: 30, auraRad: 50, dur: 3, fx: 'divineShield' },
  ] },
  { id: 'halo', name: '光輪刃', school: 'future', glyph: '輪', color: '#7fffd0', tiers: [
    { name: 'エナジーディスク', desc: '戻ってくる光の刃。', kind: 'bolt', cd: 1.1, dmg: 14, spd: 300, pierce: 99, boomerang: 0.55, fx: 'disc', hit: 'hitSpark' },
    { name: '双輪', desc: '2 枚。', kind: 'bolt', cd: 1.1, dmg: 16, spd: 300, n: 2, spread: 0.4, pierce: 99, boomerang: 0.55, fx: 'disc', hit: 'hitSpark' },
    { name: '四方輪', desc: '4 方向に。', kind: 'bolt', cd: 1.2, dmg: 18, spd: 320, n: 4, spread: 4.71, pierce: 99, boomerang: 0.6, fx: 'disc', hit: 'hitSpark' },
    { name: '光輪の嵐', desc: '8 枚の光輪がまわりを高速で回る。', kind: 'orbit', cd: 8, dmg: 24, n: 8, rad: 60, dur: 6, fx: 'disc', spin: 5 },
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
    { name: '事象の地平', desc: '光さえ逃げられない穴が開く。全てを吸いこみ、閉じるときに砕く。', kind: 'zone', cd: 10, dmg: 24, rad: 200, dur: 4, tick: 0.2, pull: 200, fx: 'blackHole', at: 'dense', endBoom: 300 },
  ] },
  { id: 'holo', name: 'ホログラム', school: 'future', glyph: '幻', color: '#40e8ff', tiers: [
    { name: 'おとり', desc: '敵の気を引く分身を置く。', kind: 'summon', cd: 8, type: 'decoy', n: 1, dur: 5, dmg: 0 },
    { name: '爆ぜるおとり', desc: '消えるときに爆発する。', kind: 'summon', cd: 8, type: 'decoy', n: 1, dur: 5, boom: 60, dmg: 50 },
    { name: '分身', desc: '2 体の分身が魔弾を撃つ。', kind: 'summon', cd: 9, type: 'decoy', n: 2, dur: 6, boom: 60, dmg: 50, shoot: 10 },
    { name: '光学迷彩', desc: '姿を消して 5 秒無敵。その間の威力は 2 倍。', kind: 'buff', cd: 15, invuln: 5, dmgUp: 1, dur: 5, fx: 'warpOut', stealth: true },
  ] },
  { id: 'nano', name: 'ナノ', school: 'future', glyph: '粒', color: '#d8ff5a', tiers: [
    { name: 'ナノ修復', desc: '少しずつ回復する。', kind: 'buff', cd: 8, regen: 3, dur: 6, fx: 'scanner' },
    { name: 'ナノ群体', desc: '機械の群れがまわりの敵をかじる。', kind: 'zone', cd: 5, dmg: 7, rad: 60, dur: 5, tick: 0.2, fx: 'nanoCloud', at: 'follow' },
    { name: '侵食ナノ', desc: '群れが広がり、敵を腐食（毒）させる。', kind: 'zone', cd: 5, dmg: 9, rad: 80, dur: 6, tick: 0.2, fx: 'nanoCloud', at: 'follow', st: S('poison', 3, 0.3, 1) },
    { name: 'グレイ・グー', desc: '群れが画面を覆い、全ての敵を分解する。', kind: 'nova', cd: 10, dmg: 40, rad: 400, n: 4, interval: 0.5, fx: 'disintegrate', st: S('poison', 5, 1, 2) },
  ] },
  { id: 'cryo', name: '冷凍技術', school: 'future', glyph: '冷', color: '#a6ecff', tiers: [
    { name: '冷凍弾', desc: '当たると凍らせることがある弾。', kind: 'bolt', cd: 0.7, dmg: 10, spd: 420, fx: 'laser', hit: 'iceHit', pal: 'ice', st: S('freeze', 1, 0.25) },
    { name: '液体窒素', desc: '前方に冷気を噴きつける。', kind: 'cone', cd: 3, dmg: 6, range: 100, arc: 0.6, dur: 1.5, tick: 0.12, fx: 'frostBreath', st: S('freeze', 0.8, 0.25) },
    { name: '冷凍地雷', desc: '踏むと凍りつく地雷を 3 つ。', kind: 'mine', cd: 2.6, dmg: 40, rad: 60, n: 3, scatter: 60, st: S('freeze', 2), boomFx: 'snowBurst' },
    { name: '極低温領域', desc: '絶対の冷気の領域。中の敵は凍り続け、砕け続ける。', kind: 'zone', cd: 10, dmg: 26, rad: 160, dur: 5, tick: 0.25, fx: 'blizzardZone', at: 'follow', st: S('freeze', 0.6) },
  ] },
  { id: 'magnet', name: '磁力', school: 'future', glyph: '磁', color: '#ff7a5a', tiers: [
    { name: '磁力弾', desc: '当たった所に敵を引き寄せる。', kind: 'bolt', cd: 1.1, dmg: 14, spd: 300, fx: 'plasma', boom: 50, boomFx: 'implosion', pull: true, pal: 'blood' },
    { name: '電磁ネット', desc: '網で敵を止める。', kind: 'zone', cd: 2.6, dmg: 8, rad: 50, dur: 2.5, tick: 0.3, fx: 'laserGrid', at: 'target', st: S('root', 1) },
    { name: 'レールガン', desc: '超高速の弾丸が一直線に貫く。', kind: 'beam', cd: 2, dmg: 70, len: 400, w: 8, fx: 'railBeam' },
    { name: '磁気嵐', desc: '強い磁場で敵を一点に集め、レールガン 6 連射で撃ち抜く。', kind: 'ult', ult: 'magstorm', cd: 10, dmg: 90 },
  ] },
  { id: 'turret', name: '自動砲台', school: 'future', glyph: '塔', color: '#9ab8d8', tiers: [
    { name: '自動砲台', desc: '撃ち続ける砲台を置く。', kind: 'summon', cd: 9, type: 'turret', n: 1, dur: 10, dmg: 9, rate: 0.35, range: 230 },
    { name: '双砲台', desc: '2 台。', kind: 'summon', cd: 9, type: 'turret', n: 2, dur: 10, dmg: 10, rate: 0.32, range: 240 },
    { name: 'ミサイル砲台', desc: '3 台、ミサイルも撃つ。', kind: 'summon', cd: 10, type: 'turret', n: 3, dur: 11, dmg: 12, rate: 0.3, range: 250, missile: true },
    { name: '防衛ライン', desc: '6 台の砲台がずらりと並ぶ。', kind: 'summon', cd: 14, type: 'turret', n: 6, dur: 12, dmg: 14, rate: 0.22, range: 300, missile: true },
  ] },
  { id: 'quantum', name: '量子', school: 'future', glyph: '量', color: '#5affd8', tiers: [
    { name: '量子弾', desc: '当たると 2 つに分かれる弾。', kind: 'bolt', cd: 0.9, dmg: 12, spd: 320, split: 2, fx: 'plasma', hit: 'zap', pal: 'cyber' },
    { name: '重ね合わせ', desc: '2 発、それぞれ 3 つに分かれる。', kind: 'bolt', cd: 1, dmg: 14, spd: 320, n: 2, spread: 0.3, split: 3, fx: 'plasma', hit: 'zap', pal: 'cyber' },
    { name: '量子もつれ', desc: 'もつれた 6 体を同時に打つ。', kind: 'chain', cd: 1.3, dmg: 28, jumps: 6, range: 260, pal: 'cyber' },
    { name: '確率崩壊', desc: 'すべての敵の「存在する確率」をゆがめ、3 度ランダムに崩壊させる。', kind: 'ult', ult: 'quantum', cd: 10, dmg: 70 },
  ] },
  { id: 'ai', name: '演算', school: 'future', glyph: '算', color: '#ffd24a', tiers: [
    { name: '予測射撃', desc: '外れない追尾弾。', kind: 'bolt', cd: 0.7, dmg: 11, spd: 300, home: 9, fx: 'laser', hit: 'zap', pal: 'gold' },
    { name: '戦術解析', desc: 'しばらく会心率 +30%。', kind: 'buff', cd: 10, crit: 0.3, dur: 6, fx: 'scanner' },
    { name: '過負荷', desc: 'しばらく詠唱の待ちを半分にする。', kind: 'buff', cd: 12, cdr: 0.5, dur: 5, fx: 'chargeUp' },
    { name: '全知演算', desc: 'すべての魔法の待ち時間を消し、8 秒間、威力と会心を大きく上げる。', kind: 'ult', ult: 'omni', cd: 20, dmg: 0 },
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
