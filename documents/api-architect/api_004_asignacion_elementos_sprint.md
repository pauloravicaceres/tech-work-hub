# CONTRATO DE INTEGRACIÓN (API): Asignación de Elementos del Backlog a un Sprint

- **Especificación SDD Base:** `specs/004-HU_asignacion_elementos_sprint/spec.md`, `tasks.md`, `plan.md` y `contracts/sprint-items-api.openapi.yaml` (Spec Kit)
- **Modelo Base de Datos:** `db_004_asignacion_elementos_sprint.md`
- **Fecha de Diseño:** 04-10-2026
- **API Architect:** Agente API Senior BMAD
- **Modo de gobernanza:** Brownfield (`.specify/memory/constitution.md` prevalece)

> **Dictamen de alcance:** dos endpoints sobre un único recurso anidado `sprints."SprintItems"`: asignar (`POST`) y consultar (`GET`) bajo `/api/sprints/{sprintId}/items`. No hay `PUT`/`PATCH`/`DELETE` (sin desasignar, mover ni reasignar). Las respuestas no exponen `CreatedAt`/`CreatedBy`, estado del elemento ni identificación del Sprint dueño.
>
> **Reconciliación vinculante:** la resolución humana A y la guía del SA (un elemento pertenece a un solo Sprint; repetir la asignación responde **409**) prevalecen sobre `spec.md` FR-015, que queda sin efecto (así lo declaran `plan.md` y `tasks.md`). Este contrato incluye el 409.
>
> **Corrección sobre el OpenAPI de Spec Kit:** `devPoints` y `qaPoints` se contratan como `number | null` y no como `integer` (ver ADR-04 y sección 4).

---

## 1. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

### ADR-01: Protocolo y capa de interfaz (Carter Minimal APIs, VSA, recurso anidado)
- **Estado:** Aceptado (heredado)
- **Contexto:** La Constitución (§2 y §7) exige Carter `ICarterModule`, MediatR, FluentValidation y Mapster con Endpoint, Handler y Validador co-localizados por feature, sin Controllers ni carpetas horizontales.
- **Decisión:** Dos features en `app/backend/src/Modules/Sprints/Features/SprintItems/`: `AssignItemToSprint/` y `ListSprintItems/`, cada una con su `*Endpoint.cs` (Carter), comando o consulta, handler y, en la asignación, `AssignItemToSprintValidator`. Los DTOs `AssignedItemResponse` y `SprintItemResponse` viven en `Features/SprintItems/`. La asignación se modela como subrecurso del Sprint (`/api/sprints/{sprintId}/items`), alineado con la jerarquía `SPRINTS ||--o{ SPRINT_ITEMS` del MER.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Mismo patrón que HU-003; el `sprintId` en la ruta deja la relación explícita y el cuerpo solo lleva el `itemId`.
  - ⚠️ **Trade-off / Costo Real:** `SprintItemResponse` (ítem con sus puntos) y `AssignedItemResponse` (par de ids) son tipos distintos con rutas de código distintas; el frontend debe mapear ambos.

### ADR-02: Autenticación y autorización (Bearer JWT / Keycloak)
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-010 y la Constitución (§5) exigen `.RequireAuthorization()` en toda ruta no pública. Los permisos por rol no están documentados (punto abierto 6 de la HU).
- **Decisión:** Ambos endpoints exigen `Authorization: Bearer <JWT>` (`Keycloak.AuthServices.Authentication`) con `.RequireAuthorization()` sin política por rol. `CreatedBy` se toma del claim `sub` vía `ICurrentUser`, nunca del cuerpo.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Un intento anónimo recibe 401 antes de leer o persistir datos (SC-003).
  - ⚠️ **Trade-off / Costo Real:** Cualquier usuario autenticado puede asignar cualquier elemento a cualquier Sprint; al definirse roles se añadirá un 403 que cambiará el contrato.

