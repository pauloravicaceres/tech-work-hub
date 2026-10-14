# TechWorkHub — Backend

## Arquitectura del Sistema

Modulith .NET 8 con **Vertical Slice Architecture (VSA)**, CQRS con MediatR, Minimal APIs (Carter) y PostgreSQL (un schema por módulo, sin joins entre schemas). Autenticación JWT con Keycloak (`Keycloak.AuthServices.Authentication`).

**Stack:** .NET 8, EF Core + Npgsql (Fluent API, migraciones Code-First), MediatR, FluentValidation, Carter, xUnit, FluentAssertions, Testcontainers (PostgreSQL 16 y Keycloak 24).

```text
app/backend/
├── TechWorkHub.sln
├── scripts/                         apply-migrations.sh|.ps1 (bundles EF por módulo)
├── src/
│   ├── Bootstrapper/Api/            Program.cs, appsettings*.json
│   ├── BuildingBlocks/Shared/       Aggregate, interceptores, ValidationBehavior, CustomExceptionHandler
│   └── Modules/
│       ├── Backlog/                 Features/BacklogItems/CreateBacklogItem, Domain, Data (schema backlog)
│       ├── Application/             Catálogo de aplicaciones (schema application), GET /api/applications
│       ├── Sprints/                 HU-003: Features/Sprints/{CreateSprint,ListSprints,GetSprintById}; HU-004: Features/SprintItems/{AssignItemToSprint,ListSprintItems}, Contracts/IBacklogModuleApi, Domain, Data (schema sprints)
│       └── Teams/                   HU-012: Features/TeamMembers/{RegisterTeamMember,ListTeamMembers}, Features/TechnicalRoles/ListTechnicalRoles, Domain, Data (schema teams, catálogo de roles sembrado); HU-015: Features/ItemAssignments/{AssignMemberToItem,ListItemAssignees,ListMemberItems}, Contracts/IBacklogItemLookup (implementado por Backlog/BacklogItemLookup.cs)
└── tests/
    ├── Unit/
    │   ├── Backlog/                 Pruebas unitarias
    │   ├── Sprints/                 HU-003: dominio, validador y handlers (consultas sobre EF Core InMemory)
    │   └── Teams/                   HU-012: dominio, validador y handlers (EF Core InMemory)
    └── Integration/
        ├── Backlog/                 Host real con autenticación y catálogo de prueba, PostgreSQL real
        ├── Identity/                HU-002: host real con Keycloak REAL y catálogo REAL, PostgreSQL real
        ├── Sprints/                 HU-003: host real con autenticación de prueba, PostgreSQL real, restricción CK_Sprints_Window
        └── Teams/                   HU-012: host real con autenticación de prueba, PostgreSQL real, semilla y restricciones de la migración
```

### Endpoints principales

| Método y ruta | Módulo | Descripción |
|---|---|---|
| `POST /api/backlog/items` | Backlog | Registra un elemento de backlog (HU-001) |
| `GET /api/applications` | Application | Lista el catálogo de aplicaciones |
| `POST /api/sprints` | Sprints | Crea un Sprint; la ventana debe ser de 14 días calendario inclusivos (`endDate = startDate + 13`) (HU-003) |
| `GET /api/sprints` | Sprints | Lista los Sprints ordenados por `startDate` |
| `GET /api/sprints/{id}` | Sprints | Detalle de un Sprint (404 si no existe) |
| `POST /api/sprints/{sprintId}/items` | Sprints | Asigna un elemento del Backlog a un Sprint; 409 si ya está asignado a cualquier Sprint (HU-004) |
| `GET /api/sprints/{sprintId}/items` | Sprints | Lista los elementos asignados: `id, title, type, devPoints, qaPoints`; las estimaciones son decimales o `null`, sin redondeo (HU-004, FR-018) |
| `POST /api/team-members` | Teams | Registra un miembro con `{ name, role }` (`role` = nombre del rol del catálogo); 201 `{ id, name, role }`, 400 si el rol no existe o faltan datos (HU-012) |
| `GET /api/team-members` | Teams | Lista los miembros: `id, name, role` (HU-012) |
| `GET /api/technical-roles` | Teams | Catálogo de roles técnicos sembrado (`Desarrollo`, `QA`): `id, name` (HU-012) |
| `POST /api/backlog-items/{itemId}/assignees` | Teams | Asigna un miembro (`{ memberId }`) a un elemento; 201 + `Location` al crear, 200 idempotente si el par ya existía; 400 por campo, 404 miembro/elemento (HU-015) |
| `GET /api/backlog-items/{itemId}/assignees` | Teams | Personas relacionadas con un elemento: `id, name, role` (HU-015) |
| `GET /api/team-members/{memberId}/items` | Teams | Elementos relacionados con un miembro: `id, title, type` (HU-015) |
| `GET /api/backlog-items` | Backlog | Lista de elementos `id, title, type` para el selector de asignación (HU-015) |

