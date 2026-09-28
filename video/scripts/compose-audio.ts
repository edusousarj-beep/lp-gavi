/*
 * Compõe a trilha e os efeitos do anúncio, 100% por código, e grava
 * public/audio/trilha.wav (48 kHz, 16 bits, estéreo) + trilha.cues.json.
 *
 *   npm run audio
 *
 * Tudo é posicionado a partir de src/timeline.ts — a mesma fonte das cenas.
 * Mexeu na linha do tempo ou no texto digitado? Rode de novo.
 */
import fs from 'node:fs';
import path from 'node:path';
import {Biquad, Bus, compress, dbToGain, eq, freeverb, integratedLoudness, limit, pingPong, samples, SR, Svf, toWav} from './audio/dsp';
import * as I from './audio/instruments';
import * as X from './audio/sfx';
import {at, BEAT, DURATION, EVENTS, FPS, FREEZE, SCENES} from '../src/timeline';

const T = (frame: number) => frame / FPS; // quadro → segundos
const STEP = BEAT / 4 / FPS; // semicolcheia: 0,15 s
const LENGTH = DURATION / FPS; // 24 s
const TARGET_LUFS = -14; // referência usual de plataformas sociais
const CEILING_DB = -2; // pico real (dBTP); o AAC sobe ~0,5 dB, o MP4 fica abaixo de −1 dBTP

/* ------------------------------------------------------------- harmonia */

const CHORDS = {
  Am9: {bass: 33, notes: [60, 64, 67, 71]},
  Fmaj9: {bass: 29, notes: [57, 60, 64, 67]},
  Cmaj7: {bass: 36, notes: [59, 62, 64, 67]},
  G6: {bass: 31, notes: [59, 62, 64, 69]},
  Cmaj9: {bass: 36, notes: [60, 64, 67, 71, 74]},
} as const;
type ChordName = keyof typeof CHORDS;

type Pattern = {
  kick: number[];
  clap: number[];
  hat: number[];
  openHat: number[];
  ghost: number[];
  stab: [number, number][]; // [passo, duração em passos]
  sub: [number, number][];
};

const FULL: Pattern = {
  kick: [0, 7, 10],
  clap: [4, 12],
  hat: [0, 2, 4, 6, 8, 10, 12],
  openHat: [14],
  ghost: [3, 11, 15],
  stab: [[0, 2], [3, 1], [6, 2], [10, 1], [12, 3]],
  sub: [[0, 6], [7, 2], [10, 5]],
};
const LIGHT: Pattern = {
  kick: [0, 10],
  clap: [12],
  hat: [0, 2, 4, 6, 8, 10, 12, 14],
  openHat: [],
  ghost: [],
  stab: [[0, 2], [6, 2], [10, 1]],
  sub: [[0, 9], [10, 5]],
};
// Compasso 5: metade "abafada" (Abrindo), metade que abre (dossiê).
const SPLIT: Pattern = {
  kick: [0, 8, 10],
  clap: [12],
  hat: [0, 2, 4, 6, 8, 10, 12],
  openHat: [14],
  ghost: [11, 15],
  stab: [[8, 2], [10, 1], [12, 3]],
  sub: [[0, 8], [8, 2], [10, 5]],
};
const HALF: Pattern = {
  kick: [0, 7],
  clap: [8],
  hat: [0, 2, 4, 6, 8, 10, 12, 14],
  openHat: [],
  ghost: [13, 15],
  stab: [[0, 3], [7, 2], [12, 3]],
  sub: [[0, 7], [7, 8]],
};
const BREAK: Pattern = {kick: [], clap: [], hat: [], openHat: [], ghost: [], stab: [], sub: []};

