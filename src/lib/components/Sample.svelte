<script lang="ts">
  // おてほんなし のとき、左側に書く文字を見せる（フォントはお手本と同じ教科書体）
  let { char, strokes }: { char: string; strokes: number } = $props();
</script>

<div class="card sample">
  <small>この もじを かこう</small>
  <b class="kyokasho">{char}</b>
  <small class="n">{strokes} かく</small>
</div>

<style>
  .sample {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 10px 12px 12px;
    border: 3px solid var(--star);
    background: #fffbea;
  }
  small {
    font-size: 13px;
    font-weight: bold;
    color: var(--sub);
  }
  b {
    font-size: 88px;
    line-height: 1.1;
    color: var(--ink);
  }
  .n {
    color: #e08a00;
  }
</style>
