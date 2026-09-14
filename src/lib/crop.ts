// 写真の切り抜き（AvatarCrop）の座標計算。窓は V×V px、画像は左上が (ox, oy)（0 以下）で表示倍率 zoom
export type CropState = { ox: number; oy: number; zoom: number };
// W, H は zoom 1 のときの表示サイズ（短辺が窓にぴったり）
export type CropGeom = { W: number; H: number; V: number; zoomMax: number };

// 画像が窓からはみ出さない範囲に収める（左上は 0 以下、右下は窓の端より外）
export const clampOffset = (v: number, size: number, V: number) => Math.min(0, Math.max(V - size, v));

export type Pt = { x: number; y: number };
// 拡大縮小。指の下 a にあった画像の点が、拡大後は t に来る（1 本指の拡大なら a = t）
export function zoomAt(s: CropState, z: number, a: Pt, t: Pt, g: CropGeom): CropState {
  z = Math.min(g.zoomMax, Math.max(1, z));
  const k = z / s.zoom;
  return {
    zoom: z,
    ox: clampOffset(t.x - (a.x - s.ox) * k, g.W * z, g.V),
    oy: clampOffset(t.y - (a.y - s.oy) * k, g.H * z, g.V)
  };
}

// 窓に見えている正方形を元画像のピクセル座標で返す（base は元画像 1px あたりの表示 px）
export function cropRect(s: CropState, base: number, V: number) {
  const k = base * s.zoom;
  return { sx: -s.ox / k, sy: -s.oy / k, size: V / k };
}
