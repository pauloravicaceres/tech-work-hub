import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const WIDE_QUERY = '(min-width: 1024px)';

/** Ancho de viewport como signal: `true` desde 1024 px (o si `matchMedia` no existe). */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly _isWide = signal(true);
  readonly isWide = this._isWide.asReadonly();

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(WIDE_QUERY);
    this._isWide.set(query.matches);
    const onChange = (event: MediaQueryListEvent): void => this._isWide.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }
}
