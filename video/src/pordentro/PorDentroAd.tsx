/*
 * Peça "Por dentro", modelada no anúncio de diagnóstico da turaCRM:
 * 4 blocos como páginas de um feed, trocados por ROLAGEM vertical (A→B, C→D)
 * e DESLIZE lateral (B→C, com a barra vertical fazendo a cortina); texto que
 * entra apagado e ACENDE; itens com ícone que acende um a um; retrato entrando
 * em perspectiva; número grande com caixa de destaque; barras crescendo;
 * cartão final chegando em cascata, com a pílula pulsando no tempo.
 *
 * Diferenças deliberadas em relação à referência: cores da marca (vermelho
 * sobre petróleo, luz ambiente no teal), sem o contador "0:15" e o nome de
 * perfil do topo — aquilo é a interface do player da gravação, não o anúncio.
 */
import {AbsoluteFill, Audio, Img, spring, staticFile, useCurrentFrame} from 'remotion';
import {THEMES, ThemeContext} from '../brand/theme';
import {alpha, DERIVED, FONT, mix, TOKENS} from '../brand/tokens';
import {Background} from '../components/Background';
import {EASE_IN_OUT, EASE_OUT, lerp, progress} from '../lib/anim';
import {FPS} from '../timeline';
import {PD_COPY as C, type Line} from './copy';
import {MOVES, PD, PD_BEAT, PD_DURATION} from './timeline';

const X0 = 130; // coluna de conteúdo
const COL = 820;
const BAR_X = 92; // barra vertical
const HEADER_Y = 214;
const ACCENT = TOKENS.accent;
const TEXT = TOKENS.text;
const NIGHT = DERIVED.night;
const RAISED = DERIVED.raised;

export const PorDentroAd: React.FC = () => (
  <ThemeContext.Provider value={THEMES.escuro}>
    <AbsoluteFill style={{background: THEMES.escuro.bg, fontFamily: FONT, color: TEXT, overflow: 'hidden'}}>
      <Background />
      <Pages />
      <Audio src={staticFile('audio/pordentro.wav')} />
    </AbsoluteFill>
  </ThemeContext.Provider>
);

/* ---------------------------------------------------------------- páginas */

const move = (frame: number, [start, dur]: readonly [number, number]) => progress(frame, start, dur, EASE_IN_OUT);

const Pages: React.FC = () => {
  const frame = useCurrentFrame();
  const p1 = move(frame, MOVES.scroll1);
  const p2 = move(frame, MOVES.slide2);
  const p3 = move(frame, MOVES.scroll3);
  // Borrão de movimento só no meio da troca (onde a página anda mais rápido).
  const blur = (p: number) => 5 * Math.sin(Math.PI * p);

  return (
    <>
      <Ring p1={p1} p2={p2} p3={p3} />
      {p1 < 1 ? (
        <Page x={0} y={-1920 * p1} blur={blur(p1)} from={0} to={MOVES.scroll1[0] + MOVES.scroll1[1]}>
          <SectionA frame={frame} />
        </Page>
      ) : null}
      {p1 > 0 && p2 < 1 ? (
        <Page x={-1080 * p2} y={1920 * (1 - p1)} blur={blur(p1) + blur(p2)} from={MOVES.scroll1[0]} to={MOVES.slide2[0] + MOVES.slide2[1]}>
          <SectionB frame={frame} />
        </Page>
      ) : null}
      {p2 > 0 && p3 < 1 ? (
        <Page x={1080 * (1 - p2)} y={-1920 * p3} blur={blur(p2) + blur(p3)} from={MOVES.slide2[0]} to={MOVES.scroll3[0] + MOVES.scroll3[1]}>
          <SectionC frame={frame} />
        </Page>
      ) : null}
      {p3 > 0 ? (
        <Page x={0} y={1920 * (1 - p3)} blur={blur(p3)} from={MOVES.scroll3[0]} to={PD_DURATION}>
          <SectionD frame={frame} p3={p3} />
        </Page>
      ) : null}
    </>
  );
};

