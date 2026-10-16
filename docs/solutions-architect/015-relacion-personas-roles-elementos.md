# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 04-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/015-relacion-personas-roles-elementos/`, `documents/designer-ux/ux-015-relacion-personas-roles-elementos.md` y la resolución humana del tracker (04-10-2026, 20:22:59, opción **B**: asignación duplicada idempotente). `plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE; los `Task-UI-xx` y las rutas del UX son provisionales y se reconcilian aquí.

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub - Plataforma de gestión ágil. Esta HU añade la relación Persona–Elemento: asignar un miembro del equipo como responsable de un elemento del backlog (un miembro por solicitud) y consultarla en ambos sentidos (personas de un elemento, elementos de un miembro).
- **Qué problema resuelve:** Hace consultable cada tarjeta con su responsable y su rol técnico, y entrega el dato de entrada de HU-010 y HU-014, sin relaciones huérfanas, duplicadas ni parciales (FR-001..FR-012, SC-001, SC-003, SC-006, SC-007).
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con los módulos `Teams`, `Backlog`, `Sprints` y `Application` (HU-012, HU-001, HU-003/004 y HU-002, todas ACTIVE). No altera datos ni comportamiento observable de HU-001, HU-003, HU-004 ni HU-012 (FR-013).
- **Arquitectura general:** Modular Monolith .NET 8 con Vertical Slice Architecture (VSA) y frontend Angular 22 Zoneless. **No se crea un módulo nuevo:** la relación vive en el módulo `Teams` (schema `teams`) y consume al módulo `Backlog` por un contrato in-process de solo lectura.
- **Decisión de negocio incorporada (lex humana, sin conflicto con la constitución):** asignar dos veces al mismo miembro al mismo elemento es **idempotente**: éxito con la relación existente, sin crear otra y sin alterar su `CreatedAt`/`CreatedBy`. Esto reemplaza al FR-015 (en lo referido a duplicados) y al Edge Case "asignar dos veces", que `spec.md` aún redacta como "no documentado" (ver §11, reconciliación).

## 2. Repository Structure
- **Backend (se extiende el módulo existente):** `app/backend/src/Modules/Teams/`.
  ```text
  app/backend/src/Modules/Teams/
  ├── Contracts/
  │   └── IBacklogItemLookup.cs                          ← contrato in-process hacia Backlog (ExistsAsync, GetItemsAsync, BacklogItemRef)
  ├── Domain/ItemAssignments/
  │   ├── ItemAssignment.cs                              ← Aggregate<Guid>, IAuditableEntity, ItemAssignment.Create(itemId, memberId)
  │   └── ItemAssignmentRules.cs                         ← constantes de campos, mensajes y nombre del índice único (única fuente)
  ├── Data/
  │   ├── ITeamsDbContext.cs                             ← se añade DbSet<ItemAssignment> ItemAssignments
  │   ├── TeamsDbContext.cs                              ← se añade el DbSet (mismo schema "teams")
  │   ├── Configurations/ItemAssignmentConfiguration.cs  ← FK local a TeamMembers + índice único (ItemId, MemberId)
  │   └── Migrations/                                    ← AddItemAssignments
  └── Features/ItemAssignments/
      ├── AssignMemberToItem/    AssignMemberToItemCommand.cs · AssignMemberToItemValidator.cs · AssignMemberToItemCommandHandler.cs · AssignMemberToItemEndpoint.cs
      ├── ListItemAssignees/     ListItemAssigneesQuery.cs · ListItemAssigneesQueryHandler.cs · ListItemAssigneesEndpoint.cs
      ├── ListMemberItems/       ListMemberItemsQuery.cs · ListMemberItemsQueryHandler.cs · ListMemberItemsEndpoint.cs
      ├── ItemAssigneeResponse.cs                        ← { itemId, memberId, memberName, role }   (respuesta de asignar)
      ├── AssigneeResponse.cs                            ← { id, name, role }                       (personas de un elemento)
      └── MemberItemResponse.cs                          ← { id, title, type }                      (elementos de un miembro)
  app/backend/src/Modules/Backlog/
  ├── BacklogItemLookup.cs                               ← implementa Teams.Contracts.IBacklogItemLookup (solo lee el schema backlog)
  └── Features/BacklogItems/ListBacklogItems/            ← ⚠️ [PROPUESTO] consulta de solo lectura para el selector del UX (ADR-006)
  ```
- **Backend (pruebas):** `app/backend/tests/Unit/Teams/`, `app/backend/tests/Integration/Teams/` y, para la consulta añadida, `app/backend/tests/Unit/Backlog/` y `tests/Integration/Backlog/` (proyectos existentes; no se crean proyectos nuevos).
- **Frontend:** `app/frontend/src/app/features/teams/` (feature existente): `components/item-assignees-view/` (Estados 1, 2, 5, 6, 7), `components/member-items-view/` (Estado 3), `components/assign-assignee-dialog/` (Estados 4, 8, 9, 10, 12); ampliación de `components/team-page/` (pestaña `Responsables` junto a `Miembros` y `Roles técnicos`), de `services/team-api.service.ts` (`assignMember`, `listItemAssignees`, `listMemberItems`, `listBacklogItems`) y de `models/team.models.ts`. Rutas `equipos/responsables` y `equipos/responsables/miembro` registradas **dentro del bloque `equipos` existente** de `app.routes.ts` (heredan `authGuard` y `MessageService`), con `data: { tab: 'responsables' }` como `miembros` y `roles` de HU-012.
- **Importante:** Agrupación estricta por feature (VSA): Endpoint, Command/Query, Validador y Handler de cada caso de uso conviven en su carpeta. Prohibidas las carpetas horizontales `/Controllers`, `/Services`, `/Validators`, `/Repositories`. Todo el código de producción bajo `app/backend/` o `app/frontend/` (constitución).
- **Qué NO debe tocar:**
  - `Modules/Application/**` y `Modules/Sprints/**` por completo.
  - Dentro de `Modules/Backlog/**`: entidad `BacklogItem`, `BacklogDbContext`, configuraciones, migraciones y la feature `CreateBacklogItem`. Solo se **añaden** `BacklogItemLookup.cs`, la feature `ListBacklogItems` y su registro.
  - Dentro de `Modules/Teams/**`: las entidades `TeamMember` y `TechnicalRole`, sus configuraciones, la migración `InitialTeamsSchema` y las features de HU-012. No se añaden columnas ni navegaciones a `TeamMember`.
  - `BuildingBlocks/Shared/**` (no se necesita ningún cambio: `ConflictException` y el 409 ya no se usan aquí porque el duplicado es idempotente), `app/frontend/src/app/core/auth/**`, `features/backlog/**` y `features/sprints/**`.