### ADR-03: Evaluación de errores y identificadores como texto (400 por campo)
- **Estado:** Aceptado
- **Contexto:** FR-007 exige 400 con detalle por campo cuando `sprintId` o `itemId` faltan o están malformados. Con `{sprintId:guid}` en la ruta, un valor no-GUID no llegaría al handler y produciría un 404 de enrutador sin detalle (así ocurre en HU-003 `GET /{id}`).
- **Decisión:** En el `POST`, `sprintId` se declara `string` en la ruta e `itemId` es `string?` en el cuerpo; `AssignItemToSprintValidator` valida no vacío, formato GUID y distinto de `Guid.Empty`, con claves de error `sprintId` e `itemId`. Orden de evaluación fijo: **400 → 401 (identidad) → 404 Sprint → 404 elemento → 409 → 201**. Si faltan ambos recursos gana el 404 del Sprint y el contrato `IBacklogModuleApi` no se invoca. En el `GET` se mantiene `{sprintId:guid}` (FR-005 solo exige 404 y no hay campo que detallar).
- **Alternativas Evaluadas:**
  - **Alternativa A:** `{sprintId:guid}` también en el `POST`. Descartada: un `sprintId` malformado respondería 404 sin cuerpo, incumpliendo el 400 por campo de FR-007 y el escenario de identificadores malformados.
  - **Alternativa B:** `sprintId` e `itemId` en el cuerpo (`POST /api/sprint-items`). Descartada: rompe la jerarquía del recurso y obliga a validar dos campos de cuerpo en lugar de un recurso en la ruta.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Detalle por campo determinista para ambos identificadores.
  - ⚠️ **Trade-off / Costo Real:** Asimetría `POST` (ruta texto) / `GET` (ruta `guid`); el OpenAPI no valida el formato por esquema. Un cuerpo con `itemId` numérico o JSON roto falla en el binding con un 400 no estructurado por campo.

### ADR-04: `devPoints` y `qaPoints` como `number | null` (decimal anulable)
- **Estado:** Aceptado
- **Contexto:** `BacklogItem.DevPoints` y `QAPoints` son `decimal?` (`Modules/Backlog/Domain/BacklogItems/BacklogItem.cs`); un elemento técnico no tiene QA (la UX lo muestra como `--`). El OpenAPI y `tasks.md` T005/T036/T041 los tipan `integer`/`int`, lo que truncaría decimales y falsearía el nulo como `0` (riesgo ya señalado por el DA).
- **Decisión:** `SprintItemResponse.devPoints` y `qaPoints` son `number` con `nullable: true`, serializados tal como los entrega Backlog (`null` si no hay estimación, nunca `0` sustituto). `BacklogItemSummary`, `SprintItemResponse` y el modelo TypeScript deben usar `decimal?` / `number | null`.
- **Alternativas Evaluadas:**
  - **Alternativa A:** `integer` y redondear/truncar. Descartada: altera el dato del elemento visible al usuario y contradice SC-004 y FR-013 (la asignación no debe alterar datos).
  - **Alternativa B:** Omitir el campo cuando es nulo. Descartada: el cliente debe distinguir ausencia de estimación de campo no enviado; un contrato de forma fija es más simple de tipar.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** El dato mostrado coincide con el registrado en HU-001; el nulo se representa con fidelidad.
  - ⚠️ **Trade-off / Costo Real:** Exige cambiar `T005`, `T036`, `T041` y el OpenAPI antes de implementar, y el frontend debe manejar `null` (`--`). Los decimales JSON pueden perder precisión en clientes con `double`.

