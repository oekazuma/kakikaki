<script lang="ts">
  import Avatar from '../Avatar.svelte';
  import Icon from '../Icon.svelte';
  import AvatarCrop from './AvatarCrop.svelte';
  import { AVATARS, loadImage } from '$lib/avatar';
  let { value = $bindable() }: { value: string } = $props();
  let error = $state('');
  let cropping = $state<HTMLImageElement | null>(null);

  async function upload(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = ''; // 同じ写真をもう一度選べるように
    if (!f) return;
    error = '';
    try {
      cropping = await loadImage(f);
    } catch {
      error = 'この画像は読み込めませんでした';
    }
  }
</script>

{#if cropping}
  <AvatarCrop
    img={cropping}
    onpick={(url) => {
      value = url;
      cropping = null;
    }}
    oncancel={() => (cropping = null)}
  />
{:else}
  <div class="picker">
    <div class="preview"><Avatar avatar={value} size={120} /></div>
    <div class="grid">
      {#each AVATARS as a (a)}
        <button class={['pick', { on: value === a }]} onclick={() => (value = a)} aria-label={a}
          ><Avatar avatar={a} size={56} /></button
        >
      {/each}
      <label class={['pick', 'file', { on: value.startsWith('data:') }]}>
        <Icon name="upload" size={26} />
        <small>しゃしん</small>
        <input type="file" accept="image/*" onchange={upload} />
      </label>
    </div>
    {#if error}<p class="err">{error}</p>{/if}
  </div>
{/if}

<style>
  .picker {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: start;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pick {
    width: 66px;
    height: 66px;
    border-radius: 50%;
    display: grid;
    place-content: center;
    border: 3px solid transparent;
    transition: transform 0.1s;
  }
  .pick:active {
    transform: scale(0.94);
  }
  .pick.on {
    border-color: var(--blue);
    background: #e6f0ff;
  }
  .file {
    background: #eef1f4;
    color: var(--blue);
    font-weight: bold;
    gap: 0;
    line-height: 1;
  }
  .file small {
    font-size: 10px;
  }
  .file input {
    display: none;
  }
  .err {
    grid-column: 1 / -1;
    margin: 0;
    color: #c62828;
    font-weight: bold;
  }
</style>
