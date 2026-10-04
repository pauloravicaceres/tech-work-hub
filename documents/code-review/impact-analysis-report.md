# 🏗️ Reporte de Impacto y Code Review Vivo (`impact-analysis-report.md`)

**HU vigente:** 003-HU_gestion_sprint_dos_semanas · **Rama:** `feat/003-HU_gestion_sprint_dos_semanas`
**Fecha:** 04-10-2026 · **Dictamen (1.ª iteración HU-003):** ✅ **[APROBADO CON RESERVAS]**
**HUs anteriores (cerradas):** 002-HU_pruebas_integracion_keycloak_y_catalogo_application ([APROBADO CON RESERVAS]) y 001-HU_registro_elementos_backlog_multitipo (6.ª iteración [APROBADO CON RESERVAS]); sus secciones se conservan abajo como histórico.

> Renderizado selectivo: solo se documentan los componentes alterados por la HU-003 (módulo nuevo `app/backend/src/Modules/Sprints/`, sus pruebas, `features/sprints` del frontend y los ficheros compartidos permitidos: `Api.csproj`, `Program.cs`, `TechWorkHub.sln`, `app.routes.ts`; además los scripts `apply-migrations.*`). `Modules/Backlog`, `Modules/Application`, `BuildingBlocks/Shared` y `core/auth`: *Sin impacto en este PR/HU*.
---

## 1. AI Code Review Dashboard

### 1.0 HU-003 — Gestión de Sprint de dos semanas (crear y consultar)

```text
╔══════════════════════════════════════════════════════════════╗
║  AI CODE REVIEW DASHBOARD — HU 003   [APROBADO CON RESERVAS]║
╠══════════════════════════════════════════════════════════════╣
║  Archivos analizados (lectura física) ........... 40         ║
║  Violaciones arquitectónicas .................... 0          ║
║  Problemas de seguridad ......................... 0          ║
║  Fugas de rendimiento (CancellationToken / N+1) . 0 / 0      ║
║  Hallazgos zero-tolerance (stubs/hardcode) ...... 0          ║
║  Deuda técnica encontrada ....................... 4          ║
║  Cobertura de tests faltante (CA) ............... 0 %        ║
║  Tests tautológicos / stubs ..................... 0 de 115   ║
╚══════════════════════════════════════════════════════════════╝
```

**Evidencia propia (no del resumen de QA):** `Sprints.UnitTests` **43/43**; `Sprints.IntegrationTests` **46/46** (PostgreSQL por Testcontainers, 1 m 5 s); Jest `features/sprints` **26/26**; `tsc -p tsconfig.app.json --noEmit` sin errores. Total 115/115, 0 omitidas. `ng build` **no pudo ejecutarse**: la CLI exige Node ≥ 22.22.3 y el equipo tiene v22.20.0 (ver R1).

Archivos leídos: backend de producción (21 `.cs` de `Modules/Sprints` más la migración `InitialSprintsSchema`), `Program.cs`, `Api.csproj`, `TechWorkHub.sln`, `apply-migrations.ps1/.sh`; frontend (tres componentes `.ts`/`.html`, `sprint-api.service.ts`, modelos, `app.routes.ts`); pruebas (`CreateSprintCommandHandlerTests` y `CreateSprintTests` leídas completas; el resto inspeccionado con búsqueda de `Skip`, `Assert.True(true)`, `xit`, `fit`: 0 coincidencias en código fuente).

#### Matriz de auditoría HU-003

