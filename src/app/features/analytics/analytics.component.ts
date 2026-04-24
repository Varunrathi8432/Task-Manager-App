import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ThemeService } from '@core/services/theme.service';
import { subDays, format, parseISO } from 'date-fns';

Chart.register(...registerables);

type ThemePalette = {
  text: string;
  textMuted: string;
  grid: string;
  status: [string, string, string, string];
  priority: [string, string, string, string];
  trendLine: string;
  trendFill: string;
};

const LIGHT_PALETTE: ThemePalette = {
  text: '#0f172a',
  textMuted: '#64748b',
  grid: 'rgba(15, 23, 42, 0.08)',
  status: ['#94a3b8', '#3b82f6', '#a855f7', '#22c55e'],
  priority: ['#22c55e', '#f59e0b', '#ef4444', '#dc2626'],
  trendLine: '#3b82f6',
  trendFill: 'rgba(59, 130, 246, 0.12)',
};

const DARK_PALETTE: ThemePalette = {
  text: '#e6edf7',
  textMuted: '#94a3b8',
  grid: 'rgba(230, 237, 247, 0.08)',
  status: ['#cbd5e1', '#93c5fd', '#d8b4fe', '#86efac'],
  priority: ['#86efac', '#fcd34d', '#fca5a5', '#f87171'],
  trendLine: '#60a5fa',
  trendFill: 'rgba(96, 165, 250, 0.15)',
};

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

  private palette = computed<ThemePalette>(() =>
    this.themeService.isDark() ? DARK_PALETTE : LIGHT_PALETTE,
  );

  // Tasks by status - doughnut chart
  statusChartData = computed<ChartData<'doughnut'>>(() => {
    const byStatus = this.taskStore.tasksByStatus();
    const p = this.palette();
    return {
      labels: ['To Do', 'In Progress', 'Review', 'Done'],
      datasets: [{
        data: [
          byStatus['todo'].length,
          byStatus['in-progress'].length,
          byStatus['review'].length,
          byStatus['done'].length,
        ],
        backgroundColor: p.status,
        borderColor: this.themeService.isDark() ? '#172033' : '#ffffff',
        borderWidth: 2,
      }],
    };
  });

  // Tasks by priority - bar chart
  priorityChartData = computed<ChartData<'bar'>>(() => {
    const tasks = this.taskStore.tasks();
    const p = this.palette();
    return {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [{
        data: [
          tasks.filter(t => t.priority === 'low').length,
          tasks.filter(t => t.priority === 'medium').length,
          tasks.filter(t => t.priority === 'high').length,
          tasks.filter(t => t.priority === 'critical').length,
        ],
        backgroundColor: p.priority,
        borderRadius: 4,
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
    const p = this.palette();
    return {
      labels,
      datasets: [{
        data,
        label: 'Completed',
        borderColor: p.trendLine,
        backgroundColor: p.trendFill,
        pointBackgroundColor: p.trendLine,
        pointBorderColor: p.trendLine,
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
        borderRadius: 4,
      }],
    };
  });

  doughnutOptions = computed<ChartOptions<'doughnut'>>(() => {
    const p = this.palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: p.text, boxWidth: 12, boxHeight: 12, padding: 12 },
        },
        tooltip: {
          backgroundColor: this.themeService.isDark() ? '#172033' : '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: p.grid,
          borderWidth: 1,
        },
      },
    };
  });

  barOptions = computed<ChartOptions<'bar'>>(() => {
    const p = this.palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: this.themeService.isDark() ? '#172033' : '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: p.grid,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: p.textMuted },
          grid: { color: p.grid },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: p.textMuted },
          grid: { color: p.grid },
        },
      },
    };
  });

  lineOptions = computed<ChartOptions<'line'>>(() => {
    const p = this.palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: this.themeService.isDark() ? '#172033' : '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: p.grid,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: p.textMuted },
          grid: { color: p.grid },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: p.textMuted },
          grid: { color: p.grid },
        },
      },
    };
  });
}
