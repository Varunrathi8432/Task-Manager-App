import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  effect,
  computed,
  Type,
} from '@angular/core';
import { ThemeService } from '@core/services/theme.service';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  SelectionChangedEvent,
  CellClickedEvent,
  RowSelectionOptions,
  Theme,
} from 'ag-grid-community';

import { TextCellComponent } from './custom-cells-components/text-cell/text-cell.component';
import { StatusCellComponent } from './custom-cells-components/status/status.component';
import { PriorityCellComponent } from './custom-cells-components/priority/priority.component';
import { DateCellComponent } from './custom-cells-components/date-cell/date-cell.component';
import { ActionCellComponent } from './custom-cells-components/action-cell/action-cell.component';
import type {
  ActionColumnOptions,
  CellType,
  ColumnConfig,
} from './custom-table.types';

ModuleRegistry.registerModules([AllCommunityModule]);

export type CustomTableRowSelection = 'single' | 'multiple' | null;

const RENDERER_BY_TYPE: Record<Exclude<CellType, 'custom'>, Type<unknown>> = {
  text: TextCellComponent,
  status: StatusCellComponent,
  priority: PriorityCellComponent,
  date: DateCellComponent,
  action: ActionCellComponent,
};

const DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  filter: false,
  floatingFilter: false,
  resizable: true,
  suppressHeaderMenuButton: true,
  suppressHeaderFilterButton: true,
};

const LIGHT_THEME = themeQuartz.withParams({
  backgroundColor: '#ffffff',
  foregroundColor: '#0f172a',
  headerBackgroundColor: '#f6f7f9',
  headerTextColor: '#3d4f61',
  headerFontWeight: 500,
  headerFontSize: 12,
  headerHeight: 44,
  rowHeight: 48,
  rowHoverColor: '#edf8ff',
  borderColor: '#eaebf3',
  chromeBackgroundColor: '#ffffff',
  wrapperBorderRadius: 12,
  wrapperBorder: true,
  cellHorizontalPadding: 12,
  fontFamily: 'inherit',
  fontSize: 13,
  accentColor: '#1976d2',
  selectedRowBackgroundColor: 'rgba(25, 118, 210, 0.08)',
});

const DARK_THEME = themeQuartz.withParams({
  backgroundColor: '#0f172a',
  foregroundColor: '#f1f5f9',
  headerBackgroundColor: '#1a2332',
  headerTextColor: '#cbd5e1',
  headerFontWeight: 500,
  headerFontSize: 12,
  headerHeight: 44,
  rowHeight: 48,
  rowHoverColor: '#243246',
  borderColor: '#334155',
  chromeBackgroundColor: '#1e293b',
  wrapperBorderRadius: 12,
  wrapperBorder: true,
  cellHorizontalPadding: 12,
  fontFamily: 'inherit',
  fontSize: 13,
  accentColor: '#60a5fa',
  selectedRowBackgroundColor: 'rgba(96, 165, 250, 0.18)',
});

