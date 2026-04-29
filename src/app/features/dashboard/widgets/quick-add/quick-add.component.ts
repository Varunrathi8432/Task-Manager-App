import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TaskStore } from '@store/task.store';
import { TaskPriority } from '@core/models';

@Component({
  selector: 'app-quick-add',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './quick-add.component.html',
  styleUrl: './quick-add.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAddComponent {
  private taskStore = inject(TaskStore);
  title = signal('');
  priority = signal<TaskPriority>('medium');

  onAdd(): void {
    const titleVal = this.title().trim();
    if (titleVal) {
      this.taskStore.addTask({
        title: titleVal,
        description: '',
        priority: this.priority(),
        dueDate: null,
        labels: [],
        projectId: null,
      });
      this.title.set('');
      this.priority.set('medium');
    }
  }
}
