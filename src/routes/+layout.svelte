<script lang="ts">
  import { fx } from '$lib/fx';
  import Icon from '$lib/components/Icon.svelte';
  import { lang } from '$lib/lang.svelte';
  let { children } = $props();
  $effect(() => {
    document.documentElement.dataset.lang = lang.v;
  });
</script>

<canvas class="fx" {@attach (c) => fx.mount(c)}></canvas>
{@render children()}
<div class="portrait card">
  <div class="icon"><Icon name="rotate" size={80} /></div>
  <p>iPad を よこに してね</p>
</div>

<style>
  .fx {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 50;
  }
  .portrait {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    place-content: center;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    background: var(--bg);
  }
  .icon {
    color: var(--blue);
  }
  @media (orientation: portrait) {
    .portrait {
      display: grid;
    }
  }
</style>