/* Cada página aproxima devagar enquanto está na tela: nada fica parado. */
const Page: React.FC<{x: number; y: number; blur: number; from: number; to: number; children: React.ReactNode}> = ({x, y, blur, from, to, children}) => {
  const frame = useCurrentFrame();
  const push = 1 + 0.03 * progress(frame, from, to - from, (t) => t);
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${push})`,
        transformOrigin: '50% 45%',
        filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* Anel decorativo no canto, como o da referência; anda um pouco com a rolagem. */
const Ring: React.FC<{p1: number; p2: number; p3: number}> = ({p1, p2, p3}) => (
  <div
    style={{
      position: 'absolute',
      left: 650 - 60 * p2,
      top: -160 - 80 * p1 - 60 * p3,
      width: 760,
      height: 760,
      borderRadius: '50%',
      border: `48px solid ${alpha(TOKENS.text2, 0.05)}`,
    }}
  />
);

/* -------------------------------------------------------------- utilidades */

/** Texto que entra apagado e acende (a entrada assinatura da referência). */
function lit(frame: number, at: number, dur = 10) {
  const t = progress(frame, at, dur, EASE_OUT);
  return {opacity: 0.16 + 0.84 * t, filter: t < 1 ? `blur(${((1 - t) * 5).toFixed(2)}px)` : undefined, transform: `translateY(${(1 - t) * 10}px)`};
}

const Eyebrow: React.FC<{frame: number; at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({frame, at, children, style}) => (
  <div style={{fontSize: 24, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: TOKENS.text3, ...lit(frame, at), ...style}}>
    {children}
  </div>
);

const Headline: React.FC<{frame: number; lines: Line[]; at: readonly number[]; size?: number}> = ({frame, lines, at, size = 74}) => (
  <div style={{fontSize: size, fontWeight: 800, lineHeight: `${Math.round(size * 1.04)}px`, letterSpacing: '-0.02em'}}>
    {lines.map((l, i) => (
      <div key={i} style={{color: l.accent ? ACCENT : TEXT, ...lit(frame, at[i])}}>
        {l.t}
      </div>
    ))}
  </div>
);

/* Cabeçalho de cada página: marca à esquerda, rótulo à direita, fio embaixo. */
const Header: React.FC = () => (
  <div style={{position: 'absolute', left: X0, top: HEADER_Y, width: COL}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
      <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '-0.01em'}}>
        {C.brand}
        <span style={{color: ACCENT}}>.</span>
      </div>
      <div style={{fontSize: 20, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: TOKENS.text3}}>{C.label}</div>
    </div>
    <div style={{marginTop: 16, height: 1, background: alpha(TEXT, 0.1)}} />
  </div>
);

/* Barra vertical da esquerda (a "espinha" da referência). */
const LeftBar: React.FC<{grow?: number}> = ({grow = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: BAR_X,
      top: HEADER_Y,
      width: 8,
      height: 1420,
      borderRadius: 4,
      background: ACCENT,
      transformOrigin: '50% 0%',
      transform: `scaleY(${grow})`,
    }}
  />
);

/* Caixa de destaque que cresce da esquerda (o "2 MINUTOS." da referência). */
const AccentBox: React.FC<{frame: number; at: number; size: number; children: React.ReactNode; style?: React.CSSProperties}> = ({frame, at, size, children, style}) => {
  const w = progress(frame, at, 9, EASE_OUT);
  return (
    <div style={{position: 'relative', display: 'inline-block', ...style}}>
      <div style={{position: 'absolute', inset: 0, background: ACCENT, borderRadius: 6, transformOrigin: '0% 50%', transform: `scaleX(${w})`}} />
      <div style={{position: 'relative', fontSize: size, fontWeight: 800, lineHeight: 1.12, padding: `0 ${Math.round(size * 0.22)}px`, letterSpacing: '-0.02em', ...lit(frame, at + 3, 8)}}>
        {children}
      </div>
    </div>
  );
};

/* Para quem é: branco e forte; o marca-texto (teal, sem disputar com o vermelho) passa no tempo. */
const Audience: React.FC<{frame: number; at: number; sweep: number; size?: number; align?: 'left' | 'center'; style?: React.CSSProperties}> = ({
  frame,
  at,
  sweep,
  size = 34,
  align = 'left',
  style,
}) => {
  const p = progress(frame, sweep, 10, EASE_OUT);
  return (
    <div style={{fontSize: size, fontWeight: 800, lineHeight: `${Math.round(size * 1.32)}px`, letterSpacing: '-0.01em', textAlign: align, ...lit(frame, at), ...style}}>
      {C.audience.map((l) => (
        <div key={l.t}>
          {l.mark ? (
            <span style={{position: 'relative', display: 'inline-block'}}>
              <span
                style={{
                  position: 'absolute',
                  left: -8,
                  right: -8,
                  top: '6%',
                  bottom: '2%',
                  borderRadius: 6,
                  background: TOKENS.surface,
                  transformOrigin: '0% 50%',
                  transform: `scaleX(${p})`,
                }}
              />
              <span style={{position: 'relative'}}>{l.t}</span>
            </span>
          ) : (
            l.t
          )}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------- A · gancho (foto) */

const SectionA: React.FC<{frame: number}> = ({frame}) => {
  const rise = progress(frame, PD.aRise, 26, EASE_OUT);
  const tag = spring({frame: frame - PD.tag, fps: FPS, config: {damping: 11, stiffness: 180}});
  const dropBump = frame >= PD.drop ? Math.sin(Math.min(1, (frame - PD.drop) / 10) * Math.PI) : 0;
  // A foto aproxima devagar desde o quadro 0 (Ken Burns), com um tranco no drop.
  const photoScale = 1.06 - 0.06 * progress(frame, -10, 130, (t) => t) + 0.025 * dropBump;

  return (
    <AbsoluteFill>
      <Header />
      <LeftBar grow={progress(frame, -6, 22, EASE_OUT)} />
      <div style={{position: 'absolute', left: X0, top: 290, width: COL, height: 600, borderRadius: 22, overflow: 'hidden', boxShadow: `0 40px 90px ${alpha(NIGHT, 0.6)}`}}>
        <Img
          src={staticFile('pordentro/aula.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 32%', transform: `scale(${photoScale})`, transformOrigin: '42% 38%'}}
        />
        <div
          style={{
            position: 'absolute',
            top: 22,
            right: 22,
            padding: '8px 16px',
            borderRadius: 8,
            background: ACCENT,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.06em',
            transform: `scale(${tag})`,
            transformOrigin: '100% 0%',
          }}
        >
          {C.a.tag}
        </div>
      </div>

      <div style={{position: 'absolute', left: X0, top: 924, width: COL, transform: `translateY(${lerp(170, 0, rise)}px)`}}>
        <div style={{border: `2px solid ${alpha(ACCENT, 0.9)}`, borderRadius: 20, padding: '32px 40px 36px', background: alpha(NIGHT, 0.5)}}>
          <Eyebrow frame={frame} at={PD.aEyebrow}>
            {C.a.eyebrow}
          </Eyebrow>
          <div style={{height: 14}} />
          <Headline frame={frame} lines={C.a.headline} at={PD.aLines} />
          <Audience frame={frame} at={PD.aSub} sweep={PD.drop} style={{marginTop: 20}} />
        </div>
        <div style={{display: 'flex', gap: 20, marginTop: 20}}>
          {C.a.chips.map((chip, i) => (
            <div
              key={chip}
              style={{
                flex: 1,
                height: 96,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0 22px 18px',
                background: i === 0 ? ACCENT : RAISED,
                border: i === 0 ? undefined : `1px solid ${alpha(TEXT, 0.1)}`,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transform: `scale(${1 + (i === 0 ? 0.05 : 0.02) * dropBump})`,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------- B · onde trava + quem conduz */

const SectionB: React.FC<{frame: number}> = ({frame}) => {
  const card = progress(frame, PD.card, 18, EASE_OUT);
  return (
    <AbsoluteFill>
      <Header />
      <LeftBar />
      <div style={{position: 'absolute', left: X0, top: 300, width: COL}}>
        <Eyebrow frame={frame} at={PD.bEyebrow}>
          {C.b.eyebrow}
        </Eyebrow>
        <div style={{height: 14}} />
        <Headline frame={frame} lines={C.b.headline} at={PD.bLines} />
        <div style={{marginTop: 34, display: 'flex', flexDirection: 'column', gap: 14}}>
          {C.b.items.map((item, i) => (
            <Item key={item} frame={frame} at={PD.items[i]} text={item} />
          ))}
        </div>
      </div>

      <div style={{position: 'absolute', left: X0, top: 950, width: COL, height: 520, perspective: 1600}}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 22,
            overflow: 'hidden',
            border: `3px solid ${ACCENT}`,
            boxShadow: `0 50px 110px ${alpha(NIGHT, 0.7)}`,
            opacity: progress(frame, PD.card, 6),
            transformOrigin: '100% 50%',
            transform: `translateX(${lerp(280, 0, card)}px) rotateY(${lerp(-30, 0, card)}deg) rotateX(${lerp(6, 0, card)}deg)`,
          }}
        >
          <Img
            src={staticFile('pordentro/retrato.jpg')}
            style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%', transform: `scale(${1.1 - 0.08 * progress(frame, PD.card, 60, (t) => t)})`}}
          />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 45%, ${alpha(NIGHT, 0.88)} 100%)`}} />
          <div style={{position: 'absolute', left: 36, bottom: 30}}>
            <div style={{fontSize: 46, fontWeight: 800, letterSpacing: '-0.01em', ...lit(frame, PD.card + 8)}}>{C.b.card.name}</div>
            <div style={{fontSize: 26, color: TOKENS.text2, marginTop: 4, ...lit(frame, PD.card + 12)}}>{C.b.card.role}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Item da lista: desliza, e o ícone de alerta acende no tempo. */
