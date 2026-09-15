<script lang="ts">
  import { resolve } from '$app/paths';
  import { info } from '$lib/lang.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import Guide from '$lib/components/about/Guide.svelte';
  import { pwaStatus } from '$lib/pwa';

  let standalone = $state(false);
  $effect(() => {
    pwaStatus()
      .then((s) => (standalone = s.standalone))
      .catch(() => {});
  });
</script>

<svelte:head>
  <title>つかいかた | {info().title}</title>
  <meta
    name="description"
    content="練習の流れ、星とメダル、使う人、ホーム画面への追加、オフラインとデータについての保護者向け説明。"
  />
</svelte:head>

<main>
  <header>
    <BackButton href={resolve('/about')} />
    <h1>つかいかた</h1>
  </header>
  <div class="list">
    <Guide {standalone} />
  </div>
</main>

<style>
  main {
    padding: 16px 22px 40px;
    max-width: 860px;
    -webkit-user-select: text;
    user-select: text;
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
  }
  .list {
    display: grid;
    gap: 10px;
  }
</style>
