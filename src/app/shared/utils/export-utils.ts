import { Task } from '@core/models';

export function tasksToCSV(tasks: Task[]): string {
  const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Project', 'Labels', 'Created'];
  const rows = tasks.map(t => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.dueDate ?? '',
    t.projectId ?? '',
    t.labels.join('; '),
    t.createdAt,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
