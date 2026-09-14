<script lang="ts">
  import { badgesOf } from '$lib/badges';
  import { earned, stats } from '$lib/progress.svelte';
  import { lang } from '$lib/lang.svelte';
  const s = $derived(stats());
  const BADGES = $derived(badgesOf(lang.v));
</script>

<section class="badges">
  {#each BADGES as b (b.id)}
    {@const [have, need] = b.need(s)}
    {@const ok = !!earned()[b.id]}
    <div class={['card', 'badge', { ok }]}>
      <span class="em">{b.emoji}</span>
      <b>{b.name}</b>
      <small>{b.desc}</small>
      {#if ok}<span class="date">{earned()[b.id].replaceAll('-', '/')} ゲット！</span>{:else}<span class="rest"
          >あと {need - have}</span
        >{/if}
    </div>
  {/each}
</section>

<style>
  .badges {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  .badge {
    padding: 12px 10px;
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 3px;
    filter: grayscale(1);
    opacity: 0.55;
  }
  .badge.ok {
    filter: none;
    opacity: 1;
    background: #fffae6;
    animation: pop 0.5s;
  }
  .em {
    font-size: 40px;
  }
  .badge b {
    font-size: 14px;
  }
  small {
    color: var(--sub);
    font-size: 11px;
  }
  .date {
    font-size: 11px;
    color: #e08a00;
    font-weight: bold;
  }
  .rest {
    font-size: 11px;
    color: var(--sub);
  }
  @keyframes pop {
    50% {
      transform: scale(1.06);
    }
  }
</style>
