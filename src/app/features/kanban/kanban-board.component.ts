import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { Task, TaskStatus } from '@core/models';
import { isBefore, parseISO } from 'date-fns';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RelativeDatePipe,
    PageHeaderComponent,
  ],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent {
  protected taskStore = inject(TaskStore);
  protected projectStore = inject(ProjectStore);
  private router = inject(Router);
  private modalService = inject(BsModalService);

  columns: { status: TaskStatus; label: string; icon: string }[] = [
    { status: 'todo', label: 'To Do', icon: 'radio_button_unchecked' },
    { status: 'in-progress', label: 'In Progress', icon: 'pending' },
    { status: 'review', label: 'Review', icon: 'rate_review' },
    { status: 'done', label: 'Done', icon: 'check_circle' },
  ];

  columnIds = this.columns.map((c) => 'column-' + c.status);

  addingToColumn = signal<TaskStatus | null>(null);
  newTaskTitle = signal('');

  getTasksForStatus(status: TaskStatus): Task[] {
    return this.taskStore.tasksByStatus()[status] ?? [];
  }

  getColumnCount(status: TaskStatus): number {
    return (this.taskStore.tasksByStatus()[status] ?? []).length;
  }

  getSubtaskProgress(task: Task): { completed: number; total: number } | null {
    if (task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter((s) => s.completed).length;
    return { completed, total: task.subtasks.length };
  }

  onDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    const task: Task = event.item.data;

    if (event.previousContainer === event.container) {
      const tasks = [...this.getTasksForStatus(targetStatus)];
      moveItemInArray(tasks, event.previousIndex, event.currentIndex);
      this.taskStore.moveTask({
        id: task.id,
        status: targetStatus,
        order: event.currentIndex,
      });
    } else {
      this.taskStore.moveTask({
        id: task.id,
        status: targetStatus,
        order: event.currentIndex,
      });
    }
  }

  startAddingTask(status: TaskStatus): void {
    this.addingToColumn.set(status);
    this.newTaskTitle.set('');
  }

  cancelAdding(): void {
    this.addingToColumn.set(null);
    this.newTaskTitle.set('');
  }

  submitNewTask(status: TaskStatus): void {
    const title = this.newTaskTitle().trim();
    if (title) {
      this.taskStore.addTask({
        title,
        description: '',
        priority: 'medium',
        status,
        dueDate: null,
        labels: [],
        projectId: null,
      });
      this.cancelAdding();
    }
  }

  openTaskDetail(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  openTaskForm(): void {
    const modalRef = this.modalService.show(TaskFormComponent, {
      class: 'modal-md',
      initialState: { task: null },
    });
    modalRef.content?.result.pipe(take(1)).subscribe((result) => {
      this.taskStore.addTask(result);
    });
  }

  isOverdue(task: Task): boolean {
    return (
      task.status !== 'done' &&
      !!task.dueDate &&
      isBefore(parseISO(task.dueDate), new Date())
    );
  }

  getProjectColor(projectId: string | null): string {
    if (!projectId) return 'transparent';
    return (
      this.projectStore.projects().find((p) => p.id === projectId)?.color ??
      'transparent'
    );
  }

  getProjectName(projectId: string | null): string {
    if (!projectId) return '';
    return (
      this.projectStore.projects().find((p) => p.id === projectId)?.name ?? ''
    );
  }
}
