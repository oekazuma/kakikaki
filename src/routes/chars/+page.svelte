<script lang="ts">
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import BackButton from '$lib/components/BackButton.svelte';
	import { SEION, GROUPS, ALPHABET } from '$lib/chars';
	import { charCleared, charGold } from '$lib/progress.svelte';
	import { lang, info } from '$lib/lang.svelte';
</script>

<svelte:head>
	<title>もじから えらぶ | {info().title}</title>
	<meta name="description" content="練習したい文字をえらぶページ。" />
</svelte:head>

{#snippet cell(c: string)}
	{#if c}
		<a class={['card', 'cell', { done: charCleared(c) }]} href="{base}/practice?w=char-{c}">
			{c}<span class="s">{charGold(c) ? '👑' : charCleared(c) ? '★' : ''}</span>
		</a>
	{:else}<span class="cell empty"></span>{/if}
{/snippet}

{#snippet table(cols: string[][])}
	<div class="table" style:--n={cols.length}>
		{#each cols as col, r (r)}
			<div class="col">
				{#each col as c, k (k)}{@render cell(c)}{/each}
			</div>
		{/each}
	</div>
{/snippet}

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<BackButton />
		<h1>もじから えらぶ</h1>
	</header>
	{#if lang.v === 'ja'}
		<div class="ja">
			{@render table(SEION)}
			<div class="groups">
				{#each GROUPS as g (g.name)}
					<section class="card group">
						<h2>{g.name}</h2>
						{@render table(g.cols)}
					</section>
				{/each}
			</div>
		</div>
	{:else}
		<div class="en">
			{#each ALPHABET as row, r (r)}
				<div class="row">
					{#each row as c, k (k)}{@render cell(c)}{/each}
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	main {
		padding: 16px 22px 40px;
	}
	header {
		display: flex;
		gap: 14px;
		align-items: center;
		margin-bottom: 12px;
	}
	h1 {
		margin: 0;
		font-size: 22px;
	}
	/* 五十音は右から左（あ行が右端） */
	.ja {
		direction: rtl;
		display: grid;
		gap: 18px;
	}
	.table {
		display: grid;
		grid-template-columns: repeat(var(--n), var(--cell, 96px));
		gap: 8px;
		justify-content: start;
	}
	.col {
		display: grid;
		gap: 8px;
	}
	.cell {
		direction: ltr;
		position: relative;
		width: var(--cell, 96px);
		height: var(--cell, 96px);
		display: grid;
		place-content: center;
		font-size: 30px;
		font-weight: bold;
		text-decoration: none;
		color: var(--ink);
	}
	.done {
		background: #fff8dc;
	}
	.empty {
		background: none;
		box-shadow: none;
	}
	.s {
		position: absolute;
		right: 6px;
		bottom: 2px;
		font-size: 14px;
		color: var(--star);
	}
	.groups {
		display: flex;
		gap: 16px;
		align-items: start;
		--cell: 78px;
	}
	.group {
		padding: 10px 14px 14px;
	}
	h2 {
		direction: ltr;
		text-align: right;
		margin: 0 0 8px;
		font-size: 15px;
		color: var(--sub);
	}
	.group .cell {
		font-size: 26px;
	}
	.en {
		display: grid;
		gap: 8px;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(13, 1fr);
		gap: 8px;
	}
	.en .cell {
		width: auto;
		height: auto;
		aspect-ratio: 1;
	}
</style>
