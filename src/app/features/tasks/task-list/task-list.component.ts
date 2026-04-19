import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { StatusChipComponent } from '@shared/components/status-chip/status-chip.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { Task, TaskStatus, TaskPriority } from '@core/models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatMenuModule, MatTooltipModule,
    FormsModule,
    PriorityBadgeComponent, StatusChipComponent, PageHeaderComponent,
    EmptyStateComponent, RelativeDatePipe,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  protected taskStore = inject(TaskStore);
  protected projectStore = inject(ProjectStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  selection = new SelectionModel<string>(true, []);
  searchValue = signal('');
  pageSize = signal(10);
  pageIndex = signal(0);
  sortField = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  displayedColumns = ['select', 'title', 'priority', 'status', 'dueDate', 'project', 'actions'];

  sortedTasks = computed(() => {
    let tasks = [...this.taskStore.filteredTasks()];
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    tasks.sort((a: any, b: any) => {
      const va = a[field] ?? '';
      const vb = b[field] ?? '';
      return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
    });
    return tasks;
  });

  paginatedTasks = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedTasks().slice(start, start + this.pageSize());
  });

  getProjectName(projectId: string | null): string {
    if (!projectId) return '\u2014';
    return this.projectStore.projects().find(p => p.id === projectId)?.name ?? '\u2014';
  }

  getProjectColor(projectId: string | null): string {
    if (!projectId) return 'transparent';
    return this.projectStore.projects().find(p => p.id === projectId)?.color ?? 'transparent';
  }

  onSearch(value: string): void {
    this.taskStore.setSearchQuery(value);
    this.pageIndex.set(0);
  }

  onSort(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set((sort.direction as 'asc' | 'desc') || 'desc');
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  onFilterStatus(status: TaskStatus | 'all'): void {
    this.taskStore.setFilter({ status });
    this.pageIndex.set(0);
  }

  onFilterPriority(priority: TaskPriority | 'all'): void {
    this.taskStore.setFilter({ priority });
    this.pageIndex.set(0);
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.paginatedTasks().length && this.paginatedTasks().length > 0;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.paginatedTasks().forEach(t => this.selection.select(t.id));
    }
  }

  openTaskForm(task?: Task): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '600px',
      data: { task },
      autoFocus: 'first-tabbable',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (task) {
          this.taskStore.updateTask({ id: task.id, changes: result });
        } else {
          this.taskStore.addTask(result);
        }
      }
    });
  }

  navigateToTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  deleteTask(task: Task): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.title}"?`,
        confirmText: 'Delete',
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.taskStore.deleteTask(task.id);
    });
  }

  bulkDelete(): void {
    const count = this.selection.selected.length;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tasks',
        message: `Delete ${count} selected tasks?`,
        confirmText: 'Delete All',
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.taskStore.deleteTasks(this.selection.selected);
        this.selection.clear();
      }
    });
  }

  bulkStatusChange(status: TaskStatus): void {
    for (const id of this.selection.selected) {
      this.taskStore.updateTask({ id, changes: { status } });
    }
    this.selection.clear();
  }

  isOverdue(task: Task): boolean {
    return task.status !== 'done' && !!task.dueDate && new Date(task.dueDate) < new Date();
  }
}
