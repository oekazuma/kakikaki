<script lang="ts">
  import { imageUrl } from '$lib/image';
  import { flipFor } from '$lib/facing';
  import type { Word } from '$lib/words';
  // 単語クリア時にイラストが画面下を走り抜ける
  let { word, onend }: { word: Word; onend: () => void } = $props();
</script>

<img
  class="drive"
  src={imageUrl(word)}
  alt=""
  width="280"
  height="200"
  loading="eager"
  style:scale={flipFor(word.id, 'right') ? '-1 1' : '1 1'}
  onerror={onend}
  onanimationend={onend}
/>

<style>
  .drive {
    position: fixed;
    bottom: 20px;
    left: -300px;
    height: 200px;
    z-index: 60;
    animation: drive 2s ease-in-out forwards;
    pointer-events: none;
  }
  @keyframes drive {
    to {
      left: 110vw;
    }
  }
</style>
