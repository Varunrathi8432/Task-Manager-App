import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  user as firebaseUser$,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, from, switchMap, catchError, throwError, firstValueFrom } from 'rxjs';
import { User, UserPreferences, LoginCredentials, RegisterPayload, AuthResponse } from '@core/models';

const DEFAULT_PREFS: UserPreferences = {
  theme: 'light',
  defaultView: 'list',
  notificationsEnabled: true,
  defaultPriority: 'medium',
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password',
  'auth/invalid-email': 'Invalid email address',
  'auth/user-not-found': 'Invalid email or password',
  'auth/wrong-password': 'Invalid email or password',
  'auth/email-already-in-use': 'Email already registered',
  'auth/weak-password': 'Password is too weak (min 6 characters)',
  'auth/network-request-failed': 'Network error — check your connection',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
};

export const ERR_EMAIL_NOT_VERIFIED = 'auth/email-not-verified';

export interface RegistrationResult {
  verificationSent: true;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userName = computed(() => this.currentUser()?.name ?? '');
  readonly userInitials = computed(() => {
    const user = this.currentUser();
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
  });

  async init(): Promise<void> {
    const stream = firebaseUser$(this.auth);
    // Wait for first emission so guards see the correct state on app boot.
    const firstUser = await firstValueFrom(stream);
    if (firstUser && firstUser.emailVerified) {
      this.currentUser.set(await this.loadOrCreateProfile(firstUser));
    } else if (firstUser && !firstUser.emailVerified) {
      // Persisted session but unverified — sign out so guards reject.
      await signOut(this.auth);
    }
    stream.subscribe(async (fbUser) => {
      if (!fbUser || !fbUser.emailVerified) {
        this.currentUser.set(null);
        return;
      }
      this.currentUser.set(await this.loadOrCreateProfile(fbUser));
    });
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)).pipe(
      switchMap(async cred => {
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          await signOut(this.auth);
          const err = new Error(
            'Please verify your email before logging in. A fresh verification link has been sent to your inbox.',
          );
          (err as Error & { code: string }).code = ERR_EMAIL_NOT_VERIFIED;
          throw err;
        }
        const user = await this.loadOrCreateProfile(cred.user);
        this.currentUser.set(user);
        const token = await cred.user.getIdToken();
        return { token, expiresAt: '', user } as AuthResponse;
      }),
      catchError(err => throwError(() => this.wrapError(err))),
    );
  }

  register(payload: RegisterPayload): Observable<RegistrationResult> {
    return from(createUserWithEmailAndPassword(this.auth, payload.email, payload.password)).pipe(
      switchMap(async cred => {
        await fbUpdateProfile(cred.user, { displayName: payload.name });
        const profile: User = {
          id: cred.user.uid,
          email: payload.email,
          name: payload.name,
          avatar: '',
          preferences: { ...DEFAULT_PREFS },
        };
        await setDoc(doc(this.firestore, `users/${cred.user.uid}`), profile);
        await sendEmailVerification(cred.user);
        await signOut(this.auth);
        return { verificationSent: true as const, email: payload.email };
      }),
      catchError(err => throwError(() => this.wrapError(err))),
    );
  }

  async resendVerification(email: string, password: string): Promise<void> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      if (cred.user.emailVerified) {
        await signOut(this.auth);
        throw new Error('This email is already verified. You can sign in now.');
      }
      await sendEmailVerification(cred.user);
      await signOut(this.auth);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  logout(): void {
    signOut(this.auth).finally(() => {
      this.currentUser.set(null);
      this.router.navigate(['/auth/login']);
    });
  }

  checkAuthStatus(): void {
    // Firebase persists sessions; init() installs the state listener at app start.
  }

  getToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? Promise.resolve(null);
  }

  async updateProfile(updates: Partial<User>): Promise<void> {
    const user = this.currentUser();
    const fbUser = this.auth.currentUser;
    if (!user || !fbUser) return;

    if (updates.name && updates.name !== user.name) {
      await fbUpdateProfile(fbUser, { displayName: updates.name });
    }

    await updateDoc(doc(this.firestore, `users/${user.id}`), { ...updates });
    this.currentUser.set({ ...user, ...updates });
  }

  private async loadOrCreateProfile(fbUser: FirebaseUser): Promise<User> {
    const ref = doc(this.firestore, `users/${fbUser.uid}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<User>;
      return {
        id: fbUser.uid,
        email: fbUser.email ?? data.email ?? '',
        name: data.name ?? fbUser.displayName ?? '',
        avatar: data.avatar ?? '',
        preferences: { ...DEFAULT_PREFS, ...(data.preferences ?? {}) },
      };
    }
    const profile: User = {
      id: fbUser.uid,
      email: fbUser.email ?? '',
      name: fbUser.displayName ?? '',
      avatar: '',
      preferences: { ...DEFAULT_PREFS },
    };
    await setDoc(ref, profile);
    return profile;
  }

  private wrapError(err: unknown): Error {
    const code = (err as { code?: string })?.code;
    if (code === ERR_EMAIL_NOT_VERIFIED) return err as Error;
    const message = (code && AUTH_ERROR_MESSAGES[code]) ?? (err as Error)?.message ?? 'Authentication failed';
    const wrapped = new Error(message);
    if (code) (wrapped as Error & { code: string }).code = code;
    return wrapped;
  }
}
