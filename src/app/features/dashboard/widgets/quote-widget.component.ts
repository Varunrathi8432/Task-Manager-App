import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getDemoQuoteAt, getDemoQuoteCount } from '@core/data';

@Component({
  selector: 'app-quote-widget',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './quote-widget.component.html',
  styleUrl: './quote-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteWidgetComponent {
  private quoteCount = getDemoQuoteCount();
  private quoteIndex = signal(Math.floor(Math.random() * this.quoteCount));
  quote = computed(() => getDemoQuoteAt(this.quoteIndex()));

  refresh(): void {
    this.quoteIndex.set(Math.floor(Math.random() * this.quoteCount));
  }
}
