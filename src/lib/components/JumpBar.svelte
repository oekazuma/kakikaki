<script lang="ts">
  // 長い一覧の右端に固定する飛び先バー。見出しの id へのアンカーだけで動く。
  // 上に固定すると iPad のステータスバーのぼかしに重なって読めなくなるので右端に縦に並べる
  let { items, label }: { items: { id: string; label: string; image?: string }[]; label: string } = $props();
  // いま見ている段（画面の上から 4 割より上にある最後の見出し）に色のリングを付ける
  let active = $state('');
  $effect(() => {
    const update = () => {
      const y = innerHeight * 0.4;
      let cur = items[0]?.id ?? '';
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= y) cur = it.id;
      }
      active = cur;
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  });
</script>

<nav class="card jump" aria-label={label}>
  {#each items as it (it.id)}
    <a href="#{it.id}" aria-label={it.label} class={{ active: it.id === active }}>
      {#if it.image}<img src={it.image} alt={it.label} width="32" height="32" loading="lazy" />{:else}{it.label}{/if}
    </a>
  {/each}
</nav>

<style>
  .jump {
    position: fixed;
    right: calc(env(safe-area-inset-right, 0px) + 10px);
    /* 見出しの段より下の帯の中で上下中央に置く。画面の中央に置くと、高さの低い iPad mini ではバーが見出しの段まで伸びて右上の ? ボタンに重なる */
    top: calc(var(--sat) + 88px);
    bottom: calc(var(--sab) + 12px);
    height: fit-content;
    margin-block: auto;
    /* 帯より高いと上下の margin が負になって見出しの段へはみ出すので、帯に収めて中をスクロールさせる */
    max-height: calc(100dvh - var(--sat) - var(--sab) - 100px);
    overflow-y: auto;
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
  a.active {
    box-shadow: 0 0 0 3px var(--blue);
  }
  img {
    display: block;
  }
</style>
