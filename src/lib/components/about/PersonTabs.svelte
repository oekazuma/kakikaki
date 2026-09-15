<script lang="ts">
  import Avatar from '../Avatar.svelte';
  import type { Profile } from '$lib/profiles.svelte';
  // 人の切り替えタブ（保護者向け。使う人の切り替えはしない）
  let { list, cur, onselect }: { list: Profile[]; cur: string; onselect: (id: string) => void } = $props();
</script>

<div class="tabs" role="tablist">
  {#each list as p (p.id)}
    <button class={{ on: p.id === cur }} role="tab" aria-selected={p.id === cur} onclick={() => onselect(p.id)}>
      <Avatar avatar={p.avatar} size={26} />{p.name}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px 4px 6px;
    border-radius: 20px;
    background: var(--card);
    font-size: 14px;
    font-weight: bold;
    color: var(--sub);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  button.on {
    background: var(--blue);
    color: #fff;
  }
</style>
