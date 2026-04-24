import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, defer } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Firestore, collection, doc, getDoc, getDocs, query, where, orderBy,
  addDoc, updateDoc, deleteDoc, writeBatch, setDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import {
  Task, CreateTaskPayload, UpdateTaskPayload,
  TaskStatus, Subtask,
} from '@core/models';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private tasksCol() {
    const uid = this.requireUid();
    return collection(this.firestore, `users/${uid}/tasks`);
  }

  private taskDoc(id: string) {
    const uid = this.requireUid();
    return doc(this.firestore, `users/${uid}/tasks/${id}`);
  }

  private requireUid(): string {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    return uid;
  }

  getTasks(): Observable<Task[]> {
    return defer(async () => {
      const snap = await getDocs(query(this.tasksCol(), orderBy('order')));
      return snap.docs.map(d => ({ ...(d.data() as Task), id: d.id }));
    });
  }

  getTaskById(id: string): Observable<Task> {
    return defer(async () => {
      const snap = await getDoc(this.taskDoc(id));
      if (!snap.exists()) throw new Error('Task not found');
      return { ...(snap.data() as Task), id: snap.id };
    });
  }

  createTask(payload: CreateTaskPayload): Observable<Task> {
    return defer(async () => {
      const all = await getDocs(query(this.tasksCol(), where('status', '==', payload.status ?? 'todo')));
      const maxOrder = all.docs.reduce((max, d) => Math.max(max, (d.data() as Task).order ?? -1), -1);
      const now = new Date().toISOString();
      const id = uuidv4();
      const task: Task = {
        id,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? 'todo',
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
          taskId: id,
          action: 'created',
          details: 'Task created',
          timestamp: now,
          userId: this.requireUid(),
        }],
        projectId: payload.projectId,
        assigneeId: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        order: maxOrder + 1,
      };
      await setDoc(this.taskDoc(id), task);
      return task;
    });
  }

  updateTask(id: string, payload: UpdateTaskPayload): Observable<Task> {
    return defer(async () => {
      const snap = await getDoc(this.taskDoc(id));
      if (!snap.exists()) throw new Error('Task not found');
      const existing = snap.data() as Task;

      const now = new Date().toISOString();
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
        id,
        updatedAt: now,
        completedAt: payload.status === 'done' && !existing.completedAt
          ? now
          : payload.status !== 'done' && payload.status !== undefined ? null : existing.completedAt,
        activityLog: [
          ...existing.activityLog,
          ...changes.map(detail => ({
            id: uuidv4(),
            taskId: id,
            action: 'updated',
            details: detail,
            timestamp: now,
            userId: this.requireUid(),
          })),
        ],
      };
      await setDoc(this.taskDoc(id), updated);
      return updated;
    });
  }

  deleteTask(id: string): Observable<void> {
    return from(deleteDoc(this.taskDoc(id)));
  }

  deleteTasks(ids: string[]): Observable<void> {
    return defer(async () => {
      const batch = writeBatch(this.firestore);
      for (const id of ids) {
        batch.delete(this.taskDoc(id));
      }
      await batch.commit();
    });
  }

  reorderTasks(updates: { id: string; order: number; status?: TaskStatus }[]): Observable<Task[]> {
    return defer(async () => {
      const now = new Date().toISOString();
      const uid = this.requireUid();
      const batch = writeBatch(this.firestore);
      const results: Task[] = [];

      for (const update of updates) {
        const ref = this.taskDoc(update.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) continue;
        const task = snap.data() as Task;

        if (update.status && update.status !== task.status) {
          task.activityLog = [
            ...task.activityLog,
            {
              id: uuidv4(),
              taskId: task.id,
              action: 'moved',
              details: `Moved from "${task.status}" to "${update.status}"`,
              timestamp: now,
              userId: uid,
            },
          ];
          task.status = update.status;
          task.completedAt = update.status === 'done' ? now : null;
        }
        task.order = update.order;
        task.updatedAt = now;
        batch.set(ref, task);
        results.push(task);
      }

      await batch.commit();
      return results;
    });
  }

  addSubtask(taskId: string, title: string): Observable<Task> {
    return defer(async () => {
      const ref = this.taskDoc(taskId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Task not found');
      const task = snap.data() as Task;

      const subtask: Subtask = { id: uuidv4(), title, completed: false };
      task.subtasks = [...task.subtasks, subtask];
      task.updatedAt = new Date().toISOString();
      await setDoc(ref, task);
      return task;
    });
  }

  toggleSubtask(taskId: string, subtaskId: string): Observable<Task> {
    return defer(async () => {
      const ref = this.taskDoc(taskId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Task not found');
      const task = snap.data() as Task;

      task.subtasks = task.subtasks.map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );
      task.updatedAt = new Date().toISOString();
      await setDoc(ref, task);
      return task;
    });
  }

  removeSubtask(taskId: string, subtaskId: string): Observable<Task> {
    return defer(async () => {
      const ref = this.taskDoc(taskId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Task not found');
      const task = snap.data() as Task;

      task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
      task.updatedAt = new Date().toISOString();
      await setDoc(ref, task);
      return task;
    });
  }
}
