import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProjectStore } from '@store/project.store';
import { Task } from '@core/models';

@Component({
  selector: 'app-project-cell',
  standalone: true,
  template: `
    <div class="project-cell">
      @if (projectId()) {
        <span class="project-dot" [style.background]="color()"></span>
      }
      <span>{{ name() }}</span>
    </div>
  `,
  styles: [`
    .project-cell { display: flex; align-items: center; gap: 6px; }
    .project-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCellComponent implements ICellRendererAngularComp {
  private projectStore = inject(ProjectStore);

  projectId = signal<string | null>(null);

  private project = computed(() => {
    const id = this.projectId();
    return id ? this.projectStore.projects().find(p => p.id === id) ?? null : null;
  });

  name = computed(() => this.project()?.name ?? '—');
  color = computed(() => this.project()?.color ?? 'transparent');

  agInit(params: ICellRendererParams<Task>): void {
    this.projectId.set(params.data?.projectId ?? null);
  }

  refresh(params: ICellRendererParams<Task>): boolean {
    this.projectId.set(params.data?.projectId ?? null);
    return true;
  }
}
