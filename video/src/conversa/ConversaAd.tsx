/*
 * Variação "Conversa": o criativo de conversa da Gavi, encenado. Movimentos
 * próprios:
 *  - a janela da conversa sobe inclinada e CRESCE a cada balão, sempre
 *    centrada; cheia, passa a rolar como um app de mensagem;
 *  - a aluna digita na caixa de texto (que ganha uma linha quando quebra) e
 *    o balão VOA da caixa até o lugar dele; ticks: enviado → entregue → lido;
 *  - "digitando…" no cabeçalho e três pontinhos que VIRAM o balão da Bruna;
 *  - "volume" é riscado e "frequência" ganha marca-texto; M.O.V.E cai letra
 *    por letra; as teclas 1–4 giram; "garantia de resultado" é sublinhada à
 *    mão e a câmera chega perto;
 *  - "Não." é carimbado (a janela treme) e o balão cresce linha a linha;
 *  - no drop a janela recua e a pílula "Saiba mais" aponta para o botão.
 *
 * A janela é de um app de mensagem genérico, nas cores da marca: sem logo,
 * papel de parede, barra de status ou botões de ligação de app real.
 */
import {AbsoluteFill, Audio, Img, spring, staticFile, useCurrentFrame} from 'remotion';
import {ThemeContext, THEMES, useTheme, type ThemeName} from '../brand/theme';
import {alpha, DERIVED, FONT, mix, TOKENS, WEIGHT} from '../brand/tokens';
import {Background} from '../components/Background';
import {blurIn, EASE_IN_OUT, EASE_OUT, lerp, progress} from '../lib/anim';
import {DURATION, FPS} from '../timeline';
import {CONVERSA, type Msg, type Seg} from './copy';
import {
  BODY_PAD_BOTTOM,
  BODY_PAD_TOP,
  BUB_PAD_X,
  BUB_PAD_Y,
  CARD_W,
  CENTER_Y,
  CHIP_H,
  CONTENT_STEPS,
  CONVERSA_EVENTS as E,
  DOTS_H,
  DOTS_W,
  HEADER_H,
  INPUT_BOX,
  INPUT_LINE,
  INPUT_PAD,
  INPUT_STEPS,
  LAYOUT,
  LH,
  lineAt,
  LINE_REVEAL,
  MAX_BODY,
  SIDE,
  TEXT_SIZE,
  TIMING,
  ticks,
  typedFrames,
  TYPING_SPANS,
} from './timeline';

/* Cores do app: claras nas duas versões, como a conversa original. */
const INK = TOKENS.bg;
const WHITE = TOKENS.text;
const CHAT_BG = mix(TOKENS.text, TOKENS.text2, 0.24);
const OUT_BUBBLE = mix(TOKENS.text, TOKENS.text2, 0.62);
const MUTED = TOKENS.text3;
const TEAL = TOKENS.surface;
const SEND_W = 84;
const BUBBLE_MAX = CARD_W - 2 * SIDE - 80;

/*
 * Emoji desenhados (SVG da Noto Emoji, em public/emoji): nítidos em qualquer
 * tamanho e iguais em qualquer máquina. Nome do arquivo = códigos sem o FE0F.
 */
const emojiSrc = (ch: string) =>
  staticFile(
    `emoji/emoji_u${[...ch]
      .map((c) => c.codePointAt(0)!)
      .filter((cp) => cp !== 0xfe0f)
      .map((cp) => cp.toString(16).padStart(4, '0'))
      .join('_')}.svg`,
  );

const Emoji: React.FC<{ch: string; style?: React.CSSProperties}> = ({ch, style}) => (
  <Img src={emojiSrc(ch)} style={{display: 'inline-block', width: '1.12em', height: '1.12em', verticalAlign: '-0.2em', ...style}} />
);

export const ConversaAd: React.FC<{tema: ThemeName; aviso: string | null}> = ({tema, aviso}) => (
  <ThemeContext.Provider value={THEMES[tema]}>
    <AbsoluteFill style={{background: THEMES[tema].bg, fontFamily: FONT}}>
      <Background />
      {/* A pílula fica atrás da janela: no drop ela sai de baixo dela. */}
      <Pointer />
      <Stage />
      {aviso ? <Aviso text={aviso} /> : null}
      <Audio src={staticFile('audio/conversa.wav')} />
    </AbsoluteFill>
  </ThemeContext.Provider>
);

/* ------------------------------------------------------------- geometria */

