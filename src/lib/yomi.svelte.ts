import { display, isBirth, schoolGrade } from './grade';
import { current, profiles } from './profiles.svelte';
import { today } from './today';

// 答えを隠している画面（おてほんなし、かきクイズ、読みを聞いて字を選ぶ よみクイズ）が入れ、離れるときに空にする
export const hide = $state<{ v: string[] }>({ v: [] });

export function hiding(chars: () => string[]) {
  $effect(() => {
    hide.v = chars();
    return () => (hide.v = []);
  });
}

export function gradeNow(): number | null {
  const b = current().birth;
  const d = today();
  return isBirth(b, d) ? schoolGrade(b, d) : null;
}

// 空の生年月日は「あとで」と答えた人。聞き直さず、学年なし（かなだけ）で表示する
export const missingBirth = () => profiles.list.filter((p) => p.birth !== '' && !isBirth(p.birth, today()));

// 値を差し込む文は差し込んだあとの文字列を渡す。差し込む値は数・字・ことばの名前・変換済みの名前だけなので、
// 続けて変換しても値は変わらない（空白を持つ人の名前などは子ども向けの文に差し込まない）
export const t = (text: string) => display(text, gradeNow(), hide.v);