- **Cambios permitidos fuera del módulo `Teams` (únicos):**
  1. `Modules/Backlog/Backlog.csproj`: `ProjectReference` hacia `..\Teams\Teams.csproj` (para implementar el contrato; `Teams` **no** referencia a Backlog).
  2. `Modules/Backlog/BacklogModule.cs`: una línea de registro `services.AddScoped<IBacklogItemLookup, BacklogItemLookup>()`.
  3. `Modules/Backlog/Features/BacklogItems/ListBacklogItems/` (aditivo, ADR-006).
  4. `app.routes.ts` (dos rutas hijas de `equipos`).

## 3. Tech Stack
- **Runtime:** .NET 8 (`net8.0`, C# 12) en backend; Angular 22.2 Zoneless con Signals en frontend.
- **Framework:** Carter 8.1.0 (`ICarterModule`), MediatR 12.4.1 con `ValidationBehavior`, FluentValidation 11.9.2 y Mapster 7.4.0. PrimeNG ^22.1.2 en UI (`p-tabs`, `p-selectbutton`, `p-select`, `p-table`, `p-dialog`, `p-message`, `p-toast`, `p-button`, `p-breadcrumb`), tema neutral por defecto.
- **Database:** PostgreSQL con EF Core Npgsql 8.0.11, Code-First, schema `teams` y `TeamsDbContext` existente.
- **Infrastructure:** Docker, Keycloak 24 con `Keycloak.AuthServices.Authentication` 2.5.2 (ya configurado). Esta HU **no usa** RabbitMQ, MassTransit, Redis ni Outbox (ADR-007). Sin paquetes NuGet nuevos.
- **Testing:** Backend xUnit + FluentAssertions + Testcontainers PostgreSQL (mismas versiones que HU-012). Frontend Jest. Pruebas no tautológicas: cada prueba debe poder fallar si se rompe la regla que dice verificar.

## 4. Development Workflow
- **Cómo levantar el proyecto:** `docker-compose up -d` (PostgreSQL y Keycloak), `dotnet run --project app/backend/src/Bootstrapper/Api`; frontend `npm start` en `app/frontend`. Configuración por variables de entorno o `appsettings.Development.json`.
- **Cómo ejecutar tests / lint / build:** `dotnet build app/backend/TechWorkHub.sln` y `dotnet test app/backend/TechWorkHub.sln` (la integración con contenedores se ejecuta en serie: contención ya conocida desde HU-003). Frontend: `npm test` y `npm run build`.
- **Cómo ejecutar migraciones:** `dotnet ef migrations add AddItemAssignments -c TeamsDbContext -p app/backend/src/Modules/Teams -s app/backend/src/Bootstrapper/Api -o Data/Migrations`. Se aplica en arranque con `Database:MigrateOnStartup=true` mediante el `MigrateTeamsModuleAsync` existente (no se añade llamada nueva en `Program.cs`). La migración solo crea objetos en el schema `teams`.

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - VSA, CQRS intra-proceso con MediatR, validación antes del handler, interceptores globales de `Shared` sin reimplementarlos.
  - **Orden de evaluación del caso de uso Asignar (determinista, una sola secuencia):** (1) validador 400 → (2) identidad (`ICurrentUser.UserId`, 401) → (3) el miembro existe (404 "miembro", consulta local en `teams`) → (4) el elemento existe (404 "elemento", vía contrato) → (5) la relación ya existe ⇒ **200 OK con la existente, sin escribir** → (6) un único `SaveChangesAsync` ⇒ **201 Created**. Cuando faltan ambos, gana el 404 del miembro (decisión del SA: es la comprobación local y barata, y evita invocar el contrato; resuelve el punto informativo de QA sobre CA-05 de stakeholders frente a SC-06/SC-07).
  - **La unicidad (elemento, miembro) es una invariante de datos y no solo una validación:** la garantiza el índice único `UX_ItemAssignments_ItemId_MemberId` (ADR-004).
  - **El elemento y el miembro no se modifican nunca** (FR-013): los handlers no cargan para escribir `TeamMember` ni `BacklogItem`; el contrato hacia Backlog es de solo lectura. Prohibido añadir `AssigneeId`, `Status` o cualquier columna a `BacklogItem` o `TeamMember`.
  - El rol de la relación **no se almacena**: se lee del rol técnico vigente del miembro en cada consulta (FR-005, ADR-003). No existe selección de rol por asignación.
  - No se implementan quitar, reemplazar, lote, máximo de responsables, coherencia rol/estimaciones, restricciones por estado o Sprint, permisos por perfil, orden configurable, filtros ni paginación (FR-015 restante, UX D-03 y D-04).
- **Dependencias permitidas:** solo el stack de la constitución. Mapster para DTOs. Prohibido AutoMapper, `[ApiController]`, FKs o `JOIN` hacia el schema `backlog`, y referenciar `BacklogDbContext` desde `Teams`.
- **Patrones prohibidos:** variables "hardcodeadas" (cadenas de conexión, URLs, realm); consultas o joins cross-schema; `Console.WriteLine`; controllers clásicos; capturar y tragar excepciones; deducir la unicidad solo con una lectura previa sin el índice único (ADR-004).

### 5.1. State Management Architecture
- **Frontera de Estado:** La verdad de la relación reside en PostgreSQL, schema `teams`, tabla `ItemAssignments`. El nombre y el rol del miembro viven en `teams` (se obtienen por JOIN local); el título y el tipo del elemento viven en `backlog` y se leen **siempre** a través del contrato en cada consulta (no se duplican ni se proyectan localmente, ADR-003). La identidad reside en Keycloak. En el cliente cada componente guarda solo estado de vista en Signals (`isSubmitting`, `assignees`, `memberItems`, `items`, `members`, `loadError`, `formError`) y **no cachea** relaciones entre navegaciones.
- **Estrategia de Sincronización:** HTTP síncrono. Tras un éxito (201 o 200) el cliente cierra el diálogo y vuelve a consultar la grilla al servidor (consulta fresca), sin insertar la fila de forma optimista (SC-001: consultable de inmediato en ambos sentidos). Sin Optimistic UI, polling ni WebSockets. La distinción entre "asignado" y "ya era responsable" (UX Estado 5/6 frente a 7) se deriva del **código HTTP** (201 frente a 200).
- **Consistencia:** Fuerte. La asignación es **una sola fila** y un único `SaveChangesAsync`: no existe estado parcial posible (SC-006). La asignación concurrente del mismo par se resuelve en la base de datos: el índice único hace que exactamente una solicitud inserte y las demás, tras releer, respondan 200 con la fila ganadora (ADR-004). El doble envío del formulario se mitiga además en cliente deshabilitando el botón mientras `isSubmitting()`.

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:**
  - *PostgreSQL caído o fallo al guardar:* `CustomExceptionHandler` responde 500 con ProblemDetails genérico sin trazas y registra con Serilog. No queda relación parcial porque hay una fila y una transacción (FR-012).
  - *Contrato hacia Backlog:* es una llamada in-process contra la misma instancia de PostgreSQL; si falla lanza excepción y el resultado es 500. No hay fallback que dé por existente un elemento no verificado (se prefiere fallar a persistir una relación huérfana).
  - *Keycloak caído:* imposibilidad de validar tokens; el esquema de autenticación existente responde 401.
- **Patrones de Tolerancia a Fallos:** `CancellationToken` propagado desde el endpoint hasta EF Core y hasta el contrato (obligatorio en producción). **Sin reintentos automáticos** ni Circuit Breaker ni fallbacks; el cliente reintenta manualmente (UX Estado 12, botón `Reintentar`). Como la operación es idempotente, el reintento manual es seguro. Las consultas de lectura usan `AsNoTracking()` y una **única** llamada de lote al contrato (sin N+1).
  - *Traducción de la violación de unicidad:* solo la `PostgresException` con `SqlState = 23505` **y** `ConstraintName = UX_ItemAssignments_ItemId_MemberId` se trata como "la relación ya existe": el handler relee la fila existente con una consulta nueva (`AsNoTracking`) y responde 200. Cualquier otro `DbUpdateException` se propaga y termina en 500.
- **Proporcionalidad:** una tabla pequeña, una llamada in-process y cero infraestructura nueva. No se justifica caché ni paginación hasta que exista una medición (SC-007 exige exactitud, no volumen).

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Validados y formalizados desde `spec.md`, `ux_015_*.md` y la resolución humana; las decisiones impuestas por la constitución se marcan como heredadas.)*

