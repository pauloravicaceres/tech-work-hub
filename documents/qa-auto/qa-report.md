# QA Report — Calidad y Trazabilidad Viva

> Última actualización: 05-10-2026 · Iteración: **HU-015 Relación entre Personas, Roles y Elementos de Trabajo** · Agente: QA-AUTO
> Áreas no afectadas por esta iteración: _Sin cambios en esta iteración_ (HU-012, HU-004, HU-003, HU-002 y HU-001 se conservan sin modificar).

---

# ▶ Iteración actual: HU-015 (`specs/015-HU_relacion_personas_roles_elementos`)

Barrera Fork-Join satisfecha (DEV-BACK y DEV-FRONT finalizaron). QA-AUTO auditó las suites entregadas, sin `Skip`/`xit`/`describe.skip`, y completó el hueco T019/T020 (Backlog unit). No se modificó código de producción.

## 1. AI QA Review Dashboard (HU-015)

```
┌──────────────── HU-015 · DICTAMEN: [APROBADO] ────────────────────────────────────────┐
│ Capa                                   Ejecutados  Pasados  Fallados  Bloqueados     │
│ Backend · Unit Teams                       57         57       0         0           │
│ Backend · Unit Backlog (+8 QA-AUTO)        70         70       0         0           │
│ Backend · Integration Teams (PG)           70         70       0         0           │
│ Backend · Integration Backlog (PG)         34         34       0         0           │
│ Frontend · Jest features/teams             58         58       0         0           │
│ Regresión · Sprints U/I + Identity I   86+89+19      194       0         0           │
│ Regresión · Jest completo (16 suites)     141        141       0         0           │
│ Cobertura funcional de CA: US1 2/2 · US2 2/2 · US3 1/1 · US4 3/3 · US5 2/2           │
│ Nivel de riesgo: BAJO                                                                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Comandos: `dotnet test tests/{Unit,Integration}/{Teams,Backlog}` (Testcontainers PostgreSQL, `xunit.parallelizeAssembly=false`), `npx jest --ci --runInBand --forceExit --no-coverage`.

## 2. Requirements Traceability (HU-015)

```mermaid
flowchart LR
  HU15[HU-015 Personas, Roles y Elementos]
  HU15 --> US1[US1 Asignar 201/200 idempotente + auditoría] --> TC1[AssignMemberToItemCommandHandlerTests + ItemAssignmentDomainTests + AssignMemberToItemTests + AssignMemberToItemConcurrencyTests + ItemAssignmentsMigrationTests + BacklogItemLookupTests + team-api.service.spec + assign-assignee-dialog.spec]
  HU15 --> US2[US2 Consultar personas de un elemento] --> TC2[ListItemAssigneesQueryHandlerTests + ListItemAssigneesTests + item-assignees-view.spec]
  HU15 --> US3[US3 Consultar elementos de un miembro] --> TC3[ListMemberItemsQueryHandlerTests + ListMemberItemsTests + member-items-view.spec]
  HU15 --> US4[US4 Rechazo 400/404] --> TC4[AssignMemberToItemValidatorTests + AssignMemberToItemValidationTests]
  HU15 --> US5[US5 401/500] --> TC5[ItemAssignmentsAuthTests + AssignMemberToItemFailureTests]
  HU15 --> FR13[FR-013 sin regresión] --> TC6[ItemAssignmentsNoRegressionTests + suites HU-001/003/004/012]
  HU15 --> FR14[FR-014 aislamiento schema] --> TC7[ItemAssignmentsMigrationTests + BacklogItemLookupTests]
  HU15 --> LST[GET /api/backlog-items] --> TC8[ListBacklogItemsQueryHandlerTests + ListBacklogItemsTests]
```

## 3. Failure Impact Diagram (HU-015)

0 fallos críticos detectados. (Los logs de error en `AssignMemberToItemFailureTests` son el fallo de persistencia simulado esperado y el test pasa.)

## 4. State Transition / User Journey (HU-015)

```mermaid
stateDiagram-v2
  [*] --> SinResponsables
  SinResponsables --> ConResponsable: POST assignees 201
  ConResponsable --> ConResponsable: POST mismo par 200 (idempotente)
  ConResponsable --> VariosResponsables: POST otro miembro 201
  SinResponsables --> SinResponsables: 400 / 404 / 401 / 500 (nada persistido)
  ConResponsable --> ConResponsable: 400 / 404 / 401 / 500 (sin cambios)
  VariosResponsables --> VariosResponsables: GET assignees / GET member items 200 (solo lectura)
