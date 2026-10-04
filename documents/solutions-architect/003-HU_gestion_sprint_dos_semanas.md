# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 04-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/003-HU_gestion_sprint_dos_semanas/` y `documents/designer-ux/ux_003_gestion_sprint_dos_semanas.md` (`plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE; los `Task-UI-xx` y la ruta `/api/sprints` del UX son provisionales y se reconcilian aquí).

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub - Plataforma de gestión ágil. Esta HU añade el módulo de Sprints: crear un Sprint (identificación, fecha de inicio y fecha de fin) y consultarlo (listado y detalle).
- **Qué problema resuelve:** Entrega los ciclos de trabajo de exactamente 2 semanas sobre los que la HU-004 asignará elementos del backlog. Garantiza que ningún Sprint con ventana distinta de 2 semanas llegue a persistirse (FR-003, FR-015, SC-003).
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con los módulos `Backlog` y `Application` (HU-001 y HU-002, ambas ACTIVE). No modifica su comportamiento (FR-013).
- **Arquitectura general:** Modular Monolith .NET 8 con Vertical Slice Architecture (VSA) y frontend Angular 22 Zoneless. Se añade un módulo nuevo, `Sprints`, con schema PostgreSQL propio.

## 2. Repository Structure
- **Backend (módulo nuevo):** `app/backend/src/Modules/Sprints/` (proyecto `Sprints.csproj`, `RootNamespace` `Sprints`), añadido a `app/backend/TechWorkHub.sln` y referenciado desde `app/backend/src/Bootstrapper/Api/Api.csproj`.
  ```text
  app/backend/src/Modules/Sprints/
  ├── Sprints.csproj
  ├── SprintsModule.cs                              ← AddSprintsModule() y MigrateSprintsModuleAsync()
  ├── Domain/Sprints/
  │   ├── Sprint.cs                                 ← Aggregate<Guid>, IAuditableEntity, Sprint.Create(...)
  │   └── SprintRules.cs                            ← constantes: WindowDays, IdentificationMaxLength, DateFormat
  ├── Data/
  │   ├── ISprintsDbContext.cs
  │   ├── SprintsDbContext.cs                       ← SchemaName = "sprints"
  │   ├── SprintsDbContextFactory.cs                ← design-time, igual que Backlog
  │   ├── Configurations/SprintConfiguration.cs
  │   └── Migrations/                               ← InitialSprintsSchema
  └── Features/Sprints/
      ├── CreateSprint/   CreateSprintCommand.cs · CreateSprintValidator.cs · CreateSprintCommandHandler.cs · CreateSprintEndpoint.cs
      ├── ListSprints/    ListSprintsQuery.cs · ListSprintsQueryHandler.cs · ListSprintsEndpoint.cs
      └── GetSprintById/  GetSprintByIdQuery.cs · GetSprintByIdQueryHandler.cs · GetSprintByIdEndpoint.cs
  ```
- **Backend (pruebas):** `app/backend/tests/Unit/Sprints/` (`Sprints.UnitTests`) y `app/backend/tests/Integration/Sprints/` (`Sprints.IntegrationTests`), ambos añadidos a la solución. Se sigue el patrón de `tests/Unit/Backlog` y `tests/Integration/Backlog`.
- **Frontend:** `app/frontend/src/app/features/sprints/` con `components/` (`sprint-form`, `sprint-list`, `sprint-detail`), `services/sprint-api.service.ts` y `models/sprint.models.ts`. Rutas lazy `/sprints`, `/sprints/nuevo`, `/sprints/:id` registradas en `app/frontend/src/app/app.routes.ts`. Reutiliza `core/auth/` (guard e interceptor Bearer) sin modificarlo.
- **Importante:** Agrupación estricta por feature (VSA): Endpoint, Command/Query, Validador y Handler de cada caso de uso conviven en su carpeta. Prohibidas las carpetas horizontales `/Controllers`, `/Services`, `/Validators`, `/Repositories` a nivel de módulo.
- **Qué NO debe tocar:**
  - `Modules/Backlog/**` y `Modules/Application/**` (código, migraciones y contratos). Esta HU no crea relación Sprint-tarjeta (FR-013).
  - `BuildingBlocks/Shared/**`: solo se reutiliza (`Aggregate<T>`, `IAuditableEntity`, interceptores, `ValidationBehavior`, excepciones, `ICurrentUser`). Si falta algo, se escala como hallazgo y no se parchea dentro de la HU.
  - `app/frontend/src/app/core/auth/**` y `features/backlog/**`.