### ADR-05: 201 Created con `Location` hacia la colección y cuerpo mínimo
- **Estado:** Aceptado
- **Contexto:** FR-002 exige un código de éxito con los ids del Sprint y del elemento. La asignación no tiene identificador público propio ni endpoint de detalle.
- **Decisión:** `POST` responde **201 Created** (⚠️ PROPUESTO por el SA) con `{ "sprintId", "itemId" }` y `Location: /api/sprints/{sprintId}/items` (la colección, la única consulta disponible). No se devuelve el `Id` de `SprintItems` ni auditoría.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 200 OK. Descartada: crear una relación persistente es semánticamente una creación y alinea con HU-001 y HU-003.
  - **Alternativa B:** 204 No Content. Descartada: FR-002 exige devolver ambos identificadores.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Código coherente con el resto de la API y cuerpo suficiente para refrescar la vista.
  - ⚠️ **Trade-off / Costo Real:** `Location` apunta a una colección y no a un recurso individual; si luego se permite desasignar habrá que exponer un identificador de asignación (cambio aditivo en el cuerpo).

### ADR-06: 409 Conflict por pertenencia única, sin revelar el Sprint dueño
- **Estado:** Aceptado
- **Contexto:** La resolución humana A exige 409 al reasignar un elemento (mismo u otro Sprint) y un único 201 bajo concurrencia; el DA lo materializa con `UX_SprintItems_ItemId` (ADR-04 del DA). Revelar a qué Sprint pertenece el elemento expone una búsqueda inversa sin permisos definidos.
- **Decisión:** Toda asignación de un elemento ya asignado responde **409 Conflict** (`ProblemDetails`, `Title = "Conflict"`) con el mismo mensaje genérico ("el elemento ya está asignado a un Sprint") tanto si es el mismo Sprint como otro y tanto si lo detecta la lectura previa como la violación `23505` del índice. Requiere `ConflictException` aditiva en `Shared` (T003/T004). No hay idempotencia: repetir el mismo `POST` no devuelve 201 ni 200.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 200/201 idempotente si el elemento ya está en el mismo Sprint. Descartada: la regla humana A pide 409 también para el mismo Sprint y distinguir los casos revelaría información del dueño.
  - **Alternativa B:** 422 Unprocessable Entity. Descartada: el estado del recurso en conflicto se expresa con 409 y es lo decidido por el humano y por el SA.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Respuesta uniforme y sin fuga del Sprint dueño; la concurrencia se resuelve en el motor.
  - ⚠️ **Trade-off / Costo Real:** Un reintento de red tras un 201 perdido recibe 409 y el cliente no puede saber si fue su propia asignación; el usuario debe consultar el listado. Es un cambio en `Shared` (aditivo) que debe conservar los formatos 400/404/500.

### ADR-07: Formato de errores `ProblemDetails` (`application/problem+json`)
- **Estado:** Aceptado (heredado)
- **Contexto:** `CustomExceptionHandler` de `Shared` traduce `ValidationException`→400 con `errors`, `NotFoundException`→404 y excepciones no controladas→500 sin trazas. HU-003 ya adoptó este formato (ADR-04 de `api_003`).
- **Decisión:** Todo 400/404/409/500 se emite como `ProblemDetails` (`title`, `status`, `detail`); el 400 de validación añade `errors` como `{ campoCamelCase: [mensajes] }`. No se usa el sobre `{ "error", "message" }` de la plantilla genérica. El 401 lo emite el middleware sin cuerpo definido.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Formato único con HU-003 y reutilización del handler existente.
  - ⚠️ **Trade-off / Costo Real:** Difiere del formato de `api_001`; el 404 diferenciado Sprint/elemento solo se distingue por el texto de `detail` (no por un código de máquina), por lo que los clientes no deberían parsear el texto.

