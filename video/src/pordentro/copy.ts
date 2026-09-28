/*
 * Peça "Por dentro", modelada no anúncio de diagnóstico da turaCRM (4 blocos,
 * rolagem de página). A oferta de lá (diagnóstico grátis de 15 perguntas) NÃO
 * foi copiada: a Gavi não tem essa oferta. Cada frase abaixo já existe em
 * material da marca:
 *
 *   LP (index.html)          "Mentoria de inglês", "Veja a mentoria por dentro",
 *                            reunião/call/viagem, CTA "Quero ver por dentro",
 *                            "Conversa direta no WhatsApp, com uma pessoa da equipe."
 *   peça principal (copy.ts) "Para executivos, empresários e profissionais sêniores.",
 *                            "Sem travar no meio da frase", falar × só entender
 *   criativo Post            "20 minutos por dia", "o inglês da SUA área",
 *                            "destrava o inglês que o seu trabalho exige",
 *                            "sem esquecer depois de alguns dias"
 *   criativo Conversa        "sem traduzir na cabeça", "frequência fixa na memória"
 *   foto de perfil (img. 2)  "INGLÊS FUNCIONAL", "Especialista em ensino de
 *                            inglês para adultos. Criadora do método M.O.V.E."
 *   pedido do cliente        "Mentoria de inglês funcional" (no lugar de "Veja a
 *                            mentoria por dentro") e o público em destaque:
 *                            "executivos e profissionais de diversas áreas"
 */
export type Line = {t: string; accent: boolean};

export const PD_COPY = {
  brand: 'Inglês com a Gavi',
  label: 'Mentoria',

  /** Público, em destaque no gancho e no cartão final; o marca-texto passa na linha marcada. */
  audience: [
    {t: 'Para executivos e profissionais', mark: false},
    {t: 'de diversas áreas.', mark: true},
  ],

  // A — gancho: a dor + para quem é.
  a: {
    tag: 'M.O.V.E.',
    eyebrow: 'Inglês funcional',
    headline: [
      {t: 'Você entende,', accent: false},
      {t: 'mas trava na', accent: true},
      {t: 'reunião?', accent: true},
    ] as Line[],
    chips: ['20 min por dia', 'Inglês da sua área'],
  },

  // B — onde trava + quem conduz.
  b: {
    eyebrow: 'Onde o inglês trava',
    headline: [
      {t: 'Vamos destravar', accent: false},
      {t: 'o inglês que o seu', accent: true},
      {t: 'trabalho exige.', accent: true},
    ] as Line[],
    items: ['Trava no meio da frase', 'Traduz tudo na cabeça', 'Esquece depois de alguns dias'],
    card: {name: 'Bruna Gavioli', role: 'Criadora do método M.O.V.E.'},
  },

  // C — o número grande (o "15 PERGUNTAS. 2 MINUTOS." da referência).
  c: {
    big: ['20', 'MINUTOS.'],
    box: 'POR DIA.',
    sub: 'Com o inglês da sua área.',
    caption: 'Frequência, não volume.',
    bars: ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5'],
    chartNote: 'frequência fixa na memória',
  },

  // D — cartão final: o nome da mentoria, o público e o CTA (mesmo texto e destino da LP).
  d: {
    title: 'MENTORIA DE',
    box: 'INGLÊS FUNCIONAL',
    chips: ['Método M.O.V.E.', '20 min por dia'],
    line: 'Conversa direta no WhatsApp, com uma pessoa da equipe.',
    cta: 'Quero ver por dentro',
    name: ['BRUNA', 'GAVIOLI'],
    bio: ['Especialista em ensino de', 'inglês para adultos.', 'Criadora do método M.O.V.E.'],
  },
};
