<script lang="ts">
  import { untrack } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import LangPicker from './LangPicker.svelte';
  import Avatar from '../Avatar.svelte';
  import Icon from '../Icon.svelte';
  import { Gate, MAX_FAILS } from '$lib/gate.svelte';
  import { LANGS, type Lang } from '$lib/lang.svelte';
  import type { Profile } from '$lib/profiles.svelte';
  // 何を消すかを選び、保護者の計算に答える画面。通ったら onnext（次は件数つきの最終確認）
  let {
    p,
    kind,
    onnext,
    oncancel
  }: { p: Profile; kind: 'reset' | 'person'; onnext: (langs: Lang[]) => void; oncancel: () => void } = $props();
  const gate = new Gate();
  // 開いたときの人と種類で初期化する（親は途中で変えない）
  let langs = $state<Lang[]>(untrack(() => (kind === 'person' ? [...LANGS] : [p.lang])));
  let ans = $state('');
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (gate.submit(ans)) onnext(langs);
    else ans = '';
  }
</script>

<div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={oncancel}></div>
<section class={['card', 'modal', kind]} transition:scale={{ duration: 200, start: 0.9 }}>
  <h2>
    <Icon name={kind === 'person' ? 'trash' : 'redo'} size={24} />
    {kind === 'person' ? 'この人を けす' : 'きろくを リセット'}
  </h2>
  <div class="who">
    <Avatar avatar={p.avatar} size={56} />
    <b>{p.name}</b>
    <span
      >{kind === 'person'
        ? '名前・アバターと、すべてのことばの記録が消えます'
        : 'えらんだ ことばの記録だけが消えます'}</span
    >
  </div>
  {#if kind === 'reset'}
    <LangPicker bind:langs />
  {/if}
  <form onsubmit={submit}>
    {#if gate.locked}
      <p class="lock">本日は {MAX_FAILS} 回間違えたため、削除は明日まで行えません。</p>
    {:else}
      <div class="gate">
        <span>保護者の方が計算に答えてください</span>
        <b>{gate.a} × {gate.b} =</b>
        <input type="number" inputmode="numeric" bind:value={ans} required />
        {#if gate.wrong}<span class="warn">違います。あと {gate.left} 回で本日は削除できなくなります。</span>{/if}
      </div>
    {/if}
    <div class="actions">
      <button type="button" class="cancel" onclick={oncancel}>やめる</button>
      <button type="submit" class="next" disabled={gate.locked || langs.length === 0 || !ans}
        >つぎへ <Icon name="back" size={20} /></button
      >
    </div>
  </form>
</section>

<style>
  .dim {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 70;
  }
  .modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(560px, calc(100vw - 60px));
    padding: 22px 26px;
    display: grid;
    gap: 16px;
    z-index: 71;
    border: 3px solid #e08a00;
    font-size: 15px;
    line-height: 1.6;
  }
  .modal.person {
    border-color: #e53935;
  }
  h2 {
    margin: 0;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #e08a00;
  }
  .person h2 {
    color: #c62828;
  }
  .who {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 12px;
    align-items: center;
  }
  .who b {
    font-size: 22px;
  }
  .who span {
    grid-column: 2;
    color: var(--sub);
    font-weight: bold;
  }
  form {
    display: grid;
    gap: 16px;
  }
  .gate {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    background: #f3f5f7;
    padding: 12px 14px;
    border-radius: 12px;
  }
  .gate input {
    width: 90px;
    font-size: 20px;
    padding: 6px 8px;
  }
  .warn,
  .lock {
    color: #c62828;
    font-weight: bold;
    margin: 0;
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
    background: #eef1f4;
    color: var(--sub);
  }
  .next {
    background: var(--blue);
    color: #fff;
  }
  .next :global(svg) {
    transform: scaleX(-1);
  }
  .next:disabled {
    opacity: 0.35;
  }
</style>
