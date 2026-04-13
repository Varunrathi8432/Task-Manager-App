import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { MockApiService } from './mock-api.service';
import { StorageService } from './storage.service';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ProjectApiService extends MockApiService {
  private storage = inject(StorageService);
  private readonly STORAGE_KEY = 'projects';

  private getProjects_(): Project[] {
    return this.storage.get<Project[]>(this.STORAGE_KEY) ?? [];
  }

  private saveProjects(projects: Project[]): void {
    this.storage.set(this.STORAGE_KEY, projects);
  }

  getProjects(): Observable<Project[]> {
    return this.simulateDelay(this.getProjects_());
  }

  getProjectById(id: string): Observable<Project> {
    const project = this.getProjects_().find(p => p.id === id);
    if (!project) return this.simulateError('Project not found');
    return this.simulateDelay(project);
  }

  createProject(payload: CreateProjectPayload): Observable<Project> {
    const projects = this.getProjects_();
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
    projects.push(project);
    this.saveProjects(projects);
    return this.simulateDelay(project);
  }

  updateProject(id: string, payload: UpdateProjectPayload): Observable<Project> {
    const projects = this.getProjects_();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return this.simulateError('Project not found');

    projects[index] = {
      ...projects[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.saveProjects(projects);
    return this.simulateDelay(projects[index]);
  }

  deleteProject(id: string): Observable<void> {
    const projects = this.getProjects_().filter(p => p.id !== id);
    this.saveProjects(projects);
    return this.simulateDelay(undefined as void);
  }
}
