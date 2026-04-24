import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import type { DateCellParams } from '../../custom-table.types';

@Component({
  selector: 'app-date-cell',
  standalone: true,
  templateUrl: './date-cell.component.html',
  styleUrl: './date-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateCellComponent implements ICellRendererAngularComp {
  params = signal<ICellRendererParams | null>(null);
  rawValue = signal<unknown>(null);

  private parsedDate = computed<Date | null>(() => {
    const value = this.rawValue();
    if (!value) return null;
    const str = typeof value === 'string' ? value : String(value);
    const date = parseISO(str);
    return isValid(date) ? date : null;
  });

  display = computed<string>(() => {
    const d = this.parsedDate();
    if (!d) return '—';
    try {
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return '—';
    }
  });

  overdue = computed<boolean>(() => {
    const rendererParams = (this.params()?.colDef as { cellRendererParams?: DateCellParams })
      ?.cellRendererParams;
    if (rendererParams?.highlightOverdue === false) return false;
    const d = this.parsedDate();
    if (!d) return false;
    if (d.getTime() >= Date.now()) return false;
    const doneField = rendererParams?.doneField;
    if (doneField) {
      const row = this.params()?.data as Record<string, unknown> | undefined;
      if (row && row[doneField]) return false;
    }
    return true;
  });

  agInit(params: ICellRendererParams): void {
    this.params.set(params);
    this.rawValue.set(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.params.set(params);
    this.rawValue.set(params.value);
    return true;
  }
}
