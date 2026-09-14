<script lang="ts">
  import Avatar from '../Avatar.svelte';
  import Icon from '../Icon.svelte';
  import AvatarCrop from './AvatarCrop.svelte';
  import { AVATARS, loadImage } from '$lib/avatar';
  import { photos, addPhoto, removePhoto } from '$lib/photos.svelte';
  let { value = $bindable() }: { value: string } = $props();
  let error = $state('');
  let cropping = $state<HTMLImageElement | null>(null);
  // 長押しした写真。「けす」ボタンを出す
  let holding = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

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
  // 切り抜きが終わったら元画像の object URL を返す（表示中は revoke できない）
  function closeCrop() {
    if (cropping) URL.revokeObjectURL(cropping.src);
    cropping = null;
  }
  function picked(url: string) {
    closeCrop();
    value = url;
    if (!addPhoto(url)) error = 'しゃしんの いちらんが いっぱいです（この人には つかえます）';
  }
  // 600ms 押し続けたら削除モード。タップ（短い押下）は選択
  function press(url: string) {
    clearTimeout(timer);
    timer = setTimeout(() => (holding = url), 600);
  }
  function release(url: string) {
    clearTimeout(timer);
    if (holding !== url) {
      holding = null;
      value = url;
    }
  }
  function remove(url: string) {
    removePhoto(url);
    holding = null;
  }
</script>

{#if cropping}
  <AvatarCrop img={cropping} onpick={picked} oncancel={closeCrop} />
{:else}
  <div class="picker">
    <div class="preview"><Avatar avatar={value} size={120} /></div>
    <div class="grid">
      {#each AVATARS as a (a)}
        <button class={['pick', { on: value === a }]} onclick={() => (value = a)} aria-label={a}
          ><Avatar avatar={a} size={56} /></button
        >
      {/each}
      {#each photos.list as p (p)}
        <span class={['pick', 'photo', { on: value === p, hold: holding === p }]}>
          <button
            class="face"
            aria-label="しゃしん"
            onpointerdown={() => press(p)}
            onpointerup={() => release(p)}
            onpointercancel={() => clearTimeout(timer)}
            onpointerleave={() => clearTimeout(timer)}
            oncontextmenu={(e) => e.preventDefault()}><Avatar avatar={p} size={56} /></button
          >
          {#if holding === p}
            <button class="del" onclick={() => remove(p)}><Icon name="trash" size={16} /> けす</button>
          {/if}
        </span>
      {/each}
      <label class="pick file">
        <Icon name="upload" size={26} />
        <small>しゃしん</small>
        <input type="file" accept="image/*" onchange={upload} />
      </label>
    </div>
    {#if error}<p class="err">{error}</p>{/if}
    <p class="note">しゃしんは ながおしで けせます。ほかの人も おなじ しゃしんを えらべます</p>
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
    position: relative;
  }
  .pick:active {
    transform: scale(0.94);
  }
  .pick.on {
    border-color: var(--blue);
    background: #e6f0ff;
  }
  .face {
    display: grid;
    place-content: center;
    border-radius: 50%;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  .hold {
    border-color: var(--danger);
  }
  /* 揺らすのは写真だけ。「けす」ボタンは動かさない */
  .hold .face {
    animation: wiggle 0.4s infinite;
  }
  .del {
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translate(-50%, 2px);
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--danger);
    color: #fff;
    font-size: 13px;
    font-weight: bold;
    padding: 6px 10px;
    border-radius: 10px;
    white-space: nowrap;
    z-index: 1;
  }
  @keyframes wiggle {
    25% {
      transform: rotate(-3deg);
    }
    75% {
      transform: rotate(3deg);
    }
  }
  .file {
    background: var(--pill);
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
  .err,
  .note {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 13px;
    color: var(--sub);
  }
  .err {
    color: var(--danger-ink);
    font-weight: bold;
  }
</style>
