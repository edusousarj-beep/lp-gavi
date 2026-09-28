/*
 * Verificação do MP4 final. Não confia em metadado: decodifica os 720
 * quadros e o áudio inteiro e mede.
 *
 *   npm run verify            (ou: npx tsx scripts/verify.ts caminho.mp4)
 *
 * Usa o ffmpeg/ffprobe que vêm com o Remotion (npx remotion ffmpeg|ffprobe).
 * Sai com código 1 se qualquer checagem falhar.
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {Bus, gainToDb, integratedLoudness, SR, Svf, truePeakEnvelope} from './audio/dsp';
import {DURATION, EVENTS, FPS, FREEZE, HEIGHT, SCENES, WIDTH} from '../src/timeline';

const file = path.resolve(process.argv[2] ?? 'out/gavi-anuncio-24s-claro.mp4');
const wavPath = path.resolve('public/audio/trilha.wav');
const cuesPath = path.resolve('public/audio/trilha.cues.json');

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
check('720 quadros no fluxo (ffprobe -count_frames)', Number(video.nb_read_frames) === DURATION, video.nb_read_frames);
check('Duração do vídeo = 24,000 s', Math.abs(Number(video.duration) - DURATION / FPS) < 0.0005, video.duration);
check('Pixel yuv420p (compatível com redes sociais)', video.pix_fmt === 'yuv420p', video.pix_fmt);
check('Cor marcada BT.709', video.color_space === 'bt709' && video.color_primaries === 'bt709', `${video.color_space}/${video.color_primaries}/${video.color_transfer}`);
check('Tem faixa de áudio', Boolean(audio), audio ? 'sim' : 'não');
if (audio) {
  check('Áudio AAC, estéreo, 48 kHz', audio.codec_name === 'aac' && audio.channels === 2 && Number(audio.sample_rate) === 48000, `${audio.codec_name} · ${audio.channels} canais · ${audio.sample_rate} Hz`);
  check('Duração do áudio ≈ 24 s (±1 quadro)', Math.abs(Number(audio.duration) - DURATION / FPS) <= 1 / FPS, audio.duration);
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
check('720 quadros decodificados um a um', decoded === DURATION, decoded);

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

const frozen = Array.from({length: FREEZE.to - FREEZE.from}, (_, k) => diff(FREEZE.from + k, FREEZE.from - 1));
check(
  `Congelamento em "travar": quadros ${FREEZE.from}–${FREEZE.to - 1} = quadro ${FREEZE.from - 1}`,
  Math.max(...frozen) < 0.6,
  `diferença máx. ${Math.max(...frozen).toFixed(2)}`,
);
const thaw = diff(FREEZE.to, FREEZE.to - 1);
check(`Imagem destrava no quadro do tranco (${FREEZE.to})`, thaw > 2, `diferença ${thaw.toFixed(2)}`);

// Toda cena muda a imagem no próprio quadro de corte.
const cuts = Object.entries(SCENES).slice(1).map(([name, s]) => ({name, frame: s.from, d: diff(s.from, s.from - 1)}));
check('Imagem em movimento em todos os cortes de cena', cuts.every((c) => c.d > 0.3), cuts.map((c) => `${c.name}@${c.frame}:${c.d.toFixed(1)}`).join(' '));

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

const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
// O AAC espalha energia por até um quadro de codec (1024 amostras = 21 ms)
// antes de um transiente; mede-se o miolo do silêncio, sem essas bordas.
const [sil0, sil1] = cues.silence as [number, number];
const aacFrame = 1024 / SR;
const gap = rms(mp4Audio, sil0 + aacFrame, sil1 - aacFrame * 1.5);
check(`Silêncio da trava (${sil0.toFixed(3)}–${sil1.toFixed(3)} s)`, gap < -50, `${gap.toFixed(1)} dBFS`);

const quiet: string[] = [];
for (let t = 0.3; t + 0.5 <= DURATION / FPS; t += 0.5) {
  if (t + 0.5 > sil0 && t < sil1) continue;
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
const syncPoints: [string, number][] = [
  ['drop', cues.drop],
  ['tranco', cues.slam],
  ['clique enviar', cues.clickSend],
  ['clique CTA', cues.clickCta],
];
const lags = syncPoints.map(([name, t]) => ({name, ms: lagAround(t)}));
check('A/V: desvio do áudio ≤ 1 ms nos pontos de sincronia', lags.every((l) => Math.abs(l.ms) <= 1), lags.map((l) => `${l.name} ${l.ms.toFixed(2)}ms`).join(' · '));

// E os pontos de sincronia caem exatamente nos quadros dos eventos visuais.
const cueFrames: [string, number, number][] = [
  ['clique enviar', cues.clickSend, EVENTS.prompt.click],
  ['clique CTA', cues.clickCta, EVENTS.endCard.click],
  ['tranco', cues.slam, EVENTS.hook.slam],
];
check(
  'Sons marcados no quadro exato do evento visual',
  cueFrames.every(([, t, f]) => Math.abs(t * FPS - f) < 1e-6),
  cueFrames.map(([name, t, f]) => `${name}: ${(t * FPS).toFixed(3)} = quadro ${f}`).join(' · '),
);
check(
  'Uma tecla por caractere digitado',
  (cues.keys as number[]).length === EVENTS.prompt.keys.length,
  `${(cues.keys as number[]).length} teclas`,
);

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