- **Cambios permitidos fuera del módulo (únicos):** `Api.csproj` (referencia de proyecto), `Program.cs` (dos líneas: `AddSprintsModule` y `MigrateSprintsModuleAsync`), `TechWorkHub.sln`, `app.routes.ts`.

## 3. Tech Stack
- **Runtime:** .NET 8 (`net8.0`, C# 12) en backend; Angular 22.2 Zoneless con Signals en frontend (`package.json` actual: `@angular/core ^22.2.1`).
- **Framework:** Carter 8.1.0 (`ICarterModule`), MediatR 12.4.1 con `ValidationBehavior`, FluentValidation 11.9.2 y Mapster 7.4.0 para Request→Command y Entidad→Response. PrimeNG ^22.1.2 en UI (`p-table`, `p-card`, `p-datepicker`, `p-inputtext`, `p-message`, `p-toast`, `p-dialog`, `p-button`, `p-breadcrumb`), tema neutral por defecto.
- **Database:** PostgreSQL con EF Core Npgsql 8.0.11, Code-First, schema `sprints` y `SprintsDbContext` propio.
- **Infrastructure:** Docker, Keycloak 24 con `Keycloak.AuthServices.Authentication` 2.5.2 (ya configurado en `Program.cs`). Esta HU **no usa** RabbitMQ, MassTransit, Redis ni Outbox (ver ADR-007).
- **Testing:** Backend xUnit + FluentAssertions + Testcontainers PostgreSQL (mismas versiones que `Backlog.IntegrationTests`). Frontend Jest (`jest.config.ts` ya presente). Pruebas no tautológicas: cada prueba debe poder fallar si se rompe la regla que dice verificar.

## 4. Development Workflow
- **Cómo levantar el proyecto:** contenedores de soporte con `docker-compose up -d` (PostgreSQL y Keycloak) y `dotnet run --project app/backend/src/Bootstrapper/Api`. Frontend: `npm start` en `app/frontend`. Cadena de conexión y valores de Keycloak por variables de entorno o `appsettings.Development.json` (nunca en `appsettings.json` base).
- **Cómo ejecutar tests / lint / build:** `dotnet build app/backend/TechWorkHub.sln` y `dotnet test app/backend/TechWorkHub.sln`. Frontend: `npm test` y `npm run build` en `app/frontend`.
- **Cómo ejecutar migraciones:** `dotnet ef migrations add InitialSprintsSchema -c SprintsDbContext -p app/backend/src/Modules/Sprints -s app/backend/src/Bootstrapper/Api -o Data/Migrations`. Se aplican en arranque con `Database:MigrateOnStartup=true` mediante `MigrateSprintsModuleAsync`, llamada **después** de las de `Application` y `Backlog` en `Program.cs` (cada módulo migra su propio schema y su propia tabla de historial `sprints.__EFMigrationsHistory`).

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - Vertical Slice Architecture, CQRS intra-proceso con MediatR, validación antes del handler, interceptores globales de `Shared` sin reimplementarlos.
  - **La regla de la ventana tiene una única fuente:** `SprintRules.WindowDays = 14` (extremos incluidos, es decir `fin = inicio + 13 días`). La consumen el validador, el dominio, la configuración EF y las pruebas. Prohibido repetir el literal `13` o `14` fuera de `SprintRules`.
  - **El Sprint no tiene estado, apertura, cierre ni relación con tarjetas** (FR-013, FR-014). Prohibido añadir columnas `Status`/`State`/`IsActive`, enums de estado o navegaciones hacia `Backlog` hasta que se resuelva el punto abierto 1 y exista la HU-004.
  - Los puntos abiertos 4, 5, 6 y 9 (formato y unicidad de la identificación, solapamiento, inicio en el pasado, orden y paginación) **no se implementan**: ni validación, ni índice único, ni paginación.
- **Dependencias permitidas:** solo el stack de la constitución. Mapster para DTOs; `TimeProvider` ya registrado en `Shared`. Prohibido AutoMapper, `[ApiController]` y paquetes nuevos de HTTP o de fechas.
- **Patrones prohibidos:** variables "hardcodeadas" (cadenas de conexión, URLs, realm); consultas o joins cross-schema; `Console.WriteLine`; controllers clásicos; capturar y tragar excepciones.

### 5.1. State Management Architecture
- **Frontera de Estado:** La verdad reside en PostgreSQL, schema `sprints`. La identidad reside en Keycloak. En el cliente, cada componente guarda solo estado de vista en Signals (`isSubmitting`, `sprints`, `loadError`) y **no cachea** Sprints entre navegaciones.
- **Estrategia de Sincronización:** HTTP síncrono. Tras un 201 el cliente navega a `/sprints` y vuelve a consultar al servidor (consulta fresca), no inserta localmente (UX D-01, SC-001). Sin Optimistic UI, polling ni WebSockets.
- **Consistencia:** Fuerte. Un Sprint se crea con un único `SaveChangesAsync` (una transacción). El doble envío del formulario se mitiga en cliente deshabilitando el botón durante el envío (`isSubmitting`). Como la unicidad de la identificación no está definida (punto abierto 4), el servidor **no** deduplica: dos solicitudes idénticas crean dos Sprints. Esto es un riesgo aceptado y documentado en ADR-006.

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:** La base de datos es la única dependencia de escritura y lectura. Si falla al guardar, el `CustomExceptionHandler` responde 500 sin trazas (ProblemDetails genérico) y registra la excepción con Serilog/`ILogger`. No queda Sprint parcial porque hay una sola entidad y una sola transacción (SC-08, FR-011, FR-012). Keycloak caído impide validar tokens: el resultado es 401 por el esquema de autenticación existente.
- **Patrones de Tolerancia a Fallos:** Propagación obligatoria de `CancellationToken` hasta EF Core en endpoints, handlers y consultas. **Sin reintentos automáticos** de escritura (la creación no es idempotente, ver ADR-006) y sin Circuit Breaker ni fallbacks: el cliente reintenta manualmente (UX Estado 10). Las consultas de lectura usan `AsNoTracking()`.
- **Proporcionalidad:** CRUD de una sola tabla sin dependencias externas. No se justifica resiliencia adicional. El umbral de rendimiento (SC-005, 2 s para 100 Sprints) se cumple con una consulta simple sobre una tabla pequeña; no se necesita caché.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Validados y formalizados desde `spec.md` y `ux_003_*.md`; las decisiones impuestas por la constitución se marcan como heredadas.)*

