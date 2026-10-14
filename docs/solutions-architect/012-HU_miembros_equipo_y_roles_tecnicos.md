# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 04-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/012-HU_miembros_equipo_y_roles_tecnicos/`, `documents/designer-ux/ux_012_miembros_equipo_y_roles_tecnicos.md` y el Ledger `specs/README.md`. `plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE; los `Task-UI-xx` y las rutas del UX son provisionales y se reconcilian aquí.

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub - Plataforma de gestión ágil. Esta HU introduce los datos maestros de personas: registrar un miembro del equipo técnico con un rol técnico, consultar los miembros y consultar el catálogo de roles técnicos.
- **Qué problema resuelve:** Provee los responsables y roles que las HU-013, 014, 015, 021, 023 y 027 necesitan, sin acoplar la gestión de personas a Backlog, Sprints ni a Keycloak (FR-010, FR-014, FR-015).
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con los módulos `Backlog`, `Application` y `Sprints` (HU-001 a HU-004, todas ACTIVE) sin alterar datos ni comportamiento de ninguno (FR-014).
- **Arquitectura general:** Modular Monolith .NET 8 con Vertical Slice Architecture (VSA) y frontend Angular 22 Zoneless. **Se crea un módulo nuevo `Teams`** (schema PostgreSQL `teams`) porque ningún módulo existente es dueño natural de personas y roles; no tiene dependencias hacia otros módulos.
- **Decisiones de negocio abiertas (no se resuelven aquí):** cardinalidad miembro–rol, unicidad del miembro, longitud del nombre, ciclo de vida, administración del catálogo, vínculo con Keycloak y permisos por rol de acceso (puntos abiertos 1 a 8 de la HU). El diseño es compatible con cualquiera de las respuestas futuras y no impone ninguna (FR-015, ver ADR-003 y ADR-005).

## 2. Repository Structure
- **Backend (módulo nuevo):** `app/backend/src/Modules/Teams/`.
  ```text
  app/backend/src/Modules/Teams/
  ├── Teams.csproj                                  ← mismas referencias que Sprints.csproj (Carter, MediatR, FluentValidation, Npgsql EF); ProjectReference a Shared
  ├── TeamsModule.cs                                ← AddTeamsModule(configuration) y MigrateTeamsModuleAsync()
  ├── Domain/
  │   ├── TeamMembers/TeamMember.cs                 ← Aggregate<Guid>, Create(name, technicalRoleId)
  │   ├── TeamMembers/TeamMemberRules.cs            ← constantes de campos y mensajes (única fuente)
  │   └── TechnicalRoles/TechnicalRole.cs           ← Entity<Guid> (Id, Name), sin factoría pública de alta
  ├── Data/
  │   ├── ITeamsDbContext.cs                        ← DbSet<TeamMember> TeamMembers, DbSet<TechnicalRole> TechnicalRoles
  │   ├── TeamsDbContext.cs                         ← schema "teams"; SchemaName const
  │   ├── TeamsDbContextFactory.cs                  ← design-time, igual que Sprints/Application
  │   ├── Configurations/TeamMemberConfiguration.cs
  │   ├── Configurations/TechnicalRoleConfiguration.cs  ← índice único sobre Name
  │   └── Migrations/                               ← InitialTeamsSchema (tablas + semilla de los dos roles)
  └── Features/
      ├── TeamMembers/
      │   ├── RegisterTeamMember/   RegisterTeamMemberCommand.cs · RegisterTeamMemberValidator.cs · RegisterTeamMemberCommandHandler.cs · RegisterTeamMemberEndpoint.cs
      │   ├── ListTeamMembers/      ListTeamMembersQuery.cs · ListTeamMembersQueryHandler.cs · ListTeamMembersEndpoint.cs
      │   └── TeamMemberResponse.cs                 ← { id, name, role }
      └── TechnicalRoles/
          ├── ListTechnicalRoles/   ListTechnicalRolesQuery.cs · ListTechnicalRolesQueryHandler.cs · ListTechnicalRolesEndpoint.cs
          └── TechnicalRoleResponse.cs              ← { id, name }
  ```
- **Registro del módulo (cambios permitidos fuera de `Modules/Teams`, únicos):**
  1. `app/backend/src/Bootstrapper/Api/Api.csproj`: `ProjectReference` a `Teams.csproj`.
  2. `app/backend/src/Bootstrapper/Api/Program.cs`: `builder.Services.AddTeamsModule(builder.Configuration)` y, dentro del bloque existente de `Database:MigrateOnStartup`, `await app.Services.MigrateTeamsModuleAsync()`. Carter descubre los endpoints por ensamblado: se registra el ensamblado del módulo igual que los otros tres.
  3. `app/backend/TechWorkHub.sln`: proyectos `Teams`, `Teams.UnitTests` y `Teams.IntegrationTests`.
  4. `app/frontend/src/app/app.routes.ts`: un bloque de rutas `equipos`.
