/*
 * Trilhas das variações "Post" e "Notícia", 100% por código.
 * Cada som é posicionado a partir da linha do tempo da própria variação
 * (src/post/timeline.ts, src/noticia/timeline.ts).
 *
 *   npm run audio   (gera a trilha principal e estas)
 */
import {samples, toWav} from './audio/dsp';
import * as I from './audio/instruments';
import * as X from './audio/sfx';
import {BREAK, FULL, HALF, LIGHT, Studio, T, writeTrack, type BarPlan} from './audio/studio';
import {at, BEAT, FPS} from '../src/timeline';
import {POST_EVENTS as P, TOKEN_FRAMES} from '../src/post/timeline';
import {NOTICIA_EVENTS as N} from '../src/noticia/timeline';
import {CONVERSA_EVENTS as C, ticks, TIMING, typedFrames} from '../src/conversa/timeline';
import {MOVES, PD, PD_GRID, pat} from '../src/pordentro/timeline';

const t0 = (frame: number) => Math.max(0, T(frame));

/* Base comum: pad de abertura, pad por compasso, pausa no 8 e resolução no 10. */
function base(s: Studio, plan: BarPlan): void {
  s.groove(plan);
  s.pad(0, 'Am9', 2, -9, {attack: 0.9});
  for (const {bar, chord} of plan) s.pad(T(at(bar)), chord, 4, bar === 8 ? -4 : bar === 1 ? -13 : -16, {cutoff: bar === 8 ? 1800 : 1300});
  s.pad(T(at(10)), 'Cmaj9', 2, -12);
  s.bass.addMono(T(at(8)), I.sub(31, (4 * BEAT) / FPS - 0.1), 0.18);
  s.snareRoll(T(at(8, 2)));
  s.fx(T(at(8)), X.riser(s.next(), T(at(9)) - T(at(8))), -12);
  s.fx(T(at(9)), X.impact(s.next()), -5, 0, 0.35);
  s.fx(T(at(9)), I.hat(s.next(), true), -12, 0, 0.3);
  s.finalChord(T(at(10)), 'Cmaj9');
  // Sopro de abertura subindo até o compasso 1.
  s.fx(0, X.whoosh(s.next(), T(at(1)), {from: 120, to: 2600, peak: 0.95, q: 0.9, panFrom: 0, panTo: 0}), -16);
}

const MOVE_NOTES = [72, 76, 79, 83];