```

## 5. Test Coverage & Hotspots (HU-015)

| Módulo | Pruebas | Cobertura de CA | Hotspot de defectos |
|---|---|---|---|
| Teams · ItemAssignments (API) | 127 unit+integración | 100 % | Ninguno |
| Backlog · Lookup / ListBacklogItems | 8 unit (QA-AUTO) + integración | 100 % | Ninguno |
| Frontend · features/teams | 58 | 100 % | Ninguno |

## Pruebas propias (QA-AUTO)

`tests/Unit/Backlog/BacklogItemLookupTests.cs` (5) y `ListBacklogItemsQueryHandlerTests.cs` (3): cubren T019/T020, ausentes en la entrega. Adversariales: Guid vacío, ids inexistentes, colección vacía, desempate por `Id`, contrato sin estimaciones/estado/Sprint. Se añadió `Microsoft.EntityFrameworkCore.InMemory` a `Backlog.UnitTests.csproj` (solo pruebas).

## Defectos (etiquetado por capa)

Ninguno.

## Reservas (no bloqueantes)

- `spec.md` aún dice "no documentado" para la asignación duplicada (Edge Case y FR-015); es vinculante el 200 idempotente (ADR-004). Pendiente del analista de negocio.
- T063 (quickstart manual) y `npm run build` no ejecutados por QA-AUTO.

---

# ▶ Iteración previa: HU-012 (`specs/012-HU_miembros_equipo_y_roles_tecnicos`)

Barrera Fork-Join satisfecha (DEV-BACK y DEV-FRONT finalizaron). QA-AUTO auditó las suites entregadas (`tests/Unit/Teams`, `tests/Integration/Teams` con Testcontainers PostgreSQL y specs Jest de `features/teams`), sin `Skip`/`xit`. No se modificó código de producción.

## 1. AI QA Review Dashboard (HU-012)

```
┌──────────────── HU-012 · DICTAMEN: [APROBADO CON RESERVA] ────────────────────────────┐
│ Capa                              Ejecutados  Pasados  Fallados  Bloqueados          │
│ Backend · Unit Teams                  27         27       0         0                │
│ Backend · Integration Teams (PG)      38         38       0         0                │
│ Frontend · Jest features/teams        22          0       0        22  (Node ausente) │
│ Bloqueado: Jest no ejecutable, node/npx no existen en el PATH de este entorno.        │
│ Cobertura funcional de CA: US1 3/3 · US2 2/2 · US3 1/1 · US4 2/2 · US5 2/2 (backend) │
│ Nivel de riesgo: BAJO backend · MEDIO frontend (specs auditadas, no ejecutadas)       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Comandos: `dotnet test tests/Unit/Teams/Teams.UnitTests.csproj`, `dotnet test tests/Integration/Teams/Teams.IntegrationTests.csproj`. Jest (`npx jest --ci --runInBand --forceExit --no-coverage src/app/features/teams`) no pudo ejecutarse.

## 2. Requirements Traceability (HU-012)

```mermaid
flowchart LR
  HU12[HU-012 Miembros y Roles]
  HU12 --> US1[US1 Registrar 201 + auditoría] --> TC1[RegisterTeamMemberTests + CommandHandlerTests + TeamMemberDomainTests + team-api.service.spec]
  HU12 --> US2[US2 Listar miembros 200/vacío] --> TC2[ListTeamMembersTests + ListTeamMembersQueryHandlerTests + team-page.spec]
  HU12 --> US3[US3 Catálogo de roles] --> TC3[ListTechnicalRolesTests + QueryHandlerTests + TeamsMigrationTests semilla]
  HU12 --> US4[US4 Rechazo 400] --> TC4[ValidatorTests + RegisterTeamMemberValidationTests + register-member-dialog.spec]
  HU12 --> US5[US5 401/500] --> TC5[TeamsAuthTests + RegisterTeamMemberFailureTests]
  HU12 --> FR14[FR-014 sin regresión] --> TC6[RegisterTeamMemberNoRegressionTests]
  HU12 --> FR16[FR-016 aislamiento schema] --> TC7[TeamsMigrationTests]
```

## 3. Failure Impact Diagram (HU-012)

0 fallos críticos detectados. (Los logs de error en `Registrar_ConFalloDePersistencia...` son el fallo simulado esperado y el test pasa.)

## 4. State Transition / User Journey (HU-012)

```mermaid
stateDiagram-v2
  [*] --> SinMiembros
  SinMiembros --> ConMiembros: POST /api/team-members 201
  ConMiembros --> ConMiembros: POST 201 (homónimos permitidos)
  SinMiembros --> SinMiembros: 400 / 401 / 500 (nada persistido)
  ConMiembros --> ConMiembros: 400 / 401 / 500 (nada parcial)
```

## 5. Test Coverage & Hotspots (HU-012)

| Módulo | Pruebas | Estado |
|---|---|---|
| Teams · Validador y dominio | Unit (27) | Verde |
| Teams · API + PostgreSQL + migración | Integration (38) | Verde |
| Teams · Frontend | Jest (22 specs) | No ejecutado |

Defect Hotspots: ninguno.

## Defectos (etiquetado por capa)

Ninguno.

## Reservas (no bloqueantes)

- R-01 Jest de `features/teams` sin ejecutar: Node.js no instalado en el entorno de QA; re-ejecutar el comando indicado donde exista Node 22.22.3 o superior.
- R-02 Puntos abiertos 1 a 8 de la HU (unicidad, longitud del nombre, ciclo de vida) sin comportamiento definido: probados solo como "no se restringe" (homónimos y nombre muy largo se aceptan).

---

# Iteración anterior: HU-004 (`specs/004-HU_asignacion_elementos_sprint`)

Barrera Fork-Join satisfecha (DEV-BACK y DEV-FRONT finalizaron). QA-AUTO auditó las suites entregadas (`tests/Unit/Sprints`, `tests/Integration/Sprints`, specs Jest de `features/sprints`) y añadió pruebas adversariales propias. Sin `Skip`/`xit`. No se modificó código de producción.

## 1. AI QA Review Dashboard (HU-004)

