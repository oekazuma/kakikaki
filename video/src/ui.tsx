import type { CSSProperties, ReactNode } from 'react';
import { Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { toKatakana } from '../../src/lib/chars';
import { pathToPoints, type Pt } from '../../src/lib/geometry';
import type { Word } from '../../src/lib/words';
import { C, CONFETTI, KYOKASHO, SPARK, THEME, type Lang } from './theme';

const ICONS = {
  speaker: 'M4 9h4l5-4v14l-5-4H4zM16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12',
  redo: 'M4 11a8 8 0 1 1 2.3 5.7M4 4v7h7',
  back: 'M19 12H5M11 6l-6 6 6 6',
  trace: 'M6 18a1.5 1.5 0 1 0 .01 0M18 6a1.5 1.5 0 1 0 .01 0M7.5 16.5C13 15 11 9 16.5 7.5',
  pencil: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 14v4M8 20h8',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.5h6c0-1.2.4-1.9 1-2.5A6 6 0 0 0 12 3z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v3',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 19h14',
  plus: 'M12 5v14M5 12h14',
  check: 'M4 12.5l5 5L20 6'
};
export const Icon = ({
  name,
  size = 24,
  fill = false
}: {
  name: keyof typeof ICONS;
  size?: number;
  fill?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={fill ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={fill ? 1.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={ICONS[name]} />
  </svg>
);

// 単語カードの補助行（ひらがな表示のとき: カタカナと英語）
export const subs = (w: Word) => [toKatakana(w.name), w.en.charAt(0).toUpperCase() + w.en.slice(1)];

export const card: CSSProperties = { background: '#fff', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)' };

// 単語カード（WordCard.svelte）。size は幅、文字はそれに比例
export const Card = ({
  id,
  name,
  sub = [],
  size = 180,
  star = false,
  style
}: {
  id: string;
  name: string;
  sub?: string[];
  size?: number;
  star?: boolean;
  style?: CSSProperties;
}) => (
  <div
    style={{
      ...card,
      position: 'relative',
      width: size,
      padding: `${size * 0.08}px ${size * 0.055}px ${size * 0.065}px`,
      display: 'grid',
      justifyItems: 'center',
      gap: size * 0.02,
      ...style
    }}
  >
    {star && (
      <span
        style={{
          position: 'absolute',
          top: size * 0.045,
          right: size * 0.045,
          width: size * 0.17,
          height: size * 0.17,
          borderRadius: '50%',
          background: C.star,
          color: '#fff',
          display: 'grid',
          placeContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,.15)'
        }}
      >
        <Icon name="star" size={size * 0.1} fill />
      </span>
    )}
    <Img src={staticFile(`img/${id}.svg`)} style={{ width: size - 20, height: size * 0.6, objectFit: 'contain' }} />
    <span style={{ fontFamily: KYOKASHO, fontSize: size * 0.11, fontWeight: 700, lineHeight: 1.3 }}>{name}</span>
    {sub.map((s) => (
      <span key={s} style={{ fontSize: size * 0.067, color: C.sub, lineHeight: 1.3 }}>
        {s}
      </span>
    ))}
  </div>
);

export const Stars = ({ n, k, size = 22 }: { n: number; k: number; size?: number }) => (
  <span style={{ fontSize: size, letterSpacing: 1 }}>
    {Array.from({ length: n }, (_, i) => (
      <span key={i} style={{ color: i < k ? C.star : '#d8dde2' }}>
        ★
      </span>
    ))}
  </span>
);

// 手書き風: お手本の点列を少し波打たせる
export const wobble = (d: string, seed: number): Pt[] =>
  pathToPoints(d, 1.5).map((p, i) => ({
    x: p.x + Math.sin(i * 0.18 + seed) * 1.1,
    y: p.y + Math.cos(i * 0.15 + seed * 1.7) * 1.1
  }));
const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export type Mode = 'trace' | 'free' | 'test';
// 書き取り面（Board.svelte）。ink は「書き終えた画数 + いまの画の進み（0〜1）」、demo は黄色い見本の進み
export const Board = ({
  strokes,
  ink,
  demo = 0,
  mode,
  lang = 'ja',
  size
}: {
  strokes: string[];
  ink: number;
  demo?: number;
  mode: Mode;
  lang?: Lang;
  size: number;
}) => {
  const t = THEME[lang];
  const n = strokes.length;
  const si = Math.min(Math.floor(ink), n - 1);
  const frac = ink >= n ? 1 : ink - si;
  const finished = ink >= n;
  const hand = mode !== 'trace';
  const cur = hand ? wobble(strokes[si], si) : pathToPoints(strokes[si], 1.5);
  const tip = cur[Math.min(cur.length - 1, Math.floor(frac * (cur.length - 1)))];
  return (
    <svg viewBox="0 0 109 109" width={size} height={size} style={{ display: 'block' }}>
      <line x1="54.5" y1="2" x2="54.5" y2="107" stroke={C.grid} strokeWidth="0.6" strokeDasharray="2 2" />
      <line x1="2" y1="54.5" x2="107" y2="54.5" stroke={C.grid} strokeWidth="0.6" strokeDasharray="2 2" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {mode !== 'test' &&
          strokes.map((d, i) => (
            <g key={d}>
              <path d={d} stroke={C.guide} strokeWidth="14" />
              {i > si && <path d={d} stroke="#b9c3cc" strokeWidth="1.2" strokeDasharray="3 2.5" />}
            </g>
          ))}
        {strokes.map((d, i) =>
          i < si || (i === si && finished) ? (
            hand ? (
              <polyline key={d} points={poly(wobble(d, i))} stroke={t.blue} strokeWidth="10" />
            ) : (
              <path key={d} d={d} stroke={t.blue} strokeWidth="10" />
            )
          ) : null
        )}
        {!finished && frac > 0 && !hand && (
          <path
            d={strokes[si]}
            stroke={t.blue}
            strokeWidth="14"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - frac}
          />
        )}
        {!finished && frac > 0 && hand && (
          <polyline points={poly(cur.slice(0, Math.ceil(frac * cur.length)))} stroke={t.blue} strokeWidth="14" />
        )}
        {!finished && demo > 0 && (
          <path
            d={strokes[si]}
            stroke={C.star}
            strokeWidth="5"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - Math.min(demo, 1)}
          />
        )}
      </g>
      {mode !== 'test' && !finished && frac === 0 && (
        <>
          <circle cx={cur[0].x} cy={cur[0].y} r="6.5" fill={t.blue} />
          <text
            x={cur[0].x}
            y={cur[0].y}
            fill="#fff"
            fontSize="7"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {si + 1}
          </text>
        </>
      )}
      {!finished && frac > 0 && frac < 1 && (
        <circle cx={tip.x} cy={tip.y} r="7" fill={t.blue} opacity="0.35" stroke="#fff" strokeWidth="1" />
      )}
    </svg>
  );
};

// ばねで飛び出す（Svelte 側の pop / fly の代わり）
export const Pop = ({
  at,
  children,
  style,
  from = 0
}: {
  at: number;
  children: ReactNode;
  style?: CSSProperties;
  from?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 160 } });
  return (
    <div style={{ opacity: frame < at ? 0 : 1, scale: `${s}`, translate: `0px ${(1 - s) * from}px`, ...style }}>
      {children}
    </div>
  );
};