### ADR-08: Consulta sin paginación, orden estable y proyección en vivo desde Backlog
- **Estado:** Aceptado
- **Contexto:** Formato, orden y paginación no están definidos (punto abierto 7); SC-006 se mide hasta 100 elementos. Título, tipo y puntos pertenecen a `backlog` y no se duplican (ADR-06 del DA).
- **Decisión:** `GET` devuelve un arreglo plano con todos los elementos asignados, ordenado por `CreatedAt` y luego `Id` (⚠️ PROPUESTO; solo estabilidad, no contrato de negocio), sin parámetros de consulta. Los datos se obtienen con una sola llamada de lote `IBacklogModuleApi.GetSummariesAsync`. Los ids que Backlog no devuelva se omiten con `LogWarning`.
- **Alternativas Evaluadas:**
  - **Alternativa A:** Paginación `page`/`pageSize` con sobre `{ items, total }`. Descartada: no requerida y cambiaría la forma de arreglo del OpenAPI.
  - **Alternativa B:** Copiar título, tipo y puntos a `SprintItems`. Descartada: duplica datos de otro schema y puede desincronizarse (ADR-06 del DA).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Contrato mínimo, sin N+1, dato siempre vigente.
  - ⚠️ **Trade-off / Costo Real:** Si un elemento deja de existir en Backlog, la respuesta trae menos elementos que filas, contradiciendo SC-004 en ese caso límite; con miles de elementos se requerirá paginación (cambio incompatible de forma).

---

## 2. ESPECIFICACIONES GLOBALES
- **Autenticación:** JWT en `Authorization: Bearer <token>` (Keycloak). Todas las operaciones.
- **Base URL:** `/api/sprints/{sprintId}/items`
- **Content-Type de error:** `application/problem+json`
- **Nomenclatura JSON:** camelCase.
- **Identificadores:** GUID en texto (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`), distintos de `Guid.Empty`.

### Esquemas
| Esquema | Campos |
|---|---|
| `AssignItemRequest` | `itemId` (`string?`, GUID, obligatorio) |
| `AssignedItemResponse` | `sprintId` (`uuid`), `itemId` (`uuid`) |
| `SprintItemResponse` | `id` (`uuid`), `title` (`string`), `type` (`string`), `devPoints` (`number?`), `qaPoints` (`number?`) |
| `ValidationProblem` | `title`, `status`, `detail`, `errors` (`{ campo: string[] }`) |
| `Problem` | `title`, `status`, `detail` |

### Mapeo payload → columnas / fuentes (`db_004`)
| Campo JSON | Origen | Nota |
|---|---|---|
| `sprintId` (ruta y respuesta) | `sprints."SprintItems"."SprintId"` (FK a `sprints."Sprints"`) | Verificado por `AnyAsync` sobre `Sprints` y por la FK |
| `itemId` (request y respuesta) | `sprints."SprintItems"."ItemId"` (sin FK, `UX_SprintItems_ItemId`) | Existencia verificada por `IBacklogModuleApi.ExistsAsync` |
| `id` (`SprintItemResponse`) | `BacklogItemSummary.Id` (= `ItemId`) | Origen `backlog`, vía contrato in-process |
| `title`, `type`, `devPoints`, `qaPoints` | `BacklogItemSummary` (schema `backlog`) | Sin columna en `sprints` (ADR-06 del DA); `type` como texto |
| *(no expuesto)* | `Id`, `CreatedAt`, `CreatedBy`, `LastModified`, `LastModifiedBy` | `CreatedBy` = `sub`; `LastModified*` siempre `NULL` |

---

## 3. ENDPOINTS DEFINIDOS

### Endpoint: `POST /api/sprints/{sprintId}/items`
- **Tarea Spec Kit:** T020, T021, T022, T023, T028 (US1, US3, US4); pruebas T018, T019, T025–T027, T030–T032
- **Propósito Funcional:** Asignar un elemento registrado del backlog a un Sprint existente, un elemento por solicitud (FR-001..FR-004, FR-006, FR-007, FR-010..FR-012).
- **Parámetro de ruta:** `sprintId` (`string`, GUID; sin restricción `:guid`, ADR-03).
- **Request Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <token>`
- **Request Body (Payload JSON):**
```json
{
    "itemId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```
- **Respuestas (Status Codes):**
  - ✅ **201 Created** (Happy Path; FR-001, FR-002, FR-003). Header `Location: /api/sprints/3fa85f64-5717-4562-b3fc-2c963f66afa6/items`:
  ```json
  {
      "sprintId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "itemId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - `itemId` ausente, vacío, no-GUID o `Guid.Empty`; FR-007):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "itemId": ["El identificador del elemento es obligatorio."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - `sprintId` de ruta malformado o `Guid.Empty`; FR-007):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "sprintId": ["El identificador del Sprint tiene un formato inválido."]
      }
  }
  ```
  - ❌ **401 Unauthorized** (Sad Path - Sin token, inválido o expirado; FR-010). Sin cuerpo definido; emitido por el middleware de autenticación. No se lee ni persiste nada.
  - ❌ **404 Not Found** (Sad Path - Sprint inexistente; FR-005). Gana si no existen ni el Sprint ni el elemento:
  ```json
  {
      "title": "Not Found",
      "status": 404,
      "detail": "El Sprint no existe."
  }
  ```
  - ❌ **404 Not Found** (Sad Path - Elemento inexistente; FR-006):
  ```json
  {
      "title": "Not Found",
      "status": 404,
      "detail": "El elemento no existe."
  }
  ```
  - ❌ **409 Conflict** (Sad Path - Regla de negocio: el elemento ya está asignado a un Sprint, el mismo u otro; resolución humana A). No revela cuál:
  ```json
  {
      "title": "Conflict",
      "status": 409,
      "detail": "El elemento ya está asignado a un Sprint."
  }
  ```
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de persistencia o de otra restricción; FR-012). Sin trazas ni asignación parcial:
  ```json
  {
      "title": "An error occurred while processing your request.",
      "status": 500,
      "detail": "Ha ocurrido un error inesperado al procesar la solicitud."
  }
  ```
