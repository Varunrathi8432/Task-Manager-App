import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import type { ActionColumnOptions, ActionType, CellActionHost } from '../../custom-table.types';

type ActionCellParams = ICellRendererParams & {
  context?: { componentParent?: CellActionHost };
};

@Component({
  selector: 'app-action-cell',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './action-cell.component.html',
  styleUrl: './action-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionCellComponent implements ICellRendererAngularComp {
  private params: ActionCellParams | null = null;

  rowData = signal<unknown>(null);
  showDetailButton = signal(false);
  showEditButton = signal(false);
  showDeleteButton = signal(false);
  showDownloadButton = signal(false);

  agInit(params: ActionCellParams): void {
    this.params = params;
    this.rowData.set(params.data);
    const opts = (params.colDef as { cellRendererParams?: ActionColumnOptions })?.cellRendererParams ?? {};
    this.showDetailButton.set(!!opts.showDetailButton);
    this.showEditButton.set(!!opts.showEditButton);
    this.showDeleteButton.set(!!opts.showDeleteButton);
    this.showDownloadButton.set(!!opts.showDownloadButton);
  }

  refresh(params: ActionCellParams): boolean {
    this.agInit(params);
    return true;
  }

  onDetailClick(event: MouseEvent): void {
    this.emit(event, 'detail');
  }

  onEditClick(event: MouseEvent): void {
    this.emit(event, 'edit');
  }

  onDeleteClick(event: MouseEvent): void {
    this.emit(event, 'delete');
  }

  onDownloadClick(event: MouseEvent): void {
    this.emit(event, 'download');
  }

  private emit(event: MouseEvent, _actionType: ActionType): void {
    event.stopPropagation();
    const host = this.params?.context?.componentParent;
    const value = this.params?.data;
    if (host && value !== undefined) {
      host.actionButtons({ _actionType, value });
    }
  }
}
