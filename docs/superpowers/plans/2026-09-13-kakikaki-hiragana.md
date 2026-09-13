# かきかき ひらがな 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** iPad 横画面用のひらがな書き練習 PWA を SvelteKit で作り、GitHub Pages に公開する。

**Architecture:** 純粋関数（幾何・判定・採点・認識）を `src/lib/*.ts` に置き vitest で守る。UI は Svelte 5 コンポーネント、状態は `localStorage` 直結の `$state`。書き順は KanjiVG から生成した静的データ。

**Tech Stack:** SvelteKit (Svelte 5 runes, TypeScript), adapter-static, vitest, pnpm, Node 24。追加ランタイム依存なし。

**Spec:** `docs/superpowers/specs/2026-09-13-kakikaki-design.md`

## Global Constraints

- 追加ライブラリなし（devDependencies は scaffold が入れるものと vitest のみ）。
- 座標系は KanjiVG の 109×109 viewBox。判定・採点・認識はすべてこの単位。
- UI テキストはすべてひらがな中心の日本語（子ども向け）。保護者向け画面だけ漢字可。
- 画面は横向き前提。縦向きは案内オーバーレイ。
- `kit.paths.base` = `process.env.BASE_PATH ?? '/kakikaki'`。画像などの静的パスは必ず `base` を前置。
- Svelte ファイルを書く時は svelte:svelte-code-writer スキル（MCP の autofixer）で検証する。
- コミットは各タスク末尾。メッセージ末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。

---

### Task 1: scaffold と基本設定

**Files:**
- Create: プロジェクト一式（`sv create`）、`svelte.config.js`、`src/routes/+layout.ts`、`src/app.html`、`src/app.css`
- Test: `pnpm check`、`pnpm test`

**Interfaces:**
- Produces: `pnpm dev / build / test / check` が動く SvelteKit プロジェクト。`base` は `$app/paths` から取る。

- [ ] **Step 1: scaffold**

```bash
cd ~/localRepo/kakikaki
pnpm dlx sv@latest create --template minimal --types ts --add vitest="usages:unit" --install pnpm --no-dir-check --no-download-check .
pnpm add -D @sveltejs/adapter-static
pnpm remove @sveltejs/adapter-auto
```

- [ ] **Step 2: svelte.config.js**

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: undefined }),
		paths: { base: process.env.BASE_PATH ?? '/kakikaki' },
		serviceWorker: { register: true }
	}
};
```

- [ ] **Step 3: `src/routes/+layout.ts`**

```ts
export const prerender = true;
export const ssr = false;
```

- [ ] **Step 4: `src/app.html`**（`%sveltekit.head%` の前に追加）

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="かきかき" />
<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
<link rel="apple-touch-icon" href="%sveltekit.assets%/icon-180.png" />
<link rel="stylesheet" href="%sveltekit.assets%/app.css" />
```

`<html lang="ja">` にする。

- [ ] **Step 5: `static/app.css`**

```css
:root {
	--bg: #f4f5f0;
	--card: #fff;
	--ink: #1f2933;
	--sub: #6b7280;
	--blue: #4f7cae;
	--teal: #13786f;
	--guide: #d9dfe4;
	--star: #f5b400;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--bg); color: var(--ink);
	font-family: "Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Hiragino Sans", sans-serif;
	-webkit-user-select: none; user-select: none; -webkit-touch-callout: none; overscroll-behavior: none; }
button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.card { background: var(--card); border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
```

- [ ] **Step 6: 動作確認とコミット**

```bash
pnpm check && pnpm test && pnpm build
git add -A && git commit -m "chore: SvelteKit scaffold と静的配信設定"
```

---

### Task 2: 書き順データ生成

**Files:**
- Create: `scripts/fetch-strokes.ts`, `src/lib/chars.ts`, `src/lib/strokes.ts`（生成物）
- Test: `src/lib/strokes.test.ts`

**Interfaces:**
- Produces: `CHARS: string[]`（81 文字、収録順）、`GOJUON: string[][]`（表レイアウト、空欄は `''`）、`STROKES: Record<string, string[]>`（文字 → path d 配列）。

- [ ] **Step 1: `src/lib/chars.ts`**

```ts
export const GOJUON: string[][] = [
	['あ', 'い', 'う', 'え', 'お'],
	['か', 'き', 'く', 'け', 'こ'],
	['さ', 'し', 'す', 'せ', 'そ'],
	['た', 'ち', 'つ', 'て', 'と'],
	['な', 'に', 'ぬ', 'ね', 'の'],
	['は', 'ひ', 'ふ', 'へ', 'ほ'],
	['ま', 'み', 'む', 'め', 'も'],
	['や', '', 'ゆ', '', 'よ'],
	['ら', 'り', 'る', 'れ', 'ろ'],
	['わ', '', '', '', 'を'],
	['ん', 'ー', '', '', ''],
	['が', 'ぎ', 'ぐ', 'げ', 'ご'],
	['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
	['だ', 'ぢ', 'づ', 'で', 'ど'],
	['ば', 'び', 'ぶ', 'べ', 'ぼ'],
	['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
	['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'],
	['ゃ', 'ゅ', 'ょ', 'っ', '']
];
export const CHARS = GOJUON.flat().filter(Boolean);
```

- [ ] **Step 2: `scripts/fetch-strokes.ts`**

```ts
// 実行: node scripts/fetch-strokes.ts  (Node 24 の型ストリップで動く)
import { writeFileSync } from 'node:fs';
import { CHARS } from '../src/lib/chars.ts';

const out: Record<string, string[]> = {};
for (const c of CHARS) {
	const cp = c.codePointAt(0)!.toString(16).padStart(5, '0');
	const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${cp}.svg`);
	if (!res.ok) throw new Error(`${c} ${cp} ${res.status}`);
	const svg = await res.text();
	const ds = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s\d+" d="([^"]+)"/g)].map((m) => m[1]);
	if (ds.length === 0) throw new Error(`no strokes for ${c}`);
	for (const d of ds) {
		const bad = d.replace(/[MmLlCcSsHhVvZz0-9.,\- ]/g, '');
		if (bad) throw new Error(`unsupported path command in ${c}: ${bad}`);
	}
	out[c] = ds;
}
writeFileSync(
	'src/lib/strokes.ts',
	`// KanjiVG (https://kanjivg.tagaini.net) の書き順データ。CC BY-SA 3.0。scripts/fetch-strokes.ts で生成。\nexport const STROKES: Record<string, string[]> = ${JSON.stringify(out, null, '\t')};\n`
);
console.log(Object.keys(out).length, 'chars');
```

- [ ] **Step 3: 実行**

```bash
node scripts/fetch-strokes.ts
```
Expected: `81 chars`。

- [ ] **Step 4: `src/lib/strokes.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { CHARS } from './chars';
import { STROKES } from './strokes';

describe('STROKES', () => {
	it('81 文字すべてに 1 画以上ある', () => {
		expect(CHARS.length).toBe(81);
		for (const c of CHARS) expect(STROKES[c]?.length, c).toBeGreaterThan(0);
	});
	it('画数の例', () => {
		expect(STROKES['あ'].length).toBe(3);
		expect(STROKES['ー'].length).toBe(1);
		expect(STROKES['ぱ'].length).toBe(4);
	});
});
```

- [ ] **Step 5: テストとコミット**

```bash
pnpm test
git add -A && git commit -m "feat: KanjiVG から書き順データを生成"
```

---

### Task 3: 幾何ユーティリティ（path → 点列）

**Files:**
- Create: `src/lib/geometry.ts`
- Test: `src/lib/geometry.test.ts`

**Interfaces:**
- Produces: `type Pt = { x: number; y: number }`、`dist(a, b)`、`pathToPoints(d, step = 1.5): Pt[]`、`resample(pts, step): Pt[]`、`resampleN(pts, n): Pt[]`、`length(pts)`、`nearestDist(p, pts)`、`centroid(pts)`、`translate(pts, dx, dy)`。

- [ ] **Step 1: テスト `src/lib/geometry.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { pathToPoints, resampleN, length, nearestDist, centroid, dist } from './geometry';