#### ADR-001: Carter, MediatR y Vertical Slice Architecture
- **Estado:** Aceptado (heredado)
- **Contexto:** La constitución obliga a Carter, MediatR, FluentValidation y VSA con co-locación de feature. Hay tres casos de uso: asignar, consultar personas de un elemento y consultar elementos de un miembro.
- **Decisión:** Un endpoint `ICarterModule` por caso de uso, con `ISender`, `.RequireAuthorization()`, `.Produces<T>()` y `.ProducesProblem()`, en `Features/ItemAssignments/{AssignMemberToItem|ListItemAssignees|ListMemberItems}/` con Command/Query, Validador y Handler co-ubicados.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cada carpeta se audita contra US1, US2/US3 y US4/US5.
  - ⚠️ **Trade-off / Costo Real:** varios ficheros por un modelo de dos campos; es el costo fijo de VSA.

#### ADR-002: PostgreSQL con schema aislado por módulo y sin consultas cross-schema
- **Estado:** Aceptado (heredado)
- **Contexto:** La constitución §3 prohíbe `JOIN` y consultas cross-schema; la relación necesita datos del miembro (`teams`) y del elemento (`backlog`). FR-014 lo exige.
- **Decisión:** `ItemAssignments` vive en el schema `teams` con FK real a `teams."TeamMembers"`. La relación con el elemento es **solo lógica** (columna `ItemId uuid` sin FK); su existencia y sus datos se obtienen por el contrato in-process (ADR-003).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el módulo sigue siendo extraíble; ninguna migración toca `backlog`.
  - ⚠️ **Trade-off / Costo Real:** la base de datos no impide un `ItemId` huérfano si otro camino de código escribe sin pasar por el handler, ni protege contra el borrado de un elemento (no existe borrado hoy). La integridad depende de verificar por contrato antes de persistir.

