import {AbsoluteFill} from 'remotion';
import {useTheme} from '../brand/theme';
import {FONT, WEIGHT} from '../brand/tokens';
import {COPY} from '../copy';
import {blurIn, EASE_IN_OUT, EASE_OUT, lerp, progress} from '../lib/anim';
import {useSceneFrame} from '../lib/scene';
import {EVENTS, SCENES} from '../timeline';

/* Saída em rampa (12 quadros, curva suave): a folha clara não pode sumir no tranco. */
function fadeOut(frame: number, start: number) {
  const p = progress(frame, start, 12, EASE_IN_OUT);
  return {opacity: 1 - p, blur: p * 20, scale: lerp(1, 0.94, p)};
}

/*
 * O que a pessoa vê por dentro: um dossiê em perspectiva que se monta linha a
 * linha, como o relatório da referência. Só fatos que já estão na LP.
 */
export const DossierScene: React.FC = () => {
  const frame = useSceneFrame('dossier');
  const t = useTheme();
  const {bubble, doc, header, sections, footer, exit} = EVENTS.dossier;
  const scene = SCENES.dossier;

  const bubbleIn = blurIn(frame, bubble, 10, 0, 14);
  const bubbleX = lerp(160, 0, progress(frame, bubble, 12));

  // Entrada: a folha sobe deitada e endireita; depois a câmera gira devagar.
  const enter = progress(frame, doc, 20, EASE_OUT);
  const drift = progress(frame, doc, scene.to - doc, EASE_IN_OUT);
  const out = fadeOut(frame, exit);
  const exitTilt = progress(frame, exit, 12);

  const rotX = lerp(40, 11, enter) - drift * 5 + exitTilt * 14;
  const rotY = lerp(-16, -11, enter) + drift * 6;
  const rotZ = lerp(4, 2.2, enter) - drift * 1.2;
  const y = lerp(620, 0, enter) - exitTilt * 60;
  const scale = lerp(0.8, 1, enter) * lerp(1.02, 0.97, drift) * out.scale;
  const blur = (1 - enter) * 20 + out.blur;

  const line = (at: number) => {
    const a = blurIn(frame, at, 8, 16, 10);
    return {
      opacity: a.opacity,
      transform: `translateY(${a.y}px)`,
      filter: a.blur > 0.05 ? `blur(${a.blur}px)` : undefined,
    };
  };

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: 290,
          width: 610,
          padding: '26px 34px',
          borderRadius: 30,
          background: t.card,
          border: `2px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
          opacity: Math.min(bubbleIn.opacity, out.opacity),
          transform: `translateX(${bubbleX}px)`,
          filter: bubbleIn.blur + out.blur > 0.05 ? `blur(${bubbleIn.blur + out.blur}px)` : undefined,
          zIndex: 2,
        }}
      >
        <div style={{fontSize: 26, color: t.body}}>{COPY.dossier.askedLabel}</div>
        <div style={{marginTop: 4, fontSize: 36, lineHeight: 1.25, color: t.headline, fontWeight: WEIGHT.heavy, letterSpacing: '-0.01em'}}>
          {COPY.prompt.text}
        </div>
      </div>

      <div style={{position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '50% 40%'}}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 500,
            width: 860,
            padding: '56px 60px 40px',
            borderRadius: 28,
            background: t.paper,
            color: t.ink,
            boxShadow: t.paperShadow,
            transform: `translateY(${y}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
            transformOrigin: '50% 30%',
            opacity: Math.min(progress(frame, doc, 10, EASE_IN_OUT), out.opacity),
            filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          }}
        >
          <div style={line(header)}>
            <div style={{fontSize: 54, fontWeight: WEIGHT.heavy, letterSpacing: '-0.03em', lineHeight: 1.05}}>
              {COPY.dossier.title}
            </div>
            <div style={{marginTop: 10, fontSize: 30, color: t.paperLabel}}>{COPY.dossier.subtitle}</div>
          </div>

          {COPY.dossier.sections.map((s, i) => (
            <div
              key={s.label}
              style={{
                ...line(sections[i]),
                marginTop: 30,
                paddingTop: 26,
                borderTop: `2px solid ${t.paperRule}`,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: WEIGHT.heavy,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: t.paperLabel,
                }}
              >
                {s.label}
              </div>
              {s.items ? (
                <div style={{display: 'flex', gap: 14, marginTop: 14}}>
                  {s.items.map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 999,
                        border: `2px solid ${t.paperChipBorder}`,
                        fontSize: 32,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  style={
                    s.value === 'M.O.V.E.'
                      ? {marginTop: 8, fontSize: 52, fontWeight: WEIGHT.heavy, letterSpacing: '0.02em', color: t.accent}
                      : {marginTop: 8, fontSize: 40, lineHeight: 1.25}
                  }
                >
                  {s.value}
                </div>
              )}
            </div>
          ))}

          <div
            style={{
              ...line(footer),
              marginTop: 34,
              paddingTop: 22,
              borderTop: `2px solid ${t.paperRule}`,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 24,
              color: t.paperLabel,
            }}
          >
            <span>{COPY.brand}</span>
            <span style={{letterSpacing: '0.3em'}}>• • •</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