| Control | Resultado |
|---|---|
| Arquitectura backend (`ICarterModule`, MediatR, sin `[ApiController]`) | ✅ Tres endpoints Carter (`POST`, `GET` lista, `GET {id}`) delegan en handlers de MediatR; la regla vive en `SprintRules` + `Sprint.Create` + `CK_Sprints_Window` (ADR-005). Sin `using Microsoft.AspNetCore.Mvc`, sin AutoMapper. |
| Aislamiento de schemas | ✅ `HasDefaultSchema("sprints")`; sin `.Include()`, sin FK ni navegación a `backlog`/`application`. |
| `.RequireAuthorization()` | ✅ En los tres endpoints; `CreatedBy` sale de `ICurrentUser.UserId`, resuelto **antes** de tocar datos (FR-010); el `createdBy` del cuerpo se ignora (prueba de integración). |
| `CancellationToken` | ✅ Endpoint → `ISender.Send` → handler → `SaveChangesAsync` / `FirstOrDefaultAsync` / `ToListAsync`. |
| N+1 / `SaveChanges` en bucle | ✅ Ningún `foreach`/`for` en `src/Modules/Sprints`. Un único `SaveChangesAsync`. |
| IDOR / mass assignment | ➖ N/A: la HU solo crea y consulta; sin actualización ni borrado, y el catálogo de Sprints es global por spec (FR-013/014). `SprintResponse` no expone auditoría. |
| Frontend: `standalone`, `OnPush`, Signals | ✅ Tres componentes `standalone`; estado de lista y detalle con `toSignal`; sin `NgModule` ni `zone.js`. Ver R3 (`subscribe` en el formulario). |
| XSS | ✅ Sin `innerHTML` ni `DomSanitizer`; todo se interpola con `{{ }}`; `encodeURIComponent` en `getById`. |
| Credenciales hardcodeadas / stubs | ✅ Ninguna. Sin `TODO`, `FIXME` ni `NotImplementedException`. |
| Restricción de alcance (T054) | ✅ Cambios fuera del módulo limitados a los ficheros permitidos y a los scripts de migraciones (necesarios para desplegar el schema). |
| Pruebas QA | ✅ Aserciones sobre comportamiento real (persistencia, `CreatedBy` del claim, `CancellationToken` recibido, 400 por campo, `CK_Sprints_Window` en BD real). |

#### Hallazgos (todos no bloqueantes)

| Ref. | Capa | Estado | Detalle | Responsable |
|---|---|---|---|---|
| R1 | [CAPA:TASKS] | 🟠 Abierto | `tasks.md` T052 (`npm test && npm run build`) y T053 (escenarios 1–11 de `quickstart.md` contra API y UI en ejecución) siguen sin `[X]`. Evidencia propia de T052: Jest y `tsc` en verde; `ng build` bloqueado por la versión de Node del equipo (entorno, no código). T053 queda cubierta de forma automatizada por las 46 pruebas de integración, sin ejecución manual con la UI. | humano |
| R2 | [CAPA:CODE] | 🟡 Menor | La suite de integración `Identity` (HU-002) falla por contención de contenedores si corre en paralelo con el resto de la solución (reserva de QA); aislada pasa. Recomendado correr integración en serie. | @QA-AUTO |
| R3 | [CAPA:CODE] | 🟡 Menor | `sprint-form.component.ts:95` usa `subject.pipe(exhaustMap…, takeUntilDestroyed()).subscribe(...)`. Es un flujo de eventos (envío con `exhaustMap` contra doble clic), con limpieza automática y el mismo patrón aceptado en HU-001 (`create-backlog-item.component.ts:156`); el estado visible va en `signal`. Se acepta por precedente; la constitución no distingue flujos de eventos de estado. | @DEV-FRONT |
| R4 | [CAPA:CODE] | 🟠 Abierto | Todo el módulo `Sprints`, sus pruebas y `features/sprints` figuran como no versionados (`??`) en `git status`; los ficheros compartidos están modificados sin commit. La fusión de la rama no los llevaría si no se commitean antes. Mismo caso que R5 de HU-002. | humano / watcher |

**Criterio de capa:** nada obliga a reabrir spec ni plan; los puntos de negocio sin definir (duplicados, solapamiento, fecha pasada, roles) son decisiones explícitas de la spec (ADR-006, FR-013/014), no defectos.

### 1.A HU-002 — Pruebas de integración con Keycloak y catálogo reales

```text
╔══════════════════════════════════════════════════════════════╗
║  AI CODE REVIEW DASHBOARD — HU 002   [APROBADO CON RESERVAS]║
╠══════════════════════════════════════════════════════════════╣
║  Archivos analizados (lectura física) ........... 18         ║
║  Violaciones arquitectónicas .................... 0          ║
║  Problemas de seguridad ......................... 0 (1 menor)║
║  Fugas de rendimiento (CancellationToken) ....... 5 helpers  ║
║  Hallazgos zero-tolerance (stubs/hardcode) ...... 0          ║
║  Deuda técnica encontrada ....................... 5          ║
║  Cobertura de tests faltante (CA) ............... 0 %        ║
║  Tests tautológicos / stubs ..................... 0 de 19    ║
╚══════════════════════════════════════════════════════════════╝
```