const BARS: {bar: number; chord: ChordName; pattern: Pattern; steps?: number}[] = [
  {bar: 1, chord: 'Am9', pattern: FULL},
  {bar: 2, chord: 'Fmaj9', pattern: FULL},
  {bar: 3, chord: 'Cmaj7', pattern: FULL},
  {bar: 4, chord: 'G6', pattern: LIGHT},
  {bar: 5, chord: 'Am9', pattern: SPLIT},
  {bar: 6, chord: 'Fmaj9', pattern: FULL},
  {bar: 7, chord: 'Cmaj7', pattern: HALF},
  {bar: 8, chord: 'G6', pattern: BREAK},
  {bar: 9, chord: 'Cmaj9', pattern: FULL},
];

/* ----------------------------------------------------------- barramentos */

const drums = Bus.seconds(LENGTH);
const bass = Bus.seconds(LENGTH);
const chords = Bus.seconds(LENGTH);
const pads = Bus.seconds(LENGTH);
const plucks = Bus.seconds(LENGTH);
const sfx = Bus.seconds(LENGTH);
const verbSend = Bus.seconds(LENGTH);
const delaySend = Bus.seconds(LENGTH);
const kickTimes: number[] = [];

let seed = 1;
const next = () => seed++;

function addKick(t: number, gain = 1): void {
  drums.addMono(t, I.kick(next()), gain);
  kickTimes.push(t);
}

function addStab(t: number, chord: ChordName, steps: number, gain: number): void {
  const s = I.stab([...CHORDS[chord].notes], steps * STEP, next());
  chords.addStereo(t, s.l, s.r, gain);
  verbSend.addStereo(t, s.l, s.r, gain * 0.3);
}

/* ----------------------------------------------------------------- groove */

for (const {bar, chord, pattern} of BARS) {
  const t0 = T(at(bar));
  const st = (step: number) => t0 + step * STEP;
  // Swing leve nas semicolcheias fracas: o groove não soa quantizado.
  const swing = (step: number) => (step % 2 === 1 ? STEP * 0.12 : 0);

  pattern.kick.forEach((s) => addKick(st(s), s === 0 ? 1 : 0.85));
  pattern.clap.forEach((s) => {
    const c = I.clap(next());
    drums.addStereo(st(s), c.l, c.r, dbToGain(-5));
    verbSend.addStereo(st(s), c.l, c.r, 0.12);
  });
  pattern.hat.forEach((s) => drums.addMono(st(s) + swing(s), I.hat(next()), dbToGain(s % 4 === 2 ? -13 : -16), 0.25));
  pattern.openHat.forEach((s) => drums.addMono(st(s), I.hat(next(), true), dbToGain(-16), -0.2));
  pattern.ghost.forEach((s) => drums.addMono(st(s) + swing(s), I.hat(next()), dbToGain(-22), 0.35));
  pattern.stab.forEach(([s, len]) => addStab(st(s), chord, len, dbToGain(-8)));
  pattern.sub.forEach(([s, len]) => bass.addMono(st(s), I.sub(CHORDS[chord].bass, len * STEP), dbToGain(-4)));
}

// Pad contínuo seguindo os acordes; mais presente na vinheta e na pausa.
const padPlan: {from: number; bar?: number; chord: ChordName; beats: number; db: number}[] = [
  {from: 0, chord: 'Am9', beats: 2, db: -9},
  ...BARS.map(({bar, chord}) => ({from: T(at(bar)), bar, chord, beats: 4, db: bar === 8 ? -4 : bar === 1 ? -13 : -16})),
  {from: T(at(10)), chord: 'Cmaj9', beats: 2, db: -12},
];
for (const p of padPlan) {
  const dur = (p.beats * BEAT) / FPS;
  const s = I.pad([...CHORDS[p.chord].notes, CHORDS[p.chord].bass + 24], dur, next(), {attack: p.from === 0 ? 0.9 : 0.25, cutoff: p.bar === 8 ? 1800 : 1300});
  pads.addStereo(p.from, s.l, s.r, dbToGain(p.db));
  verbSend.addStereo(p.from, s.l, s.r, dbToGain(p.db) * 0.5);
}

// A pausa (compasso 8) mantém corpo: sub longo em Sol, baixo, sob o pad.
bass.addMono(T(at(8)), I.sub(CHORDS.G6.bass, (4 * BEAT) / FPS - 0.1), dbToGain(-15));

