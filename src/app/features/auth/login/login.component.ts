import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@store/auth.store';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

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
export class LoginComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  protected authStore = inject(AuthStore);
  hidePassword = signal(true);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    if (environment.devCredentials) {
      this.loginForm.setValue({
        email: environment.devCredentials.email,
        password: environment.devCredentials.password,
        rememberMe: false,
      });
      this.onSubmit();
      return;
    }
    const rememberedEmail = this.authService.getRememberedEmail();
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
    }
  }

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