/* ------------------------------------------------------------------ Post */
{
  const s = new Studio(101);
  base(s, [
    {bar: 1, chord: 'Am9', pattern: FULL},
    {bar: 2, chord: 'Fmaj9', pattern: FULL},
    {bar: 3, chord: 'Cmaj7', pattern: FULL},
    {bar: 4, chord: 'G6', pattern: LIGHT},
    {bar: 5, chord: 'Am9', pattern: HALF},
    {bar: 6, chord: 'Fmaj9', pattern: FULL},
    {bar: 7, chord: 'Cmaj7', pattern: FULL},
    {bar: 8, chord: 'G6', pattern: BREAK},
    {bar: 9, chord: 'Cmaj9', pattern: FULL},
  ]);

  // Card virando, avatar, selo.
  s.fx(0, X.whoosh(s.next(), 0.35, {from: 400, to: 3000, peak: 0.3, q: 1.4}), -18);
  s.fx(t0(P.avatar) + 0.03, X.pop(s.next(), {pitch: 0.9}), -16);
  s.fx(T(P.badge), I.bell(88, {decay: 0.7}), -22, 0.3, 0.5);

  // Carimbo no drop.
  s.fx(T(P.stamp), X.impact(s.next()), -5, 0, 0.3);
  // Palavras caindo: um tique cada, subindo.
  TOKEN_FRAMES[0].flat().slice(1).forEach((f, i) => s.fx(T(f), X.tick(s.next(), {pitch: 2200 + i * 220}), -24, (i % 2 ? 0.3 : -0.3)));
  s.fx(T(P.highlight), X.marker(s.next(), 0.4), -16);

  // Itens: o número vira (whoosh curto + tique).
  P.items.forEach((f, i) => {
    s.fx(T(f), X.whoosh(s.next(), 0.18, {from: 1500, to: 6000, peak: 0.2, q: 1.6}), -22, i % 2 ? 0.3 : -0.3);
    s.fx(T(f), X.tick(s.next(), {pitch: 2600}), -22);
  });
  s.fx(T(P.underline), X.scratch(s.next(), 16 / FPS), -14, 0.1);

  // "Sem…" em staccato: acorde + tranco em cada tempo.
  P.sem.forEach((f, i) => {
    if (i < 2) s.kick(T(f), 0.9);
    s.stab(T(f), i < 2 ? 'G6' : 'Am9', 2, 0.4);
    s.fx(T(f), X.impact(s.next()), -13);
  });

  s.fx(T(P.cta), X.pop(s.next(), {pitch: 1.1}), -14);
  P.letters.forEach((f, i) => s.pluck(T(f), MOVE_NOTES[i], -9, -0.3 + i * 0.2));

  // Câmera recua; recapitulação (uma nota por promessa); card sobe; pílula.
  s.fx(T(P.overview), X.whoosh(s.next(), 0.6, {from: 2500, to: 300, peak: 0.4, q: 1.0}), -18);
  [P.recap.hl, P.recap.ul, P.recap.move].forEach((f, i) => s.pluck(T(f), [79, 83, 86][i], -11, -0.3 + i * 0.3));
  s.fx(T(P.lift), X.whoosh(s.next(), 0.4, {from: 300, to: 3000, peak: 0.5, q: 1.2}), -16);
  s.fx(T(P.pill), X.pop(s.next(), {pitch: 0.7}), -9, 0, 0.25);

  const {bus, loudness, gainDb} = s.master();
  writeTrack('post', bus, {
    sync: {carimbo: T(P.stamp), sublinhado: T(P.underline) + 0.1, sem: T(P.sem[1]), drop: T(P.drop)},
    marks: [
      ['carimbo', T(P.stamp), P.stamp],
      ['sublinhado', T(P.underline), P.underline],
      ['pílula', T(P.pill), P.pill],
    ],
  }, toWav);
  console.log(JSON.stringify({trilha: 'post', seconds: bus.length / samples(1), integratedLufs: +loudness.toFixed(2), gainDb: +gainDb.toFixed(2)}));
}

