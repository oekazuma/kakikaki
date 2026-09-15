<script lang="ts">
  import type { Word } from '$lib/words';
  import { imageUrl } from '$lib/image';
  import { wordStar, wordCrown } from '$lib/progress.svelte';
  import { nameOf, subOf } from '$lib/lang.svelte';
  import Icon from './Icon.svelte';
  // ghost: イラストを灰色のシルエットにする（かくし演出でイラストが跳び出している間）。
  // fill: 親のグリッドのマス幅に合わせる（ホームの一覧。画面幅で右に余白が残らないように）
  let {
    word,
    onclick,
    size = 180,
    lazy = false,
    ghost = false,
    fill = false
  }: { word: Word; onclick?: () => void; size?: number; lazy?: boolean; ghost?: boolean; fill?: boolean } = $props();
  let missing = $state(false);
</script>

<button class="card" style:width={fill ? '100%' : `${size}px`} {onclick}>
  {#if wordCrown(word)}<span class="badge gold"><Icon name="crown" size={18} fill /></span
    >{:else if wordStar(word)}<span class="badge"><Icon name="star" size={18} fill /></span>{/if}
  {#if missing}
    <span class="initial kyokasho" style:height="{size * 0.6}px">{word.name[0]}</span>
  {:else}
    <img
      class={{ ghost }}
      src={imageUrl(word)}
      alt=""
      width={size - 20}
      height={size * 0.6}
      loading={lazy ? 'lazy' : 'eager'}
      style:height="{size * 0.6}px"
      onerror={() => (missing = true)}
    />
  {/if}
  <span class="name kyokasho">{nameOf(word)}</span>
  {#each subOf(word) as line (line)}<span class="desc">{line}</span>{/each}
</button>

<style>
  img.ghost {
    filter: brightness(0) opacity(0.18);
  }
  .card {
    position: relative;
    padding: 14px 10px 12px;
    text-align: center;
    display: grid;
    gap: 4px;
    flex: none;
    transition: transform 0.15s;
  }
  .card:active {
    transform: scale(0.96);
  }
  img {
    width: 100%;
    object-fit: contain;
  }
  .initial {
    display: grid;
    place-content: center;
    font-size: 64px;
    font-weight: bold;
    color: var(--blue);
    background: #eef3f8;
    border-radius: 14px;
  }
  .name {
    display: block;
    font-size: 20px;
    font-weight: bold;
  }
  .desc {
    display: block;
    font-size: 12px;
    color: var(--sub);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }
  .badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--star);
    color: #fff;
    display: grid;
    place-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    animation: pop 0.5s;
  }
  .badge.gold {
    background: var(--warn);
  }
  @keyframes pop {
    50% {
      transform: scale(1.4);
    }
  }
</style>
