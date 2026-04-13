import { Injectable, inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { Task, TaskStatus, TaskPriority, Project } from '@core/models';

@Injectable({ providedIn: 'root' })
export class SeedDataService {
  private storage = inject(StorageService);

  seedIfEmpty(): void {
    const tasks = this.storage.get<Task[]>('tasks');
    if (!tasks || tasks.length === 0) {
      const projects = this.generateDemoProjects();
      this.storage.set('projects', projects);
      this.storage.set('tasks', this.generateDemoTasks(projects));
    }
  }

  private generateDemoProjects(): Project[] {
    const now = new Date().toISOString();
    return [
      { id: uuidv4(), name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design', color: '#3b82f6', createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'Mobile App', description: 'Native mobile application for iOS and Android platforms', color: '#8b5cf6', createdAt: now, updatedAt: now },
      { id: uuidv4(), name: 'API Integration', description: 'Third-party API integrations and backend services', color: '#10b981', createdAt: now, updatedAt: now },
    ];
  }

  private generateDemoTasks(projects: Project[]): Task[] {
    const statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

    const taskTemplates: { title: string; description: string; labels: string[] }[] = [
      { title: 'Design homepage mockup', description: 'Create wireframes and high-fidelity mockups for the new homepage layout', labels: ['design', 'ui'] },
      { title: 'Implement user authentication', description: 'Set up JWT-based authentication with login, register, and password reset flows', labels: ['backend', 'security'] },
      { title: 'Create REST API endpoints', description: 'Build RESTful API endpoints for task CRUD operations', labels: ['backend', 'api'] },
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', labels: ['devops'] },
      { title: 'Write unit tests for services', description: 'Add comprehensive unit tests for all service classes', labels: ['testing'] },
      { title: 'Optimize database queries', description: 'Review and optimize slow-performing database queries', labels: ['backend', 'performance'] },
      { title: 'Design mobile navigation', description: 'Create intuitive navigation patterns for the mobile app', labels: ['design', 'mobile'] },
      { title: 'Implement push notifications', description: 'Set up push notification service for real-time alerts', labels: ['mobile', 'backend'] },
      { title: 'Create onboarding flow', description: 'Design and implement user onboarding experience with tooltips and guides', labels: ['ui', 'ux'] },
      { title: 'Fix responsive layout issues', description: 'Address layout problems on tablet and small screen devices', labels: ['frontend', 'bug'] },
      { title: 'Add dark mode support', description: 'Implement theme switching with dark and light mode options', labels: ['frontend', 'ui'] },
      { title: 'Set up error monitoring', description: 'Integrate Sentry for production error tracking and alerting', labels: ['devops', 'monitoring'] },
      { title: 'Create data export feature', description: 'Allow users to export their data in CSV and JSON formats', labels: ['feature', 'backend'] },
      { title: 'Implement search functionality', description: 'Add full-text search across tasks, projects, and labels', labels: ['feature', 'frontend'] },
      { title: 'Review accessibility compliance', description: 'Audit and fix WCAG 2.1 accessibility issues across the application', labels: ['a11y', 'frontend'] },
      { title: 'Update API documentation', description: 'Update Swagger/OpenAPI documentation for all endpoints', labels: ['docs', 'api'] },
      { title: 'Add loading skeletons', description: 'Replace loading spinners with skeleton screens for better UX', labels: ['ui', 'ux'] },
      { title: 'Implement drag-and-drop', description: 'Add drag-and-drop reordering for task lists and kanban board', labels: ['feature', 'frontend'] },
      { title: 'Configure rate limiting', description: 'Set up API rate limiting to prevent abuse', labels: ['backend', 'security'] },
      { title: 'Create analytics dashboard', description: 'Build dashboard with charts showing task completion metrics and productivity trends', labels: ['feature', 'frontend'] },
      { title: 'Migrate to latest framework version', description: 'Upgrade to the latest Angular version with new features', labels: ['maintenance'] },
      { title: 'Add keyboard shortcuts', description: 'Implement keyboard shortcuts for common actions like create task and search', labels: ['ux', 'feature'] },
      { title: 'Set up staging environment', description: 'Configure staging environment with production-like settings for QA testing', labels: ['devops'] },
      { title: 'Create user profile page', description: 'Build user profile page with avatar upload, bio, and preferences', labels: ['feature', 'frontend'] },
      { title: 'Implement file attachments', description: 'Add ability to attach files and images to tasks with preview support', labels: ['feature', 'backend'] },
    ];

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
