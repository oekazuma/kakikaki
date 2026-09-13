<script lang="ts">
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import Bar from '$lib/components/Bar.svelte';
	import { BADGES, CAT_TOTAL, TOTAL } from '$lib/badges';
	import { CATEGORIES } from '$lib/words';
	import { earned, stats } from '$lib/progress.svelte';

	const s = $derived(stats());
	const got = $derived(Object.keys(earned).length);
	const tiles = $derived([
		{ label: 'もじ', emoji: '✏️', have: s.chars, need: TOTAL.chars, color: 'var(--blue)' },
		{ label: 'きんのほし', emoji: '⭐', have: s.gold, need: TOTAL.chars, color: 'var(--star)' },
		{ label: 'たんご', emoji: '🎈', have: s.words, need: TOTAL.words, color: 'var(--teal)' },
		{ label: 'おうかん', emoji: '👑', have: s.crowns, need: TOTAL.words, color: '#e08a00' }
	]);
	const pct = (h: number, n: number) => Math.floor((100 * h) / n);
</script>

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<a class="card home" href="{base}/" aria-label="ホーム">🏠</a>
		<h1>🏆 めだる と きろく</h1>
		<span class="count">めだる {got} / {BADGES.length}</span>
	</header>

	<section class="tiles">
		{#each tiles as t (t.label)}
			<div class="card tile">
				<div class="tl"><span>{t.emoji} {t.label}</span><b>{pct(t.have, t.need)}%</b></div>
				<Bar have={t.have} need={t.need} color={t.color} />
				<small>{t.have} / {t.need}</small>
			</div>
		{/each}
	</section>

	<section class="card cats">
		{#each CATEGORIES as c (c)}
			<div class="cat">
				<span class="cn">{c}</span>
				<Bar have={s.cats[c]} need={CAT_TOTAL[c]} color="var(--teal)" />
				<small>{s.cats[c]} / {CAT_TOTAL[c]}</small>
			</div>
		{/each}
	</section>

	<section class="badges">
		{#each BADGES as b (b.id)}
			{@const [have, need] = b.need(s)}
			{@const ok = !!earned[b.id]}
			<div class={['card', 'badge', { ok }]}>
				<span class="em">{b.emoji}</span>
				<b>{b.name}</b>
				<small>{b.desc}</small>
				{#if ok}<span class="date">{earned[b.id].replaceAll('-', '/')} ゲット！</span>{:else}<span class="rest">あと {need - have}</span>{/if}
			</div>
		{/each}
	</section>
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
	.home {
		width: 44px;
		height: 44px;
		display: grid;
		place-content: center;
		text-decoration: none;
		font-size: 22px;
	}
	h1 {
		margin: 0;
		font-size: 22px;
		flex: 1;
	}
	.count {
		font-weight: bold;
		color: var(--teal);
		background: #fff;
		padding: 8px 14px;
		border-radius: 14px;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
		margin-bottom: 12px;
	}
	.tile {
		padding: 12px 14px;
		display: grid;
		gap: 6px;
	}
	.tl {
		display: flex;
		justify-content: space-between;
		font-weight: bold;
	}
	.tl b {
		color: var(--sub);
	}
	small {
		color: var(--sub);
		font-size: 11px;
	}
	.cats {
		padding: 12px 16px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px 20px;
		margin-bottom: 16px;
	}
	.cat {
		display: grid;
		grid-template-columns: 90px 1fr 50px;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: bold;
	}
	.cat small {
		text-align: right;
	}
	.badges {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 10px;
	}
	.badge {
		padding: 12px 10px;
		display: grid;
		justify-items: center;
		text-align: center;
		gap: 3px;
		filter: grayscale(1);
		opacity: 0.55;
	}
	.badge.ok {
		filter: none;
		opacity: 1;
		background: #fffae6;
		animation: pop 0.5s;
	}
	.em {
		font-size: 40px;
	}
	.badge b {
		font-size: 14px;
	}
	.date {
		font-size: 11px;
		color: #e08a00;
		font-weight: bold;
	}
	.rest {
		font-size: 11px;
		color: var(--sub);
	}
	@keyframes pop {
		50% {
			transform: scale(1.06);
		}
	}
</style>
