# TaskFlow - Advanced Task Manager Application

A production-ready, full-featured task management application built with **Angular 19**, showcasing modern web development practices, clean architecture, and advanced Angular features.

![Angular](https://img.shields.io/badge/Angular-19-dd0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![Material](https://img.shields.io/badge/Angular_Material-19-757575?style=flat-square)
![NgRx](https://img.shields.io/badge/NgRx_Signals-19-ba2bd2?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Project Overview

TaskFlow is a comprehensive task management application designed to demonstrate senior-level Angular development skills. It features multiple views (list, kanban, calendar), project organization, analytics dashboards, and a polished dark/light theme — all built with Angular's latest APIs.

### Key Features

- **Dashboard** — Overview with stats cards, productivity charts, upcoming deadlines, and quick task creation
- **Task Management** — Full CRUD with rich detail view, subtasks, activity logs, labels, and priority/status tracking
- **Kanban Board** — Drag-and-drop task management across 4 status columns (CDK DragDrop)
- **Calendar View** — Monthly calendar grid with color-coded task indicators
- **Projects** — Organize tasks by project with progress tracking and color coding
- **Analytics** — Interactive charts showing completion trends, tasks by status/priority/project
- **Authentication** — Login/Register with mock JWT tokens, guards, and interceptors
- **Dark/Light Theme** — Material Design 3 theming with smooth transitions
- **Global Search** — Command palette (Ctrl+K) for quick navigation
- **Data Export** — Export tasks as JSON or CSV
- **Responsive Design** — Fully responsive from mobile (375px) to desktop (1400px+)
- **Demo Data** — 25 pre-seeded tasks across 3 projects for instant demo experience

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Angular 19 (standalone components, signals, new control flow) |
| **State Management** | NgRx Signal Store (`@ngrx/signals`) |
| **UI Components** | Angular Material 19 (Material Design 3) |
| **Drag & Drop** | Angular CDK (`@angular/cdk/drag-drop`) |
| **Charts** | ng2-charts + Chart.js 4.5 |
| **Date Utilities** | date-fns 4.1 |
| **Styling** | SCSS with CSS custom properties |
| **Backend** | Mock API with localStorage persistence |

## Angular 19 Features Showcased

| Feature | Where Used |
|---------|-----------|
| Standalone components (no NgModules) | Every component in the app |
| New control flow (`@if`, `@for`, `@switch`) | All templates |
| `@defer` blocks | Dashboard widgets, analytics charts |
| Signals (`signal`, `computed`) | All stores and components |
| Signal-based inputs (`input()`, `input.required()`) | SubtaskList, PriorityBadge, StatusChip, TaskDetail |
| Signal-based outputs (`output()`) | SubtaskList, EmptyState |
| `inject()` function | Every service and component |
| Functional route guards (`CanActivateFn`) | auth.guard.ts, guest.guard.ts |
| Functional HTTP interceptors (`HttpInterceptorFn`) | auth.interceptor.ts, error.interceptor.ts |
| `withComponentInputBinding()` | Route params as signal inputs |
| `withViewTransitions()` | Smooth page transitions |
| `provideAnimationsAsync()` | Async animation loading |
| `NonNullableFormBuilder` | All reactive forms |
| OnPush change detection | Every component (configured as default) |

## Architecture

```
src/
├── app/
│   ├── core/                      # Singleton services, guards, interceptors
│   │   ├── auth/                  # AuthService (mock JWT)
│   │   ├── guards/                # authGuard, guestGuard (functional)
│   │   ├── interceptors/          # authInterceptor, errorInterceptor (functional)
│   │   ├── models/                # TypeScript interfaces (Task, Project, User)
│   │   └── services/              # StorageService, MockApiService, TaskApiService,
│   │                                ProjectApiService, NotificationService,
│   │                                ThemeService, SeedDataService
│   ├── shared/                    # Reusable standalone components
│   │   ├── components/            # PriorityBadge, StatusChip, ConfirmDialog,
│   │   │                            LoadingSkeleton, EmptyState, SubtaskList,
│   │   │                            PageHeader, CommandPalette
│   │   ├── pipes/                 # RelativeDatePipe, TruncatePipe
│   │   ├── directives/            # AutoFocus, ClickOutside
│   │   └── utils/                 # form-validators, export-utils
│   ├── features/                  # Feature areas (all lazy-loaded)
│   │   ├── auth/                  # Login, Register
│   │   ├── dashboard/             # Dashboard + 5 widget components
│   │   ├── tasks/                 # TaskList, TaskDetail, TaskForm
│   │   ├── kanban/                # KanbanBoard (CDK DragDrop)
│   │   ├── calendar/              # CalendarView (custom grid)
│   │   ├── projects/              # ProjectList, ProjectDetail, ProjectForm
│   │   ├── analytics/             # Charts and statistics
│   │   └── settings/              # Profile, theme, data export
│   ├── layout/                    # App shell (Header, Sidebar, Shell)
│   ├── store/                     # NgRx Signal Stores
│   │   ├── task.store.ts          # Task state, computed filters, CRUD methods
│   │   ├── project.store.ts       # Project state with task stats
│   │   ├── auth.store.ts          # Auth state, login/register/logout
│   │   └── ui.store.ts            # UI state (sidebar, theme, mobile)
│   ├── app.component.ts
│   ├── app.config.ts              # App bootstrap configuration
│   └── app.routes.ts              # Lazy-loaded route definitions
├── styles/
│   ├── _variables.scss            # CSS custom properties (light + dark)
│   └── _mixins.scss               # Responsive breakpoints, utilities
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles.scss                    # Global styles + Material theme
```

## Setup and Installation

### Prerequisites
- Node.js 18+ (tested with 22.x)
- npm 9+ (tested with 10.x)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/<your-username>/task-manager-app.git
cd task-manager-app

# Install dependencies
npm install

# Start development server
ng serve

# Open in browser
# http://localhost:4200
```

### Demo Credentials
The app comes pre-seeded with a demo account:
- **Email:** `demo@taskmanager.com`
- **Password:** `password123`

### Build for Production

```bash
ng build
```

The build artifacts are stored in the `dist/` directory.

## Design Decisions

### Why Mock API Instead of Firebase?
The mock API approach with localStorage was chosen so that:
1. **Zero setup** — Clone and run instantly, no external accounts needed
2. **Offline-first** — Works without internet connection
3. **API-ready** — Services are structured identically to real REST APIs, making migration to a real backend trivial (just swap the service implementations)

### Why NgRx Signal Store?
Angular's built-in signals are great for component state, but NgRx Signal Store adds:
- `withComputed()` for derived state (filtered tasks, grouped data, statistics)
- `rxMethod()` for async operations with RxJS (API calls, loading states)
- `withHooks()` for initialization logic
- Structured pattern that scales across features

### Why Custom Calendar Instead of a Library?
Building the calendar from scratch with `date-fns` demonstrates deeper frontend skills than dropping in a pre-built component.

## Performance Optimizations

- **Lazy loading** — Every feature route is lazily loaded via `loadComponent`/`loadChildren`
- **OnPush change detection** — All components use OnPush (configured as project default)
- **Signal-based reactivity** — Fine-grained updates without unnecessary re-renders
- **`@defer` blocks** — Dashboard widgets and analytics charts load on viewport
- **`@for` with `track`** — Efficient list rendering with identity tracking
- **Async animations** — `provideAnimationsAsync()` reduces initial bundle
- **Event coalescing** — `provideZoneChangeDetection({ eventCoalescing: true })`

## License

MIT