// Arpejo do "Abrindo" (primeira metade do compasso 5).
{
  const notes = [69, 72, 76, 79, 81, 79, 76, 72];
  notes.forEach((m, i) => {
    const t = T(at(5)) + i * STEP;
    const s = I.pluck(m, {decay: 0.22});
    plucks.addMono(t, s, dbToGain(-13), i % 2 ? 0.4 : -0.4);
    delaySend.addMono(t, s, dbToGain(-15));
  });
}

// M · O · V · E: uma nota por letra, subindo o acorde.
[72, 76, 79, 83].forEach((m, i) => {
  const t = T(EVENTS.method.letters[i]);
  const s = I.pluck(m, {decay: 0.4, index: 2.4});
  plucks.addMono(t, s, dbToGain(-9), -0.3 + i * 0.2);
  delaySend.addMono(t, s, dbToGain(-13));
  verbSend.addMono(t, s, 0.25);
});

// Compasso 8, a pausa: virada de caixa acelerando até o CTA.
{
  const t0 = T(at(8, 2));
  const hits = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => i * STEP).concat([8, 9, 10, 11, 12, 13, 14, 15].map((i) => 8 * STEP + (i - 8) * STEP * 0.5));
  hits.forEach((dt, i) => {
    const g = dbToGain(-24 + (i / hits.length) * 16);
    const s = I.snare(next());
    drums.addMono(t0 + dt, s, g, 0);
    verbSend.addMono(t0 + dt, s, g * 0.3);
  });
}

// O tranco de "na reunião.": bumbo + acorde + impacto, fora da grade.
addKick(T(EVENTS.hook.slam), 1);
addStab(T(EVENTS.hook.slam), 'Fmaj9', 2, dbToGain(-6));
bass.addMono(T(EVENTS.hook.slam), I.sub(CHORDS.Fmaj9.bass, 5 * STEP), dbToGain(-4));

// Final: acorde longo de resolução (C maior), soando até o fim.
{
  const t = T(EVENTS.endCard.finalHit);
  addKick(t, 1);
  const s = I.stab([...CHORDS.Cmaj9.notes], 1.0, next(), {bright: 0.8});
  chords.addStereo(t, s.l, s.r, dbToGain(-6));
  verbSend.addStereo(t, s.l, s.r, 0.5);
  bass.addMono(t, I.sub(CHORDS.Cmaj9.bass, 1.0), dbToGain(-4));
}

/* ------------------------------------------------------------------- SFX */

const addFx = (t: number, s: I.Stereo | Float32Array, db: number, pan = 0, verb = 0) => {
  const g = dbToGain(db);
  if (s instanceof Float32Array) {
    sfx.addMono(t, s, g, pan);
    if (verb) verbSend.addMono(t, s, g * verb);
  } else {
    sfx.addStereo(t, s.l, s.r, g);
    if (verb) verbSend.addStereo(t, s.l, s.r, g * verb);
  }
};

const cues: Record<string, unknown> & {drop?: number; slam?: number; clickSend?: number; clickCta?: number} = {};

// 1 · Logo: sopro subindo até o drop, sino no sublinhado, whoosh do voo.
addFx(0, X.whoosh(next(), T(SCENES.logo.to), {from: 120, to: 2600, peak: 0.95, q: 0.9, panFrom: 0, panTo: 0}), -16);
addFx(T(EVENTS.logo.underline), I.bell(88, {decay: 0.8}), -22, 0.2, 0.6);
addFx(T(EVENTS.logo.toHeader), X.whoosh(next(), 0.35, {from: 900, to: 5000, peak: 0.4, q: 1.8}), -19);

