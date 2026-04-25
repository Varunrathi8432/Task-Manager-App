# TaskFlow - Advanced Task Manager Application

A production-ready, full-featured task management application built with **Angular 19** and **Firebase**, showcasing modern web development practices, clean architecture, and advanced Angular features.

![Angular](https://img.shields.io/badge/Angular-19-dd0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?style=flat-square&logo=firebase)
![Material](https://img.shields.io/badge/Angular_Material-19-757575?style=flat-square)
![NgRx](https://img.shields.io/badge/NgRx_Signals-19-ba2bd2?style=flat-square)

## Project Overview

TaskFlow is a comprehensive task management application designed to demonstrate senior-level Angular development skills. It features multiple views (list, kanban, calendar), project organization, analytics dashboards, Firebase-backed persistence, and a polished dark/light theme — all built with Angular's latest APIs.

### Key Features

- **Dashboard** — Overview with stats cards, productivity charts, upcoming deadlines, and quick task creation
- **Task Management** — Full CRUD with rich detail view, subtasks, activity logs, labels, and priority/status tracking
- **Task List (AG Grid)** — High-performance data grid with sorting, filtering, and custom cell renderers
- **Kanban Board** — Drag-and-drop task management across status columns (CDK DragDrop)
- **Calendar View** — Month/week/list views via FullCalendar with drag-to-reschedule and color-coded priorities
- **Projects** — Organize tasks by project with progress tracking and color coding
- **Analytics** — Interactive charts showing completion trends, tasks by status/priority/project
- **Authentication** — Firebase Auth with email/password, email verification, password reset, and "Remember me" persistence
- **Dark/Light Theme** — Material Design 3 theming with smooth transitions
- **Global Search** — Command palette (Ctrl+K) for quick navigation
- **Data Export** — Export tasks as JSON or CSV
- **Responsive Design** — Fully responsive from mobile (375px) to desktop (1400px+)
- **Per-user Cloud Storage** — Tasks and projects scoped to the authenticated user via Firestore security rules

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Angular 19 (standalone components, signals, new control flow) |
| **State Management** | NgRx Signal Store (`@ngrx/signals`) |
| **Backend** | Firebase Authentication + Cloud Firestore (`@angular/fire`) |
| **UI Components** | Angular Material 19 (Material Design 3) |
| **Modals** | ngx-bootstrap (`BsModalService`) |
| **Data Grid** | AG Grid Angular (`ag-grid-angular`) |
| **Calendar** | FullCalendar (`@fullcalendar/angular` — daygrid, list, interaction) |
| **Drag & Drop** | Angular CDK (`@angular/cdk/drag-drop`) |
| **Charts** | ng2-charts + Chart.js 4.5 |
| **Date Utilities** | date-fns 4.1 |
| **Styling** | SCSS with CSS custom properties |
| **Hosting** | Vercel |

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
| `APP_INITIALIZER` | Theme + Firebase auth bootstrap |

## Architecture

```
src/
├── app/
│   ├── core/                      # Singleton services, guards, interceptors
│   │   ├── auth/                  # AuthService (Firebase Auth + Firestore profiles)
│   │   ├── data/                  # Reserved for shared data definitions
│   │   ├── guards/                # authGuard, guestGuard (functional)
│   │   ├── interceptors/          # authInterceptor, errorInterceptor (functional)
│   │   ├── models/                # TypeScript interfaces (Task, Project, User)
│   │   └── services/              # StorageService, TaskApiService (Firestore),
│   │                                ProjectApiService (Firestore),
│   │                                NotificationService, ThemeService
│   ├── shared/                    # Reusable standalone components
│   │   ├── components/            # PriorityBadge, StatusChip, ConfirmDialog,
│   │   │                            LoadingSkeleton, EmptyState, SubtaskList,
│   │   │                            PageHeader, CommandPalette, CustomTable
│   │   │                            (AG Grid wrapper), DynamicFilter
│   │   ├── pipes/                 # RelativeDatePipe, TruncatePipe
│   │   ├── directives/            # AutoFocus, ClickOutside
│   │   └── utils/                 # form-validators, export-utils
│   ├── features/                  # Feature areas (all lazy-loaded)
│   │   ├── auth/                  # Login, Register, Forgot Password
│   │   ├── dashboard/             # Dashboard + widget components
│   │   ├── tasks/                 # TaskList (AG Grid), TaskDetail, TaskForm
│   │   ├── kanban/                # KanbanBoard (CDK DragDrop)
│   │   ├── calendar/              # CalendarView (FullCalendar)
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
│   ├── app.config.ts              # App bootstrap (Firebase + providers)
│   └── app.routes.ts              # Lazy-loaded route definitions
├── styles/
│   ├── _variables.scss            # CSS custom properties (light + dark)
│   ├── _mixins.scss               # Responsive breakpoints, utilities
│   └── _modal.scss                # ngx-bootstrap modal overrides
├── environments/
│   ├── environment.ts             # Dev Firebase config + dev auto-fill credentials
│   └── environment.prod.ts        # Prod Firebase config
├── firebase.json                  # Hosting + Firestore config
├── firestore.rules                # Security rules (per-user data isolation)
└── firestore.indexes.json         # Composite indexes
```

## Setup and Installation

### Prerequisites
- Node.js 18+ (tested with 22.x)
- npm 9+ (tested with 10.x)
- A Firebase project with Authentication (Email/Password) and Firestore enabled
- A Vercel account (for hosting) and the Vercel CLI if deploying from the terminal

### Quick Start

```bash
# Clone the repository
git clone https://github.com/<your-username>/task-manager-app.git
cd task-manager-app

# Install dependencies
npm install

# Configure your Firebase project in src/environments/environment.ts
# (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

# Start development server (port 4100)
npm start

# Open in browser
# http://localhost:4100
```

### Authentication

The app uses Firebase Authentication with email/password sign-in. To use the app:

1. **Register** a new account on the `/auth/register` page — a verification email will be sent
2. **Verify** your email by clicking the link in the message
3. **Sign in** at `/auth/login`. Use *Remember me* for persistent sessions; otherwise the session ends when the browser tab closes
4. **Forgot password?** Use the `/auth/forgot-password` page to receive a reset link

In the **development environment** (`environment.ts`), `devCredentials` can be set to auto-fill the login form for faster iteration. This is intentionally `null` in `environment.prod.ts`.

### Build & Deploy

```bash
# Production build
npm run build:prod
```

Production build artifacts are written to `dist/task-manager-app/browser`.

**Hosting (Vercel)** — the app is deployed to Vercel. Connect the repository to a Vercel project and configure:

- **Build command:** `npm run build:prod`
- **Output directory:** `dist/task-manager-app/browser`
- **Rewrites:** all routes → `/index.html` (SPA fallback)

Vercel auto-builds on every push and generates preview URLs for pull requests.

**Firestore rules and indexes** still live in [firestore.rules](firestore.rules) / [firestore.indexes.json](firestore.indexes.json) and are deployed separately via the Firebase CLI:

```bash
npm run deploy:rules
```

## Design Decisions

### Why Firebase?
Firebase Authentication and Firestore provide a fully-managed, secure backend with minimal operational overhead:
- **Email verification + password reset** out of the box
- **Per-user data isolation** enforced server-side via Firestore security rules (`users/{uid}/tasks/{taskId}`)
- **Real-time-ready**: switching from `getDocs` to `onSnapshot` enables live sync with no architectural change
- **Free tier** is generous enough for demo and small-scale use

### Why NgRx Signal Store?
Angular's built-in signals are great for component state, but NgRx Signal Store adds:
- `withComputed()` for derived state (filtered tasks, grouped data, statistics)
- `rxMethod()` for async operations with RxJS (Firestore reads/writes, loading states)
- `withHooks()` for initialization logic
- Structured pattern that scales across features

### Why FullCalendar Instead of a Custom Grid?
FullCalendar provides battle-tested month/week/list views, drag-to-reschedule, accessibility, and performance optimizations (progressive event rendering, sticky headers) that would take significant effort to replicate. The integration is thin — events are derived from a `computed()` signal over the task store.

### Why AG Grid for the Task List?
AG Grid handles large datasets, server-style sorting/filtering, and column virtualization with minimal effort. Custom cell renderers (priority, status, date, action) live alongside the feature for maintainability.

### Why ngx-bootstrap Modals?
`BsModalService` provides a programmatic, promise-friendly modal API that pairs well with signal-based components for use cases like opening the task form from a calendar date click.

## Performance Optimizations

- **Lazy loading** — Every feature route is lazily loaded via `loadComponent`/`loadChildren`
- **OnPush change detection** — All components use OnPush (configured as project default)
- **Signal-based reactivity** — Fine-grained updates without unnecessary re-renders
- **`@defer` blocks** — Dashboard widgets and analytics charts load on viewport
- **`@for` with `track`** — Efficient list rendering with identity tracking
- **Async animations** — `provideAnimationsAsync()` reduces initial bundle
- **Event coalescing** — `provideZoneChangeDetection({ eventCoalescing: true })`
- **Firestore batched writes** — `writeBatch` for bulk reorder/delete operations
- **Long-lived asset caching** — Hashed JS/CSS served with `max-age=31536000, immutable`

## Security

- **Firestore rules** restrict every read/write to the authenticated user's own document tree
- **Email verification required** — unverified users are signed out at login
- **Security headers** — recommended to configure `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin` in your Vercel project settings (or a `vercel.json`)
- **Environment isolation** — production should point to a separate Firebase project with its own database

