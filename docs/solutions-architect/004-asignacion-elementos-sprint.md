# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 04-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/004-asignacion-elementos-sprint/`, `documents/designer-ux/ux-004-asignacion-elementos-sprint.md` y la resolución humana del tracker (04-10-2026, 10:32:00, opción **A**). `plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE; los `Task-UI-xx` y las rutas del UX son provisionales y se reconcilian aquí.

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub - Plataforma de gestión ágil. Esta HU añade la relación Sprint–Elemento: asignar un elemento del backlog a un Sprint (un elemento por solicitud) y consultar los elementos asignados a un Sprint.
- **Qué problema resuelve:** Da contenido planificable a los Sprints de la HU-003 (la HU-006 y la HU-031 dependen de ello) sin dejar asignaciones huérfanas, duplicadas ni parciales (FR-005..FR-007, FR-011, FR-012, SC-002, SC-007).
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con los módulos `Backlog`, `Application` y `Sprints` (HU-001, HU-002 y HU-003, todas ACTIVE). No altera datos ni comportamiento de HU-001 ni de HU-003 (FR-013, FR-014).
- **Arquitectura general:** Modular Monolith .NET 8 con Vertical Slice Architecture (VSA) y frontend Angular 22 Zoneless. **No se crea un módulo nuevo:** la asignación vive en el módulo `Sprints` (schema `sprints`) y consume al módulo `Backlog` por un contrato in-process.
- **Decisión de negocio incorporada (lex humana, sin conflicto con la constitución):** un elemento pertenece a **un solo Sprint**; asignar uno ya asignado (al mismo Sprint o a otro) responde **409 Conflict**. Esto reemplaza al FR-015 y a los casos borde CB-06, CB-07 y CB-10 de `spec.md`, que siguen redactados como "no documentado" (ver §11, reconciliación).

## 2. Repository Structure
- **Backend (se extiende el módulo existente):** `app/backend/src/Modules/Sprints/`.
  ```text
  app/backend/src/Modules/Sprints/
  ├── Contracts/
  │   └── IBacklogModuleApi.cs                      ← contrato in-process hacia Backlog (ExistsAsync, GetSummariesAsync, BacklogItemSummary)
  ├── Domain/SprintItems/
  │   ├── SprintItem.cs                             ← Aggregate<Guid>, IAuditableEntity, SprintItem.Create(sprintId, itemId)
  │   └── SprintItemRules.cs                        ← constantes de campos y mensajes (única fuente)
  ├── Data/
  │   ├── ISprintsDbContext.cs                      ← se añade DbSet<SprintItem> SprintItems
  │   ├── SprintsDbContext.cs                       ← se añade el DbSet (mismo schema "sprints")
  │   ├── Configurations/SprintItemConfiguration.cs ← FK local a Sprints + índice único sobre ItemId
  │   └── Migrations/                               ← AddSprintItems
  └── Features/SprintItems/
      ├── AssignItemToSprint/   AssignItemToSprintCommand.cs · AssignItemToSprintValidator.cs · AssignItemToSprintCommandHandler.cs · AssignItemToSprintEndpoint.cs
      ├── ListSprintItems/      ListSprintItemsQuery.cs · ListSprintItemsQueryHandler.cs · ListSprintItemsEndpoint.cs
      ├── SprintItemResponse.cs                     ← { id, title, type, devPoints, qaPoints }
      └── AssignedItemResponse.cs                   ← { sprintId, itemId }
  app/backend/src/Modules/Backlog/
  └── BacklogModuleApi.cs                           ← implementa Sprints.Contracts.IBacklogModuleApi (solo lee el schema backlog)
  ```
- **Backend (pruebas):** `app/backend/tests/Unit/Sprints/` y `app/backend/tests/Integration/Sprints/` (proyectos existentes; no se crean proyectos nuevos).
- **Frontend:** `app/frontend/src/app/features/sprints/` (feature existente): `components/sprint-assigned-items/` (Estados 1, 2, 4, 5, 9, 10 y variante B del 8), `components/assign-item-dialog/` (Estados 3, 6, 7, 8A, 10, 11, 12), ampliación de `services/sprint-api.service.ts` con `assignItem` y `listItems`, y de `models/sprint.models.ts`. Ruta `sprints/:id/elementos` registrada **dentro del bloque `sprints` existente** de `app.routes.ts` (hereda `authGuard` y `MessageService`), declarada **antes** de `:id`.
- **Importante:** Agrupación estricta por feature (VSA): Endpoint, Command/Query, Validador y Handler de cada caso de uso conviven en su carpeta. Prohibidas las carpetas horizontales `/Controllers`, `/Services`, `/Validators`, `/Repositories`.
- **Qué NO debe tocar:**
  - `Modules/Application/**`.
  - Dentro de `Modules/Backlog/**`: entidad `BacklogItem`, `BacklogDbContext`, configuraciones, migraciones y features de HU-001. Solo se **añade** `BacklogModuleApi.cs` y su registro.
  - Dentro de `Modules/Sprints/**`: la entidad `Sprint`, `SprintRules`, la migración `InitialSprintsSchema` y las features de HU-003. No se añade estado, ni columnas, ni navegaciones a `Sprint`.
  - `app/frontend/src/app/core/auth/**` y `features/backlog/**`. El detalle del Sprint de HU-003 solo recibe el botón de navegación `Elementos asignados` (UX D-02), sin alterar sus cuatro datos.
