---

description: "Lista de tareas de la HU-036 — Theming claro/oscuro"
---

# Tasks: Theming de la Aplicación — Modo Claro y Oscuro

**Input**: Documentos de diseño en `/specs/036-HU_theming_claro_oscuro_ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (`theme-service.md`, `lint-gobernanza.md`, `shell-conmutador.md`), quickstart.md

**Tests**: Incluidos. El plan exige specs (`app-theme.spec.ts`, `contrast.spec.ts`, `theme.service.spec.ts`, `index-html.spec.ts`, `lint-gobernanza.spec.ts`) y la spec FR-012/FR-015/FR-020 exige verificación automática. Escribirlos primero y confirmar que fallan.

**Organization**: Tareas agrupadas por historia de usuario. Todas las rutas son relativas a la raíz del repositorio y llevan prefijo `app/frontend/` (Constitución).

## Format: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia a la que pertenece (US1..US6)

## Restricciones transversales (aplican a TODAS las tareas)

- Colores literales **solo** en `app/frontend/src/app/core/theme/app-theme.ts`.
- Prohibido: `::ng-deep`, `!important`, sombras personalizadas, fuentes externas, estilos de color inline, clases de paleta de Tailwind (`bg-red-500`…).
- No tocar: `app/backend/`, `app/template-primeng/`, `specs/evidences/`, rutas (`app.routes.ts`), `core/auth/`.
- Todos los textos visibles en español y en `layout.texts.ts`.
- Comandos desde `app/frontend/`: `npm test`, `npm run build`, `npm run lint:primeng`.

---

## Phase 1: Setup

**Purpose**: línea base y estructura

- [X] T001 Ejecutar en `app/frontend/` `npm test`, `npm run build` y `npm run lint:primeng`; registrar que los tres terminan en verde (línea base antes de tocar código).
- [X] T002 [P] Crear la carpeta `app/frontend/src/app/core/theme/` y la carpeta de evidencias `specs/036-HU_theming_claro_oscuro_ui/evidence/` (con `.gitkeep`).

---

## Phase 2: Foundational (bloqueante)

**Purpose**: utilidad de contraste y escalas primitivas que usan todas las historias

**⚠️ CRÍTICO**: ninguna historia puede comenzar hasta terminar esta fase.

- [X] T003 [P] Crear `app/frontend/src/app/core/theme/contrast.spec.ts` (primero, debe fallar): `contrastRatio('#ffffff','#000000') === 21`, `contrastRatio('#ffffff','#ffffff') === 1`, simetría de argumentos, y ratio de `#ffffff` sobre `#0092b8` ≈ 3.62 (±0.01).
- [X] T004 Implementar `app/frontend/src/app/core/theme/contrast.ts` exportando `contrastRatio(fg: string, bg: string): number` (luminancia relativa WCAG 2.1, acepta `#rrggbb`; función pura **sin colores literales**). Debe pasar T003.
- [X] T005 Convertir a hex (una sola vez) las escalas `cyan`, `red` y `surface`/gris de `node_modules/tailwindcss/theme.css` (Tailwind 4.3.3, `oklch`) y pegarlas como literales en `app/frontend/src/app/core/theme/app-theme.ts`, dentro de `definePreset(Aura, { primitive: { cyan: {...}, red: {...} }, ... })` exportado como `appThemePreset`. Anclajes que deben reproducirse exactamente: gray-50 `#f9fafb`, gray-200 `#e5e7eb`, gray-400 `#99a1af`, gray-500 `#6a7282`, gray-700 `#364153`, gray-800 `#1e2939`, gray-900 `#101828`, cyan-500 `#00b8db`, cyan-600 `#0092b8`, cyan-700 `#007595`, red-500 `#fb2c36`. No referenciar `{cyan.600}`, `{gray.500}`, `{red.500}` de Aura (R-01); declarar las escalas completas.
- [X] T006 [P] Crear `app/frontend/src/app/core/theme/app-theme.spec.ts` con la verificación de los anclajes de T005 sobre `appThemePreset.primitive` (falla si algún peldaño difiere).

**Checkpoint**: base lista; las historias pueden comenzar.

---

## Phase 3: User Story 1 - Identidad visual propia en modo claro (Priority: P1) 🎯 MVP