- **Notas:** El contrato vinculante es el código de estado y la clave de campo; los textos exactos los fija `SprintItemRules` (T006). No hay 403. Un solo `SaveChangesAsync` por solicitud garantiza ausencia de filas parciales.

### Endpoint: `GET /api/sprints/{sprintId}/items`
- **Tarea Spec Kit:** T036, T037, T038, T039 (US2); pruebas T034, T035, T030
- **Propósito Funcional:** Consultar exactamente los elementos asignados a un Sprint (FR-008, FR-009, FR-005, SC-004, SC-006). ⚠️ PROPUESTO por la HU; solo lectura (`AsNoTracking`).
- **Parámetro de ruta:** `sprintId` (`uuid`, restricción `{sprintId:guid}`).
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Request Body:** Ninguno. Sin parámetros de consulta (sin paginación ni filtros).
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path; FR-008), ordenado por `CreatedAt` y luego `Id`. Sin `status` ni auditoría; `qaPoints` es `null` para un elemento técnico:
  ```json
  [
      {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "title": "Registrar historia de usuario",
          "type": "UserStory",
          "devPoints": 5,
          "qaPoints": 2.5
      },
      {
          "id": "0b8f3c52-9a41-4d7e-bd13-6a2c1f4e8b77",
          "title": "Migrar esquema de catálogo",
          "type": "Technical",
          "devPoints": 3,
          "qaPoints": null
      }
  ]
  ```
  - ✅ **200 OK** (Sprint sin elementos; FR-009): `[]`
  - ❌ **401 Unauthorized** (Sad Path; FR-010). Sin cuerpo; no se lee ningún dato de asignación.
  - ❌ **404 Not Found** (Sad Path - Sprint inexistente; FR-005):
  ```json
  {
      "title": "Not Found",
      "status": 404,
      "detail": "El Sprint no existe."
  }
  ```
- **Notas:** Un `sprintId` que no es GUID no coincide con la ruta por `{sprintId:guid}` y produce un 404 del enrutador sin `ProblemDetails` garantizado. Los valores de `type` son los nombres del enum de Backlog como texto (los ejemplos son ilustrativos).

