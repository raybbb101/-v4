// 画面の文字・カード・魔導書など（DOM）
import { SPELL, SPELLS, RELIC, META, TIER_NAMES, TIER_COLORS, tierOf, spellAt, SCHOOLS, MAX_LV } from './spells.js';
import { BIOMES, DIFFS } from './enemies.js';

export const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 魔法のアイコン（その場で描く） ----------
const iconCache = {};
export function spellIcon(id, lv = 1) {
  const sp = SPELL[id], tier = tierOf(lv), key = id + ':' + tier;
  if (iconCache[key]) return iconCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d');
  const col = sp.color;
  g.fillStyle = '#0c0818'; g.fillRect(0, 0, 32, 32);
  const gr = g.createRadialGradient(16, 14, 2, 16, 16, 20); gr.addColorStop(0, col); gr.addColorStop(0.55, shade(col, -0.45)); gr.addColorStop(1, '#0c0818');
  g.fillStyle = gr; g.fillRect(1, 1, 30, 30);
  // 段階ごとの飾り
  g.strokeStyle = TIER_COLORS[tier]; g.lineWidth = 1;
  if (tier >= 1) { g.strokeRect(2.5, 2.5, 27, 27); }
  if (tier >= 2) { g.fillStyle = TIER_COLORS[tier]; for (const [x, y] of [[2, 2], [28, 2], [2, 28], [28, 28]]) g.fillRect(x, y, 2, 2); }
  if (tier >= 3) { g.strokeStyle = '#fff0a0'; g.beginPath(); g.arc(16, 16, 13, 0, Math.PI * 2); g.stroke(); }
  g.font = '18px DotGothic16, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#0c0818'; g.fillText(sp.glyph, 17, 18);
  g.fillStyle = '#ffffff'; g.fillText(sp.glyph, 16, 17);
  return (iconCache[key] = c.toDataURL());
}
function shade(h, k) { const n = parseInt(h.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
export function relicIcon(id) { return RELIC[id].glyph; }

// ---------- 表示の切り替え ----------
export function show(id, v = true) { $(id).classList.toggle('hidden', !v); }
export function toast(text) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = text;
  $('toasts').appendChild(d); setTimeout(() => d.remove(), 2600);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
}
export function banner(text, sub = '') {
  const b = $('banner'); b.classList.add('hidden'); void b.offsetWidth;
  $('bannerText').textContent = text; $('bannerSub').textContent = sub; b.classList.remove('hidden');
  clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.add('hidden'), 2200);
}
export function cutin(e, who) {
  const c = $('cutin'); c.classList.add('hidden'); void c.offsetWidth;
  c.style.setProperty('--uc', e.col);
  $('cutGlyph').textContent = e.glyph; $('cutName').textContent = e.name; $('cutEn').textContent = e.en || 'ULTIMATE'; $('cutWho').textContent = who ? who + ' のアルティメット' : '';
  c.classList.remove('hidden');
  clearTimeout(cutin.t); cutin.t = setTimeout(() => c.classList.add('hidden'), 1650);
}
export function chatLine(el, name, text, sys) {
  const d = document.createElement('div'); d.className = sys ? 'sys' : 'm';
  d.innerHTML = sys ? esc(text) : `<b>${esc(name)}</b>${esc(text)}`;
  el.appendChild(d); el.scrollTop = el.scrollHeight;
  while (el.children.length > 40) el.firstChild.remove();
  if (el.id === 'chatLog') setTimeout(() => d.remove(), 20000);
}

