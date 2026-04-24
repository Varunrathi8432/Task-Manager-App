import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';
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
  private modalService = inject(BsModalService);

  openProjectForm(project?: any): void {
    const modalRef = this.modalService.show(ProjectFormComponent, {
      class: 'modal-md',
      initialState: { project: project ?? null },
    });
    modalRef.content?.result.pipe(take(1)).subscribe(result => {
      if (project) {
        this.projectStore.updateProject({ id: project.id, changes: result });
      } else {
        this.projectStore.addProject(result);
      }
    });
  }

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  deleteProject(id: string, name: string): void {
    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      class: 'modal-sm',
      initialState: {
        title: 'Delete Project',
        message: `Delete "${name}"? Tasks will remain but be unassigned.`,
        confirmText: 'Delete',
        warn: true,
      } satisfies ConfirmDialogData,
    });
    modalRef.content?.result.pipe(take(1)).subscribe(confirmed => {
      if (confirmed) this.projectStore.deleteProject(id);
    });
  }
}