### Matriz de trazabilidad Spec → Contrato

| Requisito | Endpoint | Código |
|---|---|---|
| FR-001, FR-002, FR-003, FR-004 | `POST /api/sprints/{sprintId}/items` | 201 |
| FR-005 | `POST` y `GET` | 404 (Sprint) |
| FR-006 | `POST` | 404 (elemento) |
| FR-007 | `POST` | 400 |
| Resolución humana A (reemplaza FR-015) | `POST` | 409 |
| FR-008, FR-009 | `GET /api/sprints/{sprintId}/items` | 200 |
| FR-010 | Ambos | 401 |
| FR-011, FR-012 | `POST` | 400/401/404/409/500 sin persistencia; 500 sin traza |
| FR-013, FR-014 | Ausencia de `PUT`/`PATCH`/`DELETE` y de campos de estado | n/a |
| FR-016 | Carter, `.RequireAuthorization()`, `CustomExceptionHandler` | n/a |

---

## 4. DEPENDENCIAS BLOQUEANTES
- `⚠️ BLOQUEO:` Ninguno respecto a `db_004_asignacion_elementos_sprint.md`: cubre `SprintId`, `ItemId`, el índice único del 409 y la auditoría. Las proyecciones `title`, `type`, `devPoints` y `qaPoints` provienen de `backlog` por contrato in-process, sin tabla adicional.
- `⚠️ DISCREPANCIA (tipo de estimaciones):` `contracts/sprint-items-api.openapi.yaml`, `tasks.md` T005, T036 y T041 tipan `devPoints`/`qaPoints` como entero; `BacklogItem` los define `decimal?`. Debe reconciliarse a `decimal?` / `number | null` antes de implementar (ADR-04) y añadirse una prueba con QA nulo y un valor decimal.
- `⚠️ RIESGO (409 y Shared):` El 409 exige `ConflictException` y su rama en `CustomExceptionHandler` (T003/T004); un cambio no aditivo rompería los formatos 400/404/500 de HU-001..003 (T030 cubre la regresión).
- `⚠️ RIESGO (acoplamiento al nombre del índice):` La traducción 409 vs 500 depende de `ConstraintName = UX_SprintItems_ItemId`; renombrarlo sin actualizar `SprintItemRules.ItemIdUniqueIndexName` degradaría el conflicto a 500.
- `⚠️ RIESGO (reintento tras 201 perdido):` El segundo `POST` idéntico recibe 409; sin `Idempotency-Key` el cliente no distingue su propia asignación de otra.
- `⚠️ RIESGO (permisos y fuga de información):` Sin roles definidos (punto abierto 6), cualquier usuario autenticado asigna y consulta. El 409 no revela el Sprint dueño; ningún endpoint futuro debe exponer `ItemId → SprintId` sin definir permisos.
- `⚠️ RIESGO (consistencia de lectura y escala):` El `GET` puede devolver menos filas que `SprintItems` si Backlog omite ids (SC-004), y no pagina (válido hasta 100 elementos, SC-006).
- `⚠️ RIESGO (binding):` Un cuerpo con JSON roto o `itemId` no textual falla en el binding con un 400 sin errores por campo.
- `⚠️ RIESGO (spec obsoleta):` `spec.md` aún conserva FR-015 y trata el reasignado como no documentado; el 409 de este contrato depende de la reconciliación vinculante de `tasks.md`.

---

## 5. ORDEN DE DELEGACIÓN PARA EL TRACKER

@QT: Los contratos de integración (API) y endpoints para Asignación de Elementos del Backlog a un Sprint han sido definidos en api_004_asignacion_elementos_sprint.md basados en spec.md y db_004_asignacion_elementos_sprint.md. Por favor, procede con la auditoría cruzada y la compilación del Tech Design (TDD).
