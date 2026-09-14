import { describe, it, expect, vi, beforeEach } from 'vitest';

type Listener = (e?: unknown) => void;
class Emitter {
  private m = new Map<string, Listener[]>();
  addEventListener(t: string, f: Listener) {
    this.m.set(t, [...(this.m.get(t) ?? []), f]);
  }
  emit(t: string) {
    for (const f of this.m.get(t) ?? []) f();
  }
}
function fake(controller: object | null) {
  const worker = Object.assign(new Emitter(), { state: 'installing' });
  const reg = Object.assign(new Emitter(), {
    waiting: null,
    installing: worker,
    update: vi.fn(() => Promise.resolve())
  });
  const container = Object.assign(new Emitter(), { controller, getRegistration: () => Promise.resolve(reg) });
  return { worker, reg, container };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('update', () => {
  beforeEach(() => vi.resetModules());

  it('既存の controller があるときに新しい SW が installed になったら ready', async () => {
    const m = await import('./update.svelte');
    const f = fake({});
    m.watchUpdates(f.container as unknown as ServiceWorkerContainer);
    await tick();
    expect(m.update.ready).toBe(false);
    expect(f.reg.update).toHaveBeenCalledOnce(); // 起動時に確認
    f.reg.emit('updatefound');
    f.worker.state = 'installed';
    f.worker.emit('statechange');
    expect(m.update.ready).toBe(true);
  });

  it('初回インストール（controller なし）は installed も controllerchange も更新扱いしない', async () => {
    const m = await import('./update.svelte');
    const f = fake(null);
    m.watchUpdates(f.container as unknown as ServiceWorkerContainer);
    await tick();
    f.reg.emit('updatefound');
    f.worker.state = 'activated';
    f.worker.emit('statechange');
    f.container.emit('controllerchange');
    expect(m.update.ready).toBe(false);
  });

  it('制御中のページで controllerchange が来たら ready', async () => {
    const m = await import('./update.svelte');
    const f = fake({});
    m.watchUpdates(f.container as unknown as ServiceWorkerContainer);
    await tick();
    f.container.emit('controllerchange');
    expect(m.update.ready).toBe(true);
  });
});