Todos exigen JWT. Contrato de Sprints: `specs/003-HU_gestion_sprint_dos_semanas/contracts/sprints-api.openapi.yaml`; asignación de elementos: `specs/004-HU_asignacion_elementos_sprint/contracts/sprint-items-api.openapi.yaml`. Detalle de HU-004: sección 12 de `docs/dev-backend/backend-architecture.md`. Contrato de Teams: `specs/012-HU_miembros_equipo_y_roles_tecnicos/contracts/teams-api.openapi.yaml`; detalle de HU-012: sección 13 del mismo documento. Contrato de HU-015: `specs/015-HU_relacion_personas_roles_elementos/contracts/item-assignments-api.openapi.yaml`; detalle: sección 14 del mismo documento.

`tests/Integration/Identity` no usa simulados: importa los realms de `Realm/*.json` en un Keycloak de Testcontainers, pide tokens reales (password grant) y hospeda el `Program` real. La única relajación de configuración es `Keycloak:ssl-required=none` (el Keycloak del contenedor es HTTP); `verify-token-audience`, `realm` y `resource` quedan como en producción y una prueba de guardia lo comprueba.

Documentación viva: `docs/dev-backend/backend-architecture.md`.

## Cómo Compilar y Ejecutar

Requisitos: .NET SDK 8+ (el repositorio se probó con 10.0) y Docker en ejecución para las pruebas de integración.

```powershell
# Compilar
dotnet build app/backend/TechWorkHub.sln

# Todas las pruebas (unitarias + integración)
dotnet test app/backend/TechWorkHub.sln

# Solo la suite HU-002 (Keycloak y catálogo reales)
dotnet test app/backend/tests/Integration/Identity/Identity.IntegrationTests.csproj

# Una historia concreta
dotnet test app/backend/tests/Integration/Identity/Identity.IntegrationTests.csproj --filter "FullyQualifiedName~ListApplicationsRealTests"

# HU-003 (Sprints): unitarias e integración (esta última requiere Docker para PostgreSQL)
dotnet test app/backend/tests/Unit/Sprints/Sprints.UnitTests.csproj
dotnet test app/backend/tests/Integration/Sprints/Sprints.IntegrationTests.csproj

# HU-012 (Teams): unitarias e integración (esta última requiere Docker para PostgreSQL)
dotnet test app/backend/tests/Unit/Teams/Teams.UnitTests.csproj
dotnet test app/backend/tests/Integration/Teams/Teams.IntegrationTests.csproj
```

Migraciones: cada módulo tiene su propia migración Code-First (`Sprints`: `src/Modules/Sprints/Data/Migrations/` → `InitialSprintsSchema` y `AddSprintItems`; `Teams`: `src/Modules/Teams/Data/Migrations/` → `InitialTeamsSchema`, con la semilla del catálogo de roles, y `AddItemAssignments` de HU-015). Se generan con `dotnet ef migrations add <Nombre> --project src/Modules/<Modulo>/<Modulo>.csproj --startup-project src/Modules/<Modulo>/<Modulo>.csproj --output-dir Data/Migrations` (requiere `dotnet tool install --global dotnet-ef --version 8.0.11`). En despliegue las aplica `scripts/apply-migrations.sh|.ps1` para `Application`, `Backlog` y `Sprints` (`Teams` aún no está incluido; se aplica con `Database__MigrateOnStartup`).

Ejecutar la API en desarrollo (usa `appsettings.Development.json`, PostgreSQL en `localhost:5432` y Keycloak en `localhost:8080`):

```powershell
dotnet run --project app/backend/src/Bootstrapper/Api
```

Variables de entorno relevantes:

| Variable | Uso |
|---|---|
| `ConnectionStrings__Database` | Cadena de conexión PostgreSQL |
| `Keycloak__auth-server-url` | URL base del Keycloak real (la base trae un marcador) |
| `Database__MigrateOnStartup` | `true` aplica migraciones al arrancar (solo desarrollo) |
| `IDENTITY_TESTS_STARTUP_TIMEOUT_SECONDS` | Timeout de arranque de contenedores en `Identity.IntegrationTests` (defecto 120; la primera ejecución descarga imágenes, use p. ej. 400) |

Si Docker no está disponible, la suite `Identity.IntegrationTests` **falla** con un mensaje que nombra Docker/PostgreSQL o Keycloak; nunca se omite.