**Goal**: paleta y radios de las maquetas en modo claro en toda la app.

**Independent Test**: con modo claro, medir fondo de página, tarjeta, navegación, barra, pie, bordes, textos y botón primario contra la tabla de tokens; radios 0.75rem / 0.5rem.

### Tests for User Story 1

- [X] T007 [US1] Ampliar `app/frontend/src/app/core/theme/app-theme.spec.ts` (debe fallar antes de implementar): asserts del modo claro — primario `#0092b8` con etiqueta `#ffffff`; fondo de página `#f9fafb`; tarjeta/menú/menubar/pie `#ffffff`; borde `#e5e7eb`; navegación activa `#e5e7eb`; texto principal `#1e2939`; texto secundario `#6a7282`; peligro `#fb2c36`; enlace `#007595`; radios `0.75rem` en contenedores (card, dialog, etc.), `0.5rem` en controles y botones, `0` en `menubar` y `menu`, `0.5rem` en `navigation.item.borderRadius`.

### Implementation for User Story 1

- [X] T008 [US1] En `app/frontend/src/app/core/theme/app-theme.ts` definir `semantic.primary` (escala cyan), `semantic.colorScheme.light` (surface 0 `#ffffff`, 50 `#f9fafb`, 200 `#e5e7eb`, textos, primario `{primary.600}` en `primary.color`, foco, **y `formField.borderColor` y `formField.hoverBorderColor` = `{surface.500}` por ADR-012 (borde de campo ≥ 3:1)**) y los radios (`semantic.borderRadius`/`formField.borderRadius`/`navigation.item.borderRadius`, `menubar` y `menu` en `0`). Pasa T007.
- [X] T009 [US1] En `app/frontend/src/app/core/theme/app-theme.ts` añadir `components.button.colorScheme.light`: variante `text`/`outlined`/`link` con `{primary.700}` (`#007595`) y `outlined.danger` con color y borde `{red.500}` (`#fb2c36`) sobre fondo transparente (FR-005, FR-006, R-02).
- [X] T010 [US1] En `app/frontend/src/app/app.config.ts` reemplazar `import Aura from '@primeuix/themes/aura'` por `import { appThemePreset } from './core/theme/app-theme'` y usarlo como `preset` en `providePrimeNG`, conservando `cssLayer: { name: 'primeng', order: 'theme, base, primeng' }`. No añadir `darkModeSelector` todavía.
- [X] T011 [US1] En `app/frontend/src/app/core/layout/layout.component.html` aplicar superficies solo con tokens semánticos y `dark:` (contrato `shell-conmutador.md`): raíz `min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-color`; `<footer>` con `bg-surface-0 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 text-muted-color`; `<aside>` con `bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700`. `<main>` debe quedar exactamente `max-w-7xl mx-auto p-6`. Mantener `p-4 text-center` del pie.
- [X] T012 [US1] Entrada activa de navegación: en `app/frontend/src/app/core/layout/layout-nav.ts` (y en `layout.component.ts` si hace falta calcular el módulo activo con `resolveActiveModule`) asignar a la entrada activa `styleClass`/`linkClass` = `font-semibold bg-surface-200 dark:bg-surface-700`. Si `p-menu` no permite fondo con esquinas redondeadas sin CSS propio, **detenerse** y reportar al SA (no usar `::ng-deep` ni `.scss`).
- [X] T013 [US1] Actualizar `app/frontend/src/app/core/layout/layout.component.spec.ts` y `layout-nav.spec.ts` con aserciones de las clases de T011/T012 (raíz, pie, `main` exacto, entrada activa solo en el módulo actual).
- [X] T014 [US1] Ejecutar `npm test`, `npm run build`, `npm run lint:primeng` en `app/frontend/`; todo en verde (incluidas `hu035-contrato-estilos.qa.spec.ts` y `layout.qa.spec.ts`).

**Checkpoint**: modo claro completo y testeable sin conmutador.

---

## Phase 4: User Story 2 - Conmutador claro/oscuro (Priority: P1)

**Goal**: modo oscuro con la paleta de las maquetas y conmutador accesible en la barra superior.

**Independent Test**: con formulario a medio llenar, activar el conmutador → cambia toda la pantalla sin recarga, sin cambio de ruta y sin perder lo escrito; activarlo otra vez vuelve al modo anterior.

