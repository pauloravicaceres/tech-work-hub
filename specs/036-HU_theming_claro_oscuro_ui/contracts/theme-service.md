# Contrato: ThemeService y script anti-parpadeo

**Archivo**: `app/frontend/src/app/core/theme/theme.service.ts`

## Constantes exportadas

| Nombre | Valor |
|---|---|
| `THEME_STORAGE_KEY` | `'app-theme-mode'` |
| `THEME_MODES` | `['light', 'dark']` |

## API pública

| Miembro | Tipo | Comportamiento |
|---|---|---|
| `mode` | `Signal<'light' \| 'dark'>` (solo lectura, `computed`) | `choice() ?? (systemDark() ? 'dark' : 'light')` |
| `toggle()` | `void` | Calcula el modo contrario al efectivo, lo guarda en `choice`, intenta `localStorage.setItem` (fallo silencioso) y llama a `apply()` en el mismo turno |

## Efectos sobre el DOM (`apply()`)

- `document.documentElement.classList.toggle('app-dark', mode === 'dark')`
- `document.documentElement.style.colorScheme = mode`

## Matriz de comportamiento (obligatoria en `theme.service.spec.ts`)

| Almacenamiento | Sistema | Modo inicial |
|---|---|---|
| ausente | claro / oscuro / sin `matchMedia` | claro / oscuro / claro |
| `light` / `dark` | cualquiera | el guardado |
| valor inválido | claro / oscuro | el del sistema; el valor no se borra |
| `getItem` lanza | cualquiera | el del sistema, sin error |
| `setItem` lanza (en `toggle()`) | cualquiera | el modo cambia durante la sesión, sin error ni elemento de error |

- Con elección válida el evento `change` de `matchMedia` se ignora; sin ella se sigue.
- El listener se libera con `DestroyRef`.
- Se instancia en un `provideAppInitializer` declarado **antes** del de `AuthService`.

## Script de `index.html`

- `<script>` clásico (sin `async`, `defer` ni `type="module"`), en `<head>`, **antes** de cualquier `<link rel="stylesheet">` y de `<app-root>`.
- Lee `app-theme-mode` en `try/catch`; valida contra `light`/`dark`; si no hay valor válido usa `matchMedia('(prefers-color-scheme: dark)')`; aplica `app-dark` y `colorScheme`.
- Sin colores literales; sin `eval`, `innerHTML` ni `Function`.
- Acompañado de `<meta name="color-scheme" content="light dark">`.
- Debe producir el **mismo modo** que `ThemeService` para toda la matriz anterior.
