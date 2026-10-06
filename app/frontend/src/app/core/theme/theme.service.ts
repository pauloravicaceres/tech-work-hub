import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export const THEME_STORAGE_KEY = 'app-theme-mode';
export const THEME_MODES = ['light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const DARK_CLASS = 'app-dark';
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

const isThemeMode = (value: unknown): value is ThemeMode => THEME_MODES.some((mode) => mode === value);

/** Elección guardada; cualquier valor inválido o un almacenamiento inaccesible equivale a «sin elección». */
function readStoredChoice(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Modo claro/oscuro de la aplicación (HU-036). La clase `app-dark` y `color-scheme` de `<html>` se
 * escriben de forma síncrona (sin `effect()`); el modo nunca depende del DOM.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly choice = signal<ThemeMode | null>(readStoredChoice());
  private readonly systemQuery = typeof window.matchMedia === 'function' ? window.matchMedia(SYSTEM_DARK_QUERY) : null;
  private readonly systemDark = signal(this.systemQuery?.matches ?? false);

  /** Modo efectivo: la elección del usuario o, sin ella, la preferencia del sistema. */
  readonly mode = computed<ThemeMode>(() => this.choice() ?? (this.systemDark() ? 'dark' : 'light'));

  constructor() {
    this.apply();
    const query = this.systemQuery;
    if (query) {
      const onChange = (event: MediaQueryListEvent): void => {
        this.systemDark.set(event.matches);
        if (this.choice() === null) this.apply();
      };
      query.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
    }
  }

  /** Cambia al modo contrario al efectivo, intenta guardarlo y lo aplica en el mismo turno. */
  toggle(): void {
    const next: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.choice.set(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Almacenamiento bloqueado: el modo sigue vigente durante la sesión, sin avisar al usuario (FR-011).
    }
    this.apply();
  }

  private apply(): void {
    const mode = this.mode();
    const root = document.documentElement;
    root.classList.toggle(DARK_CLASS, mode === 'dark');
    root.style.colorScheme = mode;
  }
}
