export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProjectPayload = Pick<Project, 'name' | 'description' | 'color'>;
export type UpdateProjectPayload = Partial<Omit<Project, 'id' | 'createdAt'>>;
