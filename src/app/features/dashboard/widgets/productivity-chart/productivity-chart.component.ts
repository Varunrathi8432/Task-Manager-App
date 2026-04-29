import { Component, ChangeDetectionStrategy, inject, computed, viewChild, effect } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { TaskStore } from '@store/task.store';
import { ThemeService } from '@core/services/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-productivity-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './productivity-chart.component.html',
  styleUrl: './productivity-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductivityChartComponent {
  private taskStore = inject(TaskStore);
  private themeService = inject(ThemeService);

  chart = viewChild(BaseChartDirective);

  chartData = computed<ChartData<'bar'>>(() => ({
    labels: this.taskStore.completionsByDate().map(d => d.date),
    datasets: [{
      data: this.taskStore.completionsByDate().map(d => d.count),
      label: 'Tasks Completed',
      backgroundColor: this.themeService.isDark() ? 'rgba(96, 165, 250, 0.7)' : 'rgba(59, 130, 246, 0.7)',
      borderColor: this.themeService.isDark() ? '#60a5fa' : '#3b82f6',
      borderWidth: 1,
      borderRadius: 4,
    }],
  }));

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  constructor() {
    effect(() => {
      this.themeService.isDark();
      this.chart()?.update();
    });
  }
}
