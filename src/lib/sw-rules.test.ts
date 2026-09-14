import { describe, it, expect } from 'vitest';
import { bypass, cacheable } from './sw-rules';

describe('Service Worker の判断', () => {
  it('version.json だけ素通しする', () => {
    expect(bypass('https://oekazuma.github.io/kakikaki/_app/version.json')).toBe(true);
    expect(bypass('https://oekazuma.github.io/kakikaki/_app/immutable/x.js')).toBe(false);
    expect(bypass('https://oekazuma.github.io/kakikaki/practice?w=bus')).toBe(false);
  });
  it('成功した同一オリジンの応答だけキャッシュする', () => {
    const origin = 'https://oekazuma.github.io';
    expect(cacheable({ ok: true }, `${origin}/kakikaki/img/dog.svg`, origin)).toBe(true);
    expect(cacheable({ ok: false }, `${origin}/kakikaki/img/nope.svg`, origin)).toBe(false);
    expect(cacheable({ ok: true }, 'https://cdn.example.com/x.svg', origin)).toBe(false);
  });
});
