<script lang="ts">
  import { fly } from 'svelte/transition';
  import Avatar from '../Avatar.svelte';
  import Icon from '../Icon.svelte';
  import { ranking } from '$lib/balloon.svelte';
  import { profiles } from '$lib/profiles.svelte';
  // ゲーム終了: 今回の点、自己ベスト更新、みんなのランキング
  let {
    score,
    combo,
    isBest,
    onretry,
    onback
  }: { score: number; combo: number; isBest: boolean; onretry: () => void; onback: () => void } = $props();
  const rows = $derived(ranking(profiles.list));
</script>

<section class="card over" in:fly={{ y: 40, duration: 300 }}>
  <h2>おわり！</h2>
  <p class="score"><b>{score}</b> てん <small>さいだい {combo} コンボ</small></p>
  {#if isBest}<p class="best"><Icon name="star" size={20} fill /> じこベスト こうしん！</p>{/if}
  <ol class="rank">
    {#each rows as r, i (r.id)}
      <li class={{ me: r.id === profiles.cur, top: i === 0 }}>
        <span class="no">{i + 1}</span>
        <Avatar avatar={r.avatar} size={36} />
        <b>{r.name}</b>
        <span class="pt">{r.score} てん</span>
      </li>
    {/each}
  </ol>
  <div class="actions">
    <button class="back" onclick={onback}>もどる</button>
    <button class="retry" onclick={onretry}><Icon name="redo" size={22} /> もういちど</button>
  </div>
</section>

<style>
  .over {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, calc(100vw - 60px));
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 22px 26px;
    display: grid;
    gap: 12px;
    text-align: center;
    z-index: 3;
  }
  h2 {
    margin: 0;
    font-size: 28px;
    color: var(--blue);
  }
  .score {
    margin: 0;
    font-size: 22px;
  }
  .score b {
    font-size: 56px;
    color: var(--warn);
  }
  .score small {
    display: block;
    font-size: 14px;
    color: var(--sub);
  }
  .best {
    margin: 0;
    color: var(--warn);
    font-weight: bold;
    display: flex;
    justify-content: center;
    gap: 6px;
    animation: pop 0.5s;
  }
  .rank {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
    text-align: left;
  }
  .rank li {
    display: grid;
    grid-template-columns: 28px 36px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border-radius: 12px;
    background: #f3f5f7;
  }
  .rank .me {
    background: #e6f0ff;
    outline: 2px solid var(--blue);
  }
  .rank .top {
    background: #fff3c4;
  }
  .no {
    font-weight: bold;
    color: var(--sub);
    text-align: center;
  }
  .pt {
    font-weight: bold;
  }
  .actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
  .actions button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 22px;
    border-radius: 14px;
    font-weight: bold;
    font-size: 18px;
  }
  .back {
    background: var(--pill);
    color: var(--sub);
  }
  .retry {
    background: var(--blue);
    color: #fff;
  }
  @keyframes pop {
    50% {
      transform: scale(1.1);
    }
  }
</style>
