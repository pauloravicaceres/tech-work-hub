# CONTRATO DE INTEGRACIÓN (API): Gestión de Sprint de Dos Semanas (Crear y Consultar)

- **Especificación SDD Base:** `specs/003-gestion-sprint-dos-semanas/spec.md`, `tasks.md` y `contracts/sprints-api.openapi.yaml` (Spec Kit)
- **Modelo Base de Datos:** `db-003-gestion-sprint-dos-semanas.md`
- **Fecha de Diseño:** 04-10-2026
- **API Architect:** Agente API Senior BMAD
- **Modo de gobernanza:** Brownfield (`.specify/memory/constitution.md` prevalece)

> **Dictamen de alcance:** tres endpoints sobre una única entidad (`sprints."Sprints"`): crear, listar y detalle. Las respuestas exponen solo `id`, `identification`, `startDate` y `endDate`; `CreatedAt`/`CreatedBy` se persisten pero **no se exponen**. Sin estado, sin paginación, sin filtros, sin relación con tarjetas de backlog (FR-013, FR-014).

---

## 1. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

### ADR-01: Protocolo y capa de interfaz (Carter Minimal APIs, VSA)
- **Estado:** Aceptado (heredado)
- **Contexto:** La Constitución (§2 y §7) exige Carter `ICarterModule`, MediatR, FluentValidation y Mapster, con Endpoint, Handler y Validador co-localizados por feature.
- **Decisión:** Tres features en `app/backend/src/Modules/Sprints/Features/Sprints/`: `CreateSprint/`, `ListSprints/` y `GetSprintById/`, cada una con su `*Endpoint.cs` (Carter) y su handler. `SprintResponse` es compartido en `Features/Sprints/`. Sin `[ApiController]` ni carpetas horizontales.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Mismo patrón que el módulo `Backlog`; cada endpoint es extraíble sin tocar los demás.
  - ⚠️ **Trade-off / Costo Real:** `SprintResponse` compartido por tres features crea un acoplamiento leve entre slices; un cambio en él afecta a los tres endpoints.

### ADR-02: Autenticación y autorización (Bearer JWT / Keycloak)
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-010 y la Constitución (§5) exigen `.RequireAuthorization()` en toda ruta no pública. Los permisos por rol no están documentados (punto abierto 7 de la HU).
- **Decisión:** Los tres endpoints exigen `Authorization: Bearer <JWT>` validado por `Keycloak.AuthServices.Authentication`, con `.RequireAuthorization()` sin política por rol: basta un token válido con identidad. El `CreatedBy` se toma del claim `sub` vía `ICurrentUser`, nunca del cuerpo.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Cualquier intento anónimo recibe 401 antes de leer o persistir datos (SC-004).
  - ⚠️ **Trade-off / Costo Real:** Cualquier usuario autenticado puede crear Sprints; al definirse roles habrá que añadir políticas y esto cambiaría el contrato con un nuevo 403.

### ADR-03: Fechas como cadenas `yyyy-MM-dd` en el request y validación en el pipeline
- **Estado:** Aceptado
- **Contexto:** FR-005 exige reportar por campo las fechas ausentes o mal formadas. Si el DTO tipara las fechas como `DateOnly`, un formato inválido fallaría en el binding JSON con un error genérico, sin detalle por campo.
- **Decisión:** `CreateSprintRequest` y `CreateSprintCommand` reciben `identification`, `startDate` y `endDate` como `string?`. `CreateSprintValidator` valida formato exacto `yyyy-MM-dd` (`DateOnly.TryParseExact`, `InvariantCulture`), fin ≤ inicio y ventana = 14 días. Los errores de ventana se asocian a `endDate`. El response devuelve las fechas como `date` ISO (`yyyy-MM-dd`).
- **Alternativas Evaluadas:**
  - **Alternativa A:** `DateOnly` directo en el request. Descartada: un `"05/10/2026"` produciría un error de deserialización no atribuible a un campo concreto, incumpliendo FR-005.
  - **Alternativa B:** `DateTime`/`DateTimeOffset` ISO 8601. Descartada: introduce hora y huso que el negocio no definió y puede desplazar la fecha un día, rompiendo la aritmética de 14 días (ver ADR-03 del DA).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Mensajes de error por campo deterministas y límites de ±1 día exactos.
  - ⚠️ **Trade-off / Costo Real:** El contrato tipa como `string` lo que semánticamente es una fecha; el OpenAPI no lo valida por esquema y los clientes deben respetar el formato. Un cliente que envíe un número JSON en una fecha recibirá un 400 de binding no estructurado por campo.