#### ADR-001: Carter, MediatR y Vertical Slice Architecture
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-016 exige respetar la constitución. Hay tres casos de uso: crear, listar y obtener por id.
- **Decisión:** Un endpoint `ICarterModule` por caso de uso, con `ISender`, `.RequireAuthorization()`, `.Produces<T>()` y `.ProducesProblem()`, organizado en `Features/Sprints/{CreateSprint|ListSprints|GetSprintById}/` con Command/Query, Validador y Handler co-ubicados.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cada caso de uso es auditable en una carpeta y se alinea 1:1 con SC-01..SC-08.
  - ⚠️ **Trade-off / Costo Real:** tres carpetas con varios ficheros para un modelo de cuatro campos; es el costo fijo de VSA.

#### ADR-002: PostgreSQL con schema aislado por módulo
- **Estado:** Aceptado (heredado)
- **Contexto:** La constitución §3 obliga a un `DbContext` y un schema por módulo y prohíbe consultas cross-schema.
- **Decisión:** `SprintsDbContext` con `HasDefaultSchema("sprints")`, tabla de historial de migraciones en el mismo schema y cadena de conexión `ConnectionStrings:Database`.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el módulo es extraíble sin migrar datos de otros módulos.
  - ⚠️ **Trade-off / Costo Real:** la HU-004 no podrá hacer `JOIN` entre Sprint y tarjetas; deberá resolverlo con llamada in-process o proyección (ver ADR-003).