**Evidencia propia (no del resumen de QA):** `dotnet test Identity.IntegrationTests.csproj` con Docker 28.4 activo: **19/19** correctas, 0 omitidas, 37 s (Keycloak 24.0 + PostgreSQL 16 reales). QA reporta además 62 unitarias + 31 Backlog sin fallos. Producción intacta (T027).

Archivos leídos: `Identity.IntegrationTests.csproj`; `Fixtures/` (`IdentityCollection`, `KeycloakFixture`, `PostgresFixture`, `RealApiFactory`); `Support/` (`CatalogSeeder`, `ItemPayload`, `TokenTamperer`); `ListApplicationsRealTests`, `CreateBacklogItemRealTests`, `InvalidCredentialsTests`, `ProductionConfigGuardTests`, `IdempotencyTests`; `Realm/techworkhub-test-realm.json`, `Realm/techworkhub-other-realm.json`; diff de `TechWorkHub.sln`.

#### Matriz de auditoría HU-002

| Control | Resultado |
|---|---|
| Arquitectura backend (`ICarterModule`, MediatR, schemas) | ✅ Sin código de producción nuevo; los tests ejercen el `Program` real. `RealApiFactory` solo lee `ApplicationDbContext` y `BacklogDbContext` como verificación de test, sin `.Include()` cruzado. |
| Anti-simulados (FR-012) | ✅ Sin `ConfigureTestServices`, `RemoveAll<`, handler de auth falso ni catálogo falso; lo vigila `ProductionConfigGuardTests`. |
| Audiencia y emisor de producción | ✅ `verify-token-audience`, `realm` y `resource` no se tocan. `UseEnvironment("Testing")` evita el `appsettings.Development.json` laxo (D-01 de QT cerrado). |
| Prueba anti-tautología | ✅ QA quitó el audience mapper y fallaron 5 de 6 casos de US1/US2; realm restaurado. |
| N+1 / `SaveChanges` en bucle | ✅ `CatalogSeeder`: un único `SaveChangesAsync` fuera del bucle. Ver reserva R2 (`.Add` dentro de `foreach`). |
| IDOR / mass assignment | ➖ N/A: sin endpoints ni handlers nuevos. `CreatedBy == sub` verificado contra la BD real. |
| XSS / NgModules | ➖ N/A: sin frontend. |
| Credenciales hardcodeadas | 🟡 `Qa-Pass-123!` en `KeycloakFixture.cs:28` y en ambos realms: credencial de un contenedor efímero que solo existe durante la prueba. Sin secretos reales. Ver reserva R4. |
| `CancellationToken` | 🟡 Ver reserva R1. |

#### Hallazgos (todos no bloqueantes; la regla de capa se aplica por la guía de etiquetado)

| Ref. | Capa | Estado | Detalle | Responsable |
|---|---|---|---|---|
| R1 | [CAPA:CODE] | 🟡 Reserva | Helpers `async` de soporte sin `CancellationToken`: `CatalogSeeder.cs:23` (`SaveChangesAsync()`), `RealApiFactory.cs:63` (`ToListAsync()`), `RealApiFactory.cs:71` (`CountAsync()`), `PostgresFixture.cs:37-40` (`OpenAsync`, `ExecuteNonQueryAsync`) y `KeycloakFixture.cs:86` (`GetTokenAsync` lo acepta, pero los tests no lo pasan). Leída literalmente, la política SecOps lo marca como rechazo; la constitución no dice si aplica a código de prueba y en HU-001 se aceptó el mismo patrón (`BacklogApiFactory.cs:158`, `PostgresFixture.cs:26`). Se trata como **ambigüedad de la constitución** que debe enmendarse con `/speckit-constitution`. | @QA-AUTO |
| R2 | [CAPA:CODE] | 🟡 Menor | `CatalogSeeder.cs:16-21` llama `.Add()` dentro de `foreach`. No hay ida y vuelta a la BD (el `SaveChangesAsync` es único y externo), pero la heurística pide `AddRange`. Corrección de una línea. | @QA-AUTO |
| R3 | [CAPA:TASKS] | 🟠 Abierto | `tasks.md:119` T028 sin `[X]`: no se probó el fallo explícito con el daemon de Docker detenido (solo el mensaje de timeout que nombra Keycloak/PostgreSQL). `tasks.md:122` T030 sin `[X]`: citar en el PR la excepción `ssl-required=none` (spike T008 confirmado en `RealApiFactory.cs:17-21`). | @QA-AUTO / humano |
| R4 | [CAPA:PLAN] | 🟡 Menor | `Qa-Pass-123!` repetida en tres lugares (fixture y dos realms). Mantener documentado que es solo de prueba; no reutilizar en ningún entorno real. | @QA-AUTO |
| R5 | [CAPA:CODE] | 🟠 Abierto | Los 16 archivos de `app/backend/tests/Integration/Identity/` siguen **sin commitear** (`git status`: `?? Integration/Identity/`) y `TechWorkHub.sln` está modificado. Una fusión de la rama no los llevaría. Además, `bin/` y `obj/` aparecen versionados y modificados, lo que ensucia el árbol. | humano |

