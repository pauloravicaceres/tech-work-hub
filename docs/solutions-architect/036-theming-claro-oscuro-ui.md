# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 06-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/036-theming-claro-oscuro-ui/`, `documents/designer-ux/ux-036-theming-claro-oscuro-ui.md`, la HU `documents/business-analyst/036-theming-claro-oscuro-ui.md`, la enmienda "Theme Visual (HU-036)" y "Shell de Aplicación (HU-035)" de `.specify/memory/constitution.md`, y el estado real de `app/frontend/src` (auditado el 06-10-2026). `plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE; los `Task-THEME-xx` provisionales del UX se reconcilian en §2.
- **Descubrimiento:** No se emite cuestionario. La constitución cubre el stack completo y la HU es solo frontend: sin backend, base de datos, mensajería ni caché. La resolución humana (sin parpadeo, Opción A) ya está incorporada (ADR-006). Los puntos B-01..B-04 del UX y los hallazgos de la auditoría se resuelven o se registran en §11.

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub, plataforma de gestión ágil. Esta HU fija el **Theme Visual** de la aplicación: un preset de PrimeNG con la paleta y los radios de las maquetas, el modo claro/oscuro con conmutador en la barra superior, la persistencia de la elección y las compuertas automáticas que impiden colores fuera del tema.
- **Qué problema resuelve:** Hoy la aplicación usa el preset Aura sin personalizar (`app.config.ts`): no tiene identidad visual ni modo oscuro, y nada impide que una pantalla nueva declare colores propios (FR-001..FR-020, SC-001..SC-007).
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con el shell de HU-035 (`core/layout/`) y con las pantallas de HU-001, HU-003/004 y HU-012/015. Ninguna regla de negocio, API ni contrato de datos cambia (FR-019).
- **Arquitectura general:** SPA Angular 22 Zoneless con Signals. **Cero cambios en backend.** El tema es una capa de presentación: un preset (`definePreset(Aura, …)`), un servicio de tema con signals, un script mínimo en `index.html` que evita el parpadeo, y reglas nuevas en `lint:primeng`.

## 2. Repository Structure
- **Frontend (único alcance):** `app/frontend/`.
  ```text
  app/frontend/
  ├── scripts/lint-primeng.mjs                       ← Task-THEME-09 · reglas de gobernanza del tema (ADR-009)
  └── src/
      ├── index.html                                 ← Task-THEME-06 · script síncrono anti-parpadeo en <head> (ADR-006)
      ├── styles.css                                 ← Task-THEME-05 · SOLO se añade @custom-variant dark (RT-03)
      └── app/
          ├── app.config.ts                          ← Task-THEME-01 · providePrimeNG usa appThemePreset y '.app-dark'; initializer del tema
          ├── core/
          │   ├── theme/
          │   │   ├── app-theme.ts                   ← Task-THEME-01/03/04 · ÚNICO archivo con colores (ADR-003)
          │   │   ├── app-theme.spec.ts              ← Task-THEME-01/07 · valores del preset y contraste (RT-01, RT-02, RT-08)
          │   │   ├── contrast.ts                    ← Task-THEME-07 · función pura de razón de contraste WCAG (sin colores)
          │   │   ├── theme.service.ts               ← Task-THEME-05/06 · modo, persistencia, preferencia del sistema (ADR-005)
          │   │   └── theme.service.spec.ts
          │   └── layout/
          │       ├── layout.component.html|ts       ← Task-THEME-02/05 · conmutador, superficies con tokens, entrada activa
          │       ├── layout.texts.ts                ← Task-THEME-05 · textos del conmutador (ADR-008)
          │       └── layout-nav.ts                  ← Task-THEME-02 · clases de la entrada activa
          └── features/**                            ← Task-THEME-08 · SOLO se eliminan 2 clases de color (ADR-010)
  ```
- **Reconciliación de tareas UX → plan:**

  | Task UX (provisional) | Entregable técnico |
  |---|---|
  | Task-THEME-01 | `app-theme.ts` con la paleta y los radios del modo claro; `providePrimeNG` consume el preset. **Incluye explícitamente ADR-012 (claro):** `formField.borderColor` y `formField.hoverBorderColor` = `{surface.500}`; no queda condicionado al resultado de la prueba de contraste |
  | Task-THEME-02 | Entrada activa de navegación con tokens y `dark:` en `layout-nav.ts` / `LayoutComponent` |
  | Task-THEME-03 | Tokens de `button` para la variante contorneada de peligro (`red.500` en texto y borde) en `app-theme.ts` |
  | Task-THEME-04 | `colorScheme.dark` del preset (superficies, texto, primario, formularios, overlays). **Incluye explícitamente ADR-012 (oscuro):** `formField.borderColor` y `formField.hoverBorderColor` = `{surface.400}` |
  | Task-THEME-05 | `ThemeService` + conmutador en la barra superior + `@custom-variant dark` |
  | Task-THEME-06 | Persistencia (`app-theme-mode`), preferencia del sistema y script síncrono de `index.html` |
  | Task-THEME-07 | `contrast.ts` + prueba de contraste de todos los pares (RT-08). Cualquier corrección posterior a un fallo de la prueba es solo red de seguridad: las decisiones de ADR-012 ya están en Task-THEME-01 y 04 |
  | Task-THEME-08 | Eliminación de 2 estilos propios de color y revisión visual en ambos modos |
  | Task-THEME-09 (nueva) | Reglas de gobernanza en `lint:primeng` + prueba de violación inyectada (RT-07, CA-04.1). Su spec usa **solo** directorios temporales (`LINT_ROOT`); **no** contiene la aserción "código real con 0 violaciones", que queda en la verificación final (Task-THEME-10) porque solo es alcanzable tras la limpieza de Task-THEME-08 |
  | Task-THEME-10 (nueva) | Evidencia: 6 capturas en `specs/036-theming-claro-oscuro-ui/evidence/` (RT-10) |
- **Importante:** Los colores y radios viven **solo** en `core/theme/app-theme.ts`. Los componentes del shell consumen únicamente tokens semánticos con `dark:`; las páginas y formularios no llevan utilidades de color ni de radio.
- **Qué NO debe tocar:**
  - `app/backend/**`, `docker-compose`, Keycloak y cualquier contrato HTTP.
  - `app/frontend/src/app/features/**` salvo las dos ediciones de ADR-010 (`item-assignees-view.component.html:46` y `create-backlog-item.component.html:82`). Cualquier otro estilo propio de color que el desarrollador encuentre se **reporta** antes de editarlo.
  - `app/template-primeng/**` y `specs/evidences/*.png`: solo lectura (FR-018).
  - `core/auth/**`, `app.routes.ts`, `ViewportService` y la estructura de zonas del shell (HU-035).
  - `.specify/memory/constitution.md`: no se edita (jurisdicción humana, §11).

