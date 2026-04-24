import { v4 as uuidv4 } from 'uuid';
import { Project, CreateProjectPayload } from '@core/models';

export type DemoProjectTemplate = CreateProjectPayload;

const DEMO_PROJECT_TEMPLATES: DemoProjectTemplate[] = [
  {
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design',
    color: '#3b82f6',
  },
  {
    name: 'Mobile App',
    description: 'Native mobile application for iOS and Android platforms',
    color: '#8b5cf6',
  },
  {
    name: 'API Integration',
    description: 'Third-party API integrations and backend services',
    color: '#10b981',
  },
];

function clone(template: DemoProjectTemplate): DemoProjectTemplate {
  return { ...template };
}

export function getDemoProjectTemplates(): DemoProjectTemplate[] {
  return DEMO_PROJECT_TEMPLATES.map(clone);
}

export function getDemoProjects(): Project[] {
  const now = new Date().toISOString();
  return DEMO_PROJECT_TEMPLATES.map(template => ({
    id: uuidv4(),
    ...template,
    createdAt: now,
    updatedAt: now,
  }));
}

export function getDemoProjectTemplateByName(name: string): DemoProjectTemplate | undefined {
  const template = DEMO_PROJECT_TEMPLATES.find(p => p.name === name);
  return template ? clone(template) : undefined;
}

export function setDemoProjectTemplate(template: DemoProjectTemplate): void {
  const index = DEMO_PROJECT_TEMPLATES.findIndex(p => p.name === template.name);
  if (index >= 0) {
    DEMO_PROJECT_TEMPLATES[index] = clone(template);
  } else {
    DEMO_PROJECT_TEMPLATES.push(clone(template));
  }
}
