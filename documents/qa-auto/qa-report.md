# QA Report — Calidad y Trazabilidad Viva

> Última actualización: 03-10-2026 · Iteración: **HU-001 Registro de Elementos en Backlog Multitipo** · Agente: QA-AUTO
> Áreas no afectadas por esta iteración: _Sin cambios en esta iteración_.

## 1. AI QA Review Dashboard

```
┌──────────────────────────── HU-001 · DICTAMEN: [RECHAZADO] ────────────────────────────┐
│ Capa                    Escritos  Ejecutados  Pasados  Fallados  Bloqueados             │
│ Backend · Unitarias        43         43        42        1         0                  │
│ Backend · Integración       0*         0         0        0        10 (diseñados)       │
│ Frontend · Jest            14          0         0        0        14 (sin workspace)   │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ Cobertura funcional de CA (SC-01..SC-06): 2/6 verificados end-to-end · 6/6 diseñados     │
│ Nivel de riesgo: ALTO  (pipeline de validación, auditoría y eventos no existen)          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
* No se puede escribir un test de integración compilable: no existe `Program`, `.csproj` del módulo ni DbContext.
```

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
  SC01 --> I1[INT-01 POST 201 ⛔ BLOQUEADO]
  SC02 --> U3[Handler: ConTipoTecnico ForzarQaPointsNulo x5 ✅]
  SC02 --> U4[Domain: Create_ConQaPointsNulos ✅]
  SC02 --> F1[FE: onSubmit_ConSpike ⛔ no ejecutado]
  SC03 --> V1[Validator: TituloVacioONulo x3 ✅]
  SC03 --> I2[INT-03 400 + sin persistencia ⛔]
  SC04 --> V2[Validator: TipoFueraDelCatalogo x4 ✅]
  SC04 --> V3[Validator: ConTipoNulo ❌ DEF-02]
  SC05 --> V4[Validator: Dev/QA negativos ✅]
  SC06 --> I3[INT-06 401 sin token ⛔ BLOQUEADO]
  SC06 --> F2[FE: onSubmit_ConRespuesta401 ⛔ no ejecutado]
  CB04 --> U5[Handler: AppIdInexistente lanza ValidationException ✅]
  CB04 --> I4[INT-04 mapeo a HTTP 400 ❌ DEF-03]
  POST --> D1[Domain: evento BacklogItemCreatedDomainEvent ✅]
  POST --> I5[INT-07 CreatedAt/CreatedBy ❌ DEF-04]
  POST --> I6[INT-08 evento despachado ❌ DEF-05]
```

| CA | Pruebas automatizadas | Estado |
|---|---|---|
| SC-01 | `BacklogItemDomainTests.Create_ConDatosValidos_*`, `Handler.Handle_ConUserStoryYPuntosCompletos_*`; INT-01 | Unit ✅ · HTTP 201 / persistencia ⛔ |
| SC-02 | `Handler.Handle_ConTipoTecnico..._DebeForzarQaPointsNulo` (5 tipos), `Domain.Create_ConQaPointsNulos_*` | ✅ |
| SC-03 | `Validator.Validate_ConTituloVacioONulo_*` (3), título 200/201 (CB-01) | ✅ (400 HTTP ⛔, depende de DEF-01) |
| SC-04 | `Validator.Validate_ConTipoFueraDelCatalogo_*` (4), `ConTipoNulo` | 4 ✅ · 1 ❌ (DEF-02) |
| SC-05 | `Validator.Validate_Con{Dev,Qa}PointsNegativos_*` | ✅ (400 HTTP ⛔, DEF-01) |
| SC-06 / CB-06 | INT-06, `FE.onSubmit_ConRespuesta401_*` | ⛔ Bloqueado |
| CB-04 | `Handler.Handle_ConApplicationIdInexistente_*` | Unit ✅ · mapeo 400 ❌ (DEF-03) |
| CB-05 | `Handler.Handle_CuandoSaveChangesFalla_*` | Propagación ✅ · rollback ⛔ |

Integración diseñada y pendiente de host (`WebApplicationFactory<Program>` + Testcontainers PostgreSQL con `ICollectionFixture`): INT-01 201 completo; INT-02 Spike con qaPoints null; INT-03 título vacío 400 sin fila; INT-04 appId inexistente 400; INT-05 puntos negativos sin evento; INT-06 sin token 401; INT-07 auditoría; INT-08 evento; INT-09 enums como string en JSON; INT-10 título de 201 caracteres.

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

| ID | Severidad | Hallazgo | Responsable |
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
    E[Endpoint Carter — 0 · NULA]
    P[Pipeline MediatR — 0 · NULA]
    I[Interceptors EF — 0 · NULA]
    F[Componente Angular — 14 escritos · sin ejecutar]
  end
  V:::hot
  P:::hot
  I:::hot
  E:::hot
  classDef hot fill:#ffd6d6,stroke:#c00;
```

Hotspots de defectos: pipeline/infra del módulo Backlog (DEF-01, 03, 04, 05, 06) y contrato FE↔BE (DEF-07). La lógica pura (dominio, handler, validador) está sólida salvo DEF-02.

## Dictamen

**[RECHAZADO]** — Se devuelve el turno a `@DEV-BACK` y `@DEV-FRONT`. Los criterios SC-03/04/05/06 y las postcondiciones (auditoría, evento) no pueden cumplirse con la implementación actual. Al corregirse, QA-AUTO debe añadir y ejecutar INT-01..INT-10.

## Notas de gobernanza

- No se modificó código de producción. El stub de validador (T010) era una tautología y fue reemplazado. El stub `tests/Integration/Backlog/CreateBacklogItemTests.cs` (T009/T015: `[Fact]` comentado y `Task.CompletedTask`) se deja intacto hasta que exista host.
- Las tareas T009, T010 y T015 de `tasks.md` están marcadas `[X]` sin pruebas reales detrás.
