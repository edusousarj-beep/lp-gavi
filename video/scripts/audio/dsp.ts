/*
 * Núcleo de DSP da trilha. Tudo sintetizado aqui — nenhuma amostra, loop ou
 * gravação de terceiros. Determinístico: mesmo código, mesmo WAV.
 */
export const SR = 48000;
export const TAU = Math.PI * 2;

export const samples = (seconds: number): number => Math.round(seconds * SR);
export const midiToHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const dbToGain = (db: number): number => Math.pow(10, db / 20);
export const gainToDb = (g: number): number => 20 * Math.log10(Math.max(g, 1e-12));

/** PRNG mulberry32 — ruído reproduzível. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------ barramentos */

/** Barramento estéreo com duração fixa; sons são somados em instantes absolutos. */
export class Bus {
  readonly L: Float32Array;
  readonly R: Float32Array;
  constructor(readonly length: number) {
    this.L = new Float32Array(length);
    this.R = new Float32Array(length);
  }

  static seconds(s: number): Bus {
    return new Bus(samples(s));
  }

  /** Soma um sinal mono em `time` segundos, com ganho e pan (-1 esquerda, 1 direita). */
  addMono(time: number, sig: Float32Array, gain = 1, pan = 0): void {
    const [gl, gr] = panGains(pan);
    const start = samples(time);
    for (let i = 0; i < sig.length; i++) {
      const j = start + i;
      if (j < 0) continue;
      if (j >= this.length) break;
      this.L[j] += sig[i] * gain * gl;
      this.R[j] += sig[i] * gain * gr;
    }
  }

  addStereo(time: number, l: Float32Array, r: Float32Array, gain = 1): void {
    const start = samples(time);
    for (let i = 0; i < l.length; i++) {
      const j = start + i;
      if (j < 0) continue;
      if (j >= this.length) break;
      this.L[j] += l[i] * gain;
      this.R[j] += r[i] * gain;
    }
  }

  mixInto(dest: Bus, gain = 1): void {
    for (let i = 0; i < this.length; i++) {
      dest.L[i] += this.L[i] * gain;
      dest.R[i] += this.R[i] * gain;
    }
  }

  clone(): Bus {
    const b = new Bus(this.length);
    b.L.set(this.L);
    b.R.set(this.R);
    return b;
  }

  peak(): number {
    let p = 0;
    for (let i = 0; i < this.length; i++) p = Math.max(p, Math.abs(this.L[i]), Math.abs(this.R[i]));
    return p;
  }
}

/** Pan de potência constante. */
export function panGains(pan: number): [number, number] {
  const a = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  return [Math.cos(a), Math.sin(a)];
}

/* ------------------------------------------------------------- osciladores */

/** Correção PolyBLEP: tira o aliasing das descontinuidades de serra e quadrada. */
export function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

/** Serra com PolyBLEP. `phase` em [0, 1). */
export function saw(phase: number, dt: number): number {
  return 2 * phase - 1 - polyBlep(phase, dt);
}

export function square(phase: number, dt: number): number {
  let v = phase < 0.5 ? 1 : -1;
  v += polyBlep(phase, dt);
  v -= polyBlep((phase + 0.5) % 1, dt);
  return v;
}

/* ------------------------------------------------------------------ filtros */

/**
 * Filtro de estado variável TPT (Simper/Zavalishin): estável mesmo com o
 * corte variando amostra a amostra — é o que as varreduras usam.
 */
export class Svf {
  private ic1 = 0;
  private ic2 = 0;
  private a1 = 0;
  private a2 = 0;
  private a3 = 0;
  private k = 1;
  low = 0;
  band = 0;
  high = 0;

  constructor(cutoff = 1000, q = 0.707) {
    this.set(cutoff, q);
  }

  set(cutoff: number, q: number): void {
    const fc = Math.max(10, Math.min(cutoff, SR * 0.45));
    const g = Math.tan((Math.PI * fc) / SR);
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }

  process(v0: number): number {
    const v3 = v0 - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.low = v2;
    this.band = v1;
    this.high = v0 - this.k * v1 - v2;
    return v2;
  }
}

