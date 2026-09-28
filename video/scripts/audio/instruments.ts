/*
 * Instrumentos da trilha, cada um uma função que devolve o sinal de UMA nota.
 * Síntese subtrativa (serras com PolyBLEP + filtro), FM para sinos e plucks,
 * e percussão feita de seno com queda de pitch e ruído filtrado.
 */
import {drive, midiToHz, rng, samples, saw, SR, Svf, TAU} from './dsp';

export type Stereo = {l: Float32Array; r: Float32Array};

/* ---------------------------------------------------------------- bateria */

/** Bumbo: seno com queda de pitch + estalo de ataque, saturado. */
export function kick(seed: number, {punch = 1, decay = 0.26} = {}): Float32Array {
  const rand = rng(seed);
  const n = samples(0.6);
  const out = new Float32Array(n);
  const click = new Svf(3200, 0.7);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 46 + (170 - 46) * Math.exp(-t / 0.032);
    phase += (TAU * f) / SR;
    const env = Math.min(1, t / 0.0015) * Math.exp(-t / decay);
    click.process(rand() * 2 - 1);
    const c = click.high * Math.exp(-t / 0.003) * 0.5 * punch;
    out[i] = drive(Math.sin(phase) * env + c, 1.9);
  }
  return out;
}

/** Palma: três estalos de ruído em rajada + cauda, passa-banda. */
export function clap(seed: number): Stereo {
  const make = (s: number) => {
    const rand = rng(s);
    const n = samples(0.42);
    const out = new Float32Array(n);
    const bp = new Svf(1350, 1.1);
    const hp = new Svf(500, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let env = 0;
      for (const tb of [0, 0.011, 0.023]) if (t >= tb) env += Math.exp(-(t - tb) / 0.0055);
      if (t >= 0.03) env += 0.65 * Math.exp(-(t - 0.03) / 0.12);
      bp.process(rand() * 2 - 1);
      hp.process(bp.band);
      const body = Math.sin(TAU * 190 * t) * Math.exp(-t / 0.028) * 0.35;
      out[i] = hp.high * env * 1.6 + body;
    }
    return out;
  };
  return {l: make(seed), r: make(seed + 101)};
}

/** Chimbal: ruído + quadradas metálicas (receita 808), passa-alta. */
export function hat(seed: number, open = false): Float32Array {
  const rand = rng(seed);
  const n = samples(open ? 0.42 : 0.09);
  const out = new Float32Array(n);
  const hp = new Svf(7600, 0.8);
  const bp = new Svf(10500, 0.9);
  const freqs = [205.3, 304.4, 369.6, 522.7, 540, 800];
  const phases = freqs.map(() => rand());
  const tau = open ? 0.13 : 0.024;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let metal = 0;
    freqs.forEach((f, k) => {
      phases[k] = (phases[k] + f / SR) % 1;
      metal += phases[k] < 0.5 ? 1 : -1;
    });
    const x = metal / 6 * 0.6 + (rand() * 2 - 1) * 0.7;
    hp.process(x);
    bp.process(hp.high);
    out[i] = (bp.band * 1.4 + hp.high * 0.5) * Math.exp(-t / tau);
  }
  return out;
}

/** Caixa para a virada: corpo tonal + ruído. */
export function snare(seed: number): Float32Array {
  const rand = rng(seed);
  const n = samples(0.25);
  const out = new Float32Array(n);
  const hp = new Svf(1800, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    hp.process(rand() * 2 - 1);
    const body = Math.sin(TAU * 210 * t) * Math.exp(-t / 0.04) * 0.5;
    out[i] = body + hp.high * Math.exp(-t / 0.07) * 0.8;
  }
  return out;
}

/* -------------------------------------------------------------- harmonia */

/**
 * Sub-grave estilo 808: seno com glide de entrada, saturado para gerar os
 * harmônicos que um alto-falante de celular consegue reproduzir.
 */
export function sub(midi: number, dur: number): Float32Array {
  const n = samples(dur + 0.08);
  const out = new Float32Array(n);
  const f0 = midiToHz(midi);
  const lp = new Svf(900, 0.7);
  const mid = new Svf(520, 0.8);
  let phase = 0;
  let phase2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f0 * Math.pow(2, (1.5 * Math.exp(-t / 0.035)) / 12);
    phase += (TAU * f) / SR;
    phase2 = (phase2 + (2 * f) / SR) % 1;
    const release = t > dur ? Math.max(0, 1 - (t - dur) / 0.08) : 1;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 1.6) * release;
    const body = drive(Math.sin(phase), 2.6);
    // Camada uma oitava acima, só para o grave "aparecer" no celular.
    const upper = mid.process(saw(phase2, (2 * f) / SR)) * 0.22;
    out[i] = lp.process(body + upper) * env;
  }
  return out;
}