```
┌─────────────── HU-004 · DICTAMEN: [APROBADO] retrabajo 1/2 ───────────────────────────────────────────┐
│ Capa                          Ejecutados  Pasados  Fallados  Bloqueados                  │
│ Backend · Unit Sprints (total)      86        86       0         0   (HU-004 ≈ 43)      │
│ Backend · Integration Sprints       89        89       0         0   (incl. 2 QA-AUTO ahora verdes)│
│ Frontend · Jest (suite completa)    83        83       0         0                       │
│ Regresión · Unit Backlog            62        62       0         0                       │
│ Regresión · Int. Backlog            31        31       0         0                       │
│ Regresión · Int. Identity           19         0      19         0   (Keycloak/Docker)   │
│ Bloqueado: T051 `npm run build` (Node v22.20.0 < 22.22.3 exigido por Angular CLI)        │
│ Bloqueado: T052 recorrido de quickstart contra API+SPA en ejecución                      │
│ Cobertura funcional de CA: US1 3/3 · US2 3/3 · US3 3/3 · US4 3/3 · 409 (regla A) cubierto │
│ Nivel de riesgo: BAJO (DEF-01 y DEF-02 corregidos y revalidados)                │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Comandos: `dotnet test TechWorkHub.sln`, `npx jest --ci --runInBand --forceExit --no-coverage`. Identity falla de forma idéntica sin relación con HU-004 (la fixture no arranca Keycloak en este entorno).

## 2. Requirements Traceability (HU-004)

```mermaid
flowchart LR
  HU4[HU-004 Asignación a Sprint]
  HU4 --> US1[US1 Asignar 201] --> TC1[AssignItemToSprintTests + CommandHandlerTests + sprint-api.service.spec]
  HU4 --> US2[US2 Consultar 200/404] --> TC2[ListSprintItemsTests + QueryHandlerTests + sprint-assigned-items.spec]
  HU4 --> US3[US3 400/404] --> TC3[ValidatorTests + ValidationTests]
  HU4 --> US4[US4 401/500] --> TC4[SprintItemsAuthTests + FailureTests]
  HU4 --> R409[Regla humana A: 409] --> TC5[AssignItemToSprintTests + SprintItemsMigrationTests índice único]
  US2 --> TC6[SprintItemsEstimationFidelityTests QA-AUTO]
```

## 3. Failure Impact Diagram (HU-004)

```mermaid
flowchart LR
  F1[FAIL GetSummariesAsync_ConPuntosDecimales: 2.5 → 3] --> C1[BacklogModuleApi.ToWholePoints]
  F2[FAIL GetSummariesAsync_ConQaNulo: null → 0] --> C1
  C1 --> C2[BacklogItemSummary int / SprintItemResponse int]
  C2 --> B1[GET /api/sprints/id/items]
  B1 --> N1[Vista Elementos asignados: puntos falsos, guion de QA técnico se muestra 0]
```

## 4. State Transition / User Journey (HU-004)

```mermaid
stateDiagram-v2
  [*] --> SinAsignar
  SinAsignar --> Asignado: POST 201
  SinAsignar --> SinAsignar: 400 / 404 / 401 / 500 sin persistir
  Asignado --> Asignado: POST repetido 409
  Asignado --> Consultado: GET 200
  Consultado --> Consultado: puntos decimales/nulos distorsionados (DEF-01)
```

## 5. Test Coverage & Hotspots (HU-004)

```mermaid
flowchart LR
  A[Sprints.SprintItems: cobertura alta de CA, 85/87] --> H1[HOTSPOT Backlog.BacklogModuleApi: 2 defectos]
  A --> OK1[Handler, validador, auth, 409, migración: sin fallos]
```

## Defectos (etiquetado por capa)
> **Retrabajo 1/2:** DEF-01 [CAPA:TASKS] corregido (decimal anulable en contrato, respuesta y modelo TS; `SprintItemsEstimationFidelityTests` 2/2 verdes). DEF-02 [CAPA:SPEC] corregido (spec.md con FR-017 y escenarios 409). Revalidación: Unit Sprints 86/86, Int. Sprints 89/89, Backlog 93/93, Jest 83/83. Persisten bloqueos de entorno T051/T052 e Identity (Keycloak).


- **DEF-01 [CAPA:TASKS]** `BacklogItemSummary`/`SprintItemResponse`/`SprintItem` (TS) usan `int`; el Tech Design validado (W-01, prevalece) exige `decimal?`. `BacklogModuleApi.ToWholePoints` redondea 2.5→3 y convierte QA nulo en 0. Evidencia: `SprintItemsEstimationFidelityTests` (2 fallos). Además `BacklogModuleApiTests.GetSummariesAsync_ConPuntosDecimales_DebeRedondearAlEnteroMasCercano` enshrina el comportamiento incorrecto. T005/T036/T041 se marcaron `[X]` contra una advertencia vinculante.
- **DEF-02 [CAPA:SPEC]** `spec.md` conserva FR-015 y el edge case "no documentado" para elemento ya asignado, contradiciendo la decisión humana A y el 409 implementado y probado. Sin escenario Gherkin de 409 en la spec.

## Reservas (no bloqueantes)

- R1: `npm run build` (T051) y quickstart (T052) no verificables en este entorno.
- R2: el GET omite ids ausentes en Backlog (riesgo informado por el API Architect), sin prueba de integración de ese caso end-to-end.

---

# Iteración anterior: HU-003 (`specs/003-HU_gestion_sprint_dos_semanas`)

Barrera Fork-Join satisfecha (DEV-BACK y DEV-FRONT finalizaron). QA-AUTO auditó adversarialmente las suites entregadas (`tests/Unit/Sprints`, `tests/Integration/Sprints`, specs Jest de `features/sprints`): AAA, nomenclatura BDD, sin `Skip`/`xit` ni mocks tautológicos. Las ejecutó con PostgreSQL real (Testcontainers) y `WebApplicationFactory<Program>`. No se modificó código de producción.

## 1. AI QA Review Dashboard (HU-003)

```
┌─────────────── HU-003 · DICTAMEN: [APROBADO] ────────────────────────────────────────────┐
│ Capa                          Escritos  Ejecutados  Pasados  Fallados  Bloqueados        │
│ Backend · Unit Sprints            43         43        43        0         0             │
│ Backend · Integration Sprints     46         46        46        0         0             │
│ Frontend · Jest features/sprints  26         26        26        0         0             │
│ Total HU-003                     115        115       115        0         0             │
│ Regresión · Unit Backlog          62         62        62        0         0             │
│ Regresión · Int. Backlog          31         31        31        0         0             │
│ Regresión · Int. Identity         19         19        19        0         0  (aislada)  │
│ Cobertura funcional de CA: US1 3/3 · US2 3/3 · US3 3/3 · US4 3/3 · FR-001..016           │
│ Nivel de riesgo: BAJO (ver reserva R1 sobre ejecución paralela de la solución)           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Comandos: `dotnet test tests/Unit/Sprints/Sprints.UnitTests.csproj` (43/43), `dotnet test tests/Integration/Sprints/Sprints.IntegrationTests.csproj` (46/46, 39 s), `npx jest --ci --runInBand --forceExit --no-coverage src/app/features/sprints` (26/26).