/* --------------------------------------------------------------- Notícia */
{
  const s = new Studio(202);
  base(s, [
    {bar: 1, chord: 'Am9', pattern: FULL},
    {bar: 2, chord: 'Fmaj9', pattern: LIGHT},
    {bar: 3, chord: 'Cmaj7', pattern: LIGHT},
    {bar: 4, chord: 'G6', pattern: FULL},
    {bar: 5, chord: 'Am9', pattern: FULL},
    {bar: 6, chord: 'Fmaj9', pattern: FULL},
    {bar: 7, chord: 'Cmaj7', pattern: HALF},
    {bar: 8, chord: 'G6', pattern: BREAK},
    {bar: 9, chord: 'Cmaj9', pattern: FULL},
  ]);

  // Marca entrando pelos lados; card desenrolando.
  s.fx(0, X.whoosh(s.next(), 0.5, {from: 500, to: 3500, peak: 0.4, q: 1.3, panFrom: -0.8, panTo: 0}), -18);
  s.fx(T(N.divider), X.tick(s.next(), {pitch: 3000}), -24);
  s.fx(T(N.partner), X.whoosh(s.next(), 0.5, {from: 500, to: 3500, peak: 0.4, q: 1.3, panFrom: 0.8, panTo: 0}), -18);
  s.fx(T(N.unroll), X.whoosh(s.next(), 0.8, {from: 150, to: 1800, peak: 0.5, q: 0.8}), -14);
  [0, 3, 6, 9, 12].forEach((d) => s.fx(T(N.crumbs + d), X.key(s.next()), -20, 0.2));
  s.fx(T(N.rule), X.whoosh(s.next(), 0.25, {from: 2000, to: 7000, peak: 0.3, q: 1.8, panFrom: -0.5, panTo: 0.5}), -22);

  // Manchete batendo no tempo; contador 0→90 com tiques subindo.
  N.headline.flat().forEach((f) => {
    s.kick(T(f), 0.7);
    s.fx(T(f), X.tick(s.next(), {pitch: 1800}), -18);
  });
  const countStart = N.headline[2][0];
  for (let f = countStart + 2, i = 0; f < N.counterEnd; f += 2, i++) s.fx(T(f), X.tick(s.next(), {pitch: 2000 + i * 240}), -22);
  s.fx(T(N.headline[2][1]), X.impact(s.next()), -7, 0, 0.3);

  N.underlines.forEach((f) => s.fx(T(f), X.scratch(s.next(), 16 / FPS), -14, 0.1));
  s.fx(T(N.tag), X.whoosh(s.next(), 0.5, {from: 6000, to: 1500, peak: 0.2, q: 1.2}), -22);
  s.fx(T(N.tag), I.bell(95, {decay: 0.6}), -26, 0, 0.5);
  s.fx(T(N.scroll), X.whoosh(s.next(), 1.0, {from: 200, to: 1500, peak: 0.5, q: 0.9}), -16);

  // Pílula cai quicando; letras; toque; legenda.
  s.fx(T(N.pill), X.impact(s.next()), -9, 0, 0.3);
  s.fx(T(N.pill), X.pop(s.next(), {pitch: 0.7}), -10);
  N.letters.forEach((f, i) => s.pluck(T(f), MOVE_NOTES[i], -9, -0.3 + i * 0.2));
  s.fx(T(N.fingerIn), X.whoosh(s.next(), 0.5, {from: 500, to: 1800, peak: 0.6, q: 1.0, panFrom: 0.6, panTo: 0.1}), -27);
  s.fx(T(N.tap), X.tap(s.next()), -7, 0.2);
  s.fx(T(N.tap) + 0.03, I.bell(88, {decay: 0.9}), -15, -0.2, 0.5);
  s.fx(T(N.tap) + 0.11, I.bell(95, {decay: 1.1}), -18, 0.2, 0.5);
  s.fx(T(N.caption), X.pop(s.next(), {pitch: 1.3}), -18);

  const {bus, loudness, gainDb} = s.master();
  writeTrack('noticia', bus, {
    sync: {dias: T(N.headline[2][1]), sublinhado: T(N.underlines[1]) + 0.1, pílula: T(N.pill), toque: T(N.tap)},
    marks: [
      ['manchete', T(N.headline[2][1]), N.headline[2][1]],
      ['pílula', T(N.pill), N.pill],
      ['toque', T(N.tap), N.tap],
    ],
  }, toWav);
  console.log(JSON.stringify({trilha: 'noticia', seconds: bus.length / samples(1), integratedLufs: +loudness.toFixed(2), gainDb: +gainDb.toFixed(2)}));
}

