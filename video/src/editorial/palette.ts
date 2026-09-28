/*
 * Luz da imagem editorial. Mesma cidade (mesmo seed), mesma sala; muda só a
 * paleta. "dia" acompanha o tema claro — e a manhã combina com "Hoje, 9h";
 * "noite" acompanha o tema escuro. Tudo derivado dos tokens da marca.
 */
import {alpha, DERIVED, mix, TOKENS} from '../brand/tokens';
import type {Mood} from '../brand/theme';

const {bg, surface, text, text2} = TOKENS;
const {night, shadow, deep} = DERIVED;

export type CityPalette = {
  sky: [number, string][];
  sunCore: string;
  sunGlow: string;
  sunGlowOpacity: number;
  cloud: string;
  cloudAlpha: [number, number, number, number];
  far: [string, string];
  farOpacity: number;
  haze: string;
  hazeOpacity: number;
  mid: [string, string];
  midWindow: string;
  midWindowScale: number;
  near: [string, string];
  nearWindow: string;
  nearWindowScale: number;
  ground: string;
  background: string;
  beacons: boolean;
  grain: number;
};

export const CITY: Record<Mood, CityPalette> = {
  noite: {
    sky: [
      [0, night],
      [0.34, bg],
      [0.58, mix(bg, surface, 0.6)],
      [0.72, mix(surface, text2, 0.42)],
      [0.8, mix(surface, text2, 0.2)],
      [1, surface],
    ],
    sunCore: mix(text2, text, 0.55),
    sunGlow: text2,
    sunGlowOpacity: 0.55,
    cloud: text2,
    cloudAlpha: [0.1, 0.08, 0.12, 0.1],
    far: [mix(surface, text2, 0.3), mix(surface, bg, 0.2)],
    farOpacity: 0.75,
    haze: text2,
    hazeOpacity: 0.16,
    mid: [mix(bg, surface, 0.45), mix(bg, surface, 0.2)],
    midWindow: text2,
    midWindowScale: 1,
    near: [mix(bg, surface, 0.12), deep],
    nearWindow: text2,
    nearWindowScale: 0.8,
    ground: deep,
    background: night,
    beacons: true,
    grain: 0.09,
  },
  dia: {
    sky: [
      [0, mix(surface, text2, 0.5)],
      [0.3, mix(text2, surface, 0.15)],
      [0.55, text2],
      [0.7, mix(text2, text, 0.65)],
      [0.8, mix(text2, text, 0.4)],
      [1, text2],
    ],
    sunCore: text,
    sunGlow: text,
    sunGlowOpacity: 0.95,
    cloud: text,
    cloudAlpha: [0.35, 0.28, 0.42, 0.3],
    far: [mix(text2, text, 0.3), mix(text2, surface, 0.2)],
    farOpacity: 0.9,
    haze: text,
    hazeOpacity: 0.42,
    mid: [mix(surface, text2, 0.5), mix(surface, text2, 0.3)],
    midWindow: text, // de dia a janela não acende: reflete o céu
    midWindowScale: 0.5,
    near: [mix(surface, bg, 0.05), mix(surface, bg, 0.3)],
    nearWindow: text2,
    nearWindowScale: 0.55,
    ground: mix(surface, bg, 0.35),
    background: text2,
    beacons: false,
    grain: 0.05,
  },
};

export type RoomPalette = {
  frame: string;
  rim: string;
  wall: string;
  table: [string, string, string];
  tableShine: string;
  tableShineOpacity: number;
  windowOnTable: string;
  windowOnTableOpacity: number;
  tableEdge: string;
  cupShadow: string;
  cupTop: string;
  screenGlow: string;
  screenBg: string;
  tile: string;
  tileSpeaking: string;
  avatar: string;
  keyboard: string;
  vignette: string;
  vignetteOpacity: number;
  glareOpacity: number;
};

export const ROOM: Record<Mood, RoomPalette> = {
  noite: {
    frame: night,
    rim: alpha(text2, 0.22),
    wall: mix(night, bg, 0.25),
    table: [mix(night, bg, 0.55), night, mix(night, shadow, 0.5)],
    tableShine: text2,
    tableShineOpacity: 0.2,
    windowOnTable: text2,
    windowOnTableOpacity: 0.18,
    tableEdge: alpha(text2, 0.4),
    cupShadow: alpha(shadow, 0.5),
    cupTop: mix(night, bg, 0.6),
    screenGlow: alpha(surface, 0.8),
    screenBg: mix(bg, surface, 0.35),
    tile: mix(bg, surface, 0.62),
    tileSpeaking: text2,
    avatar: alpha(text2, 0.55),
    keyboard: mix(night, bg, 0.4),
    vignette: night,
    vignetteOpacity: 0.7,
    glareOpacity: 0.07,
  },
  // Sala contra a luz da manhã: silhuetas em petróleo, borda de luz clara.
  dia: {
    frame: mix(bg, surface, 0.18),
    rim: alpha(text, 0.45),
    wall: mix(bg, surface, 0.3),
    table: [mix(bg, surface, 0.5), mix(bg, surface, 0.28), mix(bg, surface, 0.1)],
    tableShine: text2,
    tableShineOpacity: 0.35,
    windowOnTable: text,
    windowOnTableOpacity: 0.32,
    tableEdge: alpha(text, 0.6),
    cupShadow: alpha(bg, 0.45),
    cupTop: mix(bg, surface, 0.5),
    screenGlow: alpha(text2, 0.55),
    screenBg: mix(surface, text2, 0.25),
    tile: mix(surface, text2, 0.5),
    tileSpeaking: text,
    avatar: alpha(text, 0.75),
    keyboard: mix(bg, surface, 0.35),
    vignette: bg,
    vignetteOpacity: 0.3,
    glareOpacity: 0.12,
  },
};
