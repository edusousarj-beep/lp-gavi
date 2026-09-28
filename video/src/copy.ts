/*
 * Todo o texto do vídeo. Cada afirmação aqui tem origem na LP ou na skill
 * (.claude/skills/lp-gavi/SKILL.md) — nada de número, preço ou depoimento.
 *
 * Mudou algum texto DIGITADO (prompt.text, mission.title)? Rode `npm run audio`:
 * as teclas da trilha são geradas a partir do número de caracteres.
 */

export type Tone = 'muted' | 'strong' | 'accent';
export type Word = {text: string; tone: Tone};

const words = (line: string, tone: Tone): Word[] =>
  line.split(' ').map((text) => ({text, tone}));

export const COPY = {
  brand: 'Inglês com a Gavi',

  // ATRAIR — a dor, nas palavras de quem sente.
  hook: {
    // Uma linha por item. A palavra com tone 'accent' é a que trava.
    lines: [
      words('O problema não é', 'muted'),
      words('falta de inglês.', 'strong'),
      [
        {text: 'É', tone: 'muted'},
        {text: 'travar', tone: 'accent'},
      ],
      words('na reunião.', 'strong'),
    ] as Word[][],
  },

  // CONVERTER — o cenário, a ação e o que a pessoa vê por dentro.
  mission: {
    label: 'Missão:',
    title: 'reunião em inglês.',
    description: 'Sem travar no meio da frase.',
    chip: 'Hoje, 9h',
  },

  prompt: {
    chips: ['Reunião', 'Call', 'Viagem de trabalho'],
    text: 'Quero ver a mentoria por dentro.',
  },

  processing: {
    title: 'Abrindo',
    steps: ['Separando o que você precisa ver…', 'Organizando por contexto…'],
  },

  dossier: {
    askedLabel: 'Você pediu:',
    title: 'Mentoria por dentro',
    subtitle: 'Inglês com a Gavi',
    sections: [
      {label: 'Para quem', value: 'Executivos, empresários e profissionais sêniores.'},
      {label: 'Onde o inglês trava', items: ['Reunião', 'Call', 'Viagem de trabalho']},
      {label: 'Método', value: 'M.O.V.E.'},
      {label: 'Quem conduz', value: 'Bruna Gavioli'},
      {label: 'Decisão', value: 'Depois, com a informação na mão.'},
    ] as {label: string; value?: string; items?: string[]}[],
  },

  // O método é nomeado, nunca explicado (regra 1 da skill).
  method: {
    kicker: 'Um método com nome:',
    letters: ['M', 'O', 'V', 'E'],
  },

  closing: {
    lines: [words('Para você falar', 'strong'), words('na reunião,', 'strong'), words('não só entender.', 'muted')],
  },

  // VENDER — um CTA, mesmo texto e destino do botão da LP.
  endCard: {
    kicker: 'Veja a mentoria por dentro antes de decidir.',
    cta: 'Quero ver por dentro',
    micro: 'Conversa direta no WhatsApp, com uma pessoa da equipe.',
  },
} as const;