**Criterio de capa:** nada obliga a reabrir spec o plan; R3 es una tarea sin cerrar y R1/R2/R4 viven en código de prueba.

#### Decisión humana (04-10-2026) y cierre

- **R1 y R2: aceptadas como NO bloqueantes.** No se devuelven a QA ni se abre otra iteración. Quedan registradas como **deuda técnica** para atender cuando se toque la suite Identity:

| Deuda | Ubicación | Corrección propuesta |
|---|---|---|
| Helpers de prueba sin `CancellationToken` | `CatalogSeeder.cs:23`, `RealApiFactory.cs:63` y `:71`, `PostgresFixture.cs:37-40` | Añadir `CancellationToken cancellationToken = default` a `SeedAsync`, `StoredItemsAsync`, `ApplicationCountAsync` y `CreateDatabaseAsync`, y propagarlo a `SaveChangesAsync`, `ToListAsync`, `CountAsync`, `OpenAsync` y `ExecuteNonQueryAsync`. |
| `.Add()` dentro de `foreach` | `CatalogSeeder.cs:16-21` | Construir la lista con `names.Select(n => RegisteredApplication.Create(Guid.NewGuid(), n)).ToList()` y llamar `db.Applications.AddRange(entities)` antes del único `SaveChangesAsync`. |

- **Constitución enmendada (cambio mínimo):** nueva subsección «Propagación de `CancellationToken`» en `.specify/memory/constitution.md`: obligatorio en código de producción; recomendado, y no bloqueante, en código de prueba y helpers de soporte. Con ella queda resuelta la ambigüedad de R1.
- **T030 citada y marcada `[X]`:** excepción acotada `Keycloak:ssl-required=none`. El spike T008 verificó que, con `external`, el host lanza «The MetadataAddress or Authority must use HTTPS» ante el Keycloak HTTP del contenedor (`RealApiFactory.cs:17-21`). Se limita al host de pruebas: `verify-token-audience`, `realm` y `resource` no se tocan, lo vigila `ProductionConfigGuardTests`, y `app/backend/src` queda sin cambios. Revisión de QA-Tech: pendiente en el PR. Se repite en el mensaje del commit de cierre.
- **T028 DIFERIDA:** sigue abierta, como ejecución manual (igual que T017 de HU-001): falta probar el fallo explícito con el daemon de Docker detenido.
- **R5:** resuelto con commits separados (suite Identity; `bin/` y `obj/` fuera del índice, que ya figuraban en `.gitignore`; documentos de HU-002; enmienda de la constitución; framework).

### 1.B HU-001 — histórico

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

**Cierre (decisión humana, 03-10-2026):** reservas aceptadas. Commits de HU-001: 2cdddce, 9ece1e1, d33e442, d547d45; chores de framework: ac94a7d, f1ef452, 0da364f, bfdca01, 3ada20e. Tareas T018, T025, T032 y T043 en `[X]` con evidencia de `qa-report.md`. T017 diferida (manual). T037 queda **abierta**: `qa-report.md` no menciona de forma explícita la prueba con token cancelado y T037 exige re-marcar T017. Riesgo residual (Keycloak y catálogo reales) trasladado a la historia 002 del ledger.

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

