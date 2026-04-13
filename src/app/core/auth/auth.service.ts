import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, delay } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '@core/services/storage.service';
import { User, LoginCredentials, RegisterPayload, AuthResponse, UserPreferences } from '@core/models';
import { environment } from '@env/environment';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar: string;
  preferences: UserPreferences;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storage = inject(StorageService);
  private router = inject(Router);

  private currentUser = signal<User | null>(null);
  private tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userName = computed(() => this.currentUser()?.name ?? '');
  readonly userInitials = computed(() => {
    const name = this.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  constructor() {
    this.seedDemoUser();
  }

  private seedDemoUser(): void {
    const users = this.storage.get<StoredUser[]>('users');
    if (!users || users.length === 0) {
      this.storage.set<StoredUser[]>('users', [{
        id: uuidv4(),
        email: 'demo@taskmanager.com',
        name: 'Alex Johnson',
        password: 'password123',
        avatar: '',
        preferences: {
          theme: 'light',
          defaultView: 'list',
          notificationsEnabled: true,
          defaultPriority: 'medium',
        },
      }]);
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const users = this.storage.get<StoredUser[]>('users') ?? [];
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password);

    if (!user) {
      return throwError(() => new Error('Invalid email or password')).pipe(delay(environment.apiDelay));
    }

    const { password: _, ...safeUser } = user;
    const { token, expiresAt } = this.generateMockToken(safeUser);

    if (credentials.rememberMe) {
      this.storage.set(environment.tokenKey, token);
      this.storage.set('token_expiry', expiresAt);
    } else {
      sessionStorage.setItem(environment.storagePrefix + environment.tokenKey, token);
      sessionStorage.setItem(environment.storagePrefix + 'token_expiry', expiresAt);
    }

    this.storage.set('current_user', safeUser);
    this.currentUser.set(safeUser);
    this.startExpiryTimer(expiresAt);

    return of({ token, expiresAt, user: safeUser }).pipe(delay(environment.apiDelay));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    const users = this.storage.get<StoredUser[]>('users') ?? [];

    if (users.some(u => u.email === payload.email)) {
      return throwError(() => new Error('Email already registered')).pipe(delay(environment.apiDelay));
    }

    const newUser: StoredUser = {
      id: uuidv4(),
      email: payload.email,
      name: payload.name,
      password: payload.password,
      avatar: '',
      preferences: {
        theme: 'light',
        defaultView: 'list',
        notificationsEnabled: true,
        defaultPriority: 'medium',
      },
    };

    users.push(newUser);
    this.storage.set('users', users);

    const { password: _, ...safeUser } = newUser;
    const { token, expiresAt } = this.generateMockToken(safeUser);

    this.storage.set(environment.tokenKey, token);
    this.storage.set('token_expiry', expiresAt);
    this.storage.set('current_user', safeUser);
    this.currentUser.set(safeUser);
    this.startExpiryTimer(expiresAt);

    return of({ token, expiresAt, user: safeUser }).pipe(delay(environment.apiDelay));
  }

  logout(): void {
    this.clearExpiryTimer();
    this.currentUser.set(null);
    this.storage.remove(environment.tokenKey);
    this.storage.remove('token_expiry');
    this.storage.remove('current_user');
    sessionStorage.removeItem(environment.storagePrefix + environment.tokenKey);
    sessionStorage.removeItem(environment.storagePrefix + 'token_expiry');
    this.router.navigate(['/auth/login']);
  }

  checkAuthStatus(): void {
    const token = this.getToken();
    const expiresAt = this.storage.get<string>('token_expiry')
      ?? sessionStorage.getItem(environment.storagePrefix + 'token_expiry');

    if (token && expiresAt && new Date(expiresAt) > new Date()) {
      const user = this.storage.get<User>('current_user');
      if (user) {
        this.currentUser.set(user);
        this.startExpiryTimer(expiresAt);
      }
    } else {
      this.logout();
    }
  }

  getToken(): string | null {
    return this.storage.get<string>(environment.tokenKey)
      ?? sessionStorage.getItem(environment.storagePrefix + environment.tokenKey);
  }

  updateProfile(updates: Partial<User>): void {
    const user = this.currentUser();
    if (!user) return;

    const updated = { ...user, ...updates };
    this.currentUser.set(updated);
    this.storage.set('current_user', updated);

    const users = this.storage.get<StoredUser[]>('users') ?? [];
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...updates } as StoredUser;
      this.storage.set('users', users);
    }
  }

  private generateMockToken(user: User): { token: string; expiresAt: string } {
    const expiresAt = new Date(
      Date.now() + environment.tokenExpiryMinutes * 60 * 1000
    ).toISOString();

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: new Date(expiresAt).getTime() / 1000,
    }));
    const signature = btoa('mock-signature');

    return { token: `${header}.${payload}.${signature}`, expiresAt };
  }

  private startExpiryTimer(expiresAt: string): void {
    this.clearExpiryTimer();
    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    if (msUntilExpiry > 0) {
      this.tokenExpiryTimer = setTimeout(() => this.logout(), msUntilExpiry);
    }
  }

  private clearExpiryTimer(): void {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
  }
}
