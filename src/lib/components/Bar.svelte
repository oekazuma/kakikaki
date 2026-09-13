<script lang="ts">
	let { have, need, color = 'var(--blue)' }: { have: number; need: number; color?: string } = $props();
</script>

<span class="bar"><span class="fill" style:width="{need ? Math.min(100, (100 * have) / need) : 0}%" style:background={color}></span></span>

<style>
	.bar {
		display: block;
		height: 10px;
		border-radius: 5px;
		background: #e6e9ed;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 5px;
		transition: width 0.6s ease-out;
	}
</style>
