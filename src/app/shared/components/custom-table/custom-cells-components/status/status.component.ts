import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CustomTableService } from '../../custom-table.service';
import type { PillColorConfig, StatusCellParams } from '../../custom-table.types';

const DEFAULT_STATUS_COLORS: Record<string, PillColorConfig> = {
  active: { label: 'Active', color: '#3da234' },
  joined: { label: 'Joined', color: '#3da234' },
  inactive: { label: 'Inactive', color: '#e60942' },
  disabled: { label: 'Disabled', color: '#e60942' },
  invited: { label: 'Invited', color: '#0e63a3' },
  pending: { label: 'Pending', color: '#d68307' },
};

@Component({
  selector: 'app-status-cell',
  standalone: true,
  templateUrl: './status.component.html',
  styleUrl: './status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusCellComponent implements ICellRendererAngularComp {
  private sharedService = inject(CustomTableService);

  params = signal<ICellRendererParams | null>(null);
  rawValue = signal<unknown>(null);

  private config = computed<PillColorConfig | null>(() => {
    const value = this.rawValue();
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as { name?: string; colour_code?: string; color?: string };
      if (obj.name) {
        return {
          label: obj.name,
          color: obj.colour_code ?? obj.color ?? '#616161',
        };
      }
    }

    const key = String(value);
    const rendererParams = (this.params()?.colDef as { cellRendererParams?: StatusCellParams })
      ?.cellRendererParams;
    const customColors = rendererParams?.colors ?? {};
    const found = customColors[key] ?? customColors[key.toLowerCase()] ?? DEFAULT_STATUS_COLORS[key.toLowerCase()];
    if (found) return found;

    return { label: key, color: '#616161' };
  });

  label = computed(() => this.config()?.label ?? '—');
  color = computed(() => this.config()?.color ?? '#616161');
  background = computed(() => {
    const cfg = this.config();
    if (!cfg) return 'transparent';
    return cfg.bg ?? this.sharedService.convertHexToRGBA(cfg.color, 12);
  });
  hasValue = computed(() => this.config() !== null);

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