- **Cambios permitidos fuera del módulo `Sprints` (únicos):**
  1. `Modules/Sprints/Sprints.csproj`: ningún cambio de referencias (Sprints **no** referencia a Backlog).
  2. `Modules/Backlog/Backlog.csproj`: `ProjectReference` hacia `..\Sprints\Sprints.csproj` (para implementar el contrato) y `BacklogModule.cs`: una línea de registro `services.AddScoped<IBacklogModuleApi, BacklogModuleApi>()`.
  3. `BuildingBlocks/Shared/Exceptions/`: **añadir** `ConflictException` y su rama 409 en `CustomExceptionHandler` (ADR-005). Cambio estrictamente aditivo.
  4. `app.routes.ts` (una ruta hija) y la vista de detalle de HU-003 (un botón de navegación).

## 3. Tech Stack
- **Runtime:** .NET 8 (`net8.0`, C# 12) en backend; Angular 22.2 Zoneless con Signals en frontend.
- **Framework:** Carter 8.1.0 (`ICarterModule`), MediatR 12.4.1 con `ValidationBehavior`, FluentValidation 11.9.2 y Mapster 7.4.0. PrimeNG ^22.1.2 en UI (`p-table`, `p-dialog`, `p-message`, `p-toast`, `p-inputtext`, `p-button`, `p-breadcrumb`), tema neutral por defecto.
- **Database:** PostgreSQL con EF Core Npgsql 8.0.11, Code-First, schema `sprints` y `SprintsDbContext` existente.
- **Infrastructure:** Docker, Keycloak 24 con `Keycloak.AuthServices.Authentication` 2.5.2 (ya configurado). Esta HU **no usa** RabbitMQ, MassTransit, Redis ni Outbox (ADR-006). Sin paquetes NuGet nuevos.
- **Testing:** Backend xUnit + FluentAssertions + Testcontainers PostgreSQL (mismas versiones que HU-003). Frontend Jest. Pruebas no tautológicas: cada prueba debe poder fallar si se rompe la regla que dice verificar.

## 4. Development Workflow
- **Cómo levantar el proyecto:** `docker-compose up -d` (PostgreSQL y Keycloak), `dotnet run --project app/backend/src/Bootstrapper/Api`; frontend `npm start` en `app/frontend`. Configuración por variables de entorno o `appsettings.Development.json`.
- **Cómo ejecutar tests / lint / build:** `dotnet build app/backend/TechWorkHub.sln` y `dotnet test app/backend/TechWorkHub.sln` (la integración de Docker se ejecuta en serie: la contención de contenedores ya es un hallazgo conocido de HU-003). Frontend: `npm test` y `npm run build` (el build requiere Node >= 22.22.3, reserva abierta de HU-003).
- **Cómo ejecutar migraciones:** `dotnet ef migrations add AddSprintItems -c SprintsDbContext -p app/backend/src/Modules/Sprints -s app/backend/src/Bootstrapper/Api -o Data/Migrations`. Se aplica en arranque con `Database:MigrateOnStartup=true` mediante el `MigrateSprintsModuleAsync` existente (no se añade llamada nueva en `Program.cs`). La migración solo crea objetos en el schema `sprints`.

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - VSA, CQRS intra-proceso con MediatR, validación antes del handler, interceptores globales de `Shared` sin reimplementarlos.
  - **Orden de evaluación del caso de uso Asignar (determinista, una sola secuencia):** (1) validador 400 → (2) identidad (`ICurrentUser.UserId`, 401) → (3) el Sprint existe (404 "Sprint") → (4) el elemento existe (404 "elemento", vía contrato) → (5) el elemento no está asignado (409) → (6) un único `SaveChangesAsync`. Cuando faltan ambos, gana el 404 del Sprint (decisión del SA: el mensaje del Sprint distingue el recurso de contexto, UX Estado 6).
  - **Un elemento, un Sprint** es una invariante de datos y no solo una validación: la garantiza el índice único `UX_SprintItems_ItemId` (ADR-004).
  - **El Sprint y el elemento no se modifican nunca** (FR-013, FR-014): el handler no carga ni actualiza `Sprint`, y el contrato hacia Backlog es de solo lectura. Prohibido añadir `Status`, `SprintId` o cualquier columna a `BacklogItem` o `Sprint`.
  - No se implementan desasignar, mover, lote, límites de carga, elegibilidad por tipo o estado, restricciones por estado o fecha del Sprint, orden configurable, filtros ni paginación (puntos abiertos 1 a 7 de la HU, UX D-03).
- **Dependencias permitidas:** solo el stack de la constitución. Mapster para DTOs. Prohibido AutoMapper, `[ApiController]`, FKs o `JOIN` hacia el schema `backlog`, y referenciar `BacklogDbContext` desde `Sprints`.
- **Patrones prohibidos:** variables "hardcodeadas" (cadenas de conexión, URLs, realm); consultas o joins cross-schema; `Console.WriteLine`; controllers clásicos; capturar y tragar excepciones; deducir el 409 consultando antes sin el índice único (ver ADR-004).

### 5.1. State Management Architecture
- **Frontera de Estado:** La verdad de la asignación reside en PostgreSQL, schema `sprints`, tabla `SprintItems`. Los datos del elemento residen en el schema `backlog` y se leen siempre a través del contrato en cada consulta (no se duplican ni se proyectan localmente, ADR-003). La identidad reside en Keycloak. En el cliente, cada componente guarda solo estado de vista en Signals (`isSubmitting`, `items`, `loadError`, `formError`) y **no cachea** asignaciones entre navegaciones.
- **Estrategia de Sincronización:** HTTP síncrono. Tras un éxito de la asignación el cliente cierra el diálogo y vuelve a consultar la grilla al servidor (consulta fresca), sin insertar la fila de forma optimista (UX D-07, SC-004). Sin Optimistic UI, polling ni WebSockets.
- **Consistencia:** Fuerte. La asignación es **una sola fila** y un único `SaveChangesAsync`: no existe estado parcial posible (SC-007). La asignación concurrente del mismo elemento (a un Sprint o a dos) se resuelve en la base de datos: el índice único hace que exactamente una solicitud gane y la otra reciba 409 (ADR-004). El doble envío del formulario se mitiga además en cliente deshabilitando el botón mientras `isSubmitting()` (el segundo intento, de llegar, recibe 409 sin duplicar).

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:**
  - *PostgreSQL caído o fallo al guardar:* `CustomExceptionHandler` responde 500 con ProblemDetails genérico sin trazas y registra con Serilog. No queda asignación parcial porque hay una fila y una transacción (FR-012).
  - *Contrato hacia Backlog:* es una llamada in-process al mismo `PostgreSQL`; si falla lanza excepción y el resultado es 500. No hay fallback que dé por existente un elemento no verificado (se prefiere fallar a persistir una asignación huérfana).
  - *Keycloak caído:* imposibilidad de validar tokens, el esquema de autenticación existente responde 401.
- **Patrones de Tolerancia a Fallos:** `CancellationToken` propagado desde el endpoint hasta EF Core y hasta el contrato (obligatorio en producción). **Sin reintentos automáticos de escritura** (la asignación no es idempotente: repetirla produce 409, y es lo definido por negocio) y sin Circuit Breaker ni fallbacks; el cliente reintenta manualmente (UX Estado 11). Las consultas de lectura usan `AsNoTracking()` y una **única** llamada de lote al contrato (sin N+1).
  - *Traducción de la violación de unicidad:* solo la `PostgresException` con `SqlState = 23505` **y** `ConstraintName = UX_SprintItems_ItemId` se convierte en `ConflictException` (409). Cualquier otro `DbUpdateException` se propaga y termina en 500.
- **Proporcionalidad:** una tabla pequeña, una llamada in-process y cero infraestructura nueva. La meta de SC-006 (2 s con 100 elementos) se cumple con una consulta por clave más una consulta de lote con `WHERE Id = ANY(...)`; no se justifica caché ni paginación.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Validados y formalizados desde `spec.md`, `ux_004_*.md` y la resolución humana; las decisiones impuestas por la constitución se marcan como heredadas.)*

