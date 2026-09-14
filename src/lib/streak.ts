// 連続で練習した日数。today か前日から 1 日ずつさかのぼって続いている日を数える（今日まだ書いていなくても昨日まで続いていれば切れていない扱い）
// YYYY-MM-DD だけの文字列は仕様で UTC として解釈される
const dayNum = (d: string) => Date.parse(d) / 86_400_000;

export function streak(days: string[], today: string): number {
  const set = new Set(days.map(dayNum));
  let cur = dayNum(today);
  if (!set.has(cur)) cur -= 1;
  let n = 0;
  while (set.has(cur)) {
    n++;
    cur -= 1;
  }
  return n;
}
