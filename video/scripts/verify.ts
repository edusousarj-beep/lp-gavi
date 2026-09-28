/*
 * Verificação do MP4 final. Não confia em metadado: decodifica os 720
 * quadros e o áudio inteiro e mede.
 *
 *   npx tsx scripts/verify.ts video.mp4 [marcas.cues.json] [trilha.wav]
 *
 * As checagens específicas (congelamento, silêncio, cortes, sons em quadros
 * exatos) vêm do .cues.json que a trilha grava junto do WAV.
 *
 * Usa o ffmpeg/ffprobe que vêm com o Remotion (npx remotion ffmpeg|ffprobe).
 * Sai com código 1 se qualquer checagem falhar.
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {Bus, gainToDb, integratedLoudness, SR, Svf, truePeakEnvelope} from './audio/dsp';
import {DURATION, FPS, HEIGHT, WIDTH} from '../src/timeline';

const file = path.resolve(process.argv[2] ?? 'out/gavi-anuncio-24s-claro.mp4');
const cuesPath = path.resolve(process.argv[3] ?? 'public/audio/trilha.cues.json');
const wavPath = path.resolve(process.argv[4] ?? cuesPath.replace(/\.cues\.json$/, '.wav'));
type Cues = {
  duration?: number; // segundos (a trilha grava); define quantos quadros o vídeo deve ter
  freeze?: [number, number];
  cuts?: Record<string, number>;
  silence?: [number, number];
  sync?: Record<string, number>;
  marks?: [string, number, number][];
  keys?: number[];
  expectedKeys?: number;
};
const cues: Cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
// Duração esperada: a da trilha (cada peça tem a sua); sem ela, a da peça principal.
const FRAMES = cues.duration ? Math.round(cues.duration * FPS) : DURATION;
const SECONDS = FRAMES / FPS;
const secs = SECONDS.toFixed(3).replace('.', ',');

function tool(name: 'ffmpeg' | 'ffprobe', args: string[]): Buffer {
  const r = spawnSync('npx', ['remotion', name, ...args], {maxBuffer: 1 << 30});
  if (r.status !== 0) throw new Error(`${name} falhou:\n${r.stderr.toString()}`);
  return r.stdout;
}

type Check = {name: string; ok: boolean; value: string};
const checks: Check[] = [];
const check = (name: string, ok: boolean, value: unknown) => checks.push({name, ok, value: String(value)});

/* ------------------------------------------------------------ contêiner */

const probe = JSON.parse(
  tool('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file]).toString(),
);
type Stream = Record<string, string | number | undefined>;
const video: Stream = probe.streams.find((s: Stream) => s.codec_type === 'video');
const audio: Stream | undefined = probe.streams.find((s: Stream) => s.codec_type === 'audio');

check('Vídeo H.264', video.codec_name === 'h264', video.codec_name);
check('Resolução 1080×1920 (vertical)', video.width === WIDTH && video.height === HEIGHT, `${video.width}×${video.height}`);
check('30 fps constantes', video.r_frame_rate === '30/1' && video.avg_frame_rate === '30/1', `${video.r_frame_rate} · média ${video.avg_frame_rate}`);
check(`${FRAMES} quadros no fluxo (ffprobe -count_frames)`, Number(video.nb_read_frames) === FRAMES, video.nb_read_frames);
check(`Duração do vídeo = ${secs} s`, Math.abs(Number(video.duration) - SECONDS) < 0.0005, video.duration);
check('Pixel yuv420p (compatível com redes sociais)', video.pix_fmt === 'yuv420p', video.pix_fmt);
check('Cor marcada BT.709', video.color_space === 'bt709' && video.color_primaries === 'bt709', `${video.color_space}/${video.color_primaries}/${video.color_transfer}`);
check('Tem faixa de áudio', Boolean(audio), audio ? 'sim' : 'não');
if (audio) {
  check('Áudio AAC, estéreo, 48 kHz', audio.codec_name === 'aac' && audio.channels === 2 && Number(audio.sample_rate) === 48000, `${audio.codec_name} · ${audio.channels} canais · ${audio.sample_rate} Hz`);
  check(`Duração do áudio ≈ ${SECONDS} s (±1 quadro)`, Math.abs(Number(audio.duration) - SECONDS) <= 1 / FPS, audio.duration);
}

/* --------------------------------------------------------------- quadros */

// Decodifica TODOS os quadros (reduzidos, em cinza) e conta um a um.
const FW = 135;
const FH = 240;
// O ffmpeg do Remotion não tem o muxer rawvideo: image2pipe + codec rawvideo
// entrega os mesmos quadros crus, concatenados.
const raw = tool('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-vf', `scale=${FW}:${FH}`, '-f', 'image2pipe', '-c:v', 'rawvideo', '-pix_fmt', 'gray', '-']);
const frameSize = FW * FH;
const decoded = raw.length / frameSize;
check(`${FRAMES} quadros decodificados um a um`, decoded === FRAMES, decoded);

