<script lang="ts">
  import { resolve } from '$app/paths';
  import { fly } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { imageUrl } from '$lib/image';
  import { nameOf } from '$lib/lang.svelte';
  import { wordCrown } from '$lib/progress.svelte';
  import type { Word } from '$lib/words';
  let { word, onnext, onreplay }: { word: Word; onnext: () => void; onreplay: () => void } = $props();
</script>

<div class="complete card" in:fly={{ y: 40, duration: 350 }}>
  <img
    src={imageUrl(word)}
    alt=""
    width="170"
    height="120"
    loading="eager"
    onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
  />
  <b class="cname">{nameOf(word)}</b>
  <p>ぜんぶ できた！</p>
  {#if wordCrown(word)}<span class="mark gold"><Icon name="crown" size={22} fill /> おうかん</span>{:else}<span
      class="mark"><Icon name="star" size={22} fill /> ほし ゲット</span
    >{/if}
  <div class="btns">
    <button class="next" onclick={onnext}>{word.id.startsWith('char-') ? 'つぎの もじ' : 'つぎの たんご'}</button>
    <a class="home" href={resolve('/')}>ホームへ</a>
    <button class="again" onclick={onreplay}>もういちど</button>
  </div>
</div>

<style>
  .complete {
    position: fixed;
    inset: 0;
    margin: auto;
    width: 520px;
    height: 400px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 8px;
    z-index: 80;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
  img {
    height: 120px;
  }
  .cname {
    font-size: 26px;
  }
  p {
    margin: 0;
    font-size: 30px;
    font-weight: bold;
    color: var(--blue);
  }
  .mark {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--star);
    font-weight: bold;
  }
  .mark.gold {
    color: #e08a00;
  }
  .btns {
    display: flex;
    gap: 12px;
    margin-top: 10px;
  }
  .btns > * {
    padding: 12px 20px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 17px;
    text-decoration: none;
  }
  .next {
    background: var(--blue);
    color: #fff;
  }
  .home,
  .again {
    background: #eef1f4;
    color: var(--ink);
  }
</style>