#### ADR-003: Módulo propio `Sprints` con schema `sprints`
- **Estado:** Aceptado
- **Contexto:** El Sprint es una entidad nueva con ciclo de vida propio (que la HU-004 y posteriores ampliarán). El Product Manager registró el riesgo de relacionar Sprint con backlog sin consultas cross-schema (`mvp_tech_work_hub.md` §6) y delegó la decisión de módulo a Architecture.
- **Decisión:** Crear el módulo `Sprints` (schema `sprints`, `SprintsDbContext`). Se nombra en plural para que el namespace `Sprints` no colisione con el tipo `Sprint` (mismo criterio que `Application`/`RegisteredApplication`). Cuando la HU-004 necesite validar la existencia de un Sprint, se expondrá un contrato in-process (`ISprintModuleApi`) siguiendo el patrón `IApplicationModuleApi`; **no se crea en esta HU** (YAGNI).
- **Alternativas Consideradas:**
  - **Alternativa A (Sprint dentro del módulo `Backlog`, schema `backlog`):** permitiría una FK real a `BacklogItems` en la HU-004 y evita un proyecto. Se descarta porque mezcla dos agregados con ciclos de vida distintos, hace crecer el módulo de HU-001 y contradice la regla de la constitución de dar schema propio a cada nuevo módulo. La FK sería cómoda hoy y un obstáculo cuando se extraiga el módulo.
  - **Alternativa B (Sprint dentro del módulo `Application`):** inviable. `Application` es el catálogo de aplicaciones; Sprint no pertenece a ese dominio.
  - **Alternativa C (servicio físico separado):** prohibida por la constitución (§7, microservicios de entrada).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** aislamiento limpio, migraciones independientes y camino directo al Strangler Fig.
  - ⚠️ **Trade-off / Costo Real:** un proyecto más en la solución y, en la HU-004, integridad referencial solo lógica (sin FK) entre `sprints` y `backlog`, con la latencia de una llamada in-process o el costo de mantener una proyección.

#### ADR-004: Fechas como `DateOnly` en `date`, entrada como texto `yyyy-MM-dd`
- **Estado:** Aceptado
- **Contexto:** El Sprint se define por días calendario, sin hora (spec, Assumptions). SC-05 exige HTTP 400 "con el detalle de los campos inválidos" ante una fecha malformada. El `CustomExceptionHandler` solo produce errores por campo para `ValidationException` y `BadRequestException`; un fallo de binding JSON llega como `BadHttpRequestException` y se reporta bajo la clave general, sin identificar el campo.
- **Decisión:** `Sprint.StartDate` y `Sprint.EndDate` son `DateOnly` mapeados a `date` de PostgreSQL. `CreateSprintCommand` recibe `string? Identification, string? StartDate, string? EndDate`; el `AbstractValidator` comprueba presencia y formato exacto `yyyy-MM-dd` (`DateOnly.TryParseExact`, `InvariantCulture`) y la ventana, y el handler parsea ya validado. Las respuestas serializan `DateOnly` como `yyyy-MM-dd`.
- **Alternativas Consideradas:**
  - **Alternativa A (`DateOnly?` en el command y dejar al binder fallar):** código más corto. Se descarta porque un `"no-es-fecha"` produce 400 bajo la clave general y no cumple "detalle de campos inválidos" (SC-05, UX Estado 7 espera el error en el campo de inicio).
  - **Alternativa B (`DateTime`/`timestamptz`):** introduce zona horaria y hora que el negocio no define, y hace que "14 días inclusivos" dependa del huso del cliente. Se descarta por riesgo de errores de un día en los límites de SC-04.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** los límites ±1 día son deterministas, sin ambigüedad de huso, y cada campo inválido se reporta con su nombre.
  - ⚠️ **Trade-off / Costo Real:** el contrato acepta fechas como texto y hay que parsear a mano; si el negocio acepta más formatos (punto abierto 3), se amplía el validador.

