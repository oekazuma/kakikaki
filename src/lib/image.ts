import { base } from '$app/paths';
import type { Lang } from './lang.svelte';
import type { Word } from './words';

export const imageUrl = (w: Word) => `${base}/img/${w.id}.svg`;
export const logoUrl = (l: Lang) => `${base}/logo-mark${l === 'ja' ? '' : `-${l}`}.svg`;
