import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';

// resolve() はクエリ文字列を付けられないので、練習画面の URL はここで組み立てる
export const practiceUrl = (id: string) => `${resolve('/practice')}?w=${id}` as ResolvedPathname;
