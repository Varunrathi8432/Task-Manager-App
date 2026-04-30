import {
  Injectable,
  inject,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { Observable, defer } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(EnvironmentInjector);

  private run<T>(fn: () => Promise<T>): Observable<T> {
    return defer(() => runInInjectionContext(this.injector, fn));
  }

  private projectsCol() {
    return collection(this.firestore, `users/${this.requireUid()}/projects`);
  }

  private projectDoc(id: string) {
    return doc(this.firestore, `users/${this.requireUid()}/projects/${id}`);
  }

  private requireUid(): string {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    return uid;
  }

  getProjects(): Observable<Project[]> {
    return this.run(async () => {
      const snap = await getDocs(this.projectsCol());
      return snap.docs.map((d) => ({ ...(d.data() as Project), id: d.id }));
    });
  }

  getProjectById(id: string): Observable<Project> {
    return this.run(async () => {
      const snap = await getDoc(this.projectDoc(id));
      if (!snap.exists()) throw new Error('Project not found');
      return { ...(snap.data() as Project), id: snap.id };
    });
  }

  createProject(payload: CreateProjectPayload): Observable<Project> {
    return this.run(async () => {
      const id = uuidv4();
      const now = new Date().toISOString();
      const project: Project = {
        id,
        ...payload,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(this.projectDoc(id), project);
      return project;
    });
  }

  updateProject(
    id: string,
    payload: UpdateProjectPayload,
  ): Observable<Project> {
    return this.run(async () => {
      const snap = await getDoc(this.projectDoc(id));
      if (!snap.exists()) throw new Error('Project not found');
      const existing = snap.data() as Project;
      const updated: Project = {
        ...existing,
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(this.projectDoc(id), updated);
      return updated;
    });
  }

  deleteProject(id: string): Observable<void> {
    return this.run(() => deleteDoc(this.projectDoc(id)));
  }
}
