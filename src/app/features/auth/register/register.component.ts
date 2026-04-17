import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@store/auth.store';
import { passwordMatchValidator } from '@shared/utils/form-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private fb = inject(NonNullableFormBuilder);
  protected authStore = inject(AuthStore);
  hidePassword = signal(true);
  hideConfirm = signal(true);

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordMatchValidator });

  passwordStrength = computed(() => {
    const pw = this.registerForm.get('password')?.value ?? '';
    if (pw.length === 0) return { level: 0, label: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: 'Weak' };
    if (score <= 2) return { level: 2, label: 'Fair' };
    if (score <= 3) return { level: 3, label: 'Good' };
    return { level: 4, label: 'Strong' };
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { confirmPassword, ...payload } = this.registerForm.getRawValue();
      this.authStore.register(payload);
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
