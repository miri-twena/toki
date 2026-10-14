// Toki - game logic. Plain JavaScript, no libraries.

// ---------- saved progress ----------
const SAVE_KEY = 'toki-save-v1';
const fresh = () => ({ coins: 0, prizeDone: false, helperSeen: false, name: '', stars: {}, muted: false, diff: 1, bosses: {}, dict: [] });
let S = fresh();
try { S = { ...fresh(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch (e) { /* no storage: play without saving */ }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
const stars = (w, l) => S.stars[`${w}-${l}`] || 0;

// ---------- small helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const app = $('#app');
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// a yes/no question shown inside the page
function ask(text, yes, onYes) {
  const d = document.createElement('div');
  d.className = 'ask';
  d.innerHTML = `<div class="ask-box"><p>${text}</p><div class="btn-row">
    <button class="big-btn" id="askYes">${yes}</button><button class="big-btn soft" id="askNo">ביטול</button></div></div>`;
  document.body.appendChild(d);
  $('#askYes', d).onclick = () => { d.remove(); onYes(); };
  $('#askNo', d).onclick = () => d.remove();
}

// ---------- speech (the browser's built-in voice) ----------
const canSpeak = 'speechSynthesis' in window;
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  const en = vs.filter((v) => /^en[-_]/i.test(v.lang));
  voice = en.find((v) => /en[-_]US/i.test(v.lang) && /natural|aria|jenny|zira|google|samantha/i.test(v.name))
    || en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || null;
}
if (canSpeak) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text, rate = 0.9) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  if (voice) u.voice = voice;
  u.rate = rate;
  speechSynthesis.speak(u);
}

// ---------- sound effects (generated, no files) ----------
let actx = null;
function tone(freqs, dur = 0.12, type = 'sine', vol = 0.15) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      const t = actx.currentTime + i * dur;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur * 1.7);
    });
  } catch (e) {}
}
const sfx = {
  good: () => tone([660, 880], 0.1, 'triangle'),
  coin: () => tone([1320, 1760], 0.07, 'square', 0.06),
  bad: () => tone([300, 240], 0.15, 'sine', 0.12),
  win: () => tone([523, 659, 784, 1046], 0.13, 'triangle'),
};

// ---------- Toki, drawn with HTML and CSS ----------
function toki(mood = 'idle', size = 120, extra = '') {
  const cls = [mood, S.helperSeen ? 'has-mic' : '', S.prizeDone ? 'has-hat' : '', extra].join(' ');
  return `<div class="toki ${cls}" style="--size:${size}px">
    <div class="hat">👑</div>
    <div class="arm l"></div><div class="arm r"></div>
    <div class="leg l"></div><div class="leg r"></div>
    <div class="body">
      <div class="eye l"><i></i></div><div class="eye r"><i></i></div>
      <div class="cheek l"></div><div class="cheek r"></div>
      <div class="mouth"></div>
    </div>
    <div class="mic">🎤</div>
  </div>`;
}
function setMood(mood, ms) {
  const t = $('.game .toki');
  if (!t) return;
  t.classList.remove('idle', 'happy', 'sad', 'dance');
  void t.offsetWidth; // restart the animation
  t.classList.add(mood);
  if (ms) setTimeout(() => setMood('idle'), ms);
}
function bubble(html) { const b = $('#bubble'); if (b) { b.innerHTML = html; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } }

// ---------- pictures ----------
function item(it) {
  const tf = `${it.r ? `rotate(${it.r}deg)` : ''} ${it.flip ? 'scaleX(-1)' : ''}`;
  const style = `left:${it.x}%;top:${it.y}%;--s:${it.s};${it.f ? `filter:${it.f};` : ''}${tf.trim() ? `--tf:${tf};` : ''}`;
  if (it.k.startsWith('#')) return `<div class="it svg" style="${style}">${SVGS[it.k.slice(1)]}</div>`;
  return `<div class="it" style="${style}">${it.k}</div>`;
}
const picture = (items) => `<div class="pic">${items.map(item).join('')}</div>`;
const wordPicture = (w) => picture([I(w.pic, 50, 52, w.pic.startsWith('#') ? 78 : 58)]);

// ---------- coins and the prize bar ----------
function updateBar() {
  const ci = $('.coinbox .coin'); if (ci && !ci.firstElementChild) ci.innerHTML = px('coin', 3);
  $('#coinCount').textContent = S.coins;
  $('#prizeFill').style.width = `${Math.min(100, (S.coins / PRIZE_GOAL) * 100)}%`;
  $('#prizeText').textContent = S.prizeDone ? 'זכית בפרס! 🏆'
    : S.coins >= PRIZE_GOAL ? '🎁 הפרס מחכה לך!' : `עוד ${PRIZE_GOAL - S.coins} לפרס 🎁`;
}
function addCoins(n, label) {
  S.coins += n; save(); updateBar(); sfx.coin();
  const box = $('.coinbox');
  box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
  const p = document.createElement('div');
  p.className = 'coin-pop'; p.innerHTML = `+${n} ${px('coin', 2)} ${label || ''}`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1300);
}
const prizeWaiting = () => S.coins >= PRIZE_GOAL && !S.prizeDone;

// ---------- screens ----------
function showBar(on) { $('#topbar').hidden = !on; if (on) updateBar(); }

