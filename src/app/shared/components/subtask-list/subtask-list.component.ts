import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Subtask } from '@core/models';

@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [MatCheckboxModule, MatProgressBarModule, MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './subtask-list.component.html',
  styleUrl: './subtask-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubtaskListComponent {
  subtasks = input.required<Subtask[]>();
  taskId = input.required<string>();
  toggle = output<{ taskId: string; subtaskId: string }>();
  add = output<{ taskId: string; title: string }>();
  remove = output<{ taskId: string; subtaskId: string }>();
  newSubtaskTitle = signal('');

  progress = computed(() => {
    const subs = this.subtasks();
    if (subs.length === 0) return 0;
    return Math.round((subs.filter(s => s.completed).length / subs.length) * 100);
  });

  onToggle(subtaskId: string): void {
    this.toggle.emit({ taskId: this.taskId(), subtaskId });
  }

  onAdd(): void {
    const title = this.newSubtaskTitle().trim();
    if (title) {
      this.add.emit({ taskId: this.taskId(), title });
      this.newSubtaskTitle.set('');
    }
  }

  onRemove(subtaskId: string): void {
    this.remove.emit({ taskId: this.taskId(), subtaskId });
  }
}
