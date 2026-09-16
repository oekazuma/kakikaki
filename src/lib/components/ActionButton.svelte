<script lang="ts">
  import Icon from './Icon.svelte';
  // 練習・かきクイズの右側に並ぶ大きなボタン。できた（check）は大きく目立たせ、active は読み上げ中の点灯。
  // disabled はそのモードで使えないボタン。モードが変わってもボタンの位置がずれないよう、消さずに薄く残す
  let {
    icon,
    label,
    onclick,
    ready = false,
    active = false,
    disabled = false
  }: {
    icon: 'speaker' | 'refresh' | 'undo' | 'check' | 'eye';
    label: string;
    onclick: () => void;
    ready?: boolean;
    active?: boolean;
    disabled?: boolean;
  } = $props();
  const done = $derived(icon === 'check');
</script>

<button class={['rb', { done, ready, active }]} {onclick} {disabled}>
  <span class="card ic"><Icon name={icon} size={done ? 36 : 32} /></span>{label}
</button>

<style>
  .rb {
    display: grid;
    justify-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: bold;
    color: var(--sub);
  }
  .rb:disabled {
    opacity: 0.3;
  }
  .ic {
    width: 68px;
    height: 68px;
    display: grid;
    place-content: center;
    color: var(--blue);
    transition:
      transform 0.1s,
      background-color 0.2s,
      color 0.2s;
  }
  /* 押したことが分かるように沈める */
  .rb:active .ic {
    transform: scale(0.9);
    background: #dfe7f0;
  }
  /* 読み上げ中は点灯 */
  .active .ic {
    background: var(--blue);
    color: #fff;
    animation: glow 1s ease-in-out infinite;
  }
  .active {
    color: var(--blue);
  }
  .done .ic {
    background: var(--teal);
    width: 76px;
    height: 76px;
    color: #fff;
  }
  .done:active .ic {
    background: #0f5f58;
  }
  .done {
    color: var(--teal);
  }
  .done.ready .ic {
    animation: ready 1s ease-in-out infinite;
    box-shadow: 0 0 0 6px rgba(19, 120, 111, 0.25);
  }
  @keyframes glow {
    50% {
      box-shadow: 0 0 0 8px rgba(79, 124, 174, 0.25);
    }
  }
  @keyframes ready {
    50% {
      transform: scale(1.12);
    }
  }
</style>
