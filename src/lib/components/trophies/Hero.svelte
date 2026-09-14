<script lang="ts">
  import Avatar from '../Avatar.svelte';
  import Bar from '../Bar.svelte';
  import { badgesOf, nextBadge } from '$lib/badges';
  import { earned, stats } from '$lib/progress.svelte';
  import { lang, info } from '$lib/lang.svelte';
  import { current } from '$lib/profiles.svelte';
  // 実績のいちばん上: 誰の記録か、メダルの輪、つぎに近いメダル
  const badges = $derived(badgesOf(lang.v));
  const got = $derived(Object.keys(earned()).length);
  const pct = $derived(Math.round((100 * got) / badges.length));
  const next = $derived(nextBadge(badges, stats(), earned()));
  const need = $derived(next ? next.need(stats()) : ([0, 1] as [number, number]));
  const R = 52;
  const C = 2 * Math.PI * R;
</script>

<section class="hero card">
  <div class="who">
    <Avatar avatar={current().avatar} size={72} />
    <div>
      <b>{current().name}</b>
      <small>{info().short} の きろく</small>
    </div>
  </div>
  <div class="ring">
    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#e6e9ed" stroke-width="12" />
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="var(--star)"
        stroke-width="12"
        stroke-linecap="round"
        stroke-dasharray={C}
        stroke-dashoffset={C * (1 - got / badges.length)}
        transform="rotate(-90 60 60)"
      />
    </svg>
    <div class="num"><b>{got}</b><small>/ {badges.length}</small></div>
    <span class="lbl">めだる {pct}%</span>
  </div>
  {#if next}
    <div class="next">
      <small>つぎの めだる</small>
      <div class="nb">
        <span class="em">{next.emoji}</span>
        <div>
          <b>{next.name}</b>
          <span class="desc">{next.desc}</span>
          <Bar have={need[0]} need={need[1]} color="var(--teal)" />
          <span class="rest">あと {Math.max(0, need[1] - need[0])}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="next all"><b>ぜんぶの めだるを あつめた！</b></div>
  {/if}
</section>

<style>
  .hero {
    display: grid;
    grid-template-columns: 240px 150px 1fr;
    gap: 16px;
    align-items: center;
    padding: 16px 22px;
    margin-bottom: 14px;
    background: linear-gradient(120deg, #fff 55%, #fff6d6);
  }
  .who {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .who div {
    display: grid;
  }
  .who b {
    font-size: 24px;
  }
  .who small,
  .next small {
    color: var(--sub);
    font-weight: bold;
    font-size: 13px;
  }
  .ring {
    position: relative;
    display: grid;
    justify-items: center;
  }
  .ring circle:last-of-type {
    transition: stroke-dashoffset 0.8s ease-out;
  }
  .num {
    position: absolute;
    top: 38px;
    display: flex;
    align-items: baseline;
    gap: 3px;
  }
  .num b {
    font-size: 30px;
  }
  .num small {
    font-size: 12px;
    color: var(--sub);
  }
  .lbl {
    font-size: 13px;
    font-weight: bold;
    color: #e08a00;
    margin-top: -6px;
  }
  .next {
    display: grid;
    gap: 6px;
  }
  .nb {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 12px;
    align-items: center;
  }
  .nb div {
    display: grid;
    gap: 4px;
  }
  .em {
    font-size: 44px;
    text-align: center;
    filter: grayscale(0.4);
  }
  .nb b {
    font-size: 17px;
  }
  .desc,
  .rest {
    font-size: 12px;
    color: var(--sub);
  }
  .rest {
    font-weight: bold;
    color: var(--teal);
  }
  .all b {
    font-size: 22px;
    color: #e08a00;
  }
</style>
