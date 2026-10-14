# TechWorkHub — Frontend

## Propósito
SPA de TechWorkHub construida con Angular 22 (Zoneless + Signals) y PrimeNG 22, con Tailwind CSS v4 (plugin `tailwindcss-primeui`) solo para grid, espaciado y flex. Consume la API del Modulith .NET bajo `/api/**` y se autentica con Keycloak (Authorization Code + PKCE).

Funcionalidades actuales:
- **Backlog (HU-001):** registro de elementos del backlog multitipo.
- **Sprints (HU-003):** crear, listar y consultar Sprints de dos semanas.
- **Elementos de un Sprint (HU-004):** asignar un elemento del backlog a un Sprint (un elemento pertenece a un solo Sprint) y consultar los elementos asignados. Las estimaciones (`devPoints`, `qaPoints`) pueden ser `null`: la grilla muestra `—` para nulo y `0` para un cero real.
- **Esqueleto de la aplicación (HU-035):** todas las pantallas autenticadas se muestran dentro de un shell (barra superior con perfil y "Cerrar sesión", navegación lateral colapsable con `≡`, contenido de ancho máximo 1280 px y pie). La tipografía base se declara una sola vez en `src/styles.css`.
- **Equipos y Roles (HU-012):** página `/equipos` con la grilla de miembros del equipo, el diálogo "Registrar miembro" (nombre + rol técnico del catálogo) y la pestaña de solo lectura "Roles técnicos". La validación de negocio vive en el servidor; el cliente solo muestra sus respuestas.
- **Responsables de elementos (HU-015):** pestaña "Responsables" dentro de `/equipos` con dos vistas de solo lectura (`Por elemento` y `Por miembro`) y el diálogo "Asignar responsable" (un miembro por solicitud; el rol es el del miembro, solo lectura). Un 201 muestra un toast de éxito y un 200 (relación ya existente, idempotente) uno informativo; tras asignar siempre se vuelve a consultar al servidor.
- **Theming claro/oscuro (HU-036):** preset propio (`appThemePreset`) con la paleta y radios de las maquetas en modo claro y oscuro, conmutador en la barra superior, elección persistida en `localStorage` (`app-theme-mode`) y, sin elección, seguimiento de `prefers-color-scheme`. Los colores literales viven solo en `src/app/core/theme/app-theme.ts`; el resto usa tokens semánticos.

## Requisitos previos
- Node.js ≥ 22.22.3 (exigido por Angular CLI 22 para `ng serve` y `ng build`). Con una versión menor, `npm test` funciona pero `ng build` se rechaza.
- npm.
- Backend de TechWorkHub y Keycloak en ejecución para probar el flujo real.

## Configuración
- Keycloak: `src/app/core/auth/auth.config.ts` (`KEYCLOAK_CONFIG`) usa por defecto `url: http://localhost:8080/`, `realm: techworkhub`, `clientId: techworkhub-web`. El cliente debe existir como cliente público en el realm.
- API: el cliente llama a rutas relativas (`/api/sprints`, `/api/sprints/{id}/items`, `/api/backlog/items`, `/api/applications`, `/api/team-members`, `/api/technical-roles`, `/api/backlog-items`, `/api/backlog-items/{itemId}/assignees`, `/api/team-members/{memberId}/items`). El proyecto no define proxy de desarrollo; sírvalo bajo el mismo origen que la API. Para validación local puede usar `ng serve --proxy-config <archivo.json>` con `{"/api":{"target":"http://localhost:5000","secure":false,"changeOrigin":true}}` (el realm de Keycloak solo admite el origen `http://localhost:4200`).
- Tema: la elección se guarda en `localStorage['app-theme-mode']` (`light` | `dark`); `index.html` aplica el modo antes del primer pintado. `LINT_ROOT` (opcional) apunta `lint:primeng` a otra raíz de `src/` (lo usa `lint-gobernanza.spec.ts`).
- No hay variables de entorno ni archivos `environment`.