// 画を書き終えたときのキラキラ（fx.ts の burst）
export const Burst = ({ x, y, at, n = 14 }: { x: number; y: number; at: number; n?: number }) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 30;
  if (t < 0 || t > 0.6) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`ba${at}${i}`) * Math.PI * 2;
        const s = 60 + random(`bs${at}${i}`) * 140;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(a) * s * t * 1.6,
              top: y + (Math.sin(a) * s - 40) * t * 1.6 + 100 * t * t * 1.6,
              width: 4 + random(`bz${i}`) * 5,
              height: 4 + random(`bz${i}`) * 5,
              borderRadius: '50%',
              background: SPARK[i % SPARK.length],
              opacity: 1 - t / 0.6
            }}
          />
        );
      })}
    </>
  );
};

// 紙吹雪（fx.ts の confetti）。GIF の圧縮が効くよう枚数は控えめ
export const Confetti = ({ at, n = 36 }: { at: number; n?: number }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = (frame - at) / 30;
  if (t < 0 || t > 2.4) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const vy = 160 + random(`cy${i}`) * 200;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: random(`cx${i}`) * width + Math.sin(t * 3 + i) * 30,
              top: -14 + vy * t + 120 * t * t,
              width: 10,
              height: 14,
              borderRadius: 3,
              background: CONFETTI[i % CONFETTI.length],
              rotate: `${(random(`cr${i}`) - 0.5) * 720 * t}deg`,
              opacity: interpolate(t, [1.6, 2.4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            }}
          />
        );
      })}
    </>
  );
};
