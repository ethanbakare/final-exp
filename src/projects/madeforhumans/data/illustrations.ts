export interface Illustration {
  id: string;
  title: string;
  main: string;
  panels: string[];
}

/**
 * Made for Humans illustration series
 * Each entry maps a letter ID to its descriptive title and image paths.
 * Main images are the full comic (all panels combined).
 * Panel images are individual breakdowns (for future carousel feature).
 */
export const ILLUSTRATIONS: Illustration[] = [
  {
    id: 'a',
    title: 'Prompting and Syntax Sorcery',
    main: '/images/madeforhumans/a-main.webp',
    panels: [
      '/images/madeforhumans/a-01.webp',
      '/images/madeforhumans/a-02.webp',
      '/images/madeforhumans/a-03.webp',
      '/images/madeforhumans/a-04.webp',
      '/images/madeforhumans/a-05.webp',
    ],
  },
  {
    id: 'b',
    title: 'AI guys, Grifters, and Dropshippers',
    main: '/images/madeforhumans/b-main.webp',
    panels: [
      '/images/madeforhumans/b-01.webp',
      '/images/madeforhumans/b-02.webp',
      '/images/madeforhumans/b-03.webp',
    ],
  },
  {
    id: 'c',
    title: 'Neural Networks & Crayon Calculations',
    main: '/images/madeforhumans/c-main.webp',
    panels: [
      '/images/madeforhumans/c-01.webp',
      '/images/madeforhumans/c-02.webp',
      '/images/madeforhumans/c-03.webp',
      '/images/madeforhumans/c-04.webp',
      '/images/madeforhumans/c-05.webp',
      '/images/madeforhumans/c-06.webp',
    ],
  },
  {
    id: 'd',
    title: 'Training, Testing, and Trainer Tasting',
    main: '/images/madeforhumans/d-main.webp',
    panels: [
      '/images/madeforhumans/d-01.webp',
      '/images/madeforhumans/d-02.webp',
      '/images/madeforhumans/d-03.webp',
      '/images/madeforhumans/d-04.webp',
    ],
  },
  {
    id: 'e',
    title: 'Data, Dogs and Treats',
    main: '/images/madeforhumans/e-main.webp',
    panels: [
      '/images/madeforhumans/e-01.webp',
      '/images/madeforhumans/e-02.webp',
      '/images/madeforhumans/e-03.webp',
      '/images/madeforhumans/e-04.webp',
    ],
  },
  {
    id: 'f',
    title: 'Role play and Prompt Whispering',
    main: '/images/madeforhumans/f-main.webp',
    panels: [
      '/images/madeforhumans/f-01.webp',
      '/images/madeforhumans/f-02.webp',
      '/images/madeforhumans/f-03.webp',
      '/images/madeforhumans/f-04.webp',
      '/images/madeforhumans/f-05.webp',
      '/images/madeforhumans/f-06.webp',
      '/images/madeforhumans/f-07.webp',
    ],
  },
  {
    id: 'g',
    title: 'For the love of GPTs',
    main: '/images/madeforhumans/g-main.webp',
    panels: [
      '/images/madeforhumans/g-01.webp',
      '/images/madeforhumans/g-02.webp',
      '/images/madeforhumans/g-03.webp',
      '/images/madeforhumans/g-04.webp',
      '/images/madeforhumans/g-05.webp',
      '/images/madeforhumans/g-06.webp',
    ],
  },
  {
    id: 'h',
    title: 'Fiction vs Reality',
    main: '/images/madeforhumans/h-main.webp',
    panels: [],
  },
  {
    id: 'i',
    title: "How It Started vs How It's Going",
    main: '/images/madeforhumans/i-main.webp',
    panels: [
      '/images/madeforhumans/i-01.webp',
      '/images/madeforhumans/i-02.webp',
    ],
  },
  {
    id: 'j',
    title: 'AI Models and Prompt Mastery',
    main: '/images/madeforhumans/j-main.webp',
    panels: [
      '/images/madeforhumans/j-01.webp',
      '/images/madeforhumans/j-02.webp',
      '/images/madeforhumans/j-03.webp',
      '/images/madeforhumans/j-04.webp',
      '/images/madeforhumans/j-05.webp',
      '/images/madeforhumans/j-06.webp',
    ],
  },
  {
    id: 'k',
    title: 'AI experts for dummies',
    main: '/images/madeforhumans/k-main.webp',
    panels: [
      '/images/madeforhumans/k-01.webp',
      '/images/madeforhumans/k-02.webp',
      '/images/madeforhumans/k-03.webp',
      '/images/madeforhumans/k-04.webp',
    ],
  },
];