## 2. Requirements Traceability (HU-003)

```mermaid
flowchart LR
  HU3[HU-003 Sprint de 2 semanas]
  HU3 --> US1[US1 Crear con ventana válida]
  HU3 --> US2[US2 Rechazo de datos inválidos]
  HU3 --> US3[US3 Listado]
  HU3 --> US4[US4 Detalle]

  US1 --> A1[SC1.1 201 + 4 datos + CreatedBy=sub]
  US1 --> A2[SC1.2 backlog intacto]
  US1 --> A3[SC1.3 401 sin persistir]
  US2 --> B1[SC2.1 ventana 7/13/15/21 → 400]
  US2 --> B2[SC2.2 fin <= inicio → 400]
  US2 --> B3[SC2.3 campos ausentes o malformados → 400]
  US3 --> C1[SC3.1 200 exacto]
  US3 --> C2[SC3.2 sin mutación]
  US3 --> C3[SC3.3 401]
  US4 --> D1[SC4.1 200 detalle]
  US4 --> D2[SC4.2 404]
  US4 --> D3[SC4.3 401]

  A1 --> T1[CreateSprint_ConVentanaValida_DebeResponder201 ✅]
  A1 --> T2[CreateSprint_ConDatosValidos_DebePersistirConAuditoria ✅]
  A2 --> T2
  A3 --> T3[CreateSprint_SinTokenOConTokenInvalido_DebeResponder401 ✅]
  B1 --> T4[ConVentanaDistintaDe14Dias: endpoint + validador + dominio + CHECK BD ✅]
  B2 --> T5[CreateSprint_ConFinIgualOAnteriorAlInicio_400 ✅]
  B3 --> T6[ConFechaAusenteOMalformada / ConCuerpoVacio ✅]
  C1 --> T7[ListSprints_ConSprintsSembrados_Exactamente ✅]
  C2 --> T8[ListSprints_AlConsultar_NoDebeModificarLosDatos ✅]
  C3 --> T9[ListSprints_SinCredenciales_401 ✅]
  D1 --> T10[GetSprintById_ConIdExistente_200 ✅]
  D2 --> T11[GetSprintById_ConIdInexistente_404 ✅]
  D3 --> T12[GetSprintById_SinCredenciales_401 ✅]
  HU3 --> T13[FR-011 CreateSprint_ConFalloDePersistencia_500 ✅]
  HU3 --> T14[Frontend: form, list, detail, api service · 26 specs ✅]
```

## 3. Failure Impact Diagram (HU-003)

0 fallos críticos detectados. Ningún defecto atribuible a HU-003.

## 4. State Transition / User Journey (HU-003)

```mermaid
stateDiagram-v2
  [*] --> Formulario
  Formulario --> Validando: enviar
  Validando --> Formulario: 400 mensaje por campo, valores conservados
  Validando --> SesionExpirada: 401
  Validando --> ErrorGenerico: 500 reintentar sin trazas
  Validando --> Listado: 201 toast de éxito
  Listado --> Detalle: seleccionar sprint
  Detalle --> NoExiste: 404
```

Todas las transiciones tienen prueba en verde (specs Jest del formulario, listado y detalle).

## 5. Test Coverage & Hotspots (HU-003)

```mermaid
flowchart LR
  M1[Sprints Domain y Validator · reglas FR-003/004/005 · alta]
  M2[Sprints Handlers y Endpoints · 200/201/400/401/404/500 · alta]
  M3[Persistencia · CHECK ventana + migración idempotente · alta]
  M4[Frontend sprints · 4 specs · alta]
  M5[Sin definir en HU: duplicados, solapamiento, fecha pasada · riesgo informativo]
```

Pruebas adversariales destacadas: ventana 7/13/15/21 en tres capas, `CreatedBy` en el cuerpo ignorado a favor del claim, token sin claim de identidad → 401, 100 vs 101 caracteres, handler con comando que evade el validador, fallo de `SaveChanges` → 500 sin Sprint parcial, claves PascalCase en 400 del frontend.

## Reservas (no bloqueantes)

- **R1:** En `dotnet test TechWorkHub.sln` en paralelo, la suite HU-002 `Integration.Identity` falló al inicializar fixtures (fallos de ~1 ms), pero aislada pasa 19/19. Los contenedores Keycloak/PostgreSQL de varios proyectos compiten por recursos: problema de entorno, no de HU-003. Recomendado ejecutar las suites de integración en serie en CI.
- **R2:** Los puntos de negocio sin definir (duplicados, solapamiento, fecha pasada, roles) solo quedan fijados como comportamiento actual (`CreateSprint_ConIdentificacionRepetida_DebeCrearAmbosSprints`).
- **R3:** Sin E2E de navegador (fuera del alcance de la HU).

---

# Iteración anterior: HU-002 (`specs/002-pruebas-integracion-keycloak-catalogo`)

