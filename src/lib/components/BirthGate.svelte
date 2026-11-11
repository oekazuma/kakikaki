<script lang="ts">
  import { untrack } from 'svelte';
  import Avatar from './Avatar.svelte';
  import { birthRange, isBirth } from '$lib/grade';
  import { updateProfile } from '$lib/profiles.svelte';
  import { today } from '$lib/today';
  import { missingBirth } from '$lib/yomi.svelte';
  // 保護者向けの画面なので漢字で書き、t() は通さない。開いたときに入っていない人だけを聞く
  const people = $state(
    untrack(() =>
      missingBirth().map((p) => ({
        id: p.id,
        avatar: p.avatar,
        // 初めて開いたときは最初の人が「わたし」で作られているので、名前から入れてもらう
        name: p.name === 'わたし' ? '' : p.name,
        birth: ''
      }))
    )
  );
  const range = birthRange(today());
  const ready = $derived(people.every((p) => p.name.trim() && isBirth(p.birth, today())));
  let error = $state(false);

  function start() {
    error = !people.every((p) => updateProfile(p.id, { name: p.name, birth: p.birth }));
  }
</script>

<div class="gate">
  <section class="card">
    <h2>お子さまの名前と生年月日を入れてください</h2>
    <p>学年に合わせて、習った漢字で説明文を表示するために使います。</p>
    <p>このブラウザの中に保存し、外に送ることはありません。</p>
    {#each people as p (p.id)}
      <div class="row">
        <Avatar avatar={p.avatar} size={48} />
        <input type="text" bind:value={p.name} maxlength="10" placeholder="名前" aria-label="名前" />
        <input type="date" bind:value={p.birth} min={range.min} max={range.max} aria-label="生年月日" />
      </div>
    {/each}
    {#if error}<p class="err">保存できませんでした。ブラウザの空き容量を確かめてください。</p>{/if}
    <button class="go" onclick={start} disabled={!ready}>はじめる</button>
  </section>
</div>

<style>
  .gate {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: grid;
    place-items: center;
    background: var(--bg);
    padding: 24px;
    overflow: auto;
  }
  .card {
    width: min(720px, 100%);
    padding: 26px 30px;
    display: grid;
    gap: 12px;
  }
  h2 {
    margin: 0 0 4px;
    font-size: 22px;
  }
  p {
    margin: 0;
    color: var(--sub);
    line-height: 1.6;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
  }
  input {
    font-size: 20px;
    padding: 8px 12px;
    border: 2px solid #e3e8ee;
    border-radius: 12px;
  }
  input[type='text'] {
    flex: 1;
    min-width: 0;
  }
  .err {
    color: var(--danger-ink);
    font-weight: bold;
  }
  .go {
    justify-self: end;
    margin-top: 8px;
    padding: 12px 28px;
    border-radius: 14px;
    font-weight: bold;
    font-size: 18px;
    background: var(--blue);
    color: #fff;
  }
  .go:disabled {
    opacity: 0.4;
  }
</style>
