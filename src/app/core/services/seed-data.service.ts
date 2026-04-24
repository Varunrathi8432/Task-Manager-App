import { Injectable, inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { Task, TaskStatus, TaskPriority, Project } from '@core/models';
import { getDemoProjects, getDemoTaskTemplates } from '@core/data';

@Injectable({ providedIn: 'root' })
export class SeedDataService {
  private storage = inject(StorageService);

  seedIfEmpty(): void {
    const tasks = this.storage.get<Task[]>('tasks');
    if (!tasks || tasks.length === 0) {
      const projects = getDemoProjects();
      this.storage.set('projects', projects);
      this.storage.set('tasks', this.generateDemoTasks(projects));
    }
  }

  private generateDemoTasks(projects: Project[]): Task[] {
    const statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

    const taskTemplates = getDemoTaskTemplates();

    const now = new Date();
    const tasks: Task[] = [];
    const orderCounters: Record<string, number> = { 'todo': 0, 'in-progress': 0, 'review': 0, 'done': 0 };

    taskTemplates.forEach((template, i) => {
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      const projectId = projects[i % projects.length].id;

      const createdDaysAgo = Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date(now.getTime() - createdDaysAgo * 86400000);
      const dueDaysFromNow = Math.floor(Math.random() * 21) - 7;
      const dueDate = new Date(now.getTime() + dueDaysFromNow * 86400000);

      const subtasks = i % 3 === 0 ? [
        { id: uuidv4(), title: 'Research and planning', completed: true },
        { id: uuidv4(), title: 'Implementation', completed: status === 'done' || status === 'review' },
        { id: uuidv4(), title: 'Code review', completed: status === 'done' },
      ] : [];

      const task: Task = {
        id: uuidv4(),
        title: template.title,
        description: template.description,
        status,
        priority,
        dueDate: dueDate.toISOString(),
        labels: template.labels,
        subtasks,
        attachments: [],
        activityLog: [
          {
            id: uuidv4(),
            taskId: '',
            action: 'created',
            details: 'Task created',
            timestamp: createdAt.toISOString(),
            userId: 'current-user',
          },
        ],
        projectId,
        assigneeId: null,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        completedAt: status === 'done' ? new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString() : null,
        order: orderCounters[status]++,
      };
      task.activityLog[0].taskId = task.id;
      tasks.push(task);
    });

    return tasks;
  }
}
