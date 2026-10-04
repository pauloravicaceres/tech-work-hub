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
│       └── Sprints/                 HU-003: Features/Sprints/{CreateSprint,ListSprints,GetSprintById}, Domain, Data (schema sprints)
└── tests/
    ├── Unit/
    │   ├── Backlog/                 Pruebas unitarias
    │   └── Sprints/                 HU-003: dominio, validador y handlers (consultas sobre EF Core InMemory)
    └── Integration/
        ├── Backlog/                 Host real con autenticación y catálogo de prueba, PostgreSQL real
        ├── Identity/                HU-002: host real con Keycloak REAL y catálogo REAL, PostgreSQL real
        └── Sprints/                 HU-003: host real con autenticación de prueba, PostgreSQL real, restricción CK_Sprints_Window
```

### Endpoints principales

| Método y ruta | Módulo | Descripción |
|---|---|---|
| `POST /api/backlog/items` | Backlog | Registra un elemento de backlog (HU-001) |
| `GET /api/applications` | Application | Lista el catálogo de aplicaciones |
| `POST /api/sprints` | Sprints | Crea un Sprint; la ventana debe ser de 14 días calendario inclusivos (`endDate = startDate + 13`) (HU-003) |
| `GET /api/sprints` | Sprints | Lista los Sprints ordenados por `startDate` |
| `GET /api/sprints/{id}` | Sprints | Detalle de un Sprint (404 si no existe) |

Todos exigen JWT. Contrato de Sprints: `specs/003-HU_gestion_sprint_dos_semanas/contracts/sprints-api.openapi.yaml`.

`tests/Integration/Identity` no usa simulados: importa los realms de `Realm/*.json` en un Keycloak de Testcontainers, pide tokens reales (password grant) y hospeda el `Program` real. La única relajación de configuración es `Keycloak:ssl-required=none` (el Keycloak del contenedor es HTTP); `verify-token-audience`, `realm` y `resource` quedan como en producción y una prueba de guardia lo comprueba.

Documentación viva: `documents/dev-backend/backend-architecture.md`.

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
```

Migraciones: cada módulo tiene su propia migración Code-First (`Sprints`: `src/Modules/Sprints/Data/Migrations/InitialSprintsSchema`). Se generan con `dotnet ef migrations add <Nombre> --project src/Modules/<Modulo>/<Modulo>.csproj --startup-project src/Modules/<Modulo>/<Modulo>.csproj --output-dir Data/Migrations` (requiere `dotnet tool install --global dotnet-ef --version 8.0.11`). En despliegue las aplica `scripts/apply-migrations.sh|.ps1` para `Application`, `Backlog` y `Sprints`.

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