## 3. Tech Stack
- **Runtime:** Angular 22.2 Zoneless con Signals, TypeScript ~6.0.
- **Framework:** PrimeNG ^22.1.2 con `@primeuix/themes` ^3.0.1 (`definePreset(Aura, …)`); Tailwind CSS v4 + `tailwindcss-primeui` para tokens semánticos (`bg-surface-*`, `text-surface-*`, `border-surface-*`, `text-muted-color`, `text-color`, `bg-primary`) solo en el layout.
- **Database:** No aplica.
- **Infrastructure:** Sin cambios. Sin paquetes npm nuevos ni fuentes externas.
- **Testing:** Jest 30 + `jest-preset-angular` (zoneless). Pruebas no tautológicas: la tabla de valores esperados vive en la spec, escrita desde la HU, nunca derivada del preset que se prueba.

## 4. Development Workflow
- **Cómo levantar el proyecto:** `npm start` en `app/frontend` (backend y Keycloak por `docker-compose` como hoy).
- **Cómo ejecutar tests / lint / build:** en `app/frontend`: `npm run lint:primeng`, `npm run build`, `npm test` (RT-10). Las tres deben terminar sin errores y la suite existente debe seguir 100 % en verde.
- **Cómo ejecutar migraciones:** No aplica.
- **Evidencia de cierre (FR-020, SC-007):** 6 capturas a 1920 px (`backlog`, `sprints`, `equipo` × `claro`, `oscuro`) con nombre `{modulo}-{modo}.png` en `specs/036-theming-claro-oscuro-ui/evidence/`. Cada una muestra barra superior con el conmutador, navegación, contenido y pie. Los roles 1 a 8 se comparan con la maqueta del mismo modo; el rol 9 (enlace) contra la tabla de tokens. Sin las 6 no se pasa a ACTIVE (CA-06.1).

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - Fuente única: ningún archivo distinto de `app-theme.ts` declara colores (literales ni clases de paleta). Páginas y formularios heredan el tema de los componentes PrimeNG.
  - Componentes standalone, `ChangeDetectionStrategy.OnPush`, `@if/@for`, `inject()`, signals. Prohibido `*ngIf`, `*ngFor`, `NgModule`.
  - Prohibido `::ng-deep`, `!important`, `.scss` de componente con color, borde o sombra, sombras personalizadas y fuentes externas.
  - Radios solo en el preset; ninguna utilidad `rounded-*` en ningún componente.
- **Dependencias permitidas:** solo las ya instaladas. Íconos de PrimeIcons (`pi-moon`, `pi-sun`).
- **Patrones prohibidos:** variables hardcodeadas; copiar valores de `specs/evidences/*.png` fuera de la tabla de tokens; reutilizar código de `app/template-primeng`; referenciar la paleta primitiva de Aura (`{cyan.600}`, `{gray.500}`, `{red.500}`) en lugar de valores explícitos (ADR-003).

### 5.1. State Management Architecture
- **Frontera de Estado:** Todo el estado nuevo es de **cliente**; el servidor no interviene.
  - *Elección del usuario:* verdad en `localStorage` (clave `app-theme-mode`, `light` | `dark`) y, en memoria, en el signal `choice` de `ThemeService`. Por navegador, no por cuenta.
  - *Preferencia del sistema:* verdad en `matchMedia('(prefers-color-scheme: dark)')`, reflejada en el signal `systemDark`.
  - *Modo efectivo:* `computed` = `choice() ?? (systemDark() ? 'dark' : 'light')`. La clase `app-dark` de `<html>` es su **proyección** al DOM, nunca una fuente de verdad.
- **Estrategia de Sincronización:** Imperativa y síncrona: `toggle()` y el listener del sistema llaman a `apply()` que escribe la clase y `color-scheme` en `<html>` en el mismo turno (SC-002, sin `effect` diferido). Mientras no haya elección válida, el evento `change` de `matchMedia` actualiza `systemDark` y reaplica; con elección, el evento se ignora. No se sincroniza entre pestañas (fuera de alcance; ver §11).
- **Consistencia:** Fuerte y local (un solo hilo). Sin condiciones de carrera: `choice` se escribe solo desde `toggle()` y desde la lectura inicial. Si el almacenamiento falla, `choice` sigue en memoria y el conmutador funciona durante la sesión (CA-02.4). El cambio de modo **no remonta** el shell ni el `router-outlet`: la clase de `<html>` cambia y PrimeNG/Tailwind reaccionan por CSS, así que formularios, foco y desplazamiento se conservan (CB-03).

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:** El tema no hace llamadas de red.
  - `localStorage` ausente, bloqueado o que lanza (`SecurityError`, cuota): toda lectura y escritura va en `try/catch`; el modo cae al del sistema o al elegido en memoria, **sin mensaje alguno** (FR-011, D-06 del UX).
  - Valor guardado distinto de `light`/`dark`: se ignora (no se borra ni se anuncia); el primer `toggle()` lo sobrescribe con un valor válido.
  - `window.matchMedia` inexistente: `systemDark = false` (modo claro) y sin listener, sin error.
- **Patrones de Tolerancia a Fallos:** Sin timeouts, reintentos ni circuit breaker: no hay E/S de red. El listener de `matchMedia` se libera con `DestroyRef`.
- **Proporcionalidad:** Cualquier mecanismo adicional (sincronización entre pestañas, almacenamiento en servidor, tercer modo "sistema") sería sobre-ingeniería y está fuera de la HU.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

#### ADR-001: Frontend Angular 22 Zoneless con Signals
- **Estado:** Aceptado (heredado)
- **Contexto:** Constitución §1, Stack Frontend.
- **Decisión:** `ThemeService` es un servicio `providedIn: 'root'` con signals; el cambio de modo se refleja por CSS sobre `<html>`, sin Zone ni `ChangeDetectorRef` manual.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Estado del tema trivial de probar.
  - ⚠️ **Trade-off / Costo Real:** El listener de `matchMedia` corre fuera del ciclo de Angular; debe escribir en un signal para que la plantilla del conmutador se actualice.

#### ADR-002: PrimeNG 22 + Tailwind v4 bajo la enmienda Theme Visual
- **Estado:** Aceptado (heredado)
- **Contexto:** Constitución §1, "Skeleton vs. Theme" con la excepción acotada "Theme Visual (HU-036)" y "Shell de Aplicación (HU-035)": paleta cerrada, fuente única `app-theme.ts`, `darkModeSelector: '.app-dark'`, clave `app-theme-mode`, color en componentes solo con tokens semánticos y `dark:` dentro de `LayoutComponent`.
- **Decisión:** Se implementa la enmienda tal como está escrita; esta HU no la modifica.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Look and feel 100 % del preset; cero deuda de estilos.
  - ⚠️ **Trade-off / Costo Real:** Cualquier cambio futuro de paleta, radios o modo oscuro exige una nueva enmienda de la constitución.

