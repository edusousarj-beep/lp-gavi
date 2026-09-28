/*
 * Efeitos sonoros da interface e das transições. Tudo sintetizado.
 */
import {rng, samples, SR, Svf, TAU} from './dsp';
import type {Stereo} from './instruments';

/** Whoosh: ruído num passa-banda que varre de `from` a `to` Hz, cruzando o estéreo. */
export function whoosh(seed: number, dur: number, {from = 300, to = 4500, peak = 0.6, q = 1.4, panFrom = -0.7, panTo = 0.7} = {}): Stereo {
  const rand = rng(seed);
  const n = samples(dur);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const bp = new Svf(from, q);
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const f = from * Math.pow(to / from, x);
    bp.set(f, q);
    bp.process(rand() * 2 - 1);
    const env = x < peak ? Math.pow(x / peak, 2) : Math.pow(1 - (x - peak) / (1 - peak), 1.6);
    const pan = panFrom + (panTo - panFrom) * x;
    const a = ((pan + 1) * Math.PI) / 4;
    const s = bp.band * env * 1.8;
    l[i] = s * Math.cos(a);
    r[i] = s * Math.sin(a);
  }
  return {l, r};
}

/** Subida de tensão: ruído que abre + seno que sobe, crescendo até o drop. */
export function riser(seed: number, dur: number): Stereo {
  const rand = rng(seed);
  const n = samples(dur);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const hpL = new Svf(300, 0.8);
  const hpR = new Svf(300, 0.8);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const cutoff = 250 * Math.pow(7000 / 250, x);
    hpL.set(cutoff, 0.8);
    hpR.set(cutoff, 0.8);
    hpL.process(rand() * 2 - 1);
    hpR.process(rand() * 2 - 1);
    const f = 160 * Math.pow(6, x) * (1 + 0.01 * Math.sin(TAU * 6 * x * dur));
    phase += (TAU * f) / SR;
    const env = Math.pow(x, 2.2) * (x > 0.985 ? (1 - x) / 0.015 : 1);
    const tone = Math.sin(phase) * 0.25;
    l[i] = (hpL.high * 0.8 + tone) * env;
    r[i] = (hpR.high * 0.8 + tone) * env;
  }
  return {l, r};
}

/** Impacto do drop: sub que despenca + pancada de ruído + ar. */
export function impact(seed: number): Stereo {
  const rand = rng(seed);
  const n = samples(1.6);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const lp = new Svf(700, 0.7);
  const air = new Svf(5000, 0.7);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 28 + 52 * Math.exp(-t / 0.18);
    phase += (TAU * f) / SR;
    const boom = Math.tanh(1.6 * Math.sin(phase)) * Math.exp(-t / 0.55);
    lp.process(rand() * 2 - 1);
    air.process(rand() * 2 - 1);
    const thump = lp.low * Math.exp(-t / 0.08) * 1.4;
    const hiss = air.high * Math.exp(-t / 0.35) * 0.18;
    l[i] = boom + thump + hiss;
    r[i] = boom + thump - hiss;
  }
  return {l, r};
}

/** "Pop" de elemento de interface aparecendo. */
export function pop(seed: number, {pitch = 1} = {}): Float32Array {
  const rand = rng(seed);
  const n = samples(0.14);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = (620 + 700 * Math.exp(-t / 0.018)) * pitch;
    phase += (TAU * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t / 0.045) + (rand() * 2 - 1) * Math.exp(-t / 0.002) * 0.3;
  }
  return out;
}

/** Tique curto: linha de texto que entra. */
export function tick(seed: number, {pitch = 3200} = {}): Float32Array {
  const rand = rng(seed);
  const n = samples(0.05);
  const out = new Float32Array(n);
  const hp = new Svf(5000, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    hp.process(rand() * 2 - 1);
    out[i] = Math.sin(TAU * pitch * t) * Math.exp(-t / 0.007) * 0.6 + hp.high * Math.exp(-t / 0.0025) * 0.5;
  }
  return out;
}

/** Tecla de notebook: estalo filtrado + "toque" grave + soltura. */
export function key(seed: number): Float32Array {
  const rand = rng(seed);
  const n = samples(0.1);
  const out = new Float32Array(n);
  const bp = new Svf(1800 + rand() * 1500, 1.6);
  const thock = 150 + rand() * 70;
  const level = 0.65 + rand() * 0.35;
  const releaseAt = 0.035 + rand() * 0.02;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    bp.process(rand() * 2 - 1);
    let s = bp.band * Math.exp(-t / 0.008) * 2.2 + Math.sin(TAU * thock * t) * Math.exp(-t / 0.011) * 0.45;
    if (t >= releaseAt) s += bp.band * Math.exp(-(t - releaseAt) / 0.004) * 0.7;
    out[i] = s * level;
  }
  return out;
}

/** Clique de mouse: aperto e soltura, 70 ms depois. */
export function mouseClick(seed: number): Float32Array {
  const rand = rng(seed);
  const n = samples(0.14);
  const out = new Float32Array(n);
  const hp = new Svf(3000, 0.9);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    hp.process(rand() * 2 - 1);
    const press = (hp.high * Math.exp(-t / 0.0016) + Math.sin(TAU * 2300 * t) * Math.exp(-t / 0.004) * 0.6) * 1.2;
    const tr = t - 0.07;
    const release = tr >= 0 ? (hp.high * Math.exp(-tr / 0.0012) + Math.sin(TAU * 2900 * tr) * Math.exp(-tr / 0.003) * 0.5) * 0.55 : 0;
    out[i] = press + release;
  }
  return out;
}

/** Rajada digital para o "travar": quadrada em amostra-e-retém, quantizada. */
export function glitch(seed: number, dur: number): Stereo {
  const rand = rng(seed);
  const n = samples(dur);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  let hold = 0;
  let freq = 800;
  let gate = 1;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    if (hold-- <= 0) {
      hold = samples(0.006 + rand() * 0.018);
      freq = 180 + rand() * 2400;
      gate = rand() < 0.72 ? 1 : 0;
    }
    phase = (phase + freq / SR) % 1;
    const sq = phase < 0.5 ? 1 : -1;
    const noise = rand() * 2 - 1;
    const x = (sq * 0.5 + noise * 0.5) * gate;
    const crushed = Math.round(x * 6) / 6; // ~3 bits
    const fade = Math.min(1, (n - i) / samples(0.004));
    l[i] = crushed * fade;
    r[i] = crushed * fade * (i % 2 === 0 ? 1 : 0.8);
  }
  return {l, r};
}