### Tests for User Story 2

- [X] T015 [P] [US2] Ampliar `app/frontend/src/app/core/theme/app-theme.spec.ts` (debe fallar): modo oscuro — primario `#00b8db` con etiqueta `#ffffff`; fondo `#101828`; tarjeta/menú/menubar/pie `#1e2939`; borde `#364153`; navegación activa `#364153`; texto principal `#e5e7eb`; secundario `#99a1af`; peligro `#fb2c36`; enlace `#00b8db`; fondo de campo `#1e2939`.
- [X] T016 [P] [US2] Crear `app/frontend/src/app/core/theme/theme.service.spec.ts` (debe fallar) con la matriz de `contracts/theme-service.md` **solo para `toggle()` y `mode`**: modo inicial por sistema claro/oscuro; `toggle()` alterna `mode`, añade/quita la clase `app-dark` en `document.documentElement` y fija `style.colorScheme` **en el mismo turno síncrono**; dos `toggle()` vuelven al modo anterior.
- [X] T017 [P] [US2] Ampliar `app/frontend/src/app/core/layout/layout.component.spec.ts` (debe fallar): existe un `p-button` con `ariaLabel` = `LAYOUT_TEXTS.theme.toDark` en claro y `toLight` en oscuro, ícono `pi-moon`/`pi-sun`, ubicado en la plantilla `#end` antes del bloque de perfil; sin `aria-pressed`; región `role="status"` con clase `sr-only` vacía al cargar y que se llena con `announcedDark`/`announcedLight` solo tras activar; activar el conmutador no remonta `router-outlet` ni borra el valor de un input.

### Implementation for User Story 2

- [X] T018 [US2] En `app/frontend/src/app/core/theme/app-theme.ts` añadir `semantic.colorScheme.dark` (surface invertida: página `{surface.900}`, tarjeta `{surface.800}`, borde `{surface.700}`, textos `#e5e7eb`/`#99a1af`, `primary.color` `{primary.500}`, campo de formulario `#1e2939`, **y `formField.borderColor` y `formField.hoverBorderColor` = `{surface.400}` por ADR-012 (borde de campo ≥ 3:1)**) y `components.button.colorScheme.dark` (`text`/`outlined`/`link` con `{primary.500}`, `outlined.danger` `{red.500}`). Pasa T015.
- [X] T019 [US2] En `app/frontend/src/app/app.config.ts` añadir `darkModeSelector: '.app-dark'` a `theme.options` de `providePrimeNG`.
- [X] T020 [US2] Añadir al final de `app/frontend/src/styles.css` únicamente `@custom-variant dark (&:where(.app-dark, .app-dark *));` (no tocar el resto).
- [X] T021 [US2] Crear `app/frontend/src/app/core/theme/theme.service.ts`: `@Injectable({ providedIn: 'root' })`, exporta `THEME_STORAGE_KEY = 'app-theme-mode'` y `THEME_MODES = ['light','dark'] as const`; signals `choice` (`'light'|'dark'|null`), `systemDark` (boolean) y `mode = computed(() => choice() ?? (systemDark() ? 'dark' : 'light'))` (solo lectura); `toggle()` calcula el modo contrario al efectivo, lo guarda en `choice` y llama `apply()` síncrono (sin `effect()`, R-04); `apply()` hace `document.documentElement.classList.toggle('app-dark', mode === 'dark')` y `style.colorScheme = mode`. En esta tarea la lectura inicial usa solo `matchMedia` (si falta → claro). Pasa T016.
- [X] T022 [US2] En `app/frontend/src/app/app.config.ts` registrar `provideAppInitializer(() => { inject(ThemeService); })` **antes** del initializer de `AuthService`, para aplicar el modo antes de la autenticación.
- [X] T023 [US2] En `app/frontend/src/app/core/layout/layout.texts.ts` añadir `theme: { toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro', announcedDark: 'Modo oscuro activado', announcedLight: 'Modo claro activado' }`.
- [X] T024 [US2] En `app/frontend/src/app/core/layout/layout.component.ts` inyectar `ThemeService` (`readonly theme`) y un signal `themeAnnouncement` (vacío al inicio) que `onThemeToggle()` rellena con `announcedDark`/`announcedLight` tras llamar `theme.toggle()`.
- [X] T025 [US2] En `app/frontend/src/app/core/layout/layout.component.html`, dentro de `<ng-template #end>` y **antes** del bloque de perfil, añadir `<p-button [icon]="theme.mode() === 'dark' ? 'pi pi-sun' : 'pi pi-moon'" severity="secondary" [text]="true" [ariaLabel]="theme.mode() === 'dark' ? texts.theme.toLight : texts.theme.toDark" (onClick)="onThemeToggle()" />`; y, dentro del `div` raíz, `<div role="status" class="sr-only">{{ themeAnnouncement() }}</div>`. Sin `aria-pressed`. Pasa T017.
- [X] T026 [US2] Ejecutar `npm test`, `npm run build`, `npm run lint:primeng`; en verde.

