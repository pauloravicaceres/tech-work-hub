# Research: Theming claro/oscuro (HU-036)

Todas las incógnitas del Technical Context quedan resueltas. Las decisiones de arquitectura completas (MADR) están en `documents/solutions-architect/036-theming-claro-oscuro-ui.md`; aquí se registra lo verificado contra el repositorio instalado.

## R-01 · Paletas primitivas de Aura vs. valores de la Constitución

- **Verificado** en `@primeuix/themes@3.0.1`: Aura trae `cyan.600 = #0891b2`, `cyan.500 = #06b6d4`, `cyan.700 = #0e7490`, `red.500 = #ef4444`. La Constitución fija `#0092b8` (cyan-600 de Tailwind v4), `#00b8db`, `#007595`, `#fb2c36` (red-500 v4).
- **Decisión**: el preset declara escalas completas explícitas (`primitive.cyan`, `primitive.red`, `semantic.colorScheme.{light,dark}.surface`) con los valores de Tailwind v4; no se referencian `{cyan.600}`, `{gray.500}`, `{red.500}` de Aura.
- **Rationale**: referenciar la paleta de Aura compila y pinta un color distinto al de la tabla de tokens.
- **Alternativas**: variables `--p-*` en CSS (descartada: colores fuera de `app-theme.ts`, requiere `!important`).
- **Nota de implementación**: `node_modules/tailwindcss/theme.css` (4.3.3) expresa las escalas en `oklch(...)`. Se convierten a hex una sola vez y se pegan como literales en `app-theme.ts`. Valores de anclaje que la conversión debe reproducir: gray-50 `#f9fafb`, gray-200 `#e5e7eb`, gray-400 `#99a1af`, gray-500 `#6a7282`, gray-700 `#364153`, gray-800 `#1e2939`, gray-900 `#101828`, cyan-500 `#00b8db`, cyan-600 `#0092b8`, cyan-700 `#007595`, red-500 `#fb2c36`. La spec de valores falla si algún peldaño difiere.

## R-02 · Un solo token no puede ser a la vez color de botón y de enlace

- **Decisión**: botón primario y foco usan `primary.color` (`{primary.600}` claro / `{primary.500}` oscuro). Texto de acción y enlace usan `{primary.700}` (`#007595`) en claro y `{primary.500}` en oscuro, vía `button.colorScheme.*.text/outlined/link`.
- **Rationale**: `#0092b8` sobre blanco no alcanza 4.5:1 como texto; `#007595` sí.

## R-03 · Modo oscuro: clase `app-dark` y variante Tailwind

- **Decisión**: `darkModeSelector: '.app-dark'` en `providePrimeNG` (se conserva `cssLayer`); `@custom-variant dark (&:where(.app-dark, .app-dark *));` en `styles.css`.
- **Rationale**: PrimeNG y Tailwind conmutan con la misma clase de `<html>`. Constitución, Theme Visual.

## R-04 · Estado del tema: signals, escritura síncrona

- **Decisión**: `ThemeService` (`providedIn: 'root'`) con `choice` (elección), `systemDark` (preferencia del sistema) y `mode` (`computed`). `apply()` escribe la clase `app-dark` y `colorScheme` en `<html>` de forma síncrona dentro de `toggle()` y del listener de `matchMedia`.
- **Alternativa descartada**: `effect()` (en zoneless se programa con la detección de cambios; no es síncrono con el clic).
- **Alternativa descartada**: tercer modo «sistema» (fuera de la HU, D-02 del UX).

## R-05 · Tolerancia a almacenamiento y `matchMedia` ausentes

- **Decisión**: toda lectura/escritura de `localStorage` en `try/catch`; valor distinto de `light`/`dark` se ignora sin borrarlo; sin `matchMedia` → `systemDark = false`, sin listener. Ningún mensaje al usuario (FR-011).

## R-06 · Sin parpadeo antes del primer pintado

- **Verificado**: `index.html` actual no tiene script ni CSP; `AuthService.init()` (Keycloak) bloquea el arranque, así que ningún mecanismo de Angular corre antes del primer pintado.
- **Decisión**: `<script>` clásico síncrono en `<head>` antes de cualquier hoja de estilos, más `<meta name="color-scheme" content="light dark">`. Replica la lógica del servicio sin colores literales; una spec lo ejecuta en jsdom con la misma matriz que el servicio y exige el mismo resultado.
- **Riesgo aceptado**: lógica duplicada; una futura CSP `script-src` exigiría `nonce`/hash.

## R-07 · Conmutador accesible

- **Decisión**: `<p-button>` icon-only (`pi-moon` / `pi-sun`) en la plantilla `#end` de `p-menubar`, antes del bloque de perfil; `ariaLabel` describe la acción siguiente; sin `aria-pressed`; región `role="status"` `sr-only` que se llena solo tras una activación.
- **Alternativa descartada**: `p-toggleswitch` (más ancho a 768 px, exige etiqueta asociada).

## R-08 · Fondo de página y texto base

- **Verificado**: `styles.css` solo puede añadir `@custom-variant dark` y la tipografía; las páginas no llevan color.
- **Decisión**: el `div` raíz de `LayoutComponent` suma `bg-surface-50 dark:bg-surface-900 text-color`; pie y contenedores del shell usan `bg-surface-0 dark:bg-surface-800` y `border-surface-200 dark:border-surface-700`. `main` conserva exactamente `max-w-7xl mx-auto p-6` (prueba existente).

## R-09 · Gobernanza en `lint:primeng`

- **Verificado**: `scripts/lint-primeng.mjs` ya cubre formularios, `font-family`, `body`, `::ng-deep`, `!important` y `ed-grid`, y tiene `stripComments`.
- **Decisión**: añadir reglas (literales de color, clases de paleta, color inline, `.scss`/`.css` con color/borde/sombra, utilidades de color/radio fuera del shell) y `LINT_ROOT` para probar sin tocar el código real. ESLint/Stylelint descartados (no instalados; conjunto cerrado de reglas).

## R-10 · Estilos propios existentes y puntos para el humano

- **Verificado por auditoría del SA** (2 hallazgos): `item-assignees-view.component.html:46` (`bg-surface-100` en fila resaltada → ilegible en oscuro) y `create-backlog-item.component.html:82` (`text-muted-color` en página).
- **Verificado**: la clase `p-datatable-row-selected` existe en `primeng-table.mjs` de `primeng@22.1.2`.
- **Decisión**: reemplazar el resaltado por `p-datatable-row-selected` y retirar `text-muted-color`; los 5 `[style]="{ width }"` y `[rounded]="true"` no se tocan.
- **Puntos de jurisdicción humana (no bloquean)**: ratificar E-03..E-09 y `#007595` en la Constitución; confirmar borde de campo ≥ 3:1 (ADR-012, se aparta del wireframe); confirmar `sr-only`; fondo del campo oscuro `#1e2939`.

## R-11 · Contraste

- **Decisión**: `contrast.ts` (`contrastRatio`, luminancia relativa WCAG 2.1) y una tabla de pares **independiente del preset** escrita desde la spec; la prueba resuelve los tokens del preset real, exige umbral o ratio declarado (±0.01) y exige que la tabla cubra todos los roles.
