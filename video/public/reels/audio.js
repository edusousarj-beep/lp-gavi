/*
 * Trilha e efeitos do Reels "Carreira", 100% Web Audio API (osciladores, ruído,
 * filtros, reverb de convolução, compressor). Nada gravado, nada de terceiros.
 *
 * buildSoundtrack(ctx) agenda tudo num AudioContext (tocar ao vivo) ou num
 * OfflineAudioContext (gerar o arquivo do vídeo). Os tempos vêm de render.js:
 * cada som cai no quadro do seu evento visual.
 *
 * 120 BPM, escura e seca (como o exemplo): compasso de 2 s a partir de 0,
 * bumbo/palma no tempo, sub-grave, um som de passagem a cada troca de cena e
 * uma batida forte em cada palavra vermelha. Nas telas de leitura longa (o
 * cartão e a Bruna) o groove abre espaço: meio tempo e arpejo.
 */
import {BEAT, DURATION, SCENE_TRANSITIONS, T} from './render.js';

const BAR = 4 * BEAT;
const STEP = BEAT / 4; // semicolcheia: 0,125 s

const CHORDS = {
  Am9: {bass: 33, notes: [60, 64, 67, 71]},
  Fmaj9: {bass: 29, notes: [57, 60, 64, 67]},
  Dm9: {bass: 26, notes: [57, 60, 64, 65]},
  G6: {bass: 31, notes: [59, 62, 64, 69]},
  Cmaj7: {bass: 36, notes: [59, 62, 64, 67]},
  Cmaj9: {bass: 36, notes: [60, 64, 67, 71, 74]},
};

// acorde de cada compasso (2 s, começando em 0); o final (40,5 s) tem acorde próprio
const BARS = [
  'Am9', 'Am9', 'Fmaj9', 'Fmaj9', 'Dm9', 'Am9', 'Fmaj9', 'Dm9', 'Am9', 'Fmaj9', // 0–20
  'Dm9', 'G6', 'Am9', 'Cmaj7', 'Fmaj9', 'Cmaj7', 'Am9', 'Fmaj9', 'Dm9', 'G6', // 20–40
];

