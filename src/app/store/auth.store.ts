import { computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, from } from 'rxjs';
import { AuthService, ERR_EMAIL_NOT_VERIFIED } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { User, LoginCredentials, RegisterPayload } from '@core/models';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  lastLoginEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  errorCode: null,
  lastLoginEmail: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => store.user() !== null),
    userName: computed(() => store.user()?.name ?? ''),
    userEmail: computed(() => store.user()?.email ?? ''),
    emailVerificationRequired: computed(() => store.errorCode() === ERR_EMAIL_NOT_VERIFIED),
    userInitials: computed(() => {
      const user = store.user();
      if (!user) return '';
      const name = (user.name ?? '').trim();
      if (name) {
        return name
          .split(/\s+/)
          .filter(Boolean)
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      }
      const email = (user.email ?? '').trim();
      return email ? email[0].toUpperCase() : '';
    }),
  })),

  withMethods((store) => {
    const authService = inject(AuthService);
    const notification = inject(NotificationService);
    const router = inject(Router);

    return {
      login: rxMethod<LoginCredentials & { returnUrl?: string }>(
        pipe(
          tap(creds => patchState(store, { loading: true, error: null, errorCode: null, lastLoginEmail: creds.email })),
          switchMap(creds => authService.login(creds).pipe(
            tap(response => {
              patchState(store, { user: response.user, loading: false, error: null, errorCode: null });
              router.navigateByUrl(creds.returnUrl ?? '/dashboard');
            }),
            catchError((err: Error & { code?: string }) => {
              patchState(store, { loading: false, error: err.message, errorCode: err.code ?? null });
              return EMPTY;
            }),
          )),
        )
      ),
      register: rxMethod<RegisterPayload>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null, errorCode: null })),
          switchMap(payload => authService.register(payload).pipe(
            tap(result => {
              patchState(store, { loading: false, error: null, errorCode: null });
              notification.success(
                `Verification email sent to ${result.email}. Please verify before signing in.`,
                6000,
              );
              router.navigate(['/auth/login']);
            }),
            catchError((err: Error & { code?: string }) => {
              patchState(store, { loading: false, error: err.message, errorCode: err.code ?? null });
              return EMPTY;
            }),
          )),
        )
      ),
      resendVerification: rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ email, password }) => from(authService.resendVerification(email, password)).pipe(
            tap(() => {
              patchState(store, { loading: false, error: null, errorCode: null });
              notification.success('Verification email sent. Check your inbox.');
            }),
            catchError((err: Error) => {
              patchState(store, { loading: false, error: err.message });
              notification.error(err.message);
              return EMPTY;
            }),
          )),
        )
      ),
      forgotPassword: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null, errorCode: null })),
          switchMap(email => from(authService.resetPassword(email)).pipe(
            tap(() => {
              patchState(store, { loading: false });
              notification.success('Password reset email sent. Check your inbox.', 6000);
              router.navigate(['/auth/login']);
            }),
            catchError((err: Error) => {
              patchState(store, { loading: false, error: err.message });
              return EMPTY;
            }),
          )),
        )
      ),
      logout(): void {
        authService.logout();
        patchState(store, { user: null, error: null, errorCode: null });
      },
      checkSession(): void {
        authService.checkAuthStatus();
        const user = authService.user();
        if (user) {
          patchState(store, { user });
        }
      },
      clearError(): void {
        patchState(store, { error: null, errorCode: null });
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

  withHooks({
    onInit(store) {
      const authService = inject(AuthService);
      // Mirror Firebase-persisted session into the store on page load.
      effect(() => {
        patchState(store, { user: authService.user() });
      });
    },
  }),
);
