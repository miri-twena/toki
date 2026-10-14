// Toki - game content: worlds, words, sentences and the pictures that go with them.
// Pictures are built from emoji and a few hand-drawn SVG shapes (no image files).

// ---------- picture building helpers ----------
// An item is one thing on a picture card: k = emoji or "#svgName", x/y = center in %, s = size in % of card width.
const I = (k, x, y, s, o = {}) => ({ k, x, y, s, ...o });

// Spread n copies of a key around a center point.
function many(k, n, cx, cy, s, o = {}) {
  if (n === 1) return [I(k, cx, cy, s, o)];
  const gap = s * 0.85;
  const start = cx - (gap * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => I(k, start + gap * i, cy + (i % 2 ? -3 : 3), s, o));
}

// "a" placed on / under / in / next to "b".
function rel(a, r, b, n = 1) {
  const as = n > 1 ? 20 : 26;
  switch (r) {
    case 'on':
      // on a tree means up in its leaves; on anything else means resting right on top of it
      if (b === '🌳') return [I(b, 50, 56, 78), ...many(a, n, 50, 34, as - 2)];
      return [I(b, 50, 68, 54), ...many(a, n, 50, 30, as)];
    case 'under':
      // the big thing sits high up and the small thing is clearly below it, with a gap
      return [I(b, 50, 34, 56), ...many(a, n, 50, 84, as - 6)];
    case 'in':
      // the thing peeks out of the container: drawn first so the container covers its bottom
      return [...many(a, n, 50, 28, as + 2, { r: -12 }), I(b, 50, 66, 52)];
    case 'next':
      return [I(b, 64, 56, 46), ...many(a, n, 22, 62, as + 4)];
  }
}

// a person holding / having something
function have(p, k, { n = 1, size = 'mid', f } = {}) {
  const s = size === 'big' ? 46 : size === 'small' ? 14 : n === 1 ? 30 : n === 2 ? 24 : 19;
  return [I(p, 24, 58, 40), ...many(k, n, size === 'big' ? 70 : 69, 62, s, { f })];
}

// a single thing shown big or small
function size(k, which) {
  return which === 'big' ? [I(k, 50, 54, 78)] : [I(k, 50, 66, 20)];
}

function count(k, n) {
  return many(k, n, 50, 55, n === 3 ? 28 : 34);
}

// ---------- hand-drawn shapes for things that have no emoji ----------
const SVGS = {
  table: `<svg viewBox="0 0 100 100"><rect x="6" y="30" width="88" height="12" rx="4" fill="#b8763e"/><rect x="6" y="30" width="88" height="5" rx="3" fill="#d39158"/><rect x="14" y="42" width="9" height="50" rx="3" fill="#8f5a2d"/><rect x="77" y="42" width="9" height="50" rx="3" fill="#8f5a2d"/></svg>`,
  board: `<svg viewBox="0 0 100 100"><rect x="4" y="14" width="92" height="64" rx="5" fill="#9b6b3c"/><rect x="10" y="20" width="80" height="52" rx="3" fill="#2f6b4f"/><text x="20" y="44" font-size="14" fill="#fff" font-family="Comic Sans MS, cursive">A B C</text><path d="M20 58 q10 -8 20 0 t20 0" stroke="#fff" stroke-width="2" fill="none"/><rect x="58" y="76" width="16" height="4" rx="2" fill="#eee"/><rect x="46" y="78" width="8" height="18" fill="#7b532d"/></svg>`,
  eraser: `<svg viewBox="0 0 100 100"><g transform="rotate(-18 50 50)"><rect x="12" y="34" width="76" height="32" rx="7" fill="#ff8fb1"/><rect x="12" y="34" width="34" height="32" rx="7" fill="#5aa9e6"/><rect x="38" y="34" width="10" height="32" fill="#5aa9e6"/><rect x="16" y="38" width="68" height="6" rx="3" fill="#fff" opacity=".35"/></g></svg>`,
};

// ---------- the worlds ----------
const GREEN = 'hue-rotate(75deg) saturate(1.2)';
const BLUE = 'hue-rotate(200deg)';