/** Biquad RBJ (Audio EQ Cookbook) para equalização fixa. */
export class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  static highpass(f: number, q = 0.707): Biquad {
    const b = new Biquad();
    const {cos, alpha} = omega(f, q);
    b.norm((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
    return b;
  }

  static lowpass(f: number, q = 0.707): Biquad {
    const b = new Biquad();
    const {cos, alpha} = omega(f, q);
    b.norm((1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
    return b;
  }

  static peaking(f: number, q: number, db: number): Biquad {
    const b = new Biquad();
    const A = Math.pow(10, db / 40);
    const {cos, alpha} = omega(f, q);
    b.norm(1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A);
    return b;
  }

  static highShelf(f: number, db: number): Biquad {
    const b = new Biquad();
    const A = Math.pow(10, db / 40);
    const {cos, sin} = omega(f, 0.707);
    const alpha = (sin / 2) * Math.SQRT2; // S = 1
    const sq = 2 * Math.sqrt(A) * alpha;
    b.norm(
      A * (A + 1 + (A - 1) * cos + sq),
      -2 * A * (A - 1 + (A + 1) * cos),
      A * (A + 1 + (A - 1) * cos - sq),
      A + 1 - (A - 1) * cos + sq,
      2 * (A - 1 - (A + 1) * cos),
      A + 1 - (A - 1) * cos - sq,
    );
    return b;
  }

  /** Coeficientes diretos (já normalizados, a0 = 1). */
  static raw(b0: number, b1: number, b2: number, a1: number, a2: number): Biquad {
    const b = new Biquad();
    b.b0 = b0;
    b.b1 = b1;
    b.b2 = b2;
    b.a1 = a1;
    b.a2 = a2;
    return b;
  }

  private norm(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): void {
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

function omega(f: number, q: number) {
  const w = (TAU * f) / SR;
  const cos = Math.cos(w);
  const sin = Math.sin(w);
  return {cos, sin, alpha: sin / (2 * q)};
}

/** Aplica uma cadeia de biquads a um barramento, canal a canal. */
export function eq(bus: Bus, make: () => Biquad[]): void {
  for (const ch of [bus.L, bus.R]) {
    const chain = make();
    for (let i = 0; i < ch.length; i++) {
      let x = ch[i];
      for (const f of chain) x = f.process(x);
      ch[i] = x;
    }
  }
}

/* ----------------------------------------------------------------- efeitos */

/**
 * Reverb Freeverb (Jezar): 8 pentes com amortecimento em paralelo + 4
 * passa-tudo em série por canal. Devolve só o sinal molhado.
 */
export function freeverb(input: Bus, {room = 0.8, damp = 0.35, width = 1} = {}): Bus {
  const scale = SR / 44100;
  const combTuning = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpassTuning = [556, 441, 341, 225];
  const spread = 23;
  const feedback = room * 0.28 + 0.7;
  const damp1 = damp * 0.4;
  const damp2 = 1 - damp1;

  const makeComb = (len: number) => ({buf: new Float32Array(Math.round(len * scale)), idx: 0, store: 0});
  const makeAll = (len: number) => ({buf: new Float32Array(Math.round(len * scale)), idx: 0});

  const out = new Bus(input.length);
  const channels: [Float32Array, number][] = [
    [out.L, 0],
    [out.R, spread],
  ];
  const wetL = new Float32Array(input.length);
  const wetR = new Float32Array(input.length);
  const wets = [wetL, wetR];

  channels.forEach(([, offset], c) => {
    const combs = combTuning.map((t) => makeComb(t + offset));
    const alls = allpassTuning.map((t) => makeAll(t + offset));
    const w = wets[c];
    for (let i = 0; i < input.length; i++) {
      const x = (input.L[i] + input.R[i]) * 0.015;
      let acc = 0;
      for (const cb of combs) {
        const y = cb.buf[cb.idx];
        cb.store = y * damp2 + cb.store * damp1;
        cb.buf[cb.idx] = x + cb.store * feedback;
        cb.idx = (cb.idx + 1) % cb.buf.length;
        acc += y;
      }
      for (const ap of alls) {
        const b = ap.buf[ap.idx];
        const y = -acc + b;
        ap.buf[ap.idx] = acc + b * 0.5;
        ap.idx = (ap.idx + 1) % ap.buf.length;
        acc = y;
      }
      w[i] = acc;
    }
  });

  const wet1 = width / 2 + 0.5;
  const wet2 = (1 - width) / 2;
  for (let i = 0; i < input.length; i++) {
    out.L[i] = wetL[i] * wet1 + wetR[i] * wet2;
    out.R[i] = wetR[i] * wet1 + wetL[i] * wet2;
  }
  return out;
}

/** Delay pingue-pongue com passa-baixa na realimentação. */
export function pingPong(input: Bus, {time = 0.3, feedback = 0.35, tone = 3500} = {}): Bus {
  const d = samples(time);
  const out = new Bus(input.length);
  const bufL = new Float32Array(d);
  const bufR = new Float32Array(d);
  const lpL = new Svf(tone, 0.6);
  const lpR = new Svf(tone, 0.6);
  let idx = 0;
  for (let i = 0; i < input.length; i++) {
    const dl = bufL[idx];
    const dr = bufR[idx];
    out.L[i] = dl;
    out.R[i] = dr;
    // Entrada mono vai para a esquerda; a volta cruza os canais.
    bufL[idx] = (input.L[i] + input.R[i]) * 0.5 + lpR.process(dr) * feedback;
    bufR[idx] = lpL.process(dl) * feedback;
    idx = (idx + 1) % d;
  }
  return out;
}

/** Compressor feed-forward com joelho suave, detector de pico estéreo. */
export function compress(
  bus: Bus,
  {thresholdDb = -18, ratio = 3, attackMs = 8, releaseMs = 120, kneeDb = 6, makeupDb = 0} = {},
): void {
  const att = Math.exp(-1 / ((attackMs / 1000) * SR));
  const rel = Math.exp(-1 / ((releaseMs / 1000) * SR));
  let env = 0; // redução em dB (≤ 0)
  for (let i = 0; i < bus.length; i++) {
    const x = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]));
    const over = gainToDb(x) - thresholdDb;
    let gr = 0;
    if (over >= kneeDb / 2) gr = over * (1 / ratio - 1);
    else if (over > -kneeDb / 2) gr = ((1 / ratio - 1) * Math.pow(over + kneeDb / 2, 2)) / (2 * kneeDb);
    env = gr < env ? att * env + (1 - att) * gr : rel * env + (1 - rel) * gr;
    const g = dbToGain(env + makeupDb);
    bus.L[i] *= g;
    bus.R[i] *= g;
  }
}

/*
 * Pico real (inter-amostra): reconstrói o sinal em 4x com kernel de Lanczos
 * (a = 8) e devolve, para cada amostra, o maior valor absoluto ao redor dela.
 * É o que um conversor D/A — ou o encoder AAC — vai de fato produzir.
 */
const LANCZOS_A = 8;
const PHASES = [0.25, 0.5, 0.75].map((d) => {
  const taps: number[] = [];
  for (let m = -LANCZOS_A + 1; m <= LANCZOS_A; m++) {
    const x = d - m;
    const sinc = (v: number) => (v === 0 ? 1 : Math.sin(Math.PI * v) / (Math.PI * v));
    taps.push(sinc(x) * sinc(x / LANCZOS_A));
  }
  return taps;
});

export function truePeakEnvelope(ch: Float32Array): Float32Array {
  const n = ch.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.abs(ch[i]);
  for (let i = 0; i < n - 1; i++) {
    for (const taps of PHASES) {
      let v = 0;
      for (let k = 0; k < taps.length; k++) {
        const j = i + k - LANCZOS_A + 1;
        if (j >= 0 && j < n) v += ch[j] * taps[k];
      }
      const a = Math.abs(v);
      if (a > out[i]) out[i] = a;
      if (a > out[i + 1]) out[i + 1] = a;
    }
  }
  return out;
}

/**
 * Limitador brickwall de pico real com antecipação: o ganho mínimo da janela
 * chega antes do pico, suavizado por média móvel — nem amostra nem pico
 * inter-amostra passam do teto.
 */
export function limit(bus: Bus, {ceilingDb = -1.5, lookaheadMs = 1.5, releaseMs = 80} = {}): void {
  const ceil = dbToGain(ceilingDb);
  const la = Math.max(1, samples(lookaheadMs / 1000));
  const n = bus.length;
  const tpL = truePeakEnvelope(bus.L);
  const tpR = truePeakEnvelope(bus.R);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(tpL[i], tpR[i]);
    need[i] = p > ceil ? ceil / p : 1;
  }
  // Mínimo numa janela de ±la amostras.
  const minWin = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let m = 1;
    const a = Math.max(0, i - la);
    const b = Math.min(n - 1, i + la);
    for (let j = a; j <= b; j++) if (need[j] < m) m = need[j];
    minWin[i] = m;
  }
  // Média móvel centrada de la+1 amostras: fica ≤ ao exigido em cada pico.
  const half = Math.floor(la / 2);
  const rel = Math.exp(-1 / ((releaseMs / 1000) * SR));
  let g = 1;
  let acc = 0;
  let count = 0;
  const avg = new Float32Array(n);
  for (let i = 0; i < n + half; i++) {
    if (i < n) {
      acc += minWin[i];
      count++;
    }
    if (i - la - 1 >= 0 && i - la - 1 < n) {
      acc -= minWin[i - la - 1];
      count--;
    }
    const c = i - half;
    if (c >= 0 && c < n) avg[c] = acc / count;
  }
  for (let i = 0; i < n; i++) {
    const target = Math.min(avg[i], minWin[i]);
    g = target < g ? target : rel * g + (1 - rel) * target;
    const l = bus.L[i] * g;
    const r = bus.R[i] * g;
    bus.L[i] = Math.max(-ceil, Math.min(ceil, l));
    bus.R[i] = Math.max(-ceil, Math.min(ceil, r));
  }
}

