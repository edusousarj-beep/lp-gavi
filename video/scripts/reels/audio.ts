/*
 * Gera public/audio/call.wav: a trilha de public/reels/audio.js (Web Audio API)
 * renderizada num OfflineAudioContext dentro do Chromium, quadro a quadro com
 * a animação. Depois só o master: −14 LUFS e pico real ≤ −2 dBTP (dsp.ts).
 *
 *   npx tsx scripts/reels/audio.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {Bus, dbToGain, integratedLoudness, limit, SR, toWav} from '../audio/dsp';
import {decodeF32, withPage} from './browser';

const rendered = await withPage((page) =>
  page.evaluate(async ({sampleRate, urls}) => {
    // URLs como parâmetro: o TypeScript não tenta resolver módulos do navegador.
    const {buildSoundtrack} = await import(urls.audio);
    const {DURATION, T} = await import(urls.render);
    const ctx = new OfflineAudioContext(2, Math.round(DURATION * sampleRate), sampleRate);
    buildSoundtrack(ctx);
    const buf = await ctx.startRendering();
    const enc = (f: Float32Array) => {
      const u8 = new Uint8Array(f.buffer.slice(0));
      let s = '';
      for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + 0x8000)));
      return btoa(s);
    };
    return {L: enc(buf.getChannelData(0)), R: enc(buf.getChannelData(1)), length: buf.length, sr: buf.sampleRate, T};
  }, {sampleRate: SR, urls: {audio: '/reels/audio.js', render: '/reels/render.js'}}),
);

if (rendered.sr !== SR) throw new Error(`taxa inesperada: ${rendered.sr}`);
const raw = new Bus(rendered.length);
raw.L.set(decodeF32(rendered.L));
raw.R.set(decodeF32(rendered.R));

// Master: ganho até −14 LUFS com limitador de pico real (mesmo das outras peças).
let gain = 1;
let out = raw;
let loudness = -Infinity;
for (let iter = 0; iter < 8; iter++) {
  const test = raw.clone();
  for (let i = 0; i < test.length; i++) {
    test.L[i] *= gain;
    test.R[i] *= gain;
  }
  limit(test, {ceilingDb: -2, lookaheadMs: 1.5, releaseMs: 80});
  loudness = integratedLoudness(test);
  out = test;
  if (Math.abs(loudness + 14) < 0.15) break;
  gain *= dbToGain(-14 - loudness);
}

const T = rendered.T as {drop: number; land: number; silence: [number, number]};
const dir = path.resolve('public/audio');
fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, 'call.wav'), toWav(out));
const frame = (s: number) => Math.round(s * 30);
fs.writeFileSync(
  path.join(dir, 'call.cues.json'),
  JSON.stringify(
    {
      fps: 30,
      sampleRate: SR,
      duration: out.length / SR,
      silence: T.silence,
      // peça sem cortes secos e com algo acontecendo a cada meio segundo (briefing)
      smooth: true,
      maxIdle: 0.5,
      sync: {drop: T.drop, virada: 19.0, logo: T.land},
      marks: [
        ['drop', T.drop, frame(T.drop)],
        ['virada', 19.0, frame(19.0)],
        ['logo', T.land, frame(T.land)],
      ],
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({trilha: 'call', segundos: out.length / SR, lufs: +loudness.toFixed(2), ganhoDb: +(20 * Math.log10(gain)).toFixed(2)}));