**Checkpoint**: US1 + US2 forman el MVP inseparable.

---

## Phase 5: User Story 3 - Recordar la elección y respetar el sistema (Priority: P2)

**Goal**: persistencia en `localStorage`, seguimiento de `prefers-color-scheme`, tolerancia a fallos y sin parpadeo.

**Independent Test**: elegir modo, recargar → se conserva; borrar la elección → sigue al sistema; valor inválido o almacenamiento bloqueado → sin errores.

### Tests for User Story 3

- [X] T027 [P] [US3] Completar `app/frontend/src/app/core/theme/theme.service.spec.ts` (debe fallar) con toda la matriz de `contracts/theme-service.md`: almacenamiento ausente × sistema claro/oscuro/sin `matchMedia`; `light`/`dark` guardado × cualquier sistema; valor inválido (no se borra) × sistema; `getItem` lanza; `setItem` lanza en `toggle()` (el modo cambia, sin error); `toggle()` guarda en `app-theme-mode`; el evento `change` de `matchMedia` se ignora con elección válida y se sigue sin ella; el listener se libera al destruir (`DestroyRef`).
- [X] T028 [P] [US3] Crear `app/frontend/src/app/core/theme/index-html.spec.ts` (debe fallar): lee `app/frontend/src/index.html`, comprueba que el `<script>` anti-parpadeo es clásico (sin `async`/`defer`/`type="module"`), está en `<head>` antes de cualquier `<link rel="stylesheet">` y de `<app-root>`, que existe `<meta name="color-scheme" content="light dark">`, que no contiene `eval`/`innerHTML`/`Function` ni colores literales; ejecuta el script en jsdom con la misma matriz de T027 y exige que el resultado (`app-dark`, `colorScheme`) coincida con el de `ThemeService`.

### Implementation for User Story 3

- [X] T029 [US3] Completar `app/frontend/src/app/core/theme/theme.service.ts`: leer `localStorage[THEME_STORAGE_KEY]` en `try/catch`, ignorar valores distintos de `light`/`dark` (sin borrarlos); `toggle()` intenta `setItem` en `try/catch` silencioso y mantiene `choice` en memoria; suscribirse a `matchMedia('(prefers-color-scheme: dark)')` (si no existe `matchMedia` → `systemDark=false`, sin listener); en `change`, actualizar `systemDark` y llamar `apply()` solo si no hay elección; liberar el listener con `DestroyRef`. Ningún mensaje de error al usuario. Pasa T027.
- [X] T030 [US3] En `app/frontend/src/index.html`, dentro de `<head>`, **antes de cualquier hoja de estilos**, añadir `<meta name="color-scheme" content="light dark">` y un `<script>` clásico síncrono que lea `app-theme-mode` en `try/catch`, valide contra `light`/`dark`, caiga a `matchMedia('(prefers-color-scheme: dark)')` si no hay valor válido, y aplique `classList.toggle('app-dark', …)` y `style.colorScheme` sobre `document.documentElement`. Sin colores literales. Pasa T028.
- [X] T031 [US3] Ejecutar `npm test` y `npm run build`; en verde.

**Checkpoint**: elección persistente, tolerante a fallos y sin parpadeo.

---

## Phase 6: User Story 4 - Texto y controles legibles en ambos modos (Priority: P2)

**Goal**: contraste ≥ 4.5:1 texto y ≥ 3:1 componentes, salvo las excepciones E-01..E-09.

