/*
 * Estúdio compartilhado das variações: acordes, grooves, pad, efeitos, mix e
 * master. Cada variação escreve só a partitura (o quê soa em que quadro).
 * A peça principal mantém o arranjo próprio em scripts/compose-audio.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import {Biquad, Bus, compress, dbToGain, eq, freeverb, integratedLoudness, limit, pingPong, samples, SR} from './dsp';
import * as I from './instruments';
import {BPM, DURATION, FPS, PICKUP} from '../../src/timeline';

export const T = (frame: number) => frame / FPS;

/**
 * Grade musical de uma trilha: andamento, quadro do compasso 1 e duração em
 * quadros. O padrão é a grade da peça principal (100 BPM, 24 s); uma peça com
 * outro tempo passa a própria.
 */
export type Grid = {bpm: number; pickup: number; frames: number};
export const MAIN_GRID: Grid = {bpm: BPM, pickup: PICKUP, frames: DURATION};

export const CHORDS = {
  Am9: {bass: 33, notes: [60, 64, 67, 71]},
  Fmaj9: {bass: 29, notes: [57, 60, 64, 67]},
  Cmaj7: {bass: 36, notes: [59, 62, 64, 67]},
  G6: {bass: 31, notes: [59, 62, 64, 69]},
  Cmaj9: {bass: 36, notes: [60, 64, 67, 71, 74]},
} as const;
export type ChordName = keyof typeof CHORDS;

export type Pattern = {
  kick: number[];
  clap: number[];
  hat: number[];
  openHat: number[];
  ghost: number[];
  stab: [number, number][];
  sub: [number, number][];
};

export const FULL: Pattern = {
  kick: [0, 7, 10],
  clap: [4, 12],
  hat: [0, 2, 4, 6, 8, 10, 12],
  openHat: [14],
  ghost: [3, 11, 15],
  stab: [[0, 2], [3, 1], [6, 2], [10, 1], [12, 3]],
  sub: [[0, 6], [7, 2], [10, 5]],
};
export const LIGHT: Pattern = {
  kick: [0, 10],
  clap: [12],
  hat: [0, 2, 4, 6, 8, 10, 12, 14],
  openHat: [],
  ghost: [],
  stab: [[0, 2], [6, 2], [10, 1]],
  sub: [[0, 9], [10, 5]],
};
export const HALF: Pattern = {
  kick: [0, 7],
  clap: [8],
  hat: [0, 2, 4, 6, 8, 10, 12, 14],
  openHat: [],
  ghost: [13, 15],
  stab: [[0, 3], [7, 2], [12, 3]],
  sub: [[0, 7], [7, 8]],
};
export const BREAK: Pattern = {kick: [], clap: [], hat: [], openHat: [], ghost: [], stab: [], sub: []};

export type BarPlan = {bar: number; chord: ChordName; pattern: Pattern}[];

export class Studio {
  readonly grid: Grid;
  readonly beat: number; // quadros por tempo
  readonly step: number; // segundos por semicolcheia
  readonly length: number; // segundos
  readonly drums: Bus;
  readonly bass: Bus;
  readonly chords: Bus;
  readonly pads: Bus;
  readonly plucks: Bus;
  readonly sfx: Bus;
  readonly verbSend: Bus;
  readonly delaySend: Bus;
  readonly kickTimes: number[] = [];
  private seed: number;

  constructor(seed: number, grid: Grid = MAIN_GRID) {
    this.seed = seed;
    this.grid = grid;
    this.beat = (FPS * 60) / grid.bpm;
    this.step = this.beat / 4 / FPS;
    this.length = grid.frames / FPS;
    this.drums = Bus.seconds(this.length);
    this.bass = Bus.seconds(this.length);
    this.chords = Bus.seconds(this.length);
    this.pads = Bus.seconds(this.length);
    this.plucks = Bus.seconds(this.length);
    this.sfx = Bus.seconds(this.length);
    this.verbSend = Bus.seconds(this.length);
    this.delaySend = Bus.seconds(this.length);
  }

  /** Quadro de uma posição musical nesta grade: compasso a partir de 1; tempo e semicolcheia a partir de 0. */
  at(bar: number, beat = 0, step = 0): number {
    return Math.round(this.grid.pickup + (bar - 1) * 4 * this.beat + beat * this.beat + step * (this.beat / 4));
  }

  next(): number {
    return this.seed++;
  }

  kick(t: number, gain = 1): void {
    this.drums.addMono(t, I.kick(this.next()), gain);
    this.kickTimes.push(t);
  }

  stab(t: number, chord: ChordName, steps: number, gain: number, bright = 1): void {
    const s = I.stab([...CHORDS[chord].notes], steps * this.step, this.next(), {bright});
    this.chords.addStereo(t, s.l, s.r, gain);
    this.verbSend.addStereo(t, s.l, s.r, gain * 0.3);
  }

  /** Groove por compasso, na grade da trilha. */
  groove(plan: BarPlan): void {
    const STEP = this.step;
    for (const {bar, chord, pattern} of plan) {
      const t0 = T(this.at(bar));
      const st = (step: number) => t0 + step * STEP;
      const swing = (step: number) => (step % 2 === 1 ? STEP * 0.12 : 0);
      pattern.kick.forEach((s) => this.kick(st(s), s === 0 ? 1 : 0.85));
      pattern.clap.forEach((s) => {
        const c = I.clap(this.next());
        this.drums.addStereo(st(s), c.l, c.r, dbToGain(-5));
        this.verbSend.addStereo(st(s), c.l, c.r, 0.12);
      });
      pattern.hat.forEach((s) => this.drums.addMono(st(s) + swing(s), I.hat(this.next()), dbToGain(s % 4 === 2 ? -13 : -16), 0.25));
      pattern.openHat.forEach((s) => this.drums.addMono(st(s), I.hat(this.next(), true), dbToGain(-16), -0.2));
      pattern.ghost.forEach((s) => this.drums.addMono(st(s) + swing(s), I.hat(this.next()), dbToGain(-22), 0.35));
      pattern.stab.forEach(([s, len]) => this.stab(st(s), chord, len, dbToGain(-8)));
      pattern.sub.forEach(([s, len]) => this.bass.addMono(st(s), I.sub(CHORDS[chord].bass, len * STEP), dbToGain(-4)));
    }
  }

