<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import StatTiles from '$lib/components/trophies/StatTiles.svelte';
  import BadgeGrid from '$lib/components/trophies/BadgeGrid.svelte';
  import { fly } from 'svelte/transition';
  import { badgesOf } from '$lib/badges';
  import { earned } from '$lib/progress.svelte';
  import { lang, info } from '$lib/lang.svelte';
  import { current } from '$lib/profiles.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

  const got = $derived(Object.keys(earned()).length);
  const all = $derived(badgesOf(lang.v).length);
</script>

<svelte:head>
  <title>めだる と きろく | {info().title}</title>
  <meta name="description" content="文字・単語・カテゴリごとの進捗率と、あつめたメダルを見るページ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1>
      <Icon name="trophy" /> めだる と きろく
      <small><Avatar avatar={current().avatar} size={28} /> {current().name} の {info().short}</small>
    </h1>
    <span class="count">めだる {got} / {all}</span>
  </header>
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
  h1 small {
    font-size: 14px;
    color: var(--sub);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 6px;
  }
  .count {
    font-weight: bold;
    color: var(--teal);
    background: #fff;
    padding: 8px 14px;
    border-radius: 14px;
  }
</style>