function titleScreen() {
  showBar(false);
  app.innerHTML = `<section class="screen title">
    <div class="title-toki">${toki('dance', 170)}</div>
    <h1 class="logo" dir="ltr">Toki</h1>
    <p class="tag">לומדים אנגלית עם Toki</p>
    <div class="title-abc" dir="ltr">${['A', 'B', 'C'].map((l, i) => `<span style="--h:${[350, 200, 45][i]};--d:${-i * .4}s">${l}</span>`).join('')}</div>
    <button class="big-btn" id="go">יאללה, מתחילים! ▶</button>
    ${canSpeak ? '' : '<p class="note">שימו לב: הדפדפן הזה לא תומך בהקראה בקול. מומלץ Chrome או Edge.</p>'}
    <p class="credit">נוצר ע"י לביא טוינה</p>
  </section>`;
  $('#go').onclick = () => { tone([1], 0.01, 'sine', 0.0001); diffScreen(mapScreen); };
}

function starsHTML(n, cell = 3) { return [1, 2, 3].map((i) => `<span class="${i <= n ? 'on' : ''}">${px('star', cell, i <= n ? {} : { y: 'q', Y: 'w' })}</span>`).join(''); }
function hpHTML(hp, max) { return Array.from({ length: max }, (_, i) => px('heart', 3, i < hp ? {} : { r: 's', R: 'S' })).join(''); }

// the 4 overall difficulties, picked when the game starts
const DIFFS = [
  { icon: '🐣', spr: 'chick', name: 'מתחילים', choices: 3, helper: 5, rate: 0.7, autoRead: true, firstLetter: true, decoys: 0, listenOnly: false,
    desc: '3 אפשרויות לבחירה, Toki מקריא לאט, 5 עזרות בכל שלב, ובאיות האות הראשונה כבר במקום.' },
  { icon: '🙂', spr: 'smile', name: 'רגיל', choices: 4, helper: 3, rate: 0.85, autoRead: true, firstLetter: false, decoys: 0, listenOnly: false,
    desc: '4 אפשרויות לבחירה ו-3 עזרות בכל שלב.' },
  { icon: '💪', spr: 'shield', name: 'מתקדמים', choices: 4, helper: 2, rate: 0.95, autoRead: true, firstLetter: false, decoys: 2, listenOnly: false,
    desc: '2 עזרות בכל שלב, ובאיות יש 2 אותיות מיותרות שצריך לזהות.' },
  { icon: '🏆', spr: 'trophy', name: 'אלופים', choices: 4, helper: 1, rate: 1, autoRead: false, firstLetter: false, decoys: 3, listenOnly: true,
    desc: 'עזרה אחת בכל שלב, המילים לא מוקראות מעצמן, ובאיות רק שומעים את המילה, בלי תמונה ועם 3 אותיות מיותרות.' },
];
const D = () => DIFFS[S.diff] || DIFFS[1];

function diffScreen(next) {
  showBar(false);
  app.innerHTML = `<section class="screen diff">
    <div class="map-head">${toki('happy', 90)}<div class="say-box">באיזו רמה משחקים היום?</div></div>
    <div class="diffs">
      ${DIFFS.map((d, i) => `<button class="diff-card ${i === (S.diff ?? 1) ? 'chosen' : ''}" data-i="${i}">
        <span class="diff-icon">${px(d.spr, 6)}</span><b>${d.name}</b><span class="diff-desc">${d.desc}</span></button>`).join('')}
    </div>
    <p class="small">אפשר להחליף רמה בכל זמן ממסך הבית.</p>
  </section>`;
  app.querySelectorAll('.diff-card').forEach((b) => (b.onclick = () => { S.diff = +b.dataset.i; save(); sfx.good(); next(); }));
}

// the 5 levels: the same ladder in every world, easy to hard
const LEVELS = [
  { n: 1, name: 'מילים', game: '⛏️', hint: 'שברו את הבלוק עם התמונה שמתאימה למילה! ⛏️' },
  { n: 2, name: 'משפטים', game: '🎣', hint: 'קראו את המשפט ודוגו את הדג עם התמונה הנכונה! 🎣' },
  { n: 3, name: 'תמונה למשפט', game: '🚀', hint: 'שגרו לחלל את הטיל עם המשפט שמתאים לתמונה! 🚀' },
  { n: 4, name: 'איות', game: '🧱', hint: 'הקשיבו ותפסו את הבלוקים הנופלים לפי הסדר! 🧱' },
  { n: 5, name: 'השלמת משפט', game: '✋', hint: 'גררו את המילה החסרה אל המקום הריק! ✋' },
];
const unlocked = (w, l) => l === 1 || stars(w, l - 1) > 0;

