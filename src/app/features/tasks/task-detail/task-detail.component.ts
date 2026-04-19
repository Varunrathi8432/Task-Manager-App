import { Component, ChangeDetectionStrategy, inject, input, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { StatusChipComponent } from '@shared/components/status-chip/status-chip.component';
import { SubtaskListComponent } from '@shared/components/subtask-list/subtask-list.component';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { TaskFormComponent } from '../task-form/task-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { Task, TaskStatus, TaskPriority } from '@core/models';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatChipsModule, MatSelectModule,
    MatTooltipModule, FormsModule,
    PriorityBadgeComponent, StatusChipComponent, SubtaskListComponent, RelativeDatePipe,
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent {
  id = input.required<string>();
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  task = computed(() => this.taskStore.tasks().find(t => t.id === this.id()) ?? null);

  projectName = computed(() => {
    const pid = this.task()?.projectId;
    if (!pid) return null;
    return this.projectStore.projects().find(p => p.id === pid)?.name ?? null;
  });

  projectColor = computed(() => {
    const pid = this.task()?.projectId;
    if (!pid) return 'transparent';
    return this.projectStore.projects().find(p => p.id === pid)?.color ?? 'transparent';
  });

  subtaskProgress = computed(() => {
    const task = this.task();
    if (!task || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(s => s.completed).length;
    return { completed, total: task.subtasks.length };
  });

  formatDate(date: string | null): string {
    if (!date) return '\u2014';
    return format(parseISO(date), 'MMM dd, yyyy');
  }

  formatDateTime(date: string | null): string {
    if (!date) return '\u2014';
    return format(parseISO(date), 'MMM dd, yyyy HH:mm');
  }

  onStatusChange(status: TaskStatus): void {
    const task = this.task();
    if (task) this.taskStore.updateTask({ id: task.id, changes: { status } });
  }

  onPriorityChange(priority: TaskPriority): void {
    const task = this.task();
    if (task) this.taskStore.updateTask({ id: task.id, changes: { priority } });
  }

  onEdit(): void {
    const task = this.task();
    if (!task) return;
    const dialogRef = this.dialog.open(TaskFormComponent, { width: '600px', data: { task } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.taskStore.updateTask({ id: task.id, changes: result });
    });
  }

  onDelete(): void {
    const task = this.task();
    if (!task) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Task',
        message: `Delete "${task.title}"?`,
        confirmText: 'Delete',
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.taskStore.deleteTask(task.id);
        this.router.navigate(['/tasks']);
      }
    });
  }

  onSubtaskToggle(event: { taskId: string; subtaskId: string }): void {
    this.taskStore.toggleSubtask(event);
  }

  onSubtaskAdd(event: { taskId: string; title: string }): void {
    this.taskStore.addSubtask(event);
  }

  onSubtaskRemove(event: { taskId: string; subtaskId: string }): void {
    this.taskStore.removeSubtask(event);
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
