// Service Worker の判断のうち、過去に不具合を出した 2 つを純粋関数にしてテストできるようにする
// （service-worker.ts 自体は $service-worker に依存するので vitest から読めない）

// SvelteKit の更新検知（updated.check）が読む version.json は常にネットワークから。キャッシュすると新版に気づけない
export const bypass = (url: string) => new URL(url).pathname.endsWith('/_app/version.json');

// 取りに行った応答をキャッシュに入れてよいか: 成功した同一オリジンのものだけ（opaque な他オリジンは status 0 で ok が false）
export const cacheable = (res: { ok: boolean }, url: string, origin: string) =>
  res.ok && new URL(url).origin === origin;