/** Soma suavizada de degraus: cada mudança de valor anima em `dur` quadros. */
function stepped<T extends {frame: number}>(steps: T[], value: (s: T) => number, frame: number, dur: number): number {
  let v = value(steps[0]);
  for (let i = 1; i < steps.length; i++) v += (value(steps[i]) - value(steps[i - 1])) * progress(frame, steps[i].frame, dur, EASE_OUT);
  return v;
}

function geometry(frame: number) {
  const content = stepped(CONTENT_STEPS, (s) => s.bottom, frame, 10);
  const inputLines = stepped(INPUT_STEPS, (s) => s.lines, frame, 6);
  const body = Math.min(MAX_BODY, content + BODY_PAD_BOTTOM);
  const scroll = Math.max(0, content + BODY_PAD_BOTTOM - MAX_BODY);
  const inputH = INPUT_BOX + (inputLines - 1) * INPUT_LINE;
  const cardH = HEADER_H + body + inputH + 2 * INPUT_PAD;
  return {body, scroll, inputH, cardH, cardTop: CENTER_Y - cardH / 2};
}

/** Pulso curto de 0 → 1 → 0 em `dur` quadros. */
const bump = (frame: number, at: number, dur = 10) => (frame >= at ? Math.sin(Math.min(1, (frame - at) / dur) * Math.PI) : 0);

function shake(frame: number): {x: number; y: number} {
  let x = 0;
  let y = 0;
  E.punches.forEach((t, i) => {
    if (frame < t) return;
    const d = frame - t;
    const a = Math.exp(-d / 2.5) * (i === 0 ? 0.5 : 1);
    x += Math.sin(d * 2.7) * 8 * a;
    y += Math.cos(d * 3.1) * 6 * a;
  });
  return {x, y};
}

/* ----------------------------------------------------------------- palco */

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const g = geometry(frame);

  // Câmera: começa perto (janela pequena) e se afasta enquanto ela cresce;
  // empurrões curtos em "Não é você." e "Não."; chega perto do contrato.
  const base = 1.08 - 0.08 * Math.min(1, Math.max(0, (g.cardH - 360) / 600));
  const punch = 0.03 * bump(frame, E.punches[0], 12) + 0.05 * bump(frame, E.punches[1], 14);
  const focus = progress(frame, E.focus[0], 14, EASE_IN_OUT) - progress(frame, E.focus[1], 16, EASE_IN_OUT);
  const m7 = LAYOUT.find((l) => l.id === 'm7')!;
  const m7Y = g.cardTop + HEADER_H + m7.top + m7.h / 2 - g.scroll;
  const push = 1 + 0.03 * (frame / DURATION);
  // Na pausa da música (CTA chegou), a câmera recua devagar até o drop.
  const pull = progress(frame, TIMING.m11.arrive + 4, E.drop - TIMING.m11.arrive - 4, EASE_IN_OUT);
  const zoom = (base + punch + 0.07 * focus) * push * (1 - 0.06 * pull);
  const originY = lerp(CENTER_Y, m7Y, focus);

  const enter = spring({frame: frame - E.card, fps: FPS, config: {damping: 15, stiffness: 120}});
  const drop = progress(frame, E.drop, 12, EASE_IN_OUT);
  const s = shake(frame);

  return (
    <AbsoluteFill style={{transformOrigin: `540px ${originY}px`, transform: `scale(${zoom}) translate(${s.x}px, ${s.y}px)`}}>
      <div style={{position: 'absolute', left: (1080 - CARD_W) / 2, top: g.cardTop, width: CARD_W, perspective: 2000}}>
        <div
          style={{
            position: 'relative',
            height: g.cardH,
            borderRadius: 40,
            overflow: 'hidden',
            background: CHAT_BG,
            color: INK,
            fontSize: TEXT_SIZE,
            boxShadow: `0 60px 140px ${alpha(DERIVED.shadow, 0.6)}, 0 0 0 1px ${alpha(TOKENS.text2, 0.3)}`,
            transformOrigin: '50% 0%',
            transform: `translateY(${lerp(280, 0, enter) + lerp(0, -40, drop)}px) rotateX(${lerp(30, 0, enter)}deg) scale(${lerp(1, 0.84, drop)})`,
            opacity: progress(frame, E.card, 6),
          }}
        >
          <Header frame={frame} />
          <Body frame={frame} g={g} />
          <InputBar frame={frame} g={g} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- cabeçalho */

const Header: React.FC<{frame: number}> = ({frame}) => {
  const typing = TYPING_SPANS.reduce((v, [a, b]) => Math.max(v, progress(frame, a, 4) * (1 - progress(frame, b, 4))), 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: HEADER_H,
        background: WHITE,
        borderBottom: `1px solid ${alpha(MUTED, 0.25)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '0 32px',
        zIndex: 2,
      }}
    >
      <div style={{width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flex: 'none', boxShadow: `0 0 0 3px ${alpha(TOKENS.text2, 0.7)}`}}>
        <Img src={staticFile('post/avatar-bruna.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'relative', flex: 1}}>
        <div style={{fontSize: 38, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em'}}>{CONVERSA.name}</div>
        <div style={{position: 'relative', height: 36, fontSize: 28}}>
          <span style={{position: 'absolute', left: 0, top: 2, color: MUTED, opacity: 1 - typing}}>{CONVERSA.online}</span>
          <span style={{position: 'absolute', left: 0, top: 2, color: TEAL, fontWeight: 700, opacity: typing, transform: `translateY(${(1 - typing) * 8}px)`}}>
            {CONVERSA.typing}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ corpo */

type Geo = ReturnType<typeof geometry>;

const Body: React.FC<{frame: number; g: Geo}> = ({frame, g}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: HEADER_H,
      height: g.body,
      overflow: 'hidden',
      backgroundImage: `radial-gradient(${alpha(MUTED, 0.16)} 2px, transparent 2.5px)`,
      backgroundSize: '34px 34px',
    }}
  >
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-g.scroll}px)`}}>
      <DayChip />
      {CONVERSA.messages.map((m, i) => {
        const t = TIMING[m.id];
        return (
          <div key={m.id}>
            {t.dots !== undefined && frame >= t.dots && frame < t.arrive + 4 ? <Dots frame={frame} top={LAYOUT[i].top} from={t.dots} arrive={t.arrive} /> : null}
            {frame >= t.arrive ? <Bubble msg={m} index={i} frame={frame} g={g} /> : null}
          </div>
        );
      })}
    </div>
  </div>
);

