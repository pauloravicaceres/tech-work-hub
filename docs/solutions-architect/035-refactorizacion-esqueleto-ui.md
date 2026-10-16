# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 05-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/035-refactorizacion-esqueleto-ui/`, `documents/designer-ux/ux-035-refactorizacion-esqueleto-ui.md`, la HU `documents/business-analyst/035-refactorizacion-esqueleto-ui.md` y la resolución humana del tracker (05-10-2026, 08:52:52, opción **B**: navegación expandida en anchos amplios, colapsada a 768 px, sin persistencia). `plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE; los `Task-UI-xx` provisionales del UX se reconcilian en §2.
- **Descubrimiento:** No se emite cuestionario. La constitución cubre el stack completo y la HU es solo frontend: sin backend, sin base de datos, sin mensajería, sin caché. Los puntos B-01..B-06 del UX se resuelven aquí (§11).

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub, plataforma de gestión ágil. Esta HU crea el **shell de la aplicación** (barra superior, navegación lateral colapsable, área de contenido, pie de página) y fija la tipografía global. Es un refactor de presentación.
- **Qué problema resuelve:** Hoy `AppComponent` es solo `<router-outlet />`: no hay navegación entre módulos ni tipografía definida. El shell da orientación común a todas las pantallas y cumple la directiva "Skeleton" de la constitución (FR-001..FR-015, SC-001..SC-008).
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con las pantallas de HU-001 (Backlog), HU-003/004 (Sprints) y HU-012/015 (Equipo), todas ACTIVE o READY-FOR-DEV. Ninguna regla de negocio, API ni contrato de datos cambia (FR-012).
- **Arquitectura general:** SPA Angular 22 Zoneless con Signals. **Cero cambios en backend.** El shell es un componente standalone montado como ruta padre sin segmento de URL; las URL existentes no cambian.

## 2. Repository Structure
- **Frontend (único alcance):** `app/frontend/src/`.
  ```text
  app/frontend/src/
  ├── styles.css                                  ← ÚNICA declaración de font-family y margen de body (ADR-006)
  └── app/
      ├── app.routes.ts                           ← shell como ruta padre; comodín dentro del shell (ADR-003, ADR-008)
      ├── core/
      │   ├── auth/auth.service.ts                ← ampliación aditiva: userName + logout() (ADR-007)
      │   └── layout/
      │       ├── layout.component.ts|html        ← Task-UI-01 · barra superior, navegación, <router-outlet />, pie
      │       ├── layout.texts.ts                 ← Task-UI-01 · textos del shell tipados (ADR-009)
      │       ├── layout-nav.ts                   ← Task-UI-02 · NAV_ITEMS (MenuItem[]) y resolución del módulo activo desde la URL
      │       ├── viewport.service.ts             ← Task-UI-04 · isWide (matchMedia ≥ 1024 px) como signal
      │       └── not-found/not-found.component.ts|html  ← Task-UI-03 · mensaje informativo de ruta inexistente
      └── features/**                             ← NO se tocan (ni .html, ni .ts, ni .scss de pantallas)
  app/frontend/scripts/lint-primeng.mjs           ← Task-UI-09 · reglas globales RT-05/RT-06/RT-07 (ADR-010)
  ```
- **Reconciliación de tareas UX → plan:**

  | Task UX (provisional) | Entregable técnico |
  |---|---|
  | Task-UI-01 | `LayoutComponent` + `layout.texts.ts` |
  | Task-UI-02 | `app.routes.ts` (ruta padre) + `layout-nav.ts` |
  | Task-UI-03 | `NotFoundComponent` + ruta `**` dentro del shell |
  | Task-UI-04 | `ViewportService` + modo acoplado (≥ 1024 px) / `p-drawer` (< 1024 px) |
  | Task-UI-05 | Alternancia manual con el control `≡` (signal `navOpen`) |
  | Task-UI-06 | Contenedor `max-w-7xl mx-auto p-6` en el shell |
  | Task-UI-07 | Regla única de `styles.css` |
  | Task-UI-08 | Verificar diálogos existentes sobre el shell (sin código nuevo) |
  | Task-UI-09 (nueva) | Compuertas automáticas en `lint:primeng` (CA-06.1, RT-05..RT-07) |
  | Task-UI-10 (nueva) | Pruebas Jest del shell, rutas y servicio |
  | Task-UI-11 (nueva) | Evidencia: 6 capturas en `specs/035-refactorizacion-esqueleto-ui/evidence/` |