function mapScreen() {
  showBar(true);
  if (canSpeak) speechSynthesis.cancel();
  app.innerHTML = `<section class="screen map">
    <div class="map-head">
      ${toki('idle', 90)}
      <div class="say-box">לאיזה אי נלך היום? בחרו עולם ושלב.</div>
    </div>
    <button class="diff-chip" id="diffBtn">רמה: ${px(D().spr, 2)} ${D().name} · להחליף</button>
    ${prizeWaiting() ? '<button class="big-btn prize-btn" id="prizeGo">🎁 צברת 20 מטבעות! לחצו לפרס</button>' : ''}
    <div class="islands">
      ${allWorlds().map((w) => `<div class="island ${w.custom ? 'dict' : ''}" style="--c:${w.color}">
          <div class="island-top"><span class="island-icon">${px(w.id, 6)}</span><h2>${w.name}</h2>
            ${w.custom ? `<button class="edit-btn" id="dictEdit">✏️ ${w.words.length ? `${w.words.length} מילים · לערוך` : 'הכניסו את המילים להכתבה'}</button>` : ''}</div>
          ${LV(w).map((L) => {
            const open = (!w.custom || w.words.length > 0) && unlocked(w.id, L.n);
            return `<button class="lvl ${open ? '' : 'locked'}" data-w="${w.id}" data-l="${L.n}" ${open ? '' : 'disabled'}>
              <span>${open ? '' : px('lock', 3) + ' '}${L.n}. ${L.name} ${open ? L.game : ''}</span><span class="stars">${open ? starsHTML(stars(w.id, L.n)) : ''}</span></button>`;
          }).join('')}
          ${(() => {
            const b = BOSSES[w.id], open = stars(w.id, 5) > 0 && (!w.custom || w.words.length > 0), won = S.bosses[w.id];
            return `<button class="lvl boss-lvl ${open ? '' : 'locked'}" data-boss="${w.id}" ${open ? '' : 'disabled'}>
              <span>${open ? px(b.spr, 2) : px('lock', 3)} בוס: ${b.name}</span><span>${won ? px('trophy', 3) : ''}</span></button>`;
          })()}
          <div class="waves"></div>
        </div>`).join('')}
    </div>
    <button class="link-btn" id="reset">התחלה מחדש (מוחק את ההתקדמות)</button>
    <p class="credit">נוצר ע"י לביא טוינה</p>
  </section>`;
  app.querySelectorAll('.lvl:not(.locked)').forEach((b) => (b.onclick = () => (b.dataset.boss ? startBoss(b.dataset.boss) : startLevel(b.dataset.w, +b.dataset.l))));
  if ($('#prizeGo')) $('#prizeGo').onclick = prizeScreen;
  $('#diffBtn').onclick = () => diffScreen(mapScreen);
  if ($('#dictEdit')) $('#dictEdit').onclick = dictEditor;
  $('#reset').onclick = () => ask('למחוק את כל המטבעות וההתקדמות?', 'כן, למחוק', () => { S = fresh(); save(); mapScreen(); });
}

function helperScreen(next) {
  showBar(true);
  app.innerHTML = `<section class="screen helper">
    <div class="sparkle">✨</div>
    ${toki('happy', 170, 'has-mic gift')}
    <h1>קיבלת עוזר!</h1>
    <p>הגעת לשלב 2, ו-Toki קיבל מיקרופון.<br>
    מעכשיו קוראים משפטים לבד. אם משפט קשה, לחצו על <b>כפתור המיקרופון 🎤</b> ו-Toki יקריא אותו לאט.</p>
    <p class="small">אפשר להיעזר בו ${D().helper} פעמים בכל שלב, אז כדאי לנסות קודם לבד.</p>
    <button class="big-btn" id="ok">תודה Toki! ▶</button>
  </section>`;
  sfx.win();
  $('#ok').onclick = () => { S.helperSeen = true; save(); say('Hi! I can read for you.', 0.85); next(); };
}

// ---------- building questions for levels 3 and 5 ----------
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'i', 'in', 'on', 'to', 'has', 'have', 'my']);
const tokens = (t) => t.toLowerCase().replace(/[.,!?]/g, '').split(' ');
// level 3: the two sentences of the world that look most like this one
function lookalikes(w, s) {
  const mine = tokens(s.en).filter((t) => !STOP.has(t));
  const score = (o) => tokens(o.en).filter((t) => mine.includes(t)).length + Math.random() * 0.9;
  return w.sentences.filter((o) => o !== s).map((o) => [score(o), o]).sort((a, b) => b[0] - a[0]).slice(0, 2).map((x) => x[1]);
}
const plural = (word) => (/(s|sh|ch|x)$/.test(word) ? word + 'es' : word + 's');
// level 5: hide one of the world's words in each sentence
function blanks(w) {
  const out = [];
  w.sentences.forEach((s) => {
    const parts = s.en.split(' ');
    let hit = null;
    parts.forEach((p, i) => {
      const t = p.toLowerCase().replace(/[.,!?]/g, '');
      w.words.forEach((wd) => {
        const base = wd.en.toLowerCase();
        if (t === base) hit = { i, wd, many: false };
        else if (t === plural(base) || t === base + 's') hit = { i, wd, many: true };
      });
    });
    if (!hit) return;
    const form = (wd) => (hit.many ? plural(wd.en) : wd.en);
    const answer = parts[hit.i].replace(/[.,!?]/g, '');
    const end = parts[hit.i].slice(answer.length);
    const others = shuffle(w.words.filter((x) => x !== hit.wd)).slice(0, 3).map(form);
    out.push({ ...s, before: parts.slice(0, hit.i).join(' '), after: end + ' ' + parts.slice(hit.i + 1).join(' '), answer, choices: shuffle([answer, ...others]) });
  });
  return out;
}

// ---------- playing a level ----------
let G = null;

// a cute boss waits at the end of every world; right answers knock it out
const BOSSES = {
  school: { icon: '👾', spr: 'monster', name: 'מפלצת הבלגן' },
  food: { icon: '🦖', spr: 'dino', name: 'דינו הרעב' },
  animals: { icon: '🐲', spr: 'dragon', name: 'הדרקון הישנוני' },
  home: { icon: '👻', spr: 'ghost', name: 'רוח הבית' },
  sport: { icon: '🤖', spr: 'robot', name: 'רובו-שוער' },
  weather: { icon: '🐙', spr: 'octopus', name: 'תמנון הגשם' },
  travel: { icon: '👽', spr: 'alien', name: 'החייזר האבוד' },
  body: { icon: '🦠', spr: 'germ', name: 'חיידק השיעול' },
};
const bossHP = () => 5 + (S.diff ?? 1);

