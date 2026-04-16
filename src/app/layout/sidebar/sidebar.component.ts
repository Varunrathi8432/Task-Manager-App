import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UiStore } from '@store/ui.store';
import { ProjectStore } from '@store/project.store';
import { TaskStore } from '@store/task.store';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsed]': 'collapsed()',
  },
})
export class SidebarComponent {
  collapsed = input(false);
  protected uiStore = inject(UiStore);
  protected projectStore = inject(ProjectStore);
  protected taskStore = inject(TaskStore);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tasks', label: 'Tasks', icon: 'task_alt' },
    { path: '/kanban', label: 'Kanban Board', icon: 'view_kanban' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar_month' },
    { path: '/projects', label: 'Projects', icon: 'folder' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
}
