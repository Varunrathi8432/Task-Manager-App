import { computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { User, LoginCredentials, RegisterPayload } from '@core/models';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  emailVerificationRequired: boolean;
  successMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  emailVerificationRequired: false,
  successMessage: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => store.user() !== null),
    userName: computed(() => store.user()?.name ?? ''),
    userEmail: computed(() => store.user()?.email ?? ''),
    userInitials: computed(() => {
      const user = store.user();
      if (!user) return '';
      const name = (user.name ?? '').trim();
      if (name) {
        return name
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      }
      return (user.email ?? '').trim()[0]?.toUpperCase() ?? '';
    }),
  })),

  withMethods((store) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return {
      login: rxMethod<LoginCredentials & { returnUrl?: string }>(
        pipe(
          tap(() =>
            patchState(store, {
              loading: true,
              error: null,
              emailVerificationRequired: false,
            }),
          ),
          switchMap((creds) =>
            authService.login(creds).pipe(
              tap((response) => {
                patchState(store, {
                  user: response.user,
                  loading: false,
                  error: null,
                });
                router.navigateByUrl(creds.returnUrl ?? '/dashboard');
              }),
              catchError((err) => {
                const isVerificationError =
                  err.message?.includes('verify your email');
                patchState(store, {
                  loading: false,
                  error: err.message,
                  emailVerificationRequired: isVerificationError,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      register: rxMethod<RegisterPayload>(
        pipe(
          tap(() =>
            patchState(store, {
              loading: true,
              error: null,
              successMessage: null,
            }),
          ),
          switchMap((payload) =>
            authService.register(payload).pipe(
              tap((res) => {
                patchState(store, {
                  loading: false,
                  successMessage: res.message,
                });
              }),
              catchError((err) => {
                patchState(store, { loading: false, error: err.message });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      resendVerification: rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ email, password }) =>
            authService.resendVerificationEmail(email, password).pipe(
              tap(() => {
                patchState(store, {
                  loading: false,
                  error: null,
                  successMessage: 'Verification email sent! Check your inbox.',
                  emailVerificationRequired: false,
                });
              }),
              catchError((err) => {
                patchState(store, { loading: false, error: err.message });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      forgotPassword: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              loading: true,
              error: null,
              successMessage: null,
            }),
          ),
          switchMap((email) =>
            authService.sendPasswordReset(email).pipe(
              tap(() => {
                patchState(store, {
                  loading: false,
                  successMessage:
                    'Password reset email sent! Check your inbox.',
                });
              }),
              catchError((err) => {
                patchState(store, { loading: false, error: err.message });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      logout(): void {
        authService.logout();
        patchState(store, {
          user: null,
          error: null,
          successMessage: null,
          emailVerificationRequired: false,
        });
      },

      checkSession(): void {
        authService.checkAuthStatus();
        const user = authService.user();
        if (user) {
          patchState(store, { user });
        }
      },

      clearError(): void {
        patchState(store, { error: null, emailVerificationRequired: false });
      },

      clearSuccess(): void {
        patchState(store, { successMessage: null });
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
      effect(() => {
        patchState(store, { user: authService.user() });
      });
    },
  }),
);
