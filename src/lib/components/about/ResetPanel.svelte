<script lang="ts">
  import { reset } from '$lib/progress.svelte';
  import { info } from '$lib/lang.svelte';
  import { Gate, MAX_FAILS } from '$lib/gate.svelte';
  import { current } from '$lib/profiles.svelte';
  import DeleteConfirm from '../DeleteConfirm.svelte';
  import Shredder from '../Shredder.svelte';
  import { lang } from '$lib/lang.svelte';

  const gate = new Gate();
  let ans = $state('');
  // ゲート通過 → 最終確認（confirm）→ シュレッダー演出（shred）→ 完了表示（done）
  let step = $state<'idle' | 'confirm' | 'shred' | 'done'>('idle');
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!gate.submit(ans)) ans = '';
  }
  function doReset() {
    reset();
    gate.passed = false;
    step = 'shred';
  }
</script>

<section class="card danger-zone">
  <h2>練習記録の削除</h2>
  <p>
    いま使っている「{current().name}」の「{info().short}」の記録をすべて消して最初の状態に戻します。<b
      >元に戻せません。</b
    >
    人ごと削除するときは「だれが つかう？」の鉛筆ボタンから。
  </p>
  <ul>
    <li>各文字の回数と星</li>
    <li>単語の星と王冠</li>
    <li>メダルと獲得日、練習した日</li>
    <li>クイズの正解数</li>
  </ul>
  {#if step === 'done'}
    <p class="finished">「{current().name}」の「{info().short}」の記録を削除しました。</p>
  {:else if gate.passed}
    <button class="danger" onclick={() => (step = 'confirm')}
      >「{current().name}」の「{info().short}」の記録を削除する</button
    >
  {:else if gate.locked}
    <p class="lock">本日は {MAX_FAILS} 回間違えたため、削除は明日まで行えません。</p>
  {:else}
    <form onsubmit={submit} class="gate">
      <label
        >誤操作を防ぐため、計算に答えてください<br /><b>{gate.a} × {gate.b} =</b>
        <input type="number" inputmode="numeric" bind:value={ans} required /><button type="submit" class="ok"
          >確認</button
        ></label
      >
      {#if gate.wrong}<span class="warn">違います。あと {gate.left} 回間違えると本日は削除できなくなります。</span>{/if}
    </form>
  {/if}
</section>
{#if step === 'confirm'}
  <DeleteConfirm pid={current().id} lang={lang.v} onconfirm={doReset} oncancel={() => (step = 'idle')} />
{:else if step === 'shred'}
  <Shredder name={current().name} lang={info().short} onend={() => (step = 'done')} />
{/if}

<style>
  .danger-zone {
    border: 2px solid #f2b8b5;
  }
  .danger-zone h2 {
    color: #c62828;
  }
  .gate {
    margin-top: 10px;
    display: grid;
    gap: 8px;
  }
  .gate label {
    display: block;
  }
  input {
    width: 80px;
    font-size: 18px;
    padding: 4px 8px;
    margin: 0 8px 0 6px;
  }
  .ok {
    background: var(--blue);
    color: #fff;
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: bold;
  }
  .finished {
    color: #2e7d32;
    font-weight: bold;
  }
  .warn,
  .lock {
    color: #c62828;
    font-weight: bold;
  }
  .danger {
    width: 100%;
    background: #e53935;
    color: #fff;
    padding: 12px 16px;
    border-radius: 14px;
    font-weight: bold;
    margin-top: 10px;
  }
</style>
