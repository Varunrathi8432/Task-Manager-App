import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { MockApiService } from './mock-api.service';
import { StorageService } from './storage.service';
import {
  Task, CreateTaskPayload, UpdateTaskPayload,
  TaskStatus, ActivityLogEntry, Subtask
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class TaskApiService extends MockApiService {
  private storage = inject(StorageService);
  private readonly STORAGE_KEY = 'tasks';

  private getTasks_(): Task[] {
    return this.storage.get<Task[]>(this.STORAGE_KEY) ?? [];
  }

  private saveTasks(tasks: Task[]): void {
    this.storage.set(this.STORAGE_KEY, tasks);
  }

  getTasks(): Observable<Task[]> {
    return this.simulateDelay(this.getTasks_());
  }

  getTaskById(id: string): Observable<Task> {
    const task = this.getTasks_().find(t => t.id === id);
    if (!task) return this.simulateError('Task not found');
    return this.simulateDelay(task);
  }

  createTask(payload: CreateTaskPayload): Observable<Task> {
    const tasks = this.getTasks_();
    const now = new Date().toISOString();
    const status = payload.status ?? 'todo';
    const maxOrder = tasks.filter(t => t.status === status)
      .reduce((max, t) => Math.max(max, t.order), -1);

    const task: Task = {
      id: uuidv4(),
      title: payload.title,
      description: payload.description,
      status,
      priority: payload.priority,
      dueDate: payload.dueDate,
      labels: payload.labels ?? [],
      subtasks: (payload.subtasks ?? []).map(s => ({
        id: uuidv4(),
        title: s.title,
        completed: false,
      })),
      attachments: [],
      activityLog: [{
        id: uuidv4(),
        taskId: '',
        action: 'created',
        details: 'Task created',
        timestamp: now,
        userId: 'current-user',
      }],
      projectId: payload.projectId,
      assigneeId: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      order: maxOrder + 1,
    };
    task.activityLog[0].taskId = task.id;

    tasks.push(task);
    this.saveTasks(tasks);
    return this.simulateDelay(task);
  }

  updateTask(id: string, payload: UpdateTaskPayload): Observable<Task> {
    const tasks = this.getTasks_();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return this.simulateError('Task not found');

    const now = new Date().toISOString();
    const existing = tasks[index];
    const changes: string[] = [];

    if (payload.status && payload.status !== existing.status) {
      changes.push(`Status changed from "${existing.status}" to "${payload.status}"`);
    }
    if (payload.priority && payload.priority !== existing.priority) {
      changes.push(`Priority changed from "${existing.priority}" to "${payload.priority}"`);
    }

    const updated: Task = {
      ...existing,
      ...payload,
      updatedAt: now,
      completedAt: payload.status === 'done' && !existing.completedAt
        ? now
        : payload.status !== 'done' ? null : existing.completedAt,
      activityLog: [
        ...existing.activityLog,
        ...changes.map(detail => ({
          id: uuidv4(),
          taskId: id,
          action: 'updated',
          details: detail,
          timestamp: now,
          userId: 'current-user',
        })),
      ],
    };

    tasks[index] = updated;
    this.saveTasks(tasks);
    return this.simulateDelay(updated);
  }

  deleteTask(id: string): Observable<void> {
    const tasks = this.getTasks_().filter(t => t.id !== id);
    this.saveTasks(tasks);
    return this.simulateDelay(undefined as void);
  }

  deleteTasks(ids: string[]): Observable<void> {
    const idSet = new Set(ids);
    const tasks = this.getTasks_().filter(t => !idSet.has(t.id));
    this.saveTasks(tasks);
    return this.simulateDelay(undefined as void);
  }

  reorderTasks(updates: { id: string; order: number; status?: TaskStatus }[]): Observable<Task[]> {
    const tasks = this.getTasks_();
    const now = new Date().toISOString();

    for (const update of updates) {
      const task = tasks.find(t => t.id === update.id);
      if (task) {
        if (update.status && update.status !== task.status) {
          task.activityLog.push({
            id: uuidv4(),
            taskId: task.id,
            action: 'moved',
            details: `Moved from "${task.status}" to "${update.status}"`,
            timestamp: now,
            userId: 'current-user',
          });
          task.status = update.status;
          task.completedAt = update.status === 'done' ? now : null;
        }
        task.order = update.order;
        task.updatedAt = now;
      }
    }

    this.saveTasks(tasks);
    return this.simulateDelay(tasks);
  }

  addSubtask(taskId: string, title: string): Observable<Task> {
    const tasks = this.getTasks_();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return this.simulateError('Task not found');

    const subtask: Subtask = { id: uuidv4(), title, completed: false };
    task.subtasks.push(subtask);
    task.updatedAt = new Date().toISOString();
    this.saveTasks(tasks);
    return this.simulateDelay(task);
  }

  toggleSubtask(taskId: string, subtaskId: string): Observable<Task> {
    const tasks = this.getTasks_();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return this.simulateError('Task not found');

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      task.updatedAt = new Date().toISOString();
    }
    this.saveTasks(tasks);
    return this.simulateDelay(task);
  }

  removeSubtask(taskId: string, subtaskId: string): Observable<Task> {
    const tasks = this.getTasks_();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return this.simulateError('Task not found');

    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    task.updatedAt = new Date().toISOString();
    this.saveTasks(tasks);
    return this.simulateDelay(task);
  }
}
