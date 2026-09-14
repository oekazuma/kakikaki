<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from '../Icon.svelte';
  import DangerModal from './DangerModal.svelte';
  import DeleteConfirm from '../DeleteConfirm.svelte';
  import Shredder from '../Shredder.svelte';
  import { LANGS, info, type Lang } from '$lib/lang.svelte';
  import { byId } from '$lib/profiles.svelte';
  import { deleteProfile, resetRecords } from '$lib/progress.svelte';
  // 「きろくを リセット」か「この人を けす」を選ぶ → モーダルでことば選択と計算 → 件数つき最終確認 → シュレッダー → 実行
  let { id, canDelete, ondone }: { id: string; canDelete: boolean; ondone: () => void } = $props();
  const p = untrack(() => byId(id));
  let kind = $state<'reset' | 'person' | null>(null);
  let langs = $state<Lang[]>([]);
  let step = $state<'pick' | 'confirm' | 'shred'>('pick');
  const target = $derived(langs.length === LANGS.length ? 'すべて' : langs.map((l) => info(l).short).join('・'));
  // 削除は最終確認の「削除する」を押した瞬間に行う。演出は見せるだけで、途中で閉じられても結果は変わらない
  function commit() {
    if (kind === 'person') deleteProfile(id);
    else resetRecords(id, langs);
    step = 'shred';
  }
</script>

<div class="zone">
  <button class="opt reset" onclick={() => (kind = 'reset')}>
    <b><Icon name="redo" size={22} /> きろくを リセット</b>
    <small>星・メダル・クイズの記録を消して、この人を最初からにする</small>
  </button>
  {#if canDelete}
    <button class="opt person" onclick={() => (kind = 'person')}>
      <b><Icon name="trash" size={22} /> この人を けす</b>
      <small>名前・アバターと、すべての記録を消す</small>
    </button>
  {/if}
</div>
{#if p && kind && step === 'pick'}
  <DangerModal
    {p}
    {kind}
    onnext={(ls) => {
      langs = ls;
      step = 'confirm';
    }}
    oncancel={() => (kind = null)}
  />
{:else if kind && step === 'confirm'}
  <DeleteConfirm
    pid={id}
    mode={kind === 'person' ? 'person' : 'records'}
    {langs}
    onconfirm={commit}
    oncancel={() => (step = 'pick')}
  />
{:else if step === 'shred'}
  <Shredder name={p?.name ?? ''} lang={target} onend={ondone} />
{/if}

<style>
  .zone {
    border-top: 2px solid #f2b8b5;
    padding-top: 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 14px;
    line-height: 1.6;
  }
  .opt {
    display: grid;
    justify-items: start;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    text-align: left;
    background: #f3f5f7;
    transition: transform 0.1s;
  }
  .opt:active {
    transform: scale(0.98);
  }
  .opt b {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 17px;
  }
  .opt small {
    color: var(--sub);
  }
  .reset {
    color: var(--warn);
  }
  .person {
    color: var(--danger-ink);
  }
</style>