- **Importante:** El shell vive en `core/layout/` (infraestructura transversal, como `core/auth/`), no en `features/`. Ninguna pantalla se importa desde el shell: se enlazan solo por `routerLink` y `<router-outlet />`.
- **Qué NO debe tocar:**
  - `app/backend/**`, `docker-compose`, Keycloak y cualquier contrato HTTP.
  - `app/frontend/src/app/features/**` completo. Auditoría previa (`grep` sobre los `.html`): ninguna pantalla declara `max-w-*`, `min-h-*`, `mx-auto` ni `p-N` en su raíz, así que no hay sobrescrituras que limpiar. Si el desarrollador encuentra una, la **reporta**; no la edita sin pedir confirmación.
  - `app/template-primeng/**`: solo lectura de la distribución de zonas (FR-011, RT-07). No se copia código, selectores, estilos ni la grilla `ed-grid`.
  - `core/auth/auth.guard.ts`, `bearer-token.interceptor.ts` y `auth.config.ts`.
  - `provideZonelessChangeDetection`, `providePrimeNG` y el preset Aura en `app.config.ts`.

## 3. Tech Stack
- **Runtime:** Angular 22.2 Zoneless con Signals, TypeScript ~6.0.
- **Framework:** PrimeNG ^22.1.2 con tema neutral Aura (`p-menubar`, `p-drawer`, `p-menu`, `p-message`, `p-button`); Tailwind CSS v4 + `tailwindcss-primeui` solo para flex, espaciado y las dos medidas de RT-02. Sin PrimeFlex.
- **Database:** No aplica.
- **Infrastructure:** Sin cambios. Sin paquetes npm nuevos (no se agrega `@angular/cdk` ni `@angular/localize`).
- **Testing:** Jest 30 + `jest-preset-angular` (zoneless). Pruebas no tautológicas: cada una debe poder fallar si se rompe la regla que dice verificar.

## 4. Development Workflow
- **Cómo levantar el proyecto:** `npm start` en `app/frontend` (backend y Keycloak por `docker-compose` como hoy).
- **Cómo ejecutar tests / lint / build:** en `app/frontend`: `npm run lint:primeng`, `npm run build`, `npm test` (RT-09, FR-013). Las tres deben terminar sin errores y la suite existente debe mantenerse al 100 % en verde.
- **Cómo ejecutar migraciones:** No aplica. No hay cambios de esquema.
- **Evidencia de cierre (FR-014, SC-008):** 6 capturas (Backlog, Sprints, Equipo × 1920 px y 768 px) guardadas en `specs/035-refactorizacion-esqueleto-ui/evidence/` con nombre `{modulo}-{ancho}.png`. A 1920 px con la navegación expandida y a 768 px con la navegación colapsada (estados iniciales fijados por la Opción B). Sin las 6 no se pasa a ACTIVE (CA-10.1).

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - Skeleton sí, Theme no: se calca la distribución de zonas; el aspecto final es 100 % del tema Aura. Prohibido logotipo, paleta propia, fuentes externas y overrides de CSS.
  - Componentes standalone, `ChangeDetectionStrategy.OnPush`, `@if/@for`, `inject()`, signals. Prohibido `*ngIf`, `*ngFor`, `NgModule`.
  - Maquetación solo con utilidades Tailwind en el `.html`. Los `.scss` de componentes del shell no se crean (RT-06); sin `::ng-deep` ni `!important`.
  - Una sola fuente de verdad para las entradas de navegación (`NAV_ITEMS`) y una sola para los textos (`LAYOUT_TEXTS`).
- **Dependencias permitidas:** solo las ya instaladas. Sin librerías de layout, de iconos nuevas ni de i18n. Iconos: PrimeIcons (`pi pi-*`) ya importados.
- **Patrones prohibidos:** variables hardcodeadas de configuración; el nombre de la aplicación y los textos salen de `LAYOUT_TEXTS`, no se repiten en plantillas. Prohibido `localStorage`/`sessionStorage` para el estado de la navegación (Opción B). Prohibido reutilizar cualquier archivo de `app/template-primeng`.

