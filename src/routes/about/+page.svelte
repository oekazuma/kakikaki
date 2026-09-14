<script lang="ts">
  import { info } from '$lib/lang.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import Guide from '$lib/components/about/Guide.svelte';
  import AppStatus from '$lib/components/about/AppStatus.svelte';
  import { pwaStatus, type PwaStatus } from '$lib/pwa';

  let status = $state<PwaStatus>({ standalone: false, swActive: false, cached: false });
  $effect(() => {
    pwaStatus().then((s) => (status = s));
  });
</script>

<svelte:head>
  <title>アプリについて | {info().title}</title>
  <meta
    name="description"
    content="使い方、星とメダルのルール、更新方法、練習記録の保存と削除についての保護者向け説明。"
  />
</svelte:head>

<main>
  <header>
    <BackButton />
    <h1>アプリについて</h1>
  </header>

  <div class="cols">
    <div class="left"><Guide standalone={status.standalone} /></div>
    <div class="right">
      <AppStatus {status} />
    </div>
  </div>
</main>

<style>
  main {
    padding: 16px 22px 40px;
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
  .cols {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 16px;
    align-items: start;
  }
  .left,
  .right {
    display: grid;
    gap: 14px;
  }
  .right {
    position: sticky;
    top: 16px;
  }
  main :global(section) {
    padding: 16px 20px;
    line-height: 1.7;
    font-size: 15px;
  }
  main :global(h2) {
    font-size: 17px;
    margin: 0 0 8px;
    color: var(--blue);
  }
  main :global(ul),
  main :global(ol) {
    margin: 0;
    padding-left: 22px;
  }
  main :global(p) {
    margin: 6px 0 0;
  }
</style>
