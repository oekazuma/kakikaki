type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  g: number;
  spin: number;
};

const STAR = ['#f5b400', '#ffd766', '#7fd8ff', '#fff'];
const CONFETTI = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd8'];

// 全画面 canvas は 1 枚だけ（+layout.svelte が mount する）
let canvas: HTMLCanvasElement | null = null;
let ps: P[] = [];
let raf = 0;

function mount(c: HTMLCanvasElement) {
  canvas = c;
  const fit = () => {
    c.width = innerWidth * devicePixelRatio;
    c.height = innerHeight * devicePixelRatio;
  };
  fit();
  addEventListener('resize', fit);
}

function burst(x: number, y: number, n = 14, colors = STAR) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 60 + Math.random() * 140;
    ps.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 40,
      life: 0,
      max: 0.6,
      color: colors[i % colors.length],
      size: 3 + Math.random() * 4,
      g: 200,
      spin: 0
    });
  }
  run();
}

function confetti(n = 120) {
  for (let i = 0; i < n; i++) {
    ps.push({
      x: Math.random() * innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 120,
      vy: 100 + Math.random() * 200,
      life: 0,
      max: 1.6 + Math.random(),
      color: CONFETTI[i % CONFETTI.length],
      size: 6 + Math.random() * 6,
      g: 60,
      spin: (Math.random() - 0.5) * 10
    });
  }
  run();
}

function run() {
  if (raf || !canvas) return;
  let prev = performance.now();
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const ctx = canvas!.getContext('2d')!;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps = ps.filter((p) => (p.life += dt) < p.max);
    for (const p of ps) {
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin * p.life);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.spin ? 0.6 : 1));
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    raf = ps.length ? requestAnimationFrame(step) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  raf = requestAnimationFrame(step);
}

export const fx = { mount, burst, confetti };