### 5.1. State Management Architecture
- **Frontera de Estado:** Todo el estado nuevo es de **cliente y efímero**; el servidor no interviene.
  - *Módulo activo:* la verdad es la **URL** del `Router`. Se deriva (`computed`) del primer segmento: `backlog`, `sprints` o `equipos`; cualquier otro valor ⇒ ninguna entrada activa. Cubre la recarga directa de URL profundas (`/sprints/:id/elementos`).
  - *Navegación abierta/cerrada:* signal `navOpen` en `LayoutComponent`. Vive mientras el shell esté montado; el shell no se remonta al cambiar de pantalla, así que la elección se conserva durante la sesión y se pierde al recargar (Opción B).
  - *Ancho amplio:* signal `isWide` de `ViewportService` (`matchMedia('(min-width: 1024px)')`).
- **Estrategia de Sincronización:** Ninguna con servidor. Al cruzar el umbral de 1024 px (evento `change` de `matchMedia`) `navOpen` se **reinicia al valor por defecto del nuevo ancho** (`navOpen = isWide`). Mientras no se cruce el umbral, la elección manual manda.
- **Consistencia:** Fuerte y local (un solo hilo, signals síncronas). Sin condiciones de carrera: `navOpen` se escribe solo desde el control `≡`, la selección de entrada en modo capa, el cierre del drawer y el cambio de umbral.

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:** El shell no hace llamadas de red. Los únicos orígenes de datos son el token ya cargado por `AuthService.init()` y el `Router`.
  - Si el token no trae nombre (`name` ni `preferred_username`), el perfil muestra el texto neutro `LAYOUT_TEXTS.profileFallback`; no se rompe la barra superior.
  - Si Keycloak cae, se mantiene el comportamiento actual (`authGuard` y el interceptor 401 ⇒ `reauthenticate`). No se agrega lógica nueva.
  - Si `window.matchMedia` no existe, `ViewportService` asume `isWide = true` (modo acoplado) y no lanza error: el shell sigue usable.
- **Patrones de Tolerancia a Fallos:** Sin timeouts, reintentos ni circuit breaker: no hay E/S nueva. La carga perezosa de pantallas (`loadComponent`) conserva su manejo actual.
- **Proporcionalidad:** Cualquier patrón de resiliencia adicional sería sobre-ingeniería para un contenedor de presentación sin red.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

#### ADR-001: Frontend Angular 22 Zoneless con Signals
- **Estado:** Aceptado (heredado)
- **Contexto:** Constitución §1, Stack Frontend.
- **Decisión:** El shell usa componentes standalone, signals y `provideZonelessChangeDetection` (ya configurado). Sin `zone.js`.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Estado del shell trivial de probar y sin dependencia de Zone.
  - ⚠️ **Trade-off / Costo Real:** Todo cambio asíncrono (`matchMedia`, `NavigationEnd`) debe escribirse en un signal; un campo mutable simple no re-renderiza.

#### ADR-002: PrimeNG 22 con tema neutral + Tailwind v4 acotado (Skeleton vs. Theme)
- **Estado:** Aceptado (heredado)
- **Contexto:** Constitución §1, "Directiva Estricta de Maquetación" y "Patrón de Formularios" (Tailwind solo grid, espaciado y flex).
- **Decisión:** `p-menubar` para la barra superior, y utilidades Tailwind para la disposición del shell. Sin CSS propio de color, borde, sombra ni tipografía.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Look and feel 100 % del tema; cero deuda de estilos.
  - ⚠️ **Trade-off / Costo Real:** RT-02 exige `max-w-7xl` y `p-6`, que son utilidades de **tamaño/espaciado**, no solo grid/flex; el SA las acepta por mandato de la HU y las acota al contenedor del shell. Cualquier otra utilidad de tamaño en el shell se reduce al mínimo (`min-h-screen`, `flex-1`, `w-64`, `min-w-0`).

