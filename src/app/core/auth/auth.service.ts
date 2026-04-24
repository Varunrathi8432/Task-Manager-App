import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  user as firebaseUser$,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, from, switchMap, catchError, throwError, firstValueFrom } from 'rxjs';
import {
  User, UserPreferences, LoginCredentials,
  RegisterPayload, AuthResponse, RegisterResponse,
} from '@core/models';

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
    const firstUser = await firstValueFrom(stream);
    if (firstUser?.emailVerified) {
      this.currentUser.set(await this.loadOrCreateProfile(firstUser));
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
          await signOut(this.auth);
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
        }
        const user = await this.loadOrCreateProfile(cred.user);
        this.currentUser.set(user);
        const token = await cred.user.getIdToken();
        return { token, expiresAt: '', user } as AuthResponse;
      }),
      catchError(err => throwError(() => new Error(this.friendlyError(err)))),
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
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
        // Write profile while still authenticated, then sign out until email verified.
        await setDoc(doc(this.firestore, `users/${cred.user.uid}`), profile);
        await sendEmailVerification(cred.user);
        await signOut(this.auth);
        return {
          message: `We've sent a verification email to ${payload.email}. Please verify your email to sign in.`,
        } as RegisterResponse;
      }),
      catchError(err => throwError(() => new Error(this.friendlyError(err)))),
    );
  }

  resendVerificationEmail(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async cred => {
        if (cred.user.emailVerified) {
          await signOut(this.auth);
          throw new Error('Your email is already verified. You can sign in now.');
        }
        await sendEmailVerification(cred.user);
        await signOut(this.auth);
      }),
      catchError(err => throwError(() => new Error(this.friendlyError(err)))),
    );
  }

  sendPasswordReset(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      catchError(err => throwError(() => new Error(this.friendlyError(err)))),
    );
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

  private friendlyError(err: unknown): string {
    const raw = err as { code?: string; message?: string };
    if (raw?.code && AUTH_ERROR_MESSAGES[raw.code]) return AUTH_ERROR_MESSAGES[raw.code];
    return raw?.message ?? 'Authentication failed';
  }
}
