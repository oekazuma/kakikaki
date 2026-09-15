// 横向きに描かれているイラストの向き（Twemoji は左向きが多い）。走る向きと合わないときは左右反転する
const LEFT = new Set([
  'giraffe',
  'sheep',
  'horse',
  'dolphin',
  'fish',
  'turtle',
  'snake',
  'crocodile',
  'bird',
  'zebra',
  'whale',
  'dinosaur',
  'duck',
  'shark',
  'shrimp',
  'snail',
  'ant',
  'beetle',
  'goat',
  'hippo',
  'elephant',
  'squirrel'
]);
const RIGHT = new Set(['kangaroo']);
// dir の向きに進むとき反転が必要か（正面向きの絵はどちらでもそのまま）
export const flipFor = (id: string, dir: 'left' | 'right') => (dir === 'right' ? LEFT.has(id) : RIGHT.has(id));