#### ADR-003: Shell como ruta padre sin segmento de URL
- **Estado:** Aceptado
- **Contexto:** FR-001 exige el esqueleto en todas las rutas existentes y FR-004 que las URL no cambien. Hoy `AppComponent` es solo `<router-outlet />`.
- **Decisión:** En `app.routes.ts` se declara `{ path: '', component: LayoutComponent, canActivateChild: [authGuard], children: [...rutas actuales, comodín] }`. `backlog/nuevo`, `sprints/**` y `equipos/**` pasan a ser hijas con **sus mismos `path`, `data`, `providers` (`MessageService`) y `loadComponent`**. Los `canActivate: [authGuard]` de cada hija se retiran porque `canActivateChild` en el padre se ejecuta en **cada** navegación hija (mismo comportamiento que hoy). La redirección `'' ⇒ backlog/nuevo` queda **fuera** del shell, como ruta de primer nivel declarada antes. `AppComponent` no cambia.
- **Alternativas Consideradas:**
  - **Alternativa A:** Poner el layout dentro de `AppComponent`. Descartada: el shell se pintaría también antes de que `authGuard` resuelva y para usuarios sin sesión, y obliga a decidir en `AppComponent` cuándo ocultarlo.
  - **Alternativa B:** Que cada pantalla importe y use el layout como envoltorio. Descartada: toca las 8 pantallas, viola "contenido interno sin cambios" (FR-004, FR-012) y deja que una pantalla futura olvide el shell (contradice FR-015).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un solo punto de montaje; toda pantalla futura que se agregue como hija nace dentro del shell (FR-015). El shell no se remonta al navegar, lo que mantiene `navOpen`.
  - ⚠️ **Trade-off / Costo Real:** Se edita la estructura de `app.routes.ts` (riesgo de regresión de rutas). Se mitiga con la prueba de rutas de §7 que valida cada URL del alcance contra su componente.

#### ADR-004: Navegación lateral dual: `p-menu` acoplado (≥ 1024 px) y `p-drawer` (< 1024 px)
- **Estado:** Aceptado (cierra el punto abierto 3 de la HU y B-05 del UX)
- **Contexto:** RT-01 deja a Arquitectura fijar el componente. El UX exige modo acoplado en ancho amplio, capa superpuesta a 768 px, control externo `≡` y exactamente tres entradas.
- **Decisión:** Un único modelo `NAV_ITEMS: MenuItem[]` (Backlog `/backlog/nuevo`, Sprints `/sprints`, Equipo `/equipos`) renderizado por `<p-menu>` en dos contenedores: en modo amplio dentro de un `<aside>` acoplado (`w-64`, solo si `navOpen()`), y en modo reducido dentro de `<p-drawer position="left" [modal]="true" [(visible)]="navOpen">`. La plantilla elige el contenedor con `@if (viewport.isWide())`.
- **Alternativas Consideradas:**
  - **Alternativa A:** Solo `p-drawer` en todos los anchos. Descartada: `p-drawer` es una capa fija; acoplarlo al lado del contenido en ancho amplio exige CSS propio (márgenes calculados), prohibido por RT-06.
  - **Alternativa B:** `<aside>` único con transiciones y `hidden`/`md:block` de Tailwind, sin `p-drawer`. Descartada: reimplementa capa, máscara, cierre con Escape y trampa de foco, que `p-drawer` ya entrega y es accesible de fábrica.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Cero CSS propio; accesibilidad y Escape/máscara delegados a PrimeNG; un único modelo de entradas.
  - ⚠️ **Trade-off / Costo Real:** Dos caminos de render que probar. Además, `p-drawer` modal cubre la barra superior con su máscara, así que **el control `≡` no cierra la capa** como dibujó el UX (Estado 5); se cierra con una entrada, la máscara, Escape o el botón de cierre del drawer. Desviación informativa para UX y QT; no afecta FR-006 (el control sigue siempre visible para abrir).
- **Verificaciones obligatorias del desarrollador (contra `primeng@22.1.2` instalado, no de memoria):** (1) que `p-menu` marque la entrada activa de un `routerLink`; si no lo hace, usar `p-panelmenu` o marcar la entrada activa con los atributos que el componente ofrezca, sin crear clases propias; (2) que `p-drawer` lleve el foco a la primera entrada al abrir y lo devuelva a `≡` al cerrar; si no, gestionarlo con `focus()` tras `afterNextRender`. Sin esas dos, la HU no cierra.