## Cómo arrancar
```bash
cd app/frontend
npm install
npm start      # ng serve
```

## Pruebas y build
```bash
npm test       # jest (jest-preset-angular, modo zoneless)
npm run build  # ng build
npm run lint:primeng  # falla ante clases de PrimeNG ≤15, `::ng-deep`, `!important`, más de una `font-family` / margen de `body`, y colores, clases de paleta o utilidades de color/radio fuera del tema (indica archivo:línea)
```

## Estructura de carpetas
```text
src/app/
├── core/auth/                 # AuthService, interceptor Bearer, authGuard, config de Keycloak
├── core/layout/               # HU-035: LayoutComponent (shell, con conmutador de tema HU-036), NAV_ITEMS, ViewportService, LAYOUT_TEXTS, NotFoundComponent
├── core/theme/                # HU-036: app-theme.ts (única fuente de colores), ThemeService, contrast.ts y sus specs
├── features/
│   ├── backlog/               # HU-001: componentes, modelos y servicio del backlog
│   ├── sprints/               # HU-003 y HU-004
│   │   ├── components/        # sprint-form, sprint-list, sprint-detail, sprint-assigned-items, assign-item-dialog
│   │   ├── models/            # sprint.models.ts, sprint-date.ts
│   │   └── services/          # sprint-api.service.ts
│   └── teams/                 # HU-012 y HU-015
│       ├── components/        # team-page, register-member-dialog, item-assignees-view, member-items-view, assign-assignee-dialog
│       ├── models/            # team.models.ts
│       └── services/          # team-api.service.ts
├── app.config.ts              # zoneless, HttpClient + interceptor, preset propio (`appThemePreset`) y `darkModeSelector: '.app-dark'`
└── app.routes.ts              # shell como ruta padre (authGuard por canActivateChild); pantallas lazy como hijas
```

## Rutas principales
| Ruta | Componente | API |
|---|---|---|
| `/backlog/nuevo` | `CreateBacklogItemComponent` | `POST /api/backlog/items`, `GET /api/applications` |
| `/sprints` | `SprintListComponent` | `GET /api/sprints` |
| `/sprints/nuevo` | `SprintFormComponent` | `POST /api/sprints` |
| `/sprints/:id` | `SprintDetailComponent` | `GET /api/sprints/{id}` |
| `/sprints/:id/elementos` | `SprintAssignedItemsComponent` (+ `AssignItemDialogComponent`) | `GET /api/sprints/{id}`, `GET` y `POST /api/sprints/{id}/items` |
| `/equipos` | `TeamPageComponent` (pestaña Miembros, + `RegisterMemberDialogComponent`) | `GET` y `POST /api/team-members`, `GET /api/technical-roles` (catálogo del diálogo) |
| `/equipos/roles` | `TeamPageComponent` (pestaña Roles técnicos) | `GET /api/technical-roles` |
| `/equipos/responsables` | `TeamPageComponent` (pestaña Responsables, vista `Por elemento`: `ItemAssigneesViewComponent` + `AssignAssigneeDialogComponent`) | `GET /api/backlog-items`, `GET` y `POST /api/backlog-items/{itemId}/assignees`, `GET /api/team-members` (diálogo) |
| `/equipos/responsables/miembro` | `TeamPageComponent` (pestaña Responsables, vista `Por miembro`: `MemberItemsViewComponent`) | `GET /api/team-members`, `GET /api/team-members/{memberId}/items` |

Todas se muestran dentro del esqueleto (`LayoutComponent`) y requieren sesión (`authGuard`). `/` redirige a `/backlog/nuevo`; cualquier otra ruta mantiene el esqueleto y muestra `NotFoundComponent` (sin redirección).

## Documentación
Arquitectura detallada, diagramas y ADRs: [`docs/dev-frontend/frontend-architecture.md`](../../docs/dev-frontend/frontend-architecture.md).
