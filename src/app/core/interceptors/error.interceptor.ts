import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        authService.logout();
      } else {
        const message = error.error?.message ?? error.message ?? 'An unexpected error occurred';
        notification.error(message);
      }
      return throwError(() => error);
    }),
  );
};
