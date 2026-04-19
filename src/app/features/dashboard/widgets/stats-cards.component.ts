import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TaskStore } from '@store/task.store';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsCardsComponent {
  private taskStore = inject(TaskStore);

  stats = computed(() => [
    { label: 'Total Tasks', value: this.taskStore.totalCount(), icon: 'assignment', color: '#3b82f6' },
    { label: 'Completed', value: this.taskStore.completedCount(), icon: 'check_circle', color: '#22c55e' },
    { label: 'In Progress', value: this.taskStore.inProgressCount(), icon: 'pending', color: '#f59e0b' },
    { label: 'Overdue', value: this.taskStore.overdueCount(), icon: 'warning', color: '#ef4444' },
  ]);
}