function startLevel(wid, lvl) {
  const w = findWorld(wid);
  if (lvl >= 2 && !S.helperSeen && !w.custom) return helperScreen(() => startLevel(wid, lvl));
  const items = w.custom || lvl === 1 || lvl === 4 ? w.words : lvl === 5 ? blanks(w) : w.sentences;
  G = { w, lvl, queue: shuffle(items).map((it) => ({ it, repeat: false })), total: items.length, pos: 0, firstOK: 0, streak: 0, earned: 0, helper: D().helper, busy: false };
  question();
}

// the boss mixes question types from the whole world
function bossQueue(w) {
  const qs = [
    ...w.words.map((it) => ({ it, type: 1 })),
    ...w.sentences.map((it) => ({ it, type: 2 })),
    ...blanks(w).map((it) => ({ it, type: 5 })),
    ...((S.diff ?? 1) >= 2 ? w.sentences.map((it) => ({ it, type: 3 })) : []),
  ];
  return shuffle(qs).slice(0, 16).map((x) => ({ ...x, repeat: false }));
}
function startBoss(wid) {
  const w = findWorld(wid);
  if (!S.helperSeen && !w.custom) return helperScreen(() => startBoss(wid));
  G = { w, lvl: 'boss', boss: BOSSES[wid], hp: bossHP(), maxHp: bossHP(), queue: w.custom ? dictBossQueue(w) : bossQueue(w), pos: 0, firstOK: 0, streak: 0, earned: 0, helper: D().helper, busy: false };
  sfx.win();
  question();
}

const sayable = (q) => (G.cur === 3 ? G.options.map((o) => o.text).join(' ... ') : G.cur === 5 ? `${q.before} ... ${q.after}` : q.en);
const HUES = [350, 200, 45, 140, 280];

// each level is its own little game
function optionsHTML(type, options, optClass) {
  const n = options.length;
  const lbl = '<span class="label" dir="ltr"></span>';
  if (G.boss) return `<div class="options ${optClass}">${options.map((o, i) => `<button class="card" data-i="${i}">${o.html}${lbl}</button>`).join('')}</div>`;
  if (type === 1) return `<div class="arena sky"><span class="cloud c1">☁️</span><span class="cloud c2">☁️</span>
    ${options.map((o, i) => `<button class="card balloon" data-i="${i}" style="--x:${((i + 0.5) / n) * 100}%;--mx:${i % 2 ? 73 : 27}%;--my:${Math.floor(i / 2) * 46 + 4}%;--h:${HUES[i]};--d:${-i * 0.8}s">
      <span class="balloon-in">${o.html}</span>${lbl}</button>`).join('')}</div>`;
  if (type === 2) return `<div class="arena sea"><span class="bubbles">🫧</span>
    ${options.map((o, i) => `<button class="card fish" data-i="${i}" style="--top:${1 + i * (69 / Math.max(1, n - 1))}%;--dur:${11 + i * 2.5}s;--d:${-i * 3.1}s;--h:${HUES[i]}">
      <span class="fish-tail"></span><span class="fish-body">${o.html}</span>${lbl}</button>`).join('')}</div>`;
  if (type === 3) return `<div class="arena space"><span class="star s1">✦</span><span class="star s2">✧</span><span class="star s3">✦</span>
    ${options.map((o, i) => `<button class="card rocket" data-i="${i}" style="--h:${HUES[i]};--d:${-i * 0.6}s">
      <span class="rocket-nose"></span><span class="rocket-body">${o.html}</span><span class="rocket-fins"></span><span class="flame">🔥</span></button>`).join('')}</div>`;
  if (type === 5) return `<div class="options words">${options.map((o, i) => `<button class="card chip" data-i="${i}">${o.html}</button>`).join('')}</div>`;
}

