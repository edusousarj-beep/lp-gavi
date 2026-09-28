import {AbsoluteFill, interpolate} from 'remotion';
import {measureText, useFontsReady} from '../brand/fonts';
import {useTheme} from '../brand/theme';
import {FONT, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {ClickRipple, Cursor} from '../components/Cursor';
import {ArrowUpIcon, CheckIcon, DocIcon, MicIcon, PlusIcon} from '../components/Icons';
import {blurIn, blurOut, EASE_IN_OUT, lerp, progress} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS} from '../timeline';

const PAD_X = 64;
const TEXT_SIZE = 66;
const BOX_H = 400;
const SEND = 104;
const ZOOM_TYPING = 1.3;
const SCREEN_CX = 540;
const SCREEN_CY = 960;
const BOX_SCREEN_Y = 930; // centro do campo na tela
const CARET_SCREEN_X = 760; // onde a câmera mantém o cursor de texto

/*
 * O pedido. A câmera fica perto do texto e anda junto com a digitação; no fim
 * recua, mostra o botão de enviar e o mouse clica. Tudo em coordenadas de
 * "mundo" transformadas por uma câmera: translate → scale → translate.
 */
export const PromptScene: React.FC = () => {
  const frame = useSceneFrame('prompt');
  const t = useTheme();
  useFontsReady();
  const {enter, keys, zoomOut, zoomOutEnd, cursorIn, click, exit} = EVENTS.prompt;
  const text = COPY.prompt.text;

  const typed = keys.filter((k) => frame >= k).length;
  const width = (n: number) => measureText(text.slice(0, n), TEXT_SIZE, 400);
  const fullW = width(text.length);
  const boxW = PAD_X * 2 + fullW + 80;

  // Posição contínua do cursor de texto (em caracteres), para a câmera não pular.
  const v = interpolate(frame, [keys[0] - 1, ...keys], [0, ...keys.map((_, i) => i + 1)], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const vi = Math.floor(v);
  const caretWorldX = PAD_X + lerp(width(vi), width(Math.min(vi + 1, text.length)), v - vi);

  const zoom = progress(frame, zoomOut, zoomOutEnd - zoomOut, EASE_IN_OUT);
  const k = lerp(ZOOM_TYPING, 1, zoom);
  const camTyping = Math.max((SCREEN_CX - 70) / ZOOM_TYPING, caretWorldX - (CARET_SCREEN_X - SCREEN_CX) / ZOOM_TYPING);
  const camEnd = boxW - (1010 - SCREEN_CX);
  const camX = lerp(camTyping, camEnd, zoom);
  const camY = BOX_H / 2 + (SCREEN_CY - BOX_SCREEN_Y) / k;

  const inAnim = blurIn(frame, enter, 10, 140, 20);
  const out = blurOut(frame, exit, 6, 22);

  // Onde o botão de enviar cai na tela quando a câmera termina de recuar.
  const sendWorld = {x: boxW - PAD_X - SEND / 2, y: BOX_H - 44 - SEND / 2};
  const camYEnd = BOX_H / 2 + (SCREEN_CY - BOX_SCREEN_Y);
  const sendScreen = {x: SCREEN_CX + (sendWorld.x - camEnd), y: SCREEN_CY + (sendWorld.y - camYEnd)};

  const pressed = frame >= click && frame < click + 4;
  const caretOn = typed < text.length ? true : Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{opacity: out.opacity, filter: out.blur > 0.05 ? `blur(${out.blur}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${SCREEN_CX}px, ${SCREEN_CY + inAnim.y}px) scale(${k * out.scale}) translate(${-camX}px, ${-camY}px)`,
          opacity: inAnim.opacity,
          filter: inAnim.blur > 0.05 ? `blur(${inAnim.blur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: boxW,
            height: BOX_H,
            borderRadius: 48,
            background: t.card,
            border: `3px solid ${t.inputBorder}`,
            boxShadow: `0 0 0 10px ${t.inputRing}, 0 0 110px ${t.cardGlow}, ${t.cardShadow}`,
            fontFamily: FONT,
          }}
        >
          <div style={{position: 'absolute', left: PAD_X, top: 44, display: 'flex', gap: 16}}>
            {COPY.prompt.chips.map((chip, i) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  height: 64,
                  padding: '0 26px',
                  borderRadius: 999,
                  border: `2px solid ${i === 0 ? t.chipBorderActive : t.chipBorder}`,
                  color: i === 0 ? t.chipTextActive : t.chipText,
                  fontSize: 30,
                  fontWeight: i === 0 ? WEIGHT.heavy : WEIGHT.regular,
                  whiteSpace: 'nowrap',
                }}
              >
                {i === 0 ? <CheckIcon size={30} color={t.chipTextActive} /> : null}
                {chip}
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              left: PAD_X,
              top: 142,
              fontSize: TEXT_SIZE,
              lineHeight: '84px',
              fontWeight: WEIGHT.regular,
              color: t.headline,
              whiteSpace: 'pre',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {text.slice(0, typed)}
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: 76,
                marginLeft: 4,
                background: t.headline,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              left: PAD_X,
              bottom: 44,
              height: SEND,
              display: 'flex',
              alignItems: 'center',
              gap: 34,
            }}
          >
            <PlusIcon size={50} color={t.icon} />
            <DocIcon size={48} color={t.icon} />
          </div>

          <div
            style={{
              position: 'absolute',
              right: PAD_X,
              bottom: 44,
              height: SEND,
              display: 'flex',
              alignItems: 'center',
              gap: 36,
            }}
          >
            <MicIcon size={52} color={t.icon} />
            <div
              style={{
                width: SEND,
                height: SEND,
                borderRadius: '50%',
                background: pressed ? t.accentDim : t.accent,
                boxShadow: t.sendGlow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${pressed ? 0.88 : 1})`,
                opacity: typed > 0 ? 1 : 0.45,
              }}
            >
              <ArrowUpIcon size={56} color={t.onAccent} />
            </div>
          </div>
        </div>
      </div>

      <ClickRipple frame={frame} click={click} x={sendScreen.x} y={sendScreen.y} color={t.ripple} />
      <Cursor
        frame={frame}
        from={{x: 1160, y: 1620}}
        to={{x: sendScreen.x + 8, y: sendScreen.y + 12}}
        start={cursorIn}
        arrive={click - 3}
        click={click}
      />
    </AbsoluteFill>
  );
};
