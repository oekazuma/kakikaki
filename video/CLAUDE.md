# video

`video/` は README の紹介動画（`docs/intro.gif`）を作る Remotion プロジェクトで、本体とは別の pnpm プロジェクト（`cd video && pnpm install`）。`pnpm dev` で Studio、`pnpm render` で MP4（`video/out/`、コミットしない）を描画し、ffmpeg で `docs/intro.gif` に変換する（GitHub の README はリポジトリ内の動画を埋め込めないので GIF だけを使う）。BGM は `video/scripts/make-bgm.ts` がオシレータで合成して `src/bgm.wav`（生成物、コミットしない）に書き、`dev` / `render` の前に自動で作る。イラスト・ロゴ・Klee One は `static/` を `publicDir` として直接参照し、書き順と単語は `src/lib/` を import するので複製しない。UI の丸ゴシックは Mac のシステムフォント（Hiragino Maru Gothic ProN）に頼るため、Linux で描画すると字面が変わる。`video/` を触ったら `pnpm check:video` で型を確認する。