describe('geometry', () => {
	it('直線 path を等間隔に分割する', () => {
		const pts = pathToPoints('M0,0 L30,0', 10);
		expect(pts.map((p) => p.x)).toEqual([0, 10, 20, 30]);
	});
	it('相対コマンドと曲線を扱う', () => {
		const pts = pathToPoints('M10,10c10,0,10,10,20,10s10,10,0,20', 1);
		expect(pts[0]).toEqual({ x: 10, y: 10 });
		expect(dist(pts.at(-1)!, { x: 30, y: 40 })).toBeLessThan(0.01);
		expect(length(pts)).toBeGreaterThan(40);
	});
	it('resampleN はちょうど n 点', () => {
		const pts = resampleN([{ x: 0, y: 0 }, { x: 100, y: 0 }], 5);
		expect(pts.map((p) => p.x)).toEqual([0, 25, 50, 75, 100]);
	});
	it('nearestDist / centroid', () => {
		const line = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
		expect(nearestDist({ x: 5, y: 3 }, line)).toBeCloseTo(Math.hypot(5, 3));
		expect(centroid(line)).toEqual({ x: 5, y: 0 });
	});
});
```

- [ ] **Step 2: 失敗を確認** `pnpm test` → geometry.ts が無くて FAIL。

- [ ] **Step 3: `src/lib/geometry.ts`**

```ts
export type Pt = { x: number; y: number };

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function length(pts: Pt[]) {
	let L = 0;
	for (let k = 1; k < pts.length; k++) L += dist(pts[k - 1], pts[k]);
	return L;
}

// 3 次ベジェを 16 分割した折れ線（始点は含まない）
function cubic(p0: Pt, c1: Pt, c2: Pt, p3: Pt): Pt[] {
	const out: Pt[] = [];
	for (let i = 1; i <= 16; i++) {
		const t = i / 16, u = 1 - t;
		out.push({
			x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
			y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y
		});
	}
	return out;
}

// KanjiVG が使う M L H V C S Z（大小）だけ対応
export function pathToPoints(d: string, step = 1.5): Pt[] {
	const tokens = d.match(/[MmLlCcSsHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
	const raw: Pt[] = [];
	let cmd = 'M', i = 0, cur: Pt = { x: 0, y: 0 }, start = cur, prevCtrl: Pt | null = null;
	const num = () => parseFloat(tokens[i++]);
	while (i < tokens.length) {
		if (/[A-Za-z]/.test(tokens[i])) {
			cmd = tokens[i++];
			if (cmd === 'Z' || cmd === 'z') { raw.push(start); cur = start; prevCtrl = null; continue; }
		}
		const rel = cmd === cmd.toLowerCase();
		const ox = rel ? cur.x : 0, oy = rel ? cur.y : 0;
		switch (cmd.toUpperCase()) {
			case 'M': cur = { x: ox + num(), y: oy + num() }; start = cur; raw.push(cur); prevCtrl = null; cmd = rel ? 'l' : 'L'; break;
			case 'L': cur = { x: ox + num(), y: oy + num() }; raw.push(cur); prevCtrl = null; break;
			case 'H': cur = { x: ox + num(), y: cur.y }; raw.push(cur); prevCtrl = null; break;
			case 'V': cur = { x: cur.x, y: oy + num() }; raw.push(cur); prevCtrl = null; break;
			case 'C': {
				const c1 = { x: ox + num(), y: oy + num() }, c2 = { x: ox + num(), y: oy + num() }, p = { x: ox + num(), y: oy + num() };
				raw.push(...cubic(cur, c1, c2, p)); prevCtrl = c2; cur = p; break;
			}
			case 'S': {
				const c1 = prevCtrl ? { x: 2 * cur.x - prevCtrl.x, y: 2 * cur.y - prevCtrl.y } : cur;
				const c2 = { x: ox + num(), y: oy + num() }, p = { x: ox + num(), y: oy + num() };
				raw.push(...cubic(cur, c1, c2, p)); prevCtrl = c2; cur = p; break;
			}
			default: throw new Error(`unsupported path command ${cmd}`);
		}
	}
	return resample(raw, step);
}

// 折れ線を弧長 step ごとの点に打ち直す（始点・終点を含む）
export function resample(pts: Pt[], step: number): Pt[] {
	if (pts.length === 0) return [];
	const out = [pts[0]];
	let acc = 0;
	for (let k = 1; k < pts.length; k++) {
		let a = pts[k - 1];
		const b = pts[k];
		let seg = dist(a, b);
		while (seg > 0 && acc + seg >= step) {
			const p = lerp(a, b, (step - acc) / seg);
			out.push(p); a = p; seg = dist(a, b); acc = 0;
		}
		acc += seg;
	}
	const last = pts[pts.length - 1];
	if (dist(out[out.length - 1], last) > 1e-6) out.push(last);
	return out;
}

export function resampleN(pts: Pt[], n: number): Pt[] {
	const L = length(pts);
	if (L === 0) return Array.from({ length: n }, () => pts[0]);
	const out = resample(pts, L / (n - 1)).slice(0, n);
	while (out.length < n) out.push(pts[pts.length - 1]);
	return out;
}

export function nearestDist(p: Pt, pts: Pt[]) {
	let m = Infinity;
	for (const q of pts) m = Math.min(m, dist(p, q));
	return m;
}

export function centroid(pts: Pt[]): Pt {
	const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
	return { x: s.x / pts.length, y: s.y / pts.length };
}

export const translate = (pts: Pt[], dx: number, dy: number) => pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
```

- [ ] **Step 4: `pnpm test` → PASS**。`resampleN` の直線ケースで浮動小数のズレが出たら `toBeCloseTo` に変える。

- [ ] **Step 5: コミット** `git commit -am "feat: SVG path を点列にする幾何ユーティリティ"`

---

### Task 4: なぞる / じぶんでかく の判定

**Files:**
- Create: `src/lib/judge.ts`
- Test: `src/lib/judge.test.ts`

**Interfaces:**
- Consumes: `Pt, dist, nearestDist` from geometry。
- Produces: `JUDGE` 定数、`canStart(samples, p)`、`advance(samples, cursor, p): number`（-1 = 逸脱）、`traceDone(samples, cursor)`、`coverage(samples, trail): number`（0〜1）。

- [ ] **Step 1: テスト `src/lib/judge.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { canStart, advance, traceDone, coverage, JUDGE } from './judge';

const line = Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: 50 })); // 0..100

describe('なぞる', () => {
	it('始点の近くからしか始められない', () => {
		expect(canStart(line, { x: 3, y: 52 })).toBe(true);
		expect(canStart(line, { x: 40, y: 50 })).toBe(false);
	});
	it('線に沿って進むと cursor が進む', () => {
		let c = 0;
		for (const x of [4, 9, 14, 19]) c = advance(line, c, { x, y: 51 });
		expect(c).toBe(3);
	});
	it('先へ飛びすぎても K を超えては進まない', () => {
		expect(advance(line, 0, { x: 60, y: 50 })).toBe(-1);
	});
	it('線から外れると -1', () => {
		expect(advance(line, 5, { x: 25, y: 50 + JUDGE.R_TRACE + 5 })).toBe(-1);
	});
	it('末尾付近で完了', () => {
		expect(traceDone(line, 20)).toBe(true);
		expect(traceDone(line, 18)).toBe(true);
		expect(traceDone(line, 10)).toBe(false);
	});
});

describe('じぶんでかく', () => {
	it('半分なぞれば coverage 0.5 前後', () => {
		const trail = Array.from({ length: 50 }, (_, i) => ({ x: i, y: 48 }));
		const cov = coverage(line, trail);
		expect(cov).toBeGreaterThan(0.45);
		expect(cov).toBeLessThan(0.6);
	});
	it('離れた所を塗っても 0', () => {
		expect(coverage(line, [{ x: 50, y: 90 }])).toBe(0);
	});
});
```

- [ ] **Step 2: `pnpm test` → FAIL**

- [ ] **Step 3: `src/lib/judge.ts`**

```ts
import { dist, nearestDist, type Pt } from './geometry';

// 単位は 109 マスの viewBox。指の太さを考えて緩め。
export const JUDGE = { R_START: 12, R_TRACE: 10, K: 6, R_FREE: 9, FREE_DONE: 0.9, END_SLACK: 2 };

export const canStart = (samples: Pt[], p: Pt) => dist(samples[0], p) <= JUDGE.R_START;

// cursor から K 点先までで、指に届いている最遠の点へ進める。届く点が無ければ -1（逸脱）。
export function advance(samples: Pt[], cursor: number, p: Pt): number {
	let best = -1;
	for (let k = cursor; k <= Math.min(cursor + JUDGE.K, samples.length - 1); k++) {
		if (dist(samples[k], p) <= JUDGE.R_TRACE) best = k;
	}
	if (best === -1 && dist(samples[cursor], p) <= JUDGE.R_START) return cursor;
	return best;
}

