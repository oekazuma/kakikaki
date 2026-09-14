<script lang="ts">
  // おてほんなし のとき、盤面の右上に書く文字と画数を重ねて見せる（左カラムを伸ばさない。フォントはお手本と同じ教科書体）
  let { char, strokes }: { char: string; strokes: number } = $props();
</script>

<div class="card sample">
  <small>おてほん</small>
  <b class="kyokasho">{char}</b>
  <small class="n">{strokes} かく</small>
</div>

<style>
  .sample {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 1;
    display: grid;
    justify-items: center;
    gap: 0;
    padding: 6px 14px 8px;
    border: 3px solid var(--star);
    background: #fffbea;
    min-width: 92px;
  }
  small {
    font-size: 12px;
    font-weight: bold;
    color: var(--sub);
  }
  b {
    font-size: 60px;
    line-height: 1.1;
    color: var(--ink);
  }
  .n {
    color: #e08a00;
  }
</style>
