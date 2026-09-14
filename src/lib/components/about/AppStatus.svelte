<script lang="ts">
  import { version } from '$app/environment';
  import Icon from '../Icon.svelte';
  import { updateApp, type PwaStatus } from '$lib/pwa';
  let { status }: { status: PwaStatus } = $props();

  // kit.version.name の既定はビルド時刻（ミリ秒）
  const built = Number.isFinite(Number(version)) ? new Date(Number(version)).toLocaleString('ja-JP') : version;
  let updating = $state(false);
  function update() {
    if (!navigator.onLine) return alert('インターネットに接続してから押してください');
    updating = true;
    updateApp();
  }
  const items = $derived([
    [
      status.standalone,
      'ホーム画面からアプリとして起動しています',
      'ブラウザで開いています（ホーム画面に追加すると全画面で使えます）'
    ],
    [
      status.swActive,
      'オフライン用の保存が有効です',
      'オフライン用の保存がまだ有効ではありません（一度読み込み直してください）'
    ],
    [status.cached, '文字・イラスト・効果音を端末に保存済みです', 'まだ端末に保存されていません']
  ] as const);
</script>

<section class="card">
  <h2>更新</h2>
  <button class="update" onclick={update} disabled={updating}
    ><Icon name="redo" size={20} /> {updating ? '更新中…' : '最新版に更新'}</button
  >
  <small>いまのバージョン: {built}</small>
</section>

<section class="card">
  <h2>アプリの状態</h2>
  <ul class="status">
    {#each items as [ok, good, bad] (good)}
      <li class={ok ? 'good' : 'bad'}><Icon name={ok ? 'check' : 'close'} size={18} />{ok ? good : bad}</li>
    {/each}
  </ul>
</section>

<style>
  .update {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: var(--teal);
    color: #fff;
    padding: 12px 16px;
    border-radius: 14px;
    font-weight: bold;
    font-size: 16px;
  }
  .update:disabled {
    opacity: 0.6;
  }
  small {
    display: block;
    margin-top: 8px;
    color: var(--sub);
    text-align: center;
  }
  .status {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
  .status li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .status li :global(svg) {
    flex: none;
    margin-top: 3px;
    border-radius: 50%;
    padding: 2px;
    color: #fff;
  }
  .status .good :global(svg) {
    background: #43a047;
  }
  .status .bad :global(svg) {
    background: #e53935;
  }
</style>