export const traceDone = (samples: Pt[], cursor: number) => cursor >= samples.length - 1 - JUDGE.END_SLACK;

// ponytail: O(samples×trail) の総当たり。1 画あたり数千回の距離計算で済むので十分。
export function coverage(samples: Pt[], trail: Pt[]): number {
	if (samples.length === 0) return 0;
	const hit = samples.filter((s) => nearestDist(s, trail) <= JUDGE.R_FREE).length;
	return hit / samples.length;
}
```

- [ ] **Step 4: `pnpm test` → PASS**

- [ ] **Step 5: コミット** `git commit -am "feat: なぞる・じぶんでかくの判定ロジック"`

---

### Task 5: 採点

**Files:**
- Create: `src/lib/score.ts`
- Test: `src/lib/score.test.ts`

**Interfaces:**
- Consumes: geometry。
- Produces: `strokeScore(trail: Pt[], samples: Pt[]): number`（0〜1）、`stars(score: number): 1 | 2 | 3`、`praise(stars): string`。

- [ ] **Step 1: テスト `src/lib/score.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { strokeScore, stars } from './score';

const line = Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: 50 }));

describe('score', () => {
	it('お手本どおりなら 3 つ星', () => {
		expect(stars(strokeScore(line, line))).toBe(3);
	});
	it('大きくずれると 1 つ星', () => {
		const off = line.map((p) => ({ x: p.x, y: p.y + 15 }));
		expect(stars(strokeScore(off, line))).toBe(1);
	});
	it('逆向きは減点', () => {
		const rev = [...line].reverse();
		expect(strokeScore(rev, line)).toBeLessThanOrEqual(0.5);
	});
});
```

- [ ] **Step 2: `pnpm test` → FAIL**

- [ ] **Step 3: `src/lib/score.ts`**

```ts
import { dist, nearestDist, type Pt } from './geometry';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function strokeScore(trail: Pt[], samples: Pt[]): number {
	if (trail.length === 0) return 0;
	const d = trail.reduce((a, p) => a + nearestDist(p, samples), 0) / trail.length;
	let s = 1 - clamp(d / 12, 0, 1);
	const t0 = trail[0], t1 = trail[trail.length - 1], s0 = samples[0], s1 = samples[samples.length - 1];
	if (dist(t0, s1) + dist(t1, s0) < dist(t0, s0) + dist(t1, s1)) s -= 0.5;
	return clamp(s, 0, 1);
}

export const stars = (score: number): 1 | 2 | 3 => (score >= 0.85 ? 3 : score >= 0.65 ? 2 : 1);

export const praise = (n: 1 | 2 | 3) => (n === 3 ? 'すごい！ とても じょうず！' : n === 2 ? 'じょうず！' : 'かけたね！ もっと きれいに かけるかな？');
```

- [ ] **Step 4: `pnpm test` → PASS**

- [ ] **Step 5: コミット** `git commit -am "feat: 書いた線の採点"`

---

### Task 6: 手書き認識

**Files:**
- Create: `src/lib/recognize.ts`
- Test: `src/lib/recognize.test.ts`

**Interfaces:**
- Consumes: `STROKES`、geometry。
- Produces: `RECOG` 定数、`type Template = { char: string; strokes: Pt[][] }`、`TEMPLATES: Template[]`（モジュール読み込み時に生成）、`normalize(strokes: Pt[][]): Pt[][]`、`recognize(strokes: Pt[][], templates = TEMPLATES): { char: string; dist: number }[]`（昇順）、`passes(target: string, results): boolean`、`testScore(dist): number`（0〜1）。

- [ ] **Step 1: テスト `src/lib/recognize.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { STROKES } from './strokes';
import { CHARS } from './chars';
import { pathToPoints, translate } from './geometry';
import { recognize, passes, TEMPLATES } from './recognize';

const drawn = (c: string) => STROKES[c].map((d) => pathToPoints(d, 1.5));

describe('recognize', () => {
	it('お手本そのものは 81 文字すべて 1 位が自分', () => {
		for (const c of CHARS) expect(recognize(drawn(c))[0].char, c).toBe(c);
	});
	it('ずれて・少し震えていても合格', () => {
		let seed = 7;
		const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 4;
		for (const c of ['あ', 'ぱ', 'し', 'ー', 'っ']) {
			const strokes = drawn(c).map((s) => translate(s, 6, -4).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() })));
			expect(passes(c, recognize(strokes)), c).toBe(true);
		}
	});
	it('画数が違う別の字は不合格', () => {
		expect(passes('あ', recognize(drawn('ー')))).toBe(false);
	});
	it('TEMPLATES は 81 個', () => expect(TEMPLATES.length).toBe(81));
});
```

- [ ] **Step 2: `pnpm test` → FAIL**

- [ ] **Step 3: `src/lib/recognize.ts`**

```ts
import { STROKES } from './strokes';
import { centroid, dist, pathToPoints, resampleN, translate, type Pt } from './geometry';

// 調整ノブ。iPad で実際に子どもが書いた結果を見て変える。
export const RECOG = { N: 32, PENALTY_STROKE: 40, MARGIN: 8, D_MAX: 30 };

export type Template = { char: string; strokes: Pt[][] };

// 各画を N 点にそろえ、全体の重心をマスの中央へ寄せる（拡大縮小はしない）
export function normalize(strokes: Pt[][]): Pt[][] {
	const rs = strokes.filter((s) => s.length > 0).map((s) => resampleN(s, RECOG.N));
	if (rs.length === 0) return [];
	const c = centroid(rs.flat());
	return rs.map((s) => translate(s, 54.5 - c.x, 54.5 - c.y));
}

export const TEMPLATES: Template[] = Object.entries(STROKES).map(([char, ds]) => ({
	char,
	strokes: normalize(ds.map((d) => pathToPoints(d, 1.5)))
}));

function distance(a: Pt[][], b: Pt[][]) {
	const m = Math.min(a.length, b.length);
	if (m === 0) return Infinity;
	let sum = 0;
	for (let i = 0; i < m; i++) {
		let d = 0;
		for (let k = 0; k < RECOG.N; k++) d += dist(a[i][k], b[i][k]);
		sum += d / RECOG.N;
	}
	return sum / m + Math.abs(a.length - b.length) * RECOG.PENALTY_STROKE;
}

export function recognize(strokes: Pt[][], templates = TEMPLATES) {
	const input = normalize(strokes);
	return templates.map((t) => ({ char: t.char, dist: distance(input, t.strokes) })).sort((p, q) => p.dist - q.dist);
}

export function passes(target: string, results: { char: string; dist: number }[]) {
	const i = results.findIndex((r) => r.char === target);
	if (i === 0) return results[0].dist < RECOG.D_MAX * 2;
	return i === 1 && results[1].dist - results[0].dist < RECOG.MARGIN;
}

export const testScore = (d: number) => 1 - Math.min(1, Math.max(0, d / RECOG.D_MAX));
```

- [ ] **Step 4: `pnpm test` → PASS**。「ずれて」テストが落ちる場合は `MARGIN` / 震え幅ではなく、どの文字が 1 位になったかをログして原因を見る。

- [ ] **Step 5: コミット** `git commit -am "feat: お手本との形比較による手書き認識"`

---

### Task 7: 単語データと乗り物イラスト

**Files:**
- Create: `src/lib/words.ts`, `static/img/{patocar,fire-truck,ambulance,garbage-truck,bus,train,shinkansen,airplane}.svg`
- Test: `src/lib/words.test.ts`

**Interfaces:**
- Produces: `type Word = { id: string; name: string; category: string; desc?: string }`、`WORDS: Word[]`、`CATEGORIES: string[]`（出現順）、`wordById(id)`、`charWord(c): Word`（`id: 'char-あ'`、文字一覧から来た 1 文字用）、`imageUrl(word) = \`${base}/img/${word.id}.svg\``。画像の有無はブラウザ側で `<img onerror>` で判定。

- [ ] **Step 1: テスト `src/lib/words.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { WORDS, charWord, wordById } from './words';
import { STROKES } from './strokes';

describe('words', () => {
	it('全単語の全文字に書き順がある', () => {
		for (const w of WORDS) for (const c of w.name) expect(STROKES[c], `${w.name}:${c}`).toBeDefined();
	});
	it('id は一意', () => {
		expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
	});
	it('charWord / wordById', () => {
		expect(charWord('あ')).toEqual({ id: 'char-あ', name: 'あ', category: 'もじ' });
		expect(wordById('bus')?.name).toBe('ばす');
		expect(wordById('char-ぱ')?.name).toBe('ぱ');
	});
});
```

