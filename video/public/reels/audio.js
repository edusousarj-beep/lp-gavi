/*
 * Trilha e efeitos do Reels "Call", 100% Web Audio API (osciladores, ruído,
 * filtros, reverb de convolução, delay, compressor). Nada gravado, nada de
 * terceiros.
 *
 * buildSoundtrack(ctx) agenda tudo num AudioContext (tocar ao vivo, na prévia)
 * ou num OfflineAudioContext (gerar o arquivo do vídeo). Os tempos vêm de
 * render.js: cada som cai no quadro do seu evento visual.
 *
 * 120 BPM, eletrônica elegante. Compasso = 2 s, começando em 1,0 s, para o
 * drop (3,0 s) cair no tempo forte.
 */
import {BEAT, DURATION, T, counterTimes} from './render.js';

const BAR = 4 * BEAT;
const barAt = (n) => 1.0 + (n - 1) * BAR;
const STEP = BEAT / 4; // semicolcheia: 0,125 s

const CHORDS = {
  Am9: {bass: 33, notes: [60, 64, 67, 71]},
  Fmaj9: {bass: 29, notes: [57, 60, 64, 67]},
  Cmaj7: {bass: 36, notes: [59, 62, 64, 67]},
  G6: {bass: 31, notes: [59, 62, 64, 69]},
  Cmaj9: {bass: 36, notes: [60, 64, 67, 71, 74]},
};

