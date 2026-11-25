// 音はすべてその場で合成する（ファイルなし）。効果音と、世界ごとの BGM。
let ac = null, master = null, sfxGain = null, bgmGain = null, muted = false, noiseBuf = null;
const last = {};

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ac.destination);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
  sfxGain = ac.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(comp);
  bgmGain = ac.createGain(); bgmGain.gain.value = 0.22; bgmGain.connect(comp);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export function setMuted(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.8; }
export const isMuted = () => muted;
export function setVolumes(s, b) { if (sfxGain) sfxGain.gain.value = s; if (bgmGain) bgmGain.gain.value = b; }

function tone(f, dur, type = 'square', vol = 0.3, slide = 0, delay = 0, dest = sfxGain) {
  if (!ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, freq = 1200, q = 1, type = 'bandpass', delay = 0, slide = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur); f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const SFX = {
  basic: () => tone(880, 0.06, 'triangle', 0.08, 1.6),
  cast: () => { tone(520, 0.12, 'triangle', 0.14, 2); tone(780, 0.1, 'sine', 0.08, 1.5, 0.03); },
  gun: () => { noise(0.08, 0.3, 2400, 0.8, 'highpass'); tone(160, 0.06, 'square', 0.1, 0.4); },
  laser: () => tone(1400, 0.12, 'sawtooth', 0.07, 0.3),
  zap: () => { noise(0.15, 0.2, 3000, 3); tone(900, 0.1, 'square', 0.06, 0.5); },
  beam: () => { tone(300, 0.3, 'sawtooth', 0.1, 3); noise(0.25, 0.12, 2000, 2); },
  nova: () => { tone(200, 0.4, 'sine', 0.25, 0.4); noise(0.35, 0.18, 800, 1, 'lowpass', 0, 0.3); },
  zone: () => tone(260, 0.3, 'triangle', 0.12, 0.6),
  flame: () => noise(0.4, 0.22, 600, 0.7, 'lowpass', 0, 2),
  water: () => noise(0.5, 0.2, 900, 0.8, 'bandpass', 0, 0.4),
  boom: () => { noise(0.45, 0.4, 500, 0.6, 'lowpass', 0, 0.2); tone(90, 0.35, 'sine', 0.35, 0.4); },
  thunder: () => { noise(0.6, 0.45, 1600, 0.5, 'lowpass', 0, 0.15); tone(60, 0.4, 'sawtooth', 0.15, 0.5); },
  nuke: () => { noise(2.2, 0.6, 300, 0.4, 'lowpass', 0, 0.2); tone(40, 2, 'sine', 0.5, 0.5); },
  summon: () => { [440, 660, 880].forEach((f, i) => tone(f, 0.15, 'triangle', 0.1, 1, i * 0.05)); },
  buff: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'sine', 0.1, 1, i * 0.04)); },
  heal: () => { [660, 880, 1320].forEach((f, i) => tone(f, 0.25, 'sine', 0.1, 1, i * 0.06)); },
  warp: () => { tone(200, 0.25, 'sine', 0.15, 6); noise(0.2, 0.1, 3000, 2); },
  dash: () => noise(0.12, 0.15, 1800, 1, 'highpass', 0, 0.4),
  click: () => tone(1200, 0.04, 'square', 0.08),
  hit: () => noise(0.05, 0.12, 2500, 1),
  kill: () => { noise(0.1, 0.15, 900, 1); tone(300, 0.08, 'square', 0.06, 0.5); },
  eshot: () => tone(420, 0.07, 'square', 0.035, 0.7),
  whoosh: () => noise(0.25, 0.12, 900, 1, 'bandpass', 0, 3),
  fuse: () => { for (let i = 0; i < 4; i++) tone(1600, 0.05, 'square', 0.06, 1, i * 0.14); },
  xp: () => tone(1500 + Math.random() * 300, 0.05, 'sine', 0.05),
  coin: () => { tone(1320, 0.06, 'square', 0.06); tone(1760, 0.1, 'square', 0.06, 1, 0.05); },
  gem: () => { [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, 1, i * 0.05)); },
  pick: () => { tone(660, 0.08, 'triangle', 0.12); tone(990, 0.12, 'triangle', 0.12, 1, 0.07); },
  open: () => { [392, 523, 659].forEach((f, i) => tone(f, 0.2, 'triangle', 0.1, 1, i * 0.08)); },
  clear: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'square', 0.07, 1, i * 0.1)); },
  levelup: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, 'square', 0.08, 1, i * 0.06)); },
  evolve: () => { [392, 523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.06, 1, i * 0.05)); },
  ult: () => { tone(110, 1.2, 'sawtooth', 0.18, 4); noise(1, 0.2, 400, 0.8, 'lowpass', 0, 6); [523, 784, 1046].forEach((f, i) => tone(f, 0.6, 'triangle', 0.1, 1, 0.3 + i * 0.08)); },
  freeze: () => { noise(0.6, 0.2, 5000, 4, 'bandpass', 0, 0.5); tone(1800, 0.5, 'sine', 0.08, 0.5); },
  shatter: () => { for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 2000, 0.08, 'triangle', 0.06, 0.6, i * 0.03); noise(0.3, 0.2, 4000, 1); },
  rumble: () => noise(1, 0.3, 120, 0.5, 'lowpass'),
  roar: () => { tone(80, 0.8, 'sawtooth', 0.25, 0.6); noise(0.8, 0.25, 300, 0.5, 'lowpass'); },
  alarm: () => { for (let i = 0; i < 3; i++) tone(880, 0.12, 'square', 0.07, 1, i * 0.2); },
  bow: () => { tone(300, 0.1, 'triangle', 0.1, 3); noise(0.1, 0.1, 3000, 2); },
  hurt: () => { tone(200, 0.2, 'sawtooth', 0.18, 0.4); noise(0.12, 0.2, 800, 1); },
  pdie: () => { [440, 330, 220, 110].forEach((f, i) => tone(f, 0.3, 'triangle', 0.15, 1, i * 0.12)); },
  bossdie: () => { noise(2, 0.5, 400, 0.5, 'lowpass', 0, 0.2); [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.4, 'square', 0.08, 1, 0.5 + i * 0.1)); },
  ui: () => tone(880, 0.05, 'triangle', 0.08),
};