- [ ] **Step 2: `pnpm test` → FAIL**

- [ ] **Step 3: `src/lib/words.ts`**

```ts
import { base } from '$app/paths';

export type Word = { id: string; name: string; category: string; desc?: string };

// 画像は static/img/<id>.svg か .png。無ければ頭文字カードで代用される。
export const WORDS: Word[] = [
	{ id: 'patocar', name: 'ぱとかー', category: 'のりもの', desc: 'まちを まもるよ' },
	{ id: 'fire-truck', name: 'しょうぼうしゃ', category: 'のりもの', desc: 'ひを けすよ' },
	{ id: 'ambulance', name: 'きゅうきゅうしゃ', category: 'のりもの', desc: 'びょういんへ はこぶよ' },
	{ id: 'garbage-truck', name: 'ごみしゅうしゅうしゃ', category: 'のりもの', desc: 'ごみを あつめるよ' },
	{ id: 'bus', name: 'ばす', category: 'のりもの', desc: 'みんなを のせるよ' },
	{ id: 'train', name: 'でんしゃ', category: 'のりもの', desc: 'せんろを はしるよ' },
	{ id: 'shinkansen', name: 'しんかんせん', category: 'のりもの', desc: 'とても はやいよ' },
	{ id: 'airplane', name: 'ひこうき', category: 'のりもの', desc: 'そらを とぶよ' },
	{ id: 'chiikawa', name: 'ちいかわ', category: 'ちいかわ' },
	{ id: 'hachiware', name: 'はちわれ', category: 'ちいかわ' },
	{ id: 'usagi', name: 'うさぎ', category: 'ちいかわ' },
	{ id: 'anpanman', name: 'あんぱんまん', category: 'あんぱんまん' },
	{ id: 'baikinman', name: 'ばいきんまん', category: 'あんぱんまん' },
	{ id: 'dokinchan', name: 'どきんちゃん', category: 'あんぱんまん' },
	{ id: 'precure', name: 'ぷりきゅあ', category: 'ぷりきゅあ' }
];

export const CATEGORIES = [...new Set(WORDS.map((w) => w.category))];

export const charWord = (c: string): Word => ({ id: `char-${c}`, name: c, category: 'もじ' });

export const wordById = (id: string): Word | undefined =>
	id.startsWith('char-') ? charWord(id.slice(5)) : WORDS.find((w) => w.id === id);

export const imageUrl = (w: Word) => `${base}/img/${w.id}.svg`;
```

vitest で `$app/paths` を解決させるため `vite.config.ts` の test 設定に `alias: { '$app/paths': '/src/lib/test/app-paths.ts' }` を足し、`src/lib/test/app-paths.ts` に `export const base = '';` を置く。

- [ ] **Step 4: `pnpm test` → PASS**

- [ ] **Step 5: 乗り物イラスト 8 枚**

各 `static/img/<id>.svg` は `viewBox="0 0 200 140"`、フラットデザイン、背景透明、線なし（塗りのみ）、横向きに走る向き（左が前）。共通パーツ: 車体 `rx=12` の角丸長方形、窓は薄い水色 `#cfe8f7`、タイヤは `#333` の円に `#999` のホイール。パトカー例（他 7 枚も同じ密度で描く）:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140">
  <rect x="20" y="60" width="160" height="50" rx="12" fill="#fff"/>
  <rect x="20" y="85" width="160" height="25" rx="10" fill="#222"/>
  <path d="M55 60 L75 35 H140 L160 60 Z" fill="#fff"/>
  <path d="M80 40 H135 L150 60 H62 Z" fill="#cfe8f7"/>
  <rect x="90" y="24" width="30" height="12" rx="4" fill="#e53935"/>
  <rect x="97" y="18" width="16" height="8" rx="3" fill="#ff8a80"/>
  <circle cx="55" cy="110" r="16" fill="#333"/><circle cx="55" cy="110" r="7" fill="#999"/>
  <circle cx="145" cy="110" r="16" fill="#333"/><circle cx="145" cy="110" r="7" fill="#999"/>
  <rect x="20" y="72" width="14" height="8" rx="3" fill="#ffd54f"/>
  <text x="100" y="80" font-size="10" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="bold">POLICE</text>
</svg>
```

- 消防車: 赤 `#e53935` 車体、上に銀のはしご（灰の細長長方形 2 本と横棒）、黄色の窓枠。
- 救急車: 白車体、側面に赤い十字、屋根に赤いランプ、後部が箱型。
- ゴミ収集車: 緑 `#43a047` のキャブ + 濃緑の大きな箱型荷台、荷台後部に丸い開口。
- バス: 黄 `#fdd835` の長い車体、窓 4 枚並び、前面に大きな窓、扉。
- 電車: 緑帯の入った銀 `#cfd8dc` の車両、窓 3 枚、屋根にパンタグラフ、車体下に線路。
- 新幹線: 白い流線型（左端をなだらかな曲線 `path` で）、青帯、細長い窓。
- 飛行機: 白の胴体（左端を尖らせる）、主翼と尾翼を水色、窓の小円を並べ、下に雲。

- [ ] **Step 6: ブラウザで `pnpm dev` を開き 8 枚を `/img/<id>.svg` で目視確認。コミット**

```bash
git add -A && git commit -m "feat: 単語データと乗り物イラスト"
```

---

### Task 8: 進捗・音・パーティクル

**Files:**
- Create: `src/lib/progress.svelte.ts`, `src/lib/audio.ts`, `src/lib/fx.ts`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Produces:
  - progress: `type Mode = 'trace' | 'free' | 'test'`、`get(c): CharProgress`、`record(c, mode)`、`charCleared(c)`、`charGold(c)`、`wordStar(name)`、`wordCrown(name)`、`reset()`。
  - audio: `unlock()`、`sfx.pon() / kira() / fanfare() / buu()`、`say(text)`、`readingOf(c)`。
  - fx: `fx.burst(x, y, n?, colors?)`、`fx.confetti(n)`（座標はウィンドウ px）、`fx.mount(canvas)`。

- [ ] **Step 1: テスト `src/lib/progress.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get, record, charCleared, charGold, wordStar, wordCrown, reset } from './progress.svelte';

describe('progress', () => {
	beforeEach(() => reset());
	it('なぞる 2 + じぶんでかく 1 でクリア', () => {
		record('あ', 'trace'); record('あ', 'trace'); record('あ', 'trace');
		expect(get('あ').trace).toBe(2);
		expect(charCleared('あ')).toBe(false);
		record('あ', 'free');
		expect(charCleared('あ')).toBe(true);
		expect(charGold('あ')).toBe(false);
	});
	it('単語の星と王冠', () => {
		for (const c of 'ばす') { record(c, 'trace'); record(c, 'trace'); record(c, 'free'); }
		expect(wordStar('ばす')).toBe(true);
		expect(wordCrown('ばす')).toBe(false);
		for (const c of 'ばす') record(c, 'test');
		expect(wordCrown('ばす')).toBe(true);
	});
});
```

`vite.config.ts` の test に `environment: 'jsdom'` は不要。`localStorage` が無い環境では保存をスキップする実装にする。

- [ ] **Step 2: `pnpm test` → FAIL**

- [ ] **Step 3: `src/lib/progress.svelte.ts`**

```ts
export type Mode = 'trace' | 'free' | 'test';
export type CharProgress = { trace: number; free: number; test: number };

const KEY = 'kk:progress';
const CAP: Record<Mode, number> = { trace: 2, free: 1, test: 1 };
const store = () => (typeof localStorage === 'undefined' ? null : localStorage);

function load(): Record<string, CharProgress> {
	try { return JSON.parse(store()?.getItem(KEY) ?? '{}'); } catch { return {}; }
}

export const progress = $state<Record<string, CharProgress>>(load());

export const get = (c: string): CharProgress => progress[c] ?? { trace: 0, free: 0, test: 0 };

export function record(c: string, mode: Mode) {
	const p = { ...get(c) };
	p[mode] = Math.min(CAP[mode], p[mode] + 1);
	progress[c] = p;
	store()?.setItem(KEY, JSON.stringify(progress));
}

export const charCleared = (c: string) => get(c).trace >= 2 && get(c).free >= 1;
export const charGold = (c: string) => get(c).test >= 1;
export const wordStar = (name: string) => [...name].every(charCleared);
export const wordCrown = (name: string) => [...name].every(charGold);

export function reset() {
	for (const k of Object.keys(progress)) delete progress[k];
	store()?.removeItem(KEY);
}
```

