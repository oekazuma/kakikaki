<script lang="ts">
  import { resolve } from '$app/paths';
  import { info } from '$lib/lang.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import AppStatus from '$lib/components/about/AppStatus.svelte';
  import Backup from '$lib/components/about/Backup.svelte';
  import { profiles } from '$lib/profiles.svelte';
  import { pwaStatus, type PwaStatus } from '$lib/pwa';

  // 保護者の入口。進み具合と使い方は別ページ、更新・状態・バックアップはここ
  let status = $state<PwaStatus>({ standalone: false, swActive: false, cached: false });
  $effect(() => {
    pwaStatus()
      .then((s) => (status = s))
      .catch(() => {});
  });
</script>

<svelte:head>
  <title>アプリについて | {info().title}</title>
  <meta name="description" content="みんなの進み具合、使い方、更新方法、練習記録の保存についての保護者向けページ。" />
</svelte:head>

<main>
  <header>
    <BackButton />
    <h1>アプリについて</h1>
  </header>

  <div class="cols">
    <div class="left">
      <a class="card link big" href={resolve('/about/progress')}>
        <h2>みんなの進み具合</h2>
        <span class="faces">
          {#each profiles.list as p (p.id)}<Avatar avatar={p.avatar} size={40} />{/each}
        </span>
        <span class="go">グラフで見る <Icon name="back" size={18} /></span>
      </a>
      <section class="card">
        <h2>つかいかた</h2>
        <ul>
          <li>ホーム上部で ひらがな・かたかな・えいご を切り替えます。</li>
          <li>文字ごとに なぞる → じぶんで かく と自動で進み、単語を終えると おてほんなし に挑戦できます。</li>
          <li>右の きく は 1 文字、単語カードのスピーカーは単語全体を読み上げます。</li>
        </ul>
        <a class="go" href={resolve('/about/guide')}>くわしく <Icon name="back" size={18} /></a>
      </section>
      <section class="card">
        <h2>データについて</h2>
        <ul>
          <li>記録は端末の中にだけ保存します。サーバーには送りません。</li>
          <li>リセットや人の削除は「だれが つかう？」の鉛筆ボタンから。</li>
        </ul>
      </section>
    </div>
    <div class="right">
      <AppStatus {status} />
      <Backup />
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
  ul {
    margin: 0;
    padding-left: 22px;
  }
  .link {
    display: grid;
    gap: 8px;
    padding: 16px 20px;
    color: inherit;
    text-decoration: none;
    border: 3px solid var(--blue);
  }
  .faces {
    display: flex;
    gap: 6px;
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-weight: bold;
    color: var(--blue);
    text-decoration: none;
  }
  .go :global(svg) {
    transform: scaleX(-1);
  }
  .link .go {
    justify-self: end;
    margin: 0;
  }
</style>