// ---------- HUD ----------
let slotsBuilt = '';
export function hud(view, me, opts) {
  const p = view.players.find((q) => q.id === me); if (!p) return;
  $('lvBadge').textContent = 'Lv ' + p.lv;
  $('hpFill').style.width = (100 * Math.max(0, p.hp) / p.mhp) + '%';
  $('hpText').textContent = `${Math.max(0, p.hp)} / ${p.mhp}`;
  $('shFill').style.width = Math.min(100, p.sh) + '%';
  $('xpFill').style.width = (100 * p.xp / p.xpn) + '%';
  $('goldText').textContent = '🪙 ' + p.gold; $('crysText').textContent = '💎 ' + view.crystals; $('killText').textContent = '☠ ' + view.kills;
  $('btnAuto').textContent = p.auto ? '自動詠唱 ON' : '自動詠唱 OFF';
  const B = BIOMES[view.biome];
  $('roomName').textContent = view.roomType === 'boss' ? B.name + ' ・ ボス' : `${B.name}  ${view.room} / 6`;
  $('roomSub').textContent = (view.depth >= BIOMES.length ? `深淵 ${view.depth - BIOMES.length + 1} 周目 ・ ` : '') + B.sub;
  // 魔法の枠
  const sig = p.spells.map((s) => s[0] + s[1]).join(',');
  if (sig !== slotsBuilt) {
    slotsBuilt = sig;
    $('slots').innerHTML = p.spells.map((s, i) => { const sp = spellAt(s[0], s[1]); return `<div class="slot${sp.tier === 3 ? ' ult' : ''}" data-i="${i}" style="--tc:${TIER_COLORS[sp.tier]}" title="${esc(sp.name)}（${TIER_NAMES[sp.tier]}）"><img src="${spellIcon(s[0], s[1])}" alt=""><div class="cd"></div><span class="key">${i + 1}</span><span class="lv">${s[1] >= MAX_LV ? 'MAX' : 'Lv' + s[1]}</span></div>`; }).join('');
    $('slots').querySelectorAll('.slot').forEach((el) => el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); opts.onSlot(+el.dataset.i); }));
  }
  $('slots').querySelectorAll('.slot').forEach((el, i) => { const s = p.spells[i]; if (!s) return; el.querySelector('.cd').style.height = (s[2] * 100) + '%'; el.classList.toggle('ready', s[2] <= 0); });
  $('dashFill').style.width = (100 * (1 - Math.min(1, p.dcd / 1))) + '%';
  // 秘宝
  const rsig = p.relics.join(',');
  if ($('relicRow').dataset.sig !== rsig) { $('relicRow').dataset.sig = rsig; $('relicRow').innerHTML = p.relics.map((r) => `<span class="relic" title="${esc(RELIC[r].name)}：${esc(RELIC[r].desc)}">${RELIC[r].glyph}</span>`).join(''); }
  // 仲間
  const others = view.players.filter((q) => q.id !== me);
  $('allies').innerHTML = others.map((q) => `<div class="ally"><span style="color:${['#8a7cff', '#ff6a7a', '#5ad890', '#ffd24a'][q.slot % 4]}">${esc(q.name)} Lv${q.lv}</span><div class="bar hp"><div style="width:${100 * Math.max(0, q.hp) / q.mhp}%"></div></div>${q.dead ? '<span>💀</span>' : ''}<span class="allySlots">${q.spells.map((s) => `<img src="${spellIcon(s[0], s[1])}" class="${s[2] > 0 ? 'cd' : ''}" alt="">`).join('')}</span></div>`).join('');
  // ボス
  $('hud').classList.toggle('boss', !!view.boss);
  if (view.boss) { show('bossBar'); $('bossName').textContent = view.boss.name + (view.boss.p2 ? ' 〈本気〉' : ''); $('bossFill').style.width = (100 * view.boss.hp / view.boss.mhp) + '%'; }
  else show('bossBar', false);
}

export function exitLabels(view, toScreen) {
  const L = $('labels');
  const R = { spell: ['魔導書', '新しい魔法か強化'], gold: ['金貨', 'たくさんの金貨'], heal: ['回復', 'HP を大きく回復'], relic: ['秘宝', '強い秘宝を 1 つ'], shop: ['商人', '買い物ができる'], rest: ['泉', '全員回復＋最大 HP'], boss: ['ボス', 'この層の主'] };
  const T = { fight: '戦い', elite: '精鋭', treasure: '宝物庫', shop: '', rest: '', boss: '' };
  const C = { fight: '#9a7cff', elite: '#ffc23d', treasure: '#7ff6ff', shop: '#7ee88a', rest: '#7ff6ff', boss: '#ff4a6a' };
  const html = view.exits.map((e) => {
    const s = toScreen(e.x, e.y); const r = R[e.reward] || ['?', ''];
    return `<div class="exitLabel" style="left:${s.x}px;top:${s.y - 40}px;--c:${C[e.type]}"><b>${T[e.type] ? T[e.type] + '・' : ''}${r[0]}</b>${r[1]}</div>`;
  }).join('');
  if (L.innerHTML !== html) L.innerHTML = html;
}

