export interface DemoQuote {
  content: string;
  author: string;
}

const DEMO_QUOTES: DemoQuote[] = [
  { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { content: 'It is not enough to be busy. The question is: what are we busy about?', author: 'Henry David Thoreau' },
  { content: 'Productivity is never an accident. It is always the result of a commitment to excellence.', author: 'Paul J. Meyer' },
  { content: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { content: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { content: "You don't need more time, you need more focus.", author: 'Unknown' },
  { content: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { content: 'Small progress is still progress.', author: 'Unknown' },
];

function clone(quote: DemoQuote): DemoQuote {
  return { ...quote };
}

export function getDemoQuotes(): DemoQuote[] {
  return DEMO_QUOTES.map(clone);
}

export function getDemoQuoteAt(index: number): DemoQuote {
  const safeIndex = ((index % DEMO_QUOTES.length) + DEMO_QUOTES.length) % DEMO_QUOTES.length;
  return clone(DEMO_QUOTES[safeIndex]);
}

export function getRandomDemoQuote(): DemoQuote {
  return clone(DEMO_QUOTES[Math.floor(Math.random() * DEMO_QUOTES.length)]);
}

export function getDemoQuoteCount(): number {
  return DEMO_QUOTES.length;
}

export function setDemoQuote(quote: DemoQuote): void {
  const index = DEMO_QUOTES.findIndex(q => q.content === quote.content);
  if (index >= 0) {
    DEMO_QUOTES[index] = clone(quote);
  } else {
    DEMO_QUOTES.push(clone(quote));
  }
}
