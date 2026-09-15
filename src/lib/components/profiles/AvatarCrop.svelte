<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from '../Icon.svelte';
  import { cropAvatar } from '$lib/avatar';
  import { clampOffset, zoomAt, cropRect, type CropState } from '$lib/crop';
  import { dist, type Pt } from '$lib/geometry';
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
  const ZOOM_MAX = 4;
  const geom = untrack(() => ({ W: img.naturalWidth * base, H: img.naturalHeight * base, V, zoomMax: ZOOM_MAX }));
  // 指の下 a にあった写真の点が t に来るように拡大縮小する
  const apply = (from: CropState, z: number, a: Pt, t: Pt) => ({ ox, oy, zoom } = zoomAt(from, z, a, t, geom));
  const setZoom = (z: number, cx: number, cy: number) => apply({ ox, oy, zoom }, z, { x: cx, y: cy }, { x: cx, y: cy });

  // 指の位置。1 本なら移動、2 本ならピンチで拡大縮小（iPad）。描画には使わないので反応性は不要
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const pts = new Map<number, Pt>();
  let drag: { x: number; y: number; ox: number; oy: number } | null = null;
  let pinch: { d: number; zoom: number; mx: number; my: number; ox: number; oy: number } | null = null;
  const two = () => [...pts.values()] as [Pt, Pt];
  const span = () => dist(...two());
  const mid = () => {
    const [a, b] = two();
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  function down(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    if (pts.size === 2) {
      drag = null;
      const m = mid();
      pinch = { d: span(), zoom, mx: m.x, my: m.y, ox, oy };
    } else if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, ox, oy };
  }
  function move(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    if (pinch && pts.size >= 2) {
      apply(
        { ox: pinch.ox, oy: pinch.oy, zoom: pinch.zoom },
        (pinch.zoom * span()) / pinch.d,
        { x: pinch.mx, y: pinch.my },
        mid()
      );
    } else if (drag) {
      ox = clampOffset(drag.ox + e.clientX - drag.x, w, V);
      oy = clampOffset(drag.oy + e.clientY - drag.y, h, V);
    }
  }
  function up(e: PointerEvent) {
    pts.delete(e.pointerId);
    pinch = null;
    drag = null;
    if (pts.size === 1) {
      const [p] = [...pts.values()];
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      drag = { x: p.x + r.left, y: p.y + r.top, ox, oy };
    }
  }
  function pick() {
    const r = cropRect({ ox, oy, zoom }, base, V);
    onpick(cropAvatar(img, r.sx, r.sy, r.size));
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
    onpointerup={up}
    onpointercancel={up}
  >
    <img
      src={img.src}
      alt=""
      width={img.naturalWidth}
      height={img.naturalHeight}
      style:width="{w}px"
      style:height="{h}px"
      style:transform="translate({ox}px, {oy}px)"
      draggable="false"
    />
    <span class="ring"></span>
  </div>
  <div class="side">
    <p>ゆびで うごかして、まるの なかに かおを いれてね（2 ほんの ゆびで おおきく できるよ）</p>
    <label
      >おおきさ <input
        type="range"
        min="1"
        max={ZOOM_MAX}
        step="0.01"
        value={zoom}
        oninput={(e) => setZoom(Number(e.currentTarget.value), V / 2, V / 2)}
      /></label
    >
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
    background: var(--pill);
    color: var(--sub);
  }
  .ok {
    background: var(--teal);
    color: #fff;
  }
</style>
