import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TaskStatus } from '@core/models';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  status = input.required<TaskStatus>();

  label = computed(() => {
    switch (this.status()) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'review': return 'Review';
      case 'done': return 'Done';
    }
  });

  icon = computed(() => {
    switch (this.status()) {
      case 'todo': return 'radio_button_unchecked';
      case 'in-progress': return 'pending';
      case 'review': return 'rate_review';
      case 'done': return 'check_circle';
    }
  });
}