// 2 · Gancho: drop, picote digital em "travar", tranco em "na reunião.".
addFx(T(SCENES.hook.from), X.impact(next()), -6, 0, 0.35);
addFx(T(EVENTS.hook.travar), X.glitch(next(), T(EVENTS.hook.stutterEnd) - T(EVENTS.hook.travar)), -21);
addFx(T(EVENTS.hook.slam), X.impact(next()), -7, 0, 0.3);
addFx(T(EVENTS.hook.exit), X.whoosh(next(), 0.32), -15);
cues.drop = T(SCENES.hook.from);
cues.travar = T(EVENTS.hook.travar);
cues.silence = [T(EVENTS.hook.tapeStopEnd), T(EVENTS.hook.slam)];
cues.slam = T(EVENTS.hook.slam);

// 3 · Missão.
addFx(T(SCENES.mission.from), X.pop(next(), {pitch: 0.8}), -11, 0, 0.2);
addFx(T(EVENTS.mission.chip), X.tick(next()), -22, -0.3);
addFx(T(EVENTS.mission.exit), X.whoosh(next(), 0.3), -15);

// 4 · Pedido: teclas no quadro exato de cada caractere, clique, envio.
addFx(T(SCENES.prompt.from) - 0.08, X.whoosh(next(), 0.25, {from: 400, to: 3000, peak: 0.5}), -20);
EVENTS.prompt.keys.forEach((f, i) => addFx(T(f), X.key(next()), -11, ((i % 5) - 2) * 0.08));
addFx(T(EVENTS.prompt.zoomOut), X.whoosh(next(), 0.4, {from: 200, to: 1200, peak: 0.5, q: 1.1}), -21);
addFx(T(EVENTS.prompt.click), X.mouseClick(next()), -8, 0.25);
addFx(T(EVENTS.prompt.click) + 0.02, X.whoosh(next(), 0.3, {from: 800, to: 7000, peak: 0.35, q: 1.6, panFrom: 0.2, panTo: 0.8}), -14);
cues.keys = EVENTS.prompt.keys.map(T);
cues.clickSend = T(EVENTS.prompt.click);

// 5 · Abrindo.
addFx(T(SCENES.processing.from), X.pop(next(), {pitch: 1.1}), -14);
addFx(T(EVENTS.processing.step2), X.tick(next(), {pitch: 2600}), -22);

// 6 · Dossiê: folha deslizando, balão, um tique por linha.
addFx(T(SCENES.dossier.from) - 0.1, X.whoosh(next(), 0.4, {from: 150, to: 2200, peak: 0.45, q: 0.8}), -12);
addFx(T(SCENES.dossier.from), X.pop(next(), {pitch: 1.25}), -15, 0.4);
[EVENTS.dossier.header, ...EVENTS.dossier.sections, EVENTS.dossier.footer].forEach((f, i) =>
  addFx(T(f), X.tick(next(), {pitch: 2400 + i * 180}), -19, ((i % 3) - 1) * 0.3),
);
addFx(T(EVENTS.dossier.exit), X.whoosh(next(), 0.3), -15);

// 7 · Método.
addFx(T(SCENES.method.from) - 0.2, X.whoosh(next(), 0.45, {from: 300, to: 2500, peak: 0.3, q: 1.2}), -15);
addFx(T(EVENTS.method.exit), X.whoosh(next(), 0.3), -15);

// 8 · Fechamento: a subida inteira do compasso, até o CTA.
addFx(T(SCENES.closing.from), X.riser(next(), T(SCENES.endCard.from) - T(SCENES.closing.from)), -12);

// 9 · CTA: drop, botão, clique e confirmação.
addFx(T(EVENTS.endCard.impact), X.impact(next()), -5, 0, 0.35);
addFx(T(EVENTS.endCard.impact), I.hat(next(), true), -12, 0, 0.3);
addFx(T(EVENTS.endCard.button), X.pop(next(), {pitch: 0.7}), -9, 0, 0.25);
addFx(T(EVENTS.endCard.cursorIn), X.whoosh(next(), 0.55, {from: 500, to: 1800, peak: 0.6, q: 1.0, panFrom: 0.6, panTo: 0.1}), -27);
addFx(T(EVENTS.endCard.click), X.mouseClick(next()), -7, 0.2);
addFx(T(EVENTS.endCard.click) + 0.03, I.bell(88, {decay: 0.9}), -15, -0.2, 0.5);
addFx(T(EVENTS.endCard.click) + 0.11, I.bell(95, {decay: 1.1}), -18, 0.2, 0.5);
cues.clickCta = T(EVENTS.endCard.click);
cues.finalHit = T(EVENTS.endCard.finalHit);

