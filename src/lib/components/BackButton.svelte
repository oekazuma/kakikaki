<script lang="ts">
  import { resolve } from '$app/paths';
  import Icon from './Icon.svelte';
  // onclick を渡すと遷移せずボタンになる（クイズ途中の確認など）
  let { onclick }: { onclick?: () => void } = $props();
</script>

{#if onclick}
  <button class="card back" {onclick}><Icon name="back" size={28} /> もどる</button>
{:else}
  <a class="card back" href={resolve('/')}><Icon name="back" size={28} /> もどる</a>
{/if}

<style>
  /* かくし演出（Bouncer）の覆い（z-index 59）より上に置き、演出中も戻れるようにする */
  .back {
    position: relative;
    z-index: 61;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 56px;
    padding: 0 22px 0 16px;
    border-radius: 28px;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    text-decoration: none;
    background: var(--blue);
    box-shadow: 0 3px 0 var(--dark);
    flex: none;
  }
  .back:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--dark);
  }
</style>