#### ADR-003: Preset con valores explícitos, sin referencias a las paletas primitivas de Aura
- **Estado:** Aceptado
- **Contexto:** La constitución fija los valores como "escala `gray` y `cyan` de Tailwind v4" (`#0092b8`, `#00b8db`, `#007595`, `#1e2939`, `#101828`, `#364153`, `#6a7282`, `#99a1af`, `#fb2c36`). Las paletas primitivas de `@primeuix/themes` (`cyan`, `gray`, `red`) siguen, según el conocimiento del SA, la generación anterior de Tailwind: por ejemplo `cyan.600` = `#0891b2` y `red.500` = `#ef4444`, **no** `#0092b8` ni `#fb2c36`. Un preset que escriba `{cyan.600}` compila, parece correcto y pinta un color distinto al de la maqueta. El desarrollador lo confirma contra el paquete instalado (§11, punto 3).
- **Decisión:** `app-theme.ts` exporta `appThemePreset = definePreset(Aura, {...})` y **declara explícitamente** tres escalas completas con valores de Tailwind v4: `primitive.cyan` (50..950), `primitive.red` (50..950) y la escala `semantic.colorScheme.{light,dark}.surface` (0 y 50..950, gris v4). El desarrollador extrae los valores de `node_modules/tailwindcss/theme.css` (convertidos a hex) y los pega como literales; esta es la **única** ubicación permitida de literales. Mapeo obligatorio de roles:

  | Rol (HU) | Token del preset (claro / oscuro) |
  |---|---|
  | Primario | `primary` = escala cyan v4; `colorScheme.light.primary.color` `{primary.600}`, `colorScheme.dark.primary.color` `{primary.500}`; `contrastColor` `#ffffff` en ambos (H-04); hover/active derivados de la misma escala (`{primary.700}`/`{primary.800}` claro, `{primary.400}`/`{primary.300}` oscuro) ⚠️ [PROPUESTO] |
  | Enlace / texto de acción primaria | `button.colorScheme.light.{text,outlined}.primary.color` y `button.link.*` = `{primary.700}` (`#007595`); oscuro `{primary.500}` (`#00b8db`) |
  | Fondo de página | No es token PrimeNG: lo pinta `LayoutComponent` (`bg-surface-50 dark:bg-surface-900`, ADR-007) |
  | Tarjeta, navegación, barra, pie | `content.background` `{surface.0}` / `{surface.800}`; ídem `overlay.{select,popover,modal}.background`, `formField.background` (oscuro `{surface.800}`, supuesto D-07) |
  | Borde y separador | `content.borderColor`, `overlay.*.borderColor` `{surface.200}` / `{surface.700}` |
  | Texto principal / secundario | `text.color` `{surface.800}` / `{surface.200}`; `text.mutedColor` `{surface.500}` / `{surface.400}` |
  | Peligro | `primitive.red` v4; `button.colorScheme.{light,dark}.outlined.danger.{color,borderColor}` = `{red.500}`; `message.error` hereda `red` |
  | Marcador de posición | `formField.placeholderColor` `{surface.400}` en ambos modos (genera E-02 por paridad con la maqueta; en oscuro 5.63:1) |

  Los radios se fijan en el preset: `formField.borderRadius` = `0.5rem` (controles y botones, `button` hereda del campo), `content.borderRadius` y `overlay.modal.borderRadius` = `0.75rem`, `navigation.item.borderRadius` y `overlay.{select,popover}.borderRadius` = `0.5rem`; `menubar.borderRadius` y `menu.borderRadius` = `0` para que el shell no se vea como tarjetas flotantes. El desarrollador **inventaría** los tokens de Aura que referencian `surface.*`, `primary.*` y `red.*` y revisa que ninguno quede en un valor de la paleta anterior; los estados derivados (hover, activo, deshabilitado) pueden usar peldaños contiguos de la misma escala gris/cyan.
- **Alternativas Consideradas:**
  - **Alternativa A:** Referenciar `{cyan.600}`, `{gray.500}`, `{red.500}` de Aura. Descartada: produce colores distintos a los de la tabla y la prueba de RT-01 fallaría; peor, sin esa prueba nadie lo notaría.
  - **Alternativa B:** Hojas CSS con variables `--p-*` sobrescritas. Descartada: son colores fuera de `app-theme.ts` y requieren `!important` o conocer el orden de capas; prohibido por la enmienda.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Cada valor de la tabla de tokens es auditable en un solo archivo y verificable por prueba unitaria.
  - ⚠️ **Trade-off / Costo Real:** Hay que mantener escalas completas (11 peldaños × 3) a mano y revisar al actualizar `@primeuix/themes`. El preset de oscuro "desplaza" la jerarquía de Aura (Aura usa `surface.950` de fondo y `surface.900` de tarjeta; aquí son `surface.900` y `surface.800`), así que cada token de Aura que apunte a esos peldaños debe sobrescribirse; el inventario de la tarea lo hace explícito.

#### ADR-004: Modo oscuro por clase `app-dark` en `<html>` y variante `dark` de Tailwind
- **Estado:** Aceptado (heredado)
- **Contexto:** Constitución, Theme Visual: `darkModeSelector: '.app-dark'`; `@custom-variant dark (&:where(.app-dark, .app-dark *));`.
- **Decisión:** `providePrimeNG({ theme: { preset: appThemePreset, options: { darkModeSelector: '.app-dark', cssLayer: { name: 'primeng', order: 'theme, base, primeng' } } } })` (se conserva `cssLayer`). `styles.css` solo añade `@custom-variant dark (&:where(.app-dark, .app-dark *));` además de la tipografía única de HU-035.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** PrimeNG y Tailwind conmutan con la misma clase.
  - ⚠️ **Trade-off / Costo Real:** Los overlays que PrimeNG teleporta a `<body>` quedan fuera del árbol del layout; heredan el modo por la clase de `<html>`, pero no el color del contenedor, por eso el color de texto lo definen los tokens del preset y no la plantilla.

#### ADR-005: `ThemeService` con signals, lectura defensiva y escritura síncrona al DOM
- **Estado:** Aceptado
- **Contexto:** RT-04 y CA-02.1..CA-02.4: valor inicial por preferencia del sistema, elección en `localStorage`, tolerancia a fallos, cambio inmediato sin perder datos.
- **Decisión:** `core/theme/theme.service.ts`, `providedIn: 'root'`, expone `mode` (`computed` de solo lectura) y `toggle()`. Contrato:
  1. `choice = signal<'light'|'dark'|null>(readStored())`; `readStored()` devuelve `null` ante cualquier valor distinto de `light`/`dark` o ante una excepción.
  2. `systemDark = signal(matchMedia?.matches ?? false)` con listener `change` liberado en `DestroyRef`; el listener reaplica el modo solo si `choice()` es `null` (CA-02.3).
  3. `toggle()` calcula el modo contrario al efectivo, lo guarda en `choice`, intenta `localStorage.setItem` en `try/catch` y llama a `apply()`.
  4. `apply()` hace `documentElement.classList.toggle('app-dark', dark)` y `documentElement.style.colorScheme = dark ? 'dark' : 'light'`. El servicio se instancia en un `provideAppInitializer` **declarado antes** del de `AuthService`, de modo que el modo quede aplicado aunque la autenticación redirija o tarde.
  5. La clave `app-theme-mode` y los valores son constantes exportadas (`THEME_STORAGE_KEY`, `THEME_MODES`), reutilizadas por las pruebas.
