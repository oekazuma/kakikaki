<script lang="ts">
  // 長い一覧の右端に固定する飛び先バー。見出しの id へのアンカーだけで動く。
  // 上に固定すると iPad のステータスバーのぼかしに重なって読めなくなるので右端に縦に並べる
  let { items, label }: { items: { id: string; label: string; image?: string }[]; label: string } = $props();
</script>

<nav class="card jump" aria-label={label}>
  {#each items as it (it.id)}
    <a href="#{it.id}" aria-label={it.label}>
      {#if it.image}<img src={it.image} alt={it.label} width="32" height="32" loading="lazy" />{:else}{it.label}{/if}
    </a>
  {/each}
</nav>

<style>
  .jump {
    position: fixed;
    right: calc(env(safe-area-inset-right, 0px) + 10px);
    top: 50%;
    translate: 0 -50%;
    z-index: 1;
    display: grid;
    gap: 6px;
    padding: 6px;
  }
  a {
    width: 44px;
    height: 44px;
    display: grid;
    place-content: center;
    border-radius: 50%;
    font-size: 22px;
    font-weight: bold;
    text-decoration: none;
    color: var(--blue);
    background: #f3f5f8;
  }
  img {
    display: block;
  }
</style>