- **Backend (pruebas):** proyectos **nuevos** `app/backend/tests/Unit/Teams/Teams.UnitTests.csproj` y `app/backend/tests/Integration/Teams/Teams.IntegrationTests.csproj`, con las mismas versiones y utilidades que `Sprints.*Tests` (un proyecto por módulo, como el resto del repositorio).
- **Frontend:** `app/frontend/src/app/features/teams/` (feature nueva, standalone):
  - `components/team-page/` (contenedor con `p-tabs`, grilla de miembros, grilla de roles y botón de registro).
  - `components/register-member-dialog/` (diálogo del registro).
  - `services/team-api.service.ts` (`listMembers`, `listRoles`, `registerMember`) y `models/team.models.ts`.
  - Rutas (UI): `equipos` (pestaña Miembros, por defecto) y `equipos/roles` (pestaña Roles técnicos), en un bloque con `canActivate: [authGuard]` y `providers: [MessageService]`, igual que `sprints`. Ambas rutas cargan el mismo componente contenedor; la pestaña activa se deriva de la URL.
- **Importante:** Agrupación estricta por feature (VSA): Endpoint, Command/Query, Validador y Handler de cada caso de uso conviven en su carpeta. Prohibidas las carpetas horizontales `/Controllers`, `/Services`, `/Validators`, `/Repositories`.
- **Qué NO debe tocar:**
  - `Modules/Backlog/**`, `Modules/Application/**` y `Modules/Sprints/**` (ningún fichero, ni migración, ni registro). Esta HU no añade columnas, FKs ni navegaciones a ninguna entidad existente.
  - `BuildingBlocks/Shared/**`: no se necesita ninguna excepción ni behavior nuevos (400, 401 y 500 ya están mapeados; no existe 404 ni 409 en esta HU).
  - `app/frontend/src/app/core/auth/**`, `features/backlog/**` y `features/sprints/**`.
  - La entrada `Equipos y Roles` del sidebar: el shell de navegación sigue sin existir en el repositorio (punto abierto informativo heredado de HU-003 y HU-004); la HU entrega la página y las rutas, no el shell.