// seções do groove no tempo (s)
const SECTIONS = [
  {from: 0, to: 2.5, groove: 'intro'}, // gancho
  {from: 2.5, to: 15.5, groove: 'full'}, // executivo → reunião
  {from: 15.5, to: 20.5, groove: 'half'}, // cartão: meio tempo, espaço para ler
  {from: 20.5, to: 23.5, groove: 'build'}, // o mercado… → virada para "clareza"
  {from: 23.5, to: 25.5, groove: 'full'},
  {from: 25.5, to: 32.5, groove: 'light'}, // Bruna: respira
  {from: 32.5, to: 40, groove: 'full'}, // esforço → chamada
];

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSoundtrack(ac, {cta = 'saibamais'} = {}) {
  void cta; // a trilha é a mesma nas duas versões do final
  const rnd = seeded(4242);
  const noise = makeNoise(ac, 2, rnd);

  /* ------------------------------------------------ mixagem e efeitos */
  const fade = ac.createGain();
  fade.connect(ac.destination);
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -15;
  comp.knee.value = 6;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.14;
  comp.connect(fade);
  const master = gain(ac, 0.8, comp);

  // sala curta: seco, como o exemplo
  const verb = ac.createConvolver();
  verb.buffer = makeImpulse(ac, 1.4, 3.2, rnd);
  verb.connect(gain(ac, 0.22, master));

  const bus = {
    drums: gain(ac, 0.9, master),
    bass: gain(ac, 0.75, master),
    keys: gain(ac, 0.45, master),
    pads: gain(ac, 0.26, master),
    fx: gain(ac, 0.8, master),
  };

  /* ------------------------------------------------ instrumentos */
  const kicks = [];

  function kick(t, g = 1) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    const a = env(ac, t, 0.002, 0.36, g);
    o.connect(a);
    a.connect(bus.drums);
    o.start(t);
    o.stop(t + 0.45);
    noiseHit(t, 0.01, 'highpass', 3000, 0.16 * g, bus.drums);
    kicks.push(t);
  }

  function clap(t, g = 1) {
    const src = noiseSrc(t, 0.3);
    const f = filter(ac, 'bandpass', 1500, 1);
    const a = ac.createGain();
    a.gain.setValueAtTime(0, t);
    [0, 0.01, 0.021].forEach((d) => {
      a.gain.setValueAtTime(0.9 * g, t + d);
      a.gain.exponentialRampToValueAtTime(0.14 * g, t + d + 0.009);
    });
    a.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    src.connect(f);
    f.connect(a);
    a.connect(bus.drums);
    a.connect(gain(ac, 0.18, verb));
  }

  function hat(t, open = false, g = 0.26) {
    noiseHit(t, open ? 0.16 : 0.035, 'highpass', open ? 7200 : 8600, g, bus.drums);
  }

  function snare(t, g = 0.5) {
    noiseHit(t, 0.1, 'bandpass', 2400, g, bus.drums, 0.7);
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.07);
    const a = env(ac, t, 0.002, 0.09, 0.3 * g);
    o.connect(a);
    a.connect(bus.drums);
    o.start(t);
    o.stop(t + 0.12);
  }

  /** Sub-grave tipo 808: seno com um pouco de drive, nota que desliza de leve. */
  function sub(t, midi, dur, g = 0.85, glideFrom = 0) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(hz(midi + glideFrom), t);
    o.frequency.exponentialRampToValueAtTime(hz(midi), t + 0.06);
    const drive = ac.createWaveShaper();
    drive.curve = softClip(2.2);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g * 0.55, t + 0.008);
    a.gain.setValueAtTime(g * 0.55, t + Math.max(0.02, dur - 0.06));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(drive);
    drive.connect(a);
    a.connect(bus.bass);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function pad(t, name, dur, g = 0.5, cutoff = 1100, attack = 0.4) {
    const ch = CHORDS[name];
    const f = filter(ac, 'lowpass', cutoff, 0.6);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.linearRampToValueAtTime(g, t + attack);
    a.gain.setValueAtTime(g, t + dur - 0.3);
    a.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
    f.connect(a);
    a.connect(bus.pads);
    a.connect(gain(ac, 0.4, verb));
    [...ch.notes, ch.bass + 24].forEach((m, i) => {
      [-6, 6].forEach((cents) => {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(m);
        o.detune.value = cents + (i % 2 ? 3 : -3);
        const v = gain(ac, 0.085, f);
        o.connect(v);
        o.start(t);
        o.stop(t + dur + 0.3);
      });
    });
  }

  function stab(t, name, dur = 0.16, g = 0.32) {
    const ch = CHORDS[name];
    const f = filter(ac, 'lowpass', 2600, 0.8);
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(500, t + dur);
    const a = env(ac, t, 0.003, dur, g);
    f.connect(a);
    a.connect(bus.keys);
    a.connect(gain(ac, 0.25, verb));
    ch.notes.forEach((m) => {
      const o = ac.createOscillator();
      o.type = 'square';
      o.frequency.value = hz(m);
      const v = gain(ac, 0.11, f);
      o.connect(v);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  function pluck(t, midi, g = 0.4, pan = 0) {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz(midi);
    const o2 = ac.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = hz(midi + 12);
    const f = filter(ac, 'lowpass', 4200, 1);
    f.frequency.setValueAtTime(4400, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 0.3);
    const a = env(ac, t, 0.003, 0.38, g);
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    o.connect(f);
    o2.connect(gain(ac, 0.22, f));
    f.connect(a);
    a.connect(p);
    p.connect(bus.keys);
    p.connect(gain(ac, 0.3, verb));
    o.start(t);
    o2.start(t);
    o.stop(t + 0.42);
    o2.stop(t + 0.42);
  }

  function bell(t, midi, g = 0.3, pan = 0) {
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    p.connect(bus.fx);
    p.connect(gain(ac, 0.5, verb));
    [
      [1, 1, 1.3],
      [2.76, 0.38, 0.7],
      [5.4, 0.16, 0.4],
    ].forEach(([ratio, amp, dec]) => {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz(midi) * ratio;
      const a = env(ac, t, 0.002, dec, g * amp);
      o.connect(a);
      a.connect(p);
      o.start(t);
      o.stop(t + dec + 0.05);
    });
  }

  function tick(t, pitch = 2600, g = 0.1, pan = 0) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = pitch;
    const a = env(ac, t, 0.001, 0.03, g);
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    o.connect(a);
    a.connect(p);
    p.connect(bus.fx);
    o.start(t);
    o.stop(t + 0.045);
  }

  function pop(t, g = 0.25, from = 420, to = 1000) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + 0.05);
    const a = env(ac, t, 0.002, 0.08, g);
    o.connect(a);
    a.connect(bus.fx);
    o.start(t);
    o.stop(t + 0.1);
  }

  function swipe(t, g = 0.16) {
    const src = noiseSrc(t, 0.25);
    const f = filter(ac, 'bandpass', 1200, 1.4);
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(5000, t + 0.18);
    const a = env(ac, t, 0.025, 0.2, g);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
  }

  function whoosh(t, dur, from, to, g = 0.3, panFrom = 0, panTo = 0) {
    const src = noiseSrc(t, dur + 0.1);
    const f = filter(ac, 'bandpass', from, 1.1);
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + dur * 0.6);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ac.createStereoPanner();
    p.pan.setValueAtTime(panFrom, t);
    p.pan.linearRampToValueAtTime(panTo, t + dur);
    src.connect(f);
    f.connect(a);
    a.connect(p);
    p.connect(bus.fx);
    p.connect(gain(ac, 0.2, verb));
  }

  function riser(t, dur, g = 0.22) {
    const src = noiseSrc(t, dur);
    const f = filter(ac, 'highpass', 300, 0.8);
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + dur);
    a.gain.setValueAtTime(0.0001, t + dur + 0.01);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
  }

  function impact(t, g = 0.8) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.7);
    const a = env(ac, t, 0.003, 1.0, g);
    o.connect(a);
    a.connect(bus.fx);
    o.start(t);
    o.stop(t + 1.1);
    noiseHit(t, 0.35, 'lowpass', 1000, 0.4 * g, bus.fx);
    noiseHit(t, 0.6, 'highpass', 5500, 0.1 * g, bus.fx);
    a.connect(gain(ac, 0.35, verb));
  }

  function crash(t, g = 0.16) {
    noiseHit(t, 1.1, 'highpass', 6000, g, bus.drums);
  }

  /** Palavra vermelha: batida curta e encorpada (estalo + acorde abafado). */
  function wordHit(t, chord, g = 1) {
    kick(t, 0.75 * g);
    stab(t, chord, 0.14, 0.26 * g);
    noiseHit(t, 0.06, 'bandpass', 3200, 0.18 * g, bus.fx, 1.2);
  }

  /** Aviso de entrar na reunião: duas notas suaves que sobem (genérico). */
  function chime(t, g = 0.22) {
    bell(t, 76, g, -0.15);
    bell(t + 0.12, 81, g * 0.9, 0.15);
  }

  /** Papel batendo na parede + tachinha. */
  function thud(t, g = 0.5) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const a = env(ac, t, 0.002, 0.18, g);
    o.connect(a);
    a.connect(bus.fx);
    o.start(t);
    o.stop(t + 0.22);
    noiseHit(t, 0.09, 'lowpass', 1800, 0.3 * g, bus.fx);
  }

  function click(t, g = 0.2) {
    noiseHit(t, 0.012, 'highpass', 4000, g, bus.fx);
    tick(t + 0.004, 1800, g * 0.5);
  }

  /** "Não": nota curta que desce. */
  function nope(t, g = 0.16) {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(hz(64), t);
    o.frequency.exponentialRampToValueAtTime(hz(57), t + 0.12);
    const a = env(ac, t, 0.004, 0.18, g);
    o.connect(a);
    a.connect(bus.keys);
    o.start(t);
    o.stop(t + 0.22);
  }

  /** Caneta escrevendo: ruído com modulação rápida. */
  function scribble(t, dur, g = 0.12) {
    const src = noiseSrc(t, dur);
    const f = filter(ac, 'bandpass', 3800, 1.6);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    const n = Math.floor(dur / 0.055);
    for (let k = 0; k < n; k++) {
      const tk = t + k * 0.055;
      a.gain.setValueAtTime(0.0001, tk);
      a.gain.linearRampToValueAtTime(g * (0.6 + 0.4 * rnd()), tk + 0.02);
      a.gain.linearRampToValueAtTime(0.0001, tk + 0.05);
    }
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
  }

  function scratch(t, g = 0.16) {
    const src = noiseSrc(t, 0.2);
    const f = filter(ac, 'bandpass', 2500, 2);
    f.frequency.setValueAtTime(2000, t);
    f.frequency.exponentialRampToValueAtTime(5000, t + 0.16);
    const a = env(ac, t, 0.01, 0.18, g);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
  }

  function keyClick(t, g = 0.09) {
    noiseHit(t, 0.018, 'bandpass', 2800 + 1200 * rnd(), g, bus.fx, 2);
  }

  /** Dardo no alvo: batida seca de madeira + vibração. */
  function dart(t, g = 0.35) {
    noiseHit(t, 0.04, 'bandpass', 900, g, bus.fx, 1.5);
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = 190;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 18;
    const depth = gain(ac, 30);
    lfo.connect(depth);
    depth.connect(o.frequency);
    const a = env(ac, t, 0.003, 0.35, g * 0.5);
    o.connect(a);
    a.connect(bus.fx);
    o.start(t);
    lfo.start(t);
    o.stop(t + 0.4);
    lfo.stop(t + 0.4);
  }

  function noiseSrc(t, dur) {
    const s = ac.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    s.loopStart = 0;
    s.loopEnd = noise.duration;
    s.start(t, rnd() * 1.5);
    s.stop(t + dur + 0.05);
    return s;
  }

  function noiseHit(t, dur, type, freq, g, dest, q = 0.8) {
    const src = noiseSrc(t, dur);
    const f = filter(ac, type, freq, q);
    const a = env(ac, t, 0.001, dur, g);
    src.connect(f);
    f.connect(a);
    a.connect(dest);
  }

  /* ------------------------------------------------ groove */

  BARS.forEach((chord, n) => {
    const t0 = n * BAR;
    const light = t0 >= 25.5 && t0 < 32.5;
    pad(t0, chord, BAR, light ? 0.42 : 0.32, light ? 1900 : 950);
  });
  const chordAt = (t) => CHORDS[BARS[Math.min(BARS.length - 1, Math.floor(t / BAR + 1e-6))]];

  for (const {from, to, groove} of SECTIONS) {
    for (let k = Math.round(from / STEP); k < Math.round(to / STEP); k++) {
      const t = k * STEP;
      const s = k % 16; // passo dentro do compasso
      const ch = chordAt(t);
      if (groove === 'intro') {
        // gancho: só o pulso (tique no tempo) e o grave entrando
        if (s % 2 === 0) hat(t, false, s % 4 ? 0.1 : 0.16);
        if (k === 0) {
          kick(t, 0.8);
          sub(t, ch.bass, 0.9, 0.6);
        }
      } else if (groove === 'half') {
        // meio tempo: bumbo no 1, palma no 3, chimbal leve
        if (s === 0) {
          kick(t, 0.9);
          sub(t, ch.bass, STEP * 7, 0.75);
        }
        if (s === 10) kick(t, 0.5);
        if (s === 8) clap(t, 0.65);
        if (s % 2 === 0) hat(t, false, s % 4 ? 0.1 : 0.15);
        if (s === 6) stab(t, Object.keys(CHORDS).find((n) => CHORDS[n] === ch), 0.12, 0.12);
      } else if (groove === 'light') {
        // Bruna: respira — bumbo leve, arpejo limpo
        if (s === 0 || s === 8) {
          kick(t, s ? 0.5 : 0.75);
          sub(t, ch.bass, 0.95, 0.55);
        }
        if (s === 4 || s === 12) hat(t, false, 0.12);
        if (s % 2 === 0) {
          const notes = ch.notes.concat([...ch.notes].reverse());
          pluck(t, notes[(s / 2) % notes.length] + 12, 0.14, s % 4 ? 0.3 : -0.3);
        }
      } else {
        if (s === 0 || s === 8 || (s === 14 && Math.floor(k / 16) % 2)) kick(t, s === 14 ? 0.6 : 1);
        if (s === 4 || s === 12) clap(t, 0.75);
        if (s % 2 === 0) hat(t, s % 4 === 2, s % 4 === 2 ? 0.16 : 0.22);
        else if (groove === 'build' || s === 15) hat(t, false, 0.12);
        if (s === 0) sub(t, ch.bass, STEP * 5.5, 0.85);
        if (s === 8) sub(t, ch.bass, STEP * 4.5, 0.8);
        if (s === 14) sub(t, ch.bass + 12, STEP * 1.8, 0.6, -5);
        if (s === 6) stab(t, Object.keys(CHORDS).find((n) => CHORDS[n] === ch), 0.12, 0.16);
      }
    }
  }

  /* ------------------------------------------------ passagens (uma por troca de cena) */

  for (const tr of SCENE_TRANSITIONS) {
    if (tr.type === 'cross') whoosh(tr.a - 0.05, 0.4, 3500, 500, 0.2);
    else if (tr.type === 'bloom') whoosh(tr.a - 0.02, 0.45, 500, 7000, 0.28);
    else if (tr.to === 'white') whoosh(tr.a - 0.03, 0.4, 600, 6000, 0.26);
    else whoosh(tr.a - 0.03, 0.4, 5000, 400, 0.26);
  }

  /* ------------------------------------------------ cenas */

  const ticks = (times, g = 0.05) => times.forEach((t, i) => tick(Math.max(0, t + 0.02), 2800 + (i % 4) * 140, g, i % 2 ? 0.25 : -0.25));

  // 1 · gancho
  impact(0, 0.45);
  ticks(T.s1);
  wordHit(T.anos, 'Am9', 1.1);
  crash(T.anos, 0.1);
  // 2 · executivo
  whoosh(T.figure, 0.5, 300, 1500, 0.16);
  pop(T.bubble, 0.22);
  ticks(T.s2);
  wordHit(T.carreira, 'Am9');
  tick(T.lugar[0] + 0.02, 2600, 0.06);
  wordHit(T.lugarHit, 'Fmaj9', 1.2);
  snare(T.lugarHit, 0.5);
  // 3
  ticks(T.s3.slice(0, 3));
  wordHit(T.pratica, 'Dm9', 1.1);
  riser(SCENE_TRANSITIONS[2].a - 0.5, 0.5, 0.16);
  // 4
  wordHit(T.decoreba, 'Dm9');
  pop(T.parrot + 0.03, 0.18, 700, 1500);
  // 5 · reunião
  chime(T.call + 0.02, 0.2);
  T.tiles.forEach((t, i) => tick(t, 2200 + i * 200, 0.06, -0.3 + i * 0.2));
  wordHit(T.reuniao, 'Am9');
  ticks(T.s5b.slice(0, 4), 0.045);
  wordHit(T.promocao, 'Fmaj9', 1.1);
  crash(T.promocao, 0.08);
  // 6 · cartão
  whoosh(T.card, 0.33, 2500, 400, 0.18);
  thud(T.pin, 0.5);
  click(T.pin + 0.01, 0.22);
  T.items.forEach((t) => nope(t, 0.15));
  // 7 · o mercado / clareza
  pop(T.circle, 0.16, 300, 700);
  scribble(T.mercado, 0.5, 0.11);
  wordHit(T.premia, 'Dm9', 0.8);
  scratch(T.strike, 0.16);
  tick(T.s7b[0] + 0.02, 2600, 0.06);
  for (let i = 0; i < 8; i++) snare(T.clareza - 0.5 + i * (STEP / 2), 0.1 + i * 0.04);
  riser(T.clareza - 0.55, 0.55, 0.18);
  wordHit(T.clareza, 'G6', 1.3);
  impact(T.clareza, 0.7);
  crash(T.clareza, 0.16);
  // 8 · Bruna: cada linha que entra tem um toque suave
  pop(T.avatar, 0.18);
  tick(T.heading + 0.02, 2400, 0.05);
  tick(T.name + 0.02, 2600, 0.06);
  T.creds.forEach((t) => tick(t + 0.02, 3000, 0.04));
  pluck(T.offer, 72, 0.3);
  T.chips.forEach((t, i) => pluck(t, [76, 79][i], 0.3, i ? 0.25 : -0.25));
  T.dot.forEach((t) => {
    bell(t, 88, 0.14, 0.2);
    bell(t + 0.09, 95, 0.11, 0.2);
  });
  // 9 · esforço / jeito certo + dardo
  ticks(T.s9a.slice(0, 3));
  wordHit(T.esforca, 'Am9');
  ticks(T.s9b.slice(0, 3));
  wordHit(T.certo, 'Fmaj9', 1.1);
  dart(T.target + 0.01, 0.4);
  // 10 · chamada
  ticks(T.s10, 0.045);
  wordHit(T.saiba, 'Dm9', 1.2);
  crash(T.saiba, 0.1);
  wordHit(T.mude, 'Dm9', 0.9);
  T.arrows.forEach((t) => tick(t, 2200, 0.07));
  riser(SCENE_TRANSITIONS[9].a - 0.6, 0.6, 0.2);
  // 11 · final: logo + acorde aberto + chamada
  impact(T.final, 0.55);
  kick(T.final, 0.8);
  bell(T.final + 0.02, 84, 0.24, -0.1);
  bell(T.final + 0.11, 91, 0.2, 0.1);
  pad(T.final, 'Cmaj9', DURATION - T.final, 0.5, 2200, 0.08);
  sub(T.final, CHORDS.Cmaj9.bass, 1.6, 0.55);
  T.cta.forEach((t, i) => tick(t + 0.02, 2600 + i * 200, 0.06));
  swipe(T.cta[2] + 0.05, 0.13);
  T.ctaPulses.forEach((t) => tick(t, 2400, 0.08));

  // fade final
  fade.gain.setValueAtTime(1, 0);
  fade.gain.setValueAtTime(1, DURATION - 0.3);
  fade.gain.linearRampToValueAtTime(0, DURATION);

  /* ------------------------------------------------ sidechain (abre espaço para o bumbo) */
  kicks.sort((a, b) => a - b);
  for (const [node, depth] of [
    [bus.pads, 0.5],
    [bus.keys, 0.3],
    [bus.bass, 0.25],
  ]) {
    const g = node.gain;
    const base = g.value;
    g.setValueAtTime(base, 0);
    let last = -1;
    for (const k of kicks) {
      if (k - last < 0.2) continue;
      g.setValueAtTime(base, Math.max(0, k - 0.002));
      g.linearRampToValueAtTime(base * (1 - depth), k + 0.01);
      g.linearRampToValueAtTime(base, k + 0.18);
      last = k;
    }
  }
}

/* ------------------------------------------------ peças do grafo */

function gain(ac, value, dest) {
  const g = ac.createGain();
  g.gain.value = value;
  if (dest) g.connect(dest);
  return g;
}

function filter(ac, type, freq, q) {
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Envelope percussivo: sobe em `attack`, cai exponencialmente até `dur`. */
function env(ac, t, attack, dur, peak) {
  const a = ac.createGain();
  a.gain.setValueAtTime(0.0001, t);
  a.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  return a;
}

/** Curva de saturação suave (tanh) para o sub-grave. */
function softClip(k) {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return c;
}

function makeNoise(ac, seconds, rnd) {
  const b = ac.createBuffer(1, Math.round(ac.sampleRate * seconds), ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
  return b;
}

/** Resposta ao impulso sintética: ruído estéreo decaindo (sala curta). */
function makeImpulse(ac, seconds, decay, rnd) {
  const len = Math.round(ac.sampleRate * seconds);
  const b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}