- [ ] **Step 4: `pnpm test` → PASS**（`.svelte.ts` を vitest で動かすには scaffold の vitest 設定が Svelte プラグイン経由になっていることを確認）

- [ ] **Step 5: `src/lib/audio.ts`**

```ts
let ctx: AudioContext | null = null;

// iOS は最初のタップ内で AudioContext を作る必要がある
export function unlock() {
	ctx ??= new AudioContext();
	if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'triangle', gain = 0.15) {
	if (!ctx) return;
	const t = ctx.currentTime + at;
	const o = ctx.createOscillator(), g = ctx.createGain();
	o.type = type; o.frequency.value = freq;
	g.gain.setValueAtTime(gain, t);
	g.gain.exponentialRampToValueAtTime(0.001, t + dur);
	o.connect(g).connect(ctx.destination);
	o.start(t); o.stop(t + dur);
}

export const sfx = {
	pon: () => tone(660, 0, 0.12, 'square', 0.06),
	kira: () => [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.2)),
	fanfare: () => [523, 659, 784, 1047, 1047].forEach((f, i) => tone(f, i * 0.15, 0.4)),
	buu: () => tone(160, 0, 0.35, 'sawtooth', 0.08)
};

const SPECIAL: Record<string, string> = {
	'ー': 'のばす おと', 'ぁ': 'ちいさい あ', 'ぃ': 'ちいさい い', 'ぅ': 'ちいさい う', 'ぇ': 'ちいさい え',
	'ぉ': 'ちいさい お', 'ゃ': 'ちいさい や', 'ゅ': 'ちいさい ゆ', 'ょ': 'ちいさい よ', 'っ': 'ちいさい つ', 'を': 'を'
};
export const readingOf = (c: string) => SPECIAL[c] ?? c;

export function say(text: string) {
	if (!('speechSynthesis' in window)) return;
	speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(text);
	u.lang = 'ja-JP'; u.rate = 0.9;
	const v = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ja'));
	if (v) u.voice = v;
	speechSynthesis.speak(u);
}
```

- [ ] **Step 6: `src/lib/fx.ts`**

```ts
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; g: number; spin: number };

const STAR = ['#f5b400', '#ffd766', '#7fd8ff', '#fff'];
const CONFETTI = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#ff8fd8'];

class Fx {
	private canvas: HTMLCanvasElement | null = null;
	private ps: P[] = [];
	private raf = 0;

	mount(c: HTMLCanvasElement) {
		this.canvas = c;
		const fit = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; };
		fit(); addEventListener('resize', fit);
	}

	burst(x: number, y: number, n = 14, colors = STAR) {
		for (let i = 0; i < n; i++) {
			const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 140;
			this.ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0, max: 0.6, color: colors[i % colors.length], size: 3 + Math.random() * 4, g: 200, spin: 0 });
		}
		this.run();
	}

	confetti(n = 120) {
		for (let i = 0; i < n; i++) {
			this.ps.push({ x: Math.random() * innerWidth, y: -10, vx: (Math.random() - 0.5) * 120, vy: 100 + Math.random() * 200, life: 0, max: 1.6 + Math.random(), color: CONFETTI[i % CONFETTI.length], size: 6 + Math.random() * 6, g: 60, spin: (Math.random() - 0.5) * 10 });
		}
		this.run();
	}

	private run() {
		if (this.raf) return;
		let prev = performance.now();
		const step = (now: number) => {
			const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
			const c = this.canvas!, ctx = c.getContext('2d')!;
			ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
			ctx.clearRect(0, 0, innerWidth, innerHeight);
			this.ps = this.ps.filter((p) => (p.life += dt) < p.max);
			for (const p of this.ps) {
				p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
				ctx.globalAlpha = 1 - p.life / p.max;
				ctx.fillStyle = p.color;
				ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin * p.life);
				ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.spin ? 0.6 : 1));
				ctx.restore();
			}
			ctx.globalAlpha = 1;
			this.raf = this.ps.length ? requestAnimationFrame(step) : 0;
			if (!this.raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
		};
		this.raf = requestAnimationFrame(step);
	}
}

export const fx = new Fx();
```

- [ ] **Step 7: `pnpm check && pnpm test` → PASS。コミット**

```bash
git add -A && git commit -m "feat: 進捗保存・効果音と読み上げ・パーティクル"
```

---

### Task 9: 書き取り面 `Canvas.svelte`

**Files:**
- Create: `src/lib/components/Canvas.svelte`
- Test: ブラウザで手動（`src/routes/practice/+page.svelte` は Task 10。ここでは一時的に `src/routes/+page.svelte` に置いて動かしてよい）

**Interfaces:**
- Consumes: STROKES、geometry、judge、score、recognize、audio、fx、`Mode`。
- Produces: props `{ char: string; mode: Mode; onDone: (r: Result) => void; onStroke?: (i: number) => void }`、`type Result = { mode: Mode; score: number; ok: boolean; top: string }`、export 関数 `reset()`、`playDemo()`、`judge()`（おてほんなしの「できた」）、export 状態 `current`（今の画番号、0 始まり）。

- [ ] **Step 1: コンポーネント**

