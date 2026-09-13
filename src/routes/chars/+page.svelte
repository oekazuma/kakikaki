<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import { base } from '$app/paths';
	import { fly } from 'svelte/transition';
	import { GOJUON } from '$lib/chars';
	import { charCleared, charGold } from '$lib/progress.svelte';
</script>

<svelte:head>
	<title>もじから えらぶ | かきかき ひらがな</title>
	<meta name="description" content="ひらがな 81 文字から練習したい文字をえらぶページ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
	<header>
		<BackButton />
		<h1>もじから えらぶ</h1>
	</header>
	<div class="grid">
		{#each GOJUON as row, r (r)}
			<div class="col">
				{#each row as c, k (k)}
					{#if c}
						<a class={['card', 'cell', { done: charCleared(c) }]} href="{base}/practice?w=char-{c}">
							{c}<span class="s">{charGold(c) ? '👑' : charCleared(c) ? '★' : ''}</span>
						</a>
					{:else}<span class="cell empty"></span>{/if}
				{/each}
			</div>
		{/each}
	</div>
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
	.grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 8px;
	}
	.col {
		display: grid;
		gap: 8px;
	}
	.cell {
		position: relative;
		aspect-ratio: 1;
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
</style>