## 3. Tech Stack
- **Runtime:** .NET 8 (`net8.0`, C# 12) en backend; Angular 22.2 Zoneless con Signals en frontend.
- **Framework:** Carter 8.1.0 (`ICarterModule`), MediatR 12.4.1 con `ValidationBehavior`, FluentValidation 11.9.2 y Mapster 7.4.0. PrimeNG ^22.1.2 en UI (`p-tabs`, `p-table`, `p-dialog`, `p-select`, `p-inputtext`, `p-message`, `p-toast`, `p-button`, `p-breadcrumb`), tema neutral por defecto.
- **Database:** PostgreSQL con EF Core Npgsql 8.0.11, Code-First, `TeamsDbContext` nuevo con schema `teams`.
- **Infrastructure:** Docker, Keycloak 24 con `Keycloak.AuthServices.Authentication` 2.5.2 (ya configurado). Esta HU **no usa** RabbitMQ, MassTransit, Redis ni Outbox (ADR-006). Sin paquetes NuGet nuevos.
- **Testing:** Backend xUnit + FluentAssertions + Testcontainers PostgreSQL (mismas versiones que HU-003/004). Frontend Jest. Pruebas no tautológicas: cada prueba debe poder fallar si se rompe la regla que dice verificar.

## 4. Development Workflow
- **Cómo levantar el proyecto:** `docker-compose up -d` (PostgreSQL y Keycloak), `dotnet run --project app/backend/src/Bootstrapper/Api`; frontend `npm start` en `app/frontend`. Configuración por variables de entorno o `appsettings.Development.json`.
- **Cómo ejecutar tests / lint / build:** `dotnet build app/backend/TechWorkHub.sln` y `dotnet test app/backend/TechWorkHub.sln` (la integración con Docker se ejecuta en serie: contención de contenedores conocida). Frontend: `npm test` y `npm run build` (el build requiere Node >= 22.22.3, reserva abierta heredada de HU-003 y HU-004).
- **Cómo ejecutar migraciones:** `dotnet ef migrations add InitialTeamsSchema -c TeamsDbContext -p app/backend/src/Modules/Teams -s app/backend/src/Bootstrapper/Api -o Data/Migrations`. Se aplica en el arranque con `Database:MigrateOnStartup=true` mediante `MigrateTeamsModuleAsync`. La migración solo crea objetos en el schema `teams` (incluida su tabla `__EFMigrationsHistory`, como los otros módulos).

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - VSA, CQRS intra-proceso con MediatR, validación antes del handler, interceptores globales de `Shared` sin reimplementarlos.
  - **Orden de evaluación del caso de uso Registrar (determinista, una sola secuencia):** (1) validador 400 (nombre y rol presentes y no vacíos ni de solo espacios, FR-007) → (2) identidad (`ICurrentUser.UserId`, 401) → (3) el rol existe en el catálogo (si no, `BadRequestException` 400 "rol no válido", FR-006) → (4) un único `SaveChangesAsync`. Cuando el nombre es inválido **y** el rol no existe, gana el 400 del validador (no se consulta la base de datos con datos ya inválidos).
  - **Todas las consultas y el registro son de la misma base de datos y el mismo schema**: el miembro y el rol viven en `teams`, por lo que la FK `TeamMembers.TechnicalRoleId → TechnicalRoles.Id` es **real** y no hay contrato in-process ni cruce de schemas (ADR-002).
  - **No se modifica nada fuera del schema `teams`** (FR-014): el handler no lee ni escribe backlog, Sprints ni asignaciones. Las estimaciones Dev y QA del backlog permanecen independientes del catálogo (punto abierto 8).
  - No se implementan modificar, desactivar, eliminar, cambiar el rol, alta o edición de roles, varios roles por miembro, registro en lote, unicidad del nombre, longitud máxima, filtros, orden configurable ni paginación (puntos abiertos 1 a 8, UX D-03 y D-04).
- **Dependencias permitidas:** solo el stack de la constitución. Mapster para DTOs. Prohibido AutoMapper, `[ApiController]`, referenciar `BacklogDbContext`, `SprintsDbContext` o `ApplicationDbContext` desde `Teams`, y cualquier FK o `JOIN` hacia otro schema.
- **Patrones prohibidos:** variables "hardcodeadas" (cadenas de conexión, URLs, realm); consultas o joins cross-schema; `Console.WriteLine`; controllers clásicos; capturar y tragar excepciones; exponer `CreatedAt`/`CreatedBy` en respuestas (UX D-09); crear los roles fuera de la migración (no hay endpoint, ni job de arranque, que los inserte).

### 5.1. State Management Architecture
- **Frontera de Estado:** La verdad reside en PostgreSQL, schema `teams`, tablas `TechnicalRoles` y `TeamMembers`. La identidad reside en Keycloak. En el cliente, cada componente guarda solo estado de vista en Signals (`members`, `roles`, `isLoading`, `loadError`, `isSubmitting`, `formError`) y **no cachea** miembros ni roles entre navegaciones: el catálogo se vuelve a consultar al abrir el diálogo y al recibir un 400 por rol (UX Estado 7).
- **Estrategia de Sincronización:** HTTP síncrono. Tras un registro exitoso el cliente cierra el diálogo, muestra el toast con los datos devueltos por el servidor y **vuelve a consultar la grilla** (consulta fresca, sin inserción optimista, UX D-07 y SC-004). Sin Optimistic UI, polling ni WebSockets.
- **Consistencia:** Fuerte. El registro escribe **una sola fila** en un único `SaveChangesAsync`, por lo que no existe estado parcial posible (FR-013, SC-008). Dos registros simultáneos con el mismo nombre producen dos miembros distintos: la unicidad no está definida (punto abierto 2) y no se inventa; la única restricción de unicidad es el nombre del rol del catálogo, que protege la semilla. El doble envío del formulario se mitiga en cliente deshabilitando el botón mientras `isSubmitting()`; si llegara un segundo envío se registraría un segundo miembro, comportamiento consistente con "no se impone unicidad".

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:**
  - *PostgreSQL caído o fallo al guardar:* `CustomExceptionHandler` responde 500 con ProblemDetails genérico sin trazas y registra con Serilog. No queda miembro parcial porque hay una fila y una transacción (FR-013).
  - *Keycloak caído:* imposibilidad de validar tokens; el esquema de autenticación existente responde 401 en las tres operaciones sin leer datos (FR-011).
  - *Fallo de lectura (consultas de miembros o de roles):* responde 500 genérico. La HU no define la UI para un error distinto de 401 (UX B-04): se acuerda un estado de error de lectura genérico y mínimo, ⚠️ [PROPUESTO] y a confirmar con el BA, que es un `p-message severity="error"` con el texto "No fue posible cargar los datos. Intente nuevamente." dentro de la pestaña y un botón `Reintentar`. No expone el cuerpo de la respuesta.
- **Patrones de Tolerancia a Fallos:** `CancellationToken` propagado desde el endpoint hasta EF Core (obligatorio en producción). **Sin reintentos automáticos de escritura** (el registro no es idempotente y repetirlo crearía otro miembro; el reintento es manual, UX Estado 10) y sin Circuit Breaker ni fallbacks. Las consultas usan `AsNoTracking()` y proyección directa a DTO. Timeouts: los de ASP.NET y Npgsql por defecto; no se añaden políticas propias.
- **Proporcionalidad:** dos tablas pequeñas, cero llamadas externas y cero infraestructura nueva. La meta de SC-007 (2 s con hasta 100 miembros) se cumple con una consulta con `JOIN` local a `TechnicalRoles`; no se justifica caché ni paginación.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Validados y formalizados desde `spec.md` y `ux_012_*.md`; las decisiones impuestas por la constitución se marcan como heredadas.)*

