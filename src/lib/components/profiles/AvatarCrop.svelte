<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from '../Icon.svelte';
  import { cropAvatar } from '$lib/avatar';
  // 丸い窓の下で写真を指で動かし、スライダーで拡大して切り抜く
  let { img, onpick, oncancel }: { img: HTMLImageElement; onpick: (url: string) => void; oncancel: () => void } =
    $props();
  const V = 280; // 窓の大きさ（px）
  // 短辺が窓にぴったり。画像は開いたときのものを使う（親は差し替えない）
  const base = untrack(() => V / Math.min(img.naturalWidth, img.naturalHeight));
  let zoom = $state(1);
  // 画像左上の窓からのずれ（0 以下）。最初は写真の中央を窓に合わせる
  let ox = $state(untrack(() => Math.min(0, (V - img.naturalWidth * base) / 2)));
  let oy = $state(untrack(() => Math.min(0, (V - img.naturalHeight * base) / 2)));
  const w = $derived(img.naturalWidth * base * zoom);
  const h = $derived(img.naturalHeight * base * zoom);
  const clamp = (v: number, size: number) => Math.min(0, Math.max(V - size, v));
  // 初期位置と、拡大縮小したときは中心を保つ
  let prev = 1;
  $effect(() => {
    const k = zoom / prev;
    prev = zoom;
    ox = clamp((ox - V / 2) * k + V / 2, w);
    oy = clamp((oy - V / 2) * k + V / 2, h);
  });
  let drag: { x: number; y: number; ox: number; oy: number } | null = null;
  function down(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, ox, oy };
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    ox = clamp(drag.ox + e.clientX - drag.x, w);
    oy = clamp(drag.oy + e.clientY - drag.y, h);
  }
  function pick() {
    const k = base * zoom;
    onpick(cropAvatar(img, -ox / k, -oy / k, V / k));
  }
</script>

<div class="crop">
  <div
    class="win"
    role="img"
    aria-label="しゃしんの きりぬき"
    style:width="{V}px"
    style:height="{V}px"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={() => (drag = null)}
    onpointercancel={() => (drag = null)}
  >
    <img
      src={img.src}
      alt=""
      style:width="{w}px"
      style:height="{h}px"
      style:transform="translate({ox}px, {oy}px)"
      draggable="false"
    />
    <span class="ring"></span>
  </div>
  <div class="side">
    <p>ゆびで うごかして、まるの なかに かおを いれてね</p>
    <label>おおきさ <input type="range" min="1" max="4" step="0.01" bind:value={zoom} /></label>
    <div class="actions">
      <button class="cancel" onclick={oncancel}>やめる</button>
      <button class="ok" onclick={pick}><Icon name="check" size={22} /> きめる</button>
    </div>
  </div>
</div>

<style>
  .crop {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .win {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    background: #222;
    touch-action: none;
    cursor: grab;
    flex: none;
    -webkit-user-select: none;
    user-select: none;
  }
  .win img {
    position: absolute;
    left: 0;
    top: 0;
    max-width: none;
    pointer-events: none;
  }
  /* 丸の外を暗くして切り抜き範囲を見せる */
  .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 0 200px rgba(0, 0, 0, 0.55);
    pointer-events: none;
  }
  .side {
    display: grid;
    gap: 14px;
    flex: 1;
  }
  p {
    margin: 0;
    font-weight: bold;
    color: var(--sub);
  }
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
  }
  input[type='range'] {
    flex: 1;
    height: 32px;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  .actions button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    border-radius: 14px;
    font-weight: bold;
    font-size: 17px;
  }
  .cancel {
    background: #eef1f4;
    color: var(--sub);
  }
  .ok {
    background: var(--teal);
    color: #fff;
  }
</style>
