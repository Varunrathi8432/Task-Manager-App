import { Component, ChangeDetectionStrategy, inject, input, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProjectStore } from '@store/project.store';
import { TaskStore } from '@store/task.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusChipComponent } from '@shared/components/status-chip/status-chip.component';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, PageHeaderComponent, StatusChipComponent, PriorityBadgeComponent, RelativeDatePipe],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  id = input.required<string>();
  private projectStore = inject(ProjectStore);
  private taskStore = inject(TaskStore);
  private router = inject(Router);

  project = computed(() => this.projectStore.projects().find(p => p.id === this.id()) ?? null);

  projectTasks = computed(() =>
    this.taskStore.tasks().filter(t => t.projectId === this.id())
  );

  completedCount = computed(() => this.projectTasks().filter(t => t.status === 'done').length);

  progress = computed(() => {
    const total = this.projectTasks().length;
    return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  navigateToTask(id: string): void {
    this.router.navigate(['/tasks', id]);
  }
}
