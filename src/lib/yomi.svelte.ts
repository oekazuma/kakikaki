import { display, isBirth, schoolGrade } from './grade';
import { current, profiles } from './profiles.svelte';
import { today } from './today';

// 答えを隠している画面（おてほんなし、かきクイズ、読みを聞いて字を選ぶ よみクイズ）が入れ、離れるときに空にする
export const hide = $state<{ v: string[] }>({ v: [] });

export function gradeNow(): number | null {
  const b = current().birth;
  const d = today();
  return isBirth(b, d) ? schoolGrade(b, d) : null;
}

export const missingBirth = () => profiles.list.filter((p) => !isBirth(p.birth, today()));

// 子ども向けの文を、いまの人の学年で表示する。タグ付きテンプレートで呼ぶと差し込む前の文だけを変換し、値はそのまま入れる。
// 値のとなりの空白は値の端の字で決めたいので、前後の値の 1 字を付けて変換してから外す
export function t(text: string | TemplateStringsArray, ...values: unknown[]): string {
  const g = gradeNow();
  if (typeof text === 'string') return display(text, g, hide.v);
  const vs = values.map(String);
  return text
    .map((chunk, i) => {
      const before = vs[i - 1]?.at(-1) ?? '';
      const after = vs[i]?.[0] ?? '';
      const s = display(before + chunk + after, g, hide.v);
      return s.slice(before.length, s.length - after.length) + (vs[i] ?? '');
    })
    .join('');
}
