// アバターの候補（static/img/<id>.svg）。人は Twemoji の顔（person-*）、ほかは単語のイラストを流用する
export const AVATARS = [
  'person-boy',
  'person-girl',
  'person-man',
  'person-woman',
  'person-grandpa',
  'person-grandma',
  'cat',
  'dog',
  'rabbit',
  'bear',
  'panda',
  'koala',
  'frog',
  'pig',
  'tiger',
  'fox',
  'lion',
  'monkey',
  'hamster',
  'penguin',
  'owl',
  'robot',
  'rocket',
  'star',
  'sunflower'
] as const;
const AVATAR_PX = 160;

// 選んだ画像ファイルを <img> として読み込む（切り抜き画面で使う）
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((ok, ng) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      ng(new Error('image'));
    };
    img.src = url;
  });
}

// 写真は端末内にだけ保存する。localStorage の上限（Safari は約 5MB）に収まるよう、選んだ正方形を小さな JPEG にする
export function cropAvatar(img: HTMLImageElement, sx: number, sy: number, s: number): string {
  const c = document.createElement('canvas');
  c.width = c.height = AVATAR_PX;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; // JPEG は透過できないので白で埋める
  g.fillRect(0, 0, AVATAR_PX, AVATAR_PX);
  g.drawImage(img, sx, sy, s, s, 0, 0, AVATAR_PX, AVATAR_PX);
  return c.toDataURL('image/jpeg', 0.85);
}