### ADR-04: Formato de errores `ProblemDetails` (`application/problem+json`)
- **Estado:** Aceptado (heredado)
- **Contexto:** El `CustomExceptionHandler` de `Shared` traduce `ValidationException`→400 con lista de errores, `NotFoundException`→404 y excepciones no controladas→500 sin trazas internas. El OpenAPI de la HU fija `application/problem+json`.
- **Decisión:** Todo error 400/404/500 se emite como `ProblemDetails` (`title`, `status`, `detail`), y el 400 de validación añade `errors` como objeto `{ campoCamelCase: [mensajes] }`. Se adopta este formato y **no** el sobre `{ "error", "message" }` de la plantilla genérica ni de `api-001`. El 401 lo emite el middleware de autenticación sin cuerpo definido.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Estándar RFC 9457, errores atribuibles a cada campo y reutilización del handler existente sin modificar `Shared`.
  - ⚠️ **Trade-off / Costo Real:** El formato difiere del de `api-001` (`error`/`message`/`errors[]`); el frontend de Sprints necesita su propio parseo. Si `Shared` no emite `errors` en camelCase, la T027 debe registrarlo como hallazgo.

### ADR-05: Listado sin paginación, orden determinista
- **Estado:** Aceptado
- **Contexto:** Orden, filtros y paginación no están definidos (punto abierto 9); SC-005 se mide hasta 100 Sprints.
- **Decisión:** `GET /api/sprints` devuelve un arreglo JSON plano con **todos** los Sprints, ordenados por `startDate` ascendente y luego `id`. Sin parámetros de consulta.
- **Alternativas Evaluadas:**
  - **Alternativa A:** Paginación (`page`, `pageSize`) con sobre `{ items, total }`. Descartada: no está requerida, añade un contrato que la HU-004 tendría que respetar y rompería la forma de arreglo del OpenAPI.
  - **Alternativa B:** Orden por `CreatedAt` desc. Descartada: expondría un dato de auditoría como criterio implícito y no está definido por el negocio.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Contrato mínimo y orden estable y testeable.
  - ⚠️ **Trade-off / Costo Real:** El tamaño de la respuesta crece linealmente con los Sprints; con miles de filas habrá que introducir paginación, lo que sería un cambio incompatible de la forma de respuesta (arreglo → sobre) o requeriría un parámetro opcional.

### ADR-06: Sin idempotencia ni control de duplicados en `POST`
- **Estado:** Aceptado
- **Contexto:** Unicidad de la identificación y solapamiento están sin definir (puntos abiertos 4 y 5); no existe escenario ni mensaje de duplicado y el DA no creó índice único (ADR-05 del DA).
- **Decisión:** `POST /api/sprints` no usa `Idempotency-Key` ni responde 409. Dos solicitudes idénticas crean dos Sprints.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 409 Conflict por identificación duplicada. Descartada: inventaría una regla de negocio no confirmada.
  - **Alternativa B:** Cabecera `Idempotency-Key`. Descartada: requiere almacenar claves, fuera del esquema aprobado por el DA.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Contrato sin reglas inventadas; la futura regla se añade de forma aditiva.
  - ⚠️ **Trade-off / Costo Real:** Un doble clic o reintento de red duplica el Sprint; la única mitigación es el botón deshabilitado en UI (T039). Añadir 409 después sería una respuesta nueva visible para clientes existentes.

---

## 2. ESPECIFICACIONES GLOBALES
- **Autenticación:** JWT en `Authorization: Bearer <token>` (Keycloak). Todas las operaciones.
- **Base URL:** `/api/sprints`
- **Content-Type de error:** `application/problem+json`
- **Formato de fecha (entrada y salida):** `yyyy-MM-dd`, sin hora ni huso.
- **Nomenclatura JSON:** camelCase.
- **Regla de ventana:** `endDate = startDate + 13 días` (14 días calendario inclusivos). Fuente única: `SprintRules.WindowDays`.