/* -------------------------------------------------------------- Conversa */
{
  const s = new Studio(303);
  base(s, [
    {bar: 1, chord: 'Am9', pattern: LIGHT},
    {bar: 2, chord: 'Fmaj9', pattern: FULL},
    {bar: 3, chord: 'Cmaj7', pattern: FULL},
    {bar: 4, chord: 'G6', pattern: FULL},
    {bar: 5, chord: 'Am9', pattern: HALF},
    {bar: 6, chord: 'Fmaj9', pattern: LIGHT}, // a pergunta fica no ar
    {bar: 7, chord: 'Cmaj7', pattern: FULL}, // "Não."
    {bar: 8, chord: 'G6', pattern: BREAK}, // CTA chega no silêncio
    {bar: 9, chord: 'Cmaj9', pattern: FULL},
  ]);

  s.fx(0, X.whoosh(s.next(), 0.35, {from: 400, to: 3000, peak: 0.3, q: 1.4}), -18);

  // A aluna digita (uma tecla a cada dois caracteres), envia; ticks de entregue e lido.
  for (const id of ['m1', 'm9']) {
    typedFrames(id)
      .flat()
      .filter((f, i) => f >= 0 && i % 2 === 0)
      .forEach((f, i) => s.fx(T(f), X.key(s.next()), -22, i % 2 ? 0.25 : 0.1));
    const {arrive} = TIMING[id];
    s.fx(T(arrive), X.whoosh(s.next(), 0.22, {from: 900, to: 5000, peak: 0.25, q: 1.4, panFrom: 0.35, panTo: 0.1}), -18);
    s.fx(T(arrive), X.pop(s.next(), {pitch: 1.4}), -14, 0.2);
    const tk = ticks(arrive);
    s.fx(T(tk.delivered), X.tick(s.next(), {pitch: 4200}), -30, 0.3);
    s.fx(T(tk.read), X.tick(s.next(), {pitch: 5200}), -26, 0.3);
  }

  // Cada balão da Bruna chega com um "pop"; a lista sobe nota a nota.
  const LIST = ['m5', 'm6', 'm7', 'm8'];
  for (const id of ['m2', 'm3', 'm4', ...LIST, 'm11']) {
    s.fx(T(TIMING[id].arrive), X.pop(s.next(), {pitch: 0.95}), -13, -0.2);
  }
  LIST.forEach((id, i) => s.pluck(T(TIMING[id].arrive) + 0.05, [69, 72, 76, 79][i], -12, -0.3 + i * 0.2));

  // "Não é você.": tranco + sino.
  s.kick(T(C.punches[0]), 0.8);
  s.fx(T(C.punches[0]), I.bell(88, {decay: 0.8}), -18, -0.2, 0.5);

  s.fx(T(C.strike), X.scratch(s.next(), 10 / FPS), -16, 0.1);
  s.fx(T(C.highlight), X.marker(s.next(), 0.4), -16);
  C.letters.forEach((f, i) => s.pluck(T(f), MOVE_NOTES[i], -9, -0.3 + i * 0.2));
  s.fx(T(C.emph), X.tick(s.next(), {pitch: 3000}), -20);
  s.fx(T(C.underline), X.scratch(s.next(), 16 / FPS), -14, 0.1);

  // "Não." carimbado; as duas linhas seguintes com um tique cada.
  s.fx(T(C.stampLines[0]), X.impact(s.next()), -6, 0, 0.3);
  s.kick(T(C.stampLines[0]), 1);
  C.stampLines.slice(1).forEach((f) => s.fx(T(f), X.tick(s.next(), {pitch: 2400}), -20));

  // CTA no silêncio do compasso 8; drop com a pílula.
  s.fx(T(TIMING.m11.arrive), I.bell(95, {decay: 1.0}), -20, 0.2, 0.5);
  s.fx(T(C.drop), X.pop(s.next(), {pitch: 0.7}), -9, 0, 0.25);

  const {bus, loudness, gainDb} = s.master();
  writeTrack('conversa', bus, {
    sync: {envio: T(TIMING.m1.arrive), 'não': T(C.stampLines[0]), pílula: T(C.drop)},
    marks: [
      ['envio', T(TIMING.m1.arrive), TIMING.m1.arrive],
      ['não', T(C.stampLines[0]), C.stampLines[0]],
      ['pílula', T(C.drop), C.drop],
    ],
  }, toWav);
  console.log(JSON.stringify({trilha: 'conversa', seconds: bus.length / samples(1), integratedLufs: +loudness.toFixed(2), gainDb: +gainDb.toFixed(2)}));
}

