<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import Canvas, { type Result } from '$lib/components/Canvas.svelte';
	import WordCard from '$lib/components/WordCard.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { wordById } from '$lib/words';
	import { imageUrl } from '$lib/image';
	import { STROKES } from '$lib/strokes';
	import { get, record, charCleared, wordStar, checkBadges, type Mode } from '$lib/progress.svelte';
	import type { Badge } from '$lib/badges';
	import { say, sfx, readingOf } from '$lib/audio';
	import { fx } from '$lib/fx';
	import { stars, praise } from '$lib/score';

	const word = $derived(wordById(page.url.searchParams.get('w') ?? '') ?? wordById('patocar')!);
	const chars = $derived([...word.name]);
	let i = $state(Number(page.url.searchParams.get('i') ?? 0));
	const c = $derived(chars[i]);

	// その文字で次にやるべきモード。全部終わっていれば null
	function nextMode(ch: string): Mode | null {
		const p = get(ch);
		return p.trace < 2 ? 'trace' : p.free < 1 ? 'free' : p.test < 1 ? 'test' : null;
	}
	let mode = $state<Mode>(untrack(() => nextMode(chars[i])) ?? 'trace');
	let gen = $state(0); // 同じ文字・モードで書き取り面を作り直すためのカウンタ
	let drawn = $state(false); // おてほんなしで 1 画以上書いた
	let canvas = $state<Canvas>();
	let stroke = $state(0);
	let msg = $state('');
	let flyStar = $state(false);
	let drive = $state(false);
	let busy = $state(false);
	let toast = $state<Badge | null>(null);

	function showBadges(list: Badge[], delay: number) {
		list.forEach((b, k) => {
			setTimeout(() => {
				toast = b;
				fx.confetti(150);
				sfx.fanfare();
				setTimeout(() => (toast = null), 2400);
			}, delay + k * 2600);
		});
	}

	const MODES: { id: Mode; icon: 'trace' | 'pencil' | 'star'; label: string; hint: string; title: string }[] = [
		{ id: 'trace', icon: 'trace', label: 'なぞる', hint: 'まるから、みちに そって ゆっくり', title: 'なぞって みよう！' },
		{ id: 'free', icon: 'pencil', label: 'じぶんで かく', hint: 'いろの みちを ぬろう。なんかいに わけても いいよ', title: 'じぶんで かいてみよう！' },
		{ id: 'test', icon: 'star', label: 'おてほんなし', hint: 'おてほんを みないで かいてみよう', title: 'おてほんなしで かいてみよう！' }
	];
	const cur = $derived(MODES.find((m) => m.id === mode)!);

	function select(n: number, m: Mode = nextMode(chars[n]) ?? 'trace') {
		i = n;
		mode = m;
		stroke = 0;
		msg = '';
		drawn = false;
		gen++;
	}

	function done(r: Result) {
		if (busy) return;
		if (r.mode === 'test' && !r.ok) {
			msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
			sfx.buu();
			return;
		}
		busy = true;
		const wasC = charCleared(c),
			wasW = wordStar(word.name);
		record(c, r.mode);
		const st = r.mode === 'trace' ? 3 : stars(r.score);
		msg = r.mode === 'trace' ? 'できた！' : `${'★'.repeat(st)} ${praise(st)}`;
		sfx.kira();
		if (!wasC && charCleared(c)) {
			fx.confetti(120);
			flyStar = true;
			setTimeout(() => (flyStar = false), 900);
		}
		let wait = 1200;
		if (!wasW && wordStar(word.name)) {
			wait = 2600;
			setTimeout(() => {
				drive = true;
				fx.confetti(300);
				sfx.fanfare();
			}, 600);
			setTimeout(() => (drive = false), 2600);
		}
		const fresh = checkBadges();
		if (fresh.length) {
			showBadges(fresh, wait);
			wait += fresh.length * 2600;
		}
		setTimeout(() => {
			busy = false;
			const next = nextMode(c);
			if (next) select(i, next);
			else if (i < chars.length - 1) select(i + 1);
			else {
				select(i, 'trace');
				msg = 'ぜんぶ できた！ すきな もじで もういちど あそべるよ';
			}
		}, wait);
	}
