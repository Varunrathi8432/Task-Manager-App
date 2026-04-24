import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-text-cell',
  standalone: true,
  templateUrl: './text-cell.component.html',
  styleUrl: './text-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextCellComponent implements ICellRendererAngularComp {
  public params: ICellRendererParams | null = null;
  public display = signal<string>('');
  public tooltipValue = signal<string>('');

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.formatValue(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.formatValue(params);
    return true;
  }

  private formatValue(params: ICellRendererParams): void {
    const raw = params.valueFormatted ?? params.value;
    const text = this.toDisplayString(raw);
    this.display.set(text);
    this.tooltipValue.set(text);
  }

  private toDisplayString(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }
}
