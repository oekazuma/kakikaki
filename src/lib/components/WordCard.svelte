<script lang="ts">
	import type { Word } from '$lib/words';
	import { imageUrl } from '$lib/image';
	import { wordStar, wordCrown } from '$lib/progress.svelte';
	import { nameOf, descOf } from '$lib/lang.svelte';
	let { word, onclick, size = 180 }: { word: Word; onclick?: () => void; size?: number } = $props();
	let missing = $state(false);
</script>

<button class="card" style:width="{size}px" {onclick}>
	{#if wordCrown(word)}<span class="badge">👑</span>{:else if wordStar(word)}<span class="badge">⭐</span>{/if}
	{#if missing}
		<div class="initial" style:height="{size * 0.6}px">{word.name[0]}</div>
	{:else}
		<img src={imageUrl(word)} alt="" style:height="{size * 0.6}px" onerror={() => (missing = true)} />
	{/if}
	<div class="name">{nameOf(word)}</div>
	{#if descOf(word)}<div class="desc">{descOf(word)}</div>{/if}
</button>

<style>
	.card {
		position: relative;
		padding: 14px 10px 12px;
		text-align: center;
		display: grid;
		gap: 4px;
		flex: none;
		transition: transform 0.15s;
	}
	.card:active {
		transform: scale(0.96);
	}
	img {
		width: 100%;
		object-fit: contain;
	}
	.initial {
		display: grid;
		place-content: center;
		font-size: 64px;
		font-weight: bold;
		color: var(--blue);
		background: #eef3f8;
		border-radius: 14px;
	}
	.name {
		font-size: 20px;
		font-weight: bold;
	}
	.desc {
		font-size: 12px;
		color: var(--sub);
	}
	.badge {
		position: absolute;
		top: 6px;
		right: 8px;
		font-size: 26px;
		animation: pop 0.5s;
	}
	@keyframes pop {
		50% {
			transform: scale(1.4);
		}
	}
</style>
