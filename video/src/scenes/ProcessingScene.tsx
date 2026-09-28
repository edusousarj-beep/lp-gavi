import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useTheme} from '../brand/theme';
import {FONT, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {blurIn, blurOut, EASE_IN_OUT, progress} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS, FPS} from '../timeline';

/*
 * O respiro entre o pedido e o dossiê — o "Pensando…" da referência, aqui
 * como "Abrindo": a mentoria sendo aberta por dentro.
 */
export const ProcessingScene: React.FC = () => {
  const frame = useSceneFrame('processing');
  const t = useTheme();
  const local = useCurrentFrame();
  const {enter, step2, progressStart, progressEnd, exit} = EVENTS.processing;

  const inAnim = blurIn(frame, enter, 8, 60, 16);
  const out = blurOut(frame, exit, 8);
  const bar = progress(frame, progressStart, progressEnd - progressStart, EASE_IN_OUT);
  const elapsed = (local / FPS).toFixed(1);

  const firstStep = frame < step2;
  const swap = blurIn(frame, step2, 6, 10, 8);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          width: 880,
          marginTop: -40,
          padding: '40px 46px 0',
          borderRadius: 40,
          background: t.card,
          border: `2px solid ${t.cardBorder}`,
          boxShadow: `0 0 90px ${t.cardGlow}, ${t.cardShadow}`,
          overflow: 'hidden',
          fontFamily: FONT,
          opacity: Math.min(inAnim.opacity, out.opacity),
          transform: `translateY(${inAnim.y}px) scale(${inAnim.scale * out.scale})`,
          filter: inAnim.blur + out.blur > 0.05 ? `blur(${inAnim.blur + out.blur}px)` : undefined,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 32}}>
          <Spinner frame={frame} color={t.spinner} track={t.spinnerTrack} />
          <div style={{flex: 1}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
              <span style={{fontSize: 46, fontWeight: WEIGHT.heavy, color: t.headline, letterSpacing: '-0.02em'}}>
                {COPY.processing.title}
              </span>
              <span style={{fontSize: 34, color: t.body, fontVariantNumeric: 'tabular-nums'}}>{elapsed}s</span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 34,
                color: t.body,
                whiteSpace: 'nowrap',
                opacity: firstStep ? 1 : swap.opacity,
                filter: !firstStep && swap.blur > 0.05 ? `blur(${swap.blur}px)` : undefined,
              }}
            >
              {firstStep ? COPY.processing.steps[0] : COPY.processing.steps[1]}
            </div>
          </div>
        </div>
        <div style={{height: 8, marginTop: 38, marginLeft: -46, marginRight: -46, background: t.progressTrack}}>
          <div style={{height: '100%', width: `${bar * 100}%`, background: t.progressFill}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Anel com uma abertura girando — o carregador da referência. */
export const Spinner: React.FC<{frame: number; color: string; track: string; size?: number}> = ({frame, color, track, size = 92}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{flex: 'none', transform: `rotate(${frame * 14}deg)`}}>
    <circle cx="24" cy="24" r="19" fill="none" stroke={track} strokeWidth="4" />
    <circle
      cx="24"
      cy="24"
      r="19"
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="70 120"
    />
  </svg>
);