#### ADR-005: Invariante de ventana en tres capas (validador, dominio y restricción en BD)
- **Estado:** Aceptado
- **Contexto:** FR-003 y FR-015 exigen que el 100 % de los Sprints persistidos cumpla la ventana (SC-003). La interpretación (14 días calendario inclusivos) es un supuesto ⚠️ [PROPUESTO] aún no confirmado (punto abierto 3).
- **Decisión:** (1) `CreateSprintValidator` produce los 400 por campo: fin ≤ inicio con el mensaje de FR-004 y ventana ≠ 14 días con el mensaje "el Sprint debe abarcar exactamente una ventana de 2 semanas" (FR-003), ambos sobre `EndDate`. (2) `Sprint.Create` vuelve a comprobar la invariante y lanza `BadRequestException` ante una violación, para que ninguna otra ruta de código cree Sprints inválidos. (3) `SprintConfiguration` define una `CHECK` constraint `("EndDate" - "StartDate") = 13`, nombrada `CK_Sprints_Window`. Todas leen `SprintRules.WindowDays`.
- **Alternativas Consideradas:**
  - **Alternativa A (solo validador FluentValidation):** es lo mínimo y suficiente para el API actual. Se descarta porque la garantía "100 % de los Sprints" quedaría sujeta a que cada futura ruta (importaciones, HU de edición) pase por el validador.
  - **Alternativa B (solo restricción CHECK en BD):** garantía fuerte, pero el error llegaría como excepción de persistencia (500), no como 400 con mensaje de negocio. Se descarta como única defensa.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** la invariante no puede violarse ni por el API ni por SQL directo, y el mensaje de negocio sigue llegando como 400.
  - ⚠️ **Trade-off / Costo Real:** la regla está en tres sitios; si el negocio cambia la interpretación (inicio en día fijo, días hábiles, fin calculado) hay que cambiar la constante, el validador y **una migración** que reemplace el `CHECK`. Se acepta porque `SprintRules` concentra la regla y las pruebas cubren las tres capas.

#### ADR-006: La creación no es idempotente ni única por identificación
- **Estado:** Aceptado
- **Contexto:** El formato y la unicidad de la identificación, y el solapamiento entre Sprints, están ❓ No documentados (puntos abiertos 4 y 5; CB-08, CB-09). La spec prohíbe inventar escenarios para ellos.
- **Decisión:** No se crea índice único sobre `Identification`, no se comprueban duplicados ni solapamientos y no se admite cabecera de idempotencia. La identificación es texto libre, obligatorio, con una longitud máxima técnica (`SprintRules.IdentificationMaxLength = 100`, ⚠️ [PROPUESTO], necesario para la columna `varchar`).
- **Alternativas Consideradas:**
  - **Alternativa A (índice único sobre `Identification`):** evitaría duplicados accidentales por doble envío. Se descarta porque impone una regla de negocio no confirmada y, de estar mal, obliga a una migración que podría fallar sobre datos existentes.
  - **Alternativa B (validar solapamiento de ventanas):** se descarta por el mismo motivo y porque añade un escenario que la HU declara sin definir.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el diseño respeta exactamente el alcance aprobado y no bloquea las decisiones de negocio pendientes.
  - ⚠️ **Trade-off / Costo Real:** un doble clic o un reintento tras un 500 ambiguo puede crear Sprints duplicados. Se mitiga solo en UI (botón deshabilitado durante el envío). Debe revisarse en cuanto se resuelvan los puntos abiertos 4 y 5.

#### ADR-007: Sin eventos de integración, Outbox ni caché
- **Estado:** Aceptado
- **Contexto:** Ningún requisito de la spec notifica a otros módulos ni exige caché; el listado está acotado a 100 Sprints (SC-005).
- **Decisión:** No se publican Domain Events ni Integration Events, no se crea tabla `OutboxMessage` y no se decora ningún repositorio con Redis. `Sprint` hereda de `Aggregate<Guid>` por la jerarquía estándar, pero no emite eventos.
- **Alternativas Consideradas:**
  - **Alternativa A (emitir `SprintCreatedDomainEvent` por si la HU-004 lo necesita):** se descarta porque no hay consumidor y el diseño debe nacer de un requisito. Si surge, el interceptor de `Shared` ya lo despacha sin cambios de infraestructura.
  - **Alternativa B (decorador Redis para el listado):** se descarta porque la tabla es pequeña y una caché añadiría invalidación sin necesidad medida.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cero infraestructura nueva y ningún punto de fallo adicional.
  - ⚠️ **Trade-off / Costo Real:** si más adelante otro módulo necesita reaccionar a la creación de Sprints, habrá que añadir el evento y, si es crítico, el Outbox (obligatorio por constitución §4).