const frameAt = (i: number) => raw.subarray(i * frameSize, (i + 1) * frameSize);
const diff = (a: number, b: number) => {
  const fa = frameAt(a);
  const fb = frameAt(b);
  let acc = 0;
  for (let i = 0; i < frameSize; i++) acc += Math.abs(fa[i] - fb[i]);
  return acc / frameSize;
};
const luma = (i: number) => frameAt(i).reduce((s, v) => s + v, 0) / frameSize;

const minLuma = Math.min(...Array.from({length: decoded}, (_, i) => luma(i)));
check('Nenhum quadro preto', minLuma > 12, `luminância mínima ${minLuma.toFixed(1)}/255`);

if (cues.freeze) {
  const [from, to] = cues.freeze;
  const frozen = Array.from({length: to - from}, (_, k) => diff(from + k, from - 1));
  check(`Congelamento em "travar": quadros ${from}–${to - 1} = quadro ${from - 1}`, Math.max(...frozen) < 0.6, `diferença máx. ${Math.max(...frozen).toFixed(2)}`);
  const thaw = diff(to, to - 1);
  check(`Imagem destrava no quadro do tranco (${to})`, thaw > 2, `diferença ${thaw.toFixed(2)}`);
}

if (cues.cuts) {
  // Toda cena muda a imagem no próprio quadro de corte.
  const cuts = Object.entries(cues.cuts).map(([name, frame]) => ({name, frame, d: diff(frame, frame - 1)}));
  check('Imagem em movimento em todos os cortes de cena', cuts.every((c) => c.d > 0.3), cuts.map((c) => `${c.name}@${c.frame}:${c.d.toFixed(1)}`).join(' '));
}

// Nenhum trecho parado sem querer: em toda janela de 1 s alguma coisa se mexe.
// Conta pixels que mudaram (e não a média), para uma seta pequena pulando contar.
const changed = (a: number, b: number) => {
  const fa = frameAt(a);
  const fb = frameAt(b);
  let n = 0;
  for (let i = 0; i < frameSize; i++) if (Math.abs(fa[i] - fb[i]) > 6) n++;
  return n;
};
const stills: string[] = [];
for (let f = 1; f + 30 <= decoded; f += 30) {
  const moving = Array.from({length: 30}, (_, k) => changed(f + k, f + k - 1)).some((c) => c >= 30);
  const inFreeze = cues.freeze && f < cues.freeze[1] && f + 30 > cues.freeze[0];
  if (!moving && !inFreeze) stills.push(`${f}–${f + 29}`);
}
check('Imagem em movimento em todo segundo', stills.length === 0, stills.length ? stills.join(' ') : 'ok');

/* ----------------------------------------------------------------- áudio */

// Decodifica o AAC para WAV 16 bits (o que esse ffmpeg oferece) e lê as amostras.
const wavOut = tool('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:a:0', '-f', 'wav', '-c:a', 'pcm_s16le', '-ac', '2', '-ar', String(SR), '-']);
const dataAt = wavOut.indexOf(Buffer.from('data')) + 8;
const n = Math.floor((wavOut.length - dataAt) / 4);
const mp4Audio = new Bus(n);
for (let i = 0; i < n; i++) {
  mp4Audio.L[i] = wavOut.readInt16LE(dataAt + i * 4) / 32768;
  mp4Audio.R[i] = wavOut.readInt16LE(dataAt + i * 4 + 2) / 32768;
}

const lufs = integratedLoudness(mp4Audio);
check('Loudness integrado −14 LUFS (±1)', Math.abs(lufs + 14) <= 1, `${lufs.toFixed(2)} LUFS`);
const peakOf = (a: Float32Array) => a.reduce((m, v) => Math.max(m, v), 0);
const tpDb = gainToDb(Math.max(peakOf(truePeakEnvelope(mp4Audio.L)), peakOf(truePeakEnvelope(mp4Audio.R))));
check('Pico real ≤ −1 dBTP (depois do AAC)', tpDb <= -1, `${tpDb.toFixed(2)} dBTP`);

const rms = (bus: Bus, t0: number, t1: number) => {
  const a = Math.round(t0 * SR);
  const b = Math.min(bus.length, Math.round(t1 * SR));
  let acc = 0;
  for (let i = a; i < b; i++) acc += (bus.L[i] ** 2 + bus.R[i] ** 2) / 2;
  return gainToDb(Math.sqrt(acc / Math.max(1, b - a)));
};