/** Acorde picotado: 3 serras desafinadas por nota, filtro com envelope. */
export function stab(notes: number[], dur: number, seed: number, {bright = 1} = {}): Stereo {
  const rand = rng(seed);
  const n = samples(dur + 0.12);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const detune = [-9, 0, 9];
  const pans = [0.15, 0.5, 0.85]; // posição L→R de cada voz
  const voices = notes.flatMap((m) =>
    detune.map((c, k) => ({f: midiToHz(m + c / 100), phase: rand(), pan: pans[k]})),
  );
  const fl = new Svf(3000, 0.9);
  const fr = new Svf(3000, 0.9);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let sl = 0;
    let sr = 0;
    for (const v of voices) {
      const dt = v.f / SR;
      v.phase = (v.phase + dt) % 1;
      const s = saw(v.phase, dt);
      sl += s * (1 - v.pan);
      sr += s * v.pan;
    }
    const cutoff = (900 + 3600 * bright * Math.exp(-t / 0.1)) * (1 + 0.1 * Math.sin(TAU * 0.5 * t));
    fl.set(cutoff, 0.9);
    fr.set(cutoff, 0.9);
    const release = t > dur ? Math.max(0, 1 - (t - dur) / 0.12) : 1;
    const env = Math.min(1, t / 0.003) * (0.35 + 0.65 * Math.exp(-t / 0.16)) * release;
    l[i] = (fl.process(sl) * env) / voices.length;
    r[i] = (fr.process(sr) * env) / voices.length;
  }
  return {l, r};
}

/** Pad: 4 serras desafinadas por nota, ataque lento, filtro respirando. */
export function pad(notes: number[], dur: number, seed: number, {attack = 0.6, release = 0.9, cutoff = 1300} = {}): Stereo {
  const rand = rng(seed);
  const n = samples(dur + release);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const detune = [-13, -4, 5, 14];
  const voices = notes.flatMap((m) =>
    detune.map((c, k) => ({f: midiToHz(m + c / 100), phase: rand(), pan: k / (detune.length - 1)})),
  );
  const fl = new Svf(cutoff, 0.7);
  const fr = new Svf(cutoff, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let sl = 0;
    let sr = 0;
    for (const v of voices) {
      const dt = v.f / SR;
      v.phase = (v.phase + dt) % 1;
      const s = saw(v.phase, dt);
      sl += s * (1 - v.pan);
      sr += s * v.pan;
    }
    const c = cutoff + 260 * Math.sin(TAU * 0.25 * t);
    fl.set(c, 0.7);
    fr.set(c, 0.7);
    const env = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    l[i] = (fl.process(sl) * env) / voices.length;
    r[i] = (fr.process(sr) * env) / voices.length;
  }
  return {l, r};
}

/** Pluck FM (razão 2:1): o "tique" melódico das letras e do arpejo. */
export function pluck(midi: number, {decay = 0.28, index = 3.2} = {}): Float32Array {
  const n = samples(decay * 4);
  const out = new Float32Array(n);
  const f = midiToHz(midi);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const I = index * Math.exp(-t / 0.05) + 0.25;
    const mod = Math.sin(TAU * 2 * f * t) * I;
    out[i] = Math.sin(TAU * f * t + mod) * Math.min(1, t / 0.002) * Math.exp(-t / decay);
  }
  return out;
}

/** Sino FM inarmônico (razão 3.5): confirmação, brilho do logo. */
export function bell(midi: number, {decay = 1.1} = {}): Float32Array {
  const n = samples(decay * 3.5);
  const out = new Float32Array(n);
  const f = midiToHz(midi);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const I = 2.2 * Math.exp(-t / 0.25);
    const a = Math.sin(TAU * f * t + Math.sin(TAU * 3.5 * f * t) * I);
    const b = Math.sin(TAU * 2 * f * t) * 0.25 * Math.exp(-t / (decay * 0.5));
    out[i] = (a + b) * Math.min(1, t / 0.002) * Math.exp(-t / decay);
  }
  return out;
}