### Esquemas
| Esquema | Campos |
|---|---|
| `CreateSprintRequest` | `identification` (`string?`, ≤ 100), `startDate` (`string?`, `yyyy-MM-dd`), `endDate` (`string?`, `yyyy-MM-dd`) |
| `SprintResponse` | `id` (`uuid`), `identification` (`string`), `startDate` (`date`), `endDate` (`date`) |
| `ValidationProblem` | `title`, `status`, `detail`, `errors` (`{ campo: string[] }`) |
| `Problem` | `title`, `status`, `detail` |

### Mapeo payload → columnas (`db-003`)
| Campo JSON | Columna `sprints."Sprints"` | Nota |
|---|---|---|
| `id` | `Id` (`uuid`) | Generado por el servidor; no se acepta en el request |
| `identification` | `Identification` (`varchar(100)`) | NOT NULL, sin UNIQUE |
| `startDate` | `StartDate` (`date`) | NOT NULL |
| `endDate` | `EndDate` (`date`) | NOT NULL; `CK_Sprints_Window` |
| *(no expuesto)* | `CreatedAt`, `CreatedBy` | Interceptor; `CreatedBy` = `sub` |
| *(no expuesto)* | `LastModified`, `LastModifiedBy` | Siempre `NULL` en esta HU |

---

## 3. ENDPOINTS DEFINIDOS