#### ADR-005: Estado de navegación solo en memoria; umbral de ancho de 1024 px
- **Estado:** Aceptado (aplica la resolución humana, Opción B)
- **Contexto:** El humano eligió: expandida en anchos amplios, colapsada a 768 px, cambio manual solo durante la sesión. "Ancho amplio" no tiene valor numérico en la HU; a 768 px debe estar colapsada.
- **Decisión:** Umbral `(min-width: 1024px)` (breakpoint `lg` de Tailwind, el mismo que propone la HU derivada de grilla). `< 1024 px` ⇒ colapsada; `≥ 1024 px` ⇒ expandida. A 768 px queda colapsada, tal como pide la captura de cierre. Sin `localStorage`.
- **Alternativas Consideradas:**
  - **Alternativa A:** Umbral `md` (768 px). Descartada: `min-width: 768px` es verdadero **en** 768 px, así que a 768 px la navegación arrancaría expandida y contradice la Opción B.
  - **Alternativa B:** Persistir la elección en `localStorage` (Opción C del tracker). Descartada: rechazada explícitamente por el humano.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Comportamiento reproducible; las 6 capturas son deterministas.
  - ⚠️ **Trade-off / Costo Real:** Entre 768 y 1023 px la navegación también arranca colapsada (más conservador que "solo 768"). Confirmable con el humano sin rediseño: es un solo valor en `ViewportService`.

#### ADR-006: Tipografía y margen del body en una única regla de `styles.css`
- **Estado:** Aceptado
- **Contexto:** FR-008/FR-009/CA-06.1/SC-006: exactamente una declaración de familia tipográfica y de margen del cuerpo, sin fuentes externas.
- **Decisión:** Una sola regla sin capa en `app/frontend/src/styles.css`: `body { margin: 0; font-family: var(--font-sans); }`. `--font-sans` es la pila sans-serif del sistema del tema de Tailwind v4 (`ui-sans-serif, system-ui, …`); no se descarga nada. Prohibido repetir `font-family` o `margin` de `body` en cualquier `.css/.scss/.html/.ts` de `src/`.
- **Alternativas Consideradas:**
  - **Alternativa A:** Declararlo dentro de `@layer base`. Descartada: el orden de capas lo fija `providePrimeNG` (`theme, base, primeng`) en tiempo de ejecución y el de Tailwind en la hoja; una regla sin capa gana siempre y evita depender de ese orden.
  - **Alternativa B:** Fijar la fuente vía el preset de PrimeNG o `index.html`. Descartada: duplicaría la declaración en una segunda ubicación, contra FR-009.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Una línea auditable por `grep`; sin descarga de fuentes.
  - ⚠️ **Trade-off / Costo Real:** El preflight de Tailwind v4 ya puede resetear márgenes y fijar sans-serif en `html`, así que la regla puede ser redundante en runtime; se conserva porque la HU exige la declaración explícita y verificable. El desarrollador debe comprobar en el navegador que barra, navegación, contenido, pie, `p-dialog` y `p-message` heredan la misma familia (si un componente PrimeNG fijara la suya, se reporta, no se parchea con CSS).

#### ADR-007: Perfil y acción de usuario con ampliación aditiva de `AuthService`
- **Estado:** Aceptado (resuelve B-02 del UX)
- **Contexto:** FR-002 exige perfil y acciones del usuario a la derecha. Hoy `AuthService` solo expone `isAuthenticated`, `token`, `login`, `reauthenticate`, `refreshToken`: **no hay nombre de usuario ni cierre de sesión**.
- **Decisión:** Se añaden dos miembros sin modificar los existentes: `readonly userName = signal<string | null>(null)` (se carga en `init()` desde `keycloak.tokenParsed`: `name` ⇒ `preferred_username` ⇒ `null`) y `logout(): Promise<void>` (`keycloak.logout({ redirectUri: window.location.origin })`). La barra superior muestra el nombre y un `p-menu` emergente con la única acción **Cerrar sesión**. La zona "acciones" separada no se rellena (no existen acciones; el UX la reserva sin definir).
- **Alternativas Consideradas:**
  - **Alternativa A:** Mostrar solo un icono de perfil sin nombre ni acciones. Descartada: incumple "perfil y acciones del usuario" y deja al usuario sin forma de cerrar sesión.
  - **Alternativa B:** Leer Keycloak directamente desde el layout. Descartada: rompe el aislamiento de `core/auth` (el token `KEYCLOAK` es un detalle interno del servicio).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Cambio aditivo; las pruebas actuales de `AuthService` siguen válidas.
  - ⚠️ **Trade-off / Costo Real:** `logout` es una capacidad nueva de producto aunque mínima; solo en sentido literal contradice "no cambiar el mecanismo de autenticación". Se registra como punto abierto informativo para el humano (§11). Si se rechaza, se elimina la acción y el menú queda sin acciones.

