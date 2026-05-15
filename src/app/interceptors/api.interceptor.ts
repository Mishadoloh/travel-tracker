import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log errors for debugging, but let services handle the UI feedback
      // to allow for silent fallbacks and mirror rotations.
      console.warn('API Error Intercepted:', error.url, error.status);
      return throwError(() => error);
    })
  );
};
