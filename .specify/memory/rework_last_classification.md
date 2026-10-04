# Clasificación de retrabajo (iteración 1, origen: QA Automation)

Corregí primero los documentos y después añadí las tareas, sin tocar código, `documents/tracker_bmad.md` ni handoffs.

## Documentos corregidos
- **`spec.md` (DEF-02, capa SPEC):**
  - FR-015 queda reemplazado.
  - FR-017 define el 409: el elemento ya asignado, la unicidad por índice y la concurrencia.
  - FR-018 define las estimaciones decimales con `null`, sin redondeo.
  - US3 gana los escenarios 4 y 5 (409 y concurrencia).
  - Se retiraron los casos borde "no documentado" y se ajustaron los Assumptions y la entidad.
- **Artefactos del plan (DEF-01):**
  - `contracts/backlog-module-api.md` y `data-model.md` pasan a `decimal?`.
  - `sprint-items-api.openapi.yaml` pasa a `number` nullable.
  - El resumen de `plan.md` ya no dice que `spec.md` queda pendiente.
- **Constitución:** no hay ambigüedad que enmendar. Ningún hallazgo la viola.
- **No encontré el W-01** al buscarlo en el documento del SA (`documents/solutions-architect/004-HU_asignacion_elementos_sprint.md`), así que no lo verifiqué. Me basé en tu informe y en que `BacklogItem` ya usa `decimal?`.

## `tasks.md`
- **Reabiertas por no cumplirse:** T005, T015, T036 y T041.
- **Nueva Phase 9 (T055–T062):** son las 8 tareas de la tabla.
- **Sin tarea de corrección:** T051 y T052 siguen abiertas. Las bloquea el entorno (Node v22.20.0 frente a Angular CLI ≥ 22.22.3), no el código. Tampoco abrí tarea para Identity.IntegrationTests, que falla por Keycloak/Docker y es ajeno a la HU-004.

| Hallazgo | Capa | Tarea |
|---|---|---|
| DEF-01: contrato `BacklogItemSummary` en `int` | TASKS | T055 (servidor) |
| DEF-01: `ToWholePoints` redondea 2.5 y convierte QA nulo en 0 | TASKS | T056 (servidor) |
| DEF-01: `SprintItemResponse` en `int` y revalidación de las 2 pruebas rojas | TASKS | T057 (servidor) |
| DEF-01: sin prueba de contrato con 2.5 y nulo | TASKS | T058 (servidor) |
| DEF-01: modelo TS sin nulo | TASKS | T059 (interfaz) |
| DEF-01: sin guion para nulo en la vista | TASKS | T060 (interfaz) |
| DEF-02: pruebas del 409 sin trazabilidad a FR-017 | SPEC | T061 (servidor) |
| DEF-02: quickstart y cobertura sin FR-017 y FR-018, y nuevo `/speckit-analyze` | SPEC | T062 (servidor) |

**Siguiente paso:** `/speckit-implement` sobre T055–T062.