/** Saturação suave normalizada. */
export const drive = (x: number, amount: number): number => Math.tanh(amount * x) / Math.tanh(amount);

/* --------------------------------------------------------------- loudness */

/**
 * Loudness integrado ITU-R BS.1770-4 (LUFS): ponderação K em 48 kHz, blocos de
 * 400 ms com 75% de sobreposição, portas absoluta (-70) e relativa (-10).
 */
export function integratedLoudness(bus: Bus): number {
  const kw = (ch: Float32Array) => {
    const pre = Biquad.raw(1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585);
    const rlb = Biquad.raw(1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621);
    const out = new Float32Array(ch.length);
    for (let i = 0; i < ch.length; i++) out[i] = rlb.process(pre.process(ch[i]));
    return out;
  };
  const l = kw(bus.L);
  const r = kw(bus.R);
  const block = samples(0.4);
  const hop = samples(0.1);
  const powers: number[] = [];
  for (let s = 0; s + block <= bus.length; s += hop) {
    let zl = 0;
    let zr = 0;
    for (let i = s; i < s + block; i++) {
      zl += l[i] * l[i];
      zr += r[i] * r[i];
    }
    powers.push(zl / block + zr / block);
  }
  const lufs = (p: number) => -0.691 + 10 * Math.log10(p);
  const abs = powers.filter((p) => lufs(p) > -70);
  if (!abs.length) return -Infinity;
  const relGate = lufs(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((p) => lufs(p) > relGate);
  return lufs(gated.reduce((a, b) => a + b, 0) / gated.length);
}

/* --------------------------------------------------------------------- WAV */

/** WAV PCM 16 bits estéreo, com dither TPDF. */
export function toWav(bus: Bus, seed = 1): Buffer {
  const rand = rng(seed);
  const n = bus.length;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const x = (c === 0 ? bus.L : bus.R)[i];
      const dither = (rand() - rand()) / 32768;
      const v = Math.max(-1, Math.min(1, x + dither));
      data.writeInt16LE(Math.round(v * 32767), i * 4 + c * 2);
    }
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // estéreo
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
