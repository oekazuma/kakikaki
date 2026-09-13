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
		<h1><img src="{base}/logo-mark.svg" alt="" /><span class="kaki">かきかき</span> <span class="hira">ひらがな</span></h1>
		<nav>
			<a class="card btn" href="{base}/chars">もじから えらぶ</a>
			<a class="card btn" href="{base}/about" aria-label="アプリについて">？</a>
		</nav>
	</header>
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
</main>

<style>
	main {
		padding: 20px 28px 40px;
		min-height: 100vh;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h1 {
		font-size: 30px;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 12px;
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
	}
	.btn {
		padding: 12px 18px;
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
</style>
