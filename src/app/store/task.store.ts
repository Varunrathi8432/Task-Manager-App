import { computed, effect, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { TaskApiService } from '@core/services/task-api.service';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Task, TaskStatus, TaskPriority, CreateTaskPayload, UpdateTaskPayload } from '@core/models';
import { isAfter, isBefore, parseISO, startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface TaskFilter {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  projectId: string | null;
  labels: string[];
  dueDateRange: { start: string | null; end: string | null };
}

export interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
  filter: TaskFilter;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialFilter: TaskFilter = {
  status: 'all',
  priority: 'all',
  projectId: null,
  labels: [],
  dueDateRange: { start: null, end: null },
};

const initialState: TaskState = {
  tasks: [],
  selectedTaskId: null,
  filter: initialFilter,
  searchQuery: '',
  loading: false,
  error: null,
};

export const TaskStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => {
    const filteredTasks = computed(() => {
      let tasks = store.tasks();
      const filter = store.filter();
      const query = store.searchQuery().toLowerCase().trim();

      if (filter.status !== 'all') {
        tasks = tasks.filter(t => t.status === filter.status);
      }
      if (filter.priority !== 'all') {
        tasks = tasks.filter(t => t.priority === filter.priority);
      }
      if (filter.projectId) {
        tasks = tasks.filter(t => t.projectId === filter.projectId);
      }
      if (filter.labels.length > 0) {
        tasks = tasks.filter(t => filter.labels.some(l => t.labels.includes(l)));
      }
      if (filter.dueDateRange.start) {
        tasks = tasks.filter(t => t.dueDate && !isBefore(parseISO(t.dueDate), startOfDay(parseISO(filter.dueDateRange.start!))));
      }
      if (filter.dueDateRange.end) {
        tasks = tasks.filter(t => t.dueDate && !isAfter(parseISO(t.dueDate), endOfDay(parseISO(filter.dueDateRange.end!))));
      }
      if (query) {
        tasks = tasks.filter(t =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.labels.some(l => l.toLowerCase().includes(query))
        );
      }

      return tasks.sort((a, b) => a.order - b.order);
    });

    return {
      filteredTasks,
      tasksByStatus: computed(() => {
        const grouped: Record<TaskStatus, Task[]> = {
          'todo': [], 'in-progress': [], 'review': [], 'done': [],
        };
        for (const task of store.tasks()) {
          grouped[task.status].push(task);
        }
        for (const status of Object.keys(grouped) as TaskStatus[]) {
          grouped[status].sort((a, b) => a.order - b.order);
        }
        return grouped;
      }),
      tasksByDate: computed(() => {
        const map = new Map<string, Task[]>();
        for (const task of store.tasks()) {
          if (task.dueDate) {
            const key = format(parseISO(task.dueDate), 'yyyy-MM-dd');
            const arr = map.get(key) ?? [];
            arr.push(task);
            map.set(key, arr);
          }
        }
        return map;
      }),
      tasksByProject: computed(() => {
        const map = new Map<string, Task[]>();
        for (const task of store.tasks()) {
          const key = task.projectId ?? 'unassigned';
          const arr = map.get(key) ?? [];
          arr.push(task);
          map.set(key, arr);
        }
        return map;
      }),
      totalCount: computed(() => store.tasks().length),
      completedCount: computed(() => store.tasks().filter(t => t.status === 'done').length),
      inProgressCount: computed(() => store.tasks().filter(t => t.status === 'in-progress').length),
      overdueCount: computed(() => {
        const now = new Date();
        return store.tasks().filter(t =>
          t.status !== 'done' && t.dueDate && isBefore(parseISO(t.dueDate), now)
        ).length;
      }),
      selectedTask: computed(() => store.tasks().find(t => t.id === store.selectedTaskId()) ?? null),
      completionRate: computed(() => {
        const total = store.tasks().length;
        if (total === 0) return 0;
        return Math.round((store.tasks().filter(t => t.status === 'done').length / total) * 100);
      }),
      completionsByDate: computed(() => {
        const now = new Date();
        const results: { date: string; count: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const date = subDays(now, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const count = store.tasks().filter(t =>
            t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dateStr
          ).length;
          results.push({ date: format(date, 'MMM dd'), count });
        }
        return results;
      }),
      allLabels: computed(() => {
        const labelSet = new Set<string>();
        store.tasks().forEach(t => t.labels.forEach(l => labelSet.add(l)));
        return Array.from(labelSet).sort();
      }),
    };
  }),

  withMethods((store) => {
    const taskApi = inject(TaskApiService);
    const notify = inject(NotificationService);

    return {
      loadTasks: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() => taskApi.getTasks()),
          tap(tasks => patchState(store, { tasks, loading: false, error: null })),
          catchError(err => {
            patchState(store, { loading: false, error: err.message });
            return EMPTY;
          }),
        )
      ),
      addTask: rxMethod<CreateTaskPayload>(
        pipe(
          switchMap(payload => taskApi.createTask(payload)),
          tap(task => {
            patchState(store, { tasks: [...store.tasks(), task] });
            notify.success('Task created successfully');
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      updateTask: rxMethod<{ id: string; changes: UpdateTaskPayload }>(
        pipe(
          switchMap(({ id, changes }) => taskApi.updateTask(id, changes)),
          tap(updated => {
            patchState(store, {
              tasks: store.tasks().map(t => t.id === updated.id ? updated : t),
            });
            notify.success('Task updated');
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      deleteTask: rxMethod<string>(
        pipe(
          switchMap(id => {
            const tasks = store.tasks().filter(t => t.id !== id);
            patchState(store, { tasks });
            return taskApi.deleteTask(id);
          }),
          tap(() => notify.success('Task deleted')),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      deleteTasks: rxMethod<string[]>(
        pipe(
          switchMap(ids => {
            const idSet = new Set(ids);
            patchState(store, { tasks: store.tasks().filter(t => !idSet.has(t.id)) });
            return taskApi.deleteTasks(ids);
          }),
          tap(() => notify.success('Tasks deleted')),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      moveTask: rxMethod<{ id: string; status: TaskStatus; order: number }>(
        pipe(
          switchMap(({ id, status, order }) => {
            patchState(store, {
              tasks: store.tasks().map(t =>
                t.id === id ? { ...t, status, order, updatedAt: new Date().toISOString(), completedAt: status === 'done' ? new Date().toISOString() : null } : t
              ),
            });
            return taskApi.reorderTasks([{ id, order, status }]);
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      toggleSubtask: rxMethod<{ taskId: string; subtaskId: string }>(
        pipe(
          switchMap(({ taskId, subtaskId }) => taskApi.toggleSubtask(taskId, subtaskId)),
          tap(updated => {
            patchState(store, {
              tasks: store.tasks().map(t => t.id === updated.id ? updated : t),
            });
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      addSubtask: rxMethod<{ taskId: string; title: string }>(
        pipe(
          switchMap(({ taskId, title }) => taskApi.addSubtask(taskId, title)),
          tap(updated => {
            patchState(store, {
              tasks: store.tasks().map(t => t.id === updated.id ? updated : t),
            });
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      removeSubtask: rxMethod<{ taskId: string; subtaskId: string }>(
        pipe(
          switchMap(({ taskId, subtaskId }) => taskApi.removeSubtask(taskId, subtaskId)),
          tap(updated => {
            patchState(store, {
              tasks: store.tasks().map(t => t.id === updated.id ? updated : t),
            });
          }),
          catchError(err => {
            notify.error(err.message);
            return EMPTY;
          }),
        )
      ),
      selectTask(id: string | null): void {
        patchState(store, { selectedTaskId: id });
      },
      setFilter(filter: Partial<TaskFilter>): void {
        patchState(store, { filter: { ...store.filter(), ...filter } });
      },
      resetFilter(): void {
        patchState(store, { filter: initialFilter });
      },
      setSearchQuery(query: string): void {
        patchState(store, { searchQuery: query });
      },
    };
  }),

  withHooks({
    onInit(store) {
      const authService = inject(AuthService);
      effect(() => {
        if (authService.isAuthenticated()) {
          store.loadTasks();
        } else {
          patchState(store, { tasks: [] });
        }
      });
    },
  }),
);
