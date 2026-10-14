// Original pixel-art sprites drawn as box-shadow grids (block-world style).
// Each sprite is a list of rows; every character is one pixel, '.' is transparent.
const PAL = {
  k: '#1b1b1b', d: '#4a4a4a', s: '#8f8f8f', S: '#d6d6d6', w: '#ffffff',
  r: '#d83a3a', R: '#ff7a7a', o: '#e08a2e', y: '#ffd83d', Y: '#fff3a0',
  g: '#4f9a2e', G: '#8fdc5a', b: '#3b7bd8', B: '#9fd0ff', p: '#8b4ad8', P: '#c89bff',
  n: '#7a5436', N: '#a9764e', c: '#f2c9a0', m: '#ff6fb0', t: '#3dcf9a', e: '#bfe36a', q: '#c0c8d0',
};
const SPR = {
  coin: ['..oooo..', '.oYYyyo.', 'oYyyyyyo', 'oYyooyyo', 'oyyooyyo', 'oyyyyyyo', '.oyyyyo.', '..oooo..'],
  heart: ['.rr..rr.', 'rRRrrRRr', 'rRrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...'],
  star: ['....y....', '...yYy...', '...yYy...', 'yyyyYyyyy', '.yyYYYyy.', '..yyyyy..', '..yy.yy..', '.yy...yy.'],
  lock: ['..dddd..', '.dd..dd.', '.dd..dd.', 'dddddddd', 'doyyyyod', 'doyddyod', 'doyyyyod', 'doyyyyod', 'dddddddd'],
  trophy: ['y.yyyyyy.y', 'yyYYyyyyyy', 'yyYyyyyyyy', '.yyyyyyyy.', '..yyyyyy..', '...yyyy...', '....oo....', '....oo....', '..oooooo..', '..nnnnnn..'],
  pick: ['....ssss..', '...ssssss.', '..ss...ss.', '..s.....s.', '.n........', 'n.........', '.n........', 'n.........', '.n........', 'n.........'],
  // worlds
  school: ['....rr....', '...rrrr...', '..rrrrrr..', '.rrrrrrrr.', 'oSSSSSSSSo', 'oSBBSSBBSo', 'oSSSSSSSSo', 'oSBBSnnBBo', 'oSSSSnnSSo', 'oooooooooo'],
  food: ['......n...', '.....n....', '..GGgg....', '.rrrrrrr..', 'rRRrrrrrrr', 'rRrrrrrrrr', 'rrrrrrrrrr', 'rrrrrrrrrr', '.rrrrrrrr.', '..rrr.rrr.'],
  animals: ['.oo....oo.', 'oooooooooo', 'ooyyyyyyoo', 'oyyyyyyyyo', 'oyykyykyyo', 'oyyyyyyyyo', 'oyyyknkyyo', 'oyyyyyyyyo', 'ooyyyyyyoo', '.oooooooo.'],
  home: ['....rr....', '...rrrr...', '..rrrrrr..', '.rrrrrrrr.', 'rrrrrrrrrr', '.cccccccc.', '.ccBBccnn.', '.ccBBccnn.', '.ccccccnn.', '.cccccccc.'],
  sport: ['...dddd...', '..dwwkkd..', '.dwwkkkkd.', 'dwwkkkkkwd', 'dwkkkwwwwd', 'dwkkwwwwwd', 'dkkwwwwwkd', '.dwwwwkkd.', '..dwwkkd..', '...dddd...'],
  weather: ['...qqqq...', '..qwwwwq..', '.qwwwwwwq.', 'qwwwwwwwwq', 'qwwwwwwwwq', '.qqqqqqqq.', '..b..b..b.', '.b..b..b..', '..b..b..b.', '.b..b..b..'],
  travel: ['..........', '...rrrr...', '..rBBBBr..', '.rrBBBBrr.', 'rrrrrrrrrr', 'rRrrrrrrrr', 'rrrrrrrrrr', 'rkkrrrrkkr', '.kk....kk.', '..........'],
  body: ['..........', '...rrrr...', '...rRrr...', '.rrrrrrrr.', '.rRrrrrrr.', '.rrrrrrrr.', '.rrrrrrrr.', '...rrrr...', '...rrrr...', '..........'],
  // difficulties
  chick: ['..........', '...yyyy...', '..yyyyyy..', '..ykyyky..', '..yyyyyy..', '..yyoyyy..', '.yyyyyyyy.', '.yyyyyyyy.', '..yyyyyy..', '...oo.oo..'],
  smile: ['...yyyy...', '..yyyyyy..', '.yyyyyyyy.', 'yyykyykyyy', 'yyyyyyyyyy', 'yykyyyykyy', 'yyykyykyyy', '.yyykkyyy.', '..yyyyyy..', '...yyyy...'],
  shield: ['bbbbbbbbbb', 'bBBBBBBBBb', 'bBBBSSBBBb', 'bBBBSSBBBb', 'bBBSSSSBBb', '.bBBSSBBb.', '.bBBBBBBb.', '..bBBBBb..', '...bBBb...', '....bb....'],
  dict: ['.bbbbbbbb.', '.bwwwwwwb.', '.bwkkkkwb.', '.bwwwwwwb.', '.bwkkkwwb.', '.bwwwwwyb.', '.bwkkkwyb.', '.bwwwwyyb.', '.bbbbbyob.', '.....oo...'],
  // bosses
  owl: ['..n......n..', '.nnn....nnn.', '.nnnnnnnnnn.', '.nnwwnnnwwn.', '.nwkwnnnwkwn', '.nnwwnonwwn.', '.nnnnnnnnnn.', '.nNNnnnnNNn.', '.nnNNnnNNnn.', '.nnnNNNNnnn.', '..nnnnnnnn..', '...oo..oo...'],
  monster: ['.p........p.', '.pp......pp.', '..pppppppp..', '.pppppppppp.', '.ppwwppwwpp.', '.ppwkppwkpp.', '.pppppppppp.', '.ppkkkkkkpp.', '.ppkwkwkwpp.', '..pppppppp..', '..pp.pp.pp..', '..kk.kk.kk..'],
  dino: ['....GGGGG...', '...GGGGGGG..', '...GGwkGGGG.', '...GGGGGGGk.', '...GGGGwwww.', '...GGGGG....', 'GGGGGGGGG...', '.GGGGGGGG...', '.GGGGGGGGG..', '..GGGGGGGGG.', '..GG..GG....', '..kk..kk....'],
  dragon: ['.R...R...R..', '.RR.RRR.RR..', '.RRRRRRRRR..', '.RrrrrrrrR..', '.RrkkrrkkR..', '.RrrrrrrrR..', '.RrrrrrrrRRR', '.RrwwwwrR..R', '..RRRRRR.RRR', '..RR.RR.....', '..RR.RR.....', '..kk.kk.....'],
  ghost: ['....BBBB....', '..BBBBBBBB..', '.BBBBBBBBBB.', '.BBwwBBwwBB.', '.BBwkBBwkBB.', '.BBBBBBBBBB.', '.BBBBkkBBBB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '.BB.BBBB.BB.', '.B...BB...B.'],
  robot: ['.....kk.....', '....kBBk....', '..dddddddd..', '.ddSSSSSSdd.', '.dSbbSSbbSd.', '.dSbkSSbkSd.', '.dSSSSSSSSd.', '.dSkkkkkkSd.', '.dddddddddd.', '..dBBddBBd..', '..dd....dd..', '..kk....kk..'],
  octopus: ['...mmmmmm...', '..mmmmmmmm..', '.mmmmmmmmmm.', '.mmwwmmmwwm.', '.mmwkmmmwkm.', '.mmmmmmmmmm.', '.mmmmkkmmmm.', '..mmmmmmmm..', '.m.m.mm.m.m.', '.m.m.mm.m.m.', 'm..m.mm.m..m', 'm.m..mm..m.m'],
  alien: ['....GGGG....', '...GGGGGG...', '..GGGGGGGG..', '..GkkGGkkG..', '..GkwGGkwG..', '..GGGGGGGG..', '...GGkkGG...', '....GGGG....', '.G..GGGG..G.', '..GGGGGGGG..', '....GG.GG...', '....kk.kk...'],
  germ: ['..e..ee..e..', '.e.eeeeee.e.', '..eeeeeeee..', '.eeeweewee..', 'eeekweekweee', '.eeeeeeeeee.', '.eeekkkkeee.', 'eeeekRRkeeee', '.eeeeeeeeee.', '..eeeeeeee..', '.e.eeeeee.e.', '..e..ee..e..'],
};
// Render a sprite; `cell` is the pixel size, `swap` recolors characters (e.g. {r:'s'} for a grey heart).
function px(name, cell = 4, swap = {}) {
  const rows = SPR[name]; const sh = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const col = PAL[swap[ch] || ch]; if (ch !== '.' && col) sh.push(`${x * cell}px ${y * cell}px 0 0 ${col}`);
  }));
  return `<i class="px px-${name}" style="width:${rows[0].length * cell}px;height:${rows.length * cell}px"><i style="width:${cell}px;height:${cell}px;box-shadow:${sh.join(',')}"></i></i>`;
}