/* ------------------------------------------------------------------- mix */

// Sidechain: acordes e pad abrem espaço para cada bumbo.
function duck(bus: Bus, depth: number, release = 0.11): void {
  const sorted = [...kickTimes].sort((a, b) => a - b);
  const attack = 1 - Math.exp(-1 / (0.003 * SR)); // 3 ms: sem degrau, sem estalo
  let k = -1;
  let env = 0;
  for (let i = 0; i < bus.length; i++) {
    const t = i / SR;
    while (k + 1 < sorted.length && sorted[k + 1] <= t) k++;
    const target = k >= 0 ? Math.exp(-(t - sorted[k]) / release) : 0;
    env = target > env ? env + (target - env) * attack : target;
    const g = 1 - depth * env;
    bus.L[i] *= g;
    bus.R[i] *= g;
  }
}
duck(chords, 0.45);
duck(pads, 0.5);

// Filtro automatizado: "Abrindo" soa abafado e abre no dossiê.
function lowpassAutomation(bus: Bus, points: [number, number][]): void {
  const fl = new Svf(20000, 0.8);
  const fr = new Svf(20000, 0.8);
  let p = 0;
  for (let i = 0; i < bus.length; i++) {
    const t = i / SR;
    while (p + 1 < points.length && points[p + 1][0] <= t) p++;
    const [t0, c0] = points[p];
    const [t1, c1] = points[Math.min(p + 1, points.length - 1)];
    const x = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 1;
    const c = c0 * Math.pow(c1 / c0, x);
    if (c >= 19000) {
      fl.process(bus.L[i]);
      fr.process(bus.R[i]);
      continue;
    }
    fl.set(c, 0.8);
    fr.set(c, 0.8);
    bus.L[i] = fl.process(bus.L[i]);
    bus.R[i] = fr.process(bus.R[i]);
  }
}
const abrindo = T(SCENES.processing.from);
const dossie = T(SCENES.dossier.from);
const filterCurve: [number, number][] = [
  [0, 20000],
  [abrindo - 0.01, 20000],
  [abrindo + 0.06, 700],
  [dossie - 0.3, 900],
  [dossie, 20000],
];
lowpassAutomation(drums, filterCurve);
lowpassAutomation(chords, filterCurve);

const verb = freeverb(verbSend, {room: 0.82, damp: 0.4, width: 1});
const echo = pingPong(delaySend, {time: 3 * STEP, feedback: 0.38, tone: 3200});

const music = Bus.seconds(LENGTH);
drums.mixInto(music, 1);
bass.mixInto(music, 1);
chords.mixInto(music, 1);
pads.mixInto(music, 1);
plucks.mixInto(music, 1);
verb.mixInto(music, dbToGain(-4));
echo.mixInto(music, dbToGain(-6));

/*
 * "Travar": a música picota (repete a mesma semicolcheia, cada vez mais
 * curta), desacelera como fita parando e some. Volta no tranco.
 */