**Independent Test**: `npm test -- contrast app-theme` pasa y falla si algún par queda bajo umbral fuera de tabla.

### Tests for User Story 4

- [X] T032 [US4] Crear `app/frontend/src/app/core/theme/app-theme-contrast.spec.ts`: tabla de pares **independiente del preset** escrita desde `spec.md` (modo, primer plano, fondo, tipo texto/componente, excepción opcional); resolver los tokens del `appThemePreset` real para cada par y comprobar con `contrastRatio` (T004) umbral 4.5 (texto) / 3 (componente) o, si hay excepción, ratio igual al declarado (±0.01): E-01 3.62, E-02 2.60, E-03 2.37, E-04 3.81, E-05 3.85, E-06 3.91, E-07 3.96, E-08 1.24, E-09 1.42. Incluir el borde de campo de formulario ≥ 3:1 sin usar E-08/E-09 (ADR-012), el marcador `#99a1af` sobre campo oscuro `#1e2939` ≥ 4.5 (5.63) y el texto de enlace en ambos modos. Falla si la tabla no cubre todos los roles de texto y de control.

### Implementation for User Story 4

- [X] T033 [US4] Si T032 revela pares fuera de umbral y fuera de la tabla, corregir **solo** `app/frontend/src/app/core/theme/app-theme.ts` (red de seguridad: el borde de campo de ADR-012 ya está fijado en T008 y T018; el enlace es `{primary.700}`/`{primary.500}`); repetir hasta que T032 pase. No agregar excepciones nuevas: si un par no se puede corregir, detener y devolver al humano (ratificación de excepciones, research R-10).

**Checkpoint**: SC-004 verificado automáticamente.

---

## Phase 7: User Story 5 - Gobernanza: el tema como única fuente de colores (Priority: P2)

**Goal**: `lint:primeng` rechaza colores y utilidades de color fuera del tema, indicando archivo y línea.

**Independent Test**: `npm run lint:primeng` pasa sobre el código real; con una violación inyectada falla con `archivo:línea`.

### Tests for User Story 5

- [X] T034 [US5] Crear `app/frontend/src/app/core/theme/lint-gobernanza.spec.ts` (debe fallar): con `LINT_ROOT` apuntando a un directorio temporal, ejecutar `node scripts/lint-primeng.mjs` (`child_process`): archivo limpio → código 0; cada violación inyectada → código ≠ 0 e imprime archivo y línea: `#fff` en `.ts`; `bg-red-500` en `.html`; `style="color: red"`; `el.style.color = 'red'` en `.ts`; `.scss` con `border`; `bg-surface-100` en una página (`features/`); `rounded-lg` en `core/layout/`. Casos que **no** deben fallar: `document.documentElement.style.colorScheme = 'dark'` (en `.ts` y en `index.html`), `getColor(x)` y `.color(` en `.ts`, un `.html` con referencias `#end`/`#add`, `[style]="{ width: '100%' }"` y `[rounded]="true"`. **Esta spec usa solo directorios temporales: no comprueba el código real** (eso va en T043/T044, tras T037 y T038).

### Implementation for User Story 5

- [X] T035 [US5] En `app/frontend/scripts/lint-primeng.mjs` añadir soporte de `LINT_ROOT` (raíz alterna de `src/`, por defecto el actual) y las reglas 1–5 de `contracts/lint-gobernanza.md`, reutilizando `stripComments` y excluyendo `*.spec.ts`: (1) literales de color (`#rgb/#rgba/#rrggbb/#rrggbbaa` con `\b`, y las funciones `rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color` con `(?<![\w$.-])` antes del nombre) en `.ts/.css/.scss/.html` salvo `src/app/core/theme/app-theme.ts` (en `.html` solo valores de atributo y bloques `<style>`; incluir `index.html`); (2) clases de paleta de Tailwind; (3) estilos de color en línea sobre propiedades concretas (`color`, `background*`, `border*`, `outline*`, `box-shadow`, `text-shadow`, `fill`, `stroke`, `accent-color`, `caret-color` en `style=`, `[style]`, `[style.x]`, `[ngStyle]`; y `\.style\.(?:color|background\w*|border\w*|outline\w*|boxShadow|textShadow|fill|stroke|accentColor|caretColor)\b` en `.ts`/`index.html`), **exentando `color-scheme`/`style.colorScheme`** y permitiendo `[style]="{ width: '100%' }"`; (4) declaraciones de color/borde/sombra en `.scss`/`.css` distintos de `src/styles.css`; (5) utilidades `bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`, `text-color`, `dark:*`, `rounded*`, `shadow*` fuera de `src/app/core/layout/` cuando aparecen como clase (`class`, `styleClass`, `*Class`, `[class.*]`, `[ngClass]`), prohibiendo `rounded*`/`shadow*` también dentro del shell y permitiendo `[rounded]="true"` de `p-button`. Conservar las reglas existentes (`::ng-deep`, `!important`, `ed-grid`, imports retirados, declaración tipográfica única). Cada violación imprime `archivo:línea` y el proceso termina con `process.exit(1)`. Pasa T034.
- [X] T036 [US5] Ejecutar `npm run lint:primeng` sobre el código real; la regla 5 marcará los dos hallazgos de ADR-010 hasta completar T037 y T038. Cualquier otra violación en `features/**` se detiene y se reporta (no se corrige sin autorización).

