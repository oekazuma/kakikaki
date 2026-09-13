<script lang="ts">
	let { n = 3, k = 0, size = 22 }: { n?: number; k?: number; size?: number } = $props();
</script>

<span class="stars" style:font-size="{size}px">
	{#each { length: n } as _, i (i)}<span class={{ on: i < k }}>★</span>{/each}
</span>

<style>
	.stars span {
		color: #d8dde2;
		display: inline-block;
	}
	.stars .on {
		color: var(--star);
		animation: pop 0.4s;
	}
	@keyframes pop {
		50% {
			transform: scale(1.5);
		}
	}
</style>
