import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatChipsModule, MatIconModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  data = inject<{ task?: Task }>(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<TaskFormComponent>);
  projectStore = inject(ProjectStore);
  private fb = inject(NonNullableFormBuilder);

  isEditing = !!this.data?.task;

  taskForm = this.fb.group({
    title: [this.data?.task?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    description: [this.data?.task?.description ?? ''],
    priority: [(this.data?.task?.priority ?? 'medium') as TaskPriority],
    status: [(this.data?.task?.status ?? 'todo') as TaskStatus],
    dueDate: [this.data?.task?.dueDate ? new Date(this.data.task.dueDate) : null as Date | null],
    projectId: [this.data?.task?.projectId ?? null as string | null],
    labels: [this.data?.task?.labels ?? [] as string[]],
  });

  priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
  statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];

  labelInput = '';

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
      this.dialogRef.close({
        ...value,
        dueDate: value.dueDate ? new Date(value.dueDate).toISOString() : null,
      });
    }
  }
}
