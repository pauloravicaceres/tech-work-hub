# Clasificación de retrabajo (iteración 1, origen: Code Review)

Clasifiqué los hallazgos, corregí spec.md y plan.md, y agregué la Fase 6 a tasks.md. No toqué código ni ejecuté tests, y `.specify/extensions.yml` no existe, así que no hubo hooks.

## Cambios en los documentos

- **spec.md**:
  - FR-008 ahora dice que un `qaPoints` con valor en un tipo técnico se rechaza con 400.
  - FR-009 define que sin claim de identidad la respuesta es 401.
  - Nuevos FR-011 (`priority` como texto), FR-012 (`acceptanceCriteria` y límites de longitud) y FR-013 (formato `ProblemDetails` con `errors`).
  - `Priority` y `AcceptanceCriteria` entran en la entidad, y hay tres casos borde nuevos.
- **plan.md**:
  - Las rutas pasan a `app/backend/` y `app/frontend/`, como exige la constitución.
  - Se agregaron `Program.cs`, `BacklogDbContext`, `BacklogModule` y la ubicación de `IApplicationModuleApi`.
  - Una sección nueva fija ValidationBehavior, el manejador de excepciones, los interceptores de `Shared`, el token de cancelación, el convertidor de enums, los límites de longitud, la migración y el frontend.
- **tasks.md**: desmarqué T013, T014, T017, T018 y T019. Dejé T009, T010 y T015 como cerradas porque la re-auditoría QA confirmó que sus pruebas son reales.

## Decisiones a confirmar

- **Política de `qaPoints`**: el hallazgo #13 dejaba abierto si se descarta o se rechaza. Elegí rechazar con 400, porque descartar en silencio pierde datos sin avisar.
- **Límite de `Description` y `AcceptanceCriteria`**: lo fijé en 4000 caracteres, un valor mío que no viene de ningún documento.
- **`contracts/api.md`**: no lo edité. Tiene codificación no UTF-8 y una edición parcial corrompería los acentos. T020 y T021 lo reescriben completo.
- **Constitución**: no encontré ambigüedades, así que no hace falta `/speckit-constitution`. El código actual vive en `src/` y la constitución exige `app/backend/`, así que T022 incluye moverlo.

## Hallazgo → capa → tarea

| Hallazgo | Capa | Tarea |
|---|---|---|
| #13 Política de QAPoints | SPEC | T020 (servidor) |
| #14 Contrato API: `priority`, `acceptanceCriteria`, 400 | SPEC | T021 (servidor) |
| DEF-06 Sin Program/DbContext/DI; interfaces en el handler | PLAN | T022 (servidor) |
| DEF-01 Sin ValidationBehavior | CODE | T023 (servidor) |
| DEF-03 Sin mapeo a 400 | CODE | T024 (servidor) |
| DEF-04 Interceptor de auditoría vacío | CODE | T025 (servidor) |
| DEF-05 Sin DispatchDomainEventsInterceptor | CODE | T026 (servidor) |
| #1 Sin `CancellationToken` en el endpoint | CODE | T027 (servidor) |
| DEF-07 Sin `JsonStringEnumConverter` | CODE | T028 (servidor) |
| #11 Regla de QAPoints fuera del dominio | CODE | T029 (servidor) |
| Menores: longitudes, `TryParse`, migración, `using` | CODE | T030 (servidor) |
| DEF-02 `.NotEmpty()` sin commit | CODE | T031 (servidor) |
| DEF-07 `app-id-101` no es `Guid` | CODE | T032 (interfaz) |
| DEF-08 `.scss` y configuración Angular/Jest | CODE | T033 (interfaz) |
| #12 `qaPoints: 0` por defecto | CODE | T034 (interfaz) |
| #14 El front no lee `errors` | CODE | T035 (interfaz) |
| #5 y menores del front: `subscribe()`, `@if`, Cancelar, tipos | CODE | T036 (interfaz) |
| #15 T013/T014/T017/T018/T019 cerradas sin cumplirse | TASKS | Desmarcadas, más T037 (QA, servidor + interfaz) |

Siguiente paso: `/speckit-implement` para T020–T037, ejecutando primero T020–T022.