const WORLDS = [
  {
    id: 'school',
    name: 'בית הספר',
    icon: '🏫',
    color: '#5b8def',
    words: [
      { en: 'pencil', he: 'עיפרון', pic: '✏️' },
      { en: 'book', he: 'ספר', pic: '📖' },
      { en: 'bag', he: 'תיק', pic: '🎒' },
      { en: 'teacher', he: 'מורה', pic: '🧑‍🏫' },
      { en: 'chair', he: 'כיסא', pic: '🪑' },
      { en: 'table', he: 'שולחן', pic: '#table' },
      { en: 'ruler', he: 'סרגל', pic: '📏' },
      { en: 'board', he: 'לוח', pic: '#board' },
      { en: 'eraser', he: 'מחק', pic: '#eraser' },
      { en: 'notebook', he: 'מחברת', pic: '📓' },
    ],
    sentences: [
      { en: 'The book is on the chair.', he: 'הספר על הכיסא.',
        ok: rel('📖', 'on', '🪑'), no: [rel('📖', 'under', '🪑'), rel('📖', 'on', '#table'), rel('✏️', 'on', '🪑')] },
      { en: 'The pencil is in the bag.', he: 'העיפרון בתוך התיק.',
        ok: rel('✏️', 'in', '🎒'), no: [rel('✏️', 'next', '🎒'), rel('📏', 'in', '🎒'), rel('✏️', 'on', '📖')] },
      { en: 'The teacher has a ruler.', he: 'למורה יש סרגל.',
        ok: have('🧑‍🏫', '📏'), no: [have('🧑‍🏫', '✏️'), have('🧒', '📏'), have('🧑‍🏫', '📖')] },
      { en: 'The bag is under the table.', he: 'התיק מתחת לשולחן.',
        ok: rel('🎒', 'under', '#table'), no: [rel('🎒', 'on', '#table'), rel('🎒', 'under', '🪑'), rel('📖', 'under', '#table')] },
      { en: 'I have a red notebook.', he: 'יש לי מחברת אדומה.',
        ok: have('🧒', '📕'), no: [have('🧒', '📗'), have('🧒', '📘'), have('🧒', '📙')] },
      { en: 'The eraser is small.', he: 'המחק קטן.',
        ok: size('#eraser', 'small'), no: [size('#eraser', 'big'), size('📏', 'small'), size('📖', 'big')] },
      { en: 'The board is big.', he: 'הלוח גדול.',
        ok: size('#board', 'big'), no: [size('#board', 'small'), size('#table', 'big'), size('#eraser', 'big')] },
      { en: 'The ruler is on the book.', he: 'הסרגל על הספר.',
        ok: rel('📏', 'on', '📖'), no: [rel('📏', 'under', '📖'), rel('✏️', 'on', '📖'), rel('📏', 'on', '🪑')] },
      { en: 'The chair is next to the table.', he: 'הכיסא ליד השולחן.',
        ok: rel('🪑', 'next', '#table'), no: [rel('🪑', 'on', '#table'), rel('🎒', 'next', '#table'), rel('🪑', 'next', '🎒')] },
      { en: 'I have two pencils.', he: 'יש לי שני עפרונות.',
        ok: have('🧒', '✏️', { n: 2 }), no: [have('🧒', '✏️'), have('🧒', '✏️', { n: 3 }), have('🧒', '📖', { n: 2 })] },
    ],
  },
  {
    id: 'food',
    name: 'אוכל',
    icon: '🍕',
    color: '#f2994a',
    words: [
      { en: 'apple', he: 'תפוח', pic: '🍎' },
      { en: 'bread', he: 'לחם', pic: '🍞' },
      { en: 'cheese', he: 'גבינה', pic: '🧀' },
      { en: 'egg', he: 'ביצה', pic: '🥚' },
      { en: 'milk', he: 'חלב', pic: '🥛' },
      { en: 'banana', he: 'בננה', pic: '🍌' },
      { en: 'pizza', he: 'פיצה', pic: '🍕' },
      { en: 'water', he: 'מים', pic: '💧' },
      { en: 'cake', he: 'עוגה', pic: '🎂' },
      { en: 'salad', he: 'סלט', pic: '🥗' },
    ],
    sentences: [
      { en: 'I eat an apple.', he: 'אני אוכל/ת תפוח.',
        ok: have('😋', '🍎'), no: [have('😋', '🍌'), have('😋', '🎂'), have('😋', '🧀')] },
      { en: 'The milk is cold.', he: 'החלב קר.',
        ok: [I('🥛', 44, 58, 50), I('❄️', 76, 28, 22)], no: [
          [I('🥛', 44, 58, 50), I('🔥', 76, 28, 22)],
          [I('💧', 44, 58, 46), I('❄️', 76, 28, 22)],
          [I('🍕', 44, 58, 50), I('❄️', 76, 28, 22)]] },
      { en: 'The cake is on the table.', he: 'העוגה על השולחן.',
        ok: rel('🎂', 'on', '#table'), no: [rel('🎂', 'under', '#table'), rel('🍕', 'on', '#table'), rel('🎂', 'on', '🪑')] },
      { en: 'She drinks water.', he: 'היא שותה מים.',
        ok: have('👧', '💧'), no: [have('👦', '💧'), have('👧', '🥛'), have('👧', '🍎')] },
      { en: 'I like pizza.', he: 'אני אוהב/ת פיצה.',
        ok: [I('😍', 28, 56, 40), I('🍕', 72, 60, 38), I('❤️', 50, 22, 16)], no: [
          [I('😖', 28, 56, 40), I('🍕', 72, 60, 38), I('👎', 50, 22, 16)],
          [I('😍', 28, 56, 40), I('🥗', 72, 60, 38), I('❤️', 50, 22, 16)],
          [I('😍', 28, 56, 40), I('🎂', 72, 60, 38), I('❤️', 50, 22, 16)]] },
      { en: 'The banana is yellow.', he: 'הבננה צהובה.',
        ok: [I('🍌', 50, 55, 60)], no: [[I('🍌', 50, 55, 60, { f: GREEN })], [I('🍌', 50, 55, 60, { f: BLUE })], [I('🍎', 50, 55, 56)]] },
      { en: 'There are two eggs.', he: 'יש שתי ביצים.',
        ok: count('🥚', 2), no: [count('🥚', 1), count('🥚', 3), count('🍎', 2)] },
      { en: 'The bread is in the bag.', he: 'הלחם בתוך השקית.',
        ok: rel('🍞', 'in', '🛍️'), no: [rel('🍞', 'next', '🛍️'), rel('🧀', 'in', '🛍️'), rel('🍞', 'on', '#table')] },
      { en: 'He has a big salad.', he: 'יש לו סלט גדול.',
        ok: have('👦', '🥗', { size: 'big' }), no: [have('👦', '🥗', { size: 'small' }), have('👧', '🥗', { size: 'big' }), have('👦', '🍕', { size: 'big' })] },
      { en: 'The cheese is small.', he: 'הגבינה קטנה.',
        ok: size('🧀', 'small'), no: [size('🧀', 'big'), size('🎂', 'small'), size('🍞', 'big')] },
    ],
  },
  {
    id: 'animals',
    name: 'חיות וטבע',
    icon: '🦁',
    color: '#3bb273',
    words: [
      { en: 'dog', he: 'כלב', pic: '🐕' },
      { en: 'cat', he: 'חתול', pic: '🐈' },
      { en: 'bird', he: 'ציפור', pic: '🐦' },
      { en: 'fish', he: 'דג', pic: '🐟' },
      { en: 'horse', he: 'סוס', pic: '🐎' },
      { en: 'tree', he: 'עץ', pic: '🌳' },
      { en: 'flower', he: 'פרח', pic: '🌸' },
      { en: 'sun', he: 'שמש', pic: '☀️' },
      { en: 'river', he: 'נהר', pic: '🏞️' },
      { en: 'lion', he: 'אריה', pic: '🦁' },
    ],
    sentences: [
      { en: 'The cat is on the tree.', he: 'החתול על העץ.',
        ok: rel('🐈', 'on', '🌳'), no: [rel('🐈', 'next', '🌳'), rel('🐕', 'on', '🌳'), rel('🐈', 'on', '🏠')] },
      { en: 'The dog can run.', he: 'הכלב יכול לרוץ.',
        ok: [I('🐕', 56, 58, 50, { flip: 1 }), I('💨', 20, 62, 24)], no: [
          [I('🐕', 50, 62, 50), I('💤', 76, 26, 22)],
          [I('🐈', 56, 58, 50, { flip: 1 }), I('💨', 20, 62, 24)],
          [I('🐟', 50, 58, 46), I('💦', 22, 36, 20)]] },
      { en: 'The bird is in the sky.', he: 'הציפור בשמיים.',
        ok: [I('☁️', 30, 30, 30), I('☁️', 74, 44, 24), I('🐦', 52, 26, 28)], no: [
          [I('🌱', 30, 86, 20), I('🌱', 70, 86, 20), I('🐦', 50, 74, 30)],
          [I('☁️', 30, 30, 30), I('☁️', 74, 44, 24), I('✈️', 52, 26, 28)],
          [I('🌊', 50, 74, 60), I('🐟', 50, 60, 26)]] },
      { en: 'A fish lives in the river.', he: 'דג חי בנהר.',
        ok: [I('🌊', 50, 72, 64), I('🐟', 50, 44, 34, { flip: 1 })], no: [
          [I('🌳', 50, 56, 60), I('🐟', 50, 30, 22)],
          [I('🌊', 50, 70, 70), I('🐕', 46, 52, 28)],
          [I('☁️', 34, 30, 30), I('🐟', 64, 36, 26)]] },
      { en: 'The flower is red.', he: 'הפרח אדום.',
        ok: [I('🌹', 50, 54, 60)], no: [[I('🌼', 50, 54, 60)], [I('🌹', 50, 54, 60, { f: BLUE })], [I('🍎', 50, 54, 54)]] },
      { en: 'The lion is big.', he: 'האריה גדול.',
        ok: size('🦁', 'big'), no: [size('🦁', 'small'), size('🐈', 'big'), size('🐦', 'big')] },
      { en: 'The sun is hot.', he: 'השמש חמה.',
        ok: [I('☀️', 40, 36, 44), I('🥵', 74, 72, 26)], no: [
          [I('❄️', 40, 36, 40), I('🥶', 74, 72, 26)],
          [I('🌙', 40, 36, 40), I('⭐', 76, 30, 18)],
          [I('🌧️', 50, 46, 54)]] },
      { en: 'The horse eats grass.', he: 'הסוס אוכל דשא.',
        ok: [I('🐎', 42, 50, 54), I('🌿', 78, 78, 26)], no: [
          [I('🐎', 42, 50, 54), I('🍎', 78, 78, 24)],
          [I('🐄', 42, 50, 54), I('🌿', 78, 78, 26)],
          [I('🐑', 42, 50, 54), I('🌿', 78, 78, 26)]] },
      { en: 'Two birds are on the tree.', he: 'שתי ציפורים על העץ.',
        ok: rel('🐦', 'on', '🌳', 2), no: [rel('🐦', 'on', '🌳'), rel('🐦', 'under', '🌳', 2), rel('🐈', 'on', '🌳', 2)] },
      { en: 'The dog is next to the tree.', he: 'הכלב ליד העץ.',
        ok: rel('🐕', 'next', '🌳'), no: [rel('🐕', 'on', '🌳'), rel('🐈', 'next', '🌳'), rel('🐕', 'next', '🏠')] },
    ],
  },
  {
    id: 'home',
    name: 'בבית',
    icon: '🏠',
    color: '#e0679a',
    words: [
      { en: 'bed', he: 'מיטה', pic: '🛏️' },
      { en: 'sofa', he: 'ספה', pic: '🛋️' },
      { en: 'door', he: 'דלת', pic: '🚪' },
      { en: 'window', he: 'חלון', pic: '🪟' },
      { en: 'clock', he: 'שעון', pic: '⏰' },
      { en: 'key', he: 'מפתח', pic: '🔑' },
      { en: 'cup', he: 'כוס', pic: '☕' },
      { en: 'TV', he: 'טלוויזיה', pic: '📺' },
      { en: 'bath', he: 'אמבטיה', pic: '🛁' },
      { en: 'house', he: 'בית', pic: '🏠' },
    ],
    sentences: [
      { en: 'The cat is on the bed.', he: 'החתול על המיטה.',
        ok: rel('🐈', 'on', '🛏️'), no: [rel('🐈', 'under', '🛏️'), rel('🐈', 'on', '🛋️'), rel('🐕', 'on', '🛏️')] },
      { en: 'The key is on the table.', he: 'המפתח על השולחן.',
        ok: rel('🔑', 'on', '#table'), no: [rel('🔑', 'under', '#table'), rel('☕', 'on', '#table'), rel('🔑', 'on', '🛏️')] },
      { en: 'The clock is big.', he: 'השעון גדול.',
        ok: size('⏰', 'big'), no: [size('⏰', 'small'), size('🔑', 'big'), size('☕', 'big')] },
      { en: 'I sit on the sofa.', he: 'אני יושב/ת על הספה.',
        ok: rel('🧒', 'on', '🛋️'), no: [rel('🧒', 'on', '🛏️'), rel('🧒', 'next', '🛋️'), rel('🐈', 'on', '🛋️')] },
      { en: 'The TV is on the table.', he: 'הטלוויזיה על השולחן.',
        ok: rel('📺', 'on', '#table'), no: [rel('📺', 'under', '#table'), rel('⏰', 'on', '#table'), rel('📺', 'on', '🛏️')] },
      { en: 'The cup is hot.', he: 'הכוס חמה.',
        ok: [I('☕', 44, 58, 50), I('🔥', 76, 28, 22)], no: [
          [I('☕', 44, 58, 50), I('❄️', 76, 28, 22)],
          [I('🥛', 44, 58, 50), I('❄️', 76, 28, 22)],
          [I('🔑', 44, 58, 46), I('🔥', 76, 28, 22)]] },
      { en: 'There are two windows.', he: 'יש שני חלונות.',
        ok: count('🪟', 2), no: [count('🪟', 1), count('🪟', 3), count('🚪', 2)] },
      { en: 'The dog is in the bath.', he: 'הכלב באמבטיה.',
        ok: rel('🐕', 'in', '🛁'), no: [rel('🐕', 'next', '🛁'), rel('🐈', 'in', '🛁'), rel('🐕', 'on', '🛏️')] },
      { en: 'The bird is on the house.', he: 'הציפור על הבית.',
        ok: rel('🐦', 'on', '🏠'), no: [rel('🐦', 'next', '🏠'), rel('🐈', 'on', '🏠'), rel('🐦', 'on', '🌳')] },
      { en: 'I have a small key.', he: 'יש לי מפתח קטן.',
        ok: have('🧒', '🔑', { size: 'small' }), no: [have('🧒', '🔑', { size: 'big' }), have('🧒', '☕', { size: 'small' }), have('🧒', '📺', { size: 'small' })] },
    ],
  },
  {
    id: 'sport',
    name: 'ספורט ותחביבים',
    icon: '⚽',
    color: '#e5484d',
    words: [
      { en: 'ball', he: 'כדור', pic: '⚽' },
      { en: 'bike', he: 'אופניים', pic: '🚲' },
      { en: 'guitar', he: 'גיטרה', pic: '🎸' },
      { en: 'drum', he: 'תוף', pic: '🥁' },
      { en: 'kite', he: 'עפיפון', pic: '🪁' },
      { en: 'game', he: 'משחק', pic: '🎮' },
      { en: 'paint', he: 'צבע', pic: '🎨' },
      { en: 'swim', he: 'לשחות', pic: '🏊' },
      { en: 'run', he: 'לרוץ', pic: '🏃' },
      { en: 'medal', he: 'מדליה', pic: '🏅' },
    ],
    sentences: [
      { en: 'The ball is under the chair.', he: 'הכדור מתחת לכיסא.',
        ok: rel('⚽', 'under', '🪑'), no: [rel('⚽', 'on', '🪑'), rel('🏀', 'under', '🪑'), rel('⚽', 'under', '#table')] },
      { en: 'I play the guitar.', he: 'אני מנגן/ת בגיטרה.',
        ok: have('🧒', '🎸'), no: [have('🧒', '🥁'), have('🧒', '⚽'), have('🧒', '🎮')] },
      { en: 'She can swim.', he: 'היא יודעת לשחות.',
        ok: [I('🏊‍♀️', 50, 52, 60)], no: [[I('🏃‍♀️', 50, 52, 60)], [I('🚴‍♀️', 50, 52, 60)], [I('🏊‍♂️', 50, 52, 60)]] },
      { en: 'He rides a bike.', he: 'הוא רוכב על אופניים.',
        ok: [I('🚴‍♂️', 50, 52, 60)], no: [[I('🚴‍♀️', 50, 52, 60)], [I('🏃‍♂️', 50, 52, 60)], [I('🏊‍♂️', 50, 52, 60)]] },
      { en: 'The kite is in the sky.', he: 'העפיפון בשמיים.',
        ok: [I('☁️', 30, 30, 30), I('☁️', 74, 44, 24), I('🪁', 52, 26, 30)], no: [
          [I('🌱', 30, 86, 20), I('🌱', 70, 86, 20), I('🪁', 50, 72, 30)],
          [I('☁️', 30, 30, 30), I('☁️', 74, 44, 24), I('🐦', 52, 26, 28)],
          [I('🌱', 30, 86, 20), I('🌱', 70, 86, 20), I('⚽', 50, 74, 28)]] },
      { en: 'I have two balls.', he: 'יש לי שני כדורים.',
        ok: have('🧒', '⚽', { n: 2 }), no: [have('🧒', '⚽'), have('🧒', '⚽', { n: 3 }), have('🧒', '🎸', { n: 2 })] },
      { en: 'The drum is big.', he: 'התוף גדול.',
        ok: size('🥁', 'big'), no: [size('🥁', 'small'), size('🎸', 'big'), size('⚽', 'big')] },
      { en: 'He has a medal.', he: 'יש לו מדליה.',
        ok: have('👦', '🏅'), no: [have('👧', '🏅'), have('👦', '⚽'), have('👦', '🎸')] },
      { en: 'The cat is next to the bike.', he: 'החתול ליד האופניים.',
        ok: rel('🐈', 'next', '🚲'), no: [rel('🐈', 'on', '🚲'), rel('🐕', 'next', '🚲'), rel('🐈', 'next', '🥁')] },
      { en: 'I like to paint.', he: 'אני אוהב/ת לצייר.',
        ok: [I('😍', 28, 56, 40), I('🎨', 72, 60, 38), I('❤️', 50, 22, 16)], no: [
          [I('😖', 28, 56, 40), I('🎨', 72, 60, 38), I('👎', 50, 22, 16)],
          [I('😍', 28, 56, 40), I('🎮', 72, 60, 38), I('❤️', 50, 22, 16)],
          [I('😍', 28, 56, 40), I('⚽', 72, 60, 38), I('❤️', 50, 22, 16)]] },
    ],
  },
  {
    id: 'weather',
    name: 'מזג אוויר ובגדים',
    icon: '☔',
    color: '#4aa3c7',
    words: [
      { en: 'rain', he: 'גשם', pic: '🌧️' },
      { en: 'snow', he: 'שלג', pic: '☃️' },
      { en: 'cloud', he: 'ענן', pic: '☁️' },
      { en: 'umbrella', he: 'מטרייה', pic: '☂️' },
      { en: 'hat', he: 'כובע', pic: '👒' },
      { en: 'coat', he: 'מעיל', pic: '🧥' },
      { en: 'shoes', he: 'נעליים', pic: '👟' },
      { en: 'shirt', he: 'חולצה', pic: '👕' },
      { en: 'dress', he: 'שמלה', pic: '👗' },
      { en: 'socks', he: 'גרביים', pic: '🧦' },
    ],
    sentences: [
      { en: 'It is raining.', he: 'יורד גשם.',
        ok: [I('🌧️', 50, 50, 62)], no: [[I('☀️', 50, 50, 58)], [I('☃️', 50, 54, 58), I('❄️', 22, 22, 16), I('❄️', 80, 30, 14)], [I('🌙', 46, 46, 50), I('⭐', 76, 26, 16)]] },
      { en: 'I have an umbrella.', he: 'יש לי מטרייה.',
        ok: have('🧒', '☂️'), no: [have('🧒', '👒'), have('🧒', '🧥'), have('🧒', '🧦')] },
      { en: 'The shoes are under the bed.', he: 'הנעליים מתחת למיטה.',
        ok: rel('👟', 'under', '🛏️'), no: [rel('👟', 'on', '🛏️'), rel('🧦', 'under', '🛏️'), rel('👟', 'under', '#table')] },
      { en: 'The hat is on the chair.', he: 'הכובע על הכיסא.',
        ok: rel('👒', 'on', '🪑'), no: [rel('👒', 'under', '🪑'), rel('🧥', 'on', '🪑'), rel('👒', 'on', '#table')] },
      { en: 'It is cold and snowy.', he: 'קר ויש שלג.',
        ok: [I('☃️', 50, 56, 56), I('❄️', 22, 22, 16), I('❄️', 80, 30, 14)], no: [
          [I('☀️', 40, 36, 44), I('🥵', 74, 72, 26)],
          [I('🌧️', 50, 50, 62)],
          [I('☁️', 50, 50, 60)]] },
      { en: 'She has a big hat.', he: 'יש לה כובע גדול.',
        ok: have('👧', '👒', { size: 'big' }), no: [have('👧', '👒', { size: 'small' }), have('👦', '👒', { size: 'big' }), have('👧', '👟', { size: 'big' })] },
      { en: 'There are three shirts.', he: 'יש שלוש חולצות.',
        ok: count('👕', 3), no: [count('👕', 1), count('👕', 2), count('👗', 3)] },
      { en: 'The coat is in the bag.', he: 'המעיל בתוך התיק.',
        ok: rel('🧥', 'in', '🎒'), no: [rel('🧥', 'next', '🎒'), rel('👕', 'in', '🎒'), rel('🧥', 'on', '🪑')] },
      { en: 'The cloud is big.', he: 'הענן גדול.',
        ok: size('☁️', 'big'), no: [size('☁️', 'small'), size('☀️', 'big'), size('☂️', 'big')] },
      { en: 'The dress is small.', he: 'השמלה קטנה.',
        ok: size('👗', 'small'), no: [size('👗', 'big'), size('👕', 'small'), size('👒', 'small')] },
    ],
  },
  {
    id: 'travel',
    name: 'טיולים ותחבורה',
    icon: '✈️',
    color: '#8a63d2',
    words: [
      { en: 'car', he: 'מכונית', pic: '🚗' },
      { en: 'bus', he: 'אוטובוס', pic: '🚌' },
      { en: 'train', he: 'רכבת', pic: '🚆' },
      { en: 'plane', he: 'מטוס', pic: '✈️' },
      { en: 'boat', he: 'סירה', pic: '⛵' },
      { en: 'taxi', he: 'מונית', pic: '🚕' },
      { en: 'map', he: 'מפה', pic: '🗺️' },
      { en: 'ticket', he: 'כרטיס', pic: '🎫' },
      { en: 'suitcase', he: 'מזוודה', pic: '🧳' },
      { en: 'road', he: 'כביש', pic: '🛣️' },
    ],
    sentences: [
      { en: 'The plane is in the sky.', he: 'המטוס בשמיים.',
        ok: [I('☁️', 30, 30, 30), I('☁️', 74, 44, 24), I('✈️', 52, 26, 30)], no: [
          [I('☁️', 30, 30, 30), I('☁️', 74, 44, 24), I('🐦', 52, 26, 28)],
          [I('🌊', 50, 74, 60), I('⛵', 50, 52, 34)],
          [I('🛣️', 50, 66, 64), I('🚗', 50, 58, 30)]] },
      { en: 'The boat is on the water.', he: 'הסירה על המים.',
        ok: [I('🌊', 50, 74, 60), I('⛵', 50, 46, 38)], no: [
          [I('☁️', 30, 30, 30), I('⛵', 60, 34, 30)],
          [I('🌊', 50, 74, 60), I('🚗', 50, 48, 34)],
          [I('🌊', 50, 74, 60), I('🐟', 50, 52, 30)]] },
      { en: 'I have a big suitcase.', he: 'יש לי מזוודה גדולה.',
        ok: have('🧒', '🧳', { size: 'big' }), no: [have('🧒', '🧳', { size: 'small' }), have('🧒', '🗺️', { size: 'big' }), have('🧒', '🎒', { size: 'big' })] },
      { en: 'There are two cars.', he: 'יש שתי מכוניות.',
        ok: count('🚗', 2), no: [count('🚗', 1), count('🚗', 3), count('🚌', 2)] },
      { en: 'The ticket is in the bag.', he: 'הכרטיס בתוך התיק.',
        ok: rel('🎫', 'in', '🎒'), no: [rel('🎫', 'next', '🎒'), rel('🗺️', 'in', '🎒'), rel('🎫', 'on', '#table')] },
      { en: 'He has a map.', he: 'יש לו מפה.',
        ok: have('👦', '🗺️'), no: [have('👧', '🗺️'), have('👦', '🎫'), have('👦', '🧳')] },
      { en: 'The car is next to the bus.', he: 'המכונית ליד האוטובוס.',
        ok: rel('🚗', 'next', '🚌'), no: [rel('🚕', 'next', '🚌'), rel('🚗', 'next', '🚆'), rel('🚗', 'on', '🚌')] },
      { en: 'The train is fast.', he: 'הרכבת מהירה.',
        ok: [I('🚆', 56, 56, 50), I('💨', 18, 60, 24)], no: [
          [I('🚌', 56, 56, 50), I('💨', 18, 60, 24)],
          [I('🐌', 50, 62, 44)],
          [I('🚆', 50, 58, 50), I('💤', 78, 26, 22)]] },
      { en: 'The taxi is small.', he: 'המונית קטנה.',
        ok: size('🚕', 'small'), no: [size('🚕', 'big'), size('🚌', 'small'), size('🚆', 'small')] },
      { en: 'The suitcase is on the bed.', he: 'המזוודה על המיטה.',
        ok: rel('🧳', 'on', '🛏️'), no: [rel('🧳', 'under', '🛏️'), rel('🎒', 'on', '🛏️'), rel('🧳', 'on', '🪑')] },
    ],
  },
  {
    id: 'body',
    name: 'גוף ובריאות',
    icon: '🩺',
    color: '#2f9e8f',
    words: [
      { en: 'eye', he: 'עין', pic: '👁️' },
      { en: 'ear', he: 'אוזן', pic: '👂' },
      { en: 'nose', he: 'אף', pic: '👃' },
      { en: 'mouth', he: 'פה', pic: '👄' },
      { en: 'hand', he: 'יד', pic: '✋' },
      { en: 'foot', he: 'כף רגל', pic: '🦶' },
      { en: 'leg', he: 'רגל', pic: '🦵' },
      { en: 'tooth', he: 'שן', pic: '🦷' },
      { en: 'doctor', he: 'רופא/ה', pic: '🧑‍⚕️' },
      { en: 'pill', he: 'כדור (תרופה)', pic: '💊' },
    ],
    sentences: [
      { en: 'I have two hands.', he: 'יש לי שתי ידיים.',
        ok: count('✋', 2), no: [count('✋', 1), count('🦶', 2), count('👂', 2)] },
      { en: 'The doctor is next to the bed.', he: 'הרופא ליד המיטה.',
        ok: rel('🧑‍⚕️', 'next', '🛏️'), no: [rel('🧑‍🏫', 'next', '🛏️'), rel('🧑‍⚕️', 'on', '🛏️'), rel('🧑‍⚕️', 'next', '#table')] },
      { en: 'I brush my teeth.', he: 'אני מצחצח/ת שיניים.',
        ok: [I('🦷', 38, 56, 44), I('🪥', 74, 46, 34)], no: [
          [I('✋', 38, 56, 44), I('🧼', 74, 50, 30)],
          [I('🦷', 38, 56, 44), I('🍭', 74, 46, 32)],
          [I('🛁', 50, 58, 60)]] },
      { en: 'He is sick.', he: 'הוא חולה.',
        ok: [I('🤒', 50, 52, 60)], no: [[I('😀', 50, 52, 60)], [I('😴', 50, 52, 60)], [I('🥳', 50, 52, 60)]] },
      { en: 'The nose is big.', he: 'האף גדול.',
        ok: size('👃', 'big'), no: [size('👃', 'small'), size('👂', 'big'), size('👁️', 'big')] },
      { en: 'I wash my hands.', he: 'אני שוטף/ת ידיים.',
        ok: [I('✋', 38, 56, 44), I('🧼', 74, 50, 30), I('💧', 60, 22, 16)], no: [
          [I('🦷', 38, 56, 44), I('🪥', 74, 46, 34)],
          [I('🦶', 38, 56, 44), I('🧦', 74, 50, 30)],
          [I('✋', 38, 56, 44), I('🍭', 74, 46, 32)]] },
      { en: 'The doctor has a pill.', he: 'לרופא יש כדור.',
        ok: have('🧑‍⚕️', '💊'), no: [have('🧑‍⚕️', '🍭'), have('🧑‍🏫', '💊'), have('🧑‍⚕️', '📖')] },
      { en: 'I see with my eyes.', he: 'אני רואה בעיניים.',
        ok: [I('👀', 50, 52, 60)], no: [[I('👂', 50, 52, 60)], [I('👃', 50, 52, 60)], [I('👄', 50, 52, 60)]] },
      { en: 'I hear with my ears.', he: 'אני שומע/ת באוזניים.',
        ok: [I('👂', 50, 52, 60)], no: [[I('👀', 50, 52, 60)], [I('👃', 50, 52, 60)], [I('🦶', 50, 52, 60)]] },
      { en: 'The foot is small.', he: 'כף הרגל קטנה.',
        ok: size('🦶', 'small'), no: [size('🦶', 'big'), size('✋', 'small'), size('🦵', 'small')] },
    ],
  },
];

const PRIZE_GOAL = 20;
const HELPER_USES = 3;