function question() {
  const { w, queue, pos } = G;
  const item = queue[pos];
  const q = item.it;
  const lvl = G.boss ? item.type : G.lvl;
  G.cur = lvl;
  G.busy = false; G.missed = false;
  let options = [], prompt, optClass = '';
  const helperBtn = canSpeak ? `<button class="mic-btn" id="mic" ${G.helper ? '' : 'disabled'} title="Toki יקריא לאט">🎤<span>${G.helper}</span></button>` : '';
  const voiceBtns = canSpeak ? `<button class="sound-btn" id="hear" title="שמיעה">🔊</button>
    <button class="mic-btn toggle ${S.muted ? 'off' : ''}" id="micToggle" title="הקראה אוטומטית: לחצו כדי להשתיק או להחזיר">🎤</button>` : '';

  if (w.custom) {
    ({ options, prompt, optClass } = dictQuestion(q, lvl));
  } else if (lvl === 1) {
    const others = shuffle(w.words.filter((x) => x !== q)).slice(0, D().choices - 1);
    options = shuffle([q, ...others]).map((x) => ({ ok: x === q, html: wordPicture(x) }));
    prompt = `<div class="word" dir="ltr">${esc(q.en)}</div>${voiceBtns}`;
  } else if (lvl === 2) {
    options = shuffle([{ ok: true, items: q.ok }, ...shuffle(q.no).slice(0, D().choices - 1).map((items) => ({ ok: false, items }))]).map((o) => ({ ok: o.ok, html: picture(o.items) }));
    prompt = `<div class="sentence" dir="ltr">${esc(q.en)}</div>${helperBtn}`;
  } else if (lvl === 3) {
    options = shuffle([q, ...lookalikes(w, q).slice(0, D().choices - 2)]).map((s) => ({ ok: s === q, text: s.en, html: `<span class="opt-text" dir="ltr">${esc(s.en)}</span>` }));
    prompt = `<div class="prompt-pic">${picture(q.ok)}</div>${helperBtn}`;
    optClass = 'text';
  } else if (lvl === 4) {
    prompt = `${D().listenOnly ? '<div class="listen">👂</div>' : `<div class="prompt-pic small">${wordPicture(q)}</div>`}${voiceBtns}`;
  } else {
    const keep = [q.answer, ...q.choices.filter((c) => c !== q.answer).slice(0, D().choices - 1)];
    options = q.choices.filter((c) => keep.includes(c)).map((c) => ({ ok: c === q.answer, html: `<span class="opt-text" dir="ltr">${esc(c)}</span>` }));
    prompt = `<div class="prompt-pic small">${picture(q.ok)}</div>
      <div class="sentence" dir="ltr">${esc(q.before)} <span class="blank">____</span>${esc(q.after)}</div>${helperBtn}`;
    optClass = 'words';
  }
  G.options = options;

  const head = G.boss
    ? `<div class="boss-bar"><span class="boss" id="boss">${px(G.boss.spr, 5)}</span>
        <div class="boss-info"><b>${G.boss.name}</b><div class="hp" id="hp">${hpHTML(G.hp, G.maxHp)}</div></div></div>`
    : `<div class="dots">${queue.map((x, i) => `<i class="${i < pos ? 'done' : i === pos ? 'now' : ''} ${x.repeat ? 'rep' : ''}"></i>`).join('')}</div>`;
  const hint = G.boss ? `ענו נכון כדי לזרוק כוכב על ${G.boss.name}! ⭐` : LV(w)[lvl - 1].hint;
  const body = lvl === 4 ? spellingHTML(q) : w.custom && lvl === 5 ? dictTypeHTML() : optionsHTML(lvl, options, optClass);

  app.innerHTML = `<section class="screen game ${G.boss ? 'boss-fight' : ''}" style="--c:${w.color}">
    <div class="qhead">
      <span class="where">${w.icon} ${w.name} · ${G.boss ? 'קרב בוס' : `שלב ${lvl}: ${LV(w)[lvl - 1].name}`}</span>
      ${head}
      <span class="streak ${G.streak >= 2 ? 'hot' : ''}">🔥 ${G.streak}</span>
    </div>
    <div class="stage">
      <div class="toki-wrap">${toki('idle', 96)}<div id="bubble" class="bubble">${hint}</div></div>
      <div class="prompt">${prompt}</div>
    </div>
    ${body}
  </section>`;

  app.querySelectorAll('.card').forEach((c) => (c.onclick = () => choose(+c.dataset.i)));
  if (lvl === 5 && !G.boss && !w.custom) setupDrag();
  if (lvl === 5 && w.custom) setupDictType(q);
  if (lvl === 4) setupSpelling(q);
  if ($('#hear')) $('#hear').onclick = () => say(q.en, D().rate);
  if ($('#mic')) $('#mic').onclick = useHelper;
  if ($('#micToggle')) $('#micToggle').onclick = toggleVoice;
  const hearFirst = w.custom ? (lvl !== 2 && lvl !== 3) || !q.he : (lvl === 1 && D().autoRead) || lvl === 4;
  if (hearFirst && !S.muted) setTimeout(() => say(q.en, D().rate), 350);
}

// ---------- level 5: drag the word into the gap (a tap works too) ----------
function setupDrag() {
  const blank = $('.blank');
  const near = (ev) => {
    const b = blank.getBoundingClientRect();
    return ev.clientX > b.left - 30 && ev.clientX < b.right + 30 && ev.clientY > b.top - 30 && ev.clientY < b.bottom + 30;
  };
  app.querySelectorAll('.card.chip').forEach((ch) => {
    ch.onclick = null;
    ch.onpointerdown = (e) => {
      if (G.busy) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      let moved = false;
      try { ch.setPointerCapture(e.pointerId); } catch (err) {}
      ch.onpointermove = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
        ch.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
        ch.classList.add('dragging');
        blank.classList.toggle('hover', near(ev));
      };
      ch.onpointerup = ch.onpointercancel = (ev) => {
        ch.onpointermove = ch.onpointerup = ch.onpointercancel = null;
        ch.style.transform = '';
        ch.classList.remove('dragging');
        blank.classList.remove('hover');
        if (ev.type === 'pointerup' && (!moved || near(ev))) choose(+ch.dataset.i);
      };
    };
  });
}