#### ADR-001: Carter, MediatR y Vertical Slice Architecture
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-016 exige respetar la constitución. Hay tres casos de uso: registrar miembro, consultar miembros y consultar roles.
- **Decisión:** Un endpoint `ICarterModule` por caso de uso, con `ISender`, `.RequireAuthorization()`, `.Produces<T>()` y `.ProducesProblem()`, en `Features/TeamMembers/{RegisterTeamMember|ListTeamMembers}/` y `Features/TechnicalRoles/ListTechnicalRoles/`, con Command/Query, Validador y Handler co-ubicados.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cada carpeta se audita contra una historia de usuario de la spec (US1, US2, US3 y US4).
  - ⚠️ **Trade-off / Costo Real:** varios ficheros por un modelo de dos campos; es el costo fijo de VSA.

#### ADR-002: PostgreSQL con schema aislado `teams`, DbContext propio y sin consultas cross-schema
- **Estado:** Aceptado (heredado)
- **Contexto:** La constitución §3 exige un `DbContext` y un schema por módulo y prohíbe `JOIN`/consultas cross-schema (FR-016). Miembros y roles se consultan siempre juntos.
- **Decisión:** `TeamsDbContext` con schema `teams` y las dos tablas dentro de él. La FK de `TeamMembers` a `TechnicalRoles` es local y real. Auditoría por `AuditableEntityInterceptor` de `Shared` (registrado en `AddTeamsModule`, igual que `SprintsModule`); `TeamMember` hereda de `Aggregate<Guid>` y `TechnicalRole` de `Entity<Guid>`.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** integridad referencial garantizada por la base de datos y ninguna migración toca otros schemas.
  - ⚠️ **Trade-off / Costo Real:** HU futuras de otros módulos (013, 014, 021, 023, 027) no podrán hacer `JOIN` con `teams`: deberán consumir un contrato in-process que esta HU **no** define (ADR-004) o guardar el `MemberId` sin FK, como `SprintItems.ItemId`.

#### ADR-003: Módulo nuevo `Teams` con roles y miembros juntos
- **Estado:** Aceptado
- **Contexto:** Hay que decidir dónde viven los datos maestros de personas y roles. La épica P2 (HU-012 a HU-015) y varias HU de P4 y P5 los consumen. Ningún módulo existente (`Backlog`, `Application`, `Sprints`) es su dueño natural.
- **Decisión:** Crear el módulo `Teams` (schema `teams`) y alojar en él tanto el catálogo de roles como los miembros. Se nombra por el dominio (equipos y roles) y no por la HU, para que HU-013 a HU-015 lo extiendan.
- **Alternativas Consideradas:**
  - **Alternativa A (añadir `TeamMember` al módulo `Backlog` o `Sprints`):** evitaría registrar un módulo. Se descarta porque obligaría a modificar un módulo `ACTIVE` ajeno al dominio (FR-014), mezclaría personas con planificación y haría imposible extraer el módulo después.
  - **Alternativa B (dos módulos, `Members` y `Roles`):** máxima separación. Se descarta por desproporcionada: el rol solo tiene sentido como atributo del miembro, ambos se consultan en un mismo `JOIN` y separarlos exigiría un contrato in-process o consistencia eventual para validar el rol en cada registro.
  - **Alternativa C (guardar la persona en Keycloak y no tener tabla):** descartada por la HU (FR-010, punto abierto 5): el miembro no es un usuario de acceso y no se vincula con el servidor de identidad.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cero cambios en módulos existentes; un lugar único para las HU 013 a 015 de P2.
  - ⚠️ **Trade-off / Costo Real:** un módulo más para registrar (proyecto, referencia en `Api.csproj`, solución, dos proyectos de pruebas y una línea de arranque en `Program.cs`) por un modelo pequeño. Si el negocio decide más adelante que las personas viven en otro sistema, el módulo completo se reemplaza.