#### ADR-003: La relación vive en el módulo `Teams`; el elemento se lee por contrato in-process y el rol se deriva del miembro
- **Estado:** Aceptado
- **Contexto:** La spec delega a Architecture "dónde reside la relación y cómo cada consulta obtiene datos del otro módulo (llamada en proceso o proyección local)". El rol mostrado es el rol técnico registrado del miembro (FR-005). HU-004 ya fijó el patrón: tabla en el módulo del lado "uno" y contrato in-process hacia Backlog implementado por Backlog.
- **Decisión:** La tabla `ItemAssignments` y sus features viven en `Teams`: el nombre y el rol del miembro se obtienen con un `JOIN` **local** (`teams."TeamMembers"` ↔ `teams."TechnicalRoles"`) y el elemento se lee por `Teams.Contracts.IBacklogItemLookup` con `ExistsAsync(Guid itemId, CancellationToken)` y `GetItemsAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken)` que devuelve `BacklogItemRef(Id, Title, Type)` (solo lo que FR-007 expone; sin estimaciones, estado ni Sprint). `Backlog` lo implementa en `BacklogItemLookup` consultando solo el schema `backlog`. `Type` viaja como `string` con el nombre del enum para que `Teams` no referencie tipos de `Backlog`. El rol **no se copia** a la relación: se lee del miembro en cada consulta.
- **Alternativas Consideradas:**
  - **Alternativa A (relación en `Backlog`, con un `AssigneeIds` en el elemento o tabla en `backlog`):** permitiría un `JOIN` con elementos. Se descarta porque modifica el agregado `BacklogItem` que FR-013 declara intocable, obliga a `Backlog` a conocer miembros (o a consultar el schema `teams`, prohibido) y rompe el aislamiento de HU-001.
  - **Alternativa B (módulo nuevo `Assignments` con proyecciones locales de miembro y elemento vía Integration Events):** máximo desacoplamiento, y es el lugar natural si HU-010 extiende la relación a actividades, reuniones e incidentes. Se descarta ahora por desproporcionada: exige Outbox, RabbitMQ y consistencia eventual para validaciones de existencia que hoy son llamadas en proceso, y permitiría asignar a un elemento recién creado que aún no llegó a la proyección. La extracción posterior es barata porque la tabla ya está aislada.
  - **Alternativa C (almacenar el rol en la fila de la relación):** evita el JOIN. Se descarta porque FR-005 dice que se muestra el rol que el miembro **ya tiene registrado**; copiarlo crearía un dato duplicado que divergiría si HU-012 permitiera cambiarlo, y la relación no define un rol propio.
  - **Alternativa D (el handler lee `BacklogDbContext` directamente):** simple, pero es exactamente la consulta cross-schema que la constitución prohíbe y acopla `Teams` a un `DbContext` ajeno.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** cero cambios en entidades existentes, cero infraestructura nueva, verificación de existencia con consistencia fuerte y rol siempre coherente con HU-012.
  - ⚠️ **Trade-off / Costo Real:** `Backlog.csproj` pasa a referenciar `Teams.csproj` (acoplamiento de compilación en el sentido contrato→implementador, además del que ya tiene con `Sprints`), y `Teams` depende en ejecución de que `Backlog` registre su implementación: las pruebas unitarias de `Teams` necesitan un doble del contrato y las de integración la implementación real. Al extraer `Teams` como servicio el contrato pasará a ser una llamada remota con su latencia y modos de fallo. Si en el futuro HU-012 permitiera cambiar el rol de un miembro, la relación mostraría el rol nuevo (comportamiento aceptado, hoy inexistente).

#### ADR-004: Unicidad (elemento, miembro) por índice único; la asignación duplicada es idempotente
- **Estado:** Aceptado
- **Contexto:** La resolución humana B fija que asignar dos veces al mismo miembro al mismo elemento responde éxito con la relación existente, sin crear otra ni alterar su auditoría. Las solicitudes concurrentes del mismo par estaban sin definir.
- **Decisión:** Índice único `UX_ItemAssignments_ItemId_MemberId` sobre `(ItemId, MemberId)`. El handler lee primero si el par existe (optimización: responde 200 sin escribir, sin tocar `CreatedAt`/`CreatedBy`); si no existe inserta. Si el `SaveChanges` falla con `PostgresException` 23505 **de ese índice** (carrera), relee la fila ganadora y responde 200. La garantía real es el índice, no la lectura previa. Un elemento **puede** tener varios miembros y un miembro varios elementos (FR-002): la unicidad es del par, no de `ItemId` ni de `MemberId`.
- **Alternativas Consideradas:**
  - **Alternativa A (solo comprobación en el handler, sin índice):** suficiente para un único usuario. Se descarta porque lectura y escritura no son atómicas: dos solicitudes simultáneas pasan ambas la comprobación y quedaría el par duplicado, que la decisión humana prohíbe.
  - **Alternativa B (`INSERT ... ON CONFLICT DO NOTHING` con SQL crudo):** atómico y sin excepción. Se descarta porque evade el `AuditableEntityInterceptor` (que fija `CreatedAt`/`CreatedBy`, FR-004) y obliga a SQL manual fuera de EF.
  - **Alternativa C (`SERIALIZABLE` o `pg_advisory_xact_lock`):** también cierra la carrera. Se descarta por añadir complejidad y reintentos para algo que un índice único resuelve de forma declarativa.
  - **Alternativa D (responder 409 al duplicado):** es la opción A del humano, descartada por su decisión (opción B).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** la invariante vale también para SQL directo y para cualquier ruta futura; la concurrencia queda resuelta sin bloqueos y los reintentos del cliente son seguros.
  - ⚠️ **Trade-off / Costo Real:** el código depende del nombre de constraint de Npgsql (`ConstraintName`) para distinguir la carrera de un 500; si se renombra el índice hay que actualizar `ItemAssignmentRules.PairUniqueIndexName` (cubierto por una prueba de integración). El camino de carrera hace una segunda lectura en la rama de error. Si negocio decide después restringir duplicados con 409 o impone un máximo de responsables, habrá que cambiar el handler y, en el segundo caso, añadir lógica de conteo con su propia carrera.

