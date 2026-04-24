import { computed, effect, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ProjectApiService } from '@core/services/project-api.service';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { TaskStore } from './task.store';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@core/models';

export interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProjectId: null,
  loading: false,
  error: null,
};

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => {
    const taskStore = inject(TaskStore);

    return {
      projectsWithStats: computed(() =>
        store.projects().map(p => {
          const projectTasks = taskStore.tasks().filter(t => t.projectId === p.id);
          const completedCount = projectTasks.filter(t => t.status === 'done').length;
          return {
            ...p,
            taskCount: projectTasks.length,
            completedCount,
            progress: projectTasks.length > 0
              ? Math.round((completedCount / projectTasks.length) * 100) : 0,
          };
        })
      ),
      selectedProject: computed(() =>
        store.projects().find(p => p.id === store.selectedProjectId()) ?? null
      ),
    };
  }),

  withMethods((store) => {
    const projectApi = inject(ProjectApiService);
    const notify = inject(NotificationService);

    return {
      loadProjects: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() => projectApi.getProjects()),
          tap(projects => patchState(store, { projects, loading: false, error: null })),
          catchError(err => {
            patchState(store, { loading: false, error: err.message });
            return EMPTY;
          }),
        )
      ),
      addProject: rxMethod<CreateProjectPayload>(
        pipe(
          switchMap(payload => projectApi.createProject(payload)),
          tap(project => {
            patchState(store, { projects: [...store.projects(), project] });
            notify.success('Project created');
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      updateProject: rxMethod<{ id: string; changes: UpdateProjectPayload }>(
        pipe(
          switchMap(({ id, changes }) => projectApi.updateProject(id, changes)),
          tap(updated => {
            patchState(store, {
              projects: store.projects().map(p => p.id === updated.id ? updated : p),
            });
            notify.success('Project updated');
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      deleteProject: rxMethod<string>(
        pipe(
          switchMap(id => {
            patchState(store, { projects: store.projects().filter(p => p.id !== id) });
            return projectApi.deleteProject(id);
          }),
          tap(() => notify.success('Project deleted')),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      selectProject(id: string | null): void {
        patchState(store, { selectedProjectId: id });
      },
    };
  }),

  withHooks({
    onInit(store) {
      const authService = inject(AuthService);
      effect(() => {
        if (authService.isAuthenticated()) {
          store.loadProjects();
        } else {
          patchState(store, { projects: [] });
        }
      });
    },
  }),
);
