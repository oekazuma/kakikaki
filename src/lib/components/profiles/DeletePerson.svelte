<script lang="ts">
  import { untrack } from 'svelte';
  import DeleteConfirm from '../DeleteConfirm.svelte';
  import Shredder from '../Shredder.svelte';
  import { Gate, MAX_FAILS } from '$lib/gate.svelte';
  import { byId } from '$lib/profiles.svelte';
  import { deleteProfile } from '$lib/progress.svelte';
  // 人の削除: 掛け算ゲート → 最終確認 → シュレッダー演出 → 削除して閉じる
  let { id, ondone }: { id: string; ondone: () => void } = $props();
  const gate = new Gate();
  let ans = $state('');
  let step = $state<'gate' | 'confirm' | 'shred'>('gate');
  // 開いたときの人を消す（親は途中で id を変えない）
  const name = untrack(() => byId(id)?.name ?? '');
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (gate.submit(ans)) step = 'confirm';
    else ans = '';
  }
  function finish() {
    deleteProfile(id);
    ondone();
  }
</script>

<div class="gate">
  {#if gate.locked}
    <p class="warn">本日は {MAX_FAILS} 回間違えたため、削除は明日まで行えません。</p>
  {:else}
    <p>「{name}」の練習記録・星・メダルもすべて消えます。保護者の方が計算に答えてください。</p>
    <form onsubmit={submit}>
      <b>{gate.a} × {gate.b} =</b>
      <input type="number" inputmode="numeric" bind:value={ans} required />
      <button type="submit" class="danger">つぎへ</button>
    </form>
    {#if gate.wrong}<p class="warn">違います。あと {gate.left} 回間違えると本日は削除できなくなります。</p>{/if}
  {/if}
</div>
{#if step === 'confirm'}
  <DeleteConfirm pid={id} mode="person" onconfirm={() => (step = 'shred')} oncancel={() => (step = 'gate')} />
{:else if step === 'shred'}
  <Shredder {name} lang="すべて" onend={finish} />
{/if}

<style>
  .gate {
    border-top: 2px solid #f2b8b5;
    padding-top: 12px;
    font-size: 14px;
    line-height: 1.7;
  }
  .gate p {
    margin: 0 0 6px;
  }
  .gate form {
    display: flex;
    align-items: center;
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
  .warn {
    color: #c62828;
    font-weight: bold;
    margin: 0;
  }
</style>