#### ADR-001: Carter, MediatR y Vertical Slice Architecture
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-016 exige respetar la constitución. Hay dos casos de uso: asignar y consultar.
- **Decisión:** Un endpoint `ICarterModule` por caso de uso, con `ISender`, `.RequireAuthorization()`, `.Produces<T>()` y `.ProducesProblem()`, en `Features/SprintItems/{AssignItemToSprint|ListSprintItems}/` con Command/Query, Validador y Handler co-ubicados.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cada carpeta se audita contra US1/US3/US4 y US2 respectivamente.
  - ⚠️ **Trade-off / Costo Real:** varios ficheros por un modelo de dos campos; es el costo fijo de VSA.

#### ADR-002: PostgreSQL con schema aislado por módulo y sin consultas cross-schema
- **Estado:** Aceptado (heredado)
- **Contexto:** La constitución §3 prohíbe `JOIN` y consultas cross-schema; la asignación necesita datos del Sprint (`sprints`) y del elemento (`backlog`).
- **Decisión:** `SprintItems` vive en el schema `sprints` con FK real a `sprints."Sprints"`. La relación con el elemento es **solo lógica** (columna `ItemId uuid` sin FK); su existencia y sus datos se obtienen por el contrato in-process (ADR-003).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el módulo sigue siendo extraíble; ninguna migración toca `backlog`.
  - ⚠️ **Trade-off / Costo Real:** la base de datos no impide un `ItemId` huérfano si otro camino de código escribe sin pasar por el handler, ni protege contra el borrado de un elemento (no existe borrado de elementos hoy). La integridad depende de verificar por contrato antes de persistir.

