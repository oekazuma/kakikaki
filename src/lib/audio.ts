let ctx: AudioContext | null = null;

// iOS は最初のタップ内で AudioContext を作る必要がある
export function unlock() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'triangle', gain = 0.15) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sfx = {
  pon: () => tone(660, 0, 0.12, 'square', 0.06),
  kira: () => [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.2)),
  fanfare: () => [523, 659, 784, 1047, 1047].forEach((f, i) => tone(f, i * 0.15, 0.4)),
  buu: () => tone(160, 0, 0.35, 'sawtooth', 0.08)
};

const SPECIAL: Record<string, string> = {
  ー: 'のばす おと',
  ぁ: 'ちいさい あ',
  ぃ: 'ちいさい い',
  ぅ: 'ちいさい う',
  ぇ: 'ちいさい え',
  ぉ: 'ちいさい お',
  ゃ: 'ちいさい や',
  ゅ: 'ちいさい ゆ',
  ょ: 'ちいさい よ',
  っ: 'ちいさい つ'
};
// カタカナは同じ読み方（ァ → ちいさい あ）
const toHira = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
export const readingOf = (c: string) => SPECIAL[toHira(c)] ?? c;

// 複数渡すと順番に読む（文字 → 単語 など）。読み終わり（または中断）で resolve
// 新しい say() が古い方を cancel すると古い utterance の onerror が来るが、古い Promise は解決しない
// （呼び出し側の「読んでいる」表示が新しい音声より先に消えないように）
let gen = 0;
export function say(text: string | string[], locale = 'ja-JP'): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  const me = ++gen;
  speechSynthesis.cancel();
  const v = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(locale.slice(0, 2)));
  const list = [text].flat();
  return new Promise((done) => {
    const timer = setTimeout(done, 15000); // 端末側でイベントが来ないときの保険
    list.forEach((t, k) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = locale;
      u.rate = 0.9;
      if (v) u.voice = v;
      const finish = () => {
        clearTimeout(timer);
        if (me === gen) done();
      };
      if (k === list.length - 1) u.onend = finish;
      u.onerror = finish; // cancel による中断も含む
      speechSynthesis.speak(u);
    });
  });
}