  pad(from: number, chord: ChordName, beats: number, db: number, {attack = 0.25, cutoff = 1300} = {}): void {
    const dur = (beats * this.beat) / FPS;
    const s = I.pad([...CHORDS[chord].notes, CHORDS[chord].bass + 24], dur, this.next(), {attack, cutoff});
    this.pads.addStereo(from, s.l, s.r, dbToGain(db));
    this.verbSend.addStereo(from, s.l, s.r, dbToGain(db) * 0.5);
  }

  pluck(t: number, midi: number, db: number, pan = 0): void {
    const s = I.pluck(midi, {decay: 0.4, index: 2.4});
    this.plucks.addMono(t, s, dbToGain(db), pan);
    this.delaySend.addMono(t, s, dbToGain(db - 4));
    this.verbSend.addMono(t, s, 0.25);
  }

  fx(t: number, s: I.Stereo | Float32Array, db: number, pan = 0, verb = 0): void {
    const g = dbToGain(db);
    if (s instanceof Float32Array) {
      this.sfx.addMono(t, s, g, pan);
      if (verb) this.verbSend.addMono(t, s, g * verb);
    } else {
      this.sfx.addStereo(t, s.l, s.r, g);
      if (verb) this.verbSend.addStereo(t, s.l, s.r, g * verb);
    }
  }

  /** Virada de caixa acelerando: 8 semicolcheias + 8 fusas. */
  snareRoll(t0: number): void {
    const STEP = this.step;
    const hits = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => i * STEP).concat([8, 9, 10, 11, 12, 13, 14, 15].map((i) => 8 * STEP + (i - 8) * STEP * 0.5));
    hits.forEach((dt, i) => {
      const g = dbToGain(-24 + (i / hits.length) * 16);
      const s = I.snare(this.next());
      this.drums.addMono(t0 + dt, s, g, 0);
      this.verbSend.addMono(t0 + dt, s, g * 0.3);
    });
  }

  /** Acorde final de resolução, soando até o fim. */
  finalChord(t: number, chord: ChordName): void {
    this.kick(t, 1);
    const s = I.stab([...CHORDS[chord].notes], 1.0, this.next(), {bright: 0.8});
    this.chords.addStereo(t, s.l, s.r, dbToGain(-6));
    this.verbSend.addStereo(t, s.l, s.r, 0.5);
    this.bass.addMono(t, I.sub(CHORDS[chord].bass, 1.0), dbToGain(-4));
  }

  /** Mix + master: sidechain, reverb, delay, EQ, compressor, −14 LUFS, limitador de pico real. */
  master({targetLufs = -14, ceilingDb = -2} = {}): {bus: Bus; loudness: number; gainDb: number} {
    duck(this.chords, this.kickTimes, 0.45);
    duck(this.pads, this.kickTimes, 0.5);
    const verb = freeverb(this.verbSend, {room: 0.82, damp: 0.4, width: 1});
    const echo = pingPong(this.delaySend, {time: 3 * this.step, feedback: 0.38, tone: 3200});
    const mix = Bus.seconds(this.length);
    for (const b of [this.drums, this.bass, this.chords, this.pads, this.plucks, this.sfx]) b.mixInto(mix, 1);
    verb.mixInto(mix, dbToGain(-4));
    echo.mixInto(mix, dbToGain(-6));

    eq(mix, () => [Biquad.highpass(28, 0.7), Biquad.peaking(300, 0.9, -2), Biquad.highShelf(9000, 1.5)]);
    compress(mix, {thresholdDb: -16, ratio: 2, attackMs: 10, releaseMs: 150, kneeDb: 6});

    let gain = 1;
    let out = mix;
    let loudness = -Infinity;
    for (let iter = 0; iter < 8; iter++) {
      const test = mix.clone();
      for (let i = 0; i < test.length; i++) {
        test.L[i] *= gain;
        test.R[i] *= gain;
      }
      limit(test, {ceilingDb, lookaheadMs: 1.5, releaseMs: 80});
      loudness = integratedLoudness(test);
      out = test;
      if (Math.abs(loudness - targetLufs) < 0.15) break;
      gain *= dbToGain(targetLufs - loudness);
    }
    const n = samples(0.2);
    for (let i = 0; i < n; i++) {
      const j = out.length - n + i;
      out.L[j] *= 1 - i / n;
      out.R[j] *= 1 - i / n;
    }
    return {bus: out, loudness, gainDb: 20 * Math.log10(gain)};
  }
}

function duck(bus: Bus, kickTimes: number[], depth: number, release = 0.11): void {
  const sorted = [...kickTimes].sort((a, b) => a - b);
  const attack = 1 - Math.exp(-1 / (0.003 * SR));
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

/** Grava public/audio/<nome>.wav e <nome>.cues.json (lido pelo verify.ts). */
export function writeTrack(name: string, bus: Bus, cues: Record<string, unknown>, toWav: (b: Bus) => Buffer): void {
  const dir = path.resolve('public/audio');
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, `${name}.wav`), toWav(bus));
  fs.writeFileSync(path.join(dir, `${name}.cues.json`), JSON.stringify({fps: FPS, sampleRate: SR, duration: bus.length / SR, ...cues}, null, 2));
}
