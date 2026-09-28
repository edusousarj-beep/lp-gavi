import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');

// Quadros em PNG (sem perda) antes do H.264: degradê escuro e texto fino
// não pegam artefato de JPEG no meio do caminho.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(16);
Config.setX264Preset('slow');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setOverwriteOutput(true);

// Em ambiente sem Chrome do Remotion (ex.: CI com Playwright), aponte o binário.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
