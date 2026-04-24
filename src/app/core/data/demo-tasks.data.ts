export interface DemoTaskTemplate {
  title: string;
  description: string;
  labels: string[];
}

const DEMO_TASK_TEMPLATES: DemoTaskTemplate[] = [
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

function clone(template: DemoTaskTemplate): DemoTaskTemplate {
  return { ...template, labels: [...template.labels] };
}

export function getDemoTaskTemplates(): DemoTaskTemplate[] {
  return DEMO_TASK_TEMPLATES.map(clone);
}

export function getDemoTaskTemplateByTitle(title: string): DemoTaskTemplate | undefined {
  const template = DEMO_TASK_TEMPLATES.find(t => t.title === title);
  return template ? clone(template) : undefined;
}

export function setDemoTaskTemplate(template: DemoTaskTemplate): void {
  const index = DEMO_TASK_TEMPLATES.findIndex(t => t.title === template.title);
  if (index >= 0) {
    DEMO_TASK_TEMPLATES[index] = clone(template);
  } else {
    DEMO_TASK_TEMPLATES.push(clone(template));
  }
}
