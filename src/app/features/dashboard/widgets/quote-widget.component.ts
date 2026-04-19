import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const QUOTES = [
  { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { content: 'It is not enough to be busy. The question is: what are we busy about?', author: 'Henry David Thoreau' },
  { content: 'Productivity is never an accident. It is always the result of a commitment to excellence.', author: 'Paul J. Meyer' },
  { content: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { content: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { content: 'You don\'t need more time, you need more focus.', author: 'Unknown' },
  { content: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { content: 'Small progress is still progress.', author: 'Unknown' },
];

@Component({
  selector: 'app-quote-widget',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './quote-widget.component.html',
  styleUrl: './quote-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteWidgetComponent {
  private quoteIndex = signal(Math.floor(Math.random() * QUOTES.length));
  quote = computed(() => QUOTES[this.quoteIndex()]);

  refresh(): void {
    this.quoteIndex.set(Math.floor(Math.random() * QUOTES.length));
  }
}