#### ADR-008: Ruta comodín dentro del shell con mensaje informativo
- **Estado:** Aceptado
- **Contexto:** CA-01.1/FR-005: ante una ruta inexistente el shell permanece y el centro no muestra otra pantalla. Hoy `**` **redirige** a `backlog/nuevo`, que sí muestra otra pantalla.
- **Decisión:** Se reemplaza esa redirección por `{ path: '**', component: NotFoundComponent }` como **última hija del shell**. `NotFoundComponent` renderiza un único `<p-message severity="info">` con `LAYOUT_TEXTS.notFound`, sin enlaces ni botones (D-05 del UX). La URL no se reescribe, por lo que ninguna entrada queda activa. La redirección de la raíz `''` se conserva.
- **Alternativas Consideradas:**
  - **Alternativa A:** Mantener la redirección a `backlog/nuevo`. Descartada: incumple FR-005 de forma explícita.
  - **Alternativa B:** Dejar el centro vacío (sin componente). Descartada: ambiguo para el usuario y no verificable como mensaje.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** FR-005 y CB-01 verificables con una prueba de ruta.
  - ⚠️ **Trade-off / Costo Real:** Cambia el comportamiento de URL desconocidas (antes: redirección silenciosa). Ninguna URL **existente** cambia (FR-004). El diseño final de la página de error sigue siendo ❓ No documentado (B-01).

#### ADR-009: Textos del shell centralizados, sin librería i18n nueva
- **Estado:** Aceptado
- **Contexto:** La constitución pide i18n nativo "desde el inicio" y el UX pide textos con i18n, pero el frontend **no tiene infraestructura i18n** (cero coincidencias de `i18n`/`$localize`/`@angular/localize` en `angular.json`, `package.json`, `.html` y `.ts`; las pantallas actuales usan literales en español).
- **Decisión:** Todos los textos del shell (nombre de la aplicación, entradas, nombres accesibles `Abrir navegación`/`Cerrar navegación`, pie, mensaje de ruta inexistente, perfil, `Cerrar sesión`) viven en una constante tipada `LAYOUT_TEXTS` en `layout.texts.ts`. Las plantillas solo la referencian.
- **Alternativas Consideradas:**
  - **Alternativa A:** Atributos `i18n` de Angular. Descartada: compilan a `$localize` y exigen instalar y configurar `@angular/localize` para toda la app; es un cambio de plataforma, fuera de un refactor de layout.
  - **Alternativa B:** Literales en las plantillas. Descartada: dispersa los textos y encarece la futura extracción.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un solo archivo a migrar cuando se adopte i18n.
  - ⚠️ **Trade-off / Costo Real:** El soporte i18n global sigue pendiente (deuda de plataforma, §11); esta HU no lo introduce.

#### ADR-010: Compuertas automáticas de CA-06.1 y RT-05..RT-07 en `lint:primeng`
- **Estado:** Aceptado
- **Contexto:** CA-06.1, CB-04 y RT-05..RT-07 se verifican hoy "por búsqueda". `npm run lint:primeng` (`scripts/lint-primeng.mjs`) solo revisa `.html`.
- **Decisión:** Extender el script con reglas globales sobre `src/` que **fallan** si: (1) hay más o menos de una coincidencia de `font-family` en `src/**/*.{css,scss,html,ts}` (excluyendo `*.spec.ts`); (2) hay más de una regla de `margin` sobre `body`; (3) aparece `::ng-deep` o `!important`; (4) aparece `ed-grid`, `primeng/dropdown` o `primeng/calendar`. Los patrones `[(ngModel)]` ya están cubiertos.
- **Alternativas Consideradas:**
  - **Alternativa A:** Dejarlo como verificación manual en la revisión. Descartada: CA-06.1 es criterio de cierre y una búsqueda humana no es reproducible en CI.
  - **Alternativa B:** Una prueba Jest que lea el sistema de archivos. Descartada: mezcla verificación de política con pruebas de comportamiento; el lint ya es la compuerta oficial de RT-09.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** CB-04 deja de depender de la memoria del revisor.
  - ⚠️ **Trade-off / Costo Real:** Un lint por regex puede dar falsos positivos (por ejemplo la palabra `font-family` en un comentario); se evita escribiéndola solo en código real y se documenta en el script.

