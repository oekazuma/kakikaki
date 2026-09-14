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
  const ZOOM_MAX = 4;
  // (cx, cy) の下にある写真の点を動かさずに拡大縮小する
  function setZoom(z: number, cx: number, cy: number) {
    z = Math.min(ZOOM_MAX, Math.max(1, z));
    const k = z / zoom;
    zoom = z;
    ox = clamp(cx - (cx - ox) * k, w);
    oy = clamp(cy - (cy - oy) * k, h);
  }

  // 指の位置。1 本なら移動、2 本ならピンチで拡大縮小（iPad）。描画には使わないので反応性は不要
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const pts = new Map<number, { x: number; y: number }>();
  let drag: { x: number; y: number; ox: number; oy: number } | null = null;
  let pinch: { d: number; zoom: number; mx: number; my: number; ox: number; oy: number } | null = null;
  const dist = () => {
    const [a, b] = [...pts.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const mid = () => {
    const [a, b] = [...pts.values()];
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
      pinch = { d: dist(), zoom, mx: m.x, my: m.y, ox, oy };
    } else if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, ox, oy };
  }
  function move(e: PointerEvent) {
    if (!pts.has(e.pointerId)) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    if (pinch && pts.size >= 2) {
      const z = Math.min(ZOOM_MAX, Math.max(1, (pinch.zoom * dist()) / pinch.d));
      const k = z / pinch.zoom;
      const m = mid();
      zoom = z;
      ox = clamp(m.x - (pinch.mx - pinch.ox) * k, w);
      oy = clamp(m.y - (pinch.my - pinch.oy) * k, h);
    } else if (drag) {
      ox = clamp(drag.ox + e.clientX - drag.x, w);
      oy = clamp(drag.oy + e.clientY - drag.y, h);
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
    onpointerup={up}
    onpointercancel={up}
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
    background: #eef1f4;
    color: var(--sub);
  }
  .ok {
    background: var(--teal);
    color: #fff;
  }
</style>
