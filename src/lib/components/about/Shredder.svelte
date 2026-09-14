<script lang="ts">
  import { fade } from 'svelte/transition';
  // 記録を書いた紙がシュレッダーに吸い込まれて細切れになる演出。終わったら onend
  let { name, lang, onend }: { name: string; lang: string; onend: () => void } = $props();
  const STRIPS = 12;
  $effect(() => {
    const t = setTimeout(onend, 3200);
    return () => clearTimeout(t);
  });
</script>

<div class="stage" transition:fade={{ duration: 200 }} role="presentation">
  <div class="machine">
    <div class="feed">
      <div class="paper">
        <b>{name}</b>
        <small>{lang} の きろく</small>
        <i></i><i></i><i></i><i></i><i></i>
      </div>
    </div>
    <div class="slot"></div>
    <div class="out">
      {#each Array.from({ length: STRIPS }, (_, i) => i) as i (i)}
        <span class="strip" style:--i={i}></span>
      {/each}
    </div>
  </div>
  <p>けしています…</p>
</div>

<style>
  .stage {
    position: fixed;
    inset: 0;
    z-index: 80;
    background: rgba(0, 0, 0, 0.55);
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 18px;
  }
  .machine {
    position: relative;
    width: 320px;
    height: 420px;
  }
  /* 紙は差込口より上だけ見える */
  .feed {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 200px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }
  .paper {
    width: 200px;
    height: 240px;
    background: #fff;
    border-radius: 6px;
    padding: 16px;
    display: grid;
    gap: 8px;
    align-content: start;
    box-sizing: border-box;
    animation: feed 2s 0.3s ease-in forwards;
  }
  .paper b {
    font-size: 22px;
  }
  .paper small {
    color: var(--sub);
    font-weight: bold;
  }
  .paper i {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: #dfe4ea;
  }
  @keyframes feed {
    from {
      transform: translateY(-40px);
    }
    to {
      transform: translateY(260px);
    }
  }
  .slot {
    position: absolute;
    left: 0;
    right: 0;
    top: 190px;
    height: 60px;
    border-radius: 14px;
    background: #37474f;
    box-shadow: inset 0 14px 0 #263238;
  }
  .out {
    position: absolute;
    left: 60px;
    right: 60px;
    top: 250px;
    height: 170px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    overflow: hidden;
  }
  .strip {
    width: 12px;
    height: 0;
    background: #fff;
    border-radius: 0 0 4px 4px;
    transform-origin: top center;
    animation:
      grow 1.6s calc(0.9s + var(--i) * 0.05s) linear forwards,
      sway 0.5s calc(0.9s + var(--i) * 0.07s) ease-in-out infinite alternate;
  }
  @keyframes grow {
    to {
      height: 180px;
    }
  }
  @keyframes sway {
    from {
      transform: rotate(-3deg);
    }
    to {
      transform: rotate(3deg);
    }
  }
  p {
    margin: 0;
    color: #fff;
    font-size: 22px;
    font-weight: bold;
  }
</style>
