import { afterNavigate, beforeNavigate } from '$app/navigation';

// 一覧ページのスクロール位置を、離れる直前に覚えて戻ってきたときに復元する（もどる はホームへの新しい遷移で、
// SvelteKit が先頭へスクロールするため。6 年の字を開いて戻ると 1 年の先頭に戻ってしまっていた）。
// ページの読み直しでは消えてよいのでメモリに持つ
const saved = new Map<string, number>();
export function keepScroll(key: () => string) {
  beforeNavigate(() => saved.set(key(), scrollY));
  afterNavigate(() => {
    const y = saved.get(key());
    if (y) scrollTo(0, y);
  });
}
