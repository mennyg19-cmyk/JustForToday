/**
 * Stoic and inspirational quotes for the daily quote banner.
 * One quote per day (deterministic from date).
 */

export interface DailyQuote {
  text: string;
  author: string;
}

const QUOTES: DailyQuote[] = [
  { text: 'We have two ears and one mouth so that we can listen twice as much as we speak.', author: 'Epictetus' },
  { text: 'It is not death that a man should fear, but he should fear never beginning to live.', author: 'Marcus Aurelius' },
  { text: 'The happiness of your life depends upon the quality of your thoughts.', author: 'Marcus Aurelius' },
  { text: 'We suffer more often in imagination than in reality.', author: 'Seneca' },
  { text: 'It’s not what happens to you, but how you react to it that matters.', author: 'Epictetus' },
  { text: 'Luck is what happens when preparation meets opportunity.', author: 'Seneca' },
  { text: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius' },
  { text: 'The best revenge is not to be like your enemy.', author: 'Marcus Aurelius' },
  { text: 'We are more often frightened than hurt; and we suffer more from imagination than from reality.', author: 'Seneca' },
  { text: 'First say to yourself what you would be; and then do what you have to do.', author: 'Epictetus' },
  { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'Difficulties strengthen the mind, as labor does the body.', author: 'Seneca' },
  { text: 'Don’t explain your philosophy. Embody it.', author: 'Epictetus' },
  { text: 'The soul becomes dyed with the color of its thoughts.', author: 'Marcus Aurelius' },
  { text: 'As is a tale, so is life: not how long it is, but how good it is, is what matters.', author: 'Seneca' },
  { text: 'No person has the power to have everything they want, but it is in their power not to want what they don’t have.', author: 'Seneca' },
  { text: 'He who lives in harmony with himself lives in harmony with the universe.', author: 'Marcus Aurelius' },
  { text: 'It is the power of the mind to be unconquerable.', author: 'Seneca' },
  { text: 'We cannot choose our external circumstances, but we can always choose how we respond to them.', author: 'Epictetus' },
  { text: 'Begin at once to live, and count each separate day as a separate life.', author: 'Seneca' },
];

/**
 * Returns the quote for the given date (same date = same quote).
 * Uses a simple numeric hash of YYYY-MM-DD so the quote is stable all day.
 */
export function getQuoteOfTheDay(date: Date = new Date()): DailyQuote {
  const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index];
}
