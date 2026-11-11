import { KANJI } from './kanji';

// 生年月日（YYYY-MM-DD）と学年、子ども向けの文の表示。文は {漢字|よみ} の書き方つきで 1 通りだけ書き、
// 使う人の学年で、習った漢字にするか読みにするかと、言葉の間の空白を決める

export function isBirth(s: unknown, today: string): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return false;
  const r = birthRange(today);
  return s <= r.max && s >= r.min;
}

export const birthRange = (today: string) => ({
  min: `${Number(today.slice(0, 4)) - 100}${today.slice(4)}`,
  max: today
});

// 4 月 2 日〜翌 4 月 1 日生まれが同じ学年（4 月 1 日生まれは前の学年）。学年は 4 月 1 日に上がる。
// 0 以下は小学校に入る前、7 からは中学生以上
export function schoolGrade(birth: string, today: string): number {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  const cohort = bm > 4 || (bm === 4 && bd >= 2) ? by : by - 1;
  return (tm >= 4 ? ty : ty - 1) - cohort - 6;
}

// 使ってよい漢字の学年の上限。1 年の途中で増やさず、1 つ前の学年までにする
export const kanjiUpTo = (grade: number | null) => (grade == null ? 0 : Math.min(6, Math.max(0, grade - 1)));

const allowed = Array.from({ length: 7 }, (_, n) => new Set(KANJI.filter((k) => k.grade <= n).flatMap((k) => k.chars)));
// カタカナは 1 年生で習う字として扱う（書き方 {メダル|めだる} は 2 年生からカタカナになる）
const KATAKANA = /[゠-ヿ]/;
const WORD = /[ぁ-ゟ゠-ヿ々一-鿿]/;

// 答えを隠している画面では、隠している字を含む語を読みにする（「お手本なし」で 手 を書かせない）
export function display(text: string, grade: number | null, hidden: readonly string[] = []): string {
  const upTo = kanjiUpTo(grade);
  const ok = (c: string) => (KATAKANA.test(c) ? upTo >= 1 : allowed[upTo].has(c)) && !hidden.includes(c);
  const s = text.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (_, kanji: string, yomi: string) =>
    [...kanji].every(ok) ? kanji : yomi
  );
  if ((grade ?? 0) < 3) return s;
  return s.replace(/ /g, (sp, i: number) => (WORD.test(s[i - 1] ?? '') && WORD.test(s[i + 1] ?? '') ? '' : sp));
}