#### ADR-004: Catálogo de roles sembrado por la migración, sin alta ni edición, y sin contrato público todavía
- **Estado:** Aceptado
- **Contexto:** FR-004 exige un catálogo con al menos "Desarrollo" y "QA"; el alta o edición de roles y el conjunto completo ("etc.") quedan fuera de alcance (punto abierto 4). QA documental dejó para Architecture el origen de los datos del catálogo. Las HU futuras necesitarán consultar miembros y roles desde otros módulos.
- **Decisión:** Los dos roles se insertan en la migración `InitialTeamsSchema` mediante `InsertData` con **identificadores fijos** (GUID constantes en `TechnicalRoleSeed`, referenciados por las pruebas). No existe endpoint de alta o edición de roles ni borrado. La tabla `TechnicalRoles` tiene índice único `UX_TechnicalRoles_Name`. **No** se define ahora `ITeamsModuleApi` ni ningún contrato in-process: no hay consumidor en esta HU; lo definirá la primera HU que lo necesite (013, 014, 021, 023 o 027) siguiendo el patrón de `IApplicationModuleApi`.
- **Alternativas Consideradas:**
  - **Alternativa A (enum de C# con los dos roles, sin tabla):** más simple. Se descarta porque la HU exige "identificador y nombre" por rol, un catálogo consultable y la posibilidad de ampliarlo sin recompilar; un enum obligaría a un cambio de código por cada rol nuevo y a otra migración de datos al migrar a tabla.
  - **Alternativa B (sembrar en el arranque desde un `IHostedService` o desde configuración):** permite ajustar el catálogo por entorno. Se descarta por añadir un punto de fallo y de carrera en el arranque (varias instancias), y por la configuración extra sin un requisito que la pida.
  - **Alternativa C (tabla vacía y endpoint de alta de roles):** inventa la administración del catálogo, que es un punto abierto fuera de alcance.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el catálogo es reproducible y versionado con el esquema; todo entorno que migre tiene exactamente "Desarrollo" y "QA" con los mismos identificadores; las pruebas pueden fijarlos.
  - ⚠️ **Trade-off / Costo Real:** añadir un rol hoy exige una **migración nueva** (cambio de código y despliegue), y los GUID de la semilla quedan en el historial de migraciones y no pueden cambiarse sin migrar datos. Cuando el negocio defina quién administra el catálogo (punto abierto 4), habrá que añadir los casos de uso de alta y edición.

#### ADR-005: El rol se envía por nombre y el servidor lo resuelve contra el catálogo
- **Estado:** Aceptado
- **Contexto:** Los escenarios de la spec expresan el rol como nombre ("Desarrollo", "QA", "Chef") y exigen HTTP 400 "indicando que el rol no es válido" cuando no existe (FR-006), distinto del 400 por campo ausente (FR-007). El UX alimenta el selector con la consulta del catálogo (D-02).
- **Decisión:** `POST /api/team-members` recibe `{ "name": string?, "role": string? }`, donde `role` es el **nombre** del rol del catálogo. El validador exige `name` y `role` presentes, no vacíos y no compuestos solo de espacios (errores bajo las claves `name` y `role`); el handler recorta (`Trim`) el nombre antes de persistir, busca el rol por nombre exacto (`TechnicalRoles.FirstOrDefaultAsync(r => r.Name == role)`, comparación sensible a mayúsculas, la de PostgreSQL por defecto) y, si no existe, lanza `BadRequestException` con `TeamMemberRules.InvalidRoleMessage` (400 `Bad Request`, no 404). La respuesta devuelve el nombre del rol, no su identificador, en el campo `role`; el identificador del rol solo aparece en el catálogo (`GET /api/technical-roles`).
- **Alternativas Consideradas:**
  - **Alternativa A (enviar `roleId` GUID):** referencia más robusta a renombrados. Se descarta porque "Chef" (SC-06) no es un identificador y habría que traducir un GUID malformado a "rol no válido", y porque obliga al cliente de pruebas y al de la UI a conocer GUID que la HU no menciona; además, el nombre es único por índice, por lo que identifica sin ambigüedad.
  - **Alternativa B (aceptar nombre o identificador indistintamente):** más flexible. Se descarta por ambigüedad de contrato y de pruebas sin ningún requisito que la pida.
  - **Alternativa C (404 para el rol inexistente):** la spec fija explícitamente 400 (FR-006).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el contrato coincide literalmente con los escenarios de negocio y el 400 por rol se distingue del 400 por campo ausente por su mensaje.
  - ⚠️ **Trade-off / Costo Real:** si en el futuro se permite renombrar roles (punto abierto 4), los clientes que envían el nombre se romperían y el contrato debería migrar a `roleId` (cambio de API versionado). La comparación sensible a mayúsculas rechaza "desarrollo" en minúsculas; es el comportamiento de lista cerrada que el UX asegura con el selector.

#### ADR-006: Sin eventos de dominio ni de integración, Outbox ni caché
- **Estado:** Aceptado
- **Contexto:** Ningún requisito notifica a otros módulos al registrar un miembro, y las consultas están acotadas a 100 miembros (SC-007).
- **Decisión:** `TeamMember` hereda de `Aggregate<Guid>` por la jerarquía estándar pero no emite eventos. Sin tabla `OutboxMessage`, sin MassTransit y sin decorador Redis.
- **Alternativas Consideradas:**
  - **Alternativa A (emitir `TeamMemberRegisteredIntegrationEvent` para HU-013, 014 y 015):** anticiparía la integración. Se descarta porque no hay consumidor y el diseño debe nacer de un requisito.
  - **Alternativa B (decorador Redis para el catálogo de roles):** se descarta por no existir un cuello de botella medido y por añadir invalidación a un dato que solo cambia con una migración.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** ningún punto de fallo adicional.
  - ⚠️ **Trade-off / Costo Real:** si una HU posterior necesita reaccionar al registro, deberá añadir el evento y, por ser crítico, el Outbox (constitución §4).

#### ADR-007: Nombre sin restricción de longitud ni unicidad, almacenado como `text` y recortado
- **Estado:** Aceptado
- **Contexto:** La unicidad, la longitud máxima y los caracteres admitidos del nombre no están definidos (puntos abiertos 2 y CB-05, CB-06). Una columna `varchar(n)` o un índice único los impondrían de facto (FR-015). Para la vista, un nombre con espacios al inicio o fin se considera el mismo texto.
- **Decisión:** `TeamMembers.Name` es `text NOT NULL`, sin índice único, y el handler guarda `name.Trim()`. El validador solo comprueba presencia y que no sea vacío ni solo espacios (FR-007). No se aplican límites de longitud ni filtro de caracteres.
- **Alternativas Consideradas:**
  - **Alternativa A (`varchar(100)` con validación de longitud):** cierra un vector de abuso y evita nombres gigantes. Se descarta porque inventa una regla de negocio que la HU deja explícitamente sin definir.
  - **Alternativa B (índice único sobre `Name`):** evitaría homónimos accidentales. Se descarta por la misma razón y porque impediría registrar a dos personas con el mismo nombre, que el negocio no ha descartado.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el diseño no contradice ninguna de las respuestas posibles del negocio; añadir un límite o una unicidad después es un cambio de migración y validador, no de modelo.
  - ⚠️ **Trade-off / Costo Real:** sin límite de longitud, un cliente con un token válido puede enviar un nombre muy grande y se acepta hasta el límite de cuerpo de ASP.NET (30 MB por defecto en Kestrel), y no se evitan homónimos ni el doble registro accidental. Es un riesgo aceptado hasta que el negocio defina las reglas.

## 6. Coding Conventions
- **Naming:** PascalCase para tipos; camelCase para locales y parámetros. Ficheros `RegisterTeamMember…`, `ListTeamMembers…` y `ListTechnicalRoles…` con sufijos `Endpoint|Command|Query|Validator|CommandHandler|QueryHandler.cs`. Los textos de error son constantes públicas (`TeamMemberRules`) para que las pruebas las referencien.
- **Contrato HTTP (a formalizar por el API Architect; propuesta alineada con el UX):**
  - `POST /api/team-members` con cuerpo `{ "name": "Ana Torres", "role": "Desarrollo" }` → **201 Created** (⚠️ [PROPUESTO], la HU solo dice "código de éxito") con `Location` hacia `GET /api/team-members` y cuerpo `{ id, name, role }`; 400 con `errors` por campo (`name`, `role`) o con `detail` de rol inválido; 401; 500.
  - `GET /api/team-members` → 200 con arreglo `[{ id, name, role }]` (vacío si no hay); 401; 500.
  - `GET /api/technical-roles` → 200 con arreglo `[{ id, name }]` (como mínimo "Desarrollo" y "QA"); 401; 500.
  - Las respuestas **no** incluyen `CreatedAt`/`CreatedBy` ni estado alguno (UX D-09, FR-015). JSON en camelCase.
  - Reconciliación de rutas: las `/equipos...` del UX son rutas de **UI**; la API usa `/api/team-members` y `/api/technical-roles` (rutas independientes de las de la UI, como en Sprints). Las rutas de API del UX eran provisionales.
- **Mensajes:** `TeamMemberRules.InvalidRoleMessage` ("El rol indicado no es válido.") y mensajes de campo en el validador; sin detalles internos. El UX Estado 7 espera que el `detail` del 400 contenga la indicación de rol no válido y el Estado 8 que `errors` traiga los campos inválidos.
- **Orden de las consultas (⚠️ [PROPUESTO], no es contrato de orden: punto abierto 7):** miembros por `CreatedAt` y luego `Id` (estabilidad); roles por `Name`. La UI no reordena.
- **Identidad antes que datos:** `RegisterTeamMemberCommandHandler` resuelve `ICurrentUser.UserId` antes de cualquier acceso a datos (sin claim: `UnauthorizedAccessException`, 401). `CreatedBy` proviene del `sub` vía `AuditableEntityInterceptor`, nunca del cuerpo. Las dos consultas de lectura dependen únicamente de `.RequireAuthorization()` (no leen ni persisten sin token válido, FR-011).
- **Logging:** Serilog vía `ILogger<T>`; sin `Console.WriteLine`; sin datos de token. El nombre del miembro se considera dato personal y **no** se escribe en logs.
- **Async:** todo método con E/S recibe y propaga `CancellationToken`.
- **Frontend:** componentes standalone con `ChangeDetectionStrategy.OnPush`, Signals e `inject()`; formulario reactivo tipado de dos controles; textos con i18n nativo. Sin validación de negocio duplicada en el cliente: el botón solo se bloquea durante `isSubmitting()` y los errores 400/401/500 se pintan desde la respuesta (UX D-05). La interfaz no ofrece editar, desactivar ni eliminar miembros ni administrar roles. Un 401 persistente reutiliza el interceptor y el guard existentes (Estado 9). El diálogo se abre siempre limpio.

## 7. Testing
- **Qué debe testearse y Dónde están los tests:**
  - **Unitarias (`tests/Unit/Teams`):** `RegisterTeamMemberValidator` con los tres ejemplos de SC-07 (nombre ausente, nombre de solo espacios, rol ausente) más rol de solo espacios, comprobando que el error cae en el campo correcto (`name` o `role`); `RegisterTeamMemberCommandHandler` (sin identidad ⇒ 401 antes de tocar datos; rol inexistente ⇒ `BadRequestException` con `InvalidRoleMessage` y **nada** persistido; éxito ⇒ un único `SaveChanges`, nombre recortado, rol resuelto); `ListTeamMembersQueryHandler` (vacío y exactitud); `ListTechnicalRolesQueryHandler`; `TeamMember.Create`. La base de datos puede sustituirse con SQLite/InMemory solo en unitarias; en integración nunca.
  - **Integración (`tests/Integration/Teams`, PostgreSQL real por Testcontainers, una BD por prueba):** SC-01 (201, cuerpo `{id, name, role}`, fila con `CreatedBy` = `sub` y `CreatedAt` informado), SC-02 (rol QA), SC-03 (backlog, Sprints y asignaciones sin cambios: se compara el contenido de los schemas `backlog` y `sprints` antes y después), SC-04 y SC-05 (consulta de miembros exacta y vacía), SC-06 (catálogo con "Desarrollo" y "QA" y los GUID de la semilla), SC-07 (rol "Chef" ⇒ 400 y **tabla `TeamMembers` vacía después**), SC-08 (los tres ejemplos de campos ausentes ⇒ 400 con los campos y tabla vacía), SC-09 (401 en las tres operaciones sin token, con token inválido y expirado, sin leer ni persistir), SC-10 (fallo de persistencia forzado ⇒ 500 sin traza y sin fila).
  - **Migración:** una prueba aplica `InitialTeamsSchema` sobre una base vacía y comprueba que existen solo objetos del schema `teams`, que la semilla trae exactamente dos roles con los GUID fijos, que `UX_TechnicalRoles_Name` rechaza por SQL directo un tercer rol de nombre repetido y que la FK rechaza un `TechnicalRoleId` inexistente. Verifica que `backlog`, `sprints` y `application` no cambian.
  - **No regresión (FR-014):** las suites de HU-001 a HU-004 pasan sin modificaciones; ningún fichero de esos módulos es tocado.
  - **Rendimiento (SC-007):** 100 miembros sembrados por `TeamsDbContext`; ambas consultas responden en menos de 2 s.
  - **Frontend (Jest, `*.spec.ts` junto a cada componente):** `team-page` (Estados 1, 2, 3 y 9, y el estado de error de lectura) y `register-member-dialog` (Estados 4, 5, 6, 7, 8A a 8C, 9 y 10), comprobando que la grilla se vuelve a consultar al servidor tras el éxito, que el diálogo conserva los valores ante 400 y 500, que el selector se alimenta del catálogo y que el botón se deshabilita durante el envío.
- **Reglas:** TDD (prueba primero). Prohibido `[Fact(Skip=...)]`, doble de la base de datos en integración y aserciones que no puedan fallar. La identidad en integración puede usar el mecanismo de autenticación de prueba ya presente (HU-002 cubre Keycloak real).

## 8. Security
- **Manejo de secretos:** cadenas de conexión y configuración de Keycloak por variables de entorno. Nada de credenciales en el repositorio ni en `appsettings.json`.
- **Datos sensibles y Acciones prohibidas:** los tres endpoints invocan `.RequireAuthorization()`; basta un token válido con identidad (punto abierto 6: sin roles). Prohibido relajar `verify-token-audience` o añadir endpoints anónimos. Los 500 no exponen trazas. `CreatedBy` proviene del `sub`, nunca del cuerpo. El nombre de una persona es dato personal: no se escribe en logs ni se devuelve `CreatedBy`. Las consultas usan parámetros de EF Core (sin concatenación de SQL). La UI pinta texto con interpolación de Angular (sin `innerHTML`) para evitar XSS por el nombre.
- **Riesgo aceptado:** al no haber roles de acceso definidos, cualquier usuario autenticado puede registrar miembros (punto abierto 6, como en HU-001, 003 y 004).

## 9. Database
- **Schema:** Relacional, schema `teams`.
  - `teams."TechnicalRoles"`: `Id uuid PK`, `Name text NOT NULL` con índice único `UX_TechnicalRoles_Name`. Sin columnas de auditoría de alta (se siembra por migración); si `Entity<Guid>` las exige por la jerarquía de `Shared`, las gestiona el interceptor y la semilla las informa con una fecha fija y `CreatedBy = "system"`, decisión de implementación del Data Architect dentro de estas reglas.
  - `teams."TeamMembers"`: `Id uuid PK`, `Name text NOT NULL`, `TechnicalRoleId uuid NOT NULL` con **FK** a `teams."TechnicalRoles"("Id")` `ON DELETE RESTRICT`, `CreatedAt timestamptz NOT NULL`, `CreatedBy text NOT NULL`, `LastModified timestamptz NULL`, `LastModifiedBy text NULL` (auditoría gestionada por `AuditableEntityInterceptor`, no a mano). Índice no único `IX_TeamMembers_TechnicalRoleId`. Sin columnas de estado, correo, usuario de acceso ni más de un rol. El detalle de tipos lo fija el Data Architect dentro de estas reglas.
- **Reglas para modificar DB:** migraciones solo en `app/backend/src/Modules/Teams/Data/Migrations`; `InitialTeamsSchema` solo **crea** objetos nuevos (sin DDL bloqueante sobre tablas existentes) y no toca los schemas `backlog`, `application` ni `sprints`. Si el negocio cambia la cardinalidad miembro–rol, añade administración de roles o unicidad, el cambio es una migración nueva (ADR-004, ADR-007).

## 10. Git & PR Rules
- **Naming de branches y Commits:** la rama la gestiona el Watcher GitOps (`feat/012-HU_miembros_equipo_y_roles_tecnicos`). Los agentes no ejecutan Git. Commits con Conventional Commits.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:** leer `spec.md`, esta guía y `ux_012_*.md`; revisar `Modules/Sprints` (`SprintsModule.cs`, `SprintsDbContext`, `SprintsDbContextFactory`, configuraciones y los features de `Sprints`) como plantilla estructural exacta del módulo nuevo, y `Program.cs`/`Api.csproj` para el registro; escribir primero las pruebas del escenario.
- **Qué debe validar después / Cuándo pedir confirmación:**
  - `dotnet build` y `dotnet test` de toda la solución en verde, con las suites de HU-001 a HU-004 sin cambios.
  - Que ningún fichero de `Modules/Backlog`, `Modules/Application`, `Modules/Sprints` ni de `Shared` fue modificado, y que los únicos cambios fuera de `Modules/Teams` son los listados en §2.
  - Que no existe modificar, desactivar, eliminar, alta o edición de roles, varios roles, lote, límite de nombre, unicidad, filtros, orden configurable ni paginación, y que ninguna respuesta incluye `CreatedAt`/`CreatedBy`.
  - Detenerse y escalar si una tarea exige cambiar entidades de otros módulos, referenciar un `DbContext` ajeno, añadir un rol fuera de la migración, o resolver un punto abierto para continuar.
- **Reconciliación UX → tareas:** `Task-UI-01` → `team-page` (grilla de miembros con datos y vacía, Estados 1 y 2); `Task-UI-02` → `team-page` (pestaña de roles, Estado 3); `Task-UI-03` → `register-member-dialog` (Estado 4); `Task-UI-04` → `register-member-dialog` + `team-page` (toast y refresco, Estados 5 y 6); `Task-UI-05` y `Task-UI-06` → `register-member-dialog` (400 por rol y por campos, Estados 7 y 8); `Task-UI-07` → interceptor y guard existentes sin cambios (Estado 9); `Task-UI-08` → `register-member-dialog` (500, Estado 10). El estado de error de lectura (§5.2) se añade a `Task-UI-01` y `Task-UI-02`.
- **Aclaración para Spec Kit:** `spec.md` no contradice esta guía. FR-006 se implementa con `BadRequestException` (400) y FR-007 con el validador; el contrato exacto del código de éxito (201) y de las rutas lo cierra el API Architect.

## 12. Definition of Done
- Todo el código nuevo cuenta con patrones de resiliencia y manejo de estado definidos (§5.1 y §5.2).
- No hay ninguna credencial o variable de entorno hardcodeada.
- Las migraciones de base de datos han sido auditadas (solo schema `teams`, FK local, semilla de dos roles con GUID fijos, sin tocar `backlog`, `application` ni `sprints`).
- Tests y Lint pasan exitosamente en el entorno de CI, sin regresión en HU-001 a HU-004.
- Los escenarios SC-01..SC-10 tienen prueba automatizada, con la tabla `TeamMembers` verificada vacía tras cada rechazo.
- Ninguna solicitud rechazada (400, 401, 500) deja filas en `TeamMembers`.
- No existen consultas ni FKs cross-schema, ni cambios en otros módulos ni en `Shared`.
- El nombre del miembro no aparece en logs y las respuestas no exponen `CreatedAt`/`CreatedBy`.
