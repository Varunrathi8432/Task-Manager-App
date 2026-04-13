import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storage = inject(StorageService);
  readonly isDark = signal(false);

  initTheme(): void {
    const stored = this.storage.get<'light' | 'dark'>('theme');
    if (stored) {
      this.setTheme(stored === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark);
    }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDark());
  }

  setTheme(dark: boolean): void {
    this.isDark.set(dark);
    this.storage.set('theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-theme', dark);
  }
}
