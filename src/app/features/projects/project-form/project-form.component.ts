import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '@core/models';

const PROJECT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent {
  data = inject<{ project?: Project }>(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<ProjectFormComponent>);
  private fb = inject(NonNullableFormBuilder);

  isEditing = !!this.data?.project;
  colors = PROJECT_COLORS;

  form = this.fb.group({
    name: [this.data?.project?.name ?? '', [Validators.required]],
    description: [this.data?.project?.description ?? ''],
    color: [this.data?.project?.color ?? PROJECT_COLORS[0]],
  });

  selectColor(color: string): void {
    this.form.patchValue({ color });
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
