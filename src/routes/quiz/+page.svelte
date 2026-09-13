<script lang="ts">
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import BackButton from '$lib/components/BackButton.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { info } from '$lib/lang.svelte';
	import { quiz } from '$lib/progress.svelte';
	import { LEVEL_NAME, QUESTIONS, type Kind, type Level } from '$lib/quiz';

	const KINDS: { id: Kind; icon: 'eye' | 'pencil'; name: string; desc: string }[] = [
		{ id: 'read', icon: 'eye', name: 'よみクイズ', desc: 'もじを よんで えを えらぼう' },
		{ id: 'write', icon: 'pencil', name: 'かきクイズ', desc: 'えを みて もじを かこう' }
	];
	const LEVELS: Level[] = [1, 2, 3];
</script>

<svelte:head>
	<title>クイズ | {info().title}</title>
	<meta name="description" content="よみクイズ・かきクイズを 初級・中級・上級 から選ぶページ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<BackButton />
		<h1><Icon name="bulb" /> クイズ <small>（{info().short}）</small></h1>
	</header>
	{#each KINDS as k (k.id)}
		<section class="card">
			<div class="kh">
				<span class="ki"><Icon name={k.icon} size={30} /></span>
				<div>
					<h2>{k.name}</h2>
					<p>{k.desc}（{QUESTIONS[k.id]} もん）</p>
				</div>
			</div>
			<div class="levels">
				{#each LEVELS as lv (lv)}
					{@const n = quiz()[`${k.id}${lv}`] ?? 0}
					<a class={['lv', `l${lv}`]} href="{base}/quiz/{k.id}?level={lv}">
						<b>{LEVEL_NAME[lv]}</b>
						<small>{'★'.repeat(lv)}</small>
						<span class="n">せいかい {n}</span>
					</a>
				{/each}
			</div>
		</section>
	{/each}
</main>

<style>
	main {
		padding: 16px 22px 40px;
	}
	header {
		display: flex;
		gap: 14px;
		align-items: center;
		margin-bottom: 14px;
	}
	h1 {
		margin: 0;
		font-size: 22px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	h1 :global(svg) {
		color: #e08a00;
	}
	h1 small {
		font-size: 14px;
		color: var(--sub);
	}
	section {
		padding: 18px 22px;
		margin-bottom: 16px;
		display: grid;
		grid-template-columns: 300px 1fr;
		align-items: center;
		gap: 20px;
	}
	.kh {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.ki {
		width: 56px;
		height: 56px;
		border-radius: 18px;
		background: var(--blue);
		color: #fff;
		display: grid;
		place-content: center;
	}
	h2 {
		margin: 0;
		font-size: 22px;
	}
	p {
		margin: 2px 0 0;
		color: var(--sub);
		font-size: 13px;
	}
	.levels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.lv {
		display: grid;
		justify-items: center;
		gap: 4px;
		padding: 16px 10px;
		border-radius: 18px;
		text-decoration: none;
		color: #fff;
		font-size: 20px;
		transition: transform 0.15s;
	}
	.lv:active {
		transform: scale(0.96);
	}
	.l1 {
		background: #43a047;
	}
	.l2 {
		background: var(--blue);
	}
	.l3 {
		background: #8e24aa;
	}
	.lv small {
		color: var(--star);
		font-size: 16px;
	}
	.n {
		font-size: 12px;
		background: rgba(255, 255, 255, 0.25);
		padding: 2px 10px;
		border-radius: 10px;
	}
</style>
