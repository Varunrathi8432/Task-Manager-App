import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';
import { AuthStore } from '@store/auth.store';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { ThemeService } from '@core/services/theme.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { tasksToCSV, downloadFile } from '@shared/utils/export-utils';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatSlideToggleModule, MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  protected authStore = inject(AuthStore);
  protected themeService = inject(ThemeService);
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);
  private notification = inject(NotificationService);
  private storage = inject(StorageService);
  private modalService = inject(BsModalService);
  private fb = inject(NonNullableFormBuilder);

  profileForm = this.fb.group({
    name: [this.authStore.userName()],
    email: [this.authStore.userEmail()],
  });

  saveProfile(): void {
    const { name, email } = this.profileForm.getRawValue();
    this.authStore.updateProfile({ name, email });
    this.notification.success('Profile updated');
  }

  exportJSON(): void {
    const data = { tasks: this.taskStore.tasks(), projects: this.projectStore.projects() };
    downloadFile(JSON.stringify(data, null, 2), 'taskflow-export.json', 'application/json');
    this.notification.success('Data exported as JSON');
  }

  exportCSV(): void {
    const csv = tasksToCSV(this.taskStore.tasks());
    downloadFile(csv, 'taskflow-tasks.csv', 'text/csv');
    this.notification.success('Tasks exported as CSV');
  }

  resetData(): void {
    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      class: 'modal-sm',
      initialState: {
        title: 'Reset All Data',
        message: 'This will delete all tasks, projects, and settings. This action cannot be undone.',
        confirmText: 'Reset Everything',
        warn: true,
      } satisfies ConfirmDialogData,
    });
    modalRef.content?.result.pipe(take(1)).subscribe(confirmed => {
      if (confirmed) {
        this.storage.clear();
        window.location.reload();
      }
    });
  }
}