## 6. Coding Conventions
- **Naming / Organización:** Selector `app-layout`, `app-not-found`; archivos `kebab-case`; una clase por archivo; `LAYOUT_TEXTS` y `NAV_ITEMS` en `UPPER_SNAKE_CASE`. Rutas físicas siempre con prefijo `app/frontend/`.
- **Error handling:** El shell no lanza ni captura errores de red. `userName` ausente ⇒ texto de respaldo.
- **Logging:** Prohibido `console.log` en código de producción.
- **Async patterns:** Estado en signals. `NavigationEnd` ⇒ `toSignal(router.events.pipe(filter(...), map(...)), { initialValue: router.url })`; `matchMedia` ⇒ signal con listener `change` y limpieza en `DestroyRef`. Sin `subscribe` manual sin cierre. El componente usa `ChangeDetectionStrategy.OnPush`.
- **Accesibilidad:** El control `≡` es un `<p-button>` con `aria-label` desde `LAYOUT_TEXTS`, alcanzable por teclado, siempre visible. Landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`. Orden de foco: barra superior, navegación, contenido, pie.

## 7. Testing
- **Qué debe testearse (Jest, `*.spec.ts` junto al código):**
  - `LayoutComponent`: las cuatro zonas existen; la navegación contiene **exactamente 3** entradas con destino `/backlog/nuevo`, `/sprints`, `/equipos`; entrada activa correcta para `/sprints/42/elementos` (URL profunda); ninguna activa para `/zzz`; con `isWide=true` hay `<aside>` y no `p-drawer`; con `isWide=false` ocurre lo inverso y arranca cerrada; el control `≡` alterna `navOpen`; seleccionar una entrada en modo capa la cierra; el perfil muestra el nombre y, sin nombre, el texto de respaldo; **el contenedor del contenido lleva `max-w-7xl`, `mx-auto` y `p-6`** (CA-01.3, una sola vez, en el shell).
  - `ViewportService`: con `matchMedia` simulado, `isWide` refleja el valor inicial y reacciona al evento `change`; al cruzar el umbral el shell reinicia `navOpen` al valor por defecto del nuevo ancho; sin `matchMedia` cae a `true`. (jsdom no implementa `matchMedia`; se simula en cada spec con `Object.defineProperty(window, 'matchMedia', …)`, y solo se mueve a `setup-jest.ts` si se repite en tres o más specs.)
  - Rutas (`app.routes.spec.ts`, con `RouterTestingHarness`): cada URL del alcance (`/backlog/nuevo`, `/sprints`, `/sprints/nuevo`, `/sprints/:id`, `/sprints/:id/elementos`, `/equipos`, `/equipos/roles`, `/equipos/responsables`, `/equipos/responsables/miembro`) resuelve al **mismo componente que antes** y dentro del shell (SC-002); `''` redirige a `backlog/nuevo`; una ruta desconocida muestra `NotFoundComponent` sin redirigir; sin sesión, `authGuard` bloquea y el shell no se activa (usando el `AuthService` simulado de las specs existentes).
  - `AuthService`: `userName` toma `name`, luego `preferred_username`, luego `null`; `logout()` invoca `keycloak.logout` con el origen como `redirectUri`. Extender el doble de las specs existentes **sin romperlas**.
  - `NotFoundComponent`: renderiza un `p-message` informativo y ningún `a`/`button`.
- **Dónde están los tests:** junto a cada archivo (`core/layout/*.spec.ts`, `app.routes.spec.ts`, `core/auth/auth.service.spec.ts`).
- **Estrategia de cobertura:** Todas las ramas del shell (ancho amplio/reducido, abierta/cerrada, con/sin nombre, ruta conocida/desconocida). Las specs existentes deben seguir en verde sin modificarse, salvo el doble de Keycloak de `auth.service.spec.ts` (FR-013, SC-007).
- **Comprobaciones manuales de captura (no sustituyen a las pruebas):** que a 768 px no haya desplazamiento horizontal en las pantallas del alcance (SC-004) y que a 1920 px el contenido mida ≤ 1280 px centrado en la zona de contenido (SC-005).

## 8. Security
- **Manejo de secretos:** Sin secretos nuevos. La configuración de Keycloak sigue en `auth.config.ts`.
- **Datos sensibles:** El nombre de usuario sale del token ya validado y solo se muestra; no se persiste ni se registra en logs ni en `localStorage`.
- **Acciones prohibidas:** Exponer o mostrar el token; renderizar HTML dinámico del usuario (`[innerHTML]`) en el perfil; abrir rutas del shell sin `authGuard`. `logout` usa solo el origen propio como `redirectUri`.

## 9. Database
- **Schema:** No aplica. No hay cambios de datos.
- **Reglas para modificar DB:** No aplica.

## 10. Git & PR Rules
- **Naming de branches y Commits:** La rama es `feat/035-refactorizacion-esqueleto-ui` (GitOps del Watcher; los agentes no ejecutan Git). Conventional Commits en español, por ejemplo `refactor(frontend): agrega shell de aplicación como ruta padre`. Un commit por ADR implementado cuando sea posible.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:**
  1. Leer este documento, `spec.md` y el UX completos.
  2. Verificar contra el `primeng@22.1.2` instalado (no de memoria) los dos puntos de ADR-004 y el uso de las plantillas `#start`/`#end` de `p-menubar`.
  3. Ejecutar `npm test` y `npm run build` para fijar la línea base verde.
  4. Escribir primero la prueba que falla (TDD) para cada Task-UI.
- **Qué debe validar después:** `npm run lint:primeng`, `npm run build` y `npm test` en verde; `grep` manual de `font-family` y `body` (una sola declaración); 6 capturas.
- **Cuándo pedir confirmación:** Si una pantalla existente necesita cambios para convivir con el shell (por ejemplo, declara su propio ancho máximo), **detenerse y reportar**; no editar `features/**`. Si PrimeNG 22 no ofrece el comportamiento de ADR-004, devolver el turno al SA; no escribir CSS propio.
- **Resolución de los puntos del UX:**

  | Punto | Resolución |
  |---|---|
  | B-01 página de ruta inexistente | ADR-008: un `p-message` informativo, sin acciones. Sigue ❓ No documentado en negocio. |
  | B-02 perfil y acciones | ADR-007: hoy `auth` no expone nombre ni logout; se añaden de forma aditiva. |
  | B-03 destino de Backlog | `/backlog/nuevo` (única ruta de Backlog). No se crean rutas nuevas. |
  | B-04 ruta de entrada de Equipo | `/equipos` (pestaña Miembros). Las pestañas y rutas hijas no cambian; la entrada Equipo está activa en todas por el primer segmento `equipos`. |
  | B-05 componente de navegación | ADR-004. |
  | B-06 medidas | `max-w-7xl` (80 rem = 1280 px) y `p-6` (1.5 rem); 1280 px incluye el padding (`box-sizing: border-box` de Tailwind). Si cambian, solo cambian esas dos clases. |
- **Puntos abiertos informativos (no bloqueantes):**
  1. Confirmar con el humano la acción **Cerrar sesión** (ADR-007) y el umbral de **1024 px** (ADR-005).
  2. i18n global no existe en el frontend (ADR-009): deuda de plataforma para una HU propia.
  3. El control `≡` no cierra la capa en modo reducido por la máscara modal de `p-drawer` (ADR-004). UX y QT deben aceptarlo.
  4. Las pantallas de Equipo ya muestran su propio título y migas de pan; quedan intactas (la HU derivada "Estructura de página" las normalizará).

## 12. Definition of Done
- Todo el código nuevo cuenta con el manejo de estado definido (§5.1) y sin patrones de red innecesarios (§5.2).
- No hay ninguna credencial o variable de entorno hardcodeada; el nombre de la aplicación y los textos salen de `LAYOUT_TEXTS`.
- Sin migraciones: no hay cambios de base de datos.
- `npm run lint:primeng`, `npm run build` y `npm test` pasan en `app/frontend`; las specs existentes siguen en verde.
- Exactamente una declaración de `font-family` y de margen de `body`, en `styles.css`; sin `::ng-deep`, `!important`, `ed-grid` ni imports de PrimeNG anteriores a la v18.
- `features/**` y `app/template-primeng/**` sin diferencias en el diff.
- Todas las URL del alcance resuelven a la misma pantalla que antes, ahora dentro del shell.
- Existen las 6 capturas de cierre (3 módulos × 2 anchos).
