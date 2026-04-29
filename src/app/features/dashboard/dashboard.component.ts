import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StatsCardsComponent } from './widgets/stats-cards/stats-cards.component';
import { ProductivityChartComponent } from './widgets/productivity-chart/productivity-chart.component';
import { UpcomingDeadlinesComponent } from './widgets/upcoming-deadlines/upcoming-deadlines.component';
import { QuickAddComponent } from './widgets/quick-add/quick-add.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatsCardsComponent,
    ProductivityChartComponent,
    UpcomingDeadlinesComponent,
    QuickAddComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
