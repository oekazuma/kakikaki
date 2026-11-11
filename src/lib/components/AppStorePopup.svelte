<script lang="ts">
  import { resolve } from '$app/paths';
  import { fade, scale } from 'svelte/transition';
  import { loadJSON, saveJSON } from '$lib/storage';

  // 保護者向けのお知らせなので漢字で書き、学年での変換はしない。端末ごとに一度だけ出す
  const KEY = 'kk:appstore';
  let open = $state(!loadJSON(KEY, false, (v) => v === true));
  function close() {
    open = false;
    saveJSON(KEY, true);
  }
</script>

{#if open}
  <div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={close}></div>
  <section
    class="card pop"
    role="dialog"
    aria-modal="true"
    aria-label="iPad アプリができました"
    transition:scale={{ duration: 200, start: 0.9 }}
  >
    <span class="for">おうちの方へ</span>
    <h2>iPad アプリができました</h2>
    <p>
      App Store で「かきかき -
      なぞって覚える書き方練習」を公開しました。ひらがなは無料ですべて練習できます。記録はバックアップのファイルでアプリに引き継げます。
    </p>
    <p class="close">
      この Web 版は 2026 年 11 月 30
      日で公開を終えます。ホーム画面に追加してあれば、そのあともこの端末で使い続けられます（更新は届かなくなります）。
    </p>
    <div class="btns">
      <button class="later" onclick={close}>とじる</button>
      <a class="more" href={resolve('/about')} onclick={close}>くわしく見る</a>
    </div>
  </section>
{/if}

<style>
  .pop {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(560px, calc(100vw - 40px));
    padding: 26px 30px;
    display: grid;
    gap: 12px;
    z-index: 71;
    line-height: 1.7;
    font-size: 16px;
  }
  .for {
    justify-self: start;
    padding: 2px 12px;
    border-radius: 10px;
    background: var(--pill);
    color: var(--sub);
    font-size: 14px;
    font-weight: bold;
  }
  h2 {
    margin: 0;
    font-size: 26px;
    color: var(--blue);
  }
  p {
    margin: 0;
  }
  .close {
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--bg);
    font-weight: bold;
  }
  .btns {
    display: flex;
    justify-content: flex-end;
    gap: 14px;
    margin-top: 6px;
  }
  .btns > * {
    padding: 12px 24px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 18px;
    text-decoration: none;
  }
  .later {
    background: var(--pill);
    color: var(--ink);
  }
  .more {
    background: var(--blue);
    color: #fff;
  }
</style>