- **Alternativas Consideradas:**
  - **Alternativa A:** Aplicar la clase con un `effect()`. Descartada: en zoneless el efecto se programa con el ciclo de detección, no es síncrono con el clic y complica la garantía de SC-002 y del Estado 5.
  - **Alternativa B:** Tres modos (claro, oscuro, sistema). Descartada: no está en la HU (D-02 del UX) y obligaría a un control de tres estados y a más pruebas.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un solo punto de verdad con lógica pura y probable sin DOM real; el conmutador no remonta nada.
  - ⚠️ **Trade-off / Costo Real:** La elección solo vive por navegador y no se sincroniza entre pestañas abiertas (cada pestaña refleja el valor al recargar). Se acepta por proporcionalidad.

#### ADR-006: Anti-parpadeo con un script síncrono mínimo en `<head>` de `index.html`
- **Estado:** Aceptado (aplica la resolución humana del 06-10-2026, Opción A: sin parpadeo)
- **Contexto:** Estados 9 y 10 del UX: el modo debe estar aplicado **antes del primer pintado**. Angular arranca después de descargar y ejecutar el bundle y, además, `AuthService.init()` (Keycloak) bloquea el arranque; hasta entonces el navegador pinta el lienzo por defecto, que en un usuario de modo oscuro es un destello claro. Ningún mecanismo de Angular corre antes de ese primer pintado.
- **Decisión:** `index.html` incluye en `<head>`, antes de cualquier hoja de estilos, un `<script>` clásico (sin `async`, `defer` ni `type="module"`) de unas diez líneas que replica la lógica de `ThemeService` (leer `app-theme-mode` en `try/catch`, validar, si no hay valor válido usar `matchMedia('(prefers-color-scheme: dark)')`, aplicar `app-dark` y `colorScheme`). Además `<meta name="color-scheme" content="light dark">` para que el lienzo y los controles nativos respeten el modo. El script **no contiene colores literales**. La duplicación de lógica se controla con pruebas (ver §7): una spec carga el texto del script desde `index.html`, lo ejecuta en jsdom con `localStorage` y `matchMedia` simulados y exige el mismo resultado que `ThemeService` para toda la matriz de entradas.
- **Alternativas Consideradas:**
  - **Alternativa A:** Solo `provideAppInitializer(ThemeService)`. Descartada: se ejecuta tras descargar el bundle; el primer pintado ya ocurrió con el lienzo claro, incumple la Opción A.
  - **Alternativa B:** Renderizar con `prefers-color-scheme` por CSS y que Angular ajuste después. Descartada: ignora la elección manual guardada (mostraría el modo equivocado a quien eligió lo contrario del sistema).
  - **Alternativa C:** Cookie legible por el servidor. Descartada: no hay SSR ni servidor de plantillas; añadiría estado de servidor para un dato de cliente.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** El modo correcto está aplicado cuando se pinta por primera vez, incluida la pantalla previa a la autenticación.
  - ⚠️ **Trade-off / Costo Real:** Hay lógica duplicada en dos lugares (script y servicio) y un script en línea, que una futura política CSP (`script-src`) bloquearía; hoy `index.html` no define CSP y el desarrollador lo verifica. El lienzo previo a Angular usa el color nativo del navegador para `color-scheme: dark` (gris oscuro del agente de usuario, no `#101828`): es un instante sin contenido, no un destello del modo equivocado; se documenta para QT.

#### ADR-007: Color de página y de texto base en la raíz de `LayoutComponent`, solo con tokens
- **Estado:** Aceptado
- **Contexto:** El fondo de página (`#f9fafb`/`#101828`) y el color de texto de los elementos nativos (`<p>`, `<span>`, `<small>`) no son tokens que PrimeNG pinte por sí mismo; `styles.css` no puede declararlos (la enmienda solo le permite `@custom-variant dark` y la tipografía) y las páginas tampoco.
- **Decisión:** El `div` raíz de `LayoutComponent` añade `bg-surface-50 dark:bg-surface-900 text-color` a sus clases actuales (`min-h-screen flex flex-col`). El pie y los contenedores propios del shell usan `bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700`, con `border-t` para el pie; el texto secundario del pie conserva `text-muted-color`. `text-color` y `text-muted-color` siguen las variables `--p-text-*` del preset y no necesitan `dark:`; `bg-surface-*`/`border-surface-*` apuntan a peldaños fijos, por eso requieren la variante `dark:`. El `main` no recibe clases nuevas (la prueba existente exige exactamente `max-w-7xl mx-auto p-6`).
- **Alternativas Consideradas:**
  - **Alternativa A:** Fijar `background` y `color` de `body` en `styles.css`. Descartada: contradice la enmienda (colores fuera de `app-theme.ts`, y `styles.css` limitado a una regla) y la regla del lint de RT-07.
  - **Alternativa B:** Un componente `app-root` con clases de fondo. Descartada: duplica la raíz de color y deja sin fondo a las rutas fuera del shell; hoy todas las pantallas autenticadas están dentro del shell.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un solo lugar pinta la página; las pantallas nuevas nacen dentro del shell y lo heredan (FR-016).
  - ⚠️ **Trade-off / Costo Real:** Todo lo que se renderice **fuera** del shell (hoy nada autenticado) no tendría fondo; ver el lienzo de ADR-006. Una pantalla pública futura deberá resolver su propio fondo con otra enmienda.

#### ADR-008: Conmutador como `p-button` con ícono, etiqueta que describe la acción siguiente y región de anuncio
- **Estado:** Aceptado (cierra B-03 del UX)
- **Contexto:** RT-05, D-01..D-05 del UX: un control binario en la barra superior, entre las acciones y el perfil, operable por teclado, con nombre accesible que describe la acción y anuncio del cambio de estado.
- **Decisión:** En la plantilla `#end` de `p-menubar`, antes del bloque de perfil, un `<p-button>` icon-only (`severity="secondary"`, `[text]="true"`, ícono `pi pi-moon` en claro y `pi pi-sun` en oscuro, según `theme.mode()`), con `[ariaLabel]` = `LAYOUT_TEXTS.theme.toDark` o `toLight` (D-05: nombra la acción siguiente, no el estado) y `(onClick)="theme.toggle()"`. No se usa `aria-pressed` (doble señalización contradictoria con una etiqueta que ya cambia). El anuncio del cambio va en una región `role="status"` visualmente oculta (`sr-only`) dentro de `LayoutComponent`, cuyo texto se escribe **solo después de una activación** (`LAYOUT_TEXTS.theme.announcedDark|announcedLight`) para no anunciar nada al cargar. Sin transición de color (D-04): el cambio es inmediato. El foco se conserva porque el botón no se remonta (la etiqueta cambia de valor, no de elemento).
- **Alternativas Consideradas:**
  - **Alternativa A:** `p-toggleswitch` con `<label>`. Descartada: exige asociar etiqueta visible o `aria-labelledby`, ocupa más ancho en la barra a 768 px (B-04) y el UX prefiere un botón con ícono (D-03).
  - **Alternativa B:** Menú desplegable de modos. Descartada: añade una tercera opción y un paso extra (SC-002: un solo paso).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un control mínimo, accesible por teclado de fábrica y sin CSS propio.
  - ⚠️ **Trade-off / Costo Real:** Los textos nuevos entran en `LAYOUT_TEXTS` (no hay infraestructura i18n; ver deuda de HU-035) y hay que probar a 768 px que la barra no desborde con el botón añadido. La clase `sr-only` es una utilidad de accesibilidad que la enmienda no lista; se acepta solo para esta región y se registra en §11.

