<script lang="ts">
  import { untrack } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import AvatarPicker from './AvatarPicker.svelte';
  import Icon from '../Icon.svelte';
  import DangerZone from './DangerZone.svelte';
  import { lang } from '$lib/lang.svelte';
  import { addProfile, byId, profiles, updateProfile, DEFAULT_AVATAR, NAME_MAX } from '$lib/profiles.svelte';
  // id が null なら新しい人を追加
  let { id, onclose }: { id: string | null; onclose: () => void } = $props();
  // 開いたときの人を編集する（親は編集中に id を変えない）
  const p = untrack(() => (id ? byId(id) : undefined));
  let name = $state(p?.name ?? '');
  let avatar = $state(p?.avatar ?? DEFAULT_AVATAR);
  let error = $state('');
  let deleting = $state(false);

  function save() {
    const ok = id ? updateProfile(id, { name, avatar }) : !!addProfile(name, avatar, lang.v);
    if (ok) onclose();
    else error = 'ほぞん できませんでした。しゃしんを かえて みてね';
  }
</script>

<div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={onclose}></div>
<section class="card sheet" transition:scale={{ duration: 200, start: 0.9 }}>
  <label class="name">
    なまえ
    <input type="text" bind:value={name} maxlength={NAME_MAX} placeholder="なまえ" />
    <small class={['len', { max: name.length >= NAME_MAX }]}>{name.length} / {NAME_MAX} もじ</small>
  </label>
  <AvatarPicker bind:value={avatar} />
  {#if error}<p class="err">{error}</p>{/if}
  <div class="actions">
    {#if id && !deleting}
      <button class="del" onclick={() => (deleting = true)}><Icon name="trash" size={20} /> けす・リセット</button>
    {/if}
    <button class="cancel" onclick={onclose}>やめる</button>
    <button class="save" onclick={save} disabled={!name.trim()}><Icon name="check" size={22} /> ほぞん</button>
  </div>
  {#if deleting && id}
    <DangerZone {id} canDelete={profiles.list.length > 1} ondone={onclose} />
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
  .len {
    font-size: 13px;
    color: var(--sub);
    white-space: nowrap;
  }
  .len.max {
    color: #c62828;
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
  .err {
    color: #c62828;
    font-weight: bold;
    margin: 0;
  }
</style>
