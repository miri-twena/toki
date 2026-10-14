// Toki - the "dictation" island: the parent types the words for the next dictation,
// and every level of this island is built only from those words.

const DICT_WORLD = { id: 'dict', name: 'הכתבה', icon: '✏️', color: '#8b4ad8', custom: true, get words() { return S.dict || []; }, sentences: [] };
const allWorlds = () => [...WORLDS, DICT_WORLD];
const findWorld = (id) => allWorlds().find((x) => x.id === id);
BOSSES.dict = { icon: '🦉', spr: 'owl', name: 'הינשוף הבוחן' };

// the ladder of this island (no pictures: everything is built from hearing, reading and writing the words)
const DLEVELS = [
  { n: 1, name: 'שמיעה', game: '👂', hint: 'הקשיבו למילה ושברו את הבלוק עם המילה הנכונה! ⛏️' },
  { n: 2, name: 'תרגום', game: '🎣', hint: 'איזו מילה באנגלית מתאימה? דוגו את הדג הנכון! 🎣' },
  { n: 3, name: 'אות חסרה', game: '🚀', hint: 'איזו אות חסרה במילה? שגרו את הטיל הנכון! 🚀' },
  { n: 4, name: 'איות', game: '🧱', hint: 'הקשיבו ותפסו את הבלוקים הנופלים לפי הסדר! 🧱' },
  { n: 5, name: 'הכתבה', game: '✍️', hint: 'הקשיבו למילה וכתבו אותה במקלדת! ✍️' },
];
const LV = (w) => (w.custom ? DLEVELS : LEVELS);