### 2.0 HU-003 — Flujo real implementado (solo lo alterado)

```mermaid
flowchart LR
    subgraph FE["Frontend (Angular standalone, OnPush)"]
        RT["app.routes.ts /sprints ✅ authGuard + MessageService"]
        LST["SprintListComponent (toSignal)"]
        FRM["SprintFormComponent (exhaustMap + takeUntilDestroyed)"]
        DET["SprintDetailComponent (toSignal)"]
        SVC["SprintApiService"]
        RT --> LST & FRM & DET
        LST & FRM & DET --> SVC
    end
    SVC -->|"POST/GET /api/sprints, GET /api/sprints/{id}"| EP["CreateSprint / ListSprints / GetSprintById Endpoints (ICarterModule) ✅ RequireAuthorization"]
    EP -->|"ISender.Send(cmd, cancellationToken) ✅"| MED["MediatR + ValidationBehavior"]
    MED --> VAL["CreateSprintValidator → SprintRules"]
    MED --> HD["Handlers (CreateSprint, ListSprints, GetSprintById)"]
    HD --> DOM["Sprint.Create → SprintRules (ADR-005)"]
    HD -->|"ISprintsDbContext + CancellationToken"| DB[("PostgreSQL schema sprints, CK_Sprints_Window")]
    HD -. "ICurrentUser.UserId antes de datos" .-> AUTH["Shared.Identity"]
```

**Desviaciones señaladas:** ninguna de arquitectura; no hay salto de capa. Notas: el `subscribe` del formulario (R3, flujo de eventos aceptado por precedente) y la regla de la ventana de 2 semanas centralizada en `SprintRules` y repetida en la restricción de BD como defensa en profundidad (intencional, ADR-005).

### 2.A HU-002 — Flujo real implementado (solo lo alterado)

```mermaid
flowchart LR
    T["Tests xUnit (Identity.IntegrationTests)"] -->|"password grant"| KC[("Keycloak 24.0 real, realm techworkhub")]
    T --> F["RealApiFactory (Program real, UseEnvironment Testing)"]
    F -->|"HTTP + Bearer real"| EP["ListApplicationsEndpoint / CreateBacklogItemEndpoint ✅ RequireAuthorization"]
    EP --> MED["MediatR + Handlers de HU-001 (sin cambios)"]
    MED --> APP["ApplicationModuleApi real"]
    MED --> BLG["BacklogDbContext"]
    APP --> PGA[("PostgreSQL 16, schema application")]
    BLG --> PGB[("PostgreSQL 16, schema backlog")]
    F -. "UseSetting: connection, migrate, auth-server-url, ssl-required=none ⚠️ excepción acotada (T030)" .-> EP
    T -. "verificación de test: lectura con AsNoTracking" .-> PGA
    T -. "verificación de test: lectura con AsNoTracking" .-> PGB

    classDef warn fill:#ffe9c2,stroke:#b36b00,color:#5a3600;
    class F warn;
```

**Desviaciones señaladas:** ninguna de arquitectura. No hay salto de capa: la prueba entra por HTTP y recorre Endpoint → MediatR → módulo → BD sin sustituir servicios. Única relajación: `Keycloak:ssl-required=none` (Keycloak de contenedor sin HTTPS), documentada en `RealApiFactory.cs:17-21` y pendiente de citar en el PR (T030).

### 2.B HU-001 — Flujo real tras la 5.ª iteración (histórico: #16..#19)

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

### 3.0 HU-003 — Impacto de los cambios y cobertura