// ---------- level 4: catch the falling letters in order ----------
function spellingHTML(q) {
  const letters = q.en.split('');
  const pool = letters.slice(D().firstLetter ? 1 : 0);
  const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !q.en.toLowerCase().includes(c));
  if (q.en === q.en.toUpperCase()) abc.forEach((c, i) => (abc[i] = c.toUpperCase()));
  for (let k = 0; k < D().decoys; k++) pool.push(abc.splice(Math.floor(Math.random() * abc.length), 1)[0]);
  let mixed = shuffle(pool);
  for (let k = 0; k < 5 && mixed.join('') === q.en && pool.length > 1; k++) mixed = shuffle(pool);
  const n = mixed.length;
  return `<div class="spell">
    <div class="slots" dir="ltr">${letters.map((c, i) => (i === 0 && D().firstLetter ? `<span class="slot filled">${esc(c)}</span>` : '<span class="slot"></span>')).join('')}</div>
    <div class="arena fall" dir="ltr"><span class="leaf l1">🍃</span><span class="leaf l2">🍂</span>
      ${mixed.map((c, i) => `<button class="tile" data-c="${esc(c)}" data-i="${i}" style="--x:${((i + 0.5) / n) * 100}%;--dur:${7 + (i % 3) * 1.6}s;--d:${-((i * 2.7) % 7)}s">${esc(c)}</button>`).join('')}
    </div>
  </div>`;
}
function setupSpelling(q) {
  let at = D().firstLetter ? 1 : 0;
  const slots = app.querySelectorAll('.slot');
  app.querySelectorAll('.tile').forEach((t) => (t.onclick = () => {
    if (G.busy) return;
    if (t.dataset.c === q.en[at]) {
      t.classList.add('used'); t.disabled = true;
      slots[at].textContent = t.dataset.c; slots[at].classList.add('filled');
      tone([520 + at * 60], 0.06, 'triangle', 0.08);
      at++;
      if (at === q.en.length) { G.busy = true; G.missed ? fixedIt(q) : success(q); }
    } else {
      t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake');
      if (!G.missed) miss(q, `כמעט! האות הבאה היא <b dir="ltr">${esc(q.en[at])}</b>. נסו שוב.`);
      else { sfx.bad(); bubble(`האות הבאה היא <b dir="ltr">${esc(q.en[at])}</b>.`); }
    }
  }));
}
function fixedIt(q) {
  bubble(`יופי, תיקנת! <b dir="ltr">${esc(q.en)}</b>${q.he ? ` = ${esc(q.he)}` : ''}`);
  if (!S.muted) say(q.en, 0.85);
  setTimeout(advance, 1500);
}

// level 1 and 4: the mic button turns automatic reading aloud off and on (the 🔊 button still works)
function toggleVoice() { setMuted(!S.muted); }
function setMuted(on) {
  S.muted = on; save();
  if ($('#micToggle')) $('#micToggle').classList.toggle('off', S.muted);
  if (S.muted) { if (canSpeak) speechSynthesis.cancel(); bubble('ההקראה כבויה. לחצו שוב על המיקרופון כדי להחזיר אותה.'); }
  else { bubble('ההקראה חזרה! 🎤'); if (G.cur === 1 || G.cur === 4) say(G.queue[G.pos].it.en, 0.85); }
}

// tapping Toki: he does a random trick (dance, giggle, spin, big jump, wink, wave)
const TRICKS = [
  { cls: 'trick-dance', say: '💃', snd: [660, 880, 990] },
  { cls: 'trick-giggle', say: 'הִי הִי הִי! 😆', snd: [900, 1100, 900, 1100, 900] },
  { cls: 'trick-spin', say: 'ויייי! 🌀', snd: [400, 600, 800, 1000] },
  { cls: 'trick-jump', say: 'הופ! ⬆️', snd: [300, 900] },
  { cls: 'trick-wink', say: '😉', snd: [1200] },
  { cls: 'trick-wave', say: 'היי! 👋', snd: [700, 900] },
];
let lastTrick = -1;
document.addEventListener('click', (e) => {
  const t = e.target.closest('.toki');
  if (!t) return;
  let i;
  do { i = Math.floor(Math.random() * TRICKS.length); } while (i === lastTrick);
  lastTrick = i;
  const tr = TRICKS[i];
  TRICKS.forEach((x) => t.classList.remove(x.cls));
  void t.offsetWidth;
  t.classList.add('tapped', tr.cls);
  tone(tr.snd, 0.08, 'triangle', 0.08);
  const old = t.querySelector('.trick-say');
  if (old) old.remove();
  const sayEl = document.createElement('span');
  sayEl.className = 'trick-say';
  sayEl.textContent = tr.say;
  t.appendChild(sayEl);
  clearTimeout(t._tm);
  t._tm = setTimeout(() => { t.classList.remove('tapped', tr.cls); sayEl.remove(); }, 1800);
});

function useHelper() {
  if (!G.helper || G.busy) return;
  G.helper--;
  const b = $('#mic');
  b.querySelector('span').textContent = G.helper;
  if (!G.helper) b.disabled = true;
  setMood('happy', 900);
  bubble('אני מקריא לאט... 🎤');
  say(sayable(G.queue[G.pos].it), 0.6);
}

// a right answer: coin, streak, cheer (and in a boss fight, a star thrown at the boss)
function success(q) {
  sfx.good();
  setMood('happy', 900);
  G.streak++;
  if (!G.queue[G.pos].repeat) G.firstOK++;
  let msg = ['כל הכבוד!', 'מצוין!', 'נכון מאוד!', 'יופי!', 'אלופים!'][Math.floor(Math.random() * 5)];
  addCoins(1); G.earned++;
  if (G.streak % 3 === 0) {
    setTimeout(() => { addCoins(1, 'בונוס רצף!'); G.earned++; }, 450);
    msg = `רצף של ${G.streak}! 🔥 מטבע בונוס`;
  }
  bubble(msg);
  $('.streak').textContent = `🔥 ${G.streak}`;
  $('.streak').classList.toggle('hot', G.streak >= 2);
  if ((G.cur === 1 || G.cur === 4 || G.w.custom) && !S.muted) say(q.en, 0.9);
  if (G.boss) {
    hitBoss();
    if (G.hp <= 0) { G.busy = true; return setTimeout(bossWin, 1500); }
  }
  setTimeout(advance, 1300);
}

