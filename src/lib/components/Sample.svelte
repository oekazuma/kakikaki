<script lang="ts">
  // おてほんなし のとき、盤面の左上に画数を出す。字は隠し、右の「みる」を押したときだけ見せる
  // （右上に置くと右手で隠れる。フォントはお手本と同じ教科書体）
  let { char, strokes, show }: { char: string; strokes: number; show: boolean } = $props();
</script>

<div class={['card', 'sample', { show }]}>
  <b class="kyokasho">{show ? char : '？'}</b>
  <small class="n">{strokes} かく</small>
</div>

<style>
  .sample {
    position: absolute;
    top: 10px;
    left: 14px;
    z-index: 1;
    display: grid;
    justify-items: center;
    gap: 0;
    padding: 4px 14px 8px;
    border: 3px solid var(--guide);
    min-width: 92px;
    transition: border-color 0.2s;
  }
  .sample.show {
    border-color: var(--star);
    background: #fffbea;
  }
  b {
    font-size: 60px;
    line-height: 1.1;
    color: var(--sub);
  }
  .show b {
    color: var(--ink);
  }
  .n {
    font-size: 12px;
    font-weight: bold;
    color: var(--warn);
  }
</style>