```mermaid
flowchart TD
    subgraph CH["Alterado en HU-003"]
        E1["CreateSprintEndpoint"]
        E2["ListSprintsEndpoint"]
        E3["GetSprintByIdEndpoint"]
        H1["CreateSprintCommandHandler"]
        H2["ListSprintsQueryHandler"]
        H3["GetSprintByIdQueryHandler"]
        V1["CreateSprintValidator"]
        D1["Sprint + SprintRules"]
        P1["SprintsDbContext + SprintConfiguration + migración InitialSprintsSchema"]
        U1["SprintList / SprintForm / SprintDetail components"]
        U2["SprintApiService"]
        SH["Program.cs, Api.csproj, .sln, app.routes.ts, apply-migrations.*"]
    end
    E1 --> H1
    E2 --> H2
    E3 --> H3
    H1 --> V1 & D1
    H1 & H2 & H3 --> P1
    U1 --> U2 --> E1 & E2 & E3

    T1["Unit: CreateSprintCommandHandlerTests, CreateSprintValidatorTests, SprintDomainTests"]
    T2["Integración PostgreSQL real: CreateSprintTests, CreateSprintValidationTests, ListSprintsTests, GetSprintByIdTests"]
    T3["MigrationsPostgresTests (CK_Sprints_Window)"]
    T4["Unit: ListSprintsQueryHandlerTests, GetSprintByIdQueryHandlerTests"]
    T5["Jest: list, form, detail, service (26)"]
    T1 -.-> H1 & V1 & D1
    T2 -.-> E1 & E2 & E3
    T3 -.-> P1
    T4 -.-> H2 & H3
    T5 -.-> U1 & U2

    classDef cov fill:#d8f5d8,stroke:#2a7a2a,color:#103d10;
    classDef warn fill:#ffe9c2,stroke:#b36b00,color:#5a3600;
    class E1,E2,E3,H1,H2,H3,V1,D1,P1,U1,U2 cov;
    class SH warn;
```

Componentes alterados con cobertura: 11 de 11; los ficheros compartidos (en ámbar) se cubren de forma indirecta con la integración sobre el `Program` real. Sin prueba de regla: los puntos de negocio sin definir en la HU. Resto de la aplicación: *Sin impacto en este PR/HU*.

### 3.A HU-002 — Impacto de los cambios y cobertura

```mermaid
flowchart TD
    subgraph CH["Alterado en HU-002 (solo app/backend/tests y .sln)"]
        FX["Fixtures: Keycloak, Postgres, RealApiFactory, IdentityCollection"]
        SP["Support: CatalogSeeder, TokenTamperer, ItemPayload"]
        RM["Realm: techworkhub y techworkhub-other"]
        SLN["TechWorkHub.sln"]
    end
    subgraph SUT["Producción bajo prueba (sin cambios)"]
        LA["GET /api/applications"]
        CB["POST /api/backlog/items"]
        AU["Autenticación JWT Keycloak (audiencia, emisor, firma, exp)"]
    end
    subgraph TS["Pruebas (19, 19 en verde)"]
        T1["ListApplicationsRealTests ✅ 3"]
        T2["CreateBacklogItemRealTests ✅ 3"]
        T3["InvalidCredentialsTests ✅ 10 (5 credenciales x 2 rutas)"]
        T4["ProductionConfigGuardTests ✅ 2"]
        T5["IdempotencyTests ✅ 1"]
    end
    FX --> T1 & T2 & T3 & T4 & T5
    SP --> T1 & T2 & T3
    RM --> FX
    T1 --> LA
    T2 --> CB
    T3 --> LA & CB & AU
    T4 -. "audience/realm/resource y ausencia de simulados" .-> AU
    T5 --> CB
    NOCOV["T028 fallo sin Docker ⚠️ sin prueba automática"] -. "no cubierto" .-> FX

    classDef covered fill:#dfd,stroke:#080;
    classDef gap fill:#ffe9c2,stroke:#b36b00;
    class T1,T2,T3,T4,T5,LA,CB,AU covered;
    class NOCOV gap;
```

Componentes de producción alterados: **0**. Cobertura de CA: US1 3/3, US3 6/6, US2 3/3. Único hueco: el fallo explícito con el daemon de Docker detenido (T028), verificado solo por el texto del mensaje.

### 3.B HU-001 — histórico

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

### 4.0 HU-003

```mermaid
flowchart LR
    SPR["Sprints (módulo)"] -->|"ProjectReference"| SHR["Shared (BuildingBlocks)"]
    API["Bootstrapper/Api"] -->|"ProjectReference + AddSprintsModule"| SPR
    API --> BLG["Backlog"]
    API --> APP["Application"]
    SPR -. "sin referencia ✅" .-> BLG
    SPR -. "sin referencia ✅" .-> APP
    SPR --> PG[("PostgreSQL schema sprints")]
    UT["Sprints.UnitTests"] --> SPR
    IT["Sprints.IntegrationTests"] --> SPR
    IT --> API
    FE["features/sprints"] -->|"HTTP /api/sprints"| API
    FE --> AUTHC["core/auth (solo AuthService.reauthenticate)"]
```

