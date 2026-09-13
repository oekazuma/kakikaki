<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import WordCard from '$lib/components/WordCard.svelte';
	import { WORDS, CATEGORIES } from '$lib/words';
	import { unlock } from '$lib/audio';
	import Bar from '$lib/components/Bar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { badgesOf, TOTAL } from '$lib/badges';
	import { earned, stats } from '$lib/progress.svelte';
	import { lang, setLang, info, type Lang } from '$lib/lang.svelte';
	const s = $derived(stats());
	const total = $derived(TOTAL(lang.v));
	const badgeCount = $derived(badgesOf(lang.v).length);
	const LANGS: Lang[] = ['ja', 'en'];
</script>

<svelte:head>
	<title>{info().title}</title>
	<meta name="description" content="iPad で遊ぶ、子ども向けのひらがな書き練習アプリ。すきな単語をえらんで、なぞって、じぶんで書いて、星とメダルをあつめよう。" />
</svelte:head>

<main in:fly={{ x: -40, duration: 250 }}>
	<header>
		{#key lang.v}
			<h1 in:fly={{ y: -16, duration: 300 }}>
				<img src="{base}/logo-mark{lang.v === 'en' ? '-en' : ''}.svg" alt="" /><span class="kaki">かきかき</span> <span class="hira">{info().short}</span>
			</h1>
		{/key}
		<div class="toggle card" role="tablist" aria-label="ことばを えらぶ">
			<span class="knob" class:en={lang.v === 'en'}></span>
			{#each LANGS as l (l)}
				<button role="tab" aria-selected={lang.v === l} class={{ on: lang.v === l }} onclick={() => setLang(l)}>
					{l === 'ja' ? 'あ' : 'A'} <small>{l === 'ja' ? 'ひらがな' : 'えいご'}</small>
				</button>
			{/each}
		</div>
		<nav>
			<a class="card prog" href="{base}/trophies">
				<span class="tr"><Icon name="trophy" size={22} /> {Object.keys(earned()).length} / {badgeCount}</span>
				<span class="pl">もじ {s.chars}/{total.chars}<Bar have={s.chars} need={total.chars} /></span>
				<span class="pl">たんご {s.words}/{total.words}<Bar have={s.words} need={total.words} color="var(--teal)" /></span>
			</a>
			<a class="card btn quiz" href="{base}/quiz"><Icon name="bulb" size={22} /> クイズ</a>
			<a class="card btn" href="{base}/chars">もじから えらぶ</a>
			<a class="card btn" href="{base}/about" aria-label="アプリについて"><Icon name="help" size={22} /></a>
		</nav>
	</header>
	{#key lang.v}
		<div class="words" in:fly={{ x: lang.v === 'en' ? 80 : -80, duration: 350 }}>
			{#each CATEGORIES as cat (cat)}
				<h2>{cat}</h2>
				<div class="row">
					{#each WORDS.filter((w) => w.category === cat) as w (w.id)}
						<WordCard
							word={w}
							size={150}
							onclick={() => {
								unlock();
								goto(`${base}/practice?w=${w.id}`);
							}}
						/>
					{/each}
				</div>
			{/each}
		</div>
	{/key}
</main>

<style>
	main {
		padding: 20px 28px 40px;
		min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
	}
	header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
	}
	.toggle {
		position: relative;
		display: flex;
		padding: 4px;
		border-radius: 30px;
		margin-left: auto;
	}
	.toggle button {
		position: relative;
		z-index: 1;
		width: 96px;
		height: 48px;
		border-radius: 26px;
		font-size: 22px;
		font-weight: bold;
		color: var(--sub);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		transition: color 0.3s;
	}
	.toggle button small {
		font-size: 13px;
	}
	.toggle .on {
		color: #fff;
	}
	.knob {
		position: absolute;
		top: 4px;
		left: 4px;
		width: 96px;
		height: 48px;
		border-radius: 26px;
		background: var(--blue);
		transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), background-color 0.4s;
	}
	.knob.en {
		transform: translateX(96px);
	}
	h1 {
		font-size: 26px;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		white-space: nowrap;
		flex: none;
	}
	h1 img {
		width: 52px;
		height: 52px;
	}
	.kaki {
		color: var(--blue);
	}
	.hira {
		color: var(--teal);
	}
	h2 {
		font-size: 18px;
		color: var(--sub);
		margin: 22px 0 8px;
	}
	nav {
		display: flex;
		gap: 10px;
		white-space: nowrap;
	}
	.prog {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 14px;
		text-decoration: none;
		font-size: 13px;
		font-weight: bold;
		color: var(--ink);
	}
	.pl {
		display: grid;
		gap: 3px;
		width: 96px;
		font-size: 11px;
		color: var(--sub);
	}
	.tr {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #e08a00;
	}
	.btn.quiz {
		background: var(--blue);
		color: #fff;
		gap: 6px;
	}
	.btn {
		display: flex;
		align-items: center;
		padding: 12px 14px;
		font-weight: bold;
		text-decoration: none;
		color: var(--teal);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding: 6px 0 10px;
	}
	/* 幅 1024 の iPad でも 1 行に収める。進捗バーは実績画面にもあるので省略 */
	@media (max-width: 1240px) {
		.pl {
			display: none;
		}
	}
</style>