#### ADR-005: Códigos de éxito 201/200 y respuesta sin bandera
- **Estado:** Aceptado
- **Contexto:** La spec solo dice "un código de éxito" (FR-003) y el UX necesita distinguir la asignación nueva (Estados 5 y 6, toast de éxito) de la repetida (Estado 7, toast informativo, B-01).
- **Decisión:** `POST` responde **201 Created** (⚠️ [PROPUESTO]) con `Location` hacia `GET /api/backlog-items/{itemId}/assignees` cuando inserta, y **200 OK** con el mismo cuerpo cuando el par ya existía. El cuerpo es `{ itemId, memberId, memberName, role }`, sin bandera `alreadyAssigned`, sin `CreatedAt`/`CreatedBy` (UX D-03) y sin datos del elemento más allá de su identificador (FR-013).
- **Alternativas Consideradas:**
  - **Alternativa A (siempre 200 con bandera `alreadyAssigned` en el cuerpo):** un solo camino de éxito. Se descarta porque ensucia el contrato de FR-003 con un campo que la HU no pide y pierde la semántica HTTP de "creado frente a ya existente".
  - **Alternativa B (siempre 201):** ignora que no se creó nada y haría que un cliente HTTP genérico crea haber creado un recurso en cada reintento.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** contrato mínimo y semántico; el frontend decide el toast por el código HTTP.
  - ⚠️ **Trade-off / Costo Real:** el cliente debe leer `HttpResponse.status` y no solo el cuerpo (el servicio Angular usa `observe: 'response'`); el contrato final lo fija el API Architect y debe documentar ambos códigos.

#### ADR-006: Fuente de los selectores del UX: miembros de HU-012 y consulta de solo lectura de elementos añadida a Backlog
- **Estado:** Aceptado
- **Contexto:** El UX (D-02, B-04) eligió selectores en lugar de capturar identificadores y delega al SA la fuente de cada lista. Los miembros ya salen de `GET /api/team-members` (HU-012). No existe ninguna consulta de elementos en `Backlog`: solo `CreateBacklogItem` (HU-001). HU-004 resolvió lo mismo capturando el identificador como texto (su B-02).
- **Decisión:** Añadir en `Backlog` la feature `ListBacklogItems` (`GET /api/backlog-items` → `[{ id, title, type }]`, orden por `CreatedAt` e `Id` solo por estabilidad, `AsNoTracking`, `.RequireAuthorization()`), ⚠️ [PROPUESTO], estrictamente aditiva: no toca el agregado, el `DbContext`, las configuraciones ni la migración, y no devuelve estimaciones, estado ni Sprint. El selector de miembros reutiliza `GET /api/team-members`.
- **Alternativas Consideradas:**
  - **Alternativa A (campo de texto para el identificador del elemento, como HU-004):** cero cambios en `Backlog`. Se descarta porque el UX de esta HU ya diseñó un selector y capturar GUID a mano induciría justo los errores de los Estados 8 a 10.
  - **Alternativa B (exponer la lista desde el contrato `IBacklogItemLookup` y un endpoint en `Teams`):** evita tocar `Backlog` en HTTP. Se descarta porque un endpoint de `Teams` que lista elementos del backlog sirve datos que no son del módulo y duplicaría una consulta que HU-004 y las vistas de HU-010 también necesitarán.
  - **Alternativa C (paginar, filtrar y ordenar la lista de elementos):** más escalable. Se descarta por prematura: el formato de las consultas no está definido (D-04) y no hay volumen medido.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** el selector del UX es posible sin duplicar datos y la consulta sirve a futuras HUs.
  - ⚠️ **Trade-off / Costo Real:** `HU-001` gana una superficie pública nueva sin haberse definido en su spec (cambio aditivo que debe validarse como no regresión de HU-001) y la lista sin paginación puede crecer sin cota; si el backlog supera unos cientos de elementos habrá que paginar y buscar en servidor. Debe confirmarlo el API Architect y registrarse en `plan.md`.

#### ADR-007: Sin eventos de dominio ni de integración, Outbox ni caché
- **Estado:** Aceptado
- **Contexto:** Ningún requisito notifica a otros módulos al asignar, y HU-010/HU-014 consumirán la relación pero hoy no existen.
- **Decisión:** `ItemAssignment` hereda de `Aggregate<Guid>` por la jerarquía estándar pero no emite eventos. Sin tabla `OutboxMessage`, sin MassTransit y sin decorador Redis.
- **Alternativas Consideradas:**
  - **Alternativa A (emitir `ItemAssigneeAssignedIntegrationEvent` para la carga por persona de HU-014):** anticiparía la integración. Se descarta porque no hay consumidor y el diseño debe nacer de un requisito; añadirlo después no cambia la tabla.
  - **Alternativa B (decorador Redis para las consultas):** se descarta por no existir un cuello de botella medido y por añadir invalidación al asignar.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** ningún punto de fallo adicional.
  - ⚠️ **Trade-off / Costo Real:** si HU-014 o el historial de HU-011 necesitan reaccionar a la asignación, deberán añadir el evento y, por ser crítico, el Outbox (constitución §4).