function stutterAndStop(bus: Bus, from: number, rollEnd: number, stopEnd: number): void {
  const src = bus.clone();
  const s0 = samples(from);
  const s1 = samples(rollEnd);
  const s2 = samples(stopEnd);
  const lens = [STEP, STEP / 2, STEP / 2, STEP / 4, STEP / 4, STEP / 8, STEP / 8, STEP / 8, STEP / 8].map(samples);
  const edge = samples(0.002);
  let pos = s0;
  let k = 0;
  while (pos < s1) {
    const len = Math.min(lens[Math.min(k, lens.length - 1)], s1 - pos);
    for (let i = 0; i < len; i++) {
      const fade = Math.min(1, i / edge, (len - i) / edge);
      bus.L[pos + i] = src.L[s0 + i] * fade;
      bus.R[pos + i] = src.R[s0 + i] * fade;
    }
    pos += len;
    k++;
  }
  let read = s0;
  const n = s2 - s1;
  for (let i = 0; i < n; i++) {
    const rate = Math.pow(1 - i / n, 1.4);
    const idx = Math.floor(read);
    const frac = read - idx;
    const env = 1 - Math.pow(i / n, 2);
    bus.L[s1 + i] = (src.L[idx] * (1 - frac) + src.L[idx + 1] * frac) * env;
    bus.R[s1 + i] = (src.R[idx] * (1 - frac) + src.R[idx + 1] * frac) * env;
    read += rate;
  }
}
stutterAndStop(music, T(EVENTS.hook.travar), T(EVENTS.hook.stutterEnd), T(EVENTS.hook.tapeStopEnd));

const master = Bus.seconds(LENGTH);
music.mixInto(master, 1);
sfx.mixInto(master, 1);

// Silêncio absoluto entre a fita parar e o tranco — nem cauda de reverb.
{
  const a = samples(T(EVENTS.hook.tapeStopEnd));
  const b = samples(T(EVENTS.hook.slam));
  const edge = samples(0.004);
  for (let i = a; i < b; i++) {
    const g = Math.min(1, Math.max(0, (a + edge - i) / edge));
    master.L[i] *= g;
    master.R[i] *= g;
  }
}

// Master: limpa grave inaudível, tira embolo, dá ar; cola; normaliza; limita.
eq(master, () => [Biquad.highpass(28, 0.7), Biquad.peaking(300, 0.9, -2), Biquad.highShelf(9000, 1.5)]);
compress(master, {thresholdDb: -16, ratio: 2, attackMs: 10, releaseMs: 150, kneeDb: 6});

let gain = 1;
let finalBus = master;
let loudness = -Infinity;
for (let iter = 0; iter < 8; iter++) {
  const test = master.clone();
  for (let i = 0; i < test.length; i++) {
    test.L[i] *= gain;
    test.R[i] *= gain;
  }
  limit(test, {ceilingDb: CEILING_DB, lookaheadMs: 1.5, releaseMs: 80});
  loudness = integratedLoudness(test);
  finalBus = test;
  if (Math.abs(loudness - TARGET_LUFS) < 0.15) break;
  gain *= dbToGain(TARGET_LUFS - loudness);
}

// Fim limpo: 200 ms de fade no último acorde, sem estalo no corte.
{
  const n = samples(0.2);
  for (let i = 0; i < n; i++) {
    const j = finalBus.length - n + i;
    const g = 1 - i / n;
    finalBus.L[j] *= g;
    finalBus.R[j] *= g;
  }
}

const outDir = path.resolve('public/audio');
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'trilha.wav'), toWav(finalBus));
// Marcações lidas pelo verify.ts: o que conferir neste vídeo.
Object.assign(cues, {
  freeze: [FREEZE.from, FREEZE.to],
  cuts: Object.fromEntries(Object.entries(SCENES).slice(1).map(([name, s]) => [name, s.from])),
  sync: {drop: cues.drop, tranco: cues.slam, 'clique enviar': cues.clickSend, 'clique CTA': cues.clickCta},
  marks: [
    ['clique enviar', cues.clickSend, EVENTS.prompt.click],
    ['clique CTA', cues.clickCta, EVENTS.endCard.click],
    ['tranco', cues.slam, EVENTS.hook.slam],
  ],
  expectedKeys: EVENTS.prompt.keys.length,
});
fs.writeFileSync(path.join(outDir, 'trilha.cues.json'), JSON.stringify({fps: FPS, sampleRate: SR, duration: LENGTH, ...cues}, null, 2));

console.log(
  JSON.stringify({
    seconds: finalBus.length / SR,
    integratedLufs: Number(loudness.toFixed(2)),
    samplePeakDb: Number((20 * Math.log10(finalBus.peak())).toFixed(2)),
    gainDb: Number((20 * Math.log10(gain)).toFixed(2)),
  }),
);
