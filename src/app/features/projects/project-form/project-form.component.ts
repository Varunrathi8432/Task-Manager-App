import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '@core/models';

const PROJECT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export interface ProjectFormResult {
  name: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent {
  bsModalRef = inject(BsModalRef);
  private fb = inject(NonNullableFormBuilder);

  project: Project | null = null;
  colors = PROJECT_COLORS;

  readonly result = new Subject<ProjectFormResult>();

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    color: [PROJECT_COLORS[0]],
  });

  get isEditing(): boolean {
    return !!this.project;
  }

  ngOnInit(): void {
    if (this.project) {
      this.form.patchValue({
        name: this.project.name,
        description: this.project.description,
        color: this.project.color,
      });
    }
  }

  selectColor(color: string): void {
    this.form.patchValue({ color });
  }

  onSave(): void {
    if (this.form.valid) {
      this.result.next(this.form.getRawValue());
      this.bsModalRef.hide();
    }
  }

  onCancel(): void {
    this.bsModalRef.hide();
  }
}
