import {createContext, useContext} from 'react';
import {alpha, DERIVED, mix, TOKENS} from './tokens';

/*
 * Temas do vídeo. As cenas não usam cor da marca direto: usam PAPÉIS
 * (título, corpo, card, cursor…) e cada tema diz qual token faz cada papel.
 * Mesmo código, mesma linha do tempo, mesma trilha — só a luz muda.
 *
 *  - claro:  fundo quase branco, como o vídeo de referência.
 *  - escuro: petróleo, como a LP.
 *
 * Contraste (WCAG) no claro, sobre o fundo:
 *   título --bg 14,2:1 · corpo --surface 6,9:1 · cabeçalho --text-3 3,1:1
 *   (passa só como texto grande: 34px) · vermelho 4,4:1 (só em texto grande e
 *   no botão, onde o texto é branco sobre vermelho: 4,5:1).
 */
export type ThemeName = 'claro' | 'escuro';
export type Mood = 'dia' | 'noite';

export type Theme = {
  name: ThemeName;
  // fundo
  bg: string;
  band: string;
  glowA: string;
  glowB: string;
  glow2: string;
  dot: string;
  vignette: string;
  grainOpacity: number;
  // texto
  headline: string;
  body: string;
  header: string;
  micro: string;
  // acento
  accent: string;
  accentDim: string;
  onAccent: string;
  accentTextGlow: string;
  buttonGlow: string;
  sendGlow: string;
  // "travar"
  glitchGhost: string;
  glitchBlend: 'screen' | 'multiply';
  tear: string;
  // cards e interface
  card: string;
  cardBorder: string;
  cardShadow: string;
  cardGlow: string;
  inputBorder: string;
  inputRing: string;
  chipBorder: string;
  chipBorderActive: string;
  chipText: string;
  chipTextActive: string;
  icon: string;
  iconBoxBg: string;
  iconBoxBorder: string;
  iconColor: string;
  imageChipBg: string;
  imageChipBorder: string;
  imageChipText: string;
  spinnerTrack: string;
  spinner: string;
  progressTrack: string;
  progressFill: string;
  // dossiê
  paper: string;
  ink: string;
  paperLabel: string;
  paperRule: string;
  paperChipBorder: string;
  paperShadow: string;
  // método
  ring: string;
  ringInner: string;
  nodeLit: string;
  nodeOff: string;
  nodeStroke: string;
  letterDot: string;
  // cursor
  cursorFill: string;
  cursorStroke: string;
  cursorShadow: string;
  ripple: string;
  // imagem editorial
  mood: Mood;
};

const {bg, surface, accent, accentDim, text, text2, text3} = TOKENS;

