<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import Canvas, { type Result } from '$lib/components/Canvas.svelte';
	import WordCard from '$lib/components/WordCard.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import { wordById } from '$lib/words';
	import { imageUrl } from '$lib/image';
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
	let canvas = $state<Canvas>();
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

	function select(n: number) {
		i = n;
		stroke = 0;
		msg = '';
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
		say(readingOf(c));
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
				say('やったー！');
			}, 600);
			setTimeout(() => (drive = false), 2600);
		}
		setTimeout(() => {
			busy = false;
			if (i < chars.length - 1) select(i + 1);
			else {
				stroke = 0;
				msg = '';
				canvas?.reset();
			}
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
				<button
					class={{ on: mode === m.id }}
					onclick={() => {
						mode = m.id;
						msg = '';
						stroke = 0;
					}}>{m.label}</button
				>
			{/each}
		</div>
		<div class="board card">
			<span class="count">{Math.min(stroke + 1, STROKES[c].length)} / {STROKES[c].length}</span>
			{#key `${c}-${mode}`}
				<Canvas bind:this={canvas} char={c} {mode} onDone={done} onStroke={(k) => (stroke = k + 1)} />
			{/key}
			{#if flyStar}<div class="flystar">⭐</div>{/if}
		</div>
		<p class="hint">{msg || cur.hint}</p>
	</section>

	<aside class="right">
		<button class="rb" onclick={() => say(readingOf(c))}><span class="card ic">🔊</span>きく</button>
		<button class="rb" onclick={() => canvas?.playDemo()}><span class="card ic">👀</span>みる</button>
		<button
			class="rb"
			onclick={() => {
				canvas?.reset();
				stroke = 0;
				msg = '';
			}}><span class="card ic">↺</span>やりなおす</button
		>
		{#if mode === 'test'}
			<button class="rb done" onclick={() => canvas?.judge()}><span class="card ic">✅</span>できた</button>
		{/if}
	</aside>

	{#if drive}
		<img class="drive" src={imageUrl(word)} alt="" onerror={() => (drive = false)} />
	{/if}
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 220px 1fr 110px;
		grid-template-rows: auto 1fr;
		gap: 12px 18px;
		height: 100vh;
		padding: 16px 22px;
	}
	header {
		grid-column: 1 / -1;
		display: flex;
		gap: 14px;
		align-items: center;
	}
	.home {
		width: 44px;
		height: 44px;
		display: grid;
		place-content: center;
		text-decoration: none;
		font-size: 22px;
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
		font-size: 22px;
	}
	.done .ic {
		background: var(--teal);
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
