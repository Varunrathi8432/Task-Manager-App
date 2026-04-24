import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { ReactiveFormsModule, FormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Task, TaskPriority, TaskStatus } from '@core/models';
import { ProjectStore } from '@store/project.store';

export interface TaskFormResult {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string | null;
  labels: string[];
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatChipsModule, MatIconModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  bsModalRef = inject(BsModalRef);
  projectStore = inject(ProjectStore);
  private fb = inject(NonNullableFormBuilder);

  task: Task | null = null;
  initialDueDate: Date | null = null;

  readonly result = new Subject<TaskFormResult>();

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    priority: ['medium' as TaskPriority],
    status: ['todo' as TaskStatus],
    dueDate: [null as Date | null],
    projectId: [null as string | null],
    labels: [[] as string[]],
  });

  priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
  statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];

  labelInput = '';

  get isEditing(): boolean {
    return !!this.task;
  }

  // ngx-bootstrap sets `initialState` props before ngOnInit, so seed the form here.
  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        priority: this.task.priority,
        status: this.task.status,
        dueDate: this.task.dueDate ? new Date(this.task.dueDate) : null,
        projectId: this.task.projectId,
        labels: [...this.task.labels],
      });
    } else if (this.initialDueDate) {
      this.taskForm.patchValue({ dueDate: this.initialDueDate });
    }
  }

  addLabel(): void {
    const label = this.labelInput.trim().toLowerCase();
    if (label && !this.taskForm.value.labels?.includes(label)) {
      const current = this.taskForm.value.labels ?? [];
      this.taskForm.patchValue({ labels: [...current, label] });
      this.labelInput = '';
    }
  }

  removeLabel(label: string): void {
    const current = this.taskForm.value.labels ?? [];
    this.taskForm.patchValue({ labels: current.filter(l => l !== label) });
  }

  onSave(): void {
    if (this.taskForm.valid) {
      const value = this.taskForm.getRawValue();
      this.result.next({
        ...value,
        dueDate: value.dueDate ? new Date(value.dueDate).toISOString() : null,
      });
      this.bsModalRef.hide();
    }
  }

  onCancel(): void {
    this.bsModalRef.hide();
  }
}
