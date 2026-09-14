<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import StatTiles from '$lib/components/trophies/StatTiles.svelte';
  import BadgeGrid from '$lib/components/trophies/BadgeGrid.svelte';
  import Hero from '$lib/components/trophies/Hero.svelte';
  import { fly } from 'svelte/transition';
  import { checkBadges } from '$lib/progress.svelte';
  import { info } from '$lib/lang.svelte';
  import { fx } from '$lib/fx';

  // 条件を満たしているのにまだ確定していないメダルがあれば、ここで確定して紙吹雪
  $effect(() => {
    if (checkBadges().length) setTimeout(() => fx.confetti(200), 300);
  });
</script>

<svelte:head>
  <title>めだる と きろく | {info().title}</title>
  <meta name="description" content="文字・単語・カテゴリごとの進捗率と、あつめたメダルを見るページ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1><Icon name="trophy" /> めだる と きろく</h1>
  </header>
  <Hero />
  <StatTiles />
  <BadgeGrid />
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
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink);
  }
  h1 :global(svg) {
    color: #e08a00;
  }
</style>