#### ADR-003: La asignación vive en el módulo `Sprints`; el elemento se lee por contrato in-process
- **Estado:** Aceptado
- **Contexto:** El módulo propietario de la relación y la forma de validar la existencia del elemento "respetando el aislamiento por schema" corresponde a Architecture (spec, Dependencias). HU-003 (ADR-003) dejó anunciado el patrón: contrato in-process siguiendo el de `IApplicationModuleApi`.
- **Decisión:** La tabla `SprintItems` y sus features viven en `Sprints` (el Sprint es el lado "uno" y el consumidor del dato). `Sprints` define `Sprints.Contracts.IBacklogModuleApi` con `ExistsAsync(Guid itemId, CancellationToken)` y `GetSummariesAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken)` que devuelve `BacklogItemSummary(Id, Title, Type, DevPoints, QAPoints)`; `Backlog` lo implementa en `BacklogModuleApi` consultando solo el schema `backlog` (mismo sentido de dependencia que `Application → Backlog`: el implementador referencia al módulo que define el contrato). `Type` se transfiere como `string` con el nombre del enum para que `Sprints` no referencie tipos de `Backlog`.
- **Alternativas Consideradas:**
  - **Alternativa A (asignación dentro del módulo `Backlog`, con `SprintId` en el elemento o tabla en `backlog`):** permitiría un `JOIN` y una FK a elementos. Se descarta porque obliga a `Backlog` a conocer Sprints (o a consultar el schema `sprints`, prohibido), modifica el agregado `BacklogItem` que FR-013 declara intocable y rompe el aislamiento de HU-001.
  - **Alternativa B (módulo nuevo `SprintPlanning` con proyecciones locales de Sprint y elemento vía Integration Events):** máximo desacoplamiento. Se descarta por desproporcionada: exige Outbox, RabbitMQ y consistencia eventual para una validación de existencia que hoy es una llamada en proceso; además permitiría asignar a un elemento recién creado que aún no llegó a la proyección.
  - **Alternativa C (el handler lee `BacklogDbContext` directamente):** simple, pero es exactamente la consulta cross-schema que la constitución prohíbe y acopla `Sprints` a un `DbContext` ajeno.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cero cambios en entidades existentes, cero infraestructura nueva y verificación de existencia con consistencia fuerte.
  - ⚠️ **Trade-off / Costo Real:** `Backlog.csproj` pasa a referenciar `Sprints.csproj` (acoplamiento de compilación en el sentido contrato→implementador) y `Sprints` depende en ejecución de que `Backlog` registre su implementación: las pruebas del módulo `Sprints` necesitan un doble del contrato en unitarias y la implementación real en integración. Al extraer `Sprints` como servicio, el contrato pasará a ser una llamada remota con su latencia y modos de fallo.