#### ADR-008: Identificadores recibidos como texto y validados por campo; ausente incluye `Guid.Empty`
- **Estado:** Aceptado
- **Contexto:** FR-010 y SC-003 exigen 400 "con el detalle de los campos inválidos" para elemento o miembro ausente o con formato inválido. Un `{itemId:guid}` en la ruta o un `Guid` en el cuerpo producirían 404 o un 400 general sin identificar el campo (mismo problema que HU-003 y HU-004, ADR-007 de esta última).
- **Decisión:** `POST /api/backlog-items/{itemId}/assignees` declara `itemId` como `string` (sin restricción `:guid`) y el cuerpo `{ memberId }` como `string?`. `AssignMemberToItemCommand(string? ItemId, string? MemberId)`; el validador exige presencia, `Guid.TryParse` y que no sea `Guid.Empty`, con errores bajo las claves `itemId` y `memberId`; el handler vuelve a parsear (defensa en profundidad). Las consultas `GET /api/backlog-items/{itemId:guid}/assignees` y `GET /api/team-members/{memberId:guid}/items` conservan `:guid`: un identificador malformado en una consulta responde 404, aceptable porque la HU solo define el 400 para la asignación. Las consultas con un identificador bien formado pero inexistente responden **200 con colección vacía**: la HU solo define 200 para las consultas y los selectores impiden el caso (⚠️ [PROPUESTO], ver §11).
- **Alternativas Consideradas:**
  - **Alternativa A (`Guid` tipado en ruta y cuerpo):** menos código. Se descarta porque un elemento malformado daría 404 y un miembro malformado un 400 sin campo, incumpliendo FR-010.
  - **Alternativa B (`Guid?` en el cuerpo y dejar fallar el binder):** mismo defecto de reporte por campo.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** los cuatro casos de SC-003 se reportan por campo y `errors` del ProblemDetails alimenta los mensajes en línea del UX (Estado 10).
  - ⚠️ **Trade-off / Costo Real:** parseo manual y plantillas distintas para el mismo segmento en POST y GET; hay que documentarlo en el contrato del API Architect.

## 6. Coding Conventions
- **Naming:** PascalCase para tipos; camelCase para locales y parámetros. Ficheros `AssignMemberToItem…`, `ListItemAssignees…` y `ListMemberItems…` con sufijos `Endpoint|Command|Query|Validator|CommandHandler|QueryHandler.cs`. Los textos de error son constantes públicas (`ItemAssignmentRules`, handlers) para que las pruebas los referencien.
- **Contrato HTTP (a formalizar por el API Architect; propuesta alineada con el UX):**
  - `POST /api/backlog-items/{itemId}/assignees` con cuerpo `{ "memberId": "<guid>" }` → **201 Created** (⚠️ [PROPUESTO]) con `Location` hacia el `GET` de la colección si se creó, o **200 OK** si ya existía; cuerpo `{ itemId, memberId, memberName, role }`; 400 con `errors` por campo (`itemId`, `memberId`); 401; 404 (miembro o elemento, el `detail` los distingue); 500.
  - `GET /api/backlog-items/{itemId:guid}/assignees` → 200 con `[{ id, name, role }]` (vacío si no hay).
  - `GET /api/team-members/{memberId:guid}/items` → 200 con `[{ id, title, type }]` (vacío si no hay).
  - `GET /api/backlog-items` → 200 con `[{ id, title, type }]` (ADR-006, ⚠️ [PROPUESTO]).
  - Las respuestas **no** incluyen `CreatedAt`/`CreatedBy`, estimaciones, estado ni Sprint. JSON en camelCase; `type` serializa como cadena (conversor global existente). El campo del rol se llama `role`, igual que `TeamMemberResponse` de HU-012.
- **Mensajes y distinción de 404:** el handler lanza `NotFoundException(ItemAssignmentRules.MemberNotFoundMessage)` o `NotFoundException(ItemAssignmentRules.ItemNotFoundMessage)`; el cliente distingue miembro de elemento por el `detail`, como espera el UX (Estados 8 y 9). Mensajes sin detalles internos.
- **Organización:** una feature, una carpeta; proyección directa a DTO en las consultas y `Adapt<T>()` solo donde evite mapeo manual repetitivo.
- **Identidad antes que datos:** `AssignMemberToItemCommandHandler` resuelve `ICurrentUser.UserId` antes de cualquier acceso a datos (sin claim: `UnauthorizedAccessException`, 401). `CreatedBy` proviene del `sub` vía `AuditableEntityInterceptor` de `Shared`, nunca del cuerpo. `TeamsModule` ya registra ese interceptor.
- **Consulta `ListItemAssignees`:** `ItemAssignments.AsNoTracking()` filtrado por `ItemId`, unido localmente a `TeamMembers`/`TechnicalRoles`, ordenado por `CreatedAt` y luego `Id` solo por estabilidad (⚠️ [PROPUESTO], no es contrato de orden). Sin llamada al contrato.
- **Consulta `ListMemberItems`:** (1) `ItemAssignments.AsNoTracking()` filtrado por `MemberId`, ordenado por `CreatedAt` e `Id`; (2) una sola llamada `GetItemsAsync(ids)`; (3) se devuelven exactamente los elementos relacionados. Si el contrato no devuelve algún id (elemento ya inexistente) la consulta lo omite y registra un `LogWarning`; no se inventa un título.
- **Logging:** Serilog vía `ILogger<T>`; sin `Console.WriteLine`; sin datos de token.
- **Async:** todo método con E/S recibe y propaga `CancellationToken`.
- **Frontend:** componentes standalone con `ChangeDetectionStrategy.OnPush`, Signals e `inject()`; formulario reactivo tipado de dos controles (`itemId`, `memberId`); el rol del miembro es un campo de solo lectura derivado del miembro elegido (UX D-08); textos con i18n nativo. Sin validación de negocio duplicada en el cliente: solo se bloquea el envío durante `isSubmitting()` y los errores 400/404/500 se pintan desde la respuesta (UX D-05, D-06). Las grillas no tienen columna de acciones, filtros, orden ni paginación. Un 401 persistente reutiliza el interceptor y el guard existentes (Estado 11).

