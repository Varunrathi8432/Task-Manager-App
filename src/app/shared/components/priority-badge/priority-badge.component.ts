import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TaskPriority } from '@core/models';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  priority = input.required<TaskPriority>();

  label = computed(() => {
    switch (this.priority()) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'critical': return 'Critical';
    }
  });
}
