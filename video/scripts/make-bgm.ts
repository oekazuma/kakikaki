// BGM を合成して src/bgm.wav に書く（外部の音源を使わない。アプリの効果音と同じくオシレータ + 減衰だけ）
// 108 BPM、C ペンタトニックのオルゴール風メロディ + ベース + アルペジオ + かすかなハイハット。8 小節を 3 回
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const BPM = 108;
const STEP = 60 / BPM / 4; // 16 分音符の長さ（秒）
const BARS = 8;
const LOOPS = 3;
const total = Math.ceil(BARS * 16 * LOOPS * STEP + 1) * SR;
const buf = new Float32Array(total);
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

type Voice = (t: number, w: number) => number;
const music = (t: number, w: number) => Math.sin(w * t) + 0.35 * Math.sin(2 * w * t) + 0.12 * Math.sin(4 * w * t);
const bass = (t: number, w: number) => Math.sin(w * t) + 0.25 * Math.sin(2 * w * t);
const pluck = (t: number, w: number) => Math.sin(w * t);

function note(voice: Voice, midi: number, at: number, len: number, decay: number, gain: number) {
  const w = 2 * Math.PI * hz(midi);
  const start = Math.round(at * SR);
  const n = Math.round((len + 0.25) * SR);
  for (let i = 0; i < n && start + i < total; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.004);
    const rel = t > len ? Math.max(0, 1 - (t - len) / 0.25) : 1;
    buf[start + i] += voice(t, w) * Math.exp(-t / decay) * att * rel * gain;
  }
}
let seed = 1;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
function hat(at: number, gain: number) {
  const start = Math.round(at * SR);
  const n = Math.round(0.05 * SR);
  for (let i = 0; i < n && start + i < total; i++) buf[start + i] += rnd() * Math.exp(-i / SR / 0.012) * gain;
}

// [16 分の位置, MIDI, 長さ（16 分の数）]
const C5 = 72,
  D5 = 74,
  E5 = 76,
  G5 = 79,
  A5 = 81,
  C6 = 84,
  A4 = 69;
const MELODY: [number, number, number][][] = [
  [
    [0, E5, 2],
    [2, G5, 2],
    [4, A5, 4],
    [8, G5, 2],
    [10, E5, 2],
    [12, D5, 4]
  ],
  [
    [0, C5, 2],
    [2, D5, 2],
    [4, E5, 4],
    [8, A4, 2],
    [10, C5, 2],
    [12, D5, 4]
  ],
  [
    [0, A5, 2],
    [2, G5, 2],
    [4, E5, 4],
    [8, D5, 2],
    [10, E5, 2],
    [12, G5, 4]
  ],
  [
    [0, D5, 2],
    [2, E5, 2],
    [4, G5, 6],
    [12, A5, 2],
    [14, C6, 2]
  ],
  [
    [0, C6, 2],
    [2, A5, 2],
    [4, G5, 4],
    [8, E5, 2],
    [10, G5, 2],
    [12, A5, 4]
  ],
  [
    [0, G5, 2],
    [2, E5, 2],
    [4, D5, 4],
    [8, C5, 2],
    [10, D5, 2],
    [12, E5, 4]
  ],
  [
    [0, A5, 2],
    [2, C6, 2],
    [4, A5, 4],
    [8, G5, 2],
    [10, E5, 2],
    [12, D5, 4]
  ],
  [
    [0, E5, 2],
    [2, D5, 2],
    [4, C5, 10]
  ]
];
// 小節ごとのコード: C / Am / F / G
const CHORDS = [
  [60, 64, 67, 72],
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [55, 59, 62, 67]
];
const ROOTS = [48, 45, 41, 43];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];

for (let loop = 0; loop < LOOPS; loop++) {
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = (loop * BARS + bar) * 16 * STEP;
    const chord = CHORDS[bar % 4];
    for (const [s, m, l] of MELODY[bar]) note(music, m, t0 + s * STEP, l * STEP, 0.45, 0.5);
    note(bass, ROOTS[bar % 4], t0, 6 * STEP, 0.6, 0.45);
    note(bass, ROOTS[bar % 4], t0 + 8 * STEP, 6 * STEP, 0.6, 0.4);
    ARP.forEach((k, i) => note(pluck, chord[k], t0 + i * 2 * STEP, 1.5 * STEP, 0.2, 0.2));
    for (const s of [2, 6, 10, 14]) hat(t0 + s * STEP, 0.05);
  }
}
// 最後は C の和音を伸ばして締める
const end = BARS * 16 * LOOPS * STEP;
for (const m of [48, 60, 64, 67, 72]) note(m < 60 ? bass : music, m, end - 6 * STEP, 8 * STEP, 0.9, 0.35);

let peak = 0;
for (const v of buf) peak = Math.max(peak, Math.abs(v));
const pcm = new Int16Array(total);
for (let i = 0; i < total; i++) pcm[i] = Math.round((buf[i] / peak) * 0.75 * 32767);

const bytes = new Uint8Array(44 + pcm.length * 2);
const dv = new DataView(bytes.buffer);
const str = (o: number, s: string) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
str(0, 'RIFF');
dv.setUint32(4, 36 + pcm.length * 2, true);
str(8, 'WAVE');
str(12, 'fmt ');
dv.setUint32(16, 16, true);
dv.setUint16(20, 1, true);
dv.setUint16(22, 1, true);
dv.setUint32(24, SR, true);
dv.setUint32(28, SR * 2, true);
dv.setUint16(32, 2, true);
dv.setUint16(34, 16, true);
str(36, 'data');
dv.setUint32(40, pcm.length * 2, true);
bytes.set(new Uint8Array(pcm.buffer), 44);
const out = fileURLToPath(new URL('../src/bgm.wav', import.meta.url));
writeFileSync(out, bytes);
console.log(`${out} (${(total / SR).toFixed(1)}s)`);
