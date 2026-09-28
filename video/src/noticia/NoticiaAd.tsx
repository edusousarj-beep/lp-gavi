/*
 * Variação "Notícia": faixa de marca + card de manchete + pílula de CTA.
 * Movimentos próprios:
 *  - a marca entra pelos lados e o divisor cresce;
 *  - o card desenrola de cima para baixo;
 *  - o caminho é digitado e o fio se desenha;
 *  - a manchete BATE no tempo, palavra por palavra; "90" conta de 0 a 90;
 *  - os sublinhados se desenham sob as frases-chave;
 *  - a etiqueta chega com o espaçamento das letras fechando;
 *  - o artigo ROLA para mostrar a continuação;
 *  - a pílula cai quicando, pulsa no tempo e leva um toque de dedo.
 */
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame} from 'remotion';
import {ThemeContext, THEMES, type ThemeName} from '../brand/theme';
import {alpha, DERIVED, FONT, mix, TOKENS, WEIGHT} from '../brand/tokens';
import {Background} from '../components/Background';
import {blurIn, EASE_IN_OUT, EASE_OUT, lerp, progress} from '../lib/anim';
import {DURATION, FPS} from '../timeline';
import {NOTICIA} from './copy';
import {NOTICIA_EVENTS as E, SCROLL_BY} from './timeline';

const PAPER = mix(TOKENS.text, TOKENS.text2, 0.08);
const INK = TOKENS.bg;
const MUTED = alpha(TOKENS.bg, 0.58);

const CARD = {left: 70, top: 380, width: 940, height: 850};
const PILL_TOP = 1290;