**Deuda técnica temprana:** (1) `PostgresFixture` y `SprintsApiFactory` duplican los de Backlog en lugar de compartirse; (2) el patrón `subscribe` del formulario se repite respecto a HU-001; (3) sin paginación ni pruebas de carga más allá de 100 registros (decisión explícita ADR-006); (4) `CreatedBy` es `varchar(255)` (T011 decía `varchar`), coherente con Backlog. Sin ciclos entre módulos.

### 4.A HU-002

```mermaid
flowchart LR
    IT["Identity.IntegrationTests"] -->|"ProjectReference"| API["Bootstrapper/Api (Program)"]
    IT -->|"Testcontainers 4.1.0"| DK[("Docker: keycloak:24.0 y postgres:16-alpine")]
    IT -->|"lee DbContext de test"| APPM["Application (ApplicationDbContext)"]
    IT -->|"lee DbContext de test"| BLGM["Backlog (BacklogDbContext)"]
    IT -. "sin referencia" .-> BIT["Backlog.IntegrationTests ✅ aislado (ADR-003)"]
    API --> APPM
    API --> BLGM
    BLGM -. "contrato IApplicationModuleApi" .-> APPM
```

**Deuda técnica temprana:** (1) el proyecto de pruebas referencia dos módulos de dominio para sembrar y leer, aceptable en test y sin tocar `src`; (2) `bin/` y `obj/` versionados; (3) credencial de prueba triplicada; (4) dependencia de Docker sin prueba automática del fallo sin daemon (T028); (5) la constitución no fija si el `CancellationToken` aplica a helpers de prueba.

### 4.B HU-001 — histórico

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
[APROBADO CON RESERVAS] - HU-003, 1.ª iteración (04-10-2026):
- Lectura física completada: 40 archivos auditados; ejecución propia Unit 43/43, Integración 46/46 (PostgreSQL), Jest 26/26, tsc limpio.
- Lex Superior y VSA: ICarterModule + MediatR, schema sprints aislado, regla de ventana única (ADR-005), sin salto de capa.
- SecOps y rendimiento: CancellationToken propagado, cero N+1, sin IDOR (solo crear y consultar), sin XSS, RequireAuthorization en los tres endpoints.
- Pruebas QA: no tautológicas; cobertura lógica validada.
- Reservas no bloqueantes: R1 (T052 build bloqueado por Node del equipo y T053 sin ejecución manual), R2 (Identity en paralelo), R3 (subscribe del formulario, precedente HU-001), R4 (código sin commitear).
```

```text
[APROBADO CON RESERVAS] - HU-002, 1.ª iteración (03-10-2026):
- Lectura física completada: 18 archivos auditados; ejecución propia Identity 19/19 contra Keycloak y PostgreSQL reales.
- Lex Superior y VSA: sin código de producción tocado; sin simulados; audiencia y emisor de producción intactos.
- SecOps y rendimiento: sin N+1 real, sin IDOR (sin handlers nuevos), sin XSS. Reservas R1 (CancellationToken en helpers de prueba, constitución ambigua) y R2 (.Add en foreach).
- Pruebas QA: no tautológicas; el audience mapper quitado rompe 5 de 6 casos.
- Pendiente: T028, T030, commit de la suite (R5). Cierre de rama pendiente de decisión humana.
```

```text
[APROBADO CON RESERVAS] - HU-001, 6.ª iteración (03-10-2026, 19:39):
- Lectura física completada: 30 archivos auditados; ejecución propia 62/62 + 31/31 (PostgreSQL) + Jest 31/31.
- #16..#19 cerrados. CancellationToken propagado, cero N+1, cero IDOR (solo creación), sin XSS.
- Reservas: tareas T018/T025/T032/T043 sin marcar, producción sin commitear, riesgo residual Keycloak/catálogo real.
- Cierre de rama pendiente de decisión humana (ver tracker).
(Histórico: 5.ª iteración, 19:13, [RECHAZADO] por #16..#19.)
```
