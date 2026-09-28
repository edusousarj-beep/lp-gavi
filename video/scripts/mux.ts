/*
 * Junta o vídeo (renderizado sem áudio) com a trilha, codificando o AAC
 * direto no MP4.
 *
 * Por que não deixar o Remotion embutir o áudio: ele comprime o AAC em ADTS e
 * só depois mistura. O ADTS descarta o atraso do encoder (2048 amostras no
 * libfdk_aac), e o áudio chega 42,7 ms atrasado — mais de um quadro. Direto no
 * MP4, o encoder marca esse atraso para ser descartado e o áudio fica em fase
 * com o vídeo. `npm run verify` mede isso.
 */
import {spawnSync} from 'node:child_process';

const [video = 'out/.video-sem-audio.mp4', audio = 'public/audio/trilha.wav', output = 'out/gavi-anuncio-24s.mp4'] = process.argv.slice(2);

const args = [
  'remotion', 'ffmpeg', '-hide_banner', '-v', 'error', '-y',
  '-i', video,
  '-i', audio,
  '-map', '0:v:0',
  '-map', '1:a:0',
  '-c:v', 'copy',
  '-c:a', 'libfdk_aac',
  '-b:a', '320k',
  '-cutoff', '18000',
  '-movflags', '+faststart',
  '-metadata', 'title=Inglês com a Gavi — veja a mentoria por dentro',
  output,
];

const r = spawnSync('npx', args, {stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`MP4 final: ${output}`);