export const NoticiaAd: React.FC<{tema: ThemeName}> = ({tema}) => (
  <ThemeContext.Provider value={THEMES[tema]}>
    <AbsoluteFill style={{background: THEMES[tema].bg}}>
      <Background />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 45% at 50% 100%, ${alpha(TOKENS.surface, 0.45)} 0%, transparent 70%)`,
        }}
      />
      <Layout />
      <Audio src={staticFile('audio/noticia.wav')} />
    </AbsoluteFill>
  </ThemeContext.Provider>
);

const Layout: React.FC = () => {
  const frame = useCurrentFrame();
  // Aproximação lenta e contínua: a peça nunca fica parada.
  const push = lerp(1, 1.035, frame / DURATION);
  return (
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 45%', fontFamily: FONT}}>
      <BrandRow frame={frame} />
      <Card frame={frame} />
      <Pill frame={frame} />
      <Caption frame={frame} />
      <Finger frame={frame} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- faixa de marca */

const BrandRow: React.FC<{frame: number}> = ({frame}) => {
  const left = blurIn(frame, E.brand, 12, 0, 12);
  const right = blurIn(frame, E.partner, 12, 0, 12);
  const div = progress(frame, E.divider, 12, EASE_OUT);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34, color: TOKENS.text}}>
      <span
        style={{
          fontSize: 50,
          fontWeight: WEIGHT.heavy,
          letterSpacing: '-0.03em',
          opacity: left.opacity,
          transform: `translateX(${lerp(-90, 0, progress(frame, E.brand, 14, EASE_OUT))}px)`,
          filter: left.blur > 0.05 ? `blur(${left.blur}px)` : undefined,
        }}
      >
        {NOTICIA.brand}
      </span>
      <span style={{width: 3, height: 64, background: alpha(TOKENS.text, 0.55), transform: `scaleY(${div})`}} />
      <span
        style={{
          fontSize: 30,
          fontWeight: WEIGHT.heavy,
          letterSpacing: '0.2em',
          opacity: right.opacity,
          transform: `translateX(${lerp(90, 0, progress(frame, E.partner, 14, EASE_OUT))}px)`,
          filter: right.blur > 0.05 ? `blur(${right.blur}px)` : undefined,
        }}
      >
        {NOTICIA.partner}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------- card */

/* Um tranco curto a cada palavra da manchete. */
function nudge(frame: number): number {
  let y = 0;
  for (const t of E.headline.flat()) {
    if (frame < t) continue;
    y += Math.sin((frame - t) * 2.4) * 6 * Math.exp(-(frame - t) / 2.5);
  }
  return y;
}

const Card: React.FC<{frame: number}> = ({frame}) => {
  const unroll = progress(frame, E.unroll, 26, EASE_OUT);
  const scroll = progress(frame, E.scroll, 30, EASE_IN_OUT);
  return (
    <div
      style={{
        position: 'absolute',
        ...CARD,
        borderRadius: 34,
        overflow: 'hidden',
        background: PAPER,
        color: INK,
        boxShadow: `0 60px 140px ${alpha(DERIVED.shadow, 0.6)}`,
        clipPath: `inset(0 0 ${(1 - unroll) * 100}% 0 round 34px)`,
        transform: `translateY(${lerp(40, 0, unroll) + nudge(frame)}px)`,
      }}
    >
      <div
        style={{
          padding: '50px 56px',
          transform: `translateY(${-SCROLL_BY * scroll}px)`,
        }}
      >
        <Crumbs frame={frame} />
        <div
          style={{
            height: 2,
            margin: '26px 0 34px',
            background: alpha(INK, 0.16),
            transform: `scaleX(${progress(frame, E.rule, 14, EASE_OUT)})`,
            transformOrigin: 'left center',
          }}
        />
        <Headline frame={frame} />
        <Quote frame={frame} />
        <Tag frame={frame} />
        <More frame={frame} />
      </div>
      {/* Esfumado na borda de baixo: o artigo continua. */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, background: `linear-gradient(180deg, ${alpha(PAPER, 0)}, ${PAPER})`}} />
    </div>
  );
};

const Crumbs: React.FC<{frame: number}> = ({frame}) => {
  const full = `${NOTICIA.crumbs[0]}   ›   ${NOTICIA.crumbs[1]}`;
  const shown = Math.max(0, Math.floor((frame - E.crumbs) * 2.2));
  return (
    <div style={{fontSize: 32, color: MUTED, whiteSpace: 'pre', height: 40}}>
      {full.slice(0, shown)}
    </div>
  );
};

const Headline: React.FC<{frame: number}> = ({frame}) => (
  <div style={{fontSize: 116, fontWeight: WEIGHT.heavy, letterSpacing: '-0.045em', lineHeight: 1}}>
    {NOTICIA.headline.map((line, l) => (
      <div key={l} style={{display: 'flex', gap: '0.24em', whiteSpace: 'nowrap'}}>
        {line.map((word, w) => {
          const t = E.headline[l][w];
          const p = progress(frame, t, 7, EASE_OUT);
          const isCounter = word === '90';
          const count = isCounter ? Math.round(90 * progress(frame, t, E.counterEnd - t, EASE_OUT)) : 0;
          return (
            <span
              key={w}
              style={{
                display: 'inline-block',
                opacity: progress(frame, t, 2),
                transform: `scale(${lerp(1.8, 1, p)})`,
                transformOrigin: '0% 70%',
                filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
                fontVariantNumeric: isCounter ? 'tabular-nums' : undefined,
                minWidth: isCounter ? '1.15em' : undefined,
              }}
            >
              {isCounter ? count : word}
            </span>
          );
        })}
      </div>
    ))}
  </div>
);

const Quote: React.FC<{frame: number}> = ({frame}) => {
  let k = 0;
  return (
    <div style={{marginTop: 36, fontSize: 38, lineHeight: 1.42}}>
      {NOTICIA.quote.map((seg, s) => {
        const words = seg.t.split(/(\s+)/);
        const ulIndex = NOTICIA.quote.filter((q, i) => q.ul && i < s).length;
        const ul = seg.ul ? progress(frame, E.underlines[ulIndex], 16, EASE_IN_OUT) : 0;
        return (
          <span
            key={s}
            style={
              seg.ul
                ? {
                    fontWeight: WEIGHT.heavy,
                    backgroundImage: `linear-gradient(${INK}, ${INK})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '0 96%',
                    backgroundSize: `${ul * 100}% 4px`,
                  }
                : undefined
            }
          >
            {words.map((wd, i) => {
              if (/^\s+$/.test(wd) || wd === '') return wd;
              const a = blurIn(frame, E.quote + 1.2 * k++, 8, 10, 8);
              return (
                <span key={i} style={{display: 'inline-block', opacity: a.opacity, transform: `translateY(${a.y}px)`}}>
                  {wd}
                </span>
              );
            })}
          </span>
        );
      })}
      <div style={{marginTop: 14, fontSize: 30, color: MUTED, opacity: progress(frame, E.author, 8)}}>{NOTICIA.author}</div>
    </div>
  );
};

