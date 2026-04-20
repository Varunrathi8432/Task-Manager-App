import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TaskStore } from '@store/task.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Task } from '@core/models';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns';

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderComponent],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarViewComponent {
  private taskStore = inject(TaskStore);
  private router = inject(Router);

  currentDate = signal(new Date());
  monthLabel = computed(() => format(this.currentDate(), 'MMMM yyyy'));
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarDays = computed<CalendarDay[]>(() => {
    const current = this.currentDate();
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const tasksByDate = this.taskStore.tasksByDate();

    return eachDayOfInterval({ start: calStart, end: calEnd }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date,
        dateStr,
        isCurrentMonth: isSameMonth(date, current),
        isToday: isToday(date),
        tasks: tasksByDate.get(dateStr) ?? [],
      };
    });
  });

  previousMonth(): void {
    this.currentDate.update(d => subMonths(d, 1));
  }

  nextMonth(): void {
    this.currentDate.update(d => addMonths(d, 1));
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  onTaskClick(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: 'var(--tm-priority-low)',
      medium: 'var(--tm-priority-medium)',
      high: 'var(--tm-priority-high)',
      critical: 'var(--tm-priority-critical)',
    };
    return colors[priority] ?? 'var(--tm-text-muted)';
  }
}