#### ADR-009: Compuertas de gobernanza del tema en `lint:primeng`
- **Estado:** Aceptado
- **Contexto:** CA-04, CA-04.1, FR-013..FR-015, RT-06, RT-07. Hoy el script solo analiza formularios y las reglas de HU-035 (`font-family`, `body`, `::ng-deep`, `!important`, `ed-grid`).
- **Decisión:** `scripts/lint-primeng.mjs` añade reglas que reportan `archivo:línea` y hacen `process.exit(1)`, sobre `src/` sin `*.spec.ts` y con comentarios descartados (ya existe `stripComments`):
  1. **Literales de color** (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` y las funciones `rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color`) en cualquier `.ts/.css/.scss/.html` salvo `src/app/core/theme/app-theme.ts`. En `.html` solo se evalúan **valores de atributo y bloques `<style>`**, porque las referencias de plantilla (`#end`, `#add`) parecen hexadecimales; `index.html` queda cubierto (su script no puede tener literales). **Límite de palabra obligatorio** en las funciones: la expresión es `(?<![\w$.-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(` y el hexadecimal exige `#` + 3, 4, 6 u 8 dígitos hex + `\b`; así `getColor(`, `.color(` o `data-color(` no disparan la regla (caso negativo obligatorio en la prueba).
  2. **Clases de paleta de Tailwind** (`bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|placeholder` + `slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black`, con o sin peldaño, opacidad y prefijos de variante) en atributos de clase y literales `.ts`.
  3. **Estilos de color en línea**, definidos sobre **propiedades concretas** (no sobre subcadenas): en `style="…"`, `[style]`, `[style.x]` y `[ngStyle]` las propiedades `color`, `background*`, `border*`, `outline*`, `box-shadow`, `text-shadow`, `fill`, `stroke`, `accent-color`, `caret-color`; en `.ts` e `index.html` las asignaciones `\.style\.(?:color|background\w*|border\w*|outline\w*|boxShadow|textShadow|fill|stroke|accentColor|caretColor)\b` y `setProperty`/`setStyle` con esos nombres. **`color-scheme` / `style.colorScheme` NO es un estilo de color y queda fuera de la regla** (la regla exige `\b` tras el nombre de propiedad, por lo que `colorScheme` no coincide); es la única propiedad que `ThemeService.apply()` y el script de `index.html` escriben (ADR-005, ADR-006), así que la regla no necesita ninguna excepción. `[style]="{ width: '100%' }"` (existe en 5 pantallas) sigue permitido.
  4. **`.scss`/`.css` distinto de `src/styles.css`** con declaraciones de `color`, `background*`, `border*`, `outline*`, `box-shadow`, `text-shadow`, `fill`, `stroke` (RT-07). Los 11 `.scss` actuales son comentarios y pasan.
  5. **Utilidades de color o radio fuera del shell:** en archivos que no estén bajo `src/app/core/layout/`, fallan `bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`, `text-color`, `dark:*`, `rounded`/`rounded-*` y `shadow`/`shadow-*` **solo cuando aparecen como clase** (atributos `class`, `styleClass`, `*Class`, `[class.*]`, `[ngClass]`), no como entradas de componente (`[rounded]="true"` de `p-button` es legítimo). Dentro del shell se permiten únicamente los tokens semánticos con `dark:`; `rounded*` y `shadow*` quedan prohibidos también ahí.
  6. Se **conservan** `::ng-deep`, `!important`, `ed-grid`, imports retirados y la declaración tipográfica única.
  7. El script admite una raíz alterna (`LINT_ROOT`) para poder probarlo sin tocar el código real.
- **Alternativas Consideradas:**
  - **Alternativa A:** ESLint (`@angular-eslint` con regla local) y Stylelint para `.ts/.html` y `.scss`. Viable y estándar, descartada: añade dos toolchains y dependencias de desarrollo nuevas, no cubre `index.html` ni las clases dentro de atributos Angular sin plugins adicionales, y RT-07 fija `npm run lint:primeng` como comando oficial.
  - **Alternativa B:** Una prueba Jest de escaneo estático del código fuente, como la ya existente `hu035-contrato-estilos.qa.spec.ts`. Viable, descartada: solo corre con la suite completa, mezcla verificación de política con pruebas de comportamiento y no entrega `archivo:línea` en un comando independiente del arnés de pruebas, que es lo que CA-04.1 pide.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** El tema es obligatorio e inmutable para toda HU posterior, verificable en CI sin depender de la memoria del revisor.
  - ⚠️ **Trade-off / Costo Real:** Las regex pueden dar falsos positivos (p. ej. una URL con `#fff` en una cadena); se mitigan con las exclusiones de arriba y se corrigen reescribiendo el literal, no relajando la regla. El script crece en tamaño y necesita su propia spec (violación inyectada).

#### ADR-010: Limpieza de dos estilos propios hallados en la auditoría
- **Estado:** Aceptado
- **Contexto:** CA-05.1/CB-06 exigen eliminar estilos propios que impidan adoptar el tema sin cambiar el contenido. La auditoría de `app/frontend/src` encontró solo dos:
  1. `features/teams/components/item-assignees-view/item-assignees-view.component.html:46`: `[class.bg-surface-100]="assignee.id === highlightedMemberId()"`. `bg-surface-100` apunta a un peldaño fijo: en modo oscuro quedaría como una franja casi blanca bajo texto claro (ilegible).
  2. `features/backlog/components/create-backlog-item/create-backlog-item.component.html:82`: `class="block text-muted-color"` en una nota `<small>`; es una utilidad de color en una página.
- **Decisión:**
  1. Reemplazar la clase del punto 1 por la del estado de fila seleccionada del propio `p-table` (`p-datatable-row-selected`, verificar el nombre contra `primeng@22.1.2` instalado), que PrimeNG pinta con los tokens `highlight` del preset en ambos modos. La condición y el comportamiento no cambian; los tests de `highlightedMemberId` siguen válidos.
  2. En el punto 2, retirar `text-muted-color` y conservar `block`. El texto queda con el color de texto del componente contenedor (contenido idéntico, tono principal en lugar del secundario).
  No se tocan los 5 `[style]="{ width: … }"` ni `[rounded]="true"` (no son color ni radio por utilidad).
- **Alternativas Consideradas:**
  - **Alternativa A:** Permitir tokens semánticos también en páginas. Descartada: contradice la enmienda ("Páginas y formularios no llevan utilidades de color ni de radio") y vaciaría de sentido la regla 5 de ADR-009.
  - **Alternativa B:** Quitar el resaltado de fila. Descartada: cambia el comportamiento visible de una pantalla existente (FR-017).
  - **Alternativa C (para el punto 2):** `<p-message severity="secondary" variant="simple" size="small">`. Descartada por ahora: cambia la estructura del DOM de una pantalla existente; queda como opción si QA pide conservar el tono secundario.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Las pantallas existentes pasan la regla 5 de ADR-009 y se ven bien en ambos modos.
  - ⚠️ **Trade-off / Costo Real:** La nota de la pantalla de Backlog pierde su tono secundario (cambio visual menor aceptado en el punto 2); si el nombre de clase de PrimeNG difiere, el desarrollador usa `pSelectableRow` con `selection` solo lectura, y si tampoco sirve **devuelve el turno al SA**.

#### ADR-011: Contraste de pares de tokens verificado por prueba, con tabla de expectativas independiente
- **Estado:** Aceptado
- **Contexto:** CA-03, CA-03.1, FR-012, RT-08: ningún par fuera de la tabla de excepciones puede quedar bajo el umbral y cada excepción debe coincidir con su ratio declarado.
- **Decisión:** `core/theme/contrast.ts` exporta la función pura `contrastRatio(fg, bg)` (luminancia relativa WCAG 2.1; sin colores). `app-theme.spec.ts` resuelve los tokens del **preset real** (siguiendo las referencias `{…}`) y los compara con una tabla de pares escrita en la spec desde la HU: rol, modo, primer plano, fondo, tipo (texto 4.5 / componente 3), y `excepcion?: { id, ratio }`. La prueba exige: (a) cada par sin excepción cumple el umbral; (b) cada par con excepción mide su ratio declarado (±0.01); (c) la **tabla de pares cubre** todos los roles de texto y de control de la tabla de tokens (un rol nuevo sin par hace fallar la prueba). Pares mínimos: texto principal y secundario sobre página y tarjeta; enlace sobre página y tarjeta; etiqueta del botón primario (E-01, E-03); marcador de posición claro y oscuro (E-02 y 5.63:1 sin excepción); peligro (E-04, E-05); secundario sobre entrada activa (E-06, E-07); anillo de foco y borde de campo contra su fondo (≥ 3:1); bordes decorativos (E-08, E-09).
- **Alternativas Consideradas:**
  - **Alternativa A:** Script Node independiente en CI que lee los tokens ya compilados del `build` (variables `--p-*`) y mide los pares. Viable y más cercano a lo que ve el navegador, descartada: exige compilar antes de medir, duplica el resolutor de referencias del preset y no corre en el ciclo rojo-verde del TDD; la spec Jest sobre el preset real da la misma garantía en segundos.
  - **Alternativa B:** Auditoría manual con una extensión de navegador. Descartada: no es repetible ni bloquea el cierre (CA-03.1); se conserva solo como comprobación visual complementaria de las capturas.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un cambio de valor que rompa el contraste falla en CI con el nombre del par.
  - ⚠️ **Trade-off / Costo Real:** La tabla de la spec duplica valores de la HU a propósito; hay que actualizarla junto con cualquier enmienda.

#### ADR-012: El borde de los campos de formulario cumple 3:1; no usa el borde decorativo
- **Estado:** Aceptado ⚠️ (desviación informativa respecto del wireframe del UX; confirmar con el humano, §11)
- **Contexto:** El Estado 1 del UX anota el borde de los campos con `#e5e7eb` (1.24:1 sobre blanco). Pero la HU (tabla de excepciones) y `spec.md` declaran que E-08/E-09 **no aplican a bordes que sean el único indicador de un control**, y FR-012 exige ≥ 3:1 para componentes. Un campo blanco sobre una tarjeta blanca tiene el borde como único indicador. Además, el valor por defecto de Aura para el borde de campo en modo claro también está por debajo de 3:1.
- **Decisión:** `formField.borderColor` y `formField.hoverBorderColor` usan `{surface.500}` (`#6a7282`, 4.83:1 sobre blanco) en modo claro y `{surface.400}` (`#99a1af`, 5.63:1 sobre `#1e2939`) en oscuro. Son peldaños que ya existen en la paleta cerrada (texto secundario), sin colores nuevos. El borde de foco sigue siendo `{primary.color}`. Los separadores y contornos de contenedor (`content.borderColor`) mantienen `#e5e7eb`/`#364153` como bordes decorativos.
- **Alternativas Consideradas:**
  - **Alternativa A:** Respetar el wireframe (`#e5e7eb` en campos). Descartada: incumple FR-012 y la propia salvedad de E-08/E-09; la prueba de ADR-011 la rechazaría.
  - **Alternativa B:** Ampliar la tabla de excepciones con un par nuevo para el borde del campo. Descartada: ampliar excepciones es decisión humana y degrada la accesibilidad por paridad visual.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Los controles son visibles para usuarios con baja visión en ambos modos y se cumple WCAG 1.4.11.
  - ⚠️ **Trade-off / Costo Real:** Los campos se ven más marcados que en las maquetas; la comparación visual de CA-06 sobre los roles 1 a 8 no incluye el borde de campo, pero el revisor debe saberlo. Si el humano prefiere paridad con la maqueta debe aprobar la excepción nueva.

## 6. Coding Conventions
- **Naming / Organización:** archivos en `kebab-case`; una clase por archivo; constantes en `UPPER_SNAKE_CASE` (`THEME_STORAGE_KEY`); `appThemePreset` en `lowerCamelCase`. Rutas físicas siempre con prefijo `app/frontend/`.
- **Error handling:** Todo acceso a `localStorage` y `matchMedia` dentro de `try/catch` o con guarda de existencia. Ningún error de tema llega a la interfaz ni a la consola (FR-011).
- **Logging:** Prohibido `console.log` en producción.
- **Async patterns:** Estado en signals; listeners de DOM liberados con `DestroyRef`; sin `subscribe` manual. Escritura al DOM síncrona en `apply()` (ADR-005).
- **Color y radio:** literales solo en `app-theme.ts`; en `LayoutComponent` solo `bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`, `text-color` con `dark:` donde el peldaño sea fijo; ninguna utilidad `rounded-*` ni `shadow-*` en ningún archivo.

## 7. Testing
- **Qué debe testearse (Jest, `*.spec.ts` junto al código):**
  - **`app-theme.spec.ts` (RT-01, RT-02, RT-08):** cada rol de la tabla de tokens, en cada modo, resuelve al hexadecimal esperado en el preset real (tabla escrita en la spec); escala `surface` = gris v4 y `primary` = cyan v4 completas; `primary.contrastColor` blanco en ambos modos; `outlined.danger` con texto y borde `#fb2c36` en ambos modos; radios `0.75rem`/`0.5rem` en los tokens de ADR-003; `appThemePreset` expone `darkModeSelector '.app-dark'` consumido por `providePrimeNG` (prueba sobre `appConfig`). Contraste según ADR-011 (incluye la verificación de cobertura de pares). **Inventario de ADR-003 con prueba:** se resuelven todas las referencias `{surface.N}`, `{primary.N}` y `{red.N}` de cada token del preset compilado, incluidos los heredados de Aura, y cada valor resultante debe pertenecer a las escalas v4 declaradas; un token heredado que siga apuntando a un valor de la generación anterior hace fallar la prueba.
  - **`theme.service.spec.ts` (RT-03, RT-04):** matriz sin elección / `light` / `dark` / valor inválido / `getItem` que lanza / `setItem` que lanza × sistema claro / sistema oscuro / sin `matchMedia`. Casos clave: primera visita sigue al sistema (CA-02.3); `toggle()` alterna `app-dark` en `<html>` y vuelve al activarlo otra vez (CA-02.1); la elección se escribe con la clave `app-theme-mode` y se restaura al crear otra instancia (CA-02.2); con elección manual el evento `change` del sistema se ignora, sin ella se sigue; con almacenamiento roto el modo cambia durante la sesión, sin lanzar y sin ningún elemento de error (CA-02.4); `colorScheme` coincide con el modo; con un valor guardado inválido el servicio **y** el script de `index.html` coinciden (modo del sistema) y el valor inválido persiste sin error hasta el primer `toggle()`.
  - **`index.html` ↔ servicio (ADR-006):** una spec lee `src/index.html`, extrae el `<script>` de `<head>`, comprueba que es clásico (sin `async`/`defer`/`type="module"`), que está antes de cualquier `<link rel="stylesheet">` y de `<app-root>`, que no contiene literales de color, y lo ejecuta en jsdom con la misma matriz de entradas que el servicio exigiendo **el mismo modo resultante**. Una prueba que mueva el script al final del `<body>` o cambie la clave debe fallar.
  - **`LayoutComponent` (RT-05):** el conmutador existe en la barra superior, entre la acción del usuario y el perfil; su `aria-label` es `toDark` en claro y `toLight` en oscuro; Enter/Espacio lo activan; la región de anuncio está vacía al cargar y se llena tras activarlo; **activar el conmutador no remonta el shell ni el `router-outlet`** (una referencia al nodo y un `input` con texto escrito siguen siendo los mismos, CB-03); la entrada activa conserva `font-semibold` (las pruebas existentes la buscan) y suma los tokens de resaltado; `main` sigue con exactamente `max-w-7xl mx-auto p-6`.
  - **Gobernanza (CA-04, CA-04.1, RT-07, RT-09):** una spec ejecuta `scripts/lint-primeng.mjs` con `LINT_ROOT` apuntando a un directorio temporal: con un archivo limpio termina en 0; con cada violación inyectada (`#fff` en un `.ts`, `bg-red-500` en un `.html`, `style="color: red"`, `el.style.color = 'red'` en un `.ts`, un `.scss` con `border`, `bg-surface-100` en una página, `rounded-lg` en el layout) termina distinto de 0 e imprime archivo y línea. **Casos que NO deben fallar:** `document.documentElement.style.colorScheme = 'dark'` (en `.ts` y en `index.html`), `getColor(x)` y `.color(` en un `.ts`, `#end` y `#add` como referencias de plantilla en un `.html`, `[style]="{ width: '100%' }"` y `[rounded]="true"`. La comprobación sobre el **código real** (0 violaciones, 0 coincidencias de `preline`, 0 importaciones de fuentes externas) **no** pertenece a esta spec: se ejecuta en la verificación final (`npm run lint:primeng`, Task-THEME-10) una vez aplicada la limpieza de ADR-010, para que el punto de control de gobernanza sea alcanzable en orden.
  - **Pantallas existentes (CA-05):** las specs actuales de `item-assignees-view` y `create-backlog-item` siguen verdes; se añade una aserción de que la fila resaltada ya no usa `bg-surface-100`.
- **Dónde están los tests:** junto a cada archivo (`core/theme/*.spec.ts`, `core/layout/*.spec.ts`) y la spec de gobernanza en `core/theme/`.
- **Estrategia de cobertura:** Todas las ramas de `ThemeService` (con/sin elección, válida/inválida, almacenamiento disponible/roto, sistema claro/oscuro/ausente) y todos los pares de contraste. Las specs existentes deben seguir en verde sin modificarse (salvo el doble de `matchMedia` si se necesita en la barra de pruebas del layout).
- **Comprobaciones manuales de captura (no sustituyen a las pruebas):** que en la recarga con modo oscuro guardado no se vea ningún destello claro (grabación o captura con CPU/red limitadas), que a 768 px la barra superior con el conmutador no desborde (B-04), que los diálogos (registro de miembro, asignación a Sprint) y `p-toast` se vean bien en ambos modos y que los bordes perimetrales de `p-menubar`/`p-menu` (ADR-003) no se aparten de forma visible de la maqueta.

## 8. Security
- **Manejo de secretos:** Sin secretos nuevos.
- **Datos sensibles:** La elección guardada (`light`/`dark`) no es sensible. No se guarda ningún dato de usuario ni token. El script de `index.html` solo lee esa clave y la preferencia del sistema.
- **Acciones prohibidas:** Evaluar texto del almacenamiento (`eval`, `innerHTML`, `Function`) o usarlo como selector; interpolar el valor guardado en una clase sin validarlo contra el conjunto cerrado; añadir al script de `index.html` cualquier otra lógica. Si se incorpora una política CSP, el script en línea debe llevar `nonce` o hash (ADR-006).

## 9. Database
- **Schema:** No aplica. No hay cambios de datos.
- **Reglas para modificar DB:** No aplica.

## 10. Git & PR Rules
- **Naming de branches y Commits:** La rama es `feat/036-theming-claro-oscuro-ui` (GitOps del Watcher; los agentes no ejecutan Git). Conventional Commits en español, por ejemplo `feat(frontend): agrega preset de tema claro y oscuro`. Un commit por ADR implementado cuando sea posible.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:**
  1. Leer este documento, `spec.md`, el UX y la enmienda "Theme Visual (HU-036)" completos.
  2. Ejecutar `npm test` y `npm run build` para fijar la línea base verde.
  3. Verificar contra el `primeng@22.1.2` y el `@primeuix/themes` **instalados** (no de memoria): los nombres exactos de los tokens de ADR-003 (`formField.*`, `content.*`, `overlay.*`, `button.colorScheme.*.outlined.danger.*`, `button.link.*`, `menubar`, `menu`, `navigation.item`), la clase `p-datatable-row-selected` (ADR-010) y los valores de `node_modules/tailwindcss/theme.css` para las escalas gris, cyan y roja (ADR-003), incluido que las paletas primitivas de Aura difieren de las de Tailwind v4. Un token con un nombre que no existe se ignora en silencio: la prueba de RT-01 es la que lo detecta.
  4. Escribir primero la prueba que falla (TDD) para cada `Task-THEME`.
  5. **Entrada activa de la navegación (Task-THEME-02):** la clase de resaltado (`bg-surface-200 dark:bg-surface-700`, además de `font-semibold`) se aplica por `styleClass`/`linkClass` del `MenuItem` activo. Comprobar en el navegador qué elemento de `p-menu` lleva el radio (`navigation.item.borderRadius`) y poner el fondo en ese elemento para que las esquinas midan `0.5rem`. Si ningún elemento admite el fondo con esquinas redondeadas sin CSS propio, **detenerse y devolver el turno al SA**; no escribir `::ng-deep` ni `.scss`.
- **Qué debe validar después:** `npm run lint:primeng`, `npm run build` y `npm test` en verde; el rol de enlace (`#007595` claro, `#00b8db` oscuro) medido en pantalla; las 6 capturas; `git diff` de `app/backend`, `app/template-primeng` y `specs/evidences` vacío.
- **Cuándo pedir confirmación:** Si una pantalla existente trae otro estilo propio de color además de los dos de ADR-010, **reportarlo** antes de editarlo. Si un componente de PrimeNG no adopta el tema con tokens y haría falta CSS propio, devolver el turno al SA.
- **Hallazgos del SA y puntos abiertos (informativos, no bloquean el diseño):**

  | Punto | Resolución / Estado |
  |---|---|
  | B-01 fondo del campo oscuro | Se mantiene `#1e2939` (`{surface.800}`, D-07). Si el humano define otro, cambia un solo token y el par de contraste de ADR-011. |
  | B-02 ratificación E-03..E-09 y enlace | Ver la lista consolidada «Enmienda humana pendiente» debajo de esta tabla. |
  | B-03 componente del conmutador | ADR-008: `p-button` con ícono. |
  | B-04 barra a 768 px | Verificación manual obligatoria (§7). El conmutador es un botón de ícono, sin texto, para minimizar el ancho. |
  | Valores de la constitución vs. paleta de Aura | ADR-003: Aura trae `cyan`/`gray`/`red` de otra generación de Tailwind; el preset declara valores explícitos y la prueba lo verifica. |
  | Enlace vs. `primary.color` | La constitución asigna `primary.color` tanto al botón (`#0092b8`) como al enlace (`#007595`); un solo token no puede tener dos valores. Se separan: botón/foco usan `primary.color`; texto de acción y enlace usan `{primary.700}` (ADR-003). Ratificar junto con B-02. |
  | Borde de campo vs. wireframe | ADR-012: el borde de los campos cumple 3:1; se aparta del `#e5e7eb` anotado por el UX. Pendiente de confirmación humana. |
  | Bordes perimetrales de `p-menubar`/`p-menu` | Aura pinta el borde en los cuatro lados; el wireframe lo dibuja solo en un lado. Se acepta como desviación decorativa; si el revisor visual la rechaza se devuelve al SA (no se resuelve con CSS propio). |
  | `sr-only` | Incluida en la lista consolidada «Enmienda humana pendiente». |
  | Sincronización entre pestañas | Fuera de alcance: cada pestaña refleja la elección al recargar. |
  | i18n | Los textos del conmutador viven en `LAYOUT_TEXTS`; el soporte i18n global sigue siendo deuda de plataforma (HU-035, ADR-009). |

- **Enmienda humana pendiente (jurisdicción humana; el SA no edita `.specify/memory/constitution.md` y el tracker no deroga la constitución).** Mientras la enmienda física no exista, `/speckit.analyze` y QA-Tech pueden marcar estos puntos. Elementos a formalizar en una sola enmienda de la sección «Theme Visual (HU-036)»:
  1. **Excepciones de contraste E-03 a E-09** (la constitución lista solo E-01 y E-02), con la salvedad de que E-08 y E-09 aplican únicamente a separadores y contornos decorativos de contenedor, nunca al único indicador de un control o de su estado (ADR-012).
  2. **Color de enlace `#007595`** en modo claro y la separación de tokens: `primary.color` para botón y foco, `{primary.700}` para texto de acción y enlace (ADR-003).
  3. **Utilidades adicionales en `LayoutComponent`:** `text-color` (raíz del shell, ADR-007) y `sr-only` (solo en la región de anuncio del conmutador, ADR-008).
  4. **Borde de campo con 3:1** (ADR-012) en lugar del `#e5e7eb` anotado en el wireframe del UX.

  Texto sugerido para el punto «Contraste»: *«Excepciones aceptadas (ratificadas por el humano el 06-10-2026, H-01 y H-04, opción A): E-01 a E-09 según la tabla de la HU 036; E-08 y E-09 aplican solo a separadores y contornos decorativos de contenedor, nunca al único indicador de un control o de su estado. Utilidades permitidas en `LayoutComponent` adicionales a las listadas: `text-color` y `sr-only` (esta última solo en la región de anuncio del conmutador).»*
- **Dependencia de Spec Kit:** `tasks.md` y `contracts/lint-gobernanza.md` se regeneran desde este documento tras el SDD-FREEZE y deben reflejar: la regla 1 con límite de palabra, la regla 3 por propiedades concretas (con `colorScheme` fuera), ADR-012 dentro de Task-THEME-01 y 04, y la aserción de código real fuera de la spec de gobernanza (§2 y §7).

## 12. Definition of Done
- Todo el código nuevo cuenta con el manejo de estado definido (§5.1) y con la tolerancia a fallos de almacenamiento y `matchMedia` (§5.2).
- No hay ninguna credencial ni valor de configuración hardcodeado; los colores y radios existen solo en `app-theme.ts`.
- Sin migraciones: no hay cambios de base de datos.
- `npm run lint:primeng`, `npm run build` y `npm test` pasan en `app/frontend`; las specs existentes siguen en verde; una violación inyectada hace fallar el lint con archivo y línea.
- Cada rol de la tabla de tokens coincide con la tabla en ambos modos, cada par de contraste cumple el umbral o su ratio declarado, y el borde de los campos cumple 3:1.
- El modo correcto está aplicado antes del primer pintado y lo prueba una spec; con almacenamiento inválido o bloqueado no aparece ningún error.
- `app/backend`, `app/template-primeng`, `specs/evidences` y las rutas quedan sin diferencias; solo cambian las dos líneas de `features/**` de ADR-010.
- Existen las 6 capturas de cierre en `specs/036-theming-claro-oscuro-ui/evidence/`.
