import {AbsoluteFill, Audio, Freeze, Sequence, staticFile} from 'remotion';
import {TOKENS} from './brand/tokens';
import {Background} from './components/Background';
import {Brand} from './components/Brand';
import {ClosingScene} from './scenes/ClosingScene';
import {DossierScene} from './scenes/DossierScene';
import {EndCardScene} from './scenes/EndCardScene';
import {HookScene} from './scenes/HookScene';
import {MethodScene} from './scenes/MethodScene';
import {MissionScene} from './scenes/MissionScene';
import {ProcessingScene} from './scenes/ProcessingScene';
import {PromptScene} from './scenes/PromptScene';
import {FREEZE, SCENES, type SceneName} from './timeline';

const span = (name: SceneName) => ({
  from: SCENES[name].from,
  durationInFrames: SCENES[name].to - SCENES[name].from,
});

/*
 * Anúncio de 24 s. Atrair (logo + gancho) → converter (missão, pedido,
 * abrindo, dossiê, método) → vender (fechamento + CTA).
 *
 * Tudo que é imagem fica dentro do <Freeze>: em "travar" o quadro inteiro
 * congela por FREEZE quadros enquanto a trilha para. O áudio fica fora.
 */
export const GaviAd: React.FC = () => (
  <AbsoluteFill style={{background: TOKENS.bg}}>
    <Freeze frame={FREEZE.from - 1} active={(f) => f >= FREEZE.from && f < FREEZE.to}>
      <AbsoluteFill>
        <Background />
        <Sequence {...span('hook')} name="2 Gancho">
          <HookScene />
        </Sequence>
        <Sequence {...span('mission')} name="3 Missão">
          <MissionScene />
        </Sequence>
        <Sequence {...span('prompt')} name="4 Pedido">
          <PromptScene />
        </Sequence>
        <Sequence {...span('processing')} name="5 Abrindo">
          <ProcessingScene />
        </Sequence>
        <Sequence {...span('dossier')} name="6 Dossiê">
          <DossierScene />
        </Sequence>
        <Sequence {...span('method')} name="7 Método">
          <MethodScene />
        </Sequence>
        <Sequence {...span('closing')} name="8 Fechamento">
          <ClosingScene />
        </Sequence>
        <Sequence {...span('endCard')} name="9 CTA">
          <EndCardScene />
        </Sequence>
        {/* 1 Logo: nasce no centro e vira o cabeçalho, por cima de tudo. */}
        <Brand />
      </AbsoluteFill>
    </Freeze>
    <Audio src={staticFile('audio/trilha.wav')} />
  </AbsoluteFill>
);