function hitBoss() {
  G.hp--;
  const boss = $('#boss'), from = $('.game .toki');
  if (boss && from) {
    const a = from.getBoundingClientRect(), b = boss.getBoundingClientRect();
    const star = document.createElement('div');
    star.className = 'shot';
    star.textContent = '⭐';
    star.style.left = `${a.left + a.width / 2}px`;
    star.style.top = `${a.top + a.height / 2}px`;
    document.body.appendChild(star);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = star.animate([{ transform: 'translate(-50%,-50%) scale(.6) rotate(0)' }, { transform: `translate(calc(${dx}px - 50%), calc(${dy}px - 50%)) scale(1.4) rotate(540deg)` }], { duration: 550, easing: 'ease-in' });
    anim.onfinish = () => {
      star.remove();
      boss.classList.remove('hit', 'laugh'); void boss.offsetWidth; boss.classList.add('hit');
      tone([200, 150], 0.1, 'square', 0.07);
      $('#hp').innerHTML = hpHTML(Math.max(0, G.hp), G.maxHp);
    };
  }
}

// a wrong answer: no punishment, the streak resets and the item comes back later (once)
function miss(q, msg) {
  G.missed = true;
  sfx.bad();
  setMood('sad', 1600);
  G.streak = 0;
  $('.streak').textContent = '🔥 0';
  $('.streak').classList.remove('hot');
  if (G.boss) {
    const boss = $('#boss');
    boss.classList.remove('hit', 'laugh'); void boss.offsetWidth; boss.classList.add('laugh');
    msg = `${G.boss.name} צוחק: "חה חה!" 😝<br>${msg}`;
  }
  bubble(msg);
  if (!G.queue[G.pos].repeat) G.queue.push({ ...G.queue[G.pos], repeat: true });
}

function choose(i) {
  if (G.busy) return;
  G.busy = true;
  const q = G.queue[G.pos].it;
  const cards = app.querySelectorAll('.card');
  const okIndex = G.options.findIndex((o) => o.ok);
  cards.forEach((c) => c.classList.add('done'));

  if (G.options[i].ok) {
    cards[i].classList.add('right');
    if (G.cur === 5) $('.blank').textContent = q.answer;
    success(q);
  } else {
    cards[i].classList.add('wrong');
    cards[okIndex].classList.add('reveal');
    if (G.cur === 1) {
      if (cards[okIndex].querySelector('.label')) cards[okIndex].querySelector('.label').innerHTML = q.he ? `${esc(q.en)} = <span dir="rtl">${esc(q.he)}</span>` : esc(q.en);
      miss(q, q.he ? `כמעט! <b dir="ltr">${esc(q.en)}</b> זה ${esc(q.he)}. נחזור על זה עוד מעט.` : `כמעט! המילה היא <b dir="ltr">${esc(q.en)}</b>. נחזור על זה עוד מעט.`);
      if (!S.muted) say(q.en, 0.8);
    } else {
      if (G.cur === 5) { $('.blank').textContent = q.answer; $('.blank').classList.add('fixed'); }
      miss(q, `כמעט! זאת התשובה הנכונה.${q.he ? `<br><span class="trans">${esc(q.he)}</span>` : ''}`);
    }
    // no "continue" button: the kid sees and hears the right answer, then the game moves on by itself
    G.autoNext = setTimeout(advance, 2800);
  }
}

function advance() {
  clearTimeout(G.autoNext);
  if (G.pos === -1) return;
  G.pos++;
  if (G.boss && G.pos >= G.queue.length) G.queue.push(...bossQueue(G.w));
  if (G.pos >= G.queue.length) return finishLevel();
  question();
}

function bossWin() {
  const { w, boss } = G;
  const first = !S.bosses[w.id];
  S.bosses[w.id] = true; save();
  G.pos = -1;
  app.innerHTML = `<section class="screen result boss-win" style="--c:${w.color}">
    <div class="win-row">${toki('dance', 130)}<span class="boss friend">${px(boss.spr, 8)}<i>💖</i></span></div>
    <h1>ניצחת את ${boss.name}! ${px('trophy', 3)}</h1>
    <p>${boss.name} כבר לא חוסם את הדרך, ועכשיו הוא חבר של Toki.</p>
    <p class="earned">${px('coin', 2)} הרווחת <b id="earned">${G.earned}</b> מטבעות בקרב, ועוד 5 מטבעות על הניצחון!</p>
    ${first ? `<p class="unlock">${px('trophy', 2)} הגביע של ${w.name} נוסף לאי שלך!</p>` : ''}
    <div class="btn-row">
      <button class="big-btn prize-btn" id="prizeGo" hidden>🎁 צברת 20 מטבעות! לפרס</button>
      <button class="big-btn soft" id="again">קרב נוסף ↻</button>
      <button class="big-btn soft" id="toMap">🏠 בית</button>
    </div>
  </section>`;
  sfx.win();
  setTimeout(() => { addCoins(5, 'ניצחון!'); G.earned += 5; if ($('#earned')) $('#earned').textContent = G.earned; if (prizeWaiting() && $('#prizeGo')) $('#prizeGo').hidden = false; }, 700);
  $('#prizeGo').onclick = prizeScreen;
  $('#again').onclick = () => startBoss(w.id);
  $('#toMap').onclick = mapScreen;
}

