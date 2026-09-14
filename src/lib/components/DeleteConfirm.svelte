<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import { LANGS, info, type Lang } from '$lib/lang.svelte';
  import { byId } from '$lib/profiles.svelte';
  import { summaryOf } from '$lib/progress.svelte';
  // 最終確認: 誰の・どのことばの・何が消えるかを数字で見せ、チェックを入れないと削除できない。
  // mode 'records' はことば 1 つの記録、'person' は人ごと（全ことばの記録とアバター）
  let {
    pid,
    langs = LANGS,
    mode = 'records',
    onconfirm,
    oncancel
  }: {
    pid: string;
    langs?: Lang[];
    mode?: 'records' | 'person';
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();
  const p = $derived(byId(pid));
  const target = $derived(
    mode === 'person' || langs.length === LANGS.length
      ? 'すべての記録'
      : `${langs.map((l) => info(l).short).join('・')} の記録`
  );
  const sums = $derived(langs.map((l) => summaryOf(pid, l)));
  const total = (k: keyof (typeof sums)[number]) => sums.reduce((a, s) => a + s[k], 0);
  const rows = $derived([
    ['クリアした文字', total('chars')],
    ['金の星', total('gold')],
    ['星のついた単語', total('words')],
    ['王冠のついた単語', total('crowns')],
    ['メダル', total('medals')],
    ['練習した日', total('days')],
    ['クイズの正解数', total('quiz')]
  ]);
  let agreed = $state(false);
</script>

<div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={oncancel}></div>
<section class="card confirm" transition:scale={{ duration: 200, start: 0.9 }} aria-labelledby="rc-title">
  <h2 id="rc-title">
    <Icon name="trash" size={24} />
    {mode === 'person' ? 'この人を本当に削除しますか？' : '本当に削除しますか？'}
  </h2>
  <div class="who">
    <Avatar avatar={p?.avatar ?? 'cat'} size={64} />
    <div>
      <b class="name">{p?.name}</b>
      <span class="lang">{target}</span>
    </div>
  </div>
  <table>
    <tbody>
      {#each rows as [label, n] (label)}
        <tr><th>{label}</th><td>{n}</td></tr>
      {/each}
    </tbody>
  </table>
  {#if mode === 'person'}
    <p>
      ひらがな・かたかな・えいご の上の記録と、名前・アバターがすべて消えます。<b>元に戻せません。</b
      >ほかの人の記録は残ります。
    </p>
    <label class="agree"
      ><input type="checkbox" bind:checked={agreed} /> 「{p?.name}」を削除することを確認しました</label
    >
  {:else}
    <p>
      上の記録がすべて消えて、最初の状態に戻ります。<b>元に戻せません。</b>ほかの人や、ほかのことばの記録は残ります。
    </p>
    <label class="agree"
      ><input type="checkbox" bind:checked={agreed} /> 「{p?.name}」の「{target}」を消すことを確認しました</label
    >
  {/if}
  <div class="actions">
    <button class="cancel" onclick={oncancel}>やめる</button>
    <button class="go" disabled={!agreed} onclick={onconfirm}><Icon name="trash" size={20} /> 削除する</button>
  </div>
</section>

<style>
  .confirm {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(560px, calc(100vw - 60px));
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 22px 26px;
    display: grid;
    gap: 14px;
    z-index: 71;
    border: 3px solid var(--danger);
    font-size: 15px;
    line-height: 1.6;
  }
  h2 {
    margin: 0;
    font-size: 20px;
    color: var(--danger-ink);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .who div {
    display: grid;
  }
  .name {
    font-size: 24px;
  }
  .lang {
    color: var(--sub);
    font-weight: bold;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th,
  td {
    padding: 4px 8px;
    border-bottom: 1px solid #eee;
    text-align: left;
    font-weight: normal;
  }
  td {
    text-align: right;
    font-weight: bold;
    font-variant-numeric: tabular-nums;
  }
  p {
    margin: 0;
  }
  .agree {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    background: #fdecea;
    padding: 10px 12px;
    border-radius: 10px;
  }
  .agree input {
    width: 22px;
    height: 22px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  .actions button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    border-radius: 14px;
    font-weight: bold;
    font-size: 17px;
  }
  .cancel {
    background: var(--pill);
    color: var(--sub);
  }
  .go {
    background: var(--danger);
    color: #fff;
  }
  .go:disabled {
    opacity: 0.35;
  }
</style>