// O AAC espalha energia por até um quadro de codec (1024 amostras = 21 ms)
// antes de um transiente; mede-se o miolo do silêncio, sem essas bordas.
const [sil0, sil1] = cues.silence ?? [-1, -1];
if (cues.silence) {
  const aacFrame = 1024 / SR;
  const gap = rms(mp4Audio, sil0 + aacFrame, sil1 - aacFrame * 1.5);
  check(`Silêncio da trava (${sil0.toFixed(3)}–${sil1.toFixed(3)} s)`, gap < -50, `${gap.toFixed(1)} dBFS`);
}

const quiet: string[] = [];
for (let t = 0.3; t + 0.5 <= SECONDS; t += 0.5) {
  if (cues.silence && t + 0.5 > sil0 && t < sil1) continue;
  const v = rms(mp4Audio, t, t + 0.5);
  if (v < -45) quiet.push(`${t.toFixed(1)}s:${v.toFixed(0)}dB`);
}
check('Trilha contínua (nenhum buraco além do planejado)', quiet.length === 0, quiet.length ? quiet.join(' ') : 'ok');

// Sincronia: correlaciona o áudio do MP4 com o WAV-fonte. Como o WAV foi
// posicionado a partir dos mesmos quadros das cenas, desvio ~0 = A/V em sincronia.
const wav = fs.readFileSync(wavPath);
const src = new Float32Array((wav.length - 44) / 4);
for (let i = 0; i < src.length; i++) src[i] = (wav.readInt16LE(44 + i * 4) + wav.readInt16LE(44 + i * 4 + 2)) / 65536;
// Só acima de ~1,5 kHz: o sub-grave sustentado (período de ~20 ms) faria a
// correlação "pular de ciclo"; os transientes de clique e bumbo não enganam.
const highpass = (x: Float32Array) => {
  const f = new Svf(1500, 0.7);
  return x.map((v) => {
    f.process(v);
    return f.high;
  });
};
const srcHp = highpass(src);
const mono = highpass(Float32Array.from({length: n}, (_, i) => (mp4Audio.L[i] + mp4Audio.R[i]) / 2));
function lagAround(t: number, span = 0.6, maxLag = 0.05): number {
  const a = Math.round((t - span / 2) * SR);
  const len = Math.round(span * SR);
  const ml = Math.round(maxLag * SR);
  let best = 0;
  let bestV = -Infinity;
  for (let lag = -ml; lag <= ml; lag++) {
    let acc = 0;
    for (let i = 0; i < len; i += 2) {
      const j = a + i + lag;
      if (j < 0 || j >= n) continue;
      acc += srcHp[a + i] * mono[j];
    }
    if (acc > bestV) {
      bestV = acc;
      best = lag;
    }
  }
  return (best / SR) * 1000;
}
const syncPoints = Object.entries(cues.sync ?? {});
const lags = syncPoints.map(([name, t]) => ({name, ms: lagAround(t)}));
check('A/V: desvio do áudio ≤ 1 ms nos pontos de sincronia', lags.every((l) => Math.abs(l.ms) <= 1), lags.map((l) => `${l.name} ${l.ms.toFixed(2)}ms`).join(' · '));

// E os sons marcados caem exatamente nos quadros dos eventos visuais.
const marks = cues.marks ?? [];
check(
  'Sons marcados no quadro exato do evento visual',
  marks.length > 0 && marks.every(([, t, f]) => Math.abs(t * FPS - f) < 1e-6),
  marks.map(([name, t, f]) => `${name}: ${(t * FPS).toFixed(3)} = quadro ${f}`).join(' · '),
);
if (cues.keys && cues.expectedKeys !== undefined) {
  check('Uma tecla por caractere digitado', cues.keys.length === cues.expectedKeys, `${cues.keys.length} teclas`);
}

/* ---------------------------------------------------------------- saída */

const width = Math.max(...checks.map((c) => c.name.length));
for (const c of checks) console.log(`${c.ok ? 'OK  ' : 'FALHA'}  ${c.name.padEnd(width)}  ${c.value}`);
const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} checagem(ns) falharam.` : `\nTodas as ${checks.length} checagens passaram.`);

fs.mkdirSync(path.dirname(file), {recursive: true});
// Um relatório por vídeo: <nome>.verify.json ao lado do MP4.
const report = path.join(path.dirname(file), `${path.basename(file, '.mp4')}.verify.json`);
fs.writeFileSync(report, JSON.stringify({file: path.basename(file), checks}, null, 2));
process.exit(failed.length ? 1 : 0);