// ---------- the word list ----------
// one word per line; an optional Hebrew translation can come after "=", ":" or "-" (or anywhere on the line)
function parseDict(text) {
  const out = [], seen = new Set();
  text.split(/\n/).forEach((line) => {
    const en = (line.match(/[A-Za-z][A-Za-z']*/) || [''])[0].trim(); // one word per line (no spaces)
    const he = (line.match(/[֐-׿][֐-׿\s'"]*/) || [''])[0].trim();
    if (!en || en.length > 20 || seen.has(en.toLowerCase())) return;
    seen.add(en.toLowerCase());
    out.push({ en, he });
  });
  return out.slice(0, 40);
}
const dictText = (words) => words.map((w) => (w.he ? `${w.en} = ${w.he}` : w.en)).join('\n');

function dictEditor() {
  const d = document.createElement('div');
  d.className = 'ask';
  d.innerHTML = `<div class="ask-box dict-box">
    <h2>✏️ המילים להכתבה הקרובה</h2>
    <p class="small">מקלידים את המילה באנגלית, והתרגום לעברית מתמלא לבד (אפשר לתקן אותו). מומלץ לפחות 4 מילים.</p>
    <div class="dict-wrap"><table class="dict-table">
      <thead><tr><th class="num">#</th><th>מילה באנגלית</th><th>מילה בעברית</th><th></th></tr></thead>
      <tbody id="dictRows"></tbody>
    </table></div>
    <button class="big-btn soft add-row" id="dictAdd">+ הוספת שורה</button>
    <p class="small" id="dictCount"></p>
    <div class="btn-row"><button class="big-btn" id="dictSave">שמירה ✔</button><button class="big-btn soft" id="dictCancel">ביטול</button></div>
  </div>`;
  document.body.appendChild(d);
  const rows = $('#dictRows', d), count = $('#dictCount', d);
  const addRow = (en = '', he = '', auto = !he) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="num"></td>
      <td><input class="en" dir="ltr" maxlength="20" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="apple" value="${esc(en)}"></td>
      <td><input class="he ${auto ? 'auto' : ''}" maxlength="24" placeholder="התרגום יופיע כאן" value="${esc(he)}"></td>
      <td><button class="del" title="מחיקה">✕</button></td>`;
    rows.appendChild(tr);
    const enIn = $('.en', tr), heIn = $('.he', tr);
    const fill = () => { // the Hebrew follows the English until the parent edits it by hand
      if (!heIn.classList.contains('auto')) return;
      heIn.value = translateWord(enIn.value);
      heIn.placeholder = enIn.value.trim() && !heIn.value ? 'לא במילון, כתבו כאן' : 'התרגום יופיע כאן';
    };
    enIn.oninput = () => { enIn.value = enIn.value.replace(/[^A-Za-z']/g, ''); fill(); update(); };
    enIn.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (tr === rows.lastElementChild) addRow().focus(); else $('.en', tr.nextElementSibling).focus(); } };
    heIn.oninput = () => { heIn.classList.toggle('auto', !heIn.value); if (!heIn.value) fill(); update(); };
    $('.del', tr).onclick = () => { tr.remove(); if (!rows.children.length) addRow(); update(); };
    if (auto && en) fill();
    update();
    return enIn;
  };
  const collect = () => {
    const out = [], seen = new Set();
    [...rows.children].forEach((tr) => {
      const en = $('.en', tr).value.trim(), he = $('.he', tr).value.trim();
      if (!en || seen.has(en.toLowerCase())) return;
      seen.add(en.toLowerCase()); out.push({ en, he });
    });
    return out.slice(0, 40);
  };
  function update() {
    [...rows.children].forEach((tr, i) => { $('.num', tr).textContent = i + 1; });
    const n = collect().length; count.textContent = n ? `${n} מילים` : 'עדיין אין מילים';
  }
  (S.dict || []).forEach((w) => addRow(w.en, w.he, false));
  while (rows.children.length < 5) addRow();
  $('#dictAdd', d).onclick = () => { if (rows.children.length < 40) addRow().focus(); };
  $('#dictCancel', d).onclick = () => d.remove();
  $('#dictSave', d).onclick = () => {
    const words = collect();
    if (words.length < 2) { count.textContent = 'צריך לפחות 2 מילים באנגלית.'; $('.en', rows).focus(); return; }
    const changed = JSON.stringify(words) !== JSON.stringify(S.dict || []);
    S.dict = words;
    if (changed) { // a new list is a new dictation: the island's progress starts over
      Object.keys(S.stars).forEach((k) => { if (k.startsWith('dict-')) delete S.stars[k]; });
      delete S.bosses.dict;
    }
    save(); sfx.good(); d.remove(); mapScreen();
  };
  $('.en', rows).focus();
}

// ---------- building the questions ----------
// a wrong spelling that looks like the word (swapped, dropped, doubled or changed letter)
function misspell(word) {
  const w = word, v = 'aeiou';
  for (let k = 0; k < 20; k++) {
    const i = Math.floor(Math.random() * w.length);
    const op = Math.floor(Math.random() * 4);
    let r = null;
    if (op === 0 && i < w.length - 1 && w[i] !== w[i + 1]) r = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
    if (op === 1 && w.length > 3) r = w.slice(0, i) + w.slice(i + 1);
    if (op === 2) r = w.slice(0, i) + w[i] + w.slice(i);
    if (op === 3) { const j = [...w].findIndex((c) => v.includes(c)); if (j >= 0) { const alt = v.replace(w[j], ''); r = w.slice(0, j) + alt[Math.floor(Math.random() * alt.length)] + w.slice(j + 1); } }
    if (r && r.toLowerCase() !== w.toLowerCase()) return r;
  }
  return w + 'e';
}
// n written choices: other words from the list, and lookalike misspellings when the list is short (or on hard levels)
function wordChoices(w, q, n) {
  const fake = (S.diff ?? 1) >= 2 ? Math.min(2, n - 1) : 0;
  const others = shuffle(w.words.filter((x) => x !== q)).slice(0, n - 1 - fake).map((x) => x.en);
  const used = new Set([q.en.toLowerCase(), ...others.map((o) => o.toLowerCase())]);
  for (let k = 0; others.length < n - 1 && k < 30; k++) { const m = misspell(q.en); if (!used.has(m.toLowerCase())) { used.add(m.toLowerCase()); others.push(m); } }
  return shuffle([q.en, ...others]);
}
// which letter to hide: a vowel in the middle when there is one
function pickGap(word) {
  const mid = [...word].map((c, i) => i).filter((i) => i > 0 && i < word.length - 1 && word[i] !== ' ');
  const vowels = mid.filter((i) => 'aeiou'.includes(word[i].toLowerCase()));
  const pool = vowels.length ? vowels : mid.length ? mid : [0];
  pickGap.last = pool[Math.floor(Math.random() * pool.length)]; // remembered for Toki's hint after a mistake
  return pickGap.last;
}
function letterChoices(c, n) {
  const v = 'aeiou', all = 'abcdefghijklmnopqrstuvwxyz';
  const pool = (v.includes(c.toLowerCase()) ? v : all).replace(c.toLowerCase(), '').split('');
  const picks = shuffle(pool).slice(0, n - 1).map((x) => (c === c.toUpperCase() ? x.toUpperCase() : x));
  return shuffle([c, ...picks]);
}

function dictQuestion(q, lvl) {
  const w = G.w, n = D().choices;
  const txt = (t) => `<span class="opt-text" dir="ltr">${esc(t)}</span>`;
  const voice = canSpeak ? `<button class="sound-btn" id="hear" title="שמיעה">🔊</button>
    <button class="mic-btn toggle ${S.muted ? 'off' : ''}" id="micToggle" title="הקראה אוטומטית: לחצו כדי להשתיק או להחזיר">🎤</button>` : '';
  const heBig = q.he ? `<div class="he-word">${esc(q.he)}</div>` : '';
  const ear = '<div class="listen">👂</div>';
  if (lvl === 1) return { options: wordChoices(w, q, n).map((t) => ({ ok: t === q.en, text: t, html: txt(t) })), prompt: `${ear}${voice}`, optClass: 'words' };
  if (lvl === 2) return { options: wordChoices(w, q, n).map((t) => ({ ok: t === q.en, text: t, html: txt(t) })), prompt: `${heBig || ear}${voice}`, optClass: 'words' };
  if (lvl === 3) {
    const i = pickGap(q.en), shown = q.en.slice(0, i) + '_' + q.en.slice(i + 1);
    return { options: letterChoices(q.en[i], n).map((c) => ({ ok: c === q.en[i], text: c, html: `<span class="opt-text letter" dir="ltr">${esc(c)}</span>` })), prompt: `<div class="word gap" dir="ltr">${esc(shown)}</div>${heBig}${voice}`, optClass: 'words' };
  }
  if (lvl === 4) return { options: [], prompt: `${D().listenOnly || !q.he ? ear : heBig}${voice}`, optClass: '' };
  return { options: [], prompt: `${heBig || ear}${voice}`, optClass: '' };
}

// ---------- level 5: the real dictation, typed on the keyboard ----------
function dictTypeHTML() {
  return `<div class="dict-type" dir="ltr">
    <input id="dictIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="24" placeholder="...">
    <button class="big-btn" id="dictCheck">בדיקה ✔</button>
  </div>`;
}
function setupDictType(q) {
  const inp = $('#dictIn'), btn = $('#dictCheck');
  const check = () => {
    if (G.busy) return;
    const v = inp.value.trim().toLowerCase();
    if (!v) return;
    G.busy = true; inp.disabled = true; btn.disabled = true;
    if (v === q.en.toLowerCase()) { inp.classList.add('ok'); success(q); }
    else {
      inp.classList.add('bad');
      const fix = document.createElement('div');
      fix.className = 'dict-fix'; fix.dir = 'ltr'; fix.textContent = q.en;
      inp.parentNode.appendChild(fix);
      miss(q, `כמעט! כותבים <b dir="ltr">${esc(q.en)}</b>${q.he ? ` = ${esc(q.he)}` : ''}. נחזור על זה עוד מעט.`);
      if (!S.muted) say(q.en, 0.8);
      G.autoNext = setTimeout(advance, 5000);
    }
  };
  btn.onclick = check;
  inp.onkeydown = (e) => { if (e.key === 'Enter') check(); };
  setTimeout(() => inp.focus(), 50);
}

// the owl mixes hearing, translating, missing letters and typing
function dictBossQueue(w) {
  const types = [1, 2, 3, 5];
  return shuffle(w.words.flatMap((it) => types.map((type) => ({ it, type })))).slice(0, 16).map((x) => ({ ...x, repeat: false }));
}