## 6. Coding Conventions
- **Naming:** PascalCase para tipos; camelCase para locales y parámetros. Ficheros `Create/List/GetSprintById…Endpoint|Command|Query|Validator|CommandHandler|QueryHandler.cs`. Los textos de error son constantes públicas (`SprintRules`, `CreateSprintValidator`) para que las pruebas los referencien.
- **Contrato HTTP (a formalizar por el API Architect; propuesta alineada con el UX):** `POST /api/sprints` → 201 con `Location` y cuerpo `{ id, identification, startDate, endDate }`; `GET /api/sprints` → 200 con arreglo de los mismos cuatro campos; `GET /api/sprints/{id:guid}` → 200 o 404. Las respuestas **no** incluyen `CreatedAt`/`CreatedBy` (UX Estado 5). Los nombres de campo en JSON son los de la spec en camelCase.
- **Organización:** una feature, una carpeta; mapeo con Mapster (`Adapt<T>()`) y proyección directa a DTO en las consultas.
- **Error handling:** excepciones semánticas de `Shared` (`ValidationException` por el validador, `BadRequestException` en dominio, `NotFoundException` para id inexistente). El handler de `GetSprintById` lanza `NotFoundException` con mensaje que no revela detalles internos. Un `id` que no sea GUID no coincide con la ruta y responde 404 (aceptable para SC-06).
- **Identidad antes que datos:** `CreateSprintCommandHandler` resuelve `ICurrentUser.UserId` antes de cualquier acceso a datos, igual que HU-001; sin claim lanza `UnauthorizedAccessException` (401). Las consultas dependen solo de `.RequireAuthorization()`.
- **Logging:** Serilog vía `ILogger<T>`; sin `Console.WriteLine`. No se registran datos de tokens.
- **Async:** todo método con E/S recibe y propaga `CancellationToken` (obligatorio en producción, recomendado en pruebas).
- **Listado:** `AsNoTracking()`, proyección a DTO y orden determinista por `StartDate` ascendente y luego `Id`, solo para resultados estables. Es un criterio técnico ⚠️ [PROPUESTO] y **no** un contrato de orden: el orden de negocio es el punto abierto 9 y las pruebas no deben depender de él más allá de la estabilidad.
- **Frontend:** componentes standalone con `ChangeDetectionStrategy.OnPush`, Signals y `inject()`; formularios reactivos tipados; textos con i18n nativo; fechas enviadas como `yyyy-MM-dd` (UX D-06) y mostradas según la configuración regional; sin clases CSS propias (UX, tema neutral). Los mensajes de error del 400 se muestran con el `errors` del ProblemDetails por campo.

## 7. Testing
- **Qué debe testearse y Dónde están los tests:**
  - **Unitarias (`tests/Unit/Sprints`):** `Sprint.Create` y `SprintRules` con los límites de SC-04 (7, 13, 15 y 21 días, fin anterior e igual al inicio, 14 válido); `CreateSprintValidator` con los cuatro casos de SC-05 más fin con formato inválido (CB-04) y verificación de que el error cae en el campo correcto; `CreateSprintCommandHandler` (sin identidad ⇒ 401 antes de tocar datos; persiste una sola entidad; no toca nada del backlog).
  - **Integración (`tests/Integration/Sprints`, PostgreSQL real por Testcontainers, una BD por prueba como en `Backlog.IntegrationTests`):** SC-01 (201, cuerpo y `CreatedBy` = `sub`), SC-02 (listado exacto y sin mutación), SC-03, SC-04 y SC-05 (400 y **tabla vacía** después), SC-06 (404), SC-07 en las tres operaciones (401 sin leer ni persistir), SC-08 (fallo de persistencia ⇒ 500 sin traza y sin fila) y SC-006 (el backlog queda intacto).
  - **Migración:** una prueba aplica `InitialSprintsSchema` en PostgreSQL real y comprueba que el `CHECK` `CK_Sprints_Window` rechaza una fila de 13 y de 15 días insertada por SQL directo (FR-015). Esta prueba solo toca el schema `sprints`.
  - **Rendimiento (SC-005):** una prueba con 100 Sprints sembrados vía `SprintsDbContext` comprueba que listado y detalle responden en menos de 2 s.
  - **Frontend (Jest, `*.spec.ts` junto a cada componente):** `sprint-form` (estados 1, 6, 7, 10), `sprint-list` (estados 3, 4), `sprint-detail` (estados 5, 8) y el manejo de 401 (estado 9) reutilizando el interceptor existente.