export function sfx(name) {
  if (!ac || muted) return;
  const now = performance.now();
  if (last[name] && now - last[name] < 40) return;
  last[name] = now;
  const f = SFX[name]; if (f) f();
}

// ---------- BGM（短い繰り返しを合成で） ----------
const SONGS = [
  { tempo: 96, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], bass: [0, 0, 5, 3], lead: 'triangle', pad: 'sine', arp: [0, 2, 4, 7, 4, 2] },            // 森: A マイナー、穏やか
  { tempo: 120, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], bass: [0, 0, 3, 5], lead: 'square', pad: 'sawtooth', arp: [0, 4, 7, 4, 0, 7] },          // 街: ドリアン、刻む
  { tempo: 108, root: 52, scale: [0, 2, 4, 6, 7, 9, 11], bass: [0, 5, 3, 4], lead: 'sawtooth', pad: 'triangle', arp: [0, 2, 4, 6, 7, 6, 4, 2] },  // 星: リディアン、きらきら
  { tempo: 84, root: 45, scale: [0, 1, 3, 5, 6, 8, 10], bass: [0, 1, 0, 5], lead: 'sawtooth', pad: 'sine', arp: [0, 1, 4, 6, 4, 1] },            // 虚無: ロクリアン、重い
  { tempo: 140, root: 45, scale: [0, 2, 3, 5, 7, 8, 11], bass: [0, 0, 5, 6], lead: 'square', pad: 'sawtooth', arp: [0, 3, 7, 3, 0, 7, 8, 7] },   // ボス
  { tempo: 80, root: 60, scale: [0, 2, 4, 7, 9], bass: [0, 3, 4, 2], lead: 'triangle', pad: 'sine', arp: [0, 2, 4, 2] },                         // タイトル
];
let song = -1, timer = null, stepN = 0;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export function playSong(i) {
  if (i === song) return;
  song = i; stepN = 0;
  if (timer) clearInterval(timer);
  if (i < 0 || !ac) return;
  const S = SONGS[i], stepDur = 60 / S.tempo / 2;
  timer = setInterval(() => {
    if (!ac || muted || ac.state !== 'running') { stepN++; return; }
    const bar = Math.floor(stepN / 8) % S.bass.length, deg = S.bass[bar];
    const note = (d, oct = 0) => S.root + S.scale[((d % S.scale.length) + S.scale.length) % S.scale.length] + 12 * (oct + Math.floor(d / S.scale.length));
    if (stepN % 4 === 0) tone(mtof(note(deg, -1)), stepDur * 3.5, 'triangle', 0.35, 1, 0, bgmGain);
    if (stepN % 8 === 0) { tone(mtof(note(deg + 2, 0)), stepDur * 7, S.pad, 0.07, 1, 0, bgmGain); tone(mtof(note(deg + 4, 0)), stepDur * 7, S.pad, 0.06, 1, 0, bgmGain); }
    const a = S.arp[stepN % S.arp.length];
    if ((stepN * 7) % 5 !== 3) tone(mtof(note(deg + a, 1)), stepDur * 0.9, S.lead, 0.07, 1, 0, bgmGain);
    if (i === 1 || i === 4) { if (stepN % 2 === 0) noise(0.04, 0.08, 8000, 1, 'highpass'); if (stepN % 4 === 2) noise(0.12, 0.12, 1500, 1); }
    if (stepN % 8 === 0 && (i === 1 || i === 4)) tone(60, 0.15, 'sine', 0.3, 0.5, 0, bgmGain);
    stepN++;
  }, stepDur * 1000);
}
