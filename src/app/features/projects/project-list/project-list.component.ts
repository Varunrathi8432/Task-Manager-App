import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { ProjectStore } from '@store/project.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListComponent {
  protected projectStore = inject(ProjectStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  openProjectForm(project?: any): void {
    const dialogRef = this.dialog.open(ProjectFormComponent, { width: '500px', data: { project } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (project) {
          this.projectStore.updateProject({ id: project.id, changes: result });
        } else {
          this.projectStore.addProject(result);
        }
      }
    });
  }

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  deleteProject(id: string, name: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: `Delete "${name}"? Tasks will remain but be unassigned.`,
        confirmText: 'Delete',
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.projectStore.deleteProject(id);
    });
  }
}
