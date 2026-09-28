/*
 * Variação "Post": o post da Bruna vira vídeo. Movimentos próprios, diferentes
 * da peça principal:
 *  - o card vira de trás para a frente em 3D e CRESCE à medida que o texto entra;
 *  - câmera de leitura: aproxima e desce até o bloco que está entrando;
 *  - "PROPOSTA:" é carimbada no drop (o card treme);
 *  - palavras caem, deslizam, batem no tempo (staccato) conforme o bloco;
 *  - marca-texto passa em "90 dias"; "garantia de resultado" é sublinhada à mão;
 *  - no fim a câmera recua, o card sobe e uma seta pula no tempo apontando
 *    para o botão "Saiba mais" do anúncio.
 */
import {AbsoluteFill, Audio, Img, spring, staticFile, useCurrentFrame} from 'remotion';
import {ThemeContext, THEMES, type ThemeName} from '../brand/theme';
import {alpha, DERIVED, FONT, FONT_SERIF, mix, TOKENS, WEIGHT} from '../brand/tokens';
import {Background} from '../components/Background';
import {blurIn, EASE_IN_OUT, EASE_OUT, lerp, progress} from '../lib/anim';
import {DURATION, FPS} from '../timeline';
import {POST, type PostBlock, type Tok} from './copy';
import {
  BLOCKS,
  CAMERA,
  CARD_H,
  CARD_W,
  HEADER_H,
  LH,
  NUM_COL,
  PAD_BOTTOM,
  PAD_TOP,
  PAD_X,
  POST_EVENTS,
  TEXT_SIZE,
  TOKEN_FRAMES,
} from './timeline';

const PAPER = TOKENS.text;
const INK = TOKENS.bg;
const ANCHOR_Y = 880; // onde a câmera põe o foco na tela

export const PostAd: React.FC<{tema: ThemeName}> = ({tema}) => (
  <ThemeContext.Provider value={THEMES[tema]}>
    <AbsoluteFill style={{background: THEMES[tema].bg}}>
      <Background />
      <Stage />
      <TopFade color={THEMES[tema].bg} />
      <Pointer />
      <Audio src={staticFile('audio/post.wav')} />
    </AbsoluteFill>
  </ThemeContext.Provider>
);

/* O texto que a câmera deixa para cima some num degradê, sem corte seco. */
const TopFade: React.FC<{color: string}> = ({color}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 230,
      background: `linear-gradient(180deg, ${color} 25%, ${alpha(color, 0)} 100%)`,
    }}
  />
);

/* ---------------------------------------------------------------- câmera */

function cameraAt(frame: number) {
  let prev = CAMERA[0];
  let cur = CAMERA[0];
  for (const k of CAMERA) if (frame >= k.frame) {
    prev = cur;
    cur = k;
  }
  if (cur === CAMERA[0]) return {focus: cur.focus, zoom: cur.zoom};
  const dur = cur.frame >= POST_EVENTS.overview ? 24 : 14;
  const p = progress(frame, cur.frame, dur, EASE_IN_OUT);
  return {focus: lerp(prev.focus, cur.focus, p), zoom: lerp(prev.zoom, cur.zoom, p)};
}

/* O card cresce até o fim do bloco mais novo. */
function cardHeight(frame: number): number {
  const starts = [POST_EVENTS.card, ...POST.blocks.map((b) => POST_EVENTS.starts[b.id])];
  const bottoms = [BLOCKS[0].top - 20, ...BLOCKS.map((b) => b.bottom)];
  let h = bottoms[0];
  for (let i = 1; i < bottoms.length; i++) h += (bottoms[i] - bottoms[i - 1]) * progress(frame, starts[i] - 5, 14, EASE_OUT);
  return h + PAD_BOTTOM;
}

/* Tranco curto no card: no carimbo e em cada "sem". */
function shake(frame: number): {x: number; y: number} {
  let x = 0;
  let y = 0;
  for (const t of [POST_EVENTS.stamp, ...POST_EVENTS.sem]) {
    if (frame < t) continue;
    const d = frame - t;
    const a = Math.exp(-d / 2.5);
    x += Math.sin(d * 2.7) * 7 * a;
    y += Math.cos(d * 3.1) * 5 * a;
  }
  return {x, y};
}