// ---------- カード ----------
export function showChoices(ch, rerolls, onPick, onReroll, onSkip) {
  const titles = { start: ['最初の魔法を選ぼう', 'ファンタジー・現代・未来から 1 つずつ。Lv が上がると、初級 → 中級 → 上級 → アルティメットへ進化する。'], level: ['レベルアップ！', '魔法を覚えるか、育てる'], chest: ['宝箱', '強い強化（+2 Lv のこともある）'], relic: ['秘宝', '1 つ選ぼう'], upgrade: ['魔導書のページ', '強化する魔法を選ぼう'], boss: ['ボスの宝', '1 つ選ぼう'] };
  const [t, s] = titles[ch.k] || titles.level;
  $('choiceTitle').textContent = t; $('choiceSub').textContent = s;
  $('cards').innerHTML = ch.c.map((c, i) => cardHtml(c, i)).join('');
  $('cards').querySelectorAll('.card').forEach((el) => el.addEventListener('click', () => onPick(+el.dataset.i)));
  $('rerollN').textContent = rerolls;
  $('btnReroll').disabled = rerolls <= 0 || ch.k === 'start';
  $('btnReroll').onclick = onReroll;
  $('btnSkip').classList.toggle('hidden', ch.k === 'start');
  $('btnSkip').onclick = onSkip;
  show('choice');
}
function cardHtml(c, i) {
  if (c.t === 'spell') {
    const sp = SPELL[c.id], at = spellAt(c.id, c.lv), tc = TIER_COLORS[at.tier];
    const prevTier = c.isNew ? -1 : tierOf(c.lv - 1);
    const evo = !c.isNew && at.tier !== prevTier;
    const tiers = sp.tiers.map((t, k) => `<span class="${k === at.tier ? 'now' : k < at.tier ? 'on' : ''}">${['初', '中', '上', '極'][k]} ${esc(t.name)}${t.en ? ' 〈' + esc(t.en) + '〉' : ''}</span>`).join('');
    return `<button class="card" data-i="${i}" style="--tc:${tc}"><span class="key">${i + 1}</span>${evo ? `<span class="evo">${at.tier === 3 ? 'アルティメット覚醒！' : '進化！'}</span>` : ''}
      <div class="head"><img src="${spellIcon(c.id, c.lv)}" alt=""><div><div class="nm">${esc(at.name)}</div><span class="tag">${c.isNew ? '新しい魔法' : 'Lv ' + (c.lv - 1) + ' → ' + c.lv} ・ ${TIER_NAMES[at.tier]} ・ ${SCHOOLS[sp.school]}</span></div></div>
      <div class="desc">${esc(at.desc)}</div><div class="tiers">${tiers}</div></button>`;
  }
  if (c.t === 'relic') { const r = RELIC[c.id]; return `<button class="card" data-i="${i}" style="--tc:#c684ff"><span class="key">${i + 1}</span><div class="head"><div class="relic" style="width:56px;height:56px;font-size:28px">${r.glyph}</div><div><div class="nm">${esc(r.name)}</div><span class="tag">秘宝</span></div></div><div class="desc">${esc(r.desc)}</div></button>`; }
  if (c.t === 'heal') return `<button class="card" data-i="${i}" style="--tc:#7ee88a"><div class="nm">回復</div><div class="desc">HP を ${c.v} 回復</div></button>`;
  if (c.t === 'maxhp') return `<button class="card" data-i="${i}" style="--tc:#ff7a8a"><div class="nm">生命の器</div><div class="desc">最大 HP +${c.v}</div></button>`;
  return '';
}