#### ADR-004: "Un elemento, un Sprint" garantizado por índice único; el 409 se traduce desde la violación de unicidad
- **Estado:** Aceptado
- **Contexto:** La resolución humana A fija que un elemento pertenece a un solo Sprint y que repetir la asignación (mismo Sprint u otro) responde 409. Las asignaciones concurrentes del mismo elemento estaban sin definir; con esta regla se resuelven sin inventar comportamiento.
- **Decisión:** Índice único `UX_SprintItems_ItemId` sobre `ItemId` (solo esa columna, no el par `SprintId, ItemId`). El handler **no** comprueba "¿ya está asignado?" con una lectura previa como mecanismo de garantía: intenta insertar y traduce la `PostgresException` 23505 de **ese** índice a `ConflictException`. Se mantiene una lectura previa opcional (`AnyAsync` por `ItemId`) únicamente para evitar el viaje al contrato cuando el conflicto es evidente; no sustituye al índice.
- **Alternativas Consideradas:**
  - **Alternativa A (solo comprobación en el handler con `AnyAsync` y sin índice):** sencilla y suficiente para un solo usuario. Se descarta porque la lectura y la escritura no son atómicas: dos solicitudes simultáneas pasan ambas la comprobación y el elemento queda en dos Sprints, violando la invariante.
  - **Alternativa B (índice único compuesto `SprintId, ItemId`):** impediría duplicar la misma pareja, pero permitiría asignar el mismo elemento a otro Sprint, contradiciendo la opción A del humano.
  - **Alternativa C (`SERIALIZABLE` o bloqueo asesor `pg_advisory_xact_lock`):** también cierra la carrera. Se descarta por añadir complejidad y reintentos para algo que un índice único resuelve de forma declarativa.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** la invariante vale también para SQL directo y para cualquier futura ruta de código; la concurrencia queda resuelta sin bloqueos.
  - ⚠️ **Trade-off / Costo Real:** el código depende del nombre de constraint de Npgsql (`ConstraintName`) para distinguir el 409 de un 500; si se renombra el índice hay que actualizar la constante `SprintItemRules.ItemIdUniqueIndexName` (cubierto por una prueba de integración). Si negocio decide que un elemento pueda estar en varios Sprints (pregunta 9 del Product Brief), habrá que **reemplazar el índice por una migración** y revisar la HU-006 y la HU-031.

#### ADR-005: `ConflictException` y mapeo 409 en `Shared` (cambio aditivo)
- **Estado:** Aceptado
- **Contexto:** `Shared.Exceptions` solo mapea 400, 401, 404 y 500; no existe 409. La constitución obliga al manejo centralizado de excepciones (`CustomExceptionHandler`).
- **Decisión:** Añadir `ConflictException(string message)` en `Shared/Exceptions` y una rama `ConflictException => ProblemDetails { Status = 409, Title = "Conflict", Detail = message }` en `CustomExceptionHandler`. El mensaje no revela a qué Sprint pertenece el elemento (UX Estado 12). Es el único cambio permitido en `Shared` y no modifica el comportamiento de ninguna excepción existente.
- **Alternativas Consideradas:**
  - **Alternativa A (endpoint que devuelve `Results.Problem(409)` desde un resultado tipado del handler):** evita tocar `Shared`. Se descarta porque rompe el modelo del proyecto (handlers que lanzan excepciones semánticas) y obligaría a cada futuro 409 a repetir ese patrón.
  - **Alternativa B (reutilizar `BadRequestException` y devolver 400):** contradice la decisión humana (409) y los criterios de aceptación.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el 409 es reutilizable por HU futuras con el mismo formato ProblemDetails.
  - ⚠️ **Trade-off / Costo Real:** se toca un building block compartido por todos los módulos; exige añadir una prueba al handler y verificar que las suites de HU-001, 002 y 003 siguen en verde.

#### ADR-006: Sin eventos de dominio ni de integración, Outbox ni caché
- **Estado:** Aceptado
- **Contexto:** Ningún requisito notifica a otros módulos al asignar, y la consulta está acotada a 100 elementos (SC-006). La HU-006 y la HU-031 consumirán la asignación pero hoy no existen.
- **Decisión:** `SprintItem` hereda de `Aggregate<Guid>` por la jerarquía estándar pero no emite eventos. Sin tabla `OutboxMessage`, sin MassTransit y sin decorador Redis.
- **Alternativas Consideradas:**
  - **Alternativa A (emitir `ItemAssignedToSprintIntegrationEvent` para la HU-006):** anticiparía la integración. Se descarta porque no hay consumidor y el diseño debe nacer de un requisito; añadirlo después no cambia la tabla.
  - **Alternativa B (decorador Redis para la consulta):** se descarta por no existir un cuello de botella medido y por añadir invalidación al asignar.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** ningún punto de fallo adicional.
  - ⚠️ **Trade-off / Costo Real:** si la HU-006 o la HU-031 necesitan reaccionar a la asignación, deberán añadir el evento y, por ser crítico, el Outbox (constitución §4).

