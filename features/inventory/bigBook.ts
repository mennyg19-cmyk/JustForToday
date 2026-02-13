/**
 * Big Book passages for the inventory screens.
 * Passage text for morning and nightly is in bigBookText.ts.
 */

import { MORNING_PASSAGE_TEXT, NIGHTLY_PASSAGE_TEXT } from './bigBookText';

export type InventoryPassageId = 'morning' | 'nightly' | 'step10';

export interface BigBookPassage {
  id: InventoryPassageId;
  /** Short title, e.g. "On Awakening" */
  title: string;
  /** Reference, e.g. "pp. 86–88" */
  reference: string;
  /** The passage text. */
  body: string;
  /**
   * Phrases to highlight in the body (instructions, do's and don'ts).
   */
  highlightPhrases?: string[];
}

/** Key phrases highlighted in nightly review (what to ask, what to do/avoid). */
const NIGHTLY_HIGHLIGHTS = [
  'constructively review our day',
  'Were we resentful, selfish, dishonest or afraid?',
  'Do we owe an apology?',
  'Have we kept something to ourselves which should be discussed with another person at once?',
  'Were we kind and loving toward all?',
  'ask God\'s forgiveness and inquire what corrective measures should be taken',
  'we must be careful not to drift into worry, remorse or morbid reflection',
];

/** Key phrases highlighted in morning passage (how to think, what to do/avoid). */
const MORNING_HIGHLIGHTS = [
  'think about the twenty-four hours ahead',
  'we ask God to direct our thinking',
  'divorced from self-pity, dishonest or self-seeking motives',
  'we ask God for inspiration, an intuitive thought or a decision',
  'We relax and take it easy. We don\'t struggle.',
  'freedom from self-will',
  'careful to make no request for ourselves only',
  'careful never to pray for our own selfish ends',
  'Thy will be done',
  'when agitated or doubtful, and ask for the right thought or action',
  'We are no longer running the show',
];

export const BIG_BOOK_PASSAGES: BigBookPassage[] = [
  {
    id: 'morning',
    title: 'On Awakening',
    reference: 'pp. 86–88',
    body: MORNING_PASSAGE_TEXT,
    highlightPhrases: MORNING_HIGHLIGHTS,
  },
  {
    id: 'nightly',
    title: 'When we retire at night',
    reference: 'p. 86',
    body: NIGHTLY_PASSAGE_TEXT,
    highlightPhrases: NIGHTLY_HIGHLIGHTS,
  },
  {
    id: 'step10',
    title: 'Step Ten',
    reference: 'pp. 84–85',
    body: '',
    highlightPhrases: [],
  },
];

export function getPassage(id: InventoryPassageId): BigBookPassage | undefined {
  return BIG_BOOK_PASSAGES.find((p) => p.id === id);
}
