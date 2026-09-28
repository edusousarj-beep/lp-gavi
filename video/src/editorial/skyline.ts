/*
 * Gerador de silhueta de cidade. Determinístico: o mesmo seed desenha a mesma
 * cidade, então a imagem editorial é reproduzível e editável por parâmetro.
 */
import {seeded} from '../lib/anim';

export type Win = {x: number; y: number; w: number; h: number; a: number};
export type Building = {
  x: number;
  w: number;
  h: number;
  baseY: number;
  roof: 'flat' | 'step' | 'antenna' | 'slant';
  windows: Win[];
  beacon?: {x: number; y: number};
};

export type SkylineOptions = {
  seed: number;
  x0: number;
  x1: number;
  baseY: number;
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  maxGap: number;
  litProbability: number;
  windowAlpha: [number, number];
  window: {w: number; h: number; pitchX: number; pitchY: number};
  beacons?: number;
};

export function skyline(o: SkylineOptions): Building[] {
  const rand = seeded(o.seed);
  const between = (a: number, b: number) => a + (b - a) * rand();
  const out: Building[] = [];

  let x = o.x0;
  while (x < o.x1) {
    const w = between(o.minW, o.maxW);
    // Uma em cada seis é torre: quebra a linha do horizonte.
    const tower = rand() < 0.17;
    const h = tower ? between(o.maxH * 0.85, o.maxH * 1.25) : between(o.minH, o.maxH * 0.8);
    const r = rand();
    const roof: Building['roof'] = r < 0.55 ? 'flat' : r < 0.75 ? 'step' : r < 0.9 ? 'slant' : 'antenna';

    const windows: Win[] = [];
    const {w: ww, h: wh, pitchX, pitchY} = o.window;
    const cols = Math.floor((w - pitchX) / pitchX);
    const rows = Math.floor((h - pitchY * 1.5) / pitchY);
    const marginX = (w - cols * pitchX) / 2 + (pitchX - ww) / 2;
    for (let row = 0; row < rows; row++) {
      // Andares inteiros acesos ou apagados: escritório no fim do expediente.
      const floorLit = rand();
      const floorProb = floorLit < 0.12 ? 0.85 : floorLit < 0.45 ? 0 : o.litProbability;
      for (let col = 0; col < cols; col++) {
        if (rand() < floorProb) {
          windows.push({
            x: x + marginX + col * pitchX,
            y: o.baseY - h + pitchY * 1.2 + row * pitchY,
            w: ww,
            h: wh,
            a: between(o.windowAlpha[0], o.windowAlpha[1]),
          });
        }
      }
    }

    out.push({x, w, h, baseY: o.baseY, roof, windows});
    x += w + between(0, o.maxGap);
  }

  // Luz de balizamento nos prédios mais altos.
  const tallest = [...out].sort((a, b) => b.h - a.h).slice(0, o.beacons ?? 0);
  for (const b of tallest) {
    b.roof = 'antenna';
    b.beacon = {x: b.x + b.w / 2, y: b.baseY - b.h - b.h * 0.12};
  }

  return out;
}

/** Contorno do prédio como path SVG, com o tipo de cobertura. */
export function buildingPath(b: Building): string {
  const top = b.baseY - b.h;
  const {x, w, baseY} = b;
  switch (b.roof) {
    case 'step': {
      const inset = w * 0.2;
      const stepH = Math.min(40, b.h * 0.08);
      return `M${x},${baseY} V${top} H${x + inset} V${top - stepH} H${x + w - inset} V${top} H${x + w} V${baseY} Z`;
    }
    case 'slant':
      return `M${x},${baseY} V${top} L${x + w},${top - Math.min(60, w * 0.35)} V${baseY} Z`;
    case 'antenna': {
      const mast = b.h * 0.12;
      const cx = x + w / 2;
      return `M${x},${baseY} V${top} H${cx - 3} V${top - mast} H${cx + 3} V${top} H${x + w} V${baseY} Z`;
    }
    default:
      return `M${x},${baseY} V${top} H${x + w} V${baseY} Z`;
  }
}
