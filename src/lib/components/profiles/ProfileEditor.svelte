<script lang="ts">
  import { untrack } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import AvatarPicker from './AvatarPicker.svelte';
  import Icon from '../Icon.svelte';
  import { Gate } from '$lib/gate.svelte';
  import { lang } from '$lib/lang.svelte';
  import { deleteProfile } from '$lib/progress.svelte';
  import { addProfile, byId, profiles, updateProfile, DEFAULT_AVATAR, NAME_MAX } from '$lib/profiles.svelte';
  // id が null なら新しい人を追加
  let { id, onclose }: { id: string | null; onclose: () => void } = $props();
  // 開いたときの人を編集する（親は編集中に id を変えない）
  const p = untrack(() => (id ? byId(id) : undefined));
  let name = $state(p?.name ?? '');
  let avatar = $state(p?.avatar ?? DEFAULT_AVATAR);
  let error = $state('');
  let deleting = $state(false);
  let ans = $state('');
  const gate = new Gate();

  function save() {
    const ok = id ? updateProfile(id, { name, avatar }) : !!addProfile(name, avatar, lang.v);
    if (ok) onclose();
    else error = 'ほぞん できませんでした。しゃしんを かえて みてね';
  }
  function confirmDelete(e: SubmitEvent) {
    e.preventDefault();
    if (!gate.submit(ans)) return (ans = '');
    deleteProfile(id!);
    onclose();
  }
</script>

<div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={onclose}></div>
<section class="card sheet" transition:scale={{ duration: 200, start: 0.9 }}>
  <label class="name">
    なまえ
    <input type="text" bind:value={name} maxlength={NAME_MAX} placeholder="なまえ" />
  </label>
  <AvatarPicker bind:value={avatar} />
  {#if error}<p class="err">{error}</p>{/if}
  <div class="actions">
    {#if id && profiles.list.length > 1 && !deleting}
      <button class="del" onclick={() => (deleting = true)}><Icon name="trash" size={20} /> この人を けす</button>
    {/if}
    <button class="cancel" onclick={onclose}>やめる</button>
    <button class="save" onclick={save} disabled={!name.trim()}><Icon name="check" size={22} /> ほぞん</button>
  </div>
  {#if deleting}
    <div class="gate">
      {#if gate.locked}
        <p class="warn">本日は 3 回間違えたため、削除は明日まで行えません。</p>
      {:else}
        <p>「{p?.name}」の練習記録・星・メダルもすべて消えます。保護者の方が計算に答えてください。</p>
        <form onsubmit={confirmDelete}>
          <b>{gate.a} × {gate.b} =</b>
          <input type="number" inputmode="numeric" bind:value={ans} required />
          <button type="submit" class="danger">削除する</button>
        </form>
        {#if gate.wrong}<p class="warn">違います。あと {gate.left} 回間違えると本日は削除できなくなります。</p>{/if}
      {/if}
    </div>
  {/if}
</section>

<style>
  .dim {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 70;
  }
  .sheet {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(760px, calc(100vw - 60px));
    max-height: calc(100vh - 60px);
    overflow: auto;
    padding: 22px 26px;
    display: grid;
    gap: 16px;
    z-index: 71;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: bold;
    font-size: 18px;
  }
  .name input {
    flex: 1;
    font-size: 24px;
    padding: 8px 14px;
    border: 2px solid #e3e8ee;
    border-radius: 12px;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    align-items: center;
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
  .del {
    margin-right: auto;
    color: #c62828;
    background: #fdecea;
  }
  .cancel {
    background: #eef1f4;
    color: var(--sub);
  }
  .save {
    background: var(--blue);
    color: #fff;
  }
  .save:disabled {
    opacity: 0.4;
  }
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
  .err,
  .warn {
    color: #c62828;
    font-weight: bold;
    margin: 0;
  }
</style>