### Endpoint: `POST /api/sprints`
- **Tarea Spec Kit:** T020, T021, T022, T026 (US1, US2); pruebas T018, T019, T024, T025
- **Propósito Funcional:** Crear un Sprint con ventana exacta de 2 semanas (FR-001..FR-006, FR-011..FR-015).
- **Request Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <token>`
- **Request Body (Payload JSON):**
```json
{
    "identification": "Sprint 2026-01",
    "startDate": "2026-10-05",
    "endDate": "2026-10-18"
}
```
- **Respuestas (Status Codes):**
  - ✅ **201 Created** (Happy Path). Header `Location: /api/sprints/3fa85f64-5717-4562-b3fc-2c963f66afa6`:
  ```json
  {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "identification": "Sprint 2026-01",
      "startDate": "2026-10-05",
      "endDate": "2026-10-18"
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Ventana distinta de 2 semanas: 7, 13, 15 o 21 días; FR-003):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "endDate": ["El Sprint debe abarcar exactamente una ventana de 2 semanas."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Fin anterior o igual al inicio; FR-004):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "endDate": ["La fecha de fin debe ser posterior a la fecha de inicio."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Campos obligatorios ausentes o formato inválido; FR-005):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "identification": ["La identificación del Sprint es obligatoria."],
          "startDate": ["La fecha de inicio debe tener el formato yyyy-MM-dd."]
      }
  }
  ```
  - ❌ **401 Unauthorized** (Sad Path - Sin token, inválido o expirado; FR-010). Sin cuerpo; emitido por el middleware de autenticación. No se persiste nada.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de persistencia; FR-011). Sin trazas internas ni Sprint parcial:
  ```json
  {
      "title": "An error occurred while processing your request.",
      "status": 500,
      "detail": "Ha ocurrido un error inesperado al procesar la solicitud."
  }
  ```
- **Notas:** Los textos exactos de los mensajes los fija `SprintRules` (T006); los aquí mostrados son ilustrativos y el contrato vinculante es el código de estado y la clave de campo. La regla de ventana se evalúa solo si ambas fechas parsean. No hay 403, 404 ni 409 en este endpoint.

### Endpoint: `GET /api/sprints`
- **Tarea Spec Kit:** T030, T031, T032 (US3); pruebas T028, T029
- **Propósito Funcional:** Listar todos los Sprints registrados (FR-007, SC-005). Solo lectura (`AsNoTracking`).
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Request Body:** Ninguno. Sin parámetros de consulta (sin paginación ni filtros).
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path), ordenado por `startDate` asc y luego `id`:
  ```json
  [
      {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "identification": "Sprint 2026-01",
          "startDate": "2026-10-05",
          "endDate": "2026-10-18"
      },
      {
          "id": "9b2f6c1e-1d4a-4e0b-8a57-3c1f2d7e9a10",
          "identification": "Sprint 2026-02",
          "startDate": "2026-10-19",
          "endDate": "2026-11-01"
      }
  ]
  ```
  - ✅ **200 OK** (sin Sprints registrados): `[]`
  - ❌ **401 Unauthorized** (Sad Path; FR-010). Sin cuerpo; no se lee ningún dato de Sprint.

### Endpoint: `GET /api/sprints/{id}`
- **Tarea Spec Kit:** T035, T036, T037 (US4); pruebas T033, T034
- **Propósito Funcional:** Consultar un Sprint por identificador (FR-008, FR-009). Solo lectura.
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Parámetro de ruta:** `id` (`uuid`, restricción `{id:guid}`).
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path):
  ```json
  {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "identification": "Sprint 2026-01",
      "startDate": "2026-10-05",
      "endDate": "2026-10-18"
  }
  ```
  - ❌ **401 Unauthorized** (Sad Path; FR-010). Sin cuerpo.
  - ❌ **404 Not Found** (Sad Path - Sprint inexistente; FR-009):
  ```json
  {
      "title": "Not Found",
      "status": 404,
      "detail": "El Sprint no existe."
  }
  ```
- **Notas:** Un `id` que no es GUID no coincide con la ruta por la restricción `{id:guid}` y no entra en este endpoint (404 del enrutador, sin cuerpo `ProblemDetails` garantizado).

### Matriz de trazabilidad Spec → Contrato

| Requisito | Endpoint | Código |
|---|---|---|
| FR-001, FR-002, FR-006 | `POST /api/sprints` | 201 |
| FR-003, FR-004, FR-005, FR-015 | `POST /api/sprints` | 400 |
| FR-007 | `GET /api/sprints` | 200 |
| FR-008 | `GET /api/sprints/{id}` | 200 |
| FR-009 | `GET /api/sprints/{id}` | 404 |
| FR-010 | Los tres | 401 |
| FR-011, FR-012 | `POST /api/sprints` | 500 |
| FR-013, FR-014 | Ausencia de endpoints PUT/PATCH/DELETE y de campos de estado o tarjeta | n/a |

---

## 4. DEPENDENCIAS BLOQUEANTES
- `⚠️ BLOQUEO:` Ninguno. `db-003-gestion-sprint-dos-semanas.md` cubre los cuatro campos expuestos y la auditoría.
- `⚠️ RIESGO (formato de errores):` `CustomExceptionHandler` (en `Shared`, no modificable en esta HU) debe emitir `errors` por campo en camelCase y mapear `UnauthorizedAccessException`→401. Las tareas T023 y T027 solo verifican y documentan; si falta el mapeo queda como punto abierto, no como cambio en `Shared`.
- `⚠️ RIESGO (500 por CHECK):` Una violación de `CK_Sprints_Window` llega como `DbUpdateException` (500), no 400. Es inalcanzable por la API mientras `CreateSprintValidator` y `Sprint.Create` estén activos.
- `⚠️ RIESGO (supuestos de negocio):` Ventana de 14 días inclusivos (punto abierto 3), unicidad (4), solapamiento (5), fecha pasada (6), roles (7), modificación/eliminación (8) y paginación/orden (9) siguen sin definir; un cambio de cualquiera altera este contrato.
- `⚠️ RIESGO (HU-004):` La asignación de tarjetas a Sprint consumirá `GET /api/sprints/{id}` o un contrato in-process; no se define aquí ninguna interfaz `ISprintModuleApi` (fuera de alcance).

---

## 5. ORDEN DE DELEGACIÓN PARA EL TRACKER

@QT: Los contratos de integración (API) y endpoints para Gestión de Sprint de Dos Semanas (Crear y Consultar) han sido definidos en api-003-gestion-sprint-dos-semanas.md basados en spec.md y db-003-gestion-sprint-dos-semanas.md. Por favor, procede con la auditoría cruzada y la compilación del Tech Design (TDD).
