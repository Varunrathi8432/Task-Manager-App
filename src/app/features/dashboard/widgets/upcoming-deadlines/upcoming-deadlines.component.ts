import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TaskStore } from '@store/task.store';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { Task } from '@core/models';
import { parseISO, addDays, isBefore, isAfter } from 'date-fns';

@Component({
  selector: 'app-upcoming-deadlines',
  standalone: true,
  imports: [MatIconModule, PriorityBadgeComponent, RelativeDatePipe],
  templateUrl: './upcoming-deadlines.component.html',
  styleUrl: './upcoming-deadlines.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingDeadlinesComponent {
  private taskStore = inject(TaskStore);
  private router = inject(Router);

  upcomingTasks = computed(() => {
    const now = new Date();
    const weekFromNow = addDays(now, 7);
    return this.taskStore.tasks()
      .filter(t => t.status !== 'done' && t.dueDate &&
        isBefore(parseISO(t.dueDate), weekFromNow) && isAfter(parseISO(t.dueDate), addDays(now, -1)))
      .sort((a, b) => parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime())
      .slice(0, 5);
  });

  isOverdue(task: Task): boolean {
    return !!task.dueDate && isBefore(parseISO(task.dueDate), new Date());
  }

  onTaskClick(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }
}