function finishLevel() {
  const { w, lvl, total } = G;
  const st = G.firstOK >= total - 1 ? 3 : G.firstOK >= total - 3 ? 2 : 1;
  const opensNext = lvl < LEVELS.length && !stars(w.id, lvl);
  S.stars[`${w.id}-${lvl}`] = Math.max(stars(w.id, lvl), st);
  save();
  G.pos = -1;

  app.innerHTML = `<section class="screen result" style="--c:${w.color}">
    ${toki('dance', 150)}
    <h1>${st === 3 ? 'מושלם!' : st === 2 ? 'כל הכבוד!' : 'סיימת את השלב!'}</h1>
    <div class="big-stars">${[1, 2, 3].map((i) => `<span class="${i <= st ? 'on' : ''}" style="animation-delay:${i * 0.25}s">${px('star', 9, i <= st ? {} : { y: 'q', Y: 'w' })}</span>`).join('')}</div>
    <p>ענית נכון על <b>${G.firstOK}</b> מתוך <b>${total}</b> כבר בניסיון הראשון.</p>
    <p class="earned">${px('coin', 2)} הרווחת <b id="earned">${G.earned}</b> מטבעות בשלב הזה</p>
    ${st === 3 ? `<p class="bonus">${px('star', 2)} שלושה כוכבים: עוד 3 מטבעות!</p>` : ''}
    ${st < 3 ? '<p class="small">טיפ: כדי לקבל 3 כוכבים צריך לטעות לכל היותר פעם אחת.</p>' : ''}
    ${opensNext ? `<p class="unlock">🔓 נפתח שלב ${lvl + 1}: ${LV(w)[lvl].name}!</p>` : ''}
    ${lvl === LEVELS.length ? `<p class="unlock">🏝️ סיימת את כל השלבים בעולם ${w.name}! ${px(BOSSES[w.id].spr, 2)} ${BOSSES[w.id].name} מחכה לך.</p>` : ''}
    <div class="btn-row">
      <button class="big-btn prize-btn" id="prizeGo" hidden>🎁 צברת 20 מטבעות! לפרס</button>
      ${lvl < LEVELS.length ? `<button class="big-btn" id="nextLvl">לשלב ${lvl + 1} ◀</button>` : `<button class="big-btn" id="nextLvl">לקרב הבוס ${px(BOSSES[w.id].spr, 2)}</button>`}
      <button class="big-btn soft" id="again">לשחק שוב ↻</button>
      <button class="big-btn soft" id="toMap">🏠 בית</button>
    </div>
  </section>`;
  sfx.win();
  if (st === 3) setTimeout(() => { addCoins(3, '3 כוכבים!'); G.earned += 3; if ($('#earned')) $('#earned').textContent = G.earned; showPrize(); }, 900);
  else showPrize();
  function showPrize() { if (prizeWaiting() && $('#prizeGo')) $('#prizeGo').hidden = false; }
  $('#prizeGo').onclick = prizeScreen;
  if ($('#nextLvl')) $('#nextLvl').onclick = () => (lvl < LEVELS.length ? startLevel(w.id, lvl + 1) : startBoss(w.id));
  $('#again').onclick = () => startLevel(w.id, lvl);
  $('#toMap').onclick = mapScreen;
}

// ---------- the prize ----------
function prizeScreen() {
  S.prizeDone = true; save();
  showBar(true);
  const date = new Date().toLocaleDateString('he-IL');
  app.innerHTML = `<section class="screen prize">
    <div class="confetti">${Array.from({ length: 40 }, (_, i) => `<i style="--x:${Math.random() * 100};--d:${(Math.random() * 2 + 2).toFixed(2)}s;--delay:${(Math.random() * 2).toFixed(2)}s;--h:${Math.floor(Math.random() * 360)}"></i>`).join('')}</div>
    <h1>🎉 זכית בפרס! 🎉</h1>
    <p>Toki קיבל תלבושת חדשה: כתר של אלופים! והנה התעודה שלך.</p>
    ${window.TOKI_WEB ? '<p class="small">כדי להדפיס את התעודה, פתחו את המשחק מהמחשב (index.html).</p>' : ''}
    <label class="name-row">השם שלך לתעודה: <input id="kidName" maxlength="24" value="${esc(S.name)}" placeholder="כתבו כאן את השם"></label>
    <div id="certificate" class="certificate">
      <div class="cert-in">
        <div class="cert-toki">${toki('happy', 110)}</div>
        <h2>תעודת אלוף/ת אנגלית</h2>
        <p>התעודה מוענקת ל</p>
        <div class="cert-name" id="certName">${esc(S.name) || '__________'}</div>
        <p>על צבירת ${PRIZE_GOAL} מטבעות במשחק Toki<br>ועל למידת מילים ומשפטים באנגלית.</p>
        <p class="cert-en" dir="ltr">Great job! You are an English champion!</p>
        <div class="cert-foot"><span>${date}</span><span>Toki 🪙</span></div>
      </div>
    </div>
    <div class="btn-row">
      ${window.TOKI_WEB ? '' : '<button class="big-btn" id="print">🖨️ להדפיס את התעודה</button>'}
      <button class="big-btn soft" id="toMap">🏠 חזרה הביתה</button>
    </div>
  </section>`;
  sfx.win();
  say('Congratulations! You are an English champion!', 0.9);
  $('#kidName').oninput = (e) => { S.name = e.target.value; save(); $('#certName').textContent = S.name || '__________'; };
  if ($('#print')) $('#print').onclick = () => window.print();
  $('#toMap').onclick = mapScreen;
}

$('#homeBtn').onclick = () => {
  const leave = () => { if (G) G.pos = -1; mapScreen(); };
  if (!G || G.pos === -1) leave(); else ask('לצאת מהשלב ולחזור הביתה?', 'כן, הביתה', leave);
};
titleScreen();
