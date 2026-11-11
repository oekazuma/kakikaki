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
      <section class="card ios">
        <h2>iPhone・iPad アプリを公開しました</h2>
        <p>
          App Store で「かきかき -
          なぞって覚える書き方練習」を公開しました。ひらがなは無料ですべて練習できます。記録はバックアップのファイルで引き継げます。
        </p>
        <ol>
          <li>右の「バックアップ」で「記録を書き出す」（または「共有する」）を押し、ファイルを保存します。</li>
          <li>アプリのホームの ? から「アプリについて」を開き、「記録を読み込む」で保存したファイルを選びます。</li>
        </ol>
        <p class="close">
          この Web 版は 2026 年 11 月 30
          日で公開を終えます。ホーム画面に追加してあれば、そのあともこの端末で使い続けられます。ただし更新は届かなくなり、ホーム画面から消すと入れ直せません。念のため、右の「バックアップ」で記録を書き出しておいてください。
        </p>
        <a class="store" href="https://apps.apple.com/jp/app/id6832798120" target="_blank" rel="noreferrer"
          >App Store で見る <Icon name="back" size={18} /></a
        >
      </section>
      <a class="card link" href={resolve('/about/progress')}>
        <h2>みんなの進み具合</h2>
        <p>人ごと・ことばごとの達成率、練習した日、クイズの正解数、苦手な文字が見られます。</p>
        <span class="faces">
          {#each profiles.list as p (p.id)}<Avatar avatar={p.avatar} size={40} />{/each}
        </span>
        <span class="go">グラフで見る <Icon name="back" size={18} /></span>
      </a>
      <section class="card">
        <h2>つかいかた</h2>
        <ul>
          <li>ホーム上部で ひらがな・かたかな・かんじ・えいご を切り替えます。</li>
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
  ul,
  ol {
    margin: 0;
    padding-left: 22px;
  }
  .ios {
    border: 3px solid var(--blue);
  }
  .ios h2 {
    font-size: 21px;
  }
  .store {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 10px 20px;
    border-radius: 14px;
    background: var(--blue);
    color: #fff;
    font-weight: bold;
    text-decoration: none;
  }
  .store :global(svg) {
    transform: scaleX(-1);
  }
  .close {
    margin: 12px 0 0;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--bg);
    font-weight: bold;
  }
  .link {
    display: grid;
    gap: 8px;
    padding: 16px 20px;
    color: inherit;
    text-decoration: none;
  }
  .link p {
    margin: -4px 0 0;
    font-size: 14px;
    color: var(--sub);
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
