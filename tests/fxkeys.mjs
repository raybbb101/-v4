import { FXDEF } from '../js/fxreg.js';
import { readFileSync } from 'fs';
const src = readFileSync(new URL('../js/sim.js', import.meta.url), 'utf8') + readFileSync(new URL('../js/spells.js', import.meta.url), 'utf8');
const keys = new Set();
for (const m of src.matchAll(/fx\(G, '([a-zA-Z]+)'/g)) keys.add(m[1]);
for (const m of src.matchAll(/(?:fx|hit|boomFx|muzzle|fxE?): '([a-zA-Z]+)'/g)) keys.add(m[1]);
const missing = [...keys].filter((k) => !FXDEF[k]);
console.log('keys', keys.size, 'missing:', missing.join(', ') || 'none');
let bad = 0; for (const [k, d] of Object.entries(FXDEF)) if (!d.custom && (!d.m || !d.m.meta)) { console.log('no module for', k); bad++; }
for (const [k, d] of Object.entries(FXDEF)) for (const e of [...(d.extra || []), d.then?.k].filter(Boolean)) if (!FXDEF[e]) console.log('bad extra', k, e);
console.log('bad modules', bad);
