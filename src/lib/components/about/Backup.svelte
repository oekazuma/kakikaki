<script lang="ts">
  import { version } from '$app/environment';
  import Icon from '../Icon.svelte';
  import { Gate, MAX_FAILS } from '$lib/gate.svelte';
  import { exportAll, parseBackup, importAll, summarize, type Backup } from '$lib/backup';
  import { today } from '$lib/today';
  // 記録の書き出し（ファイルに保存）と読み込み（掛け算ゲート → 件数の確認 → 全部置き換え）
  let pending = $state<Backup | null>(null);
  let gate = $state<Gate | null>(null);
  let ans = $state('');
  let agreed = $state(false);
  let error = $state('');
  const sum = $derived(pending ? summarize(pending) : null);

  function save() {
    const url = URL.createObjectURL(new Blob([exportAll(version)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kakikaki-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    error = '';
    try {
      pending = parseBackup(await f.text());
      gate = new Gate();
      ans = '';
      agreed = false;
    } catch {
      error = '読み込めませんでした。「記録を書き出す」で保存したファイルを選んでください。';
    }
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!pending || !gate) return;
    if (!gate.submit(ans)) return void (ans = '');
    if (importAll(pending)) return location.reload();
    pending = null;
    error = '読み込めませんでした（保存できる容量を超えています）。いまの記録は元のままです。';
  }
</script>

<section class="card">
  <h2>バックアップ</h2>
  <p>全員の記録・名前・アバターを 1 つのファイルに書き出せます。端末を替えるときや、初期化の前に。</p>
  <div class="row">
    <button class="act" onclick={save}><Icon name="check" size={18} /> 記録を書き出す</button>
    <label class="act file"
      ><Icon name="upload" size={18} /> 記録を読み込む<input
        type="file"
        accept="application/json,.json"
        onchange={pick}
      /></label
    >
  </div>
  {#if error}<p class="err">{error}</p>{/if}
  {#if pending && gate && sum}
    <form class="confirm" onsubmit={submit}>
      <p><b>{sum.people} 人</b>・{sum.keys} 件の記録（{sum.at} に書き出し）</p>
      <p class="warn">いまこの端末にある記録は<b>すべて置き換わります</b>。元に戻せません。</p>
      {#if gate.locked}
        <p class="err">本日は {MAX_FAILS} 回間違えたため、読み込みは明日まで行えません。</p>
      {:else}
        <label class="gate"
          >保護者の方が計算に答えてください <b>{gate.a} × {gate.b} =</b>
          <input type="number" inputmode="numeric" bind:value={ans} required /></label
        >
        {#if gate.wrong}<p class="err">違います。あと {gate.left} 回。</p>{/if}
        <label class="agree"><input type="checkbox" bind:checked={agreed} /> 置き換えることを確認しました</label>
      {/if}
      <div class="row">
        <button type="button" class="act" onclick={() => (pending = null)}>やめる</button>
        <button type="submit" class="act go" disabled={gate.locked || !agreed || !ans}>読み込む</button>
      </div>
    </form>
  {/if}
</section>

<style>
  .row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .act {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--pill);
    color: var(--blue);
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
  }
  .file input {
    display: none;
  }
  .go {
    background: var(--danger);
    color: #fff;
  }
  .go:disabled {
    background: #cfd6dd;
  }
  .confirm {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 2px solid #f2b8b5;
  }
  .warn {
    color: var(--danger-ink);
  }
  .gate {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .gate input {
    width: 90px;
    font-size: 18px;
    padding: 6px 10px;
    border: 2px solid #e3e8ee;
    border-radius: 10px;
  }
  .agree {
    display: block;
    margin-top: 8px;
  }
  .err {
    color: var(--danger-ink);
    font-weight: bold;
  }
</style>