const DayChip: React.FC = () => (
  <div style={{position: 'absolute', top: BODY_PAD_TOP, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div
      style={{
        height: CHIP_H,
        lineHeight: `${CHIP_H}px`,
        padding: '0 22px',
        borderRadius: 14,
        background: alpha(WHITE, 0.92),
        color: MUTED,
        fontSize: 24,
        fontWeight: 700,
        boxShadow: `0 1px 0 ${alpha(INK, 0.08)}`,
      }}
    >
      {CONVERSA.day}
    </div>
  </div>
);

/* Três pontinhos pulando em onda; somem quando o balão chega no lugar deles. */
const Dots: React.FC<{frame: number; top: number; from: number; arrive: number}> = ({frame, top, from, arrive}) => {
  const pop = spring({frame: frame - from, fps: FPS, config: {damping: 12, stiffness: 200}});
  const out = progress(frame, arrive, 4);
  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE,
        top,
        width: DOTS_W,
        height: DOTS_H,
        borderRadius: 24,
        borderTopLeftRadius: 6,
        background: WHITE,
        boxShadow: `0 1px 0 ${alpha(INK, 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        transformOrigin: '0% 0%',
        transform: `scale(${pop})`,
        opacity: 1 - out,
      }}
    >
      {[0, 1, 2].map((k) => {
        const wave = Math.max(0, Math.sin(((frame - from) / 18) * Math.PI * 2 - k * 0.9));
        return <div key={k} style={{width: 16, height: 16, borderRadius: '50%', background: mix(MUTED, WHITE, 0.2 * (1 - wave)), transform: `translateY(${-9 * wave}px)`}} />;
      })}
    </div>
  );
};

/* ----------------------------------------------------------------- balão */

const Bubble: React.FC<{msg: Msg; index: number; frame: number; g: Geo}> = ({msg, index, frame, g}) => {
  const geo = LAYOUT[index];
  const {arrive} = TIMING[msg.id];
  const mine = msg.from === 'aluna';
  const reveal = LINE_REVEAL[msg.id];

  let transform: string;
  let opacity: number;
  if (mine) {
    // Voa da caixa de texto até o lugar dele.
    const p = progress(frame, arrive, 12, EASE_OUT);
    const inputTop = g.scroll + g.body + INPUT_PAD;
    transform = `translateY(${(inputTop - geo.top) * (1 - p)}px) scale(${lerp(0.94, 1, p)})`;
    opacity = progress(frame, arrive, 3);
  } else if (msg.lines.some((line) => line.some((seg) => seg.kind === 'stamp'))) {
    // Quem anima é o carimbo: o balão só aparece.
    transform = 'none';
    opacity = progress(frame, arrive, 2);
  } else {
    // Brota do rabinho, no lugar dos pontinhos.
    const p = spring({frame: frame - arrive, fps: FPS, config: {damping: 13, stiffness: 190, mass: 0.8}});
    transform = `scale(${lerp(0.55, 1, p)}) rotate(${lerp(-3, 0, p)}deg)`;
    opacity = progress(frame, arrive, 4);
  }

  // O balão que cresce linha a linha anima a própria altura.
  const shown = reveal ? reveal.reduce((n, f, l) => (l === 0 ? 1 : n + progress(frame, f, 10, EASE_OUT)), 0) : msg.lines.length;
  const height = 2 * BUB_PAD_Y + shown * LH;
  const bg = mine ? OUT_BUBBLE : WHITE;

  return (
    <div
      style={{
        position: 'absolute',
        top: geo.top,
        [mine ? 'right' : 'left']: SIDE,
        maxWidth: BUBBLE_MAX,
        height,
        padding: `${BUB_PAD_Y}px ${BUB_PAD_X}px`,
        borderRadius: 24,
        [mine ? 'borderTopRightRadius' : 'borderTopLeftRadius']: geo.tail ? 6 : 24,
        background: bg,
        boxShadow: `0 1px 0 ${alpha(INK, 0.1)}`,
        transformOrigin: mine ? '100% 100%' : '0% 0%',
        transform,
        opacity,
      }}
    >
      {geo.tail ? <Tail color={bg} mine={mine} /> : null}
      {/* Só as linhas ainda não reveladas ficam escondidas; o carimbo pode vazar. */}
      <div style={{position: 'relative', height: height - 2 * BUB_PAD_Y, clipPath: reveal ? 'inset(-200px -400px 0 -400px)' : undefined}}>
        {msg.lines.map((line, l) => {
          const a = reveal && l > 0 ? blurIn(frame, lineAt(msg.id, l), 10, 18, 8) : null;
          return (
            <div
              key={l}
              style={{
                height: LH,
                lineHeight: `${LH}px`,
                whiteSpace: 'pre',
                opacity: a ? a.opacity : 1,
                transform: a ? `translateY(${a.y}px)` : undefined,
                filter: a && a.blur > 0.05 ? `blur(${a.blur}px)` : undefined,
              }}
            >
              {line.map((seg, k) => (
                <Segment key={k} seg={seg} msgId={msg.id} frame={frame} />
              ))}
              {l === msg.lines.length - 1 ? <span style={{display: 'inline-block', width: mine ? 128 : 92}} /> : null}
            </div>
          );
        })}
      </div>
      <Stamp msg={msg} frame={frame} />
    </div>
  );
};

/* Rabinho do primeiro balão de cada sequência. */
const Tail: React.FC<{color: string; mine: boolean}> = ({color, mine}) => (
  <svg
    width={18}
    height={22}
    viewBox="0 0 18 22"
    style={{position: 'absolute', top: 0, [mine ? 'right' : 'left']: -14, transform: mine ? 'scaleX(-1)' : undefined}}
  >
    <path d="M18 0 H3 Q0 0 1.6 2.6 L18 22 Z" fill={color} />
  </svg>
);

/* Horário + ticks (enviado, entregue, lido). */
const Stamp: React.FC<{msg: Msg; frame: number}> = ({msg, frame}) => {
  const mine = msg.from === 'aluna';
  const tk = ticks(TIMING[msg.id].arrive);
  const double = frame >= tk.delivered;
  const read = progress(frame, tk.read, 6);
  const pop = bump(frame, tk.read, 8);
  return (
    <div style={{position: 'absolute', right: 20, bottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 23, color: MUTED}}>
      <span>{msg.time}</span>
      {mine ? (
        <svg width={34} height={22} viewBox="0 0 34 22" style={{transform: `scale(${1 + 0.35 * pop})`}}>
          <g fill="none" stroke={mix(MUTED, TEAL, read)} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12 8.5 17.5 19 5" />
            {double ? <path d="M13.5 15.5 15.5 17.5 26 5" opacity={progress(frame, tk.delivered, 3)} /> : null}
          </g>
        </svg>
      ) : null}
    </div>
  );
};

/* ---------------------------------------------------------------- trechos */

const Segment: React.FC<{seg: Seg; msgId: string; frame: number}> = ({seg, msgId, frame}) => {
  const {arrive} = TIMING[msgId];
  const base: React.CSSProperties = {position: 'relative', display: 'inline-block'};

  switch (seg.kind) {
    case 'name':
      return <span style={{fontWeight: 700}}>{seg.t}</span>;

    case 'emoji': {
      const keycap = /⃣/.test(seg.t);
      const pointer = seg.t === '👇';
      let transform = '';
      if (keycap) {
        // Tecla gira no eixo Y, logo depois de o balão chegar.
        const p = progress(frame, arrive + 2, 10, EASE_OUT);
        transform = `perspective(300px) rotateY(${lerp(100, 0, p)}deg)`;
      } else if (pointer) {
        // Dedo pulando no tempo, apontando para o botão.
        transform = `translateY(${Math.abs(Math.sin((Math.PI * (frame - arrive)) / 18)) * 12}px)`;
      } else {
        transform = `scale(${1 + 0.4 * bump(frame, arrive + 6, 12)}) rotate(${-12 * bump(frame, arrive + 6, 12)}deg)`;
      }
      return <Emoji ch={seg.t} style={{transform}} />;
    }

    case 'strike': {
      const p = progress(frame, E.strike, 8, EASE_OUT);
      return (
        <span style={{...base, color: mix(INK, MUTED, p)}}>
          {seg.t}
          <span
            style={{
              position: 'absolute',
              left: -4,
              right: -4,
              top: '52%',
              height: 4,
              borderRadius: 2,
              background: alpha(INK, 0.75),
              transform: `scaleX(${p})`,
              transformOrigin: 'left center',
            }}
          />
        </span>
      );
    }

    case 'hl': {
      const p = progress(frame, E.highlight, 12, EASE_OUT);
      return (
        <span style={{...base, fontWeight: 700}}>
          <span
            style={{
              position: 'absolute',
              left: -6,
              right: -6,
              top: '16%',
              bottom: '10%',
              borderRadius: 6,
              background: TOKENS.text2,
              transform: `scaleX(${p}) skewX(-8deg)`,
              transformOrigin: 'left center',
            }}
          />
          <span style={{position: 'relative'}}>{seg.t}</span>
        </span>
      );
    }

    case 'emph': {
      // Pulo no lugar (sem mudar a largura) e um lampejo de teal.
      const b = bump(frame, E.emph, 12);
      return <span style={{...base, color: mix(INK, TEAL, b), transform: `translateY(${-12 * b}px)`}}>{seg.t}</span>;
    }

    case 'ul': {
      const p = progress(frame, E.underline, 16, EASE_IN_OUT);
      // Único vermelho do quadro: vira tinta antes de a pílula (vermelha) entrar.
      const toInk = progress(frame, E.drop - 12, 12);
      return (
        <span style={{...base, fontWeight: 700}}>
          {seg.t}
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" style={{position: 'absolute', left: -4, bottom: -2, width: 'calc(100% + 8px)', height: 16, overflow: 'visible'}}>
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
        </span>
      );
    }

    case 'move':
      return (
        <span style={{...base, fontWeight: 700}}>
          {['M.', 'O.', 'V.', 'E'].map((l, i) => {
            const t = E.letters[i];
            const p = spring({frame: frame - t, fps: FPS, config: {damping: 8, stiffness: 200, mass: 0.6}});
            return (
              <span key={l} style={{display: 'inline-block', opacity: progress(frame, t, 3), transform: `translateY(${lerp(-46, 0, p)}px)`}}>
                {l}
              </span>
            );
          })}
        </span>
      );

    case 'stamp': {
      // Carimbo: chega grande e torto, assenta no tempo.
      const p = progress(frame, arrive, 7, EASE_OUT);
      return (
        <span
          style={{
            ...base,
            fontWeight: 700,
            transform: `scale(${lerp(2.4, 1, p)}) rotate(${lerp(-10, 0, p)}deg)`,
            transformOrigin: '20% 60%',
          }}
        >
          {seg.t}
        </span>
      );
    }

    default:
      return <span>{seg.t}</span>;
  }
};

/* ------------------------------------------------------- caixa de texto */

const InputBar: React.FC<{frame: number; g: Geo}> = ({frame, g}) => {
  // Qual digitação está ativa (ou nenhuma) neste quadro.
  const active = Object.keys(CONVERSA.typed).find((id) => frame >= TIMING[id].typing![0] - 1 && frame < TIMING[id].arrive);
  const lines = active ? CONVERSA.typed[active] : null;
  const frames = active ? typedFrames(active) : null;
  const sendPress = Object.keys(CONVERSA.typed).reduce((v, id) => Math.max(v, bump(frame, TIMING[id].arrive - 2, 8)), 0);
  const hasText = !!frames && frame >= frames[0][0];
  const caretOn = Math.floor(frame / 8) % 2 === 0 || !!frames?.flat().some((f) => frame - f >= 0 && frame - f < 4);

  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE,
        right: SIDE,
        top: HEADER_H + g.body + INPUT_PAD,
        height: g.inputH,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
      }}
    >
      <div
        style={{
          flex: 1,
          height: g.inputH,
          borderRadius: 42,
          background: WHITE,
          boxShadow: `0 1px 0 ${alpha(INK, 0.1)}`,
          padding: `${(INPUT_BOX - LH) / 2}px 30px`,
          overflow: 'hidden',
        }}
      >
        {lines && frames && hasText ? (
          lines.map((line, l) => {
            const chars = [...line];
            const n = frames[l].filter((f) => frame >= f).length;
            if (n === 0) return null;
            const done = frames.flat().filter((f) => frame >= f).length === frames.flat().length;
            const last = l === lines.length - 1 || frames[l + 1].every((f) => frame < f);
            return (
              <div key={l} style={{height: INPUT_LINE, lineHeight: `${LH}px`, whiteSpace: 'pre'}}>
                {chars.slice(0, n).map((ch, k) =>
                  /\p{Extended_Pictographic}/u.test(ch) ? (
                    <Emoji key={k} ch={ch} />
                  ) : (
                    <span key={k}>{ch}</span>
                  ),
                )}
                {last && (caretOn || !done) ? <Caret /> : null}
              </div>
            );
          })
        ) : (
          <div style={{height: INPUT_LINE, lineHeight: `${LH}px`, color: MUTED}}>
            {active ? <Caret /> : null}
            {CONVERSA.placeholder}
          </div>
        )}
      </div>
      <div
        style={{
          width: SEND_W,
          height: SEND_W,
          borderRadius: '50%',
          flex: 'none',
          background: TEAL,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${1 - 0.14 * sendPress + (hasText ? 0.04 : 0)})`,
          boxShadow: hasText ? `0 0 0 ${6 * sendPress}px ${alpha(TEAL, 0.25)}` : undefined,
        }}
      >
        <svg width={40} height={40} viewBox="0 0 24 24" fill={WHITE}>
          <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8Z" />
        </svg>
      </div>
    </div>
  );
};