## 7. Testing
- **Qué debe testearse y Dónde están los tests:**
  - **Unitarias (`tests/Unit/Teams`):** `AssignMemberToItemValidator` con los cuatro casos de SC-08 (elemento ausente, miembro ausente, elemento con formato inválido, miembro con formato inválido) más `Guid.Empty`, comprobando que el error cae en el campo correcto; `AssignMemberToItemCommandHandler` (sin identidad ⇒ 401 antes de tocar datos; miembro inexistente ⇒ `NotFoundException` y el contrato **no** se invoca; elemento inexistente ⇒ `NotFoundException` y no se persiste; ambos inexistentes ⇒ gana el miembro; par existente ⇒ resultado "ya existía" **sin** `SaveChanges`; un único `SaveChanges` al crear); `ListItemAssigneesQueryHandler` (vacío, exactitud, rol del miembro) y `ListMemberItemsQueryHandler` (vacío, exactitud, una sola llamada de lote, omisión de id inexistente); `ItemAssignment.Create`. El contrato `IBacklogItemLookup` se sustituye por un doble escrito a mano (no mocks que afirmen la implementación). `tests/Unit/Backlog`: `ListBacklogItemsQueryHandler`.
  - **Integración (`tests/Integration/Teams`, PostgreSQL real por Testcontainers, una BD por prueba):** SC-01 (201, cuerpo, fila con `CreatedBy` = `sub`), SC-02 (dos responsables: ambos relacionados y la fila previa idéntica), SC-03 (consulta de personas ⇒ exactamente dos), SC-04 (elemento sin responsables ⇒ 200 `[]`), SC-05 (consulta de elementos de un miembro), SC-06 y SC-07 (404 con **tabla vacía después**), SC-08 (400 por campo, tabla vacía), SC-09 (401 en asignar y en ambas consultas, sin leer ni persistir), SC-10 (fallo de persistencia forzado ⇒ 500 sin traza y sin fila); **asignación duplicada ⇒ 200 con la misma fila, `CreatedAt`/`CreatedBy` intactos y una sola fila**; **concurrencia**: N solicitudes simultáneas del mismo par producen exactamente un 201, el resto 200 y una sola fila; SC-02/FR-013: se compara el registro de `backlog` (título, tipo, `devPoints`, `qaPoints`, estado) y el del miembro antes y después. `tests/Integration/Backlog`: `GET /api/backlog-items` y no regresión de `POST`.
  - **Migración:** una prueba aplica `AddItemAssignments` y comprueba que `UX_ItemAssignments_ItemId_MemberId` rechaza por SQL directo un segundo par igual (y admite el mismo elemento con otro miembro y el mismo miembro con otro elemento) y que la FK a `teams."TeamMembers"` rechaza un `MemberId` inexistente. Solo toca el schema `teams`; verifica que `backlog`, `sprints` y `application` no cambian.
  - **No regresión (FR-013):** las suites de HU-001, HU-002, HU-003, HU-004 y HU-012 pasan sin modificaciones.
  - **Frontend (Jest, `*.spec.ts` junto a cada componente):** `item-assignees-view` (Estados 1, 2, 5, 6, 7), `member-items-view` (Estado 3 y miembro sin elementos) y `assign-assignee-dialog` (Estados 4, 8, 9, 10, 12), comprobando que la grilla se vuelve a consultar al servidor tras el éxito, que 201 y 200 producen toasts distintos, que el diálogo conserva el campo no culpable ante 404/400/500 y que el rol del diálogo es de solo lectura.
- **Reglas:** TDD (prueba primero). Prohibido `[Fact(Skip=...)]`, doble de la base de datos en integración y aserciones que no puedan fallar. La identidad en integración puede usar el mecanismo de autenticación de prueba ya presente (HU-002 cubre Keycloak real).

## 8. Security
- **Manejo de secretos:** cadenas de conexión y configuración de Keycloak por variables de entorno. Nada de credenciales en el repositorio ni en `appsettings.json`.
- **Datos sensibles y Acciones prohibidas:** los cuatro endpoints invocan `.RequireAuthorization()`; basta un token válido con identidad (permisos por perfil no documentados). Prohibido relajar `verify-token-audience` o añadir endpoints anónimos. Los 500 no exponen trazas. `CreatedBy` proviene del `sub`, nunca del cuerpo. El contrato hacia Backlog no se expone por HTTP y no devuelve datos que las consultas no necesiten (sin descripción, criterios de aceptación, estimaciones, estado ni Sprint). Los identificadores se validan como GUID antes de cualquier acceso a datos (sin concatenación de SQL).