#### ADR-007: Identificadores recibidos como texto y validados por campo; ausente incluye `Guid.Empty`
- **Estado:** Aceptado
- **Contexto:** FR-007 y SC-007 exigen 400 "con el detalle de los campos inválidos" para Sprint o elemento ausente o con formato inválido. Un `{sprintId:guid}` en la ruta o un `Guid` en el cuerpo producirían 404 o un 400 general (`BadHttpRequestException`) sin identificar el campo (mismo problema que HU-003, ADR-004).
- **Decisión:** `POST /api/sprints/{sprintId}/items` declara `sprintId` como `string` (sin restricción `:guid`) y el cuerpo `{ itemId }` como `string?`. `AssignItemToSprintCommand(string? SprintId, string? ItemId)`; el validador exige presencia, `Guid.TryParse` y que no sea `Guid.Empty`, con errores bajo las claves `sprintId` e `itemId`; el handler parsea ya validado. `GET /api/sprints/{sprintId:guid}/items` conserva `:guid` (como HU-003): un id malformado en la consulta responde 404, aceptable porque la HU solo define 404 para Sprint inexistente al consultar.
- **Alternativas Consideradas:**
  - **Alternativa A (`Guid` tipado en ruta y cuerpo):** menos código. Se descarta porque un Sprint malformado daría 404 y un elemento malformado un 400 sin campo, incumpliendo FR-007.
  - **Alternativa B (`Guid?` en el cuerpo y dejar fallar el binder):** mismo defecto de reporte por campo.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** los cuatro casos de SC-07 se reportan por campo y `errors` del ProblemDetails alimenta los mensajes en línea del UX (Estado 8).
  - ⚠️ **Trade-off / Costo Real:** parseo manual y rutas POST y GET con plantillas distintas para el mismo segmento; hay que documentarlo en el contrato del API Architect.

## 6. Coding Conventions
- **Naming:** PascalCase para tipos; camelCase para locales y parámetros. Ficheros `AssignItemToSprint…` y `ListSprintItems…` con sufijos `Endpoint|Command|Query|Validator|CommandHandler|QueryHandler.cs`. Los textos de error son constantes públicas (`SprintItemRules`, handlers) para que las pruebas los referencien.
- **Contrato HTTP (a formalizar por el API Architect; propuesta alineada con el UX):**
  - `POST /api/sprints/{sprintId}/items` con cuerpo `{ "itemId": "<guid>" }` → **201 Created** (⚠️ [PROPUESTO], la HU solo dice "código de éxito") con `Location` hacia el `GET` de la colección y cuerpo `{ sprintId, itemId }`; 400 con `errors` por campo; 401; 404 (Sprint o elemento, el `detail` los distingue); 409; 500.
  - `GET /api/sprints/{sprintId:guid}/items` → 200 con arreglo `[{ id, title, type, devPoints, qaPoints }]` (vacío si no hay) o 404.
  - Las respuestas **no** incluyen estado del elemento ni del Sprint, ni `CreatedAt`/`CreatedBy` (FR-008, FR-014). JSON en camelCase; `type` serializa como cadena (conversor global existente).
- **Mensajes y distinción de 404:** el handler lanza `NotFoundException(SprintItemRules.SprintNotFoundMessage)` o `NotFoundException(SprintItemRules.ItemNotFoundMessage)`; el cliente distingue Sprint de elemento por el `detail`, como espera el UX (Estados 6 y 7). Mensajes sin detalles internos.
- **Organización:** una feature, una carpeta; proyección directa a DTO en la consulta y `Adapt<T>()` solo donde evite mapeo manual repetitivo.
- **Identidad antes que datos:** `AssignItemToSprintCommandHandler` resuelve `ICurrentUser.UserId` antes de cualquier acceso a datos (sin claim: `UnauthorizedAccessException`, 401). `CreatedBy` proviene del `sub` vía `AuditableEntityInterceptor` de `Shared`, nunca del cuerpo. `SprintsModule` ya registra ese interceptor.
- **Consulta (`ListSprintItems`):** (1) `AnyAsync` del Sprint → `NotFoundException` si no existe; (2) `SprintItems.AsNoTracking()` filtrado por `SprintId`, ordenado por `CreatedAt` y luego `Id` solo para estabilidad (⚠️ [PROPUESTO], no es contrato de orden: punto abierto 7); (3) una sola llamada `GetSummariesAsync(ids)`; (4) se devuelven exactamente los elementos asignados. Si el contrato no devuelve algún id (elemento ya inexistente) la consulta lo omite y registra un `LogWarning`; no se inventa un título.
- **Logging:** Serilog vía `ILogger<T>`; sin `Console.WriteLine`; sin datos de token.
- **Async:** todo método con E/S recibe y propaga `CancellationToken`.
- **Frontend:** componentes standalone con `ChangeDetectionStrategy.OnPush`, Signals e `inject()`; formulario reactivo tipado con un solo control; textos con i18n nativo. Sin validación de negocio duplicada en el cliente: solo se bloquea el envío durante `isSubmitting()` y los errores 400/404/409/500 se pintan desde la respuesta (UX D-05). La vista no ofrece quitar, mover ni reasignar. Un 401 persistente reutiliza el interceptor y el guard existentes (Estado 10).

