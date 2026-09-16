<script lang="ts">
  import { resolve } from '$app/paths';
  import { fly } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { imageUrl } from '$lib/image';
  import { nameOf } from '$lib/lang.svelte';
  import { crownOf } from '$lib/practice.svelte';
  import { isCharWord, type Word } from '$lib/words';
  let {
    word,
    onnext,
    onreplay,
    onchallenge
  }: { word: Word; onnext: () => void; onreplay: () => void; onchallenge: () => void } = $props();
  const crown = $derived(crownOf(word));
</script>

<div class="complete card" in:fly={{ y: 40, duration: 350 }}>
  {#if !isCharWord(word)}
    <img
      src={imageUrl(word)}
      alt=""
      width="170"
      height="120"
      loading="eager"
      onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
    />
  {/if}
  <b class="cname kyokasho">{nameOf(word)}</b>
  <p>ぜんぶ できた！</p>
  {#if crown}<span class="mark gold"><Icon name="crown" size={22} fill /> おうかん</span>{:else}<span class="mark"
      ><Icon name="star" size={22} fill /> ほし ゲット</span
    >{/if}
  {#if !crown}
    <button class="challenge" onclick={onchallenge}
      ><Icon name="star" size={22} fill /> おてほんなしに ちょうせん</button
    >
  {/if}
  <div class="btns">
    <button class="next" onclick={onnext}>{isCharWord(word) ? 'つぎの もじ' : 'つぎの たんご'}</button>
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
    height: 450px;
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
    color: var(--warn);
  }
  .challenge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 12px 24px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 18px;
    background: var(--warn);
    color: #fff;
  }
  .btns {
    display: flex;
    gap: 12px;
    margin-top: 4px;
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
    background: var(--pill);
    color: var(--ink);
  }
</style>