La HU entrega una suite (`app/backend/tests/Integration/Identity`, 19 casos). QA-AUTO la auditó de forma adversarial, la ejecutó contra Keycloak 24.0 y PostgreSQL 16 reales (Testcontainers, un contenedor por suite, BD nueva por prueba) y verificó que puede fallar. No se escribió ni modificó código de producción (`git diff main -- app/backend/src` sin cambios fuente).

## 1. AI QA Review Dashboard (HU-002)

```
┌─────────────── HU-002 · DICTAMEN: [APROBADO CON RESERVAS MENORES] ───────────────────────┐
│ Capa                        Escritos  Ejecutados  Pasados  Fallados  Bloqueados          │
│ Backend · Identity (real)      19         19         19        0         0               │
│ Regresión · Unit Backlog       62         62         62        0         0               │
│ Regresión · Int. Backlog       31         31         31        0         0               │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ Total solución backend        112        112        112        0         0               │
│ Cobertura funcional de CA: US1 3/3 · US2 3/3 · US3 6/6 · 100% con prueba real y en verde │
│ Ejecuciones consecutivas de Identity: 2 (19/19 ambas) · sin contenedores residuales      │
│ Nivel de riesgo: BAJO (Keycloak e identidad reales; T028 parcial, ver reservas)          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Comandos: `dotnet test app/backend/tests/Integration/Identity/Identity.IntegrationTests.csproj` (19/19, 2,2 min con descarga de imágenes) y `dotnet test app/backend/TechWorkHub.sln` (62 + 31 + 19, 23 s la suite Identity con imágenes en caché).

## 2. Requirements Traceability (HU-002)

```mermaid
flowchart LR
  HU2[HU-002 Integración Keycloak + catálogo real]
  HU2 --> US1[US1 Listado con identidad real]
  HU2 --> US2[US2 Registro con aplicación real]
  HU2 --> US3[US3 Rechazo de credenciales inválidas]
  HU2 --> INV[Invariantes FR-003/012/013/014]

  US1 --> A1[SC1.1 200 ordenado y exacto]
  US1 --> A2[SC1.2 catálogo real]
  US2 --> B1[SC2.1 201 estado Backlog]
  US2 --> B2[SC2.2 CreatedBy = sub]
  US2 --> B3[SC2.3 appId inexistente 400]
  US3 --> C1[SC3.1-3.5 5 credenciales x 2 rutas]
  US3 --> C2[SC3.6 sin efectos]

  A1 --> T1[TC ListarAplicaciones_ConCredencialValida ✅]
  A1 --> T2[TC ListarAplicaciones_SinAplicacionesCreadas ✅]
  A2 --> T3[TC Catalogo_EnHostReal_EsImplementacionReal ✅]
  B1 --> T4[TC RegistrarItem_...Devuelve201 ✅]
  B2 --> T5[TC RegistrarItem_...PersisteCreatedByIgualAlSub ✅]
  B3 --> T6[TC RegistrarItem_ConApplicationIdInexistente ✅]
  C1 --> T7[TC Ruta_ConCredencialInvalida x10 ✅]
  C2 --> T7
  INV --> T8[TC ConfiguracionEfectiva_MantieneAudiencia ✅]
  INV --> T9[TC Suite_NoUsaSimulados ✅]
  INV --> T10[TC EscenarioDeRegistro_EnDosFabricas ✅]
```

| CA / FR | Casos de prueba | Estado |
|---|---|---|
| US1.1 / FR-005 / SC-001 | `ListApplicationsRealTests.ListarAplicaciones_ConCredencialValida_Devuelve200ConAplicacionesOrdenadas`; Sad: `…SinAplicacionesCreadas_Devuelve200ConListaVacia` | ✅ |
| US1.2 / FR-002 | `…Catalogo_EnHostReal_EsImplementacionRealDelModuloApplication` | ✅ |
| US2.1 / FR-006 | `CreateBacklogItemRealTests.RegistrarItem_ConCredencialRealYAplicacionExistente_Devuelve201` (Location + id) | ✅ |
| US2.2 / FR-007 / SC-004 | `…PersisteCreatedByIgualAlSub` (único ítem, `Status=Backlog`, `sub` leído del JWT real) | ✅ |
| US2.3 / FR-008 | `…ConApplicationIdInexistente_Devuelve400SinPersistir` (ProblemDetails con `ApplicationId`, 0 ítems) | ✅ |
| US3.1-3.5 / FR-009 / SC-003 | `InvalidCredentialsTests.Ruta_ConCredencialInvalida_Devuelve401SinEfectos` × 10 (Ausente, FirmaAlterada, Expirada, OtroEmisor, OtraAudiencia × GET/POST) | ✅ 10/10 |
| US3.6 / FR-010 / FR-011 | Mismo Theory: conteo de `application."Applications"` y de ítems sin cambios | ✅ (ver reserva R-2) |
| FR-003 | `ProductionConfigGuardTests.ConfiguracionEfectiva_MantieneAudienciaYEmisorDeProduccion` | ✅ |
| FR-012 / SC-002 | `…Suite_NoUsaSimuladosDeAutenticacionNiCatalogo` | ✅ |
| FR-013 | `git diff main -- app/backend/src` sin cambios fuente | ✅ |
| FR-014 / SC-005 | `IdempotencyTests…EnDosFabricas` + 2 ejecuciones consecutivas 19/19 | ✅ |

## 3. Failure Impact Diagram (HU-002)

**0 fallos críticos detectados.** No hay defectos abiertos `[CAPA:*]`.

## 4. State Transition / User Journey (HU-002)

```mermaid
flowchart TD
  K[Keycloak 24 real: password grant] --> TK[JWT real]
  TK --> AUTH{Validación JWT producción: firma, emisor, vigencia, audiencia}
  AUTH -->|inválido: ausente, firma, expirado, otro emisor, otra audiencia| R401[401 sin tocar catálogo ni BD ✅ 10/10]
  AUTH -->|válido| RT{Ruta}
  RT -->|GET /api/applications| L200[200 ordenado, catálogo real ✅]
  RT -->|POST /api/backlog/items| APP{applicationId existe en catálogo real}
  APP -->|no| R400[400 + 0 ítems ✅]
  APP -->|sí| R201[201 Backlog, CreatedBy = sub ✅]