/* ------------------------------------------------------------ Por dentro */
{
  // Grade própria: 120 BPM, 16 s. Como na referência, o primeiro compasso é
  // só ambiência e a batida entra no compasso 2.
  const s = new Studio(404, PD_GRID);
  s.pad(0, 'Am9', 4, -11, {attack: 0.7, cutoff: 900});
  s.fx(0, X.riser(s.next(), T(pat(2))), -17);
  s.fx(0, X.whoosh(s.next(), 0.6, {from: 200, to: 2400, peak: 0.6, q: 1.0, panFrom: 0, panTo: 0}), -18);
  const plan: BarPlan = [
    {bar: 2, chord: 'Am9', pattern: FULL},
    {bar: 3, chord: 'Fmaj9', pattern: FULL},
    {bar: 4, chord: 'G6', pattern: LIGHT},
    {bar: 5, chord: 'Am9', pattern: FULL},
    {bar: 6, chord: 'Fmaj9', pattern: HALF},
    {bar: 7, chord: 'Cmaj7', pattern: FULL},
  ];
  s.groove(plan);
  for (const {bar, chord} of plan) s.pad(T(pat(bar)), chord, 4, -17);
  s.snareRoll(T(pat(6, 1)));
  s.finalChord(T(PD.finalHit), 'Cmaj9');
  s.pad(T(PD.finalHit), 'Cmaj9', 4, -12);

  // A: texto acendendo, selo, drop.
  PD.aLines.forEach((f, i) => s.fx(T(f), X.tick(s.next(), {pitch: 2600 + i * 300}), -26, i % 2 ? 0.2 : -0.2));
  s.fx(T(PD.drop), X.impact(s.next()), -7, 0, 0.3);
  s.fx(T(PD.tag), X.pop(s.next(), {pitch: 1.2}), -16, 0.3);

  // Trocas de página: rolagem sobe (sem pan), deslize atravessa o estéreo.
  const [r1, r1d] = MOVES.scroll1;
  const [s2, s2d] = MOVES.slide2;
  const [r3, r3d] = MOVES.scroll3;
  s.fx(T(r1), X.whoosh(s.next(), r1d / 30 + 0.1, {from: 250, to: 3200, peak: 0.55, q: 1.1, panFrom: 0, panTo: 0}), -12);
  s.fx(T(s2), X.whoosh(s.next(), s2d / 30 + 0.1, {from: 500, to: 3800, peak: 0.5, q: 1.2, panFrom: 0.8, panTo: -0.8}), -12);
  s.fx(T(r3), X.whoosh(s.next(), r3d / 30 + 0.1, {from: 250, to: 3200, peak: 0.55, q: 1.1, panFrom: 0, panTo: 0}), -12);
  s.fx(T(pat(7)), X.impact(s.next()), -8, 0, 0.3);

  // B: cada trava acende com uma nota; o retrato entra girando.
  PD.items.forEach((f, i) => {
    s.fx(T(f), X.tick(s.next(), {pitch: 2400}), -22);
    s.pluck(T(f) + 0.05, [69, 72, 76][i], -12, -0.3 + i * 0.3);
  });
  s.fx(T(PD.card), X.whoosh(s.next(), 0.35, {from: 700, to: 4200, peak: 0.3, q: 1.4, panFrom: 0.7, panTo: 0}), -16);
  s.fx(T(PD.card) + 0.1, X.pop(s.next(), {pitch: 0.9}), -14);

  // C: número grande, caixa, barras subindo nota a nota.
  s.fx(T(PD.cBig[0]), X.impact(s.next()), -13);
  s.fx(T(PD.cBox), X.pop(s.next(), {pitch: 0.8}), -12);
  PD.bars.forEach((f, i) => s.pluck(T(f), [69, 72, 76, 79, 84][i], i === 4 ? -8 : -12, -0.4 + i * 0.2));
  s.fx(T(PD.cSub), X.tick(s.next(), {pitch: 3000}), -22);

  // D: pílula e brilho final.
  s.fx(T(PD.dCascade[5]), X.pop(s.next(), {pitch: 0.75}), -12);
  s.fx(T(PD.finalHit), I.bell(88, {decay: 1.2}), -18, -0.2, 0.5);
  s.fx(T(PD.finalHit) + 0.12, I.bell(95, {decay: 1.4}), -21, 0.2, 0.5);

  const {bus, loudness, gainDb} = s.master();
  writeTrack('pordentro', bus, {
    sync: {drop: T(PD.drop), rolagem: T(pat(3)), cartão: T(pat(7))},
    marks: [
      ['drop', T(PD.drop), PD.drop],
      ['rolagem', T(pat(3)), pat(3)],
      ['cartão', T(pat(7)), pat(7)],
    ],
  }, toWav);
  console.log(JSON.stringify({trilha: 'pordentro', seconds: bus.length / samples(1), integratedLufs: +loudness.toFixed(2), gainDb: +gainDb.toFixed(2)}));
}