// compasso → acorde e groove (o compasso 2 começa no drop, 3,0 s)
const PLAN = [
  {bar: 2, chord: 'Am9', groove: 'full'},
  {bar: 3, chord: 'Fmaj9', groove: 'full'},
  {bar: 4, chord: 'Cmaj7', groove: 'full'},
  {bar: 5, chord: 'G6', groove: 'full'},
  {bar: 6, chord: 'Am9', groove: 'full'},
  {bar: 7, chord: 'Fmaj9', groove: 'full'},
  {bar: 8, chord: 'Cmaj7', groove: 'light'}, // cena clara: meio tempo
  {bar: 9, chord: 'G6', groove: 'light'},
  {bar: 10, chord: 'Am9', groove: 'full'},
  {bar: 11, chord: 'Fmaj9', groove: 'build'}, // a batida sai em 22,0 s; virada até a logo
];

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const db = (d) => Math.pow(10, d / 20);

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
  const rnd = seeded(31337);
  const noise = makeNoise(ac, 2, rnd);

  /* ------------------------------------------------ mixagem e efeitos */
  const mute = ac.createGain(); // silêncio dramático e fade final
  mute.connect(ac.destination);
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 8;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.008;
  comp.release.value = 0.16;
  comp.connect(mute);
  const master = gain(ac, 0.8, comp);

  const verb = ac.createConvolver();
  verb.buffer = makeImpulse(ac, 2.6, 2.6, rnd);
  verb.connect(gain(ac, 0.3, master));

  const delay = ac.createDelay(2);
  delay.delayTime.value = 3 * STEP; // colcheia pontuada
  const fb = gain(ac, 0.3);
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2800;
  delay.connect(tone);
  tone.connect(fb);
  fb.connect(delay);
  tone.connect(gain(ac, 0.28, master));

  const bus = {
    drums: gain(ac, 0.9, master),
    bass: gain(ac, 0.7, master),
    keys: gain(ac, 0.5, master),
    pads: gain(ac, 0.3, master),
    fx: gain(ac, 0.8, master),
  };

  /* ------------------------------------------------ instrumentos */
  const kicks = [];

  function kick(t, g = 1) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    const a = env(ac, t, 0.003, 0.42, g);
    o.connect(a);
    a.connect(bus.drums);
    o.start(t);
    o.stop(t + 0.5);
    noiseHit(t, 0.012, 'highpass', 2500, 0.18 * g, bus.drums);
    kicks.push(t);
  }

  function clap(t, g = 1) {
    const src = noiseSrc(t, 0.35);
    const f = filter(ac, 'bandpass', 1400, 0.9);
    const a = ac.createGain();
    a.gain.setValueAtTime(0, t);
    [0, 0.011, 0.023].forEach((d) => {
      a.gain.setValueAtTime(0.9 * g, t + d);
      a.gain.exponentialRampToValueAtTime(0.15 * g, t + d + 0.01);
    });
    a.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    src.connect(f);
    f.connect(a);
    a.connect(bus.drums);
    a.connect(gain(ac, 0.25, verb));
  }

  function hat(t, open = false, g = 0.3) {
    noiseHit(t, open ? 0.22 : 0.045, 'highpass', open ? 7000 : 8000, g, bus.drums);
  }

  function shaker(t, g = 0.1) {
    noiseHit(t, 0.03, 'bandpass', 9500, g, bus.drums);
  }

  function snare(t, g = 0.5) {
    noiseHit(t, 0.12, 'bandpass', 2200, g, bus.drums, 0.7);
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(230, t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    const a = env(ac, t, 0.002, 0.1, 0.35 * g);
    o.connect(a);
    a.connect(bus.drums);
    o.start(t);
    o.stop(t + 0.15);
  }

  function bassNote(t, midi, dur, g = 0.8) {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz(midi);
    const sub = ac.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = hz(midi);
    const f = filter(ac, 'lowpass', 900, 1.2);
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(240, t + Math.min(dur, 0.25));
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g * 0.5, t + 0.006);
    a.gain.setValueAtTime(g * 0.5, t + dur - 0.05);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    sub.connect(f);
    f.connect(a);
    a.connect(bus.bass);
    o.start(t);
    sub.start(t);
    o.stop(t + dur + 0.02);
    sub.stop(t + dur + 0.02);
  }

  function pad(t, name, dur, g = 0.5, cutoff = 1300, attack = 0.5) {
    const ch = CHORDS[name];
    const f = filter(ac, 'lowpass', cutoff, 0.6);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.linearRampToValueAtTime(g, t + attack);
    a.gain.setValueAtTime(g, t + dur - 0.5);
    a.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
    f.connect(a);
    a.connect(bus.pads);
    a.connect(gain(ac, 0.6, verb));
    [...ch.notes, ch.bass + 24].forEach((m, i) => {
      [-7, 7].forEach((cents) => {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(m);
        o.detune.value = cents + (i % 2 ? 3 : -3);
        const v = gain(ac, 0.09, f);
        o.connect(v);
        o.start(t);
        o.stop(t + dur + 0.4);
      });
    });
  }

  function stab(t, name, dur = 0.18, g = 0.35) {
    const ch = CHORDS[name];
    const f = filter(ac, 'lowpass', 3200, 0.8);
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + dur);
    const a = env(ac, t, 0.004, dur, g);
    f.connect(a);
    a.connect(bus.keys);
    a.connect(gain(ac, 0.3, verb));
    ch.notes.forEach((m) => {
      const o = ac.createOscillator();
      o.type = 'square';
      o.frequency.value = hz(m + 12);
      const v = gain(ac, 0.12, f);
      o.connect(v);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  function pluck(t, midi, g = 0.5, pan = 0) {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz(midi);
    const o2 = ac.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = hz(midi + 12);
    const f = filter(ac, 'lowpass', 5000, 1);
    f.frequency.setValueAtTime(5200, t);
    f.frequency.exponentialRampToValueAtTime(800, t + 0.35);
    const a = env(ac, t, 0.003, 0.45, g);
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    o.connect(f);
    o2.connect(gain(ac, 0.25, f));
    f.connect(a);
    a.connect(p);
    p.connect(bus.keys);
    p.connect(gain(ac, 0.5, delay));
    p.connect(gain(ac, 0.35, verb));
    o.start(t);
    o2.start(t);
    o.stop(t + 0.5);
    o2.stop(t + 0.5);
  }

  function bell(t, midi, g = 0.3, pan = 0) {
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    p.connect(bus.fx);
    p.connect(gain(ac, 0.7, verb));
    [
      [1, 1, 1.6],
      [2.76, 0.4, 0.9],
      [5.4, 0.18, 0.5],
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

  function tick(t, pitch = 2800, g = 0.12, pan = 0) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = pitch;
    const a = env(ac, t, 0.001, 0.035, g);
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    o.connect(a);
    a.connect(p);
    p.connect(bus.fx);
    o.start(t);
    o.stop(t + 0.05);
  }

  function beep(t, freq, g = 0.22) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const a = env(ac, t, 0.003, 0.16, g);
    o.connect(a);
    a.connect(bus.fx);
    a.connect(gain(ac, 0.3, verb));
    o.start(t);
    o.stop(t + 0.2);
  }

  function pop(t, g = 0.3, from = 480, to = 1100) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + 0.06);
    const a = env(ac, t, 0.002, 0.09, g);
    o.connect(a);
    a.connect(bus.fx);
    o.start(t);
    o.stop(t + 0.12);
  }

  function swipe(t, g = 0.18) {
    const src = noiseSrc(t, 0.3);
    const f = filter(ac, 'bandpass', 1200, 1.4);
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + 0.2);
    const a = env(ac, t, 0.03, 0.22, g);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
  }

  function whoosh(t, dur, from, to, g = 0.35, panFrom = 0, panTo = 0) {
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
    p.connect(gain(ac, 0.3, verb));
  }

  function riser(t, dur, g = 0.25) {
    const src = noiseSrc(t, dur);
    const f = filter(ac, 'highpass', 250, 0.8);
    f.frequency.setValueAtTime(250, t);
    f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + dur);
    a.gain.setValueAtTime(0.0001, t + dur + 0.01);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + dur);
    const lp = filter(ac, 'lowpass', 1800, 0.7);
    const b = ac.createGain();
    b.gain.setValueAtTime(0.0001, t);
    b.gain.exponentialRampToValueAtTime(g * 0.25, t + dur);
    b.gain.setValueAtTime(0.0001, t + dur + 0.01);
    o.connect(lp);
    lp.connect(b);
    b.connect(bus.fx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function swell(t, dur, g = 0.3) {
    const src = noiseSrc(t, dur);
    const f = filter(ac, 'lowpass', 500, 0.7);
    f.frequency.setValueAtTime(500, t);
    f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + dur);
    a.gain.setValueAtTime(0.0001, t + dur + 0.005);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
  }

  function impact(t, g = 0.8) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(72, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 0.9);
    const a = env(ac, t, 0.004, 1.3, g);
    o.connect(a);
    a.connect(bus.fx);
    o.start(t);
    o.stop(t + 1.4);
    noiseHit(t, 0.5, 'lowpass', 900, 0.45 * g, bus.fx);
    noiseHit(t, 0.9, 'highpass', 5000, 0.12 * g, bus.fx);
    const r = gain(ac, 0.5, verb);
    a.connect(r);
  }

  function liquid(t, dur, g = 0.35, low = false) {
    // ruído filtrado com wobble + um "bloop" que desce: soa como líquido
    const src = noiseSrc(t, dur);
    const f = filter(ac, 'bandpass', low ? 900 : 1600, 3);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 7;
    const depth = gain(ac, low ? 300 : 600);
    lfo.connect(depth);
    depth.connect(f.frequency);
    f.frequency.setValueAtTime(low ? 1400 : 2600, t);
    f.frequency.exponentialRampToValueAtTime(low ? 300 : 600, t + dur);
    const a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + dur * 0.4);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(a);
    a.connect(bus.fx);
    a.connect(gain(ac, 0.4, verb));
    lfo.start(t);
    lfo.stop(t + dur);
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(low ? 380 : 620, t + dur * 0.35);
    o.frequency.exponentialRampToValueAtTime(low ? 120 : 210, t + dur * 0.8);
    const b = env(ac, t + dur * 0.35, 0.01, dur * 0.5, g * 0.5);
    o.connect(b);
    b.connect(bus.fx);
    o.start(t + dur * 0.35);
    o.stop(t + dur);
  }

  function shimmer(t, g = 0.2) {
    [84, 88, 91, 95, 100].forEach((m, i) => bell(t + i * 0.035, m, g * (1 - i * 0.12), (i % 2 ? 0.4 : -0.4)));
  }

  function plim(t, g = 0.4) {
    // notificação: duas notas que sobem, com brilho de sino
    bell(t, 84, g, -0.1); // C6
    bell(t + 0.09, 91, g * 0.9, 0.1); // G6
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

  /* ------------------------------------------------ partitura */

  // 0–3 s · gancho: tique-taque, contagem, silêncio, subida
  pad(0, 'Am9', 2.6, 0.32, 700, 0.4);
  [0.0, 0.5].forEach((t, i) => tick(t, i % 2 ? 1400 : 1800, 0.14));
  T.s1.forEach((t, i) => tick(Math.max(0, t + 0.02), 3200 + i * 120, 0.05, i % 2 ? 0.3 : -0.3));
  pop(0.02, 0.22);
  [880, 988, 1175].forEach((f, i) => {
    beep(T.count[i], f, 0.2);
    kick(T.count[i], 0.55); // batimento
    whoosh(T.count[i], 0.22, 900, 3800, 0.12);
  });
  riser(T.count[0], T.silence[0] - T.count[0], 0.22);
  swell(T.silence[1], T.drop - T.silence[1], 0.35);
  // silêncio: corta tudo, inclusive o eco
  mute.gain.setValueAtTime(1, 0);
  mute.gain.setValueAtTime(1, T.silence[0] - 0.02);
  mute.gain.linearRampToValueAtTime(0, T.silence[0]);
  mute.gain.setValueAtTime(0, T.silence[1]);
  mute.gain.linearRampToValueAtTime(1, T.silence[1] + 0.02);
  // fade final
  mute.gain.setValueAtTime(1, DURATION - 0.3);
  mute.gain.linearRampToValueAtTime(0, DURATION);

  // drop
  impact(T.drop, 0.9);
  noiseHit(T.drop, 1.2, 'highpass', 6000, 0.18, bus.drums); // prato

  // groove por compasso
  for (const {bar, chord, groove} of PLAN) {
    const t0 = barAt(bar);
    const st = (s) => t0 + s * STEP;
    const ch = CHORDS[chord];
    pad(t0, chord, BAR, groove === 'light' ? 0.5 : 0.38, groove === 'light' ? 2200 : 1300);
    if (groove === 'full' || groove === 'build') {
      const steps = groove === 'build' ? 8 : 16; // na virada, a batida sai na metade
      for (let s = 0; s < steps; s++) {
        if (s % 4 === 0) kick(st(s), 1);
        if (s === 4 || s === 12) clap(st(s), 0.8);
        if (s % 4 === 2) hat(st(s), true, 0.22);
        shaker(st(s), s % 2 ? 0.06 : 0.1);
        if (s % 4 === 2) bassNote(st(s), ch.bass + (s === 14 ? 12 : 0), STEP * 1.6, 0.8);
      }
      if (groove === 'full') {
        stab(st(3), chord, 0.16, 0.22);
        stab(st(11), chord, 0.16, 0.18);
      }
    } else {
      // cena clara: meio tempo, arpejo leve
      kick(st(0), 0.8);
      kick(st(8), 0.7);
      hat(st(4), false, 0.16);
      hat(st(12), false, 0.16);
      bassNote(st(0), ch.bass, BAR * 0.9, 0.6);
      ch.notes.concat([...ch.notes].reverse()).forEach((m, i) => pluck(st(i * 2), m + 12, 0.16, i % 2 ? 0.35 : -0.35));
    }
  }
  // virada (22–23 s): caixa acelerando + subida até a logo
  for (let i = 0; i < 12; i++) {
    const t = 22.0 + (i < 8 ? i * STEP : 8 * STEP + (i - 8) * STEP * 0.5);
    snare(t, 0.15 + i * 0.03);
  }
  riser(T.grow, T.land - T.grow, 0.2);
  whoosh(T.flood, 0.5, 300, 4000, 0.3);

  // final: plim no pouso da bolhinha + acorde
  plim(T.land, 0.42);
  kick(T.land, 0.9);
  pad(T.land, 'Cmaj9', DURATION - T.land, 0.55, 2400, 0.08);
  bassNote(T.land, CHORDS.Cmaj9.bass, 1.6, 0.6);
  T.ctaPulses.forEach((t) => tick(t, 2400, 0.08));
  swipe(T.cta[2] + 0.05, 0.14);

  // cena 2
  bell(T.s2[6] + 0.05, 84, 0.22);
  swipe(T.s2[6] + 0.05, 0.12);
  T.s2Rings.forEach((t) => tick(t, 3000, 0.06));
  liquid(T.liquid1, 0.95, 0.35);

  // cena 3
  swipe(T.s3Title[3] + 0.05, 0.14);
  T.cards.forEach((t, i) => {
    pop(t, 0.16, 520 + i * 60, 1150 + i * 80);
    pluck(t, [69, 72, 76, 79][i], 0.35, -0.3 + i * 0.2);
  });
  swipe(T.s3Aud[5] + 0.05, 0.14);

  // portal + cena 4
  whoosh(T.portal, 0.65, 250, 3500, 0.35);
  riser(T.portal, 0.6, 0.12);
  counterTimes().forEach((t, i) => tick(t, 1500 + i * 100, 0.07, i % 2 ? 0.2 : -0.2));
  swipe(T.s4[5] + 0.05, 0.14);
  whoosh(T.s4Out, 0.35, 2500, 600, 0.15);
  pop(T.method, 0.14);
  T.tiles.forEach((t, i) => {
    pluck(t, [72, 76, 79, 83][i], 0.4, -0.3 + i * 0.2);
    tick(t, 2600, 0.06);
  });

  // clarão para a cena clara + cena 5
  shimmer(T.bloom, 0.16);
  whoosh(T.bloom, 0.4, 600, 6000, 0.25);
  bell(T.s5[1] + 0.05, 88, 0.2);
  T.s5.slice(2).forEach((t, i) => tick(t, 3000 + (i % 5) * 150, 0.035, i % 2 ? 0.25 : -0.25));
  liquid(T.liquid2, 0.75, 0.38, true);

  // cena 6
  impact(19.0, 0.7);
  bell(T.s6[6] + 0.05, 84, 0.22);
  swipe(T.s6[6] + 0.05, 0.12);
  T.s6Rings.forEach((t) => tick(t, 3000, 0.06));

  /* ------------------------------------------------ sidechain (abre espaço para o bumbo) */
  kicks.sort((a, b) => a - b);
  for (const [node, depth] of [
    [bus.pads, 0.5],
    [bus.keys, 0.35],
    [bus.bass, 0.3],
  ]) {
    const g = node.gain;
    const base = g.value;
    g.setValueAtTime(base, 0);
    let last = -1;
    for (const k of kicks) {
      if (k - last < 0.2) continue;
      g.setValueAtTime(base, Math.max(0, k - 0.002));
      g.linearRampToValueAtTime(base * (1 - depth), k + 0.01);
      g.linearRampToValueAtTime(base, k + 0.2);
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

function makeNoise(ac, seconds, rnd) {
  const b = ac.createBuffer(1, Math.round(ac.sampleRate * seconds), ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
  return b;
}

/** Resposta ao impulso sintética: ruído estéreo decaindo (reverb de sala). */
function makeImpulse(ac, seconds, decay, rnd) {
  const len = Math.round(ac.sampleRate * seconds);
  const b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}
