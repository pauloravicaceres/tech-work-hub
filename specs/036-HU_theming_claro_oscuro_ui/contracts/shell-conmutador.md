# Contrato: conmutador y superficies del shell

**Archivos**: `app/frontend/src/app/core/layout/layout.component.html|ts`, `layout.texts.ts`, `layout-nav.ts`.

## Conmutador (barra superior)

- Ubicación: plantilla `#end` de `p-menubar`, **antes** del bloque de perfil.
- Elemento: `<p-button>` icon-only, `severity="secondary"`, `[text]="true"`, ícono `pi pi-moon` en claro y `pi pi-sun` en oscuro (según `theme.mode()`), `(onClick)="theme.toggle()"`.
- Nombre accesible: `[ariaLabel]` = `LAYOUT_TEXTS.theme.toDark` en claro y `LAYOUT_TEXTS.theme.toLight` en oscuro (nombra la acción siguiente). Sin `aria-pressed`.
- Teclado: Enter y Espacio lo activan; alcanzable por Tab.
- No remonta el shell ni el `router-outlet`: foco, texto escrito en formularios y desplazamiento se conservan.
- A 768 px la barra no desborda.

## Región de anuncio

- `role="status"` con clase `sr-only`, dentro de `LayoutComponent`.
- Vacía al cargar; se llena con `LAYOUT_TEXTS.theme.announcedDark|announcedLight` solo tras una activación.

## Superficies (solo tokens semánticos)

| Elemento | Clases |
|---|---|
| Raíz (`div`) | `min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-color` |
| Pie | `bg-surface-0 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700`; texto secundario `text-muted-color` |
| Contenedores propios del shell | `bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700` |
| `main` | exactamente `max-w-7xl mx-auto p-6` (sin clases nuevas) |
| Entrada activa de navegación | `font-semibold` + `bg-surface-200 dark:bg-surface-700` por `styleClass`/`linkClass` del `MenuItem`; esquinas `0.5rem` por `navigation.item.borderRadius` del preset |

Si ningún elemento de `p-menu` admite el fondo con esquinas redondeadas sin CSS propio, se detiene la implementación y se devuelve el turno al SA (sin `::ng-deep` ni `.scss`).

## Textos (`LAYOUT_TEXTS.theme`)

`toDark`, `toLight`, `announcedDark`, `announcedLight` (español).