**Checkpoint**: gobernanza activa (SC-005).

---

## Phase 8: User Story 6 - Pantallas existentes sin regresión y cierre verificado (Priority: P1)

**Goal**: Backlog, Sprints y Equipo conservan contenido, rutas y comportamiento en ambos modos; evidencia de cierre.

**Independent Test**: las 3 pantallas en ambos modos sin elementos ilegibles; verificaciones en verde y 6 capturas.

### Implementation for User Story 6

- [X] T037 [P] [US6] En `app/frontend/src/app/features/teams/components/item-assignees-view/item-assignees-view.component.html` (línea ~46) reemplazar `[class.bg-surface-100]="assignee.id === highlightedMemberId()"` por `[class.p-datatable-row-selected]="assignee.id === highlightedMemberId()"` (ADR-010 punto 1; la clase existe en `primeng@22.1.2`).
- [X] T038 [P] [US6] En `app/frontend/src/app/features/backlog/components/create-backlog-item/create-backlog-item.component.html` (línea ~82) retirar la clase `text-muted-color` del `<small class="block text-muted-color">` dejando `class="block"` (ADR-010 punto 2). No tocar los 5 `[style]="{ width }"` ni `[rounded]="true"`.
- [X] T039 [US6] Actualizar el spec existente de `item-assignees-view` (mismo directorio, `*.component.spec.ts`) para aseverar que la fila resaltada usa `p-datatable-row-selected` y no `bg-surface-100`; ajustar el spec de `create-backlog-item` si aseveraba `text-muted-color`.
- [X] T040 [US6] Verificar que `git diff --stat` sobre el backend, la plantilla antigua `app/template-primeng` y `specs/evidences` está vacío (sin ningún cambio) y que en `app/frontend/src/app/features/**` solo cambiaron T037 y T038.
- [X] T041 [US6] Levantar `npm start` (con backend/Keycloak por `docker-compose`) y validar manualmente según `quickstart.md` §3–§5: conmutador sin pérdida de datos, persistencia, preferencia del sistema, almacenamiento inválido/bloqueado, teclado y lector, sin parpadeo con modo oscuro guardado, barra superior sin desborde a 768 px, diálogos (registro de miembro, asignación a Sprint) y `p-toast` legibles en ambos modos, radios correctos. Corregir hallazgos solo en `app-theme.ts` o en el shell.
- [X] T042 [US6] Capturar a 1920 px de ancho las 6 pantallas en `specs/036-HU_theming_claro_oscuro_ui/evidence/`: `backlog-claro.png`, `backlog-oscuro.png`, `sprints-claro.png`, `sprints-oscuro.png`, `equipo-claro.png`, `equipo-oscuro.png`; cada una con barra superior (con conmutador), navegación lateral, contenido y pie. Comparar roles 1–8 con `specs/evidences/claro.png` y `oscuro.png` y el enlace contra la tabla (`#007595` claro, `#00b8db` oscuro).

**Checkpoint**: sin regresiones y evidencia entregada.

---

## Phase 9: Polish & cierre

