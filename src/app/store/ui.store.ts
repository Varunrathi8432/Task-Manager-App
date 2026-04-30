import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  signalStore,
  withState,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';

export interface UiState {
  sidebarCollapsed: boolean;
  activeView: 'list' | 'kanban' | 'calendar';
  isMobile: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  activeView: 'list',
  isMobile: false,
};

export const UiStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withMethods((store) => ({
    toggleSidebar(): void {
      patchState(store, { sidebarCollapsed: !store.sidebarCollapsed() });
    },
    setSidebarCollapsed(collapsed: boolean): void {
      patchState(store, { sidebarCollapsed: collapsed });
    },
    setView(view: UiState['activeView']): void {
      patchState(store, { activeView: view });
    },
    setMobile(isMobile: boolean): void {
      patchState(store, { isMobile, sidebarCollapsed: isMobile });
    },
  })),

  withHooks({
    onInit(store) {
      const breakpointObserver = inject(BreakpointObserver);
      const destroyRef = inject(DestroyRef);
      breakpointObserver
        .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe((result) => {
          store.setMobile(result.matches);
        });
    },
  }),
);
