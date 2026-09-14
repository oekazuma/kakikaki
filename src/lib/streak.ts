// 連続で練習した日数。today か前日から 1 日ずつさかのぼって続いている日を数える（今日まだ書いていなくても昨日まで続いていれば切れていない扱い）
const dayNum = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd) / 86_400_000;
};

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
