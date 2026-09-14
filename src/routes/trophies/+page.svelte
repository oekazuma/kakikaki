<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import StatTiles from '$lib/components/trophies/StatTiles.svelte';
  import BadgeGrid from '$lib/components/trophies/BadgeGrid.svelte';
  import Hero from '$lib/components/trophies/Hero.svelte';
  import { fly } from 'svelte/transition';
  import { untrack } from 'svelte';
  import { checkBadges, earned, stats } from '$lib/progress.svelte';
  import { badgesOf } from '$lib/badges';
  import { info, lang } from '$lib/lang.svelte';
  import { fx } from '$lib/fx';

  // 条件を満たしているのにまだ確定していないメダルがあれば、ここで確定して紙吹雪（earned を書くので効果の依存にしない）
  $effect(() => {
    if (untrack(checkBadges).length) setTimeout(() => fx.confetti(200), 300);
  });
  // 集計は重い（210 語 × 文字）ので、ページで 1 回だけ計算して 3 つの部品に渡す
  const s = $derived(stats());
  const badges = $derived(badgesOf(lang.v));
  const got = $derived(earned());
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
  <Hero {s} {badges} {got} />
  <StatTiles {s} />
  <BadgeGrid {s} {badges} {got} />
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
    color: var(--warn);
  }
</style>
