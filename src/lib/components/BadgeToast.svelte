<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Badge } from '$lib/badges';
  let { badge }: { badge: Badge } = $props();
</script>

<div class="toast card" transition:fly={{ y: -80, duration: 400 }}>
  <span class="tem">{badge.emoji}</span>
  <div><small>めだる ゲット！</small><b>{badge.name}</b></div>
</div>

<style>
  .toast {
    position: fixed;
    top: calc(24px + env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    z-index: 70;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 26px;
    background: #fffae6;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  .tem {
    font-size: 44px;
  }
  small {
    display: block;
    color: var(--warn);
    font-weight: bold;
    font-size: 12px;
  }
  b {
    font-size: 22px;
  }
</style>