/* ----------------------------------------------------------------- palco */

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  // Aproximação lenta e contínua: mesmo nas pausas de leitura, nada fica parado.
  const push = 1 + 0.045 * (frame / DURATION);
  const flip = spring({frame: frame - POST_EVENTS.card, fps: FPS, config: {damping: 16, stiffness: 110, mass: 1}});
  const s = shake(frame);
  const h = Math.min(CARD_H, cardHeight(frame));

  return (
    <div
      style={{
        position: 'absolute',
        left: 540,
        top: ANCHOR_Y,
        transformOrigin: '0 0',
        transform: `scale(${cam.zoom * push}) translate(${-CARD_W / 2 + s.x}px, ${-cam.focus + s.y}px)`,
      }}
    >
      <div style={{perspective: 2200, perspectiveOrigin: '50% 0%'}}>
        <div
          style={{
            position: 'relative',
            width: CARD_W,
            height: h,
            borderRadius: 44,
            overflow: 'hidden',
            background: PAPER,
            color: INK,
            fontFamily: FONT_SERIF,
            fontSize: TEXT_SIZE,
            boxShadow: `0 60px 140px ${alpha(DERIVED.shadow, 0.6)}, 0 0 0 1px ${alpha(TOKENS.text2, 0.25)}`,
            transformOrigin: '50% 0%',
            transform: `translateY(${lerp(360, 0, flip)}px) rotateX(${lerp(-72, 0, flip)}deg)`,
            opacity: progress(frame, POST_EVENTS.card, 6),
          }}
        >
          <Header frame={frame} />
          {POST.blocks.map((b, i) => (
            <Block key={b.id} block={b} index={i} frame={frame} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- cabeçalho */

const Header: React.FC<{frame: number}> = ({frame}) => {
  const {avatar, name, handle, badge} = POST_EVENTS;
  const pop = spring({frame: frame - avatar, fps: FPS, config: {damping: 11, stiffness: 170}});
  const b = spring({frame: frame - badge, fps: FPS, config: {damping: 10, stiffness: 150}});
  const h = blurIn(frame, handle, 10, 14, 8);
  let i = 0;
  return (
    <div style={{position: 'absolute', left: PAD_X, top: PAD_TOP, height: HEADER_H, display: 'flex', alignItems: 'center', gap: 26}}>
      <div
        style={{
          width: 108,
          height: 108,
          borderRadius: '50%',
          overflow: 'hidden',
          flex: 'none',
          transform: `scale(${pop})`,
          boxShadow: `0 0 0 3px ${alpha(TOKENS.text2, 0.6)}`,
        }}
      >
        <Img src={staticFile('post/avatar-bruna.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 48, lineHeight: 1.1, whiteSpace: 'pre'}}>
          <span>
            {[...POST.name].map((ch) => {
              const a = blurIn(frame, name + i++ * 0.7, 8, 12, 8);
              return (
                <span key={i} style={{display: 'inline-block', opacity: a.opacity, transform: `translateY(${a.y}px)`, filter: a.blur > 0.05 ? `blur(${a.blur}px)` : undefined}}>
                  {ch}
                </span>
              );
            })}
          </span>
          <Badge size={42} style={{transform: `scale(${b}) rotate(${lerp(-140, 0, b)}deg)`}} />
        </div>
        <div style={{marginTop: 4, fontSize: 38, color: TOKENS.text3, opacity: h.opacity, transform: `translateY(${h.y}px)`}}>
          {POST.handle}
        </div>
      </div>
    </div>
  );
};

/* Selo de verificado no teal da marca (roseta de 8 pontas + check). */
const Badge: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => {
  const pts = Array.from({length: 96}, (_, k) => {
    const a = (k / 96) * Math.PI * 2;
    const r = 10.4 * (1 + 0.09 * Math.cos(8 * a));
    return `${12 + r * Math.cos(a)},${12 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none', ...style}}>
      <polygon points={pts} fill={TOKENS.surface} />
      <path d="m7.4 12.4 3 3 6.2-6.4" fill="none" stroke={TOKENS.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ---------------------------------------------------------------- blocos */

const Block: React.FC<{block: PostBlock; index: number; frame: number}> = ({block, index, frame}) => {
  const geo = BLOCKS[index];
  const frames = TOKEN_FRAMES[index];
  const start = POST_EVENTS.starts[block.id];
  // O número vira no eixo X, como um placar.
  const num = progress(frame, start, 9, EASE_OUT);
  return (
    <div style={{position: 'absolute', left: PAD_X, top: geo.top, right: PAD_X}}>
      {block.num ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: LH,
            lineHeight: `${LH}px`,
            opacity: num,
            transform: `perspective(400px) rotateX(${lerp(-95, 0, num)}deg)`,
            transformOrigin: '50% 60%',
          }}
        >
          {block.num} —
        </div>
      ) : null}
      <div style={{marginLeft: block.num ? NUM_COL : 0}}>
        {block.lines.map((line, l) => (
          <div key={l} style={{height: LH, lineHeight: `${LH}px`, whiteSpace: 'pre'}}>
            {line.map((tok, k) => (
              <span key={k}>
                {k > 0 ? ' ' : null}
                <Token tok={tok} blockId={block.id} at={frames[l][k]} frame={frame} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Token: React.FC<{tok: Tok; blockId: string; at: number; frame: number}> = ({tok, blockId, at, frame}) => {
  if (tok.kind === 'move') return <MoveLetters frame={frame} />;

  const base: React.CSSProperties = {display: 'inline-block', position: 'relative'};
  let style: React.CSSProperties;

  if (tok.kind === 'bold') {
    // Carimbo: chega grande e torto, assenta no drop.
    const p = progress(frame, at, 7, EASE_OUT);
    style = {
      ...base,
      fontWeight: 700,
      opacity: progress(frame, at, 2),
      transform: `scale(${lerp(2.3, 1, p)}) rotate(${lerp(-9, 0, p)}deg)`,
      transformOrigin: '30% 60%',
    };
  } else if (blockId === 'lead') {
    // Palavras caindo, com quique.
    const p = spring({frame: frame - at, fps: FPS, config: {damping: 9, stiffness: 190, mass: 0.7}});
    style = {...base, opacity: progress(frame, at, 3), transform: `translateY(${lerp(-70, 0, p)}px)`};
  } else if (blockId === 'sem') {
    // Staccato: cada pedaço bate no tempo.
    const p = progress(frame, at, 6, EASE_OUT);
    style = {
      ...base,
      opacity: progress(frame, at, 2),
      transform: `scale(${lerp(1.35, 1, p)})`,
      filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
      transformOrigin: '0% 60%',
    };
  } else if (blockId === 'seu' || blockId === 'cta') {
    const a = blurIn(frame, at, 9, 22, 10);
    style = {...base, opacity: a.opacity, transform: `translateY(${a.y}px)`, filter: a.blur > 0.05 ? `blur(${a.blur}px)` : undefined};
  } else {
    // Itens: deslizam da direita.
    const p = progress(frame, at, 10, EASE_OUT);
    style = {
      ...base,
      opacity: p,
      transform: `translateX(${lerp(56, 0, p)}px)`,
      filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
    };
  }

  if (tok.kind === 'hl' || tok.kind === 'ul') {
    const r = recap(frame, POST_EVENTS.recap[tok.kind]);
    style = {...style, transform: `${style.transform ?? ''} scale(${1 + 0.16 * r})`, transformOrigin: '0% 60%'};
  }

  if (tok.kind === 'emph') {
    const bump = frame >= at + 6 ? Math.sin(Math.min(1, (frame - at - 6) / 10) * Math.PI) : 0;
    style = {...style, fontWeight: 700, transform: `${style.transform ?? ''} scale(${1 + 0.2 * bump})`};
  }

  return (
    <span style={style}>
      {tok.kind === 'hl' ? <Highlight frame={frame} /> : null}
      <span style={{position: 'relative'}}>{tok.t}</span>
      {tok.kind === 'ul' ? <Underline frame={frame} /> : null}
    </span>
  );
};

/* Marca-texto no teal claro da marca, passando da esquerda para a direita. */
const Highlight: React.FC<{frame: number}> = ({frame}) => {
  const p = progress(frame, POST_EVENTS.highlight, 12, EASE_OUT);
  return (
    <span
      style={{
        position: 'absolute',
        left: -8,
        right: -8,
        top: '22%',
        bottom: '6%',
        background: TOKENS.text2,
        borderRadius: 6,
        transform: `scaleX(${p}) skewX(-8deg)`,
        transformOrigin: 'left center',
      }}
    />
  );
};

/* Sublinhado à mão, vermelho enquanto é o foco; vira tinta quando o CTA entra. */
const Underline: React.FC<{frame: number}> = ({frame}) => {
  const p = progress(frame, POST_EVENTS.underline, 16, EASE_IN_OUT);
  const toInk = progress(frame, POST_EVENTS.lift, 12);
  return (
    <svg
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      style={{position: 'absolute', left: -4, right: -4, bottom: -8, width: 'calc(100% + 8px)', height: 18, overflow: 'visible'}}
    >
      <path
        d="M2 12 C 50 6, 90 15, 140 10 S 230 6, 298 11"
        pathLength={100}
        fill="none"
        stroke={mix(TOKENS.accent, INK, toInk)}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="100 100"
        strokeDashoffset={100 * (1 - p)}
      />
    </svg>
  );
};

/* Pulso de recapitulação: sobe e volta em 12 quadros. */
function recap(frame: number, at: number): number {
  return frame >= at ? Math.sin(Math.min(1, (frame - at) / 12) * Math.PI) : 0;
}

/* M.O.V.E.: cada letra cai no seu tempo (mesmas notas da trilha). */
const MoveLetters: React.FC<{frame: number}> = ({frame}) => (
  <span
    style={{
      display: 'inline-block',
      fontWeight: 700,
      transform: `scale(${1 + 0.16 * recap(frame, POST_EVENTS.recap.move)})`,
      transformOrigin: '0% 60%',
    }}
  >
    {['M.', 'O.', 'V.', 'E.'].map((l, i) => {
      const at = POST_EVENTS.letters[i];
      const p = spring({frame: frame - at, fps: FPS, config: {damping: 8, stiffness: 200, mass: 0.6}});
      return (
        <span key={l} style={{display: 'inline-block', opacity: progress(frame, at, 3), transform: `translateY(${lerp(-60, 0, p)}px)`}}>
          {l}
        </span>
      );
    })}
  </span>
);

/* ---------------------------------------------------------------- seta */

/* No fim: pílula "Saiba mais" + seta pulando no tempo, apontando para baixo. */
const Pointer: React.FC = () => {
  const frame = useCurrentFrame();
  const {pill, drop} = POST_EVENTS;
  if (frame < pill) return null;
  const pop = spring({frame: frame - pill, fps: FPS, config: {damping: 11, stiffness: 150}});
  // Um pulo por tempo (18 quadros) depois do drop; antes, um balanço leve.
  const beat = frame >= drop ? Math.abs(Math.sin((Math.PI * (frame - drop)) / 18)) : 0.3 * Math.abs(Math.sin((Math.PI * (frame - pill)) / 36));
  return (
    <AbsoluteFill style={{alignItems: 'center', fontFamily: FONT}}>
      <div
        style={{
          position: 'absolute',
          top: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          height: 124,
          padding: '0 64px',
          borderRadius: 999,
          background: TOKENS.accent,
          color: TOKENS.text,
          fontSize: 48,
          fontWeight: WEIGHT.heavy,
          letterSpacing: '-0.01em',
          boxShadow: `0 0 90px -20px ${TOKENS.accent}`,
          transform: `scale(${pop})`,
        }}
      >
        {POST.pill}
      </div>
      <svg
        width={84}
        height={84}
        viewBox="0 0 24 24"
        style={{position: 'absolute', top: 1450 + beat * 34, opacity: progress(frame, pill + 6, 8)}}
        fill="none"
        stroke={TOKENS.text}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
      </svg>
    </AbsoluteFill>
  );
};