```

Sin ruptura de flujo detectada.

## 5. Test Coverage & Hotspots (HU-002)

```mermaid
flowchart LR
  subgraph Cobertura HU-002
    A[Autenticación JWT real · 10 casos 401 + 5 felices · alta]
    C[Catálogo real Application · 3 casos · alta]
    P[Persistencia PostgreSQL migrada · 3 casos · alta]
    G[Guardias de configuración y simulados · 2 · alta]
    I[Idempotencia · 1 + 2 ejecuciones · alta]
  end
```

Hotspots de defectos: ninguno. Riesgo residual: roles no verificados (no documentados); rechazo 401 verificado por efecto (sin trazas), no por instrumentación.

## Pruebas adversariales propias (QA-AUTO)

| Prueba | Resultado |
|---|---|
| **Mutación de realm (T029 reproducida):** quitar el *audience mapper* de `techworkhub-tests` | 5 de 6 casos de US1/US2 fallan; el sexto (`Catalogo_EnHostReal…`) no depende de identidad y pasa. Realm restaurado y comparado byte a byte. |
| `src/**` solo lectura (FR-013) | `git diff --stat main -- app/backend/src` (excluyendo `bin/obj`) sin diferencias |
| Residuos Docker tras 2 ejecuciones | Solo el reaper `ryuk` de Testcontainers |
| Credencial expirada vs `ClockSkew` (D-02 de QA-Tech) | El caso `Expirada` devuelve 401 en ambas rutas tras esperar `exp`: no se observa aceptación por el skew en este host |

## Reservas (no bloqueantes)

- **R-1 (T028 abierta):** no se probó el fallo explícito con el daemon de Docker detenido; QA-AUTO no detuvo el Docker del usuario. Verificado solo el mensaje de timeout que nombra "Keycloak".
- **R-2:** el criterio "sin efectos" (US3.6/FR-010) se comprueba por conteos antes/después, no por instrumentación del acceso al catálogo. Es suficiente para FR-011 (sin mutación) pero no demuestra la ausencia de lecturas.
- **R-3 (T030 abierta):** falta citar en el PR la excepción `ssl-required=none` confirmada por el spike T008. Es una tarea de proceso, no de código.
- **R-4:** los archivos de `app/backend/tests/Integration/Identity/**` y el realm figuran sin commitear (`??`) en el árbol de trabajo; los commitea quien los generó (DEV-BACK).

---

# Histórico: HU-001

## 1. AI QA Review Dashboard

```
┌─────────────── HU-001 · DICTAMEN: [APROBADO] (PostgreSQL/Testcontainers) ────────────────┐
│ Capa                    Escritos  Ejecutados  Pasados  Fallados  Bloqueados             │
│ Backend · Unitarias        62         62        62        0         0                  │
│ Backend · Integración      31         31        31        0         0  (Program+PostgreSQL)│
│ Frontend · Jest            31         31        31        0         0                  │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ Cobertura funcional de CA (SC-01..SC-06): 6/6 con prueba real · 6/6 en verde            │
│ Nivel de riesgo: BAJO  (BD real PostgreSQL 16; Keycloak y catálogo siguen simulados)     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Re-ejecución 03-10-2026 tras `afda58a` y los cambios del componente Angular: `dotnet test TechWorkHub.sln` (61 + 22) y `npx jest` en `app/frontend` (19, antes 14: el spec fue ampliado).

Segunda re-ejecución (misma fecha): `dotnet test app/backend/TechWorkHub.sln` 61/61 + 22/22 y Jest 19/19, sin cambios de resultado; `Validate_ConTipoNulo_DebeFallarEnType` en verde. Docker sigue inactivo: T037 permanece abierta (Testcontainers pendiente). El código de interfaz (`app/frontend`) está probado pero **sin commitear** en el árbol de trabajo.

Tercera re-ejecución (retrabajo 1/2): mismos resultados (61/61, 22/22, Jest 19/19); no hay commits nuevos de producción desde `afda58a`. Docker sigue inactivo.

**Cuarta ejecución (03-10-2026, Docker 28.4.0 activo, T043):** INT-01..INT-10 y los casos #16..#19 corren sobre `WebApplicationFactory<Program>` con **PostgreSQL 16 (Testcontainers)**: un único contenedor por suite (`PostgresFixture` + `ICollectionFixture`), una base de datos nueva por prueba y las migraciones Code-First aplicadas por el arranque real (`Database:MigrateOnStartup=true`). SQLite se eliminó de la solución de pruebas. Cobertura: #16 `ListApplicationsTests` (catálogo autenticado, 401 sin token); #17 Jest (interceptor, guard, reautenticación); #18 `KeycloakConfigurationTests` y `MigrationsPostgresTests` (schemas/tablas e idempotencia sobre PostgreSQL); #19 `ListApplicationsTests`/`CreateBacklogItemTests` (401 sin claim de identidad sin tocar catálogo ni BD). Resultado: unitarias 62/62, integración 31/31, Jest 31/31. Reserva residual: Keycloak/JWT se sustituye por un esquema de prueba y el catálogo del módulo Application es un doble; no se probó concurrencia.

Ejecución: `dotnet test` en `tests/Unit/Backlog/Backlog.UnitTests.csproj` (net8.0, xUnit 2.9.2, NSubstitute 5.3, FluentAssertions 6.12.2).

## 2. Requirements Traceability

```mermaid
flowchart LR
  HU[HU-001 Registro backlog multitipo]
  HU --> SC01[SC-01 Happy UserStory 201]
  HU --> SC02[SC-02 Happy Spike qaPoints null]
  HU --> SC03[SC-03 Titulo vacio 400]
  HU --> SC04[SC-04 Tipo invalido 400]
  HU --> SC05[SC-05 Puntos negativos 400]
  HU --> SC06[SC-06 Sin token 401]
  HU --> CB04[CB-04 applicationId inexistente]
  HU --> POST[Postcondiciones: estado, auditoria, evento]

  SC01 --> U1[Domain: Create_ConDatosValidos_DebeFijarEstado ✅]
  SC01 --> U2[Handler: Handle_ConUserStoryYPuntosCompletos ✅]
  SC01 --> I1[INT-01 POST 201 ✅]
  SC02 --> U3[Handler: ConTipoTecnico ForzarQaPointsNulo x5 ✅]
  SC02 --> U4[Domain: Create_ConQaPointsNulos ✅]
  SC02 --> F1[FE: onSubmit_ConSpike ✅]
  SC03 --> V1[Validator: TituloVacioONulo x3 ✅]
  SC03 --> I2[INT-03 400 + sin persistencia ✅]
  SC04 --> V2[Validator: TipoFueraDelCatalogo x4 ✅]
  SC04 --> V3[Validator: ConTipoNulo ✅ corregido]
  SC05 --> V4[Validator: Dev/QA negativos ✅]
  SC06 --> I3[INT-06 401 sin token ✅]
  SC06 --> F2[FE: onSubmit_ConRespuesta401 ✅]
  CB04 --> U5[Handler: AppIdInexistente lanza ValidationException ✅]
  CB04 --> I4[INT-04 mapeo a HTTP 400 ✅ corregido]
  POST --> D1[Domain: evento BacklogItemCreatedDomainEvent ✅]
  POST --> I5[INT-07 CreatedAt/CreatedBy ✅ corregido]
  POST --> I6[INT-08 evento despachado ✅ corregido]
```

| CA | Pruebas automatizadas | Estado |
|---|---|---|
| SC-01 | `BacklogItemDomainTests.Create_ConDatosValidos_*`, `Handler.Handle_ConUserStoryYPuntosCompletos_*`; INT-01 | ✅ Unit + HTTP 201 + persistencia |
| SC-02 | `Handler.Handle_ConTipoTecnico..._DebeForzarQaPointsNulo` (5 tipos), `Domain.Create_ConQaPointsNulos_*`; INT-02 | ✅ |
| SC-03 | `Validator.Validate_ConTituloVacioONulo_*` (3), título 200/201 (CB-01); INT-03 | ✅ (400 HTTP, sin fila) |
| SC-04 | `Validator.Validate_ConTipoFueraDelCatalogo_*` (4), `ConTipoNulo`; INT `SinTipo` | ✅ (DEF-02 confirmado) |
| SC-05 | `Validator.Validate_Con{Dev,Qa}PointsNegativos_*`; INT-05 | ✅ (400 HTTP) |
| SC-06 / CB-06 | INT-06, `FE.onSubmit_ConRespuesta401_*` | ✅ |
| CB-04 | `Handler.Handle_ConApplicationIdInexistente_*`; INT-04 | ✅ mapeo a 400 |
| CB-05 | `Handler.Handle_CuandoSaveChangesFalla_*` | Propagación ✅ · rollback no verificado con PostgreSQL |

**Estado tras la re-ejecución (22/22 ✅):** `app/backend/tests/Integration/Backlog` corre sobre `WebApplicationFactory<Program>`; SC-01..SC-06, CB-04 y las postcondiciones pasan. `Validate_ConTipoNulo_DebeFallarEnType` pasa (DEF-02 confirmado corregido) y el caso HTTP `CreateBacklogItem_SinTipo_DebeResponder400SinPersistir` también. Correspondencia INT-01..INT-10: INT-01 `ConPayloadNumericoValido…201`; INT-02 `ConSpike…`/`ConTipoTecnicoSinQaPoints…`; INT-03 `ConTituloVacio…400`; INT-04 `ConApplicationIdInexistente…400`; INT-05 `ConDevPointsNegativos…400`; INT-06 `SinTokenOConTokenInvalido…401` y `ConTokenSinClaimDeIdentidad…401`; INT-07 `…AuditarCreatedAtYCreatedBy`; INT-08 `…PublicarBacklogItemCreatedDomainEvent`; INT-09 `ConPrioridadComoTextoSegunHU…201`; INT-10 `ConTextoEnElLimite…201` y `ConTextoMasLargoQueElLimite…400`. Pendiente: Testcontainers PostgreSQL (la BD actual es SQLite). Histórico de la ejecución anterior: 5 ✅ y 5 ❌ (DEF-01, DEF-03, DEF-07). Diseño original: INT-01 201 completo; INT-02 Spike con qaPoints null; INT-03 título vacío 400 sin fila; INT-04 appId inexistente 400; INT-05 puntos negativos sin evento; INT-06 sin token 401; INT-07 auditoría; INT-08 evento; INT-09 enums como string en JSON; INT-10 título de 201 caracteres.

## 3. Failure Impact Diagram

```mermaid
flowchart TD
  T1[❌ Validate_ConTipoNulo_DebeFallarEnType] --> C1[CreateBacklogItemValidator IsEnumName acepta null]
  C1 --> C2[CommandHandler Enum.Parse null → ArgumentNullException]
  C2 --> B1[POST sin type responde 500 en vez de 400 · SC-04]

  X1[DEF-01 Sin ValidationBehavior en MediatR] --> B2[SC-03/04/05 nunca devuelven 400: el validador no se ejecuta]
  X2[DEF-03 Sin mapeo ValidationException a 400] --> B3[CB-04 devuelve 500]
  X3[DEF-04 AuditableEntityInterceptor es no-op] --> B4[CreatedBy requerido → fallo de inserción; sin auditoría]
  X4[DEF-05 Sin DispatchDomainEventsInterceptor] --> B5[BacklogItemCreatedDomainEvent nunca se publica]
  X5[DEF-06 Sin Program/csproj/DbContext/IApplicationModuleApi] --> B6[Endpoint no ejecutable; 0 pruebas de integración]
  X6[DEF-07 FE: applicationId 'app-id-101' vs Guid] --> B7[Payload con aplicación → fallo de deserialización]
  X7[DEF-08 FE: sin package.json/jest y falta .scss] --> B8[Frontend no compila ni se prueba]
```

> **Re-ejecución 03-10-2026:** el diagrama y la tabla son el **histórico** de la ejecución rechazada. DEF-01..DEF-08 están verificados como **CORREGIDOS** (todas las pruebas asociadas en verde). DEF-06 queda cerrado en lo funcional; la migración a Testcontainers sigue pendiente (reserva del dashboard).

| ID | Severidad | Hallazgo (original) | Responsable |
|---|---|---|---|
| DEF-01 | Crítica | No existe `ValidationBehavior<,>` ni registro de validadores: los validadores no se invocan. | DEV-BACK |
| DEF-02 | Alta | `Type = null` pasa el validador (`IsEnumName`) y revienta en el handler (test rojo). Añadir `NotEmpty()`. | DEV-BACK |
| DEF-03 | Alta | El handler lanza `FluentValidation.ValidationException` y no hay exception handler que la mapee a 400 (CB-04). | DEV-BACK |
| DEF-04 | Crítica | `AuditableEntityInterceptor` no asigna `CreatedAt`/`CreatedBy`; `CreatedBy` es `IsRequired`. | DEV-BACK |
| DEF-05 | Alta | No hay `DispatchDomainEventsInterceptor`; el handler tampoco despacha ni limpia eventos. | DEV-BACK |
| DEF-06 | Crítica | Sin `Program`, `.csproj` de módulo, DbContext ni implementaciones de `IBacklogDbContext`/`IApplicationModuleApi`. | DEV-BACK |
| DEF-07 | Alta | La UI envía `applicationId = "app-id-101"` y el comando exige `Guid?`. Tampoco hay evidencia de `JsonStringEnumConverter` para `priority`. | DEV-FRONT / DEV-BACK |
| DEF-08 | Alta | `styleUrls` apunta a un `.scss` inexistente; no hay `package.json`, `angular.json` ni `jest.config`. | DEV-FRONT |

## 4. State Transition / User Journey

```mermaid
stateDiagram-v2
  [*] --> Formulario
  Formulario --> ValidacionUI: submit
  ValidacionUI --> Formulario: invalido (sin HTTP) FE-spec
  ValidacionUI --> POST_Items: valido
  POST_Items --> Rechazo401: sin token INT-06 bloqueado
  POST_Items --> ValidatorMediatR: autenticado
  ValidatorMediatR --> Rechazo400: DEF-01 el pipeline no valida
  ValidatorMediatR --> Handler
  Handler --> Rechazo400: appId inexistente DEF-03 (500)
  Handler --> Persistencia
  Persistencia --> Error500: DEF-04 CreatedBy nulo
  Persistencia --> Creado201: Status=Backlog (dominio OK)
  Creado201 --> EventoDominio: DEF-05 no se despacha
  Creado201 --> [*]
```

## 5. Test Coverage & Hotspots

```mermaid
flowchart LR
  subgraph Cobertura
    D[Domain BacklogItem — 4 tests · alta]
    V[Validator — 24 casos · alta]
    H[Handler — 15 casos · alta]
    E[Endpoint Carter — INT 22 · alta]
    P[Pipeline MediatR — INT · alta]
    I[Interceptors EF — INT-07/08 · media]
    F[Componente Angular — 19 · alta]
  end
  V:::hot
  P:::hot
  I:::hot
  E:::hot
  classDef hot fill:#ffd6d6,stroke:#c00;
```

Hotspots: sin defectos abiertos; la BD de integración ya es PostgreSQL real. Riesgo residual: Keycloak real (no hay prueba contra un IdP).

## Hallazgo 9 (Code Review) — stubs reemplazados

| Tarea | Antes | Ahora |
|---|---|---|
| T009 | `[Fact]` comentado + `Task.CompletedTask` | 201 con persistencia y 401 (token ausente/inválido) contra el endpoint real |
| T010 | Cuerpo vacío | 24 casos de `AbstractValidator` con `TestValidate` |
| T015 | `[Fact]` comentado | Spike con `qaPoints=8` persiste `QAPoints == null` vía HTTP |

## Dictamen

**[APROBADO]** — 124/124 pruebas en verde (62 unitarias, 31 de integración sobre PostgreSQL/Testcontainers, 31 Jest); DEF-01..DEF-08 corregidos, SC-01..SC-06 y los casos #16..#19 cubiertos. Reserva menor: Keycloak/JWT simulado. Se devuelve el turno a `@CODE-REVIEW`.

_Histórico: el dictamen previo fue **[RECHAZADO]** (47/53 en verde, 6 defectos de producción)._

## Notas de gobernanza

- No se modificó código de producción. El stub de validador (T010) era una tautología y fue reemplazado. El stub de integración (T009/T015) también fue reemplazado por pruebas reales.
- Las tareas T009, T010 y T015 de `tasks.md` están marcadas `[X]` sin pruebas reales detrás.
