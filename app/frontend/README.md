# TechWorkHub — Frontend

## Propósito
SPA de TechWorkHub construida con Angular 22 (Zoneless + Signals) y PrimeNG 22. Consume la API del Modulith .NET bajo `/api/**` y se autentica con Keycloak (Authorization Code + PKCE).

Funcionalidades actuales:
- **Backlog (HU-001):** registro de elementos del backlog multitipo.
- **Sprints (HU-003):** crear, listar y consultar Sprints de dos semanas.
- **Elementos de un Sprint (HU-004):** asignar un elemento del backlog a un Sprint (un elemento pertenece a un solo Sprint) y consultar los elementos asignados. Las estimaciones (`devPoints`, `qaPoints`) pueden ser `null`: la grilla muestra `—` para nulo y `0` para un cero real.

## Requisitos previos
- Node.js ≥ 22.22.3 (exigido por Angular CLI 22 para `ng serve` y `ng build`). Con una versión menor, `npm test` funciona pero `ng build` se rechaza.
- npm.
- Backend de TechWorkHub y Keycloak en ejecución para probar el flujo real.

## Configuración
- Keycloak: `src/app/core/auth/auth.config.ts` (`KEYCLOAK_CONFIG`) usa por defecto `url: http://localhost:8080/`, `realm: techworkhub`, `clientId: techworkhub-web`. El cliente debe existir como cliente público en el realm.
- API: el cliente llama a rutas relativas (`/api/sprints`, `/api/sprints/{id}/items`, `/api/backlog/items`, `/api/applications`). El proyecto no define proxy de desarrollo; sírvalo bajo el mismo origen que la API.
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
```

## Estructura de carpetas
```text
src/app/
├── core/auth/                 # AuthService, interceptor Bearer, authGuard, config de Keycloak
├── features/
│   ├── backlog/               # HU-001: componentes, modelos y servicio del backlog
│   └── sprints/               # HU-003 y HU-004
│       ├── components/        # sprint-form, sprint-list, sprint-detail, sprint-assigned-items, assign-item-dialog
│       ├── models/            # sprint.models.ts, sprint-date.ts
│       └── services/          # sprint-api.service.ts
├── app.config.ts              # zoneless, HttpClient + interceptor, tema Aura
└── app.routes.ts              # rutas (lazy) protegidas con authGuard
```

## Rutas principales
| Ruta | Componente | API |
|---|---|---|
| `/backlog/nuevo` | `CreateBacklogItemComponent` | `POST /api/backlog/items`, `GET /api/applications` |
| `/sprints` | `SprintListComponent` | `GET /api/sprints` |
| `/sprints/nuevo` | `SprintFormComponent` | `POST /api/sprints` |
| `/sprints/:id` | `SprintDetailComponent` | `GET /api/sprints/{id}` |
| `/sprints/:id/elementos` | `SprintAssignedItemsComponent` (+ `AssignItemDialogComponent`) | `GET /api/sprints/{id}`, `GET` y `POST /api/sprints/{id}/items` |

Todas requieren sesión (`authGuard`). Cualquier otra ruta redirige a `/backlog/nuevo`.

## Documentación
Arquitectura detallada, diagramas y ADRs: [`documents/dev-frontend/frontend-architecture.md`](../../documents/dev-frontend/frontend-architecture.md).
