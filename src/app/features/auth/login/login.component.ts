import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCheckboxModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  protected authStore = inject(AuthStore);
  hidePassword = signal(true);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  canResend(): boolean {
    const { email, password } = this.loginForm.getRawValue();
    return !!email && !!password;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      this.authStore.login({
        ...this.loginForm.getRawValue(),
        returnUrl,
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  resendVerification(): void {
    const { email, password } = this.loginForm.getRawValue();
    if (!email || !password) return;
    this.authStore.resendVerification({ email, password });
  }
}