</script>

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<BackButton />
		<div>
			<div class="with">{word.name}と いっしょに</div>
			<h1>{cur.title}</h1>
		</div>
	</header>

	<aside class="left">
		<WordCard {word} size={190} />
		<div class="tabs">
			{#each chars as ch, n (n)}
				<button class={['tab', 'card', { on: n === i }]} onclick={() => select(n)}>
					<span class="ch">{ch}</span>
					<span class={['s', { gold: get(ch).test > 0 }]}>{charCleared(ch) ? '★' : '☆'}</span>
				</button>
			{/each}
		</div>
		<div class="charstars card">
			<div class="lbl">「{c}」の ほし</div>
			<div class="cols">
				<div><small>なぞる</small><Stars n={2} k={get(c).trace} /></div>
				<div><small>じぶんで</small><Stars n={1} k={get(c).free} /></div>
				<div><small>おてほんなし</small><Stars n={1} k={get(c).test} /></div>
			</div>
		</div>
	</aside>

	<section class="center">
		<div class="modes card">
			{#each MODES as m (m.id)}
				<button class={{ on: mode === m.id }} onclick={() => select(i, m.id)}><Icon name={m.icon} size={20} /> {m.label}</button>
			{/each}
		</div>
		<div class="board card">
			<span class="count">{Math.min(stroke + 1, STROKES[c].length)} / {STROKES[c].length}</span>
			{#key `${c}-${mode}-${gen}`}
				<Canvas bind:this={canvas} char={c} {mode} onDone={done} onStroke={(k) => (stroke = k + 1)} onDraw={() => (drawn = true)} />
			{/key}
			{#if flyStar}<div class="flystar">⭐</div>{/if}
		</div>
		<p class="hint">{msg || (mode === 'test' && drawn ? 'かけたら みぎの「できた」を おしてね' : cur.hint)}</p>
	</section>

	<aside class="right">
		<button class="rb" onclick={() => say(readingOf(c))}><span class="card ic"><Icon name="speaker" size={26} /></span>きく</button>
		<button class="rb" onclick={() => select(i, mode)}><span class="card ic"><Icon name="redo" size={26} /></span>やりなおす</button>
		{#if mode === 'test'}
			<button class={['rb', 'done', { ready: drawn }]} onclick={() => canvas?.judge()}><span class="card ic"><Icon name="check" size={32} /></span>できた</button>
		{/if}
	</aside>

	{#if drive}
		<img class="drive" src={imageUrl(word)} alt="" onerror={() => (drive = false)} />
	{/if}
	{#if toast}
		<div class="toast card" transition:fly={{ y: -80, duration: 400 }}>
			<span class="tem">{toast.emoji}</span>
			<div><small>めだる ゲット！</small><b>{toast.name}</b></div>
		</div>
	{/if}
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 220px 1fr 110px;
		grid-template-rows: auto 1fr;
		gap: 12px 18px;
		height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
		padding: 16px 22px;
	}
	header {
		grid-column: 1 / -1;
		display: flex;
		gap: 14px;
		align-items: center;
	}
	.with {
		color: var(--teal);
		font-size: 13px;
		font-weight: bold;
	}
	h1 {
		margin: 0;
		font-size: 22px;
	}
	.left {
		display: grid;
		gap: 10px;
		align-content: start;
	}
	.tabs {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.tab {
		width: 46px;
		padding: 6px 0;
		display: grid;
		justify-items: center;
		font-size: 20px;
		font-weight: bold;
	}
	.tab.on {
		background: var(--blue);
		color: #fff;
	}
	.tab .s {
		font-size: 12px;
	}
	.tab .s.gold {
		color: var(--star);
	}
	.charstars {
		padding: 10px;
		text-align: center;
	}
	.lbl {
		font-size: 13px;
		font-weight: bold;
	}
	.cols {
		display: flex;
		justify-content: space-around;
		margin-top: 4px;
	}
	.cols small {
		display: block;
		font-size: 10px;
		color: var(--sub);
	}
	.center {
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 10px;
		min-height: 0;
	}
	.modes {
		display: flex;
		padding: 4px;
	}
	.modes button {
		flex: 1;
		padding: 10px;
		border-radius: 16px;
		font-weight: bold;
		color: var(--sub);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.modes .on {
		background: var(--teal);
		color: #fff;
	}
	.board {
		position: relative;
		min-height: 0;
		padding: 12px;
	}
	.count {
		position: absolute;
		top: 10px;
		left: 14px;
		font-size: 13px;
		color: var(--sub);
		background: #eef1f4;
		padding: 4px 10px;
		border-radius: 12px;
	}
	.hint {
		margin: 0;
		text-align: center;
		color: var(--sub);
		font-size: 15px;
		min-height: 22px;
		font-weight: bold;
	}
	.right {
		display: grid;
		gap: 14px;
		align-content: center;
		justify-items: center;
	}
	.rb {
		display: grid;
		justify-items: center;
		gap: 4px;
		font-size: 11px;
		color: var(--sub);
	}
	.ic {
		width: 48px;
		height: 48px;
		display: grid;
		place-content: center;
		color: var(--blue);
	}
	.done .ic {
		background: var(--teal);
		width: 64px;
		height: 64px;
		color: #fff;
	}
	.done {
		font-weight: bold;
		color: var(--teal);
	}
	.done.ready .ic {
		animation: ready 1s ease-in-out infinite;
		box-shadow: 0 0 0 6px rgba(19, 120, 111, 0.25);
	}
	@keyframes ready {
		50% {
			transform: scale(1.12);
		}
	}
	.flystar {
		position: absolute;
		left: 50%;
		top: 50%;
		font-size: 90px;
		animation: fly 0.9s ease-in forwards;
		pointer-events: none;
	}
	@keyframes fly {
		0% {
			transform: translate(-50%, -50%) scale(0.2);
			opacity: 0;
		}
		30% {
			transform: translate(-50%, -50%) scale(1.2);
			opacity: 1;
		}
		100% {
			transform: translate(calc(-50% - 60vw), calc(-50% + 10vh)) scale(0.2);
			opacity: 0;
		}
	}
	.toast {
		position: fixed;
		top: calc(24px + env(safe-area-inset-top));
		left: 50%;
		transform: translateX(-50%);
		z-index: 70;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 26px;
		background: #fffae6;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}
	.tem {
		font-size: 44px;
	}
	.toast small {
		display: block;
		color: #e08a00;
		font-weight: bold;
		font-size: 12px;
	}
	.toast b {
		font-size: 22px;
	}
	.drive {
		position: fixed;
		bottom: 20px;
		left: -300px;
		height: 200px;
		z-index: 60;
		animation: drive 2s ease-in-out forwards;
		pointer-events: none;
	}
	@keyframes drive {
		to {
			left: 110vw;
		}
	}
</style>