- [X] T043 Ejecutar en `app/frontend/` `npm run lint:primeng`, `npm run build` y `npm test` finales; los tres en verde y todas las pruebas existentes sin regresión (FR-020, SC-006). Aquí se comprueba además el **código real** (movido desde T034): 0 violaciones de `lint:primeng`, 0 coincidencias de `preline` y 0 importaciones de fuentes externas; solo es alcanzable tras T037 y T038.
- [X] T044 [P] Comprobar con búsqueda que no hay colores literales fuera de `app/frontend/src/app/core/theme/app-theme.ts`, ni coincidencias de `preline`, ni fuentes externas importadas, ni código copiado de `app/template-primeng/` (FR-013, FR-018).
- [X] T045 [P] Dejar anotados para el humano los puntos abiertos que no bloquean (research R-10): ratificar E-03..E-09 y `#007595` en la Constitución, borde de campo ≥ 3:1 (ADR-012), utilidades `text-color` y `sr-only`, fondo de campo oscuro `#1e2939`; añadirlos a una sección «Puntos abiertos» al final de `specs/036-HU_theming_claro_oscuro_ui/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → historias.
- **US1 (3)** depende de Fase 2. **US2 (4)** depende de US1 (reutiliza preset y shell). **US3 (5)** depende de US2 (completa `ThemeService`). **US4 (6)** depende de US1 y US2 (necesita ambos modos). **US5 (7)**: T034–T035 son independientes del tema visual; T036 se ejecuta tras T037–T038. **US6 (8)** depende de US1–US3.
- **Polish (9)** depende de todo lo anterior.

### Dentro de cada historia

- Specs primero (deben fallar) → implementación → ejecutar `npm test/build/lint`.
- `app-theme.ts` es un solo archivo: T005, T008, T009, T018, T033 son secuenciales entre sí.
- `layout.component.html/ts` y `app.config.ts` se editan en varias historias: secuenciales.

### Parallel Opportunities

- Fase 2: T003 ∥ T006 (T004 tras T003; T005 antes de que T006 pase).
- US2: T015 ∥ T016 ∥ T017 (specs de archivos distintos).
- US3: T027 ∥ T028.
- US6: T037 ∥ T038.
- US5 (T034–T035) puede avanzar en paralelo con US3/US4 por otra persona: solo toca `scripts/lint-primeng.mjs` y `lint-gobernanza.spec.ts`.

### Ejemplo paralelo: User Story 2

```text
Task: "T015 Ampliar app-theme.spec.ts con valores del modo oscuro"
Task: "T016 Crear theme.service.spec.ts (toggle y mode)"
Task: "T017 Ampliar layout.component.spec.ts (conmutador y región de anuncio)"
```

---

## Implementation Strategy

### MVP primero (US1 + US2)

1. Fase 1 → Fase 2.
2. US1 (modo claro) → validar.
3. US2 (oscuro + conmutador) → **DETENERSE y validar** el MVP inseparable (SC-001, SC-002).

### Entrega incremental

1. + US3 (persistencia, sin parpadeo).
2. + US4 (contraste automatizado).
3. + US5 (gobernanza en lint).
4. + US6 (limpieza ADR-010, verificación manual y 6 capturas) → cierre.

---

## Notes

- `[P]` = archivos distintos y sin dependencias pendientes.
- Verificar que los specs fallan antes de implementar.
- El Watcher es el único controlador de Git (Constitución): no ejecutar comandos transaccionales de Git.
- Evitar: tareas vagas, conflictos en el mismo archivo, dependencias entre historias que rompan su independencia.

---

## Phase 10: Convergence

- [X] T046 [fix:TASKS:DEF-01] [interfaz] CRITICAL/HIGH: cerrar T041 y T042 con la pila levantada (`npm start`, backend y Keycloak por `docker-compose`): ejecutar la validación manual de `quickstart.md` §3–§5, guardar las 6 capturas a 1920 px (`backlog-claro.png`, `backlog-oscuro.png`, `sprints-claro.png`, `sprints-oscuro.png`, `equipo-claro.png`, `equipo-oscuro.png`) en `specs/036-HU_theming_claro_oscuro_ui/evidence/` y marcar T041 y T042 como [X] solo con las capturas presentes. Sin cambios de código salvo hallazgos en `app-theme.ts` o el shell. Per FR-020, SC-007, US6/AC3, US6/AC5 (missing)
