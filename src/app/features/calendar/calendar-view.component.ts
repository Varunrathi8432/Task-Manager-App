import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
  EventMountArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { BsModalService } from 'ngx-bootstrap/modal';
import { take } from 'rxjs/operators';
import { TaskStore } from '@store/task.store';
import { ProjectStore } from '@store/project.store';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { DynamicFilterComponent } from '@shared/components/dynamic-filter/dynamic-filter.component';
import type {
  FilterField,
  FilterFormData,
  FilterSubmitEvent,
} from '@shared/components/dynamic-filter/dynamic-filter.types';
import { Task, TaskPriority, TaskStatus } from '@core/models';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';

interface CalendarFilterState {
  search: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  projectId: string[];
  labels: string[];
  dueDate: { start: string | null; end: string | null };
}

const EMPTY_FILTER: CalendarFilterState = {
  search: '',
  status: [],
  priority: [],
  projectId: [],
  labels: [],
  dueDate: { start: null, end: null },
};

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    FullCalendarModule,
    PageHeaderComponent,
    DynamicFilterComponent,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarViewComponent {
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);
  private router = inject(Router);
  private modalService = inject(BsModalService);

  filterFormData = signal<FilterFormData>({});

  filterFields = computed<FilterField[]>(() => [
    {
      id: 'search',
      name: 'search',
      label: 'Search',
      field_type: 'text',
      placeholder: 'Search by title, description, label',
      order: 1,
    },
    {
      id: 'status',
      name: 'status',
      label: 'Status',
      field_type: 'dropdown',
      isMultiple: true,
      items: [
        { id: 'todo', name: 'To Do' },
        { id: 'in-progress', name: 'In Progress' },
        { id: 'review', name: 'Review' },
        { id: 'done', name: 'Done' },
      ],
      order: 2,
    },
    {
      id: 'priority',
      name: 'priority',
      label: 'Priority',
      field_type: 'dropdown',
      isMultiple: true,
      items: [
        { id: 'low', name: 'Low' },
        { id: 'medium', name: 'Medium' },
        { id: 'high', name: 'High' },
        { id: 'critical', name: 'Critical' },
      ],
      order: 3,
    },
    {
      id: 'project',
      name: 'projectId',
      label: 'Project',
      field_type: 'dropdown',
      isMultiple: true,
      items: this.projectStore
        .projects()
        .map((p) => ({ id: p.id, name: p.name, color: p.color })),
      order: 4,
    },
    {
      id: 'labels',
      name: 'labels',
      label: 'Labels',
      field_type: 'dropdown',
      isMultiple: true,
      items: this.taskStore.allLabels().map((l) => ({ id: l, name: l })),
      order: 5,
    },
  ]);

  private readonly filterState = computed<CalendarFilterState>(() => {
    const f = this.filterFormData();
    return {
      search: ((f['search'] as string) ?? '').toLowerCase().trim(),
      status: (f['status'] as TaskStatus[]) ?? [],
      priority: (f['priority'] as TaskPriority[]) ?? [],
      projectId: (f['projectId'] as string[]) ?? [],
      labels: (f['labels'] as string[]) ?? [],
      dueDate: (f['dueDate'] as {
        start: string | null;
        end: string | null;
      }) ?? { start: null, end: null },
    };
  });

  readonly filteredTasks = computed<Task[]>(() => {
    const tasks = this.taskStore.tasks();
    const f = this.filterState();

    return tasks.filter((t) => {
      if (f.search) {
        const hay =
          `${t.title} ${t.description} ${t.labels.join(' ')}`.toLowerCase();
        if (!hay.includes(f.search)) return false;
      }
      if (f.status.length && !f.status.includes(t.status)) return false;
      if (f.priority.length && !f.priority.includes(t.priority)) return false;
      if (
        f.projectId.length &&
        (!t.projectId || !f.projectId.includes(t.projectId))
      )
        return false;
      if (f.labels.length && !f.labels.some((l) => t.labels.includes(l)))
        return false;
      if (f.dueDate.start || f.dueDate.end) {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate).getTime();
        if (f.dueDate.start && due < new Date(f.dueDate.start).getTime())
          return false;
        if (
          f.dueDate.end &&
          due > new Date(f.dueDate.end).getTime() + 86_399_999
        )
          return false;
      }
      return true;
    });
  });

  readonly filteredCount = computed(() => this.filteredTasks().length);
  readonly totalCount = computed(() => this.taskStore.totalCount());
  readonly subtitle = computed(() =>
    this.filteredCount() === this.totalCount()
      ? `${this.totalCount()} tasks`
      : `Showing ${this.filteredCount()} of ${this.totalCount()} tasks`,
  );

  private readonly events = computed<EventInput[]>(() =>
    this.filteredTasks()
      .filter((t) => !!t.dueDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        start: t.dueDate!,
        allDay: true,
        backgroundColor: `var(--tm-priority-${t.priority})`,
        borderColor: `var(--tm-priority-${t.priority})`,
        classNames: [
          `status-${t.status}`,
          ...(t.status === 'done' ? ['is-done'] : []),
        ],
        extendedProps: { task: t },
      })),
  );

  readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,listWeek',
    },
    firstDay: 1,
    height: '100%',
    stickyHeaderDates: true,
    progressiveEventRendering: true,
    selectable: true,
    editable: true,
    eventStartEditable: true,
    eventDurationEditable: false,
    dayMaxEvents: false,
    displayEventTime: false,
    events: this.events(),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDrop: (arg: EventDropArg) => this.onEventDrop(arg),
    eventDidMount: (arg: EventMountArg) => this.onEventDidMount(arg),
    select: (arg: DateSelectArg) => this.onDateSelect(arg),
  }));

  openTaskForm(dueDate?: Date): void {
    const modalRef = this.modalService.show(TaskFormComponent, {
      class: 'modal-md',
      initialState: { task: null, ...(dueDate && { initialDueDate: dueDate }) },
    });
    modalRef.content?.result.pipe(take(1)).subscribe((result) => {
      this.taskStore.addTask(result);
    });
  }

  onFilterSubmit(event: FilterSubmitEvent): void {
    this.filterFormData.set(event.filterFormData);
  }

  resetFilters(): void {
    this.filterFormData.set({ ...EMPTY_FILTER });
  }

  private onEventClick(arg: EventClickArg): void {
    this.router.navigate(['/tasks', arg.event.id]);
  }

  private onEventDrop(arg: EventDropArg): void {
    if (!arg.event.start) {
      arg.revert();
      return;
    }
    this.taskStore.updateTask({
      id: arg.event.id,
      changes: { dueDate: arg.event.start.toISOString() },
    });
  }

  private onEventDidMount(arg: EventMountArg): void {
    const task = arg.event.extendedProps?.['task'] as Task | undefined;
    if (!task) return;
    const parts = [
      task.title,
      `Priority: ${task.priority}`,
      `Status: ${task.status}`,
    ];
    if (task.projectId) {
      const project = this.projectStore
        .projects()
        .find((p) => p.id === task.projectId);
      if (project) parts.push(`Project: ${project.name}`);
    }
    if (task.description) parts.push(task.description);
    arg.el.setAttribute('title', parts.join('\n'));
  }

  private onDateSelect(arg: DateSelectArg): void {
    this.openTaskForm(arg.start);
  }
}
