export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  taskId: string;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  labels: string[];
  subtasks: Subtask[];
  attachments: TaskAttachment[];
  activityLog: ActivityLogEntry[];
  projectId: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  order: number;
}

export type CreateTaskPayload = Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'labels' | 'projectId'> & {
  status?: TaskStatus;
  subtasks?: Pick<Subtask, 'title'>[];
};

export type UpdateTaskPayload = Partial<Omit<Task, 'id' | 'createdAt' | 'activityLog'>>;