## 7. Testing
- **Qué debe testearse y Dónde están los tests:**
  - **Unitarias (`tests/Unit/Sprints`):** `AssignItemToSprintValidator` con los cuatro casos de SC-07 (Sprint ausente, Sprint con formato inválido, elemento ausente, elemento con formato inválido) más `Guid.Empty`, comprobando que el error cae en el campo correcto; `AssignItemToSprintCommandHandler` (sin identidad ⇒ 401 antes de tocar datos; Sprint inexistente ⇒ `NotFoundException` y el contrato **no** se invoca; elemento inexistente ⇒ `NotFoundException` y no se persiste; ambos inexistentes ⇒ gana el Sprint; un único `SaveChanges`); `ListSprintItemsQueryHandler` (Sprint inexistente, vacío, exactitud de elementos, una sola llamada de lote); `SprintItem.Create`. El contrato `IBacklogModuleApi` se sustituye por un doble escrito a mano (no mocks que afirmen la implementación).
  - **Integración (`tests/Integration/Sprints`, PostgreSQL real por Testcontainers, una BD por prueba):** SC-01 (201, cuerpo, fila con `CreatedBy` = `sub`), SC-02 (el elemento conserva título, tipo, puntos y estado: se compara el registro de `backlog` antes y después), SC-03 (dos elementos ⇒ exactamente dos), SC-04, SC-05, SC-06 y SC-07 (**tabla vacía después** en cada rechazo), SC-08 (consulta de Sprint inexistente ⇒ 404), SC-09 (401 en asignar y consultar sin leer ni persistir), SC-10 (fallo de persistencia forzado ⇒ 500 sin traza y sin fila), **409 con elemento ya asignado al mismo Sprint y a otro Sprint** (mismo mensaje, una sola fila) y **concurrencia**: N solicitudes simultáneas del mismo elemento a dos Sprints producen exactamente un 201 y el resto 409 y una sola fila.
  - **Migración:** una prueba aplica `AddSprintItems` y comprueba que `UX_SprintItems_ItemId` rechaza por SQL directo un segundo `ItemId` igual (también con otro `SprintId`) y que la FK a `sprints."Sprints"` rechaza un `SprintId` inexistente. Solo toca el schema `sprints`; verifica que `backlog` y `application` no cambian.
  - **No regresión (FR-013):** las suites de HU-001, HU-002 y HU-003 pasan sin modificaciones, incluida una prueba de `Shared` que confirma que 400, 401, 404 y 500 conservan su formato tras añadir el 409.
  - **Rendimiento (SC-006):** 100 elementos asignados sembrados por `SprintsDbContext` y `BacklogDbContext`; la consulta responde en menos de 2 s.
  - **Frontend (Jest, `*.spec.ts` junto a cada componente):** `sprint-assigned-items` (Estados 1, 2, 4, 5, 9, 10, variante B del 8) y `assign-item-dialog` (Estados 3, 6, 7, 8A, 11, 12), comprobando que la grilla se vuelve a consultar al servidor tras el éxito, que el diálogo conserva el valor ante 404 elemento, 409, 400 y 500 y que el 404 de Sprint bloquea el reintento.
- **Reglas:** TDD (prueba primero). Prohibido `[Fact(Skip=...)]`, doble de la base de datos en integración y aserciones que no puedan fallar. La identidad en integración puede usar el mecanismo de autenticación de prueba ya presente (HU-002 cubre Keycloak real).

## 8. Security
- **Manejo de secretos:** cadenas de conexión y configuración de Keycloak por variables de entorno. Nada de credenciales en el repositorio ni en `appsettings.json`.
- **Datos sensibles y Acciones prohibidas:** los dos endpoints invocan `.RequireAuthorization()`; basta un token válido con identidad (punto abierto 6: sin roles). Prohibido relajar `verify-token-audience` o añadir endpoints anónimos. Los 500 no exponen trazas. El 409 no revela a qué Sprint pertenece el elemento. `CreatedBy` proviene del `sub`, nunca del cuerpo. El contrato hacia Backlog no se expone por HTTP y no devuelve datos que la consulta no necesite (sin descripción ni criterios de aceptación). Los identificadores se validan como GUID antes de cualquier acceso a datos (sin concatenación de SQL).

