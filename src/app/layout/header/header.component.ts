import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { UiStore } from '@store/ui.store';
import { AuthStore } from '@store/auth.store';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule, MatDividerModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.control.k)': 'onCommandPalette($event)',
  },
})
export class HeaderComponent {
  protected uiStore = inject(UiStore);
  protected authStore = inject(AuthStore);
  protected themeService = inject(ThemeService);
  private router = inject(Router);

  onCommandPalette(event: Event): void {
    event.preventDefault();
    this.uiStore.toggleCommandPalette();
  }

  onLogout(): void {
    this.authStore.logout();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
