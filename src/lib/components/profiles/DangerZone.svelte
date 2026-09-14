<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from '../Icon.svelte';
  import DeleteConfirm from '../DeleteConfirm.svelte';
  import Shredder from '../Shredder.svelte';
  import { Gate, MAX_FAILS } from '$lib/gate.svelte';
  import { LANGS, info, type Lang } from '$lib/lang.svelte';
  import { byId } from '$lib/profiles.svelte';
  import { deleteProfile, resetRecords } from '$lib/progress.svelte';
  // 「きろくを リセット」（ことばを選ぶ）か「この人を けす」かを選び、掛け算ゲート → 最終確認 → シュレッダー → 実行
  let { id, canDelete, ondone }: { id: string; canDelete: boolean; ondone: () => void } = $props();
  const p = untrack(() => byId(id));
  const gate = new Gate();
  let kind = $state<'reset' | 'person' | null>(null);
  let langs = $state<Lang[]>([p?.lang ?? 'ja']);
  let step = $state<'pick' | 'gate' | 'confirm' | 'shred'>('pick');
  let ans = $state('');
  const target = $derived(langs.length === LANGS.length ? 'すべて' : langs.map((l) => info(l).short).join('・'));

  function choose(k: typeof kind) {
    kind = k;
    step = 'gate';
  }
  function toggle(l: Lang) {
    langs = langs.includes(l) ? langs.filter((x) => x !== l) : LANGS.filter((x) => x === l || langs.includes(x));
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (gate.submit(ans)) step = 'confirm';
    else ans = '';
  }
  function finish() {
    if (kind === 'person') deleteProfile(id);
    else resetRecords(id, langs);
    ondone();
  }
</script>

<div class="zone">
  <div class="choices">
    <button class={['opt', 'reset', { on: kind === 'reset' }]} onclick={() => choose('reset')}>
      <Icon name="redo" size={22} />
      <b>きろくを リセット</b>
      <small>星・メダル・クイズの記録を消して、この人を最初からにする</small>
    </button>
    {#if canDelete}
      <button class={['opt', 'person', { on: kind === 'person' }]} onclick={() => choose('person')}>
        <Icon name="trash" size={22} />
        <b>この人を けす</b>
        <small>名前・アバターと、すべての記録を消す</small>
      </button>
    {/if}
  </div>
  {#if kind === 'reset' && step !== 'confirm'}
    <div class="langs">
      どのことばの記録を消す？
      {#each LANGS as l (l)}
        <button class={['lg', { on: langs.includes(l) }]} onclick={() => toggle(l)}>{info(l).short}</button>
      {/each}
      <button class={['lg', { on: langs.length === LANGS.length }]} onclick={() => (langs = [...LANGS])}>ぜんぶ</button>
    </div>
  {/if}
  {#if kind && step !== 'pick'}
    {#if gate.locked}
      <p class="lock">本日は {MAX_FAILS} 回間違えたため、削除は明日まで行えません。</p>
    {:else}
      <form onsubmit={submit} class="gate">
        <span>保護者の方が計算に答えてください</span>
        <b>{gate.a} × {gate.b} =</b>
        <input type="number" inputmode="numeric" bind:value={ans} required />
        <button type="submit" class="danger" disabled={kind === 'reset' && langs.length === 0}>つぎへ</button>
      </form>
      {#if gate.wrong}<p class="warn">違います。あと {gate.left} 回間違えると本日は削除できなくなります。</p>{/if}
    {/if}
  {/if}
</div>
{#if step === 'confirm' && kind}
  <DeleteConfirm
    pid={id}
    mode={kind === 'person' ? 'person' : 'records'}
    {langs}
    onconfirm={() => (step = 'shred')}
    oncancel={() => (step = 'gate')}
  />
{:else if step === 'shred'}
  <Shredder name={p?.name ?? ''} lang={kind === 'person' ? 'すべて' : target} onend={finish} />
{/if}

<style>
  .zone {
    border-top: 2px solid #f2b8b5;
    padding-top: 14px;
    display: grid;
    gap: 12px;
    font-size: 14px;
    line-height: 1.6;
  }
  .choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .opt {
    display: grid;
    justify-items: start;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 3px solid transparent;
    text-align: left;
    background: #f3f5f7;
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
    color: #e08a00;
  }
  .person {
    color: #c62828;
  }
  .reset.on {
    border-color: #e08a00;
    background: #fff5e0;
  }
  .person.on {
    border-color: #e53935;
    background: #fdecea;
  }
  .langs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-weight: bold;
  }
  .lg {
    padding: 8px 14px;
    border-radius: 12px;
    background: #eef1f4;
    color: var(--sub);
    font-weight: bold;
  }
  .lg.on {
    background: #e08a00;
    color: #fff;
  }
  .gate {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .gate input {
    width: 80px;
    font-size: 18px;
    padding: 4px 8px;
  }
  .danger {
    background: #e53935;
    color: #fff;
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: bold;
  }
  .danger:disabled {
    opacity: 0.4;
  }
  .warn,
  .lock {
    color: #c62828;
    font-weight: bold;
    margin: 0;
  }
</style>
