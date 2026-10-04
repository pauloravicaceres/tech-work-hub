import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API_PREFIX = '/api/';

const withBearer = (req: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * Añade `Authorization: Bearer` a las llamadas a `/api/**`. Ante un 401 intenta renovar el token
 * una vez y reintenta; si la renovación falla propaga el 401 original para que la UI reautentique.
 */
export const bearerTokenInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) => {
  if (!req.url.startsWith(API_PREFIX)) return next(req);

  const auth = inject(AuthService);
  const token = auth.token;
  if (!token) return next(req);

  return next(withBearer(req, token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);

      return from(auth.refreshToken()).pipe(
        switchMap((renewed) => next(withBearer(req, renewed))),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
