import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  protected simulateDelay<T>(data: T): Observable<T> {
    return of(data).pipe(delay(environment.apiDelay));
  }

  protected simulateError(message: string): Observable<never> {
    return throwError(() => new Error(message)).pipe(delay(environment.apiDelay));
  }
}
