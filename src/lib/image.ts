import { base } from '$app/paths';
import type { Word } from './words';

export const imageUrl = (w: Word) => `${base}/img/${w.id}.svg`;