const Item: React.FC<{frame: number; at: number; text: string}> = ({frame, at, text}) => {
  const p = progress(frame, at, 10, EASE_OUT);
  const on = spring({frame: frame - at - 3, fps: FPS, config: {damping: 12, stiffness: 200}});
  return (
    <div
      style={{
        height: 90,
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '0 24px',
        background: alpha(TEXT, 0.05),
        border: `1px solid ${alpha(TEXT, 0.08)}`,
        opacity: 0.12 + 0.88 * p,
        transform: `translateX(${lerp(-40, 0, p)}px)`,
      }}
    >
      <div style={{position: 'relative', width: 46, height: 46, flex: 'none'}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${alpha(TOKENS.text3, 0.8)}`}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT, transform: `scale(${on})`}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: on > 0.5 ? TEXT : TOKENS.text3}}>!</div>
      </div>
      <div style={{fontSize: 32, fontWeight: 700}}>{text}</div>
    </div>
  );
};

/* ------------------------------------------------ C · o número grande */

const BAR_H = [0.42, 0.53, 0.65, 0.79, 1];
const SectionC: React.FC<{frame: number}> = ({frame}) => {
  const fill = progress(frame, MOVES.slide2[0] + 10, 110, (t) => t);
  return (
    <AbsoluteFill>
      <Header />
      <LeftBar />
      <div style={{position: 'absolute', left: X0, top: 296, width: COL}}>
        {C.c.big.map((w, i) => (
          <div key={w} style={{fontSize: 156, fontWeight: 800, lineHeight: '150px', letterSpacing: '-0.035em', ...lit(frame, PD.cBig[i], 12)}}>
            {w}
          </div>
        ))}
        <AccentBox frame={frame} at={PD.cBox} size={124} style={{marginTop: 18}}>
          {C.c.box}
        </AccentBox>
        <div style={{marginTop: 30, fontSize: 44, fontWeight: 800, letterSpacing: '-0.01em', ...lit(frame, PD.cSub)}}>{C.c.sub}</div>
        <div style={{marginTop: 26, height: 8, borderRadius: 4, background: alpha(TEXT, 0.12), overflow: 'hidden'}}>
          <div style={{width: `${fill * 100}%`, height: '100%', background: ACCENT}} />
        </div>
        <div style={{marginTop: 14, fontSize: 24, fontWeight: 700, color: TOKENS.text3, ...lit(frame, PD.cCaption)}}>{C.c.caption}</div>
      </div>

      <div style={{position: 'absolute', left: X0, top: 1040, width: COL, height: 420, display: 'flex', alignItems: 'flex-end', gap: 20}}>
        {BAR_H.map((h, i) => {
          const g = progress(frame, PD.bars[i], 12, EASE_OUT);
          const last = i === BAR_H.length - 1;
          const glow = last ? progress(frame, PD.bars[i] + 6, 10) : 0;
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                flex: 1,
                height: 420 * h * g,
                borderRadius: '10px 10px 4px 4px',
                background: last ? ACCENT : mix(TOKENS.bg, ACCENT, 0.26),
                boxShadow: last ? `0 0 ${60 * glow}px -10px ${ACCENT}` : undefined,
                overflow: 'hidden',
              }}
            >
              {/* Rótulo por cima (sem padding): barra com altura zero não aparece. */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 14,
                  textAlign: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  color: alpha(TEXT, last ? 1 : 0.6),
                  opacity: progress(frame, PD.bars[i] + 6, 6),
                }}
              >
                {C.c.bars[i]}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: X0, top: 1478, width: COL, textAlign: 'right', fontSize: 24, fontWeight: 700, color: TOKENS.text2, ...lit(frame, PD.bars[4] + 8)}}>
        {C.c.chartNote} →
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------- D · cartão final */

const SectionD: React.FC<{frame: number; p3: number}> = ({frame, p3}) => {
  // Cascata: cada peça chega um pouco atrás da de cima enquanto a página assenta.
  const lag = (k: number) => ({transform: `translateY(${(1 - p3) * 90 * k}px)`});
  const [, , boxAt, , , pillAt] = PD.dCascade;
  const beatPulse = frame >= pillAt ? Math.pow(Math.max(0, Math.cos((Math.PI * ((frame - pillAt) % PD_BEAT)) / PD_BEAT)), 6) : 0;
  const ring = frame >= pillAt ? ((frame - pillAt) % (2 * PD_BEAT)) / (2 * PD_BEAT) : -1;
  const sheen = progress(frame, PD.finalHit, 16, EASE_IN_OUT);

  return (
    <AbsoluteFill>
      {/* Luz atrás do título: teal, como o .hero__glow da LP (a referência usa a cor de acento). */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 620,
          top: 470 - 520,
          width: 1240,
          height: 1040,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(TOKENS.surface, 0.55)} 0%, ${alpha(TOKENS.surface, 0.18)} 38%, transparent 68%)`,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontSize: 40, fontWeight: 800, letterSpacing: '-0.01em', ...lag(0)}}>
        {C.brand}
        <span style={{color: ACCENT}}>.</span>
      </div>

      <div style={{position: 'absolute', left: X0, top: 320, width: COL, ...lag(1)}}>
        <div style={{border: `3px solid ${ACCENT}`, borderRadius: 22, padding: '34px 30px 38px', background: alpha(NIGHT, 0.55), textAlign: 'center'}}>
          <div style={{fontSize: 70, fontWeight: 800, lineHeight: '76px', letterSpacing: '-0.02em'}}>{C.d.title}</div>
          <div style={{position: 'relative', display: 'inline-block', marginTop: 14, overflow: 'hidden', borderRadius: 6}}>
            <AccentBox frame={frame} at={boxAt} size={70}>
              {C.d.box}
            </AccentBox>
            {/* Brilho que atravessa a caixa no acorde final. */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 140,
                left: `${lerp(-30, 130, sheen)}%`,
                background: `linear-gradient(90deg, transparent, ${alpha(TEXT, 0.45)}, transparent)`,
                transform: 'skewX(-18deg)',
                opacity: sheen > 0 && sheen < 1 ? 1 : 0,
              }}
            />
          </div>
        </div>
      </div>

      <Audience
        frame={frame}
        at={MOVES.scroll3[0]}
        sweep={PD.dCascade[3]}
        size={36}
        align="center"
        style={{position: 'absolute', left: X0, top: 584, width: COL, ...lag(2)}}
      />

      <div style={{position: 'absolute', left: X0, top: 700, width: COL, display: 'flex', justifyContent: 'center', gap: 16, ...lag(3)}}>
        {C.d.chips.map((chip, i) => (
          <div
            key={chip}
            style={{
              height: 54,
              lineHeight: '54px',
              padding: '0 24px',
              borderRadius: 10,
              fontSize: 24,
              fontWeight: 800,
              background: i === 0 ? ACCENT : RAISED,
              border: i === 0 ? undefined : `1px solid ${alpha(TEXT, 0.12)}`,
            }}
          >
            {chip}
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: X0, top: 776, width: COL, textAlign: 'center', fontSize: 26, lineHeight: '34px', color: TOKENS.text2, ...lag(4)}}>
        {C.d.line}
      </div>

      <div style={{position: 'absolute', left: X0, top: 836, width: COL, ...lag(5)}}>
        {ring >= 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              border: `3px solid ${alpha(TEXT, 0.5 * (1 - ring))}`,
              transform: `scale(${1 + 0.08 * ring}, ${1 + 0.4 * ring})`,
            }}
          />
        ) : null}
        <div
          style={{
            height: 104,
            borderRadius: 999,
            background: TEXT,
            color: TOKENS.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            transform: `scale(${1 + 0.025 * beatPulse})`,
            boxShadow: `0 0 ${40 + 30 * beatPulse}px -12px ${alpha(TEXT, 0.7)}`,
          }}
        >
          {C.d.cta}
          <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke={TOKENS.bg} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      <div style={{position: 'absolute', left: X0, top: 984, width: COL, height: 440, ...lag(6)}}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 22,
            overflow: 'hidden',
            border: `3px solid ${ACCENT}`,
            background: '#2A2A2A',
            boxShadow: `0 50px 110px ${alpha(NIGHT, 0.7)}`,
          }}
        >
          <Img
            src={staticFile('pordentro/perfil.jpg')}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 520,
              height: '100%',
              objectFit: 'cover',
              objectPosition: '50% 40%',
              transform: `scale(${1.12 - 0.08 * progress(frame, MOVES.scroll3[0], PD_DURATION - MOVES.scroll3[0], (t) => t)})`,
              transformOrigin: '50% 40%',
            }}
          />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #2A2A2A 36%, rgba(42,42,42,0) 62%)'}} />
          <div style={{position: 'absolute', left: 40, top: 56}}>
            <div style={{fontSize: 78, fontWeight: 800, lineHeight: '78px', letterSpacing: '-0.01em'}}>{C.d.name[0]}</div>
            <div style={{fontSize: 78, fontWeight: 800, lineHeight: '84px', letterSpacing: '-0.01em', color: 'transparent', WebkitTextStroke: `2px ${TEXT}`}}>{C.d.name[1]}</div>
            <div style={{marginTop: 20, fontSize: 25, lineHeight: '34px', color: TOKENS.text2}}>
              {C.d.bio.map((b) => (
                <div key={b}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