## 9. Database
- **Schema:** Relacional, schema `sprints`, tabla `sprints."SprintItems"`: `Id uuid PK`, `SprintId uuid NOT NULL` con **FK** a `sprints."Sprints"("Id")` `ON DELETE RESTRICT`, `ItemId uuid NOT NULL` **sin FK** (el elemento está en el schema `backlog`), `CreatedAt timestamptz NOT NULL`, `CreatedBy varchar NOT NULL`, `LastModified timestamptz NULL`, `LastModifiedBy varchar NULL` (columnas de auditoría gestionadas por `AuditableEntityInterceptor`, no a mano). Índice único `UX_SprintItems_ItemId` (`ItemId`) y índice no único `IX_SprintItems_SprintId` para la consulta. Sin columnas de estado ni de orden. El detalle de tipos y longitudes lo fija el Data Architect dentro de estas reglas.
- **Reglas para modificar DB:** migraciones solo en `app/backend/src/Modules/Sprints/Data/Migrations`; la migración `AddSprintItems` solo **crea** una tabla nueva (sin DDL bloqueante sobre tablas existentes) y no toca los schemas `backlog` ni `application`. Si el negocio cambia la cardinalidad, el cambio es una migración nueva que reemplaza el índice único (ADR-004).

## 10. Git & PR Rules
- **Naming de branches y Commits:** la rama la gestiona el Watcher GitOps (`feat/004-asignacion-elementos-sprint`). Los agentes no ejecutan Git. Commits con Conventional Commits.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:** leer `spec.md`, esta guía y `ux_004_*.md`; revisar `Modules/Sprints` (HU-003) y `Modules/Application/ApplicationModuleApi.cs` + `Modules/Backlog/Contracts/IApplicationModuleApi.cs` como patrón de contrato in-process; escribir primero las pruebas del escenario.
- **Qué debe validar después / Cuándo pedir confirmación:**
  - `dotnet build` y `dotnet test` de toda la solución en verde, con las suites de HU-001, HU-002 y HU-003 sin cambios.
  - Que ningún fichero fuera de la lista permitida de §2 fue modificado y que `Sprint`/`BacklogItem` no tienen columnas nuevas.
  - Que no existe desasignar, mover, lote, estado, límites, filtros ni paginación.
  - Detenerse y escalar si una tarea exige cambiar entidades de `Backlog` o `Sprints`, referenciar `BacklogDbContext` desde `Sprints`, o resolver un punto abierto para continuar.
- **Reconciliación UX → tareas:** `Task-UI-01` y `Task-UI-03` → `sprint-assigned-items` (grilla, vacía, refresco y toast); `Task-UI-02`, `04`, `05`, `06` (variante A), `09` y `10` → `assign-item-dialog`; `Task-UI-06` (variante B) y `Task-UI-07` → `sprint-assigned-items` (estado de error de ruta y de 404); `Task-UI-08` → interceptor y guard existentes sin cambios. Ruta `/api/sprints/{id}/elementos` del UX queda reconciliada como `/api/sprints/{sprintId}/items` (la ruta de UI `/sprints/:id/elementos` se mantiene). El shell de navegación sigue sin existir en el repositorio (punto abierto informativo heredado de HU-003): la HU entrega la página y la ruta, no el shell.
- **Reconciliación de la spec (para BA y Spec Kit; no la edita el SA):** `spec.md` conserva FR-015 ("el sistema NO DEBE imponer cardinalidad") y marca como no documentados el elemento ya asignado al mismo Sprint, a otro Sprint y la concurrencia. Esta guía sigue la resolución humana A. Deben reflejarse: nuevo escenario 409, nuevo FR de unicidad, retiro de FR-015 y ajuste de los casos borde. Mientras tanto, el criterio vinculante para el desarrollo es esta guía y el Estado 12 del UX.

## 12. Definition of Done
- Todo el código nuevo cuenta con patrones de resiliencia y manejo de estado definidos (§5.1 y §5.2).
- No hay ninguna credencial o variable de entorno hardcodeada.
- Las migraciones de base de datos han sido auditadas (solo schema `sprints`, índice único y FK locales, sin tocar `backlog` ni `application`).
- Tests y Lint pasan exitosamente en el entorno de CI, sin regresión en HU-001, HU-002 y HU-003.
- Los escenarios SC-01..SC-10, el 409 por elemento ya asignado y la carrera concurrente tienen prueba automatizada.
- Ningún elemento queda asignado a más de un Sprint y ninguna solicitud rechazada deja filas en `SprintItems`.
- No existen consultas ni FKs cross-schema, ni cambios en `Sprint` o `BacklogItem`.