```svelte
<script module lang="ts">
	import type { Mode } from '$lib/progress.svelte';
	export type Result = { mode: Mode; score: number; ok: boolean; top: string };
</script>

<script lang="ts">
	import { STROKES } from '$lib/strokes';
	import { pathToPoints, type Pt } from '$lib/geometry';
	import { canStart, advance, traceDone, coverage, JUDGE } from '$lib/judge';
	import { strokeScore } from '$lib/score';
	import { recognize, passes, testScore } from '$lib/recognize';
	import { sfx, unlock } from '$lib/audio';
	import { fx } from '$lib/fx';

	let {
		char,
		mode,
		onDone,
		onStroke
	}: { char: string; mode: Mode; onDone: (r: Result) => void; onStroke?: (i: number) => void } = $props();

	const ds = $derived(STROKES[char]);
	const samples = $derived(ds.map((d) => pathToPoints(d)));

	let si = $state(0);
	let cursor = $state(0);
	let trail = $state<Pt[]>([]);
	let trails = $state<Pt[][]>([]);
	let scores: number[] = [];
	let tracing = $state(false);
	let shake = $state(false);
	let bounce = $state(-1);
	let demo = $state(false);
	let svg: SVGSVGElement;
	let idle: ReturnType<typeof setTimeout> | undefined;

	export const current = () => si;

	export function reset() {
		si = 0; cursor = 0; trail = []; trails = []; scores = []; tracing = false; demo = false;
		armIdle();
	}
	export function playDemo() {
		demo = false;
		requestAnimationFrame(() => (demo = true));
	}
	export function judge() {
		clearTimeout(idle);
		if (trails.length === 0) return;
		const r = recognize(trails);
		const mine = r.find((x) => x.char === char)!;
		onDone({ mode: 'test', score: testScore(mine.dist), ok: passes(char, r), top: r[0].char });
	}

	$effect(() => {
		char; mode;
		reset();
		return () => clearTimeout(idle);
	});

	function armIdle() {
		clearTimeout(idle);
		if (mode !== 'test') idle = setTimeout(playDemo, 6000);
	}
	function toView(e: PointerEvent): Pt {
		const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
		return { x: p.x, y: p.y };
	}
	function toScreen(p: Pt) {
		return new DOMPoint(p.x, p.y).matrixTransform(svg.getScreenCTM()!);
	}

	function down(e: PointerEvent) {
		if (si >= ds.length) return;
		unlock();
		demo = false;
		clearTimeout(idle);
		const p = toView(e);
		if (mode === 'trace') {
			if (!canStart(samples[si], p)) return;
			cursor = 0;
		}
		tracing = true;
		trail = [p];
		svg.setPointerCapture(e.pointerId);
	}
	function move(e: PointerEvent) {
		if (!tracing) return;
		const p = toView(e);
		trail.push(p);
		if (mode === 'trace') {
			const c = advance(samples[si], cursor, p);
			if (c === -1) fail();
			else cursor = c;
		}
	}
	function up() {
		if (!tracing) return;
		tracing = false;
		if (mode === 'trace') {
			if (traceDone(samples[si], cursor)) complete(1);
			else fail();
		} else if (mode === 'free') {
			trails.push(trail);
			trail = [];
			const all = trails.flat();
			if (coverage(samples[si], all) >= JUDGE.FREE_DONE) complete(strokeScore(all, samples[si]));
		} else {
			trails.push(trail);
			trail = [];
			clearTimeout(idle);
			idle = setTimeout(judge, 1500);
		}
	}
	function fail() {
		tracing = false; cursor = 0; trail = [];
		shake = true;
		setTimeout(() => (shake = false), 300);
		sfx.buu();
		armIdle();
	}
	function complete(score: number) {
		scores.push(score);
		bounce = si;
		setTimeout(() => (bounce = -1), 400);
		sfx.pon();
		for (const p of samples[si].filter((_, k) => k % 5 === 0)) {
			const q = toScreen(p);
			fx.burst(q.x, q.y, 3);
		}
		onStroke?.(si);
		trail = []; trails = []; cursor = 0;
		si += 1;
		if (si >= ds.length) {
			const s = scores.reduce((a, b) => a + b, 0) / scores.length;
			setTimeout(() => onDone({ mode, score: s, ok: true, top: char }), 400);
		} else armIdle();
	}
	const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
</script>

<div class="wrap" class:shake>
	<svg bind:this={svg} viewBox="0 0 109 109" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
		<line x1="54.5" y1="2" x2="54.5" y2="107" class="grid" />
		<line x1="2" y1="54.5" x2="107" y2="54.5" class="grid" />
		{#if mode !== 'test'}
			{#each ds as d, i (i)}
				<path {d} class="guide" />
				{#if i > si}<path {d} class="dash" />{/if}
			{/each}
		{/if}
		{#each ds as d, i (i)}
			{#if i < si}<path {d} class="ink" class:bounce={bounce === i} />{/if}
		{/each}
		{#if mode === 'trace' && si < ds.length}
			<path d={ds[si]} class="ink" pathLength={samples[si].length - 1} stroke-dasharray={samples[si].length - 1} stroke-dashoffset={samples[si].length - 1 - cursor} />
		{/if}
		{#if mode !== 'trace'}
			{#each trails as t, i (i)}<polyline points={poly(t)} class="ink" />{/each}
			{#if tracing}<polyline points={poly(trail)} class="ink" />{/if}
		{/if}
		{#if demo && si < ds.length}
			<path d={ds[si]} class="demo" pathLength="1" onanimationend={() => (demo = false)} />
		{/if}
		{#if mode !== 'test' && si < ds.length && !tracing}
			<circle cx={samples[si][0].x} cy={samples[si][0].y} r="6.5" class="start" />
			<text x={samples[si][0].x} y={samples[si][0].y} class="num">{si + 1}</text>
		{/if}
	</svg>
</div>

<style>
	.wrap { height: 100%; aspect-ratio: 1; margin: 0 auto; }
	.shake { animation: shake 0.3s; }
	svg { display: block; width: 100%; height: 100%; touch-action: none; }
	.grid { stroke: #e1e5ea; stroke-width: 0.6; stroke-dasharray: 2 2; }
	.guide, .ink, .dash, .demo { fill: none; stroke-linecap: round; stroke-linejoin: round; }
	.guide { stroke: var(--guide); stroke-width: 14; }
	.dash { stroke: #b9c3cc; stroke-width: 1.2; stroke-dasharray: 3 2.5; }
	.ink { stroke: var(--blue); stroke-width: 14; transform-box: fill-box; transform-origin: center; }
	.bounce { animation: bounce 0.4s ease-out; }
	.demo { stroke: var(--star); stroke-width: 5; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.2s ease-in-out forwards; }
	.start { fill: var(--blue); transform-box: fill-box; transform-origin: center; animation: pulse 1s ease-in-out infinite; }
	.num { fill: #fff; font-size: 7px; font-weight: bold; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
	@keyframes bounce { 40% { transform: scale(1.07); } }
	@keyframes draw { to { stroke-dashoffset: 0; } }
	@keyframes pulse { 50% { transform: scale(1.4); opacity: 0.6; } }
	@keyframes shake { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
</style>
```

- [ ] **Step 2: svelte-autofixer で検証し、指摘を直す**

- [ ] **Step 3: 動作確認**。`pnpm dev` を開き、Browser ツールでマウスドラッグ（Pointer Events）して、なぞる→画が青くなる、離すと次の番号へ、逸脱で揺れる、じぶんでかくで塗れる、を確認。

- [ ] **Step 4: コミット** `git add -A && git commit -m "feat: 書き取り面コンポーネント"`

---

### Task 10: 画面（レイアウト・ホーム・練習・文字一覧・アプリについて）

**Files:**
- Create: `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/practice/+page.svelte`, `src/routes/chars/+page.svelte`, `src/routes/about/+page.svelte`, `src/lib/components/WordCard.svelte`, `src/lib/components/Stars.svelte`
- Test: ブラウザで手動（横 1180×820 と縦で確認）

**Interfaces:**
- Consumes: Task 7〜9 すべて。
- Produces: `/`, `/practice?w=<id>&i=<n>`, `/chars`, `/about`。

- [ ] **Step 1: `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { fx } from '$lib/fx';
	let { children } = $props();
	let canvas: HTMLCanvasElement;
	onMount(() => fx.mount(canvas));
</script>

<canvas bind:this={canvas} class="fx"></canvas>
{@render children()}
<div class="portrait card">
	<div class="icon">🔄</div>
	<p>iPad を よこに してね</p>
</div>

<style>
	.fx { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 50; }
	.portrait { display: none; position: fixed; inset: 0; z-index: 100; place-content: center; text-align: center; font-size: 28px; font-weight: bold; background: var(--bg); }
	.icon { font-size: 80px; }
	@media (orientation: portrait) { .portrait { display: grid; } }
</style>
```

- [ ] **Step 2: `src/lib/components/Stars.svelte`**（n 個中 k 個を塗る。`gold` で金色）

```svelte
<script lang="ts">
	let { n = 3, k = 0, size = 22 }: { n?: number; k?: number; size?: number } = $props();
</script>

<span class="stars" style:font-size="{size}px">
	{#each Array(n) as _, i (i)}<span class:on={i < k}>★</span>{/each}
</span>

<style>
	.stars span { color: #d8dde2; transition: transform 0.3s; display: inline-block; }
	.stars .on { color: var(--star); animation: pop 0.4s; }
	@keyframes pop { 50% { transform: scale(1.5); } }
</style>
```

- [ ] **Step 3: `src/lib/components/WordCard.svelte`**（画像が無ければ頭文字カード）

```svelte
<script lang="ts">
	import { imageUrl, type Word } from '$lib/words';
	import { wordStar, wordCrown } from '$lib/progress.svelte';
	let { word, onclick, size = 180 }: { word: Word; onclick?: () => void; size?: number } = $props();
	let missing = $state(false);
</script>

<button class="card" style:width="{size}px" {onclick}>
	{#if wordCrown(word.name)}<span class="badge">👑</span>{:else if wordStar(word.name)}<span class="badge">⭐</span>{/if}
	{#if missing}
		<div class="initial" style:height="{size * 0.6}px">{word.name[0]}</div>
	{:else}
		<img src={imageUrl(word)} alt="" style:height="{size * 0.6}px" onerror={() => (missing = true)} />
	{/if}
	<div class="name">{word.name}</div>
	{#if word.desc}<div class="desc">{word.desc}</div>{/if}
</button>

<style>
	.card { position: relative; padding: 14px 10px 12px; text-align: center; display: grid; gap: 4px; transition: transform 0.15s; }
	.card:active { transform: scale(0.96); }
	img { width: 100%; object-fit: contain; }
	.initial { display: grid; place-content: center; font-size: 64px; font-weight: bold; color: var(--blue); background: #eef3f8; border-radius: 14px; }
	.name { font-size: 20px; font-weight: bold; }
	.desc { font-size: 12px; color: var(--sub); }
	.badge { position: absolute; top: 6px; right: 8px; font-size: 26px; animation: pop 0.5s; }
	@keyframes pop { 50% { transform: scale(1.4); } }
</style>
```

- [ ] **Step 4: `src/routes/+page.svelte`（ホーム）**

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import WordCard from '$lib/components/WordCard.svelte';
	import { WORDS, CATEGORIES } from '$lib/words';
	import { unlock } from '$lib/audio';
</script>

