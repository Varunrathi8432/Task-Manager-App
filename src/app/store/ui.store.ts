import { inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';

export interface UiState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeView: 'list' | 'kanban' | 'calendar';
  isMobile: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  commandPaletteOpen: false,
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
    toggleCommandPalette(): void {
      patchState(store, { commandPaletteOpen: !store.commandPaletteOpen() });
    },
    closeCommandPalette(): void {
      patchState(store, { commandPaletteOpen: false });
    },
    setMobile(isMobile: boolean): void {
      patchState(store, { isMobile, sidebarCollapsed: isMobile });
    },
  })),

  withHooks({
    onInit(store) {
      const breakpointObserver = inject(BreakpointObserver);
      breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
        .subscribe(result => {
          store.setMobile(result.matches);
        });
    },
  }),
);
