/*
 * Variação "Conversa": a copy é a do criativo de conversa que a Gavi já roda
 * (um dos que mais trazem leads), palavra por palavra. As quebras de linha
 * são fixas para a altura de cada balão ser conhecida antes do render — a
 * câmera e a rolagem dependem dela.
 *
 * Tipos de trecho:
 *   name    "Aluna:" / "Bruna:" em negrito, como no original
 *   emoji   renderizado com a Noto Color Emoji embutida
 *   strike  risco que passa por cima ("volume")
 *   hl      marca-texto ("frequência")
 *   emph    pulo curto ("SUAS")
 *   ul      sublinhado à mão, o único vermelho do quadro
 *   move    M.O.V.E, letra por letra
 *   stamp   carimbado no tempo ("Não.")
 */
export type SegKind = 'text' | 'name' | 'emoji' | 'strike' | 'hl' | 'emph' | 'ul' | 'move' | 'stamp';
export type Seg = {t: string; kind: SegKind};
export type Who = 'aluna' | 'bruna';
export type Msg = {id: string; from: Who; time: string; lines: Seg[][]};

const s = (t: string): Seg => ({t, kind: 'text'});
const k = (kind: SegKind, t: string): Seg => ({t, kind});
const A = k('name', 'Aluna:');
const B = k('name', 'Bruna:');

export const CONVERSA = {
  name: 'Bruna Gavioli',
  online: 'online',
  typing: 'digitando…',
  day: 'Hoje',
  placeholder: 'Mensagem',
  pill: 'Saiba mais',
  messages: [
    {id: 'm1', from: 'aluna', time: '17:51', lines: [[A, s(' Bruna, travei numa')], [s('entrevista pra vaga em dólar '), k('emoji', '😔')]]},
    {id: 'm2', from: 'bruna', time: '17:51', lines: [[B, s(' Não é você.')]]},
    {
      id: 'm3',
      from: 'bruna',
      time: '17:51',
      lines: [[B, s(' Você estudou por '), k('strike', 'volume'), s(',')], [s('e o cérebro fixa idioma por')], [k('hl', 'frequência'), s('.')]],
    },
    {id: 'm4', from: 'bruna', time: '17:51', lines: [[B, s(' No '), k('move', 'M.O.V.E'), s(' é assim:')]]},
    {id: 'm5', from: 'bruna', time: '17:51', lines: [[B, s(' '), k('emoji', '1️⃣'), s(' 20 min por dia ativando')], [s('a memória de longo prazo')]]},
    {id: 'm6', from: 'bruna', time: '17:51', lines: [[B, s(' '), k('emoji', '2️⃣'), s(' com o inglês das '), k('emph', 'SUAS')], [s('entrevistas e reuniões')]]},
    {id: 'm7', from: 'bruna', time: '17:51', lines: [[B, s(' '), k('emoji', '3️⃣'), s(' contrato com')], [k('ul', 'garantia de resultado')]]},
    {
      id: 'm8',
      from: 'bruna',
      time: '17:52',
      lines: [[B, s(' '), k('emoji', '4️⃣'), s(' em poucos meses')], [s('o inglês sai no automático,')], [s('sem traduzir na cabeça')]],
    },
    {id: 'm9', from: 'aluna', time: '17:52', lines: [[A, s(' E não esquece depois? '), k('emoji', '🤔')]]},
    {
      id: 'm10',
      from: 'bruna',
      time: '17:52',
      lines: [[B, s(' '), k('stamp', 'Não.')], [s('Frequência fixa na memória.')], [s('Isso não é decoreba de véspera.')]],
    },
    {id: 'm11', from: 'bruna', time: '17:52', lines: [[B, s(' Aperte em Saiba Mais')], [s('e veja como. '), k('emoji', '👇')]]},
  ] satisfies Msg[] as Msg[],
  /** O que a aluna digita na caixa antes de enviar (quebrado como a caixa quebra). */
  typed: {
    m1: ['Bruna, travei numa entrevista pra', 'vaga em dólar 😔'],
    m9: ['E não esquece depois? 🤔'],
  } as Record<string, string[]>,
};
