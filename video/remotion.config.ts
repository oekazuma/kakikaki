import { Config } from '@remotion/cli/config';

// イラスト・ロゴ・フォントは PWA の static/ をそのまま使う（複製しない）
Config.setPublicDir('../static');
Config.setRspack(true);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