export const THEMES: Record<ThemeName, Theme> = {
  claro: {
    name: 'claro',
    bg: mix(text, text2, 0.06),
    band: alpha(text2, 0.22),
    glowA: alpha(surface, 0.1),
    glowB: alpha(surface, 0.04),
    glow2: alpha(surface, 0.06),
    dot: alpha(text3, 0.38),
    vignette: alpha(text2, 0.2),
    grainOpacity: 0.3,
    headline: bg,
    body: surface,
    header: text3,
    micro: surface,
    accent,
    accentDim,
    onAccent: text,
    accentTextGlow: 'none',
    buttonGlow: `0 26px 60px -20px ${alpha(accent, 0.6)}`,
    sendGlow: `0 12px 30px -10px ${alpha(accent, 0.7)}`,
    glitchGhost: surface,
    glitchBlend: 'multiply',
    tear: surface,
    card: text,
    cardBorder: alpha(surface, 0.14),
    cardShadow: `0 40px 90px ${alpha(bg, 0.14)}`,
    cardGlow: alpha(surface, 0.24),
    inputBorder: alpha(surface, 0.75),
    inputRing: alpha(surface, 0.08),
    chipBorder: alpha(surface, 0.25),
    chipBorderActive: surface,
    chipText: surface,
    chipTextActive: bg,
    icon: alpha(surface, 0.8),
    iconBoxBg: alpha(surface, 0.08),
    iconBoxBorder: alpha(surface, 0.25),
    iconColor: surface,
    imageChipBg: alpha(text, 0.86),
    imageChipBorder: alpha(surface, 0.2),
    imageChipText: bg,
    spinnerTrack: alpha(surface, 0.15),
    spinner: surface,
    progressTrack: alpha(surface, 0.12),
    progressFill: surface,
    paper: text,
    ink: bg,
    paperLabel: surface,
    paperRule: alpha(bg, 0.08),
    paperChipBorder: alpha(bg, 0.18),
    paperShadow: `0 50px 110px ${alpha(bg, 0.18)}, 0 0 0 2px ${alpha(surface, 0.12)}`,
    ring: alpha(text3, 0.8),
    ringInner: alpha(surface, 0.08),
    nodeLit: surface,
    nodeOff: text,
    nodeStroke: text3,
    letterDot: text3,
    cursorFill: bg,
    cursorStroke: text,
    cursorShadow: alpha(bg, 0.25),
    ripple: alpha(surface, 0.5),
    mood: 'dia',
  },
  escuro: {
    name: 'escuro',
    bg,
    band: alpha(surface, 0.18),
    glowA: alpha(surface, 0.55),
    glowB: alpha(surface, 0.22),
    glow2: alpha(surface, 0.28),
    dot: alpha(text3, 0.3),
    vignette: alpha(DERIVED.night, 0.7),
    grainOpacity: 0.55,
    headline: text,
    body: text2,
    header: text3,
    micro: text3,
    accent,
    accentDim,
    onAccent: text,
    accentTextGlow: `0 0 40px ${alpha(accent, 0.35)}`,
    buttonGlow: `0 0 100px -20px ${accent}`,
    sendGlow: `0 0 50px -6px ${accent}`,
    glitchGhost: text2,
    glitchBlend: 'screen',
    tear: text2,
    card: DERIVED.raised,
    cardBorder: alpha(text2, 0.15),
    cardShadow: `0 50px 120px ${alpha(DERIVED.shadow, 0.7)}`,
    cardGlow: alpha(surface, 0.55),
    inputBorder: alpha(text2, 0.5),
    inputRing: alpha(surface, 0.18),
    chipBorder: alpha(text2, 0.22),
    chipBorderActive: alpha(text2, 0.6),
    chipText: text2,
    chipTextActive: text,
    icon: alpha(text2, 0.75),
    iconBoxBg: alpha(surface, 0.35),
    iconBoxBorder: alpha(text2, 0.24),
    iconColor: text2,
    imageChipBg: alpha(DERIVED.night, 0.62),
    imageChipBorder: alpha(text2, 0.22),
    imageChipText: text2,
    spinnerTrack: alpha(text2, 0.18),
    spinner: text2,
    progressTrack: alpha(text2, 0.14),
    progressFill: text2,
    paper: DERIVED.paper,
    ink: bg,
    paperLabel: surface,
    paperRule: alpha(bg, 0.09),
    paperChipBorder: alpha(bg, 0.2),
    paperShadow: `0 60px 140px ${alpha(DERIVED.shadow, 0.75)}, 0 0 0 1px ${alpha(text2, 0.3)}`,
    ring: alpha(text3, 0.65),
    ringInner: alpha(text2, 0.08),
    nodeLit: text2,
    nodeOff: bg,
    nodeStroke: text3,
    letterDot: text3,
    cursorFill: text,
    cursorStroke: DERIVED.night,
    cursorShadow: alpha(DERIVED.shadow, 0.55),
    ripple: alpha(text, 0.6),
    mood: 'noite',
  },
};

export const ThemeContext = createContext<Theme>(THEMES.claro);
export const useTheme = (): Theme => useContext(ThemeContext);