const Caret: React.FC = () => (
  <span style={{display: 'inline-block', width: 3, height: 44, marginLeft: 2, verticalAlign: '-0.2em', background: TEAL, borderRadius: 2}} />
);

/* ---------------------------------------------------------------- aviso */

/* Rótulo opcional (ex.: "Conversa ilustrativa"), para quando a conversa for encenada. */
const Aviso: React.FC<{text: string}> = ({text}) => {
  const theme = useTheme();
  return (
    <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontSize: 28, color: theme.micro, letterSpacing: '0.04em'}}>
      {text}
    </div>
  );
};

/* ---------------------------------------------------------------- seta */

/* No drop: pílula "Saiba mais" + seta pulando no tempo, apontando para o botão do anúncio. */
const Pointer: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const {drop} = E;
  if (frame < drop) return null;
  const pop = spring({frame: frame - drop, fps: FPS, config: {damping: 14, stiffness: 150}});
  const beat = Math.abs(Math.sin((Math.PI * (frame - drop)) / 18));
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: 1360,
          display: 'flex',
          alignItems: 'center',
          height: 116,
          padding: '0 64px',
          borderRadius: 999,
          background: TOKENS.accent,
          color: TOKENS.text,
          fontSize: 46,
          fontWeight: WEIGHT.heavy,
          letterSpacing: '-0.01em',
          boxShadow: `0 0 90px -20px ${TOKENS.accent}`,
          transform: `translateY(${lerp(120, 0, pop)}px) scale(${pop})`,
        }}
      >
        {CONVERSA.pill}
      </div>
      <svg
        width={80}
        height={80}
        viewBox="0 0 24 24"
        style={{position: 'absolute', top: 1504 + beat * 30, opacity: progress(frame, drop + 6, 8)}}
        fill="none"
        stroke={theme.headline}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
      </svg>
    </AbsoluteFill>
  );
};