- **Reglas:** TDD (prueba primero). Prohibido `[Fact(Skip=...)]`, doble de prueba de la base de datos en integración y aserciones que no puedan fallar. La identidad en integración de esta HU puede usar el mecanismo de autenticación de prueba ya presente en `Backlog.IntegrationTests` (la validación contra Keycloak real ya la cubre la HU-002); no se duplica esa cobertura aquí.

## 8. Security
- **Manejo de secretos:** cadenas de conexión y configuración de Keycloak por variables de entorno. Nada de credenciales en el repositorio ni en `appsettings.json`.
- **Datos sensibles y Acciones prohibidas:** Los tres endpoints invocan `.RequireAuthorization()`; basta un token válido con identidad (punto abierto 7: sin roles). Prohibido relajar `verify-token-audience` o añadir endpoints anónimos. Los 500 no exponen trazas ni mensajes de excepción. `CreatedBy` proviene del `sub` del token, nunca del cuerpo de la solicitud (el command no tiene ese campo).

## 9. Database
- **Schema:** Relacional, schema `sprints`, tabla `sprints."Sprints"`: `Id uuid PK`, `Identification varchar(100) NOT NULL`, `StartDate date NOT NULL`, `EndDate date NOT NULL`, `CreatedAt timestamptz NOT NULL`, `CreatedBy varchar NOT NULL`, `LastModified timestamptz NULL`, `LastModifiedBy varchar NULL` (columnas de auditoría gestionadas por `AuditableEntityInterceptor`, no a mano). Restricción `CK_Sprints_Window`. Sin columnas de estado y sin FK hacia otro schema. El tipo y las longitudes exactos los fija el Data Architect dentro de estas reglas.
- **Reglas para modificar DB:** migraciones solo en `app/backend/src/Modules/Sprints/Data/Migrations`; ninguna migración toca los schemas `backlog` ni `application`. Sin DDL bloqueante en tablas existentes (la tabla es nueva).

## 10. Git & PR Rules
- **Naming de branches y Commits:** la rama la gestiona el Watcher GitOps (`feat/003-HU_gestion_sprint_dos_semanas`). Los agentes no ejecutan Git. Commits con Conventional Commits.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:** leer `spec.md`, esta guía y `ux_003_*.md`; revisar `Modules/Backlog` como patrón de referencia (módulo, DbContext, endpoint, validador, pruebas) y escribir primero las pruebas del escenario.
- **Qué debe validar después / Cuándo pedir confirmación:**
  - `dotnet build` y `dotnet test` de toda la solución en verde, incluidas las suites de HU-001 y HU-002 sin cambios.
  - Que ningún fichero fuera de la lista permitida de §2 fue modificado.
  - Que no existe estado, relación con tarjetas, unicidad, solapamiento ni paginación.
  - Detenerse y escalar si una tarea exige cambiar `Shared`, `Backlog` o `Application`, o si se necesita resolver un punto abierto (1 a 9) para continuar.
- **Reconciliación UX → tareas:** los `Task-UI-01..09` del UX se mapean a los componentes `sprint-form` (01, 02, 05, 06, 09), `sprint-list` (03), `sprint-detail` (04, 07) y al manejo de 401 existente (08). El shell de navegación (topbar, sidebar con la entrada "Sprints") **no existe todavía en el repositorio** (`app.routes.ts` solo expone `backlog/nuevo`); el UX lo da por existente. La HU entrega las tres páginas y sus rutas; construir el shell es una tarea de infraestructura de UI que se registra como punto abierto informativo (ver tracker).

## 12. Definition of Done
- Todo el código nuevo cuenta con patrones de resiliencia y manejo de estado definidos (§5.1 y §5.2).
- No hay ninguna credencial o variable de entorno hardcodeada.
- Las migraciones de base de datos han sido auditadas (solo schema `sprints`, `CHECK` incluido).
- Tests y Lint pasan exitosamente en el entorno de CI, sin regresión en HU-001 y HU-002.
- Los escenarios SC-01..SC-08 tienen prueba automatizada y el 100 % de los Sprints persistibles cumple la ventana de 2 semanas.
- No existe estado, apertura, cierre ni relación Sprint-tarjeta en el modelo.
