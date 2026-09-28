/*
 * Variação "Notícia": o formato de card de manchete, com a copy do post da
 * Gavi. O caminho no topo do card diz o que é — "Mentoria", não "Notícias":
 * anúncio não pode se passar por reportagem (identificação publicitária).
 */
export type Seg = {t: string; ul?: boolean};

export const NOTICIA = {
  brand: 'Inglês com a Gavi',
  partner: 'MÉTODO M.O.V.E.',
  crumbs: ['Mentoria', 'Inglês para o trabalho'],
  // Manchete em três linhas; "90" é o contador.
  headline: [['Seu', 'inglês'], ['funcional', 'em'], ['90', 'dias']],
  quote: [
    {t: '“Você me dá '},
    {t: '20 minutos por dia', ul: true},
    {t: '. Eu monto o método com o inglês da SUA área. A gente assina contrato com '},
    {t: 'garantia de resultado', ul: true},
    {t: '.”'},
  ] as Seg[],
  author: '— Bruna Gavioli',
  tag: ['SEM DECOREBA · SEM ANOS DE ESCOLA', 'SEM PRECISAR TER “DOM”'],
  more: 'Em poucos meses, você destrava o inglês que o seu trabalho exige para te dar uma promoção.',
  yours: 'O inglês será seu (sem esquecer depois de alguns dias).',
  pill: 'ENTENDA O M.O.V.E.',
  caption: 'Aperte em Saiba Mais',
} as const;
