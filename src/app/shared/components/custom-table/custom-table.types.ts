import type { Type } from '@angular/core';
import type { ColDef, ValueFormatterFunc, ValueGetterFunc } from 'ag-grid-community';

export type CellType =
  | 'text'
  | 'status'
  | 'priority'
  | 'date'
  | 'action'
  | 'custom';

export type ActionType = 'edit' | 'delete' | 'detail' | 'download';

export interface CellActionEvent<T = unknown> {
  _actionType: ActionType;
  value: T;
}

export interface CellActionHost<T = unknown> {
  actionButtons(event: CellActionEvent<T>): void;
}

export interface PillColorConfig {
  label?: string;
  color: string;
  bg?: string;
}

export interface ColumnConfig<T = unknown> {
  label: string;
  field_value_name: string;
  type?: CellType;
  order?: number;

  is_required?: boolean;
  is_display_allowed?: boolean;

  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;

  pinned?: 'left' | 'right' | null;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  suppressMovable?: boolean;

  filter?: ColDef['filter'];
  valueGetter?: ValueGetterFunc<T> | string;
  valueFormatter?: ValueFormatterFunc<T>;
  comparator?: (a: unknown, b: unknown) => number;
  filterValueGetter?: ValueGetterFunc<T>;

  cellRenderer?: Type<unknown>;
  cellRendererParams?: Record<string, unknown>;
  cellClass?: string;
}

export interface ActionColumnOptions {
  showDetailButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showDownloadButton?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: 'left' | 'right' | null;
}

export interface StatusCellParams {
  colors?: Record<string, PillColorConfig>;
}

export interface PriorityCellParams {
  colors?: Record<string, PillColorConfig>;
}

export interface DateCellParams {
  highlightOverdue?: boolean;
  doneField?: string;
}
