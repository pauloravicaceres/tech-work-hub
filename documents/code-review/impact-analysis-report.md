# 🏗️ Reporte de Impacto y Code Review Vivo (`impact-analysis-report.md`)

**HU:** 001-HU_registro_elementos_backlog_multitipo · **Rama:** `feat/001-HU_registro_elementos_backlog_multitipo`
**Fecha:** 03-10-2026 · **Dictamen (6.ª iteración):** ✅ **[APROBADO CON RESERVAS]** (5.ª: ❌ [RECHAZADO] por #16..#19, ya cerrados)

> Renderizado selectivo: solo se documentan los componentes alterados por la HU 001. Resto del repositorio: *Sin impacto en este PR/HU*.

---

## 1. AI Code Review Dashboard

```text
╔══════════════════════════════════════════════════════════════╗
║  AI CODE REVIEW DASHBOARD — HU 001            [RECHAZADO]    ║
╠══════════════════════════════════════════════════════════════╣
║  Archivos analizados (lectura física) ........... 16         ║
║  Violaciones arquitectónicas .................... 5          ║
║  Problemas de seguridad / rendimiento ........... 3          ║
║  Hallazgos zero-tolerance (stubs/hardcode) ...... 4          ║
║  Deuda técnica encontrada ....................... 4          ║
║  Cobertura de tests (lógica real) ............... 0 %        ║
║  Tests tautológicos / stubs ..................... 4 de 4     ║
╚══════════════════════════════════════════════════════════════╝
```

### Hallazgos bloqueantes

| # | Sev. | Archivo | Hallazgo | Responsable |
|---|------|---------|----------|-------------|
| 1 | 🔴 | `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/CreateBacklogItemEndpoint.cs:13-15` | La lambda no recibe `CancellationToken` y llama `mediator.Send(command)` sin token. La cancelación nunca llega al handler ni a EF Core (Perf. Leak, rechazo inmediato). | @DEV-BACK |
| 2 | 🔴 | `.../CreateBacklogItemCommandHandler.cs:10-19` | `IBacklogDbContext` e `IApplicationModuleApi` se declaran dentro del archivo del handler y no existen implementaciones, `DbContext`, registro DI, `Program.cs` ni `.csproj` en el repo. El slice no compila ni ejecuta. `BacklogItemConfiguration` no tiene `DbContext` que la aplique. | @DEV-BACK |
| 3 | 🔴 | `src/Modules/Backlog/Data/AuditableEntityInterceptor.cs:16-17` | Implementación "conceptual" vacía: no inyecta `CreatedAt`/`CreatedBy`. Ambas columnas son `IsRequired` (`BacklogItemConfiguration.cs:44-49`), así que el primer insert falla. T018 está marcada `[X]` falsamente. Firma de alucinación. | @DEV-BACK |
| 4 | 🔴 | `CreateBacklogItemValidator.cs` / `...Handler.cs:41` | No existe pipeline `ValidationBehavior<,>` ni registro de validadores, por lo que el validador nunca se ejecuta. Cualquier `Type` inválido llega a `Enum.Parse` y lanza 500. El handler lanza `ValidationException`, pero no hay mapeo a HTTP 400 (T013). | @DEV-BACK |
| 5 | 🔴 | `app/frontend/.../create-backlog-item.component.ts:68,90` | Suscripciones manuales a RxJS (`valueChanges.subscribe`, `http.post().subscribe`) sin `takeUntilDestroyed`, donde corresponden `Signals` / `toSignal` / `rxResource`. Viola la regla 3. | @DEV-FRONT |
| 6 | 🔴 | `.../create-backlog-item.component.ts:60` | Datos hardcodeados: `applications = [{ value: 'app-id-101' }]`. No es un `Guid`, así que el backend rechaza cualquier selección (binding fallido o 400). Debe cargarse desde la API del módulo Application. | @DEV-FRONT |
| 7 | 🔴 | `.../create-backlog-item.component.ts:35` | `styleUrls: ['./create-backlog-item.component.scss']` apunta a un archivo inexistente, por lo que el build de Angular falla. | @DEV-FRONT |
| 8 | 🟠 | `.../create-backlog-item.component.ts:43-51` / `CreateBacklogItemCommand.cs:11` | Contrato roto: el front envía `priority: 'Medium'` (string) y el back espera el enum `BacklogItemPriority` (INT). No hay evidencia de `JsonStringEnumConverter`. Además `err.error?.message?.includes('aplicación')` no coincide con el mensaje en inglés del backend. | @DEV-FRONT / @DEV-BACK |
| 9 | 🔴 | `tests/Integration/Backlog/CreateBacklogItemTests.cs`, `tests/Unit/Backlog/CreateBacklogItemValidatorTests.cs` | QA Gate: `[Fact]` comentado, cuerpos `await Task.CompletedTask` o vacíos. Cobertura lógica 0 %. T009, T010 y T015 marcadas `[X]` falsamente. No hay `.spec.ts` del componente. | @QA-AUTO |

### Re-auditoría QA (03-10-2026, 2.ª iteración)
- **Hallazgo 9: ✅ RESUELTO.** Se leyeron `CreateBacklogItemTests.cs`, `BacklogApiFactory.cs`, `CreateBacklogItemCommandHandlerTests.cs`, `CreateBacklogItemValidatorTests.cs` y `BacklogItemDomainTests.cs`. Las pruebas ejecutan el endpoint real (TestServer + MediatR + handler), el validador y el dominio, con asserts sobre estado persistido. No son tautológicas.
- **Ejecución:** Unit 42/43 OK, Integration 5/10 OK. Los 6 fallos son defectos reales de producción y no se deben desactivar.

| Test fallido | Causa en producción | Hallazgo | Responsable |
|---|---|---|---|
| `Integration…ConTituloVacio`, `…ConTipoFueraDelCatalogo`, `…ConDevPointsNegativos` (esperan 400, reciben 201) | No hay `ValidationBehavior`, por lo que el validador nunca corre | #4 | @DEV-BACK |
| `Integration…ConApplicationIdInexistente` | `ValidationException` sin mapeo a HTTP 400 | #4 | @DEV-BACK |
| `Integration…ConPrioridadComoTextoSegunHU` | Sin `JsonStringEnumConverter` para `priority: "High"` | #8 | @DEV-BACK |
| `Unit…Validate_ConTipoNulo_DebeFallarEnType` | **Hallazgo nuevo #10:** `IsEnumName` acepta `null`; falta `.NotEmpty()` en `Type` (`CreateBacklogItemValidator.cs:14-16`), así que un JSON sin `type` llega a `Enum.Parse` y lanza 500 | #10 | @DEV-BACK |

Los hallazgos 1 (token en endpoint), 2, 3, 5, 6 y 7 siguen abiertos. Los tests de integración no cubren el endpoint con token cancelado ni el interceptor (se usa `FakeBacklogDb`).

### Re-auditoría Code Review (03-10-2026, 3.ª iteración)
Evidencia: `documents/qa-auto/qa-report.md` + lectura física de código y diff del working tree. No se ejecutaron tests en esta revisión.

| Ref. | Capa | Estado | Detalle | Responsable |
|---|---|---|---|---|
| DEF-02 / #10 | [CAPA:CODE] | 🟡 **Corregido en working tree, sin commit** | `CreateBacklogItemValidator.cs:14-17` ya incluye `.NotEmpty()` en `Type`. Pendiente: commit y re-ejecución de `Validate_ConTipoNulo_DebeFallarEnType` para cerrar. | @DEV-BACK / @QA-AUTO |
| DEF-01 (#4) | [CAPA:CODE] | 🔴 Abierto | Sin `ValidationBehavior<,>` ni registro de validadores. | @DEV-BACK |
| DEF-03 (#4) | [CAPA:CODE] | 🔴 Abierto | `ValidationException` sin mapeo a 400. | @DEV-BACK |
| DEF-04 (#3) | [CAPA:CODE] | 🔴 Abierto | `AuditableEntityInterceptor` no-op; `CreatedBy` requerido. | @DEV-BACK |
| DEF-05 | [CAPA:CODE] | 🔴 Abierto | Sin `DispatchDomainEventsInterceptor`. | @DEV-BACK |
| DEF-06 (#2) | [CAPA:PLAN] | 🔴 Abierto | Sin `Program`, `.csproj`, `DbContext` ni implementaciones; interfaces dentro del handler. | @DEV-BACK |
| DEF-07 (#6, #8) | [CAPA:CODE] | 🔴 Abierto | `app-id-101` no es `Guid`; falta `JsonStringEnumConverter`. | @DEV-FRONT / @DEV-BACK |
| DEF-08 (#7) | [CAPA:CODE] | 🔴 Abierto | `.scss` inexistente; sin `package.json`/`angular.json`/`jest.config`. | @DEV-FRONT |
| **#11 QAPoints (dominio)** | [CAPA:CODE] | 🔴 **Nuevo** | La regla "técnico ⇒ QAPoints null" vive solo en `Handler.cs:51-54`; `BacklogItem.Create` acepta `qaPoints` para un Spike, por lo que otro camino de creación/actualización viola el invariante. Moverla al agregado y quitar la duplicación FE/BE. | @DEV-BACK |
| **#12 QAPoints (front)** | [CAPA:CODE] | 🔴 **Nuevo** | `component.ts:49,94` envía `qaPoints: 0` por defecto para UserStory/Bug; un 0 "no estimado" se confunde con un 0 real. Enviar `null`. | @DEV-FRONT |
| **#13 QAPoints (política)** | [CAPA:SPEC] | 🟠 **Nuevo** | Un Spike con `qaPoints=8` devuelve 201 y se guarda `null` sin aviso. La spec/contrato no define si se descarta o se rechaza con 400. | @SA / @API |
| **#14 Contrato API** | [CAPA:SPEC] | 🟠 **Nuevo** | `contracts/api.md` omite `priority` y `acceptanceCriteria` (el comando los exige). El 400 documentado usa `errors{}`, pero el front lee `err.error?.message` y `includes('aplicación')` no coincide con el mensaje en inglés, así que siempre muestra "Datos inválidos". | @API / @DEV-BACK / @DEV-FRONT |
| **#15 Trazabilidad de tareas** | [CAPA:TASKS] | 🟠 **Nuevo** | T009, T010, T015 y T018 en `[X]` sin implementación real (T018 = interceptor vacío). Faltan tareas para ValidationBehavior, exception handler, DispatchDomainEventsInterceptor, Program/DbContext y config Angular/Jest. | @DEV-BACK |

**Hallazgo 1 (token en endpoint):** sigue abierto, `CreateBacklogItemEndpoint.cs:13-15`. **Menores añadidos:** `Enum.Parse` → `TryParse`; cambio `Type` string→int y schema `backlog` sin migración alineada con `data-model.md`.

**Dictamen 3.ª iteración:** ❌ **[RECHAZADO]**. Cerrado: hallazgo 9. Corregido sin verificar: DEF-02. Abiertos: todos los demás. Handoff: @DEV-BACK (servidor), @DEV-FRONT (interfaz), @QA-AUTO (INT-01..INT-10 + Jest tras las correcciones). Sin GITOPS-MERGE-CLOSE.

### Re-auditoría Code Review (03-10-2026, 5.ª iteración) — dictamen vigente
Sustituye al [APROBADO CON RESERVAS] de las 16:10:40. Los defectos DEF-01..DEF-08 y #1..#15 de las iteraciones anteriores se tratan como cerrados en código según esa revisión (61/61, 22/22, Jest 19/19). Esta iteración bloquea por #16..#19, que ninguna prueba actual detecta (SQLite, sin Keycloak, sin cliente real).

| Ref. | Capa | Estado | Detalle | Responsable |
|---|---|---|---|---|
| #16 | [CAPA:PLAN] | 🔴 Abierto | El front llama `GET /api/applications`; el endpoint no existe. `contracts/api.md` y `plan.md` no lo definen (solo `IApplicationModuleApi` interno). Definir contrato, plan y tarea; implementar con `.RequireAuthorization()` y `CancellationToken`. | @DEV-BACK |
| #17 | [CAPA:PLAN] | 🔴 Abierto | Sin interceptor Bearer ni ruta de login en el front; `plan.md` y `tasks.md` no contemplan la autenticación del cliente. Contra el backend real el POST devuelve 401 (FR-001, FR-009). | @DEV-FRONT |
| #18 | [CAPA:PLAN] | 🔴 Abierto | `ssl-required: none` y `verify-token-audience: false` en `appsettings.json` base, sin override por entorno; ningún paso de despliegue aplica migraciones; sin migración probada en PostgreSQL. | @DEV-BACK |
| #19 | [CAPA:CODE] | 🔴 Abierto | La identidad (`sub`) se resuelve en `SaveChanges`, tras consultar el catálogo de aplicaciones. FR-009 exige 401 antes de acceder a datos. | @DEV-BACK |
| INT / PostgreSQL | [CAPA:TASKS] | 🟠 Pendiente | T037 abierta: INT-01..INT-10 contra PostgreSQL (Testcontainers) y migraciones, cuando haya Docker. | @QA-AUTO |

**Criterio de capa:** #16, #17 y #18 pasan de CODE a PLAN porque el diseño no define la pieza que falta (regla 4: ante la duda, la capa superior). Decisión humana: no requerida. Sin GITOPS-MERGE-CLOSE.

### Re-auditoría Code Review (03-10-2026, 6.ª iteración) — dictamen vigente
Evidencia: `documents/qa-auto/qa-report.md` (cuarta ejecución, T043) más lectura física de 30 archivos y ejecución propia con Docker activo: unitarias **62/62**, integración **31/31** (PostgreSQL 16, Testcontainers), Jest **31/31**. Sustituye al [RECHAZADO] de la 5.ª iteración.

| Ref. | Capa | Estado | Evidencia leída |
|---|---|---|---|
| #16 | [CAPA:PLAN] | ✅ Cerrado | `ListApplicationsEndpoint.cs`: `GET /api/applications`, `.RequireAuthorization()`, `CancellationToken`; `ApplicationModuleApi.ListAsync` con `AsNoTracking`. Prueba: `ListApplicationsTests` (200 y 401). |
| #17 | [CAPA:PLAN] | ✅ Cerrado | `bearer-token.interceptor.ts` (Bearer + un reintento tras renovar), `auth.guard.ts`, `auth.service.ts` (PKCE S256, reautenticación), registro en `app.config.ts`. Jest: interceptor, guard y servicio. |
| #18 | [CAPA:PLAN] | ✅ Cerrado | `appsettings.json` base: `ssl-required: external`, `verify-token-audience: true`; solo Development relaja. `KeycloakConfigurationTests`, `MigrationsPostgresTests`, `scripts/apply-migrations.*`. |
| #19 | [CAPA:CODE] | ✅ Cerrado | `CreateBacklogItemCommandHandler.cs:22` resuelve `UserId` antes de `ExistsAsync`. Prueba: token sin `sub` ⇒ 401, catálogo sin llamadas y sin filas. |

**Reservas (no bloquean el código):**
1. [CAPA:TASKS] `tasks.md:91,135,145,164`: T018, T025, T032 y T043 siguen en `[ ]` pese a la evidencia; T017 (quickstart manual) sin ejecutar.
2. [CAPA:CODE] Producción de #16..#19 sin commitear (backend, `app/frontend`, `specs/`); solo está commiteado 296f906 (pruebas).
3. [CAPA:PLAN] Riesgo residual: `ApplicationModuleApi` y su endpoint reales no se ejercen en integración (catálogo simulado); Keycloak/JWT real sin prueba; sin semilla del catálogo.
4. Menores: `Application.csproj` → `Backlog` (el contrato vive en Backlog); con token sin `sub` y payload inválido responde 400 antes que 401.

**Dictamen 6.ª iteración:** ✅ **[APROBADO CON RESERVAS]**. Sin cierre de rama hasta decisión humana.

**Confirmación (19:42):** la re-ejecución de QA (62/62, 31/31 PostgreSQL, Jest 31/31) coincide con la ejecución propia; no hay archivos modificados desde la auditoría, así que el dictamen no cambia. El 27/31 inicial de QA fue un fallo de conexión con Docker, no de producción.

### Hallazgos menores (corregir en la misma iteración)
- `CreateBacklogItemValidator`: sin límite de longitud para `Description` / `AcceptanceCriteria` (superficie de abuso / payloads gigantes).
- La lista de tipos técnicos está duplicada en handler y componente; centralizar.
- `BacklogItem.CreatedAt` / `CreatedBy` son `private set` sin inicializar; dependen al 100 % de un interceptor que hoy no existe.
- Botón "Cancelar" sin handler; `CommonModule` + `*ngIf` en lugar de control flow `@if`.
- `Aggregate.cs` importa `Backlog.Domain.BacklogItems.Events` sin usarlo.

### Cumplimiento SecOps
| Control | Resultado |
|---|---|
| `.RequireAuthorization()` en endpoint | ✅ Presente |
| `ICarterModule` (sin `[ApiController]`) | ✅ |
| `CancellationToken` en Handler → `AddAsync`/`SaveChangesAsync`/`ExistsAsync` | ✅ |
| `CancellationToken` en Endpoint → `mediator.Send` | ❌ Ausente |
| N+1 / queries en bucles | ✅ Sin bucles |
| IDOR | ➖ N/A (solo creación). Pendiente para HU de update/delete. |
| Mass assignment | ✅ El `Command` no expone `Status`, `CreatedBy` ni roles |
| Credenciales hardcodeadas | ✅ Ninguna |
| XSS (`innerHTML`, `bypassSecurityTrust*`) | ✅ Ninguno (solo interpolación `{{ }}`) |
| `NgModules` | ✅ Componente `standalone` |
| Cruce de schemas / `.Include()` | ✅ Ninguno; el acceso a Application va por `IApplicationModuleApi` |

---

## 2. Architecture Compliance & Traceability

### 2.0 Flujo real tras la 5.ª iteración (solo lo alterado: #16..#19)

```mermaid
flowchart LR
    UI["CreateBacklogItemComponent"] -->|"GET /api/applications"| X["❌ #16 endpoint inexistente (404)"]
    UI -->|"POST /api/backlog/items sin Authorization"| AUTH["❌ #17 sin interceptor Bearer ni login → 401"]
    AUTH -. "con token válido" .-> EP["CreateBacklogItemEndpoint ✅ RequireAuthorization"]
    EP --> HD["CommandHandler"]
    HD -->|"1.º consulta catálogo"| AP["IApplicationModuleApi"]
    HD -->|"2.º resuelve identidad en SaveChanges"| INT["❌ #19 orden invertido (FR-009)"]
    KC["Keycloak appsettings base: ssl none, audience off ❌ #18"] -. "protege" .-> EP
    MIG["❌ #18 migraciones sin paso de despliegue"] -.-> PG[("PostgreSQL schema backlog, sin probar")]

    classDef bad fill:#fdd,stroke:#c00,color:#600;
    class X,AUTH,INT,KC,MIG bad;
```

### 2.1 Histórico (3.ª iteración)

```mermaid
flowchart LR
    subgraph FE["Frontend (Angular standalone)"]
        C["CreateBacklogItemComponent"]
        C -. "❌ subscribe() manual, sin Signals" .-> H["HttpClient.post"]
    end
    H -->|"POST /api/backlog/items (priority:string, applicationId:'app-id-101')"| E["CreateBacklogItemEndpoint (ICarterModule) ✅ RequireAuthorization"]
    E -->|"❌ mediator.Send(command) SIN CancellationToken"| M["MediatR"]
    M -. "❌ ValidationBehavior inexistente: Validator nunca corre" .-> V["CreateBacklogItemValidator"]
    M --> HD["CreateBacklogItemCommandHandler ✅ CT propagado"]
    HD --> AP["IApplicationModuleApi ❌ sin implementación"]
    HD --> DB["IBacklogDbContext ❌ sin implementación / sin DbContext"]
    DB --> I["AuditableEntityInterceptor ❌ stub vacío"]
    DB --> PG[("PostgreSQL schema backlog")]

    classDef bad fill:#fdd,stroke:#c00,color:#600;
    class E,M,V,AP,DB,I,C bad;
```

**Desviaciones señaladas:**
1. Salto de capa de cancelación: Endpoint → MediatR sin token.
2. Salto de capa de validación: Validator desconectado del pipeline.
3. Capa de persistencia inexistente: Handler → interfaz sin implementación.
4. Contrato UI ↔ API divergente (`priority` string vs INT, `applicationId` no-Guid).

---

## 3. Change Impact Diagram

```mermaid
flowchart TD
    subgraph UI["Frontend"]
        CMP["CreateBacklogItemComponent .ts/.html"]
        SCSS["create-backlog-item.component.scss ❌ NO EXISTE"]
        SPEC["create-backlog-item.component.spec.ts ❌ NO EXISTE"]
    end
    subgraph BE["Backlog Module"]
        EP["CreateBacklogItemEndpoint"]
        CMD["CreateBacklogItemCommand"]
        VAL["CreateBacklogItemValidator"]
        HND["CreateBacklogItemCommandHandler"]
        AGG["BacklogItem (Aggregate)"]
        CFG["BacklogItemConfiguration"]
        INT["AuditableEntityInterceptor"]
    end
    subgraph TST["Pruebas"]
        TI["CreateBacklogItemTests (Integration) 🟥 stub, 0 asserts"]
        TU["CreateBacklogItemValidatorTests (Unit) 🟥 stub, 0 asserts"]
    end

    CMP --> EP --> CMD --> HND --> AGG --> CFG
    EP --> VAL
    HND --> INT
    TI -.->|"sin ejecutar"| EP
    TI -.->|"sin ejecutar"| HND
    TU -.->|"sin ejecutar"| VAL
    SPEC -. "sin cobertura" .-> CMP

    classDef uncovered fill:#fdd,stroke:#c00;
    class CMP,EP,VAL,HND,INT,TI,TU,SCSS,SPEC uncovered;
```

Todos los componentes alterados quedan **sin cobertura efectiva** (0 %).

### 3.1 Impacto de la 5.ª iteración (#16..#19)

```mermaid
flowchart TD
    N16["#16 GET /api/applications (nuevo endpoint Backlog/Application)"]
    N17["#17 interceptor Bearer + ruta login (Frontend)"]
    N18["#18 appsettings por entorno + paso de migraciones"]
    N19["#19 CreateBacklogItemCommandHandler (orden de identidad)"]
    T1["Test del endpoint 16 ❌ no existe"]
    T2["Jest del interceptor ❌ no existe"]
    T3["INT-01..INT-10 en PostgreSQL ⏳ pendiente Docker (T037)"]
    T4["Test de 401 antes de consultar catálogo ❌ no existe"]
    N16 -.-> T1
    N17 -.-> T2
    N18 -.-> T3
    N19 -.-> T4
    classDef uncovered fill:#fdd,stroke:#c00;
    class N16,N17,N18,N19,T1,T2,T3,T4 uncovered;
```

Componentes de #16..#19 sin cobertura: 4 de 4. Resto de la HU (cierre de DEF-01..DEF-08): *sin cambios en esta iteración*.

---

## 4. Dependency / Coupling Graph

```mermaid
flowchart LR
    Handler["CreateBacklogItemCommandHandler"] -->|"define en el mismo archivo"| IDb["IBacklogDbContext"]
    Handler -->|"define en el mismo archivo"| IApp["IApplicationModuleApi"]
    Handler --> Domain["BacklogItem / Enums"]
    Handler -. "duplica regla tipos técnicos" .-> Front["CreateBacklogItemComponent"]
    Front -. "string enums + app-id hardcodeado" .-> Cmd["CreateBacklogItemCommand"]
    Interceptor["AuditableEntityInterceptor"] -. "CreatedAt/CreatedBy requeridos por Config, no cumplidos" .-> Config["BacklogItemConfiguration"]
    IApp -. "contrato cross-module sin dueño (módulo Application)" .-> AppModule["Application Module (fuera de la HU)"]
```

**Deuda técnica temprana:** interfaces de infraestructura definidas dentro de la capa de aplicación; regla de negocio "ítem técnico ⇒ QAPoints null" duplicada en FE y BE; dependencia cross-module sin implementación ni contrato publicado.

---

## Veredicto

```text
[APROBADO CON RESERVAS] - 6.ª iteración (03-10-2026, 19:39):
- Lectura física completada: 30 archivos auditados; ejecución propia 62/62 + 31/31 (PostgreSQL) + Jest 31/31.
- #16..#19 cerrados. CancellationToken propagado, cero N+1, cero IDOR (solo creación), sin XSS.
- Reservas: tareas T018/T025/T032/T043 sin marcar, producción sin commitear, riesgo residual Keycloak/catálogo real.
- Cierre de rama pendiente de decisión humana (ver tracker).
(Histórico: 5.ª iteración, 19:13, [RECHAZADO] por #16..#19.)
```