## 9. Database
- **Schema:** Relacional, schema `teams`, tabla `teams."ItemAssignments"`: `Id uuid PK`, `ItemId uuid NOT NULL` **sin FK** (el elemento está en el schema `backlog`), `MemberId uuid NOT NULL` con **FK** a `teams."TeamMembers"("Id")` `ON DELETE RESTRICT`, `CreatedAt timestamptz NOT NULL`, `CreatedBy varchar NOT NULL`, `LastModified timestamptz NULL`, `LastModifiedBy varchar NULL` (columnas de auditoría gestionadas por `AuditableEntityInterceptor`, no a mano). Índice único `UX_ItemAssignments_ItemId_MemberId` (`ItemId`, `MemberId`), índice no único `IX_ItemAssignments_MemberId` para la consulta del miembro (la consulta del elemento se sirve por el prefijo `ItemId` del índice único). Sin columnas de rol, estado ni orden. El detalle de tipos y longitudes lo fija el Data Architect dentro de estas reglas.
- **Reglas para modificar DB:** migraciones solo en `app/backend/src/Modules/Teams/Data/Migrations`; la migración `AddItemAssignments` solo **crea** una tabla nueva (sin DDL bloqueante sobre tablas existentes) y no toca los schemas `backlog`, `sprints` ni `application`. Si el negocio define unicidad distinta, máximo de responsables o baja de responsables, el cambio es una migración nueva (ADR-004).

## 10. Git & PR Rules
- **Naming de branches y Commits:** la rama la gestiona el Watcher GitOps (`feat/015-relacion-personas-roles-elementos`). Los agentes no ejecutan Git. Commits con Conventional Commits.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:** leer `spec.md`, esta guía y `ux_015_*.md`; revisar `Modules/Teams` (HU-012), `Modules/Sprints/Contracts/IBacklogModuleApi.cs` + `Modules/Backlog/BacklogModuleApi.cs` como patrón de contrato in-process y el handler `AssignItemToSprintCommandHandler` como patrón de traducción de la violación de unicidad; escribir primero las pruebas del escenario.
- **Qué debe validar después / Cuándo pedir confirmación:**
  - `dotnet build` y `dotnet test` de toda la solución en verde, con las suites de HU-001, HU-002, HU-003, HU-004 y HU-012 sin cambios.
  - Que ningún fichero fuera de la lista permitida de §2 fue modificado, que `BacklogItem` y `TeamMember` no tienen columnas nuevas y que `Shared` no cambió.
  - Que no existe quitar, reemplazar, lote, rol por asignación, máximo de responsables, filtros ni paginación.
  - Detenerse y escalar si una tarea exige cambiar entidades de `Backlog` o `Teams`, referenciar `BacklogDbContext` desde `Teams` o resolver un punto abierto para continuar.
- **Reconciliación UX → tareas:** `Task-UI-01` → `item-assignees-view` (Estados 1, 2, 5, 6, 7: grilla, vacía, refresco y toast); `Task-UI-02` → `member-items-view` (Estado 3); `Task-UI-03` → `assign-assignee-dialog` (Estados 4, 8, 9, 10, 12); `Task-UI-04` → interceptor y guard existentes sin cambios (Estado 11). Rutas de UI `/equipos/responsables` y `/equipos/responsables/miembro` confirmadas; las rutas HTTP quedan fijadas en §6. El shell de navegación (topbar y sidebar) sigue sin existir en el repositorio (punto abierto informativo heredado de HU-003): la HU entrega la pestaña y las rutas, no el shell.
- **Reconciliación de la spec (para BA y Spec Kit; no la edita el SA):** `spec.md` conserva el Edge Case "asignar dos veces" y FR-015 ("no asumir reglas sobre duplicados") como no documentados. Esta guía sigue la resolución humana B. Deben reflejarse: un escenario de asignación duplicada idempotente, un FR de unicidad del par y el retiro de "duplicados" de FR-015 (UX B-01). Mientras tanto, el criterio vinculante para el desarrollo es esta guía y el Estado 7 del UX.
- **Decisiones del SA sobre vacíos de la spec (⚠️ [PROPUESTO], a confirmar con el BA):** (1) con miembro y elemento inexistentes a la vez gana el 404 del miembro; (2) las consultas de un elemento o miembro inexistente (id válido) responden 200 con colección vacía, sin 404; (3) estado de error de lectura distinto de 401 (UX B-03): mensaje genérico en la vista, sin datos parciales; (4) `GET /api/backlog-items` añadido a `Backlog` (ADR-006).

## 12. Definition of Done
- Todo el código nuevo cuenta con patrones de resiliencia y manejo de estado definidos (§5.1 y §5.2).
- No hay ninguna credencial o variable de entorno hardcodeada.
- Las migraciones de base de datos han sido auditadas (solo schema `teams`, índice único y FK locales, sin tocar `backlog`, `sprints` ni `application`).
- Tests y Lint pasan exitosamente en el entorno de CI, sin regresión en HU-001, HU-002, HU-003, HU-004 ni HU-012.
- Los escenarios SC-01..SC-10, la asignación duplicada idempotente y la carrera concurrente tienen prueba automatizada.
- Ningún par (elemento, miembro) aparece más de una vez y ninguna solicitud rechazada deja filas en `ItemAssignments`.
- No existen consultas ni FKs cross-schema, ni cambios en `BacklogItem` o `TeamMember`.
