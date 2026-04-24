import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CustomTableComponent } from '@shared/components/custom-table/custom-table.component';
import type {
  CellActionEvent,
  CellActionHost,
  ColumnConfig,
} from '@shared/components/custom-table/custom-table.types';
import { DynamicFilterComponent } from '@shared/components/dynamic-filter/dynamic-filter.component';
import type { FilterField, FilterFormData, FilterSubmitEvent } from '@shared/components/dynamic-filter/dynamic-filter.types';
import type { GridApi, ValueGetterParams } from 'ag-grid-community';
import { TaskFormComponent } from '../task-form/task-form.component';
import { Task, TaskStatus, TaskPriority } from '@core/models';
import { ProjectCellComponent } from './cell-renderers/project-cell.component';

const PRIORITY_ORDER: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2, critical: 3 };
const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, 'in-progress': 1, review: 2, done: 3 };

const PRIORITY_COLORS = {
  low: { label: 'Low', color: '#2e7d32', bg: '#e8f5e9' },
  medium: { label: 'Medium', color: '#f57f17', bg: '#fff8e1' },
  high: { label: 'High', color: '#c62828', bg: '#ffebee' },
  critical: { label: 'Critical', color: '#ffffff', bg: '#b71c1c' },
};

const STATUS_COLORS = {
  todo: { label: 'To Do', color: '#616161', bg: '#e0e0e0' },
  'in-progress': { label: 'In Progress', color: '#1565c0', bg: '#e3f2fd' },
  review: { label: 'Review', color: '#7b1fa2', bg: '#f3e5f5' },
  done: { label: 'Done', color: '#2e7d32', bg: '#e8f5e9' },
};

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule,
    CustomTableComponent,
    DynamicFilterComponent,
    PageHeaderComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements CellActionHost<Task> {
  protected taskStore = inject(TaskStore);
  protected projectStore = inject(ProjectStore);
  private router = inject(Router);
  private modalService = inject(BsModalService);

  selectedTasks = signal<Task[]>([]);
  filterFormData = signal<FilterFormData>({});

  private gridApi: GridApi<Task> | null = null;

  context = { componentParent: this };

  filterFields = computed<FilterField[]>(() => [
    {
      id: 'search',
      name: 'search',
      label: 'Search',
      field_type: 'text',
      placeholder: 'Search by title, description, label',
      order: 1,
    },
    {
      id: 'status',
      name: 'status',
      label: 'Status',
      field_type: 'dropdown',
      isMultiple: true,
      items: [
        { id: 'todo', name: 'To Do' },
        { id: 'in-progress', name: 'In Progress' },
        { id: 'review', name: 'Review' },
        { id: 'done', name: 'Done' },
      ],
      order: 2,
    },
    {
      id: 'priority',
      name: 'priority',
      label: 'Priority',
      field_type: 'dropdown',
      isMultiple: true,
      items: [
        { id: 'low', name: 'Low' },
        { id: 'medium', name: 'Medium' },
        { id: 'high', name: 'High' },
        { id: 'critical', name: 'Critical' },
      ],
      order: 3,
    },
    {
      id: 'project',
      name: 'projectId',
      label: 'Project',
      field_type: 'dropdown',
      isMultiple: true,
      items: this.projectStore.projects().map(p => ({ id: p.id, name: p.name, color: p.color })),
      order: 4,
    },
    {
      id: 'dueDate',
      name: 'dueDate',
      label: 'Due Date',
      field_type: 'ngdaterange',
      order: 5,
    },
  ]);

  tableData = computed<Task[]>(() => {
    const tasks = this.taskStore.tasks();
    const f = this.filterFormData();
    const search = ((f['search'] as string) ?? '').toLowerCase().trim();
    const statuses = (f['status'] as TaskStatus[]) ?? [];
    const priorities = (f['priority'] as TaskPriority[]) ?? [];
    const projects = (f['projectId'] as string[]) ?? [];
    const dueRange = (f['dueDate'] as { start: string | null; end: string | null }) ?? { start: null, end: null };

    return tasks.filter(t => {
      if (search) {
        const hay = `${t.title} ${t.description} ${t.labels.join(' ')}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (statuses.length && !statuses.includes(t.status)) return false;
      if (priorities.length && !priorities.includes(t.priority)) return false;
      if (projects.length && (!t.projectId || !projects.includes(t.projectId))) return false;
      if (dueRange.start || dueRange.end) {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate).getTime();
        if (dueRange.start && due < new Date(dueRange.start).getTime()) return false;
        if (dueRange.end && due > new Date(dueRange.end).getTime() + 86_399_999) return false;
      }
      return true;
    });
  });

  customColumnList: ColumnConfig<Task>[] = [
    {
      label: 'Title',
      field_value_name: 'title',
      type: 'text',
      flex: 2,
      minWidth: 220,
    },
    {
      label: 'Priority',
      field_value_name: 'priority',
      type: 'priority',
      width: 140,
      cellRendererParams: { colors: PRIORITY_COLORS },
      comparator: (a, b) => PRIORITY_ORDER[a as TaskPriority] - PRIORITY_ORDER[b as TaskPriority],
    },
    {
      label: 'Status',
      field_value_name: 'status',
      type: 'status',
      width: 160,
      cellRendererParams: { colors: STATUS_COLORS },
      comparator: (a, b) => STATUS_ORDER[a as TaskStatus] - STATUS_ORDER[b as TaskStatus],
    },
    {
      label: 'Due Date',
      field_value_name: 'dueDate',
      type: 'date',
      width: 170,
      cellRendererParams: { highlightOverdue: true, doneField: 'completedAt' },
      comparator: (a, b) => {
        const av = a as string | null;
        const bv = b as string | null;
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        return new Date(av).getTime() - new Date(bv).getTime();
      },
    },
    {
      label: 'Project',
      field_value_name: 'projectId',
      type: 'custom',
      cellRenderer: ProjectCellComponent,
      width: 180,
      valueGetter: (p: ValueGetterParams<Task>) => this.getProjectName(p.data?.projectId ?? null),
    },
  ];

  getProjectName(projectId: string | null): string {
    if (!projectId) return '—';
    return this.projectStore.projects().find(p => p.id === projectId)?.name ?? '—';
  }

  onGridReady(api: GridApi<Task>): void {
    this.gridApi = api;
  }

  onRowSelect(rows: Task[]): void {
    this.selectedTasks.set(rows);
  }

  onRowClicked(task: Task): void {
    this.navigateToTask(task.id);
  }

  onFilterSubmit(event: FilterSubmitEvent): void {
    this.filterFormData.set(event.filterFormData);
  }

  actionButtons(event: CellActionEvent<Task>): void {
    switch (event._actionType) {
      case 'edit':
        this.openTaskForm(event.value);
        break;
      case 'delete':
        this.deleteTask(event.value);
        break;
      case 'detail':
        this.navigateToTask(event.value.id);
        break;
    }
  }

  clearSelection(): void {
    this.gridApi?.deselectAll();
  }

  openTaskForm(task?: Task): void {
    const modalRef = this.modalService.show(TaskFormComponent, {
      class: 'modal-md',
      initialState: { task: task ?? null },
    });
    modalRef.content?.result.pipe(take(1)).subscribe(result => {
      if (task) {
        this.taskStore.updateTask({ id: task.id, changes: result });
      } else {
        this.taskStore.addTask(result);
      }
    });
  }

  navigateToTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  deleteTask(task: Task): void {
    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      class: 'modal-sm',
      initialState: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.title}"?`,
        confirmText: 'Delete',
        warn: true,
      } satisfies ConfirmDialogData,
    });
    modalRef.content?.result.pipe(take(1)).subscribe(confirmed => {
      if (confirmed) this.taskStore.deleteTask(task.id);
    });
  }

  bulkDelete(): void {
    const selected = this.selectedTasks();
    const count = selected.length;
    if (count === 0) return;
    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      class: 'modal-sm',
      initialState: {
        title: 'Delete Tasks',
        message: `Delete ${count} selected tasks?`,
        confirmText: 'Delete All',
        warn: true,
      } satisfies ConfirmDialogData,
    });
    modalRef.content?.result.pipe(take(1)).subscribe(confirmed => {
      if (confirmed) {
        this.taskStore.deleteTasks(selected.map(t => t.id));
        this.clearSelection();
      }
    });
  }

  bulkStatusChange(status: TaskStatus): void {
    for (const task of this.selectedTasks()) {
      this.taskStore.updateTask({ id: task.id, changes: { status } });
    }
    this.clearSelection();
  }
}
