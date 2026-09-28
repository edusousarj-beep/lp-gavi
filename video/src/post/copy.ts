/*
 * Variação "Post": a copy do post que a Gavi já veicula, palavra por
 * palavra — só sem o emoji (tom da marca, e o render não tem fonte de emoji).
 *
 * As linhas são quebradas à mão: a altura de cada bloco fica conhecida de
 * antemão e a câmera sabe exatamente onde cada bloco está.
 */
export type TokKind = 'bold' | 'hl' | 'ul' | 'emph' | 'move';
export type Tok = {t: string; kind?: TokKind};
export type PostBlock = {id: string; num?: string; lines: Tok[][]};

const w = (s: string): Tok[] => s.split(' ').map((t) => ({t}));

export const POST = {
  name: 'Bruna Gavioli',
  handle: '@brunagaviolioficial',
  blocks: [
    {
      id: 'lead',
      lines: [[{t: 'PROPOSTA:', kind: 'bold'}, ...w('seu inglês funcional')], [{t: 'em'}, {t: '90 dias', kind: 'hl'}]],
    },
    {id: 'i1', num: '1', lines: [w('Você me dá 20 minutos por dia')]},
    {
      id: 'i2',
      num: '2',
      lines: [w('Eu monto o método com o inglês'), [...w('da'), {t: 'SUA', kind: 'emph'}, ...w('área')]],
    },
    {id: 'i3', num: '3', lines: [w('A gente assina contrato com'), [{t: 'garantia de resultado', kind: 'ul'}]]},
    {
      id: 'i4',
      num: '4',
      lines: [w('Em poucos meses, você destrava o'), w('inglês que o seu trabalho exige'), w('para te dar uma promoção')],
    },
    // Três pedaços, um por tempo da música.
    {id: 'sem', lines: [[{t: 'Sem decoreba,'}, {t: 'sem anos de escola,'}], [{t: 'sem precisar ter “dom”.'}]]},
    {id: 'seu', lines: [w('O inglês será seu (sem esquecer'), w('depois de alguns dias).')]},
    {id: 'cta', lines: [w('Quer? Aperte em Saiba Mais e'), [...w('entenda o'), {t: 'M.O.V.E.', kind: 'move'}]]},
  ] as PostBlock[],
  // Aponta para o botão nativo do anúncio, logo abaixo do vídeo.
  pill: 'Saiba mais',
} as const;
