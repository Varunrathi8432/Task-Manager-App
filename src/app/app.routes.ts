import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' },
      },
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/task.routes').then(m => m.TASK_ROUTES),
        data: { title: 'Tasks' },
      },
      {
        path: 'kanban',
        loadComponent: () => import('./features/kanban/kanban-board.component').then(m => m.KanbanBoardComponent),
        data: { title: 'Kanban Board' },
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar-view.component').then(m => m.CalendarViewComponent),
        data: { title: 'Calendar' },
      },
      {
        path: 'projects',
        loadChildren: () => import('./features/projects/project.routes').then(m => m.PROJECT_ROUTES),
        data: { title: 'Projects' },
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        data: { title: 'Analytics' },
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        data: { title: 'Settings' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