// ---------- 店 ----------
export function showShop(shop, me, gold, onBuy) {
  $('shopGold').textContent = '🪙 ' + gold;
  $('shopItems').innerHTML = shop.map((it) => `<button class="item${it.sold[me] ? ' sold' : ''}" data-i="${it.i}" ${it.sold[me] || gold < it.price ? 'disabled' : ''}>${it.t === 'spell' ? `<img src="${spellIcon(it.id, 1)}" width="32" height="32" alt="">` : ''}<span class="nm">${esc(it.name)}</span><span>${esc(it.desc)}</span><span class="pr">🪙 ${it.price}${it.sold[me] ? '（購入済み）' : ''}</span></button>`).join('');
  $('shopItems').querySelectorAll('.item').forEach((el) => el.addEventListener('click', () => onBuy(+el.dataset.i)));
  show('shop');
}

// ---------- 魔導書 ----------
export function showBook(save, tab = 'fantasy') {
  const known = save.seen || {};
  $('bookCount').textContent = `${Object.keys(known).length} / ${SPELLS.length}`;
  $('bookTabs').innerHTML = Object.entries(SCHOOLS).map(([k, v]) => `<button data-k="${k}" aria-pressed="${k === tab}">${v}</button>`).join('');
  $('bookTabs').querySelectorAll('button').forEach((b) => (b.onclick = () => showBook(save, b.dataset.k)));
  $('bookGrid').innerHTML = SPELLS.filter((s) => s.school === tab).map((s) => {
    const k = known[s.id] || 0;
    return `<div class="bk${k ? '' : ' unknown'}"><img src="${spellIcon(s.id, Math.max(1, k))}" alt=""><div class="t"><b>${k ? esc(s.name) : '？？？'}</b>${s.tiers.map((t, i) => { const reached = k >= [1, 3, 6, 10][i]; return `<div class="tier" style="--c:${TIER_COLORS[i]}"><i>${TIER_NAMES[i]}</i><span>${reached ? esc(t.name) + (t.en ? ' 〈' + esc(t.en) + '〉' : '') : '・・・'}</span></div>`; }).join('')}${k ? `<span style="color:#a89cd0">${esc(s.tiers[tierOf(k)].desc)}</span>` : ''}</div></div>`;
  }).join('');
  show('book');
}

// ---------- 祭壇 ----------
export function showAltar(save, onBuy) {
  $('altarCrystals').textContent = save.crystals;
  $('altarItems').innerHTML = META.map((m) => {
    const l = save.meta[m.id] || 0, max = l >= m.max, cost = m.cost(l);
    return `<button class="item" data-id="${m.id}" ${max || save.crystals < cost ? 'disabled' : ''}><span class="nm">${esc(m.name)} ${'◆'.repeat(l)}${'◇'.repeat(m.max - l)}</span><span>${esc(m.desc)}</span><span class="pr">${max ? '最大' : '💎 ' + cost}</span></button>`;
  }).join('');
  $('altarItems').querySelectorAll('.item').forEach((el) => el.addEventListener('click', () => onBuy(el.dataset.id)));
  show('altar');
}

export function showDiffs(sel, onPick) {
  $('diffPick').innerHTML = DIFFS.map((d, i) => `<button data-i="${i}" aria-pressed="${i === sel}">${d.name}</button>`).join('');
  $('diffDesc').textContent = DIFFS[sel].desc;
  $('diffPick').querySelectorAll('button').forEach((b) => (b.onclick = () => onPick(+b.dataset.i)));
}

export function pauseSpells(p) {
  $('pauseSpells').innerHTML = p ? p.spells.map((s) => { const at = spellAt(s[0], s[1]); return `<div class="ps"><b style="color:${TIER_COLORS[at.tier]}">${esc(at.name)}</b> Lv${s[1]} ・ ${TIER_NAMES[at.tier]}<br>${esc(at.desc)}</div>`; }).join('') : '';
}
