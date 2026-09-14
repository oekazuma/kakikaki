<script lang="ts">
  import { version } from '$app/environment';
  import { updated } from '$app/state';
  import Icon from '../Icon.svelte';
  import { updateApp, type PwaStatus } from '$lib/pwa';
  let { status }: { status: PwaStatus } = $props();

  // version は「ビルド時刻(ms)-gitハッシュ」（vite.config.ts）
  const [stamp, hash = ''] = version.split('-');
  const built = Number.isFinite(Number(stamp)) ? new Date(Number(stamp)).toLocaleString('ja-JP') : stamp;
  let updating = $state(false);
  let checking = $state(false);
  let checked = $state(false);
  async function check() {
    checking = true;
    await updated.check();
    checking = false;
    checked = true;
  }
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
  <p class={['state', { new: updated.current }]}>
    {updated.current ? 'あたらしい バージョンが あります' : checking ? '確認しています…' : '最新版です'}
  </p>
  <button class={['update', { ready: updated.current }]} onclick={update} disabled={updating || !updated.current}
    ><Icon name="redo" size={20} /> {updating ? '更新中…' : '最新版に更新'}</button
  >
  <small>いまのバージョン: {built}<br /><code>{hash || version}</code></small>
  {#if !updated.current}
    <button class="check" onclick={check} disabled={checking}>
      {checked && !checking ? '確認しました（最新版です）' : 'あたらしい バージョンが ないか 確認する'}
    </button>
  {/if}
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
  .state {
    margin: 0 0 8px;
    color: #2e7d32;
    font-weight: bold;
    text-align: center;
  }
  .state.new {
    color: #c62828;
  }
  .check {
    display: block;
    margin: 10px auto 0;
    color: var(--blue);
    font-size: 13px;
    font-weight: bold;
    text-decoration: underline;
    background: none;
  }
  .check:disabled {
    opacity: 0.6;
  }
  code {
    font-size: 12px;
    color: var(--sub);
  }
  .update.ready {
    background: #e53935;
    animation: nudge 1.6s ease-in-out infinite;
  }
  @keyframes nudge {
    50% {
      transform: scale(1.03);
    }
  }
  .update:disabled {
    background: #cfd6dd;
    color: #fff;
    animation: none;
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