@Component({
  selector: 'app-custom-table',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTableComponent<T = unknown> {
  private themeService = inject(ThemeService);

  customColumnList = input.required<ColumnConfig<T>[]>();
  tableData = input<T[] | null | undefined>([]);
  defaultColDef = input<ColDef>(DEFAULT_COL_DEF);
  context = input<unknown>(undefined);
  theme = input<Theme | undefined>(undefined);

  appliedTheme = computed<Theme>(() =>
    this.theme() ?? (this.themeService.isDark() ? DARK_THEME : LIGHT_THEME)
  );

  pagination = input<boolean>(true);
  paginationPageSize = input<number>(10);
  paginationPageSizeSelector = input<number[] | boolean>([5, 10, 25, 50]);

  rowSelection = input<CustomTableRowSelection>(null);
  suppressRowClickSelection = input<boolean>(true);

  quickFilterText = input<string>('');
  animateRows = input<boolean>(true);
  rowHeight = input<number>(48);
  headerHeight = input<number | undefined>(undefined);

  noDataMessage = input<string>('No records found');
  loading = input<boolean>(false);

  tableHeight = input<string>('calc(100vh - 260px)');
  minHeight = input<string>('420px');

  hideAction = input<boolean>(false);
  showDetailButton = input<boolean>(false);
  showEditButton = input<boolean>(false);
  showDeleteButton = input<boolean>(false);
  showDownloadButton = input<boolean>(false);
  actionColumnWidth = input<number>(140);

  gridReady = output<GridApi<T>>();
  rowClicked = output<T>();
  onRowSelect = output<T[]>();
  onCellClicked = output<CellClickedEvent<T>>();

  private gridApiSignal = signal<GridApi<T> | null>(null);
  selectedCount = signal<number>(0);
  totalCount = computed<number>(() => this.tableData()?.length ?? 0);

  columnDefs = computed<ColDef<T>[]>(() => this.buildColumnDefs());

  rowSelectionOption = computed<RowSelectionOptions | undefined>(() => {
    const mode = this.rowSelection();
    if (!mode) return undefined;
    return {
      mode: mode === 'multiple' ? 'multiRow' : 'singleRow',
      checkboxes: true,
      headerCheckbox: mode === 'multiple',
      enableClickSelection: !this.suppressRowClickSelection(),
    };
  });

  overlayNoRowsTemplate = computed(
    () => `<span class="custom-table-empty">${this.escapeHtml(this.noDataMessage())}</span>`,
  );

  constructor() {
    effect(() => {
      const api = this.gridApiSignal();
      if (!api || api.isDestroyed()) return;
      if (this.loading()) api.showLoadingOverlay();
      else api.hideOverlay();
    });
  }

  get gridApi(): GridApi<T> | null {
    return this.gridApiSignal();
  }

  deselectAll(): void {
    this.gridApi?.deselectAll();
  }

  onGridReady(event: GridReadyEvent<T>): void {
    this.gridApiSignal.set(event.api);
    this.gridReady.emit(event.api);
  }

  onSelectionChanged(event: SelectionChangedEvent<T>): void {
    const selected = event.api.getSelectedRows();
    this.selectedCount.set(selected.length);
    this.onRowSelect.emit(selected);
  }

  onRowClicked(event: RowClickedEvent<T>): void {
    const target = event.event?.target as HTMLElement | undefined;
    if (target?.closest('button, input, a, .ag-selection-checkbox, .action-list')) {
      return;
    }
    if (event.data) this.rowClicked.emit(event.data);
  }

  handleCellClicked(event: CellClickedEvent<T>): void {
    this.onCellClicked.emit(event);
  }

  private buildColumnDefs(): ColDef<T>[] {
    const columns = this.customColumnList();
    const visible = columns
      .filter(c => c.is_display_allowed !== false)
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const defs: ColDef<T>[] = visible.map(c => this.toColDef(c));

    if (!this.hideAction() && this.hasAnyAction()) {
      defs.push(this.buildActionColumn());
    }

    return defs;
  }

  private toColDef(c: ColumnConfig<T>): ColDef<T> {
    const type: CellType = c.type ?? 'text';
    const renderer = type === 'custom'
      ? c.cellRenderer
      : RENDERER_BY_TYPE[type] ?? TextCellComponent;

    const def: ColDef<T> = {
      headerName: c.label,
      headerTooltip: c.label,
      field: c.field_value_name as ColDef<T>['field'],
      colId: c.field_value_name,
      cellRenderer: renderer,
      cellRendererParams: c.cellRendererParams,
      cellClass: c.cellClass,
      width: c.width,
      minWidth: c.minWidth,
      maxWidth: c.maxWidth,
      flex: c.flex,
      pinned: c.pinned ?? undefined,
      sortable: c.sortable ?? true,
      resizable: c.resizable ?? true,
      suppressMovable: c.suppressMovable,
      filter: c.filter ?? c.filterable === true,
      floatingFilter: c.filterable === true,
      suppressHeaderMenuButton: c.filterable !== true,
      suppressHeaderFilterButton: c.filterable !== true,
      valueGetter: c.valueGetter,
      valueFormatter: c.valueFormatter,
      comparator: c.comparator,
      filterValueGetter: c.filterValueGetter,
    };

    return def;
  }

  private hasAnyAction(): boolean {
    return this.showDetailButton()
      || this.showEditButton()
      || this.showDeleteButton()
      || this.showDownloadButton();
  }

  private buildActionColumn(): ColDef<T> {
    const params: ActionColumnOptions = {
      showDetailButton: this.showDetailButton(),
      showEditButton: this.showEditButton(),
      showDeleteButton: this.showDeleteButton(),
      showDownloadButton: this.showDownloadButton(),
    };
    return {
      headerName: 'Action',
      colId: 'action-button',
      cellRenderer: ActionCellComponent,
      cellRendererParams: params,
      width: this.actionColumnWidth(),
      minWidth: 100,
      maxWidth: 240,
      pinned: 'right',
      sortable: false,
      filter: false,
      floatingFilter: false,
      resizable: false,
      suppressMovable: true,
      cellClass: 'action-list-cell',
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
