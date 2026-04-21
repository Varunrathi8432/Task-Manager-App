import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ThemeService } from '@core/services/theme.service';
import { subDays, format, parseISO } from 'date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [BaseChartDirective, MatIconModule, PageHeaderComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);
  protected themeService = inject(ThemeService);

  completionRate = this.taskStore.completionRate;
  totalTasks = this.taskStore.totalCount;
  completedTasks = this.taskStore.completedCount;
  overdueTasks = this.taskStore.overdueCount;

  // Tasks by status - doughnut chart
  statusChartData = computed<ChartData<'doughnut'>>(() => {
    const byStatus = this.taskStore.tasksByStatus();
    return {
      labels: ['To Do', 'In Progress', 'Review', 'Done'],
      datasets: [{
        data: [
          byStatus['todo'].length,
          byStatus['in-progress'].length,
          byStatus['review'].length,
          byStatus['done'].length,
        ],
        backgroundColor: ['#94a3b8', '#3b82f6', '#a855f7', '#22c55e'],
      }],
    };
  });

  // Tasks by priority - bar chart
  priorityChartData = computed<ChartData<'bar'>>(() => {
    const tasks = this.taskStore.tasks();
    return {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [{
        data: [
          tasks.filter(t => t.priority === 'low').length,
          tasks.filter(t => t.priority === 'medium').length,
          tasks.filter(t => t.priority === 'high').length,
          tasks.filter(t => t.priority === 'critical').length,
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#dc2626'],
      }],
    };
  });

  // Completion trend - line chart
  trendChartData = computed<ChartData<'line'>>(() => {
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      labels.push(format(date, 'MMM dd'));
      data.push(this.taskStore.tasks().filter(t =>
        t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dateStr
      ).length);
    }
    return {
      labels,
      datasets: [{
        data,
        label: 'Completed',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
      }],
    };
  });

  // Tasks by project
  projectChartData = computed<ChartData<'bar'>>(() => {
    const projects = this.projectStore.projectsWithStats();
    return {
      labels: projects.map(p => p.name),
      datasets: [{
        data: projects.map(p => p.taskCount),
        label: 'Total Tasks',
        backgroundColor: projects.map(p => p.color),
      }],
    };
  });

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
  };

  barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };
}
