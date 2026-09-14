// アバターの候補は単語のイラスト（static/img/<id>.svg）を流用する。顔が円に収まるものだけ
export const AVATARS = [
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
export const AVATAR_PX = 160;

// 写真は端末内にだけ保存する。localStorage の上限（Safari は約 5MB）に収まるよう小さな正方形の JPEG にする
export function fileToAvatar(file: File): Promise<string> {
  return new Promise((ok, ng) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement('canvas');
      c.width = c.height = AVATAR_PX;
      const g = c.getContext('2d')!;
      g.fillStyle = '#fff'; // JPEG は透過できないので白で埋める
      g.fillRect(0, 0, AVATAR_PX, AVATAR_PX);
      const s = Math.min(img.width, img.height);
      g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, AVATAR_PX, AVATAR_PX);
      ok(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      ng(new Error('image'));
    };
    img.src = url;
  });
}
