import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// かくしゲームはどこからもリンクされないので、この 1 行が消えると GitHub Pages で 404 になる
describe('vite.config.ts', () => {
  it('/balloon をプリレンダー対象に明示している', () => {
    const src = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(src).toMatch(/entries:\s*\[[^\]]*'\/balloon'/);
  });
});