/* Etiqueta: chega com as letras abertas e fecha o espaçamento. */
const Tag: React.FC<{frame: number}> = ({frame}) => {
  const p = progress(frame, E.tag, 16, EASE_OUT);
  return (
    <div
      style={{
        marginTop: 28,
        fontSize: 23,
        fontWeight: WEIGHT.heavy,
        color: MUTED,
        letterSpacing: `${lerp(0.5, 0.06, p)}em`,
        lineHeight: 1.5,
        opacity: p,
        whiteSpace: 'nowrap',
      }}
    >
      {NOTICIA.tag.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
};

/* Continuação do artigo, revelada pela rolagem. */
const More: React.FC<{frame: number}> = ({frame}) => {
  const words = (text: string, start: number, step: number) =>
    text.split(' ').map((wd, i) => {
      const a = blurIn(frame, start + step * i, 8, 12, 8);
      return (
        <span key={i}>
          {i > 0 ? ' ' : null}
          <span style={{display: 'inline-block', opacity: a.opacity, transform: `translateY(${a.y}px)`}}>{wd}</span>
        </span>
      );
    });
  return (
    <div style={{marginTop: 40, fontSize: 38, lineHeight: 1.42}}>
      <div style={{height: 2, marginBottom: 32, background: alpha(INK, 0.16)}} />
      <div>{words(NOTICIA.more, E.more, 1.2)}</div>
      <div style={{marginTop: 22, fontWeight: WEIGHT.heavy}}>{words(NOTICIA.yours, E.yours, 1.8)}</div>
    </div>
  );
};

/* -------------------------------------------------------------------- CTA */

const Pill: React.FC<{frame: number}> = ({frame}) => {
  if (frame < E.pill) return null;
  const drop = spring({frame: frame - E.pill, fps: FPS, config: {damping: 9, stiffness: 140, mass: 0.9}});
  const pressed = frame >= E.tap && frame < E.tap + 4;
  const letters = ['M.', 'O.', 'V.', 'E.'];
  // Anel pulsando a cada tempo depois que a pílula assenta.
  const since = frame - (E.pill + 18);
  const ring = since >= 0 ? (since % 18) / 18 : -1;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: PILL_TOP, display: 'flex', justifyContent: 'center'}}>
      <div style={{position: 'relative', transform: `translateY(${lerp(-160, 0, drop)}px)`}}>
        {ring >= 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              border: `4px solid ${TOKENS.accent}`,
              transform: `scale(${lerp(1, 1.3, ring)})`,
              opacity: (1 - ring) * 0.6,
            }}
          />
        ) : null}
        <div
          style={{
            height: 126,
            padding: '0 70px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            background: pressed ? TOKENS.accentDim : TOKENS.accent,
            color: TOKENS.text,
            fontSize: 46,
            fontWeight: WEIGHT.heavy,
            letterSpacing: '0.02em',
            whiteSpace: 'pre',
            boxShadow: `0 0 90px -20px ${TOKENS.accent}`,
            transform: `scale(${pressed ? 0.95 : 1})`,
          }}
        >
          {NOTICIA.pill.replace('M.O.V.E.', '')}
          {letters.map((l, i) => {
            const p = spring({frame: frame - E.letters[i], fps: FPS, config: {damping: 8, stiffness: 220, mass: 0.6}});
            return (
              <span key={l} style={{display: 'inline-block', opacity: progress(frame, E.letters[i], 2), transform: `scale(${lerp(0.2, 1, p)})`}}>
                {l}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Caption: React.FC<{frame: number}> = ({frame}) => {
  if (frame < E.caption) return null;
  const a = blurIn(frame, E.caption, 10, 20, 10);
  const bounce = frame >= E.drop ? Math.abs(Math.sin((Math.PI * (frame - E.drop)) / 18)) : 0.3 * Math.abs(Math.sin((Math.PI * (frame - E.caption)) / 36));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: PILL_TOP + 160, textAlign: 'center', color: TOKENS.text2, opacity: a.opacity, transform: `translateY(${a.y}px)`}}>
      <div style={{fontSize: 36}}>{NOTICIA.caption}</div>
      <svg width={70} height={70} viewBox="0 0 24 24" style={{marginTop: 8 + bounce * 26}} fill="none" stroke={TOKENS.text2} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
      </svg>
    </div>
  );
};

/* Toque de dedo (indicador de toque de tela), não seta de mouse: formato mobile. */
const Finger: React.FC<{frame: number}> = ({frame}) => {
  const {fingerIn, tap} = E;
  if (frame < fingerIn || frame > tap + 24) return null;
  const move = progress(frame, fingerIn, tap - fingerIn - 2, EASE_IN_OUT);
  const x = lerp(930, 760, move);
  const y = lerp(1760, PILL_TOP + 72, move);
  const press = frame >= tap && frame < tap + 5 ? 0.78 : 1;
  const fade = 1 - progress(frame, tap + 12, 12);
  const ripple = frame >= tap ? progress(frame, tap, 16) : -1;
  return (
    <>
      {ripple >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: x - 110,
            top: y - 110,
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: `4px solid ${alpha(TOKENS.text, 0.7)}`,
            transform: `scale(${lerp(0.3, 1, ripple)})`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x - 44,
          top: y - 44,
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: alpha(TOKENS.text, 0.4),
          border: `3px solid ${alpha(TOKENS.text, 0.9)}`,
          boxShadow: `0 10px 30px ${alpha(DERIVED.shadow, 0.5)}`,
          transform: `scale(${press})`,
          opacity: Math.min(progress(frame, fingerIn, 6), fade),
        }}
      />
    </>
  );
};
