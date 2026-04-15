import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { User, LoginCredentials, RegisterPayload } from '@core/models';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => store.user() !== null),
    userName: computed(() => store.user()?.name ?? ''),
    userEmail: computed(() => store.user()?.email ?? ''),
    userInitials: computed(() => {
      const name = store.user()?.name ?? '';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }),
  })),

  withMethods((store) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return {
      login: rxMethod<LoginCredentials & { returnUrl?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(creds => authService.login(creds).pipe(
            tap(response => {
              patchState(store, { user: response.user, loading: false, error: null });
              router.navigateByUrl(creds.returnUrl ?? '/dashboard');
            }),
            catchError(err => {
              patchState(store, { loading: false, error: err.message });
              return EMPTY;
            }),
          )),
        )
      ),
      register: rxMethod<RegisterPayload>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(payload => authService.register(payload).pipe(
            tap(response => {
              patchState(store, { user: response.user, loading: false, error: null });
              router.navigateByUrl('/dashboard');
            }),
            catchError(err => {
              patchState(store, { loading: false, error: err.message });
              return EMPTY;
            }),
          )),
        )
      ),
      logout(): void {
        authService.logout();
        patchState(store, { user: null, error: null });
      },
      checkSession(): void {
        authService.checkAuthStatus();
        const user = authService.user();
        if (user) {
          patchState(store, { user });
        }
      },
      clearError(): void {
        patchState(store, { error: null });
      },
      updateProfile(updates: Partial<User>): void {
        authService.updateProfile(updates);
        const current = store.user();
        if (current) {
          patchState(store, { user: { ...current, ...updates } });
        }
      },
    };
  }),
);
