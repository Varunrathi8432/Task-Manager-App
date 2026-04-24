import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CustomTableService } from '../../custom-table.service';
import type { PillColorConfig, PriorityCellParams } from '../../custom-table.types';

const DEFAULT_PRIORITY_COLORS: Record<string, PillColorConfig> = {
  low: { label: 'Low', color: '#99c140' },
  medium: { label: 'Medium', color: '#e1d34a' },
  high: { label: 'High', color: '#ee8050' },
  urgent: { label: 'Urgent', color: '#ee5057' },
  critical: { label: 'Critical', color: '#b71c1c' },
};

const KNOWN_PRIORITY_KEYS = new Set(['low', 'medium', 'high', 'critical']);
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

@Component({
  selector: 'app-priority-cell',
  standalone: true,
  templateUrl: './priority.component.html',
  styleUrl: './priority.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityCellComponent implements ICellRendererAngularComp {
  private sharedService = inject(CustomTableService);

  params = signal<ICellRendererParams | null>(null);
  rawValue = signal<unknown>(null);

  knownKey = computed<string | null>(() => {
    const value = this.rawValue();
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const key = String(value).toLowerCase();
    return KNOWN_PRIORITY_KEYS.has(key) ? key : null;
  });

  private config = computed<PillColorConfig | null>(() => {
    const value = this.rawValue();
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as { name?: string; colorCode?: string; colour_code?: string };
      const name = obj.name ?? '';
      if (!name) return null;
      return {
        label: name,
        color: obj.colorCode ?? obj.colour_code ?? DEFAULT_PRIORITY_COLORS[name.toLowerCase()]?.color ?? '#616161',
      };
    }

    const key = String(value);
    const rendererParams = (this.params()?.colDef as { cellRendererParams?: PriorityCellParams })
      ?.cellRendererParams;
    const customColors = rendererParams?.colors ?? {};
    const found = customColors[key] ?? customColors[key.toLowerCase()] ?? DEFAULT_PRIORITY_COLORS[key.toLowerCase()];
    if (found) return found;

    return { label: key, color: '#616161' };
  });

  label = computed(() => {
    const known = this.knownKey();
    if (known) return PRIORITY_LABELS[known];
    return this.config()?.label ?? '—';
  });
  color = computed(() => this.config()?.color ?? '#616161');
  background = computed(() => {
    const cfg = this.config();
    if (!cfg) return 'transparent';
    return cfg.bg ?? this.sharedService.convertHexToRGBA(cfg.color, 14);
  });
  hasValue = computed(() => this.knownKey() !== null || this.config() !== null);

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