<main in:fly={{ x: -40, duration: 250 }}>
	<header>
		<h1>かきかき ひらがな</h1>
		<nav>
			<a class="card btn" href="{base}/chars">もじから えらぶ</a>
			<a class="card btn" href="{base}/about">？</a>
		</nav>
	</header>
	{#each CATEGORIES as cat (cat)}
		<h2>{cat}</h2>
		<div class="row">
			{#each WORDS.filter((w) => w.category === cat) as w (w.id)}
				<WordCard word={w} onclick={() => { unlock(); goto(`${base}/practice?w=${w.id}`); }} />
			{/each}
		</div>
	{/each}
</main>

<style>
	main { padding: 20px 28px 40px; min-height: 100vh; }
	header { display: flex; justify-content: space-between; align-items: center; }
	h1 { font-size: 30px; margin: 0; }
	h2 { font-size: 18px; color: var(--sub); margin: 22px 0 8px; }
	nav { display: flex; gap: 10px; }
	.btn { padding: 12px 18px; font-weight: bold; text-decoration: none; color: var(--teal); }
	.row { display: flex; gap: 14px; overflow-x: auto; padding: 6px 2px 10px; }
</style>
```

- [ ] **Step 5: `src/routes/practice/+page.svelte`**

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import Canvas, { type Result } from '$lib/components/Canvas.svelte';
	import WordCard from '$lib/components/WordCard.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import { imageUrl, wordById } from '$lib/words';
	import { STROKES } from '$lib/strokes';
	import { get, record, charCleared, wordStar, type Mode } from '$lib/progress.svelte';
	import { say, sfx, readingOf } from '$lib/audio';
	import { fx } from '$lib/fx';
	import { stars, praise } from '$lib/score';

	const word = $derived(wordById(page.url.searchParams.get('w') ?? '') ?? wordById('patocar')!);
	const chars = $derived([...word.name]);
	let i = $state(Number(page.url.searchParams.get('i') ?? 0));
	let mode = $state<Mode>('trace');
	const c = $derived(chars[i]);
	let canvas: Canvas;
	let stroke = $state(0);
	let msg = $state('');
	let flyStar = $state(false);
	let drive = $state(false);
	let busy = $state(false);

	const MODES: { id: Mode; label: string; hint: string; title: string }[] = [
		{ id: 'trace', label: '👆 なぞる', hint: 'まるから、みちに そって ゆっくり', title: 'なぞって みよう！' },
		{ id: 'free', label: '✏️ じぶんで かく', hint: 'いろの みちを ぬろう。なんかいに わけても いいよ', title: 'じぶんで かいてみよう！' },
		{ id: 'test', label: '🌟 おてほんなし', hint: 'おてほんを みないで かいてみよう。かけたら「できた」', title: 'おてほんなしで かいてみよう！' }
	];
	const cur = $derived(MODES.find((m) => m.id === mode)!);

	function select(n: number) { i = n; stroke = 0; msg = ''; }

	function done(r: Result) {
		if (busy) return;
		if (r.mode === 'test' && !r.ok) {
			msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
			sfx.buu();
			return;
		}
		busy = true;
		const wasC = charCleared(c), wasW = wordStar(word.name);
		record(c, r.mode);
		const st = r.mode === 'trace' ? 3 : stars(r.score);
		msg = r.mode === 'trace' ? 'できた！' : `${'★'.repeat(st)} ${praise(st)}`;
		sfx.kira();
		say(readingOf(c));
		if (!wasC && charCleared(c)) { fx.confetti(120); flyStar = true; setTimeout(() => (flyStar = false), 900); }
		let wait = 1200;
		if (!wasW && wordStar(word.name)) {
			wait = 2600;
			setTimeout(() => { drive = true; fx.confetti(300); sfx.fanfare(); say('やったー！'); }, 600);
			setTimeout(() => (drive = false), 2600);
		}
		setTimeout(() => {
			busy = false;
			if (i < chars.length - 1) select(i + 1);
			else { stroke = 0; msg = ''; canvas.reset(); }
		}, wait);
	}
</script>

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<a class="card home" href="{base}/" aria-label="ホーム">🏠</a>
		<div>
			<div class="with">{word.name}と いっしょに</div>
			<h1>{cur.title}</h1>
		</div>
	</header>

	<aside class="left">
		<WordCard {word} size={190} onclick={() => say(word.name)} />
		<div class="tabs">
			{#each chars as ch, n (n)}
				<button class="tab card" class:on={n === i} onclick={() => select(n)}>
					<span class="ch">{ch}</span>
					<span class="s" class:gold={get(ch).test > 0}>{charCleared(ch) ? '★' : '☆'}</span>
				</button>
			{/each}
		</div>
		<div class="charstars card">
			<div class="lbl">「{c}」の ほし</div>
			<div class="cols">
				<div><small>なぞる</small><Stars n={2} k={get(c).trace} /></div>
				<div><small>じぶんで</small><Stars n={1} k={get(c).free} /></div>
				<div class="gold"><small>おてほんなし</small><Stars n={1} k={get(c).test} /></div>
			</div>
		</div>
	</aside>

	<section class="center">
		<div class="modes card">
			{#each MODES as m (m.id)}
				<button class:on={mode === m.id} onclick={() => { mode = m.id; msg = ''; stroke = 0; }}>{m.label}</button>
			{/each}
		</div>
		<div class="board card">
			<span class="count">{Math.min(stroke + 1, STROKES[c].length)} / {STROKES[c].length}</span>
			<Canvas bind:this={canvas} char={c} {mode} onDone={done} onStroke={(k) => (stroke = k + 1)} />
			{#if flyStar}<div class="flystar">⭐</div>{/if}
		</div>
		<p class="hint">{msg || cur.hint}</p>
	</section>

	<aside class="right">
		<button class="rb" onclick={() => say(readingOf(c))}><span class="card ic">🔊</span>きく</button>
		<button class="rb" onclick={() => canvas.playDemo()}><span class="card ic">👀</span>みる</button>
		<button class="rb" onclick={() => { canvas.reset(); stroke = 0; msg = ''; }}><span class="card ic">↺</span>やりなおす</button>
		{#if mode === 'test'}
			<button class="rb done" onclick={() => canvas.judge()}><span class="card ic">✅</span>できた</button>
		{/if}
	</aside>

	{#if drive}
		<img class="drive" src={imageUrl(word)} alt="" />
	{/if}
</main>

<style>
	main { display: grid; grid-template-columns: 220px 1fr 110px; grid-template-rows: auto 1fr; gap: 12px 18px; height: 100vh; padding: 16px 22px; }
	header { grid-column: 1 / -1; display: flex; gap: 14px; align-items: center; }
	.home { width: 44px; height: 44px; display: grid; place-content: center; text-decoration: none; font-size: 22px; }
	.with { color: var(--teal); font-size: 13px; font-weight: bold; }
	h1 { margin: 0; font-size: 22px; }
	.left { display: grid; gap: 10px; align-content: start; }
	.tabs { display: flex; gap: 6px; flex-wrap: wrap; }
	.tab { width: 46px; padding: 6px 0; display: grid; justify-items: center; font-size: 20px; font-weight: bold; }
	.tab.on { background: var(--blue); color: #fff; }
	.tab .s { font-size: 12px; }
	.tab .s.gold { color: var(--star); }
	.charstars { padding: 10px; text-align: center; }
	.lbl { font-size: 13px; font-weight: bold; }
	.cols { display: flex; justify-content: space-around; margin-top: 4px; }
	.cols small { display: block; font-size: 10px; color: var(--sub); }
	.center { display: grid; grid-template-rows: auto 1fr auto; gap: 10px; min-height: 0; }
	.modes { display: flex; padding: 4px; }
	.modes button { flex: 1; padding: 10px; border-radius: 16px; font-weight: bold; color: var(--sub); }
	.modes .on { background: var(--teal); color: #fff; }
	.board { position: relative; min-height: 0; padding: 12px; }
	.count { position: absolute; top: 10px; left: 14px; font-size: 13px; color: var(--sub); background: #eef1f4; padding: 4px 10px; border-radius: 12px; }
	.hint { margin: 0; text-align: center; color: var(--sub); font-size: 15px; min-height: 22px; font-weight: bold; }
	.right { display: grid; gap: 14px; align-content: center; justify-items: center; }
	.rb { display: grid; justify-items: center; gap: 4px; font-size: 11px; color: var(--sub); }
	.ic { width: 48px; height: 48px; display: grid; place-content: center; font-size: 22px; }
	.done .ic { background: var(--teal); }
	.flystar { position: absolute; left: 50%; top: 50%; font-size: 90px; animation: fly 0.9s ease-in forwards; pointer-events: none; }
	@keyframes fly { 0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; } 30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(calc(-50% - 60vw), calc(-50% + 10vh)) scale(0.2); opacity: 0; } }
	.drive { position: fixed; bottom: 20px; left: -300px; height: 200px; z-index: 60; animation: drive 2s ease-in-out forwards; pointer-events: none; }
	@keyframes drive { to { left: 110vw; } }
</style>
```

- [ ] **Step 6: `src/routes/chars/+page.svelte`**

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import { GOJUON } from '$lib/chars';
	import { charCleared, charGold } from '$lib/progress.svelte';
</script>

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<a class="card home" href="{base}/" aria-label="ホーム">🏠</a>
		<h1>もじから えらぶ</h1>
	</header>
	<div class="grid">
		{#each GOJUON as row, r (r)}
			{#each row as c, k (k)}
				{#if c}
					<a class="card cell" class:done={charCleared(c)} class:gold={charGold(c)} href="{base}/practice?w=char-{c}">
						{c}<span class="s">{charGold(c) ? '👑' : charCleared(c) ? '★' : ''}</span>
					</a>
				{:else}<span></span>{/if}
			{/each}
		{/each}
	</div>
</main>

<style>
	main { padding: 16px 22px 40px; }
	header { display: flex; gap: 14px; align-items: center; margin-bottom: 12px; }
	.home { width: 44px; height: 44px; display: grid; place-content: center; text-decoration: none; font-size: 22px; }
	h1 { margin: 0; font-size: 22px; }
	.grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; grid-auto-flow: column; grid-template-rows: repeat(9, 1fr); }
	.cell { position: relative; aspect-ratio: 1; display: grid; place-content: center; font-size: 30px; font-weight: bold; text-decoration: none; color: var(--ink); }
	.done { background: #fff8dc; }
	.s { position: absolute; right: 6px; bottom: 2px; font-size: 14px; color: var(--star); }
</style>
```

（18 行 × 5 列を、10 列 × 9 行の縦流しに並べ替える。列数は画面幅を見て調整。）

- [ ] **Step 7: `src/routes/about/+page.svelte`**

```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { reset } from '$lib/progress.svelte';
	const a = Math.floor(Math.random() * 8) + 2, b = Math.floor(Math.random() * 8) + 1;
	let ans = $state('');
	const ok = $derived(Number(ans) === a + b);
	function doReset() {
		if (confirm('練習記録と星をすべてリセットします。取り消せません。よろしいですか？')) { reset(); alert('リセットしました'); }
	}
</script>

<main>
	<header>
		<a class="card home" href="{base}/" aria-label="ホーム">🏠</a>
		<h1>アプリについて</h1>
	</header>
	<section class="card">
		<h2>つかいかた</h2>
		<ul>
			<li>ホームで のりものを えらぶか、「もじから えらぶ」で もじを えらびます。</li>
			<li>「なぞる」は いろの まるから みちに そって ゆびを うごかします。</li>
			<li>「じぶんで かく」は おてほんの うえを じゆうに ぬります。</li>
			<li>「おてほんなし」は おてほんを みないで かき、「できた」で こたえあわせ。</li>
		</ul>
	</section>
	<section class="card parent">
		<h2>保護者の方へ</h2>
		<p>書き順データは <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a>（CC BY-SA 3.0）を使用しています。練習記録はこの iPad の中にだけ保存されます。</p>
		<p>{a} + {b} = <input type="number" inputmode="numeric" bind:value={ans} /></p>
		{#if ok}<button class="danger" onclick={doReset}>練習記録をリセット</button>{/if}
	</section>
</main>

<style>
	main { padding: 16px 22px 40px; max-width: 760px; }
	header { display: flex; gap: 14px; align-items: center; margin-bottom: 12px; }
	.home { width: 44px; height: 44px; display: grid; place-content: center; text-decoration: none; font-size: 22px; }
	h1 { margin: 0; font-size: 22px; }
	section { padding: 16px 20px; margin-bottom: 14px; }
	h2 { font-size: 17px; margin: 0 0 8px; }
	.parent { -webkit-user-select: text; user-select: text; }
	input { width: 80px; font-size: 18px; padding: 4px 8px; }
	.danger { background: #e53935; color: #fff; padding: 10px 16px; border-radius: 12px; font-weight: bold; }
</style>
```

- [ ] **Step 8: svelte-autofixer で全 .svelte を検証 → `pnpm check` → ブラウザで全画面を横 1180×820 で確認（ホーム → 練習 → 3 モードで 1 文字クリア → 星が付く → 文字一覧 → about でゲート → リセット）。縦向きでオーバーレイが出ることも確認。**

- [ ] **Step 9: コミット** `git add -A && git commit -m "feat: ホーム・練習・文字一覧・アプリについて画面"`

---

### Task 11: PWA 化・アイコン・デプロイ

**Files:**
- Create: `static/manifest.webmanifest`, `static/icon.svg`, `static/icon-180.png`, `static/icon-512.png`, `src/service-worker.ts`, `.github/workflows/deploy.yml`, `README.md`
- Test: `pnpm build && pnpm preview` で Service Worker 登録、`build/` に全ファイル。

- [ ] **Step 1: `static/manifest.webmanifest`**

```json
{
	"name": "かきかき ひらがな",
	"short_name": "かきかき",
	"start_url": "/kakikaki/",
	"scope": "/kakikaki/",
	"display": "standalone",
	"orientation": "landscape",
	"background_color": "#f4f5f0",
	"theme_color": "#f4f5f0",
	"lang": "ja",
	"icons": [{ "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }]
}
```

- [ ] **Step 2: アイコン**。`static/icon.svg` は角丸の青地 `#4f7cae` に白い「あ」（`font-size 300`, `font-weight bold`, 中央）。PNG 化は `qlmanage -t -s 512 -o static static/icon.svg` → `mv static/icon.svg.png static/icon-512.png`、`sips -z 180 180 static/icon-512.png --out static/icon-180.png`。

- [ ] **Step 3: `src/service-worker.ts`**

```ts
/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `kk-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (e: ExtendableEvent) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting()));
});
self.addEventListener('activate', (e: ExtendableEvent) => {
	e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});
self.addEventListener('fetch', (e: FetchEvent) => {
	if (e.request.method !== 'GET') return;
	e.respondWith(
		caches.match(e.request).then((hit) => hit ?? fetch(e.request).then((res) => {
			if (res.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
			return res;
		}).catch(() => caches.match(`${new URL(e.request.url).pathname.replace(/[^/]*$/, '')}`) as Promise<Response>))
	);
});
```

`tsconfig.json` の `compilerOptions.lib` に `"WebWorker"` を足す。`.svelte-kit/tsconfig.json` を extends している場合は `"lib": ["esnext", "DOM", "DOM.Iterable", "WebWorker"]` を上書き。

- [ ] **Step 4: `.github/workflows/deploy.yml`**

```yaml
name: deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: build }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: `README.md`**（最新仕様のスナップショットのみ）

```markdown
# かきかき ひらがな（個人用）

iPad 横画面で使うひらがな書き練習 PWA。

## 使い方（iPad）
1. Safari で公開 URL を開く
2. 共有 → 「ホーム画面に追加」
3. ホーム画面のアイコンから起動（横向きで使う）

## 開発
- `pnpm dev` / `pnpm test` / `pnpm build`
- 書き順データの再生成: `node scripts/fetch-strokes.ts`
- 単語の追加: `src/lib/words.ts` に追記し、画像を `static/img/<id>.svg|png` に置く（無ければ頭文字カード）
- 公開先を変える: `BASE_PATH=/ pnpm build` と `static/manifest.webmanifest` の `start_url` / `scope`

## クレジット
書き順データ: [KanjiVG](https://kanjivg.tagaini.net)（CC BY-SA 3.0）
```

- [ ] **Step 6: `pnpm build && pnpm preview` → Browser で `http://localhost:4173/kakikaki/` を開き、DevTools 相当（`navigator.serviceWorker.controller`）で SW が有効なことを確認。コミット**

```bash
git add -A && git commit -m "feat: PWA マニフェスト・Service Worker・GitHub Pages デプロイ"
```

- [ ] **Step 7: GitHub に公開**（ユーザー確認済みの手順）

```bash
gh repo create kakikaki --public --source . --push
gh api -X POST repos/{owner}/kakikaki/pages -f build_type=workflow
```

Actions 完了後 `https://<owner>.github.io/kakikaki/` を iPad で開く。
