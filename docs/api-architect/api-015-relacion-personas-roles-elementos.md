# CONTRATO DE INTEGRACIÓN (API): Relación entre Personas, Roles y Elementos de Trabajo (Asignar y Consultar)

- **Especificación SDD Base:** `specs/015-relacion-personas-roles-elementos/spec.md`, `plan.md`, `research.md`, `quickstart.md` y `tasks.md` (Spec Kit)
- **Modelo Base de Datos:** `db-015-relacion-personas-roles-elementos.md`
- **Fecha de Diseño:** 04-10-2026
- **API Architect:** Agente API Senior BMAD
- **Modo de gobernanza:** Brownfield (`.specify/memory/constitution.md` prevalece)

> **Dictamen de alcance:** cuatro endpoints, tres de la HU y uno aditivo de solo lectura en `Backlog` para el selector del UX (SA ADR-006):
> 1. `POST /api/backlog-items/{itemId}/assignees`: asignar un miembro como responsable de un elemento (US1, US4, US5).
> 2. `GET /api/backlog-items/{itemId}/assignees`: personas y roles de un elemento (US2).
> 3. `GET /api/team-members/{memberId}/items`: elementos de un miembro (US3).
> 4. `GET /api/backlog-items`: listado mínimo `{ id, title, type }` de elementos (aditivo, módulo `Backlog`).
>
> Las respuestas **no exponen** `CreatedAt`, `CreatedBy`, `LastModified*`, estimaciones, estado ni Sprint del elemento. Sin `PUT`/`PATCH`/`DELETE` (quitar o reemplazar responsables está fuera de alcance, FR-015), sin paginación, sin filtros y sin tope de responsables. **No existe 409 en ningún endpoint:** la asignación duplicada es idempotente (resolución humana B).
>
> **Reconciliaciones con los artefactos previos:**
> - `specs/015-.../contracts/item-assignments-api.openapi.yaml` está referenciado por `plan.md`, `quickstart.md` y `tasks.md` pero **no existe en disco** (lo reportó el DA). Este documento es hoy la única definición HTTP completa; ver §4.
> - `spec.md` (Edge Case y FR-015) aún dice "no documentado" para la asignación duplicada. Es vinculante la resolución humana B y el ADR-004 del SA/DA (200 idempotente); la actualización de la spec es del BA.
> - **Formato real de errores:** se verificó `Shared/Exceptions/CustomExceptionHandler.cs`. Difiere en tres puntos de lo descrito en `api-012` y se documenta aquí lo que el código emite: (a) todo 400, incluido el de `BadRequestException`, lleva `errors`; (b) el 500 emite `title` = "An unexpected error occurred." **sin `detail`**; (c) el 401 del handler emite `title` = "Unauthorized". Ver ADR-05.

---

## 1. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

### ADR-01: Protocolo y capa de interfaz (Carter Minimal APIs, VSA)
- **Estado:** Aceptado (heredado)
- **Contexto:** La Constitución (§2 y §7) exige Carter `ICarterModule`, MediatR, FluentValidation y Mapster, con Endpoint, Handler y Validador co-localizados por feature, y prohíbe `[ApiController]` y carpetas horizontales.
- **Decisión:** Tres features en `Teams` bajo `Features/ItemAssignments/` (`AssignMemberToItem/`, `ListItemAssignees/`, `ListMemberItems/`) y una en `Backlog` (`Features/BacklogItems/ListBacklogItems/`), cada una con su `*Endpoint.cs`. Los tres DTO de respuesta (`ItemAssigneeResponse`, `AssigneeResponse`, `MemberItemResponse`) viven en `Features/ItemAssignments/`. Request → Command con `request.Adapt<T>()` (Mapster) donde aplique.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Mismo patrón que HU-012; cada endpoint se audita contra una historia de usuario.
  - ⚠️ **Trade-off / Costo Real:** Varios ficheros por modelos de dos a cuatro campos (costo fijo de VSA). Los endpoints de `Teams` cuelgan de rutas `/api/backlog-items/...`, prefijo que en otras features pertenece a `Backlog`: una colisión de rutas entre módulos sería un error de arranque, no de compilación.

### ADR-02: Autenticación y autorización (Bearer JWT / Keycloak)
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-011 y la Constitución (§5) exigen `.RequireAuthorization()` en toda ruta no pública. Los permisos por rol de acceso no están documentados (CB-11).
- **Decisión:** Los cuatro endpoints exigen `Authorization: Bearer <JWT>` validado por `Keycloak.AuthServices.Authentication`, con `.RequireAuthorization()` sin política por rol. `CreatedBy` sale del claim `sub` vía `ICurrentUser`, nunca del cuerpo.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Todo intento anónimo, inválido o expirado recibe 401 antes de leer o persistir (SC-004), incluido `GET /api/backlog-items`.
  - ⚠️ **Trade-off / Costo Real:** Cualquier usuario autenticado puede asignar a cualquiera a cualquier elemento y consultar la carga de cualquier miembro. Al definirse roles de acceso se añadirá un 403 visible para clientes existentes.

### ADR-03: Identificadores como `string` en el `POST`; `:guid` en las consultas
- **Estado:** Aceptado
- **Contexto:** FR-010 exige 400 con detalle **por campo** ante identificador ausente o con formato inválido (SC-08: "no-es-id"). Un `Guid` tipado en la ruta o en el cuerpo produciría 404 de enrutador o un 400 de binding sin atribución de campo. SA ADR-008 lo fija.
- **Decisión:** En el `POST`, `itemId` (ruta) y `memberId` (cuerpo) se reciben como `string`; el validador exige presencia, `Guid.TryParse` exitoso y distinto de `Guid.Empty`, con errores bajo las claves `itemId` y `memberId`. En los dos `GET` con parámetro de ruta se usa la restricción `:guid`: un identificador malformado **no enruta** (404 del enrutador, sin `ProblemDetails`).
- **Alternativas Evaluadas:**
  - **Alternativa A:** `Guid` tipado también en el `POST`. Descartada: el 400 por campo de SC-08 sería inalcanzable; un valor "no-es-id" daría 404 o un 400 genérico de binding.
  - **Alternativa B:** `string` + validación también en los `GET`. Descartada: la HU no define 400 para consultas (solo 200/401) y los selectores de la UI impiden el caso.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** El contrato de `POST` cumple SC-08 literalmente y los `GET` quedan sin rama de validación.
  - ⚠️ **Trade-off / Costo Real:** Tratamiento asimétrico del mismo identificador: malformado ⇒ 400 en `POST` y 404 sin cuerpo en `GET`. El OpenAPI futuro debe declarar `itemId` como `string` en `POST` y `string/uuid` en `GET`; un generador de clientes que unifique ambos tipos rompería la validación por campo.

### ADR-04: `POST` idempotente: 201 Created al crear, 200 OK si el par ya existía
- **Estado:** Aceptado
- **Contexto:** Resolución humana B del tracker: asignar dos veces el mismo miembro al mismo elemento no es error ni duplica. FR-003 solo exige "código de éxito"; la UX distingue "asignado" de "ya era responsable". Debe resistir solicitudes concurrentes (índice único del DA, ADR-04 del DA).
- **Decisión:** `POST` responde **201 Created** con cabecera `Location: /api/backlog-items/{itemId}/assignees` cuando inserta una fila, y **200 OK** con **el mismo cuerpo** `{ itemId, memberId, memberName, role }` cuando el par ya existía o cuando perdió la carrera contra una solicitud simultánea. No hay bandera en el cuerpo: el cliente lee el código HTTP. Un duplicado no escribe, no altera `CreatedAt`/`CreatedBy` y no devuelve 409.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 409 Conflict ante duplicado. Descartada por la resolución humana B; además convertiría un reintento de red seguro en un error visible.
  - **Alternativa B:** Siempre 200 y bandera `created: true|false` en el cuerpo. Descartada: pierde la semántica HTTP de creación (`Location`) y mete metadatos de operación en el recurso; el 201/200 ya los transporta.
  - **Alternativa C:** Siempre 201. Descartada: la UX no podría distinguir "ya era responsable" y se afirmaría una creación que no ocurrió.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Reintentos y doble clic son seguros: exactamente una de N solicitudes simultáneas obtiene 201 y las demás 200 con una sola fila (quickstart 11).
  - ⚠️ **Trade-off / Costo Real:** El cliente debe leer `observe: 'response'` para ver el código; un cliente que solo mire `2xx` perderá la distinción. Si se añade luego baja/reemplazo de responsables, el 200 "ya existe" deberá revisarse (un par dado de baja ¿se reactiva?). `Location` apunta a la colección de responsables del elemento, no a un recurso individual (no existe `GET` por par), lo que no cumple la lectura estricta de RFC 9110 §10.2.2.

### ADR-05: Formato de errores `ProblemDetails` (`application/problem+json`) tal como lo emite `Shared`
- **Estado:** Aceptado (heredado)
- **Contexto:** `CustomExceptionHandler` (en `Shared`, no modificable, FR-013) traduce: `ValidationException` → 400 con `errors`; `BadRequestException` → 400 con `errors { campo: [mensaje] }`; `BadHttpRequestException` → 400 con `errors { general: [mensaje] }`; `UnauthorizedAccessException` → 401 con `title` "Unauthorized" y `detail`; `NotFoundException` → 404 con `title` "Not Found" y `detail`; cualquier otra → 500 con `title` "An unexpected error occurred." y **sin `detail`** ni traza.
- **Decisión:** Todo 400/401(del handler)/404/500 se emite como `ProblemDetails`. El 404 distingue miembro de elemento **solo por `detail`** (textos literales de `ItemAssignmentRules`: "El miembro indicado no existe." / "El elemento indicado no existe."). El 400 de validación lleva `errors` con clave `itemId` o `memberId`. Se adopta este formato y **no** el sobre `{ "error", "message" }` de la plantilla genérica.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Cero cambios en `Shared`; errores atribuibles a cada campo; mismo formato que HU-012 y HU-004.
  - ⚠️ **Trade-off / Costo Real:** No hay código máquina-legible: el cliente distingue "miembro inexistente" de "elemento inexistente" comparando el texto de `detail`, que es frágil ante cambios de redacción o i18n del backend. El `detail` literal es parte del contrato (lo fija `ItemAssignmentRules` y lo prueban T034/T036). `api-012` documenta un 500 con `detail` y un `title` distinto; ese documento está desactualizado respecto del código.

### ADR-06: Orden de evaluación determinista del `POST`
- **Estado:** Aceptado
- **Contexto:** Un mismo request puede incumplir varias reglas (ambos ids inexistentes, un id malformado y el otro inexistente). SA ADR-008 y `research.md` D6 fijan una única secuencia.
- **Decisión:** (0) middleware de autenticación: token ausente/inválido/expirado ⇒ 401 sin cuerpo definido. (1) `AssignMemberToItemValidator` (`ValidationBehavior`): 400 por campo. (2) El handler exige identidad (`ICurrentUser.UserId`); sin `sub` ⇒ 401. (3) Miembro inexistente ⇒ 404 "El miembro indicado no existe." (4) Elemento inexistente vía `IBacklogItemLookup.ExistsAsync` ⇒ 404 "El elemento indicado no existe." (5) Par ya existente ⇒ 200 sin escribir. (6) Un único `SaveChangesAsync` ⇒ 201; ante `DbUpdateException` 23505 del índice `UX_ItemAssignments_ItemId_MemberId` se relee la fila ganadora ⇒ 200; cualquier otro fallo ⇒ 500. Si faltan miembro y elemento, **gana el 404 del miembro**.
- **Alternativas Evaluadas:**
  - **Alternativa A:** Verificar el elemento antes que el miembro. Descartada: el miembro es una consulta local barata y evita llamar al contrato cross-módulo cuando el request ya es inválido.
  - **Alternativa B:** Acumular ambos 404 en una sola respuesta. Descartada: obligaría a invocar siempre el contrato y a inventar un cuerpo de error compuesto que la HU no define (SC-06/SC-07 los tratan por separado).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Respuesta predecible y testeable; el contrato in-process no se invoca ante miembro inexistente.
  - ⚠️ **Trade-off / Costo Real:** Un cliente con ambos ids inexistentes ve solo el 404 del miembro y necesita un segundo intento para descubrir el del elemento. Un token sin `sub` con cuerpo inválido recibe 400 y no 401 (el token ya pasó el middleware); caso límite aceptado.

### ADR-07: Consultas como arreglo JSON plano, sin 404 para ids inexistentes
- **Estado:** Aceptado
- **Contexto:** La HU solo define 200 (con contenido o vacío) y 401 para las consultas; formato, orden, filtros y paginación están sin definir (punto abierto 7). D7 de `research.md` propone 200 `[]` para identificadores bien formados pero inexistentes.
- **Decisión:** `GET .../assignees`, `GET /api/team-members/{memberId}/items` y `GET /api/backlog-items` devuelven un arreglo JSON plano con **todo** lo existente, sin parámetros de consulta. Orden ⚠️ [PROPUESTO] y **no contractual**. Un elemento o miembro bien formado pero inexistente responde `200 []`, no 404. Sin relaciones ⇒ `200 []`.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 404 si el elemento/miembro no existe. Descartada: exigiría que `ListItemAssignees` invoque el contrato (o `ListMemberItems` consulte `TeamMembers`), y la HU no define ese código; los selectores impiden el caso.
  - **Alternativa B:** Paginación con sobre `{ items, total }`. Descartada: no requerida y rompe la forma de arreglo.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Contrato mínimo, sin llamadas cross-módulo en `ListItemAssignees`; la UI pinta lo recibido.
  - ⚠️ **Trade-off / Costo Real:** Un cliente de API directo no puede distinguir "elemento sin responsables" de "elemento que no existe": ambos devuelven `[]`. El tamaño crece linealmente y pasar a paginación sería incompatible; `ListMemberItems` envía todos los `ItemId` en un lote sin tope al contrato.

### ADR-08: Integridad de elementos huérfanos en `GET /api/team-members/{memberId}/items`
- **Estado:** Aceptado
- **Contexto:** `ItemId` no tiene FK (la Constitución §3.2.3 lo prohíbe); el título y el tipo viven en `backlog` y se obtienen con una única llamada de lote a `IBacklogItemLookup.GetItemsAsync`.
- **Decisión:** Si el contrato no devuelve algún `ItemId` de la relación, **se omite** del resultado y se registra `LogWarning` (sin nombre del miembro); nunca se inventa un título. La respuesta es la intersección entre las relaciones del miembro y los elementos que `Backlog` conoce.
- **Alternativas Evaluadas:**
  - **Alternativa A:** Devolver `{ id, title: null, type: null }` para el huérfano. Descartada: viola el esquema `string` no nulo y expone un estado inconsistente.
  - **Alternativa B:** Responder 500 ante el huérfano. Descartada: un dato residual de otro módulo no debe romper la consulta de toda la lista.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** La consulta es robusta ante datos residuales y respeta el aislamiento de schemas.
  - ⚠️ **Trade-off / Costo Real:** La respuesta puede tener menos elementos que filas en `ItemAssignments` sin que el cliente lo sepa; viola silenciosamente SC-007 ("conjunto exacto") si algún día se borran elementos. Hoy es inalcanzable porque no existe baja de elementos.

### ADR-09: Endpoint aditivo `GET /api/backlog-items` en el módulo `Backlog`
- **Estado:** Aceptado
- **Contexto:** El UX requiere un selector de elementos; `Teams` no puede listarlos (FR-014) y un campo de texto con GUID induce errores. SA ADR-006.
- **Decisión:** Se añade `GET /api/backlog-items` en `Backlog` que devuelve `[{ id, title, type }]` (`type` = nombre del enum como `string`), sin estimaciones, estado, Sprint, descripción ni criterios de aceptación, sin paginación ni filtros, con `.RequireAuthorization()`.
- **Alternativas Evaluadas:**
  - **Alternativa A:** Endpoint de listado en `Teams`. Descartada: serviría datos ajenos y exigiría exponer el contrato `IBacklogItemLookup` con un método de listado total.
  - **Alternativa B:** Reutilizar un listado existente de `features/backlog`. Descartada: la inspección del plan indica que no existe un `GET` de colección en HU-001.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** El selector queda alimentado por una consulta mínima sin filtrar datos de planificación.
  - ⚠️ **Trade-off / Costo Real:** Amplía la superficie pública de HU-001 sin paginar: con miles de elementos el selector cargará todo. Cualquier usuario autenticado enumera todos los títulos del backlog. La compatibilidad con el `POST /api/backlog-items` existente depende de la prueba de no regresión T020.

---

## 2. ESPECIFICACIONES GLOBALES
- **Autenticación:** JWT en `Authorization: Bearer <token>` (Keycloak). Todas las operaciones.
- **Base URL:** `/api/backlog-items` (asignación y consulta por elemento; listado de elementos) y `/api/team-members` (consulta por miembro). Rutas de API independientes de las rutas de UI `/equipos/responsables` y `/equipos/responsables/miembro`.
- **Content-Type de error:** `application/problem+json` (400, 404 y 500 y el 401 emitido por el handler); el 401 del middleware no define cuerpo.
- **Nomenclatura JSON:** camelCase.
- **Idioma de mensajes:** español en los mensajes de dominio (`ItemAssignmentRules`). El contrato vinculante es el código de estado, la clave de campo en `errors` y, para el 404, el texto literal de `detail`.

### Esquemas
| Esquema | Campos |
|---|---|
| `AssignMemberRequest` | `memberId` (`string?`, obligatorio; GUID en texto, distinto de `00000000-0000-0000-0000-000000000000`) |
| `ItemAssigneeResponse` | `itemId` (`uuid`), `memberId` (`uuid`), `memberName` (`string`), `role` (`string`, nombre del rol técnico vigente del miembro) |
| `AssigneeResponse` | `id` (`uuid`, del miembro), `name` (`string`), `role` (`string`) |
| `MemberItemResponse` | `id` (`uuid`, del elemento), `title` (`string`), `type` (`string`, nombre del enum de `BacklogItem`) |
| `BacklogItemSummaryResponse` | `id` (`uuid`), `title` (`string`), `type` (`string`) |
| `ValidationProblem` | `type`, `title`, `status`, `errors` (`{ campo: string[] }`) |
| `Problem` | `title`, `status`, `detail` (ausente en el 500) |

### Mapeo payload → columnas (`db-015`)
| Campo JSON | Origen | Nota |
|---|---|---|
| `{itemId}` (ruta del `POST`) → `ItemAssigneeResponse.itemId` | `teams."ItemAssignments"."ItemId"` (`uuid NOT NULL`, **sin FK**) | Verificado por `IBacklogItemLookup.ExistsAsync` antes de insertar; `Guid.Empty` rechazado por validador y factoría |
| `AssignMemberRequest.memberId` → `ItemAssigneeResponse.memberId` | `teams."ItemAssignments"."MemberId"` (`uuid NOT NULL`, FK `RESTRICT` a `TeamMembers."Id"`) | Debe existir en `TeamMembers` |
| `ItemAssigneeResponse.memberName`, `AssigneeResponse.name` | `teams."TeamMembers"."Name"` | JOIN local; no se persiste en la relación (ADR-05 del DA) |
| `ItemAssigneeResponse.role`, `AssigneeResponse.role` | `teams."TechnicalRoles"."Name"` vía `TeamMembers."TechnicalRoleId"` | JOIN local; **sin columna de rol** en `ItemAssignments`; el cliente no puede elegirlo (FR-005) |
| `AssigneeResponse.id` | `teams."TeamMembers"."Id"` (a través de `ItemAssignments."MemberId"`) | |
| `MemberItemResponse.id` | `teams."ItemAssignments"."ItemId"` | Filtro por `MemberId` con `IX_ItemAssignments_MemberId` |
| `MemberItemResponse.title`, `.type` | `backlog."BacklogItems"."Title"`, `."Type"` **solo vía** `IBacklogItemLookup.GetItemsAsync` → `BacklogItemRef` | Inaccesible por SQL desde `Teams` (FR-014); una llamada de lote |
| `BacklogItemSummaryResponse.*` | `backlog."BacklogItems"."Id"`, `."Title"`, `."Type"` | Lectura propia de `Backlog` (`AsNoTracking`) |
| *(no expuesto)* | `ItemAssignments."CreatedAt"`, `"CreatedBy"` | Interceptor; `CreatedBy` = `sub` del token (FR-004) |
| *(no expuesto)* | `ItemAssignments."LastModified"`, `"LastModifiedBy"` | Siempre `NULL` en esta HU |
| *(no expuesto)* | `BacklogItems."DevPoints"`, `"QaPoints"`, estado, Sprint | Intocables (FR-013) |

---

## 3. ENDPOINTS DEFINIDOS

### Endpoint: `POST /api/backlog-items/{itemId}/assignees`
- **Tarea Spec Kit:** T027, T028, T029, T035, T036, T041, T042 (US1, US4, US5); pruebas T016 a T018, T033, T034, T038, T039, T040
- **Propósito Funcional:** Asignar un miembro del equipo como responsable de un elemento del backlog (SC-01, SC-02, FR-001 a FR-005). Un miembro y un elemento por solicitud; varios responsables por elemento mediante solicitudes sucesivas (FR-002). Idempotente (ADR-04).
- **Request Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <token>`
- **Parámetro de ruta:** `itemId` (`string`; GUID en texto, ADR-03).
- **Request Body (Payload JSON):**
```json
{
    "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Respuestas (Status Codes):**
  - ✅ **201 Created** (Happy Path; SC-01 y SC-02, fila nueva). Header `Location: /api/backlog-items/{itemId}/assignees`:
  ```json
  {
      "itemId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "memberName": "Ana Torres",
      "role": "Desarrollo"
  }
  ```
  - ✅ **200 OK** (Happy Path idempotente; el par ya existía o carrera perdida). Mismo cuerpo, **sin** `Location` obligatorio, sin nueva fila ni cambio de auditoría:
  ```json
  {
      "itemId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "memberId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "memberName": "Ana Torres",
      "role": "Desarrollo"
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - `memberId` ausente, vacío, solo espacios, no GUID o `Guid.Empty`; SC-08, FR-010):
  ```json
  {
      "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
      "title": "One or more validation errors occurred.",
      "status": 400,
      "errors": {
          "memberId": ["El identificador del miembro es obligatorio."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - `itemId` de ruta no GUID o `Guid.Empty`, p. ej. `no-es-id`; SC-08). Clave `itemId`:
  ```json
  {
      "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
      "title": "One or more validation errors occurred.",
      "status": 400,
      "errors": {
          "itemId": ["El identificador del elemento no tiene un formato válido."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - ambos identificadores inválidos a la vez; el validador reporta los dos campos):
  ```json
  {
      "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
      "title": "One or more validation errors occurred.",
      "status": 400,
      "errors": {
          "itemId": ["El identificador del elemento no tiene un formato válido."],
          "memberId": ["El identificador del miembro es obligatorio."]
      }
  }
  ```
  - ❌ **401 Unauthorized** (Sad Path - Sin token, inválido o expirado, o token sin claim `sub`; SC-09, FR-011). Del middleware: sin cuerpo definido. Del handler (sin `sub`): `ProblemDetails` con `title` "Unauthorized". No se lee ni persiste nada.
  - ❌ **404 Not Found** (Sad Path - Miembro inexistente; SC-06, FR-009). También cuando faltan miembro **y** elemento:
  ```json
  {
      "title": "Not Found",
      "status": 404,
      "detail": "El miembro indicado no existe."
  }
  ```
  - ❌ **404 Not Found** (Sad Path - Elemento inexistente con miembro existente; SC-07, FR-009):
  ```json
  {
      "title": "Not Found",
      "status": 404,
      "detail": "El elemento indicado no existe."
  }
  ```
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de persistencia; SC-10, FR-012). Sin trazas, sin `detail`, sin relación parcial (un único `SaveChangesAsync`):
  ```json
  {
      "title": "An unexpected error occurred.",
      "status": 500
  }
  ```
- **Notas:**
  - Orden de evaluación (ADR-06): 401 middleware → 400 validador → 401 sin `sub` → 404 miembro → 404 elemento → 200 existente → 201 nuevo. Con identificadores malformados **no** se consulta la BD ni el contrato.
  - El rol de la respuesta es el rol técnico **vigente** del miembro (JOIN local). Cualquier `role`, `createdBy`, `createdAt` o `id` enviado en el cuerpo se ignora (el DTO solo define `memberId`).
  - Un cuerpo ausente o no-JSON, un `memberId` de tipo JSON distinto de string o un `Content-Type` ausente produce el 400 de binding (`errors.general`) o el 415 de ASP.NET, sin atribución de campo (no cubierto por la HU). Un cuerpo `{}` o `{ "memberId": null }` sí llega al validador y da `errors.memberId`.
  - Los textos de `errors` son ilustrativos (los fija `ItemAssignmentRules`); los literales de `detail` del 404 sí son contractuales (ADR-05). El contrato vinculante de 400 es el código de estado y las claves `itemId`/`memberId`.
  - La asignación **no** modifica `devPoints`, `qaPoints`, estado, Sprint, registro del miembro ni su rol (FR-013).

### Endpoint: `GET /api/backlog-items/{itemId}/assignees`
- **Tarea Spec Kit:** T046, T047 (US2); pruebas T043, T044, T038, T040
- **Propósito Funcional:** Consultar las personas, con su rol técnico, relacionadas con un elemento (SC-03, SC-04, FR-006, FR-008). Solo lectura (`AsNoTracking`).
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Parámetro de ruta:** `itemId` (`uuid`, restricción `:guid`, ADR-03).
- **Request Body:** Ninguno. Sin parámetros de consulta.
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path; SC-03), exactamente las personas relacionadas, orden no contractual:
  ```json
  [
      {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Ana Torres",
          "role": "Desarrollo"
      },
      {
          "id": "9b2f6c1e-1d4a-4e0b-8a57-3c1f2d7e9a10",
          "name": "Luis Rojas",
          "role": "QA"
      }
  ]
  ```
  - ✅ **200 OK** (elemento sin responsables, o `itemId` bien formado pero inexistente; SC-04, D7): `[]`
  - ❌ **401 Unauthorized** (Sad Path; SC-09). Sin cuerpo; no se lee ningún dato.
  - ❌ **404 Not Found** (sin cuerpo de aplicación): únicamente cuando `itemId` no es un GUID (la ruta no enruta). No es un 404 de negocio.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de lectura). Sin trazas:
  ```json
  {
      "title": "An unexpected error occurred.",
      "status": 500
  }
  ```
- **Notas:** Una sola consulta con JOIN local `ItemAssignments` ↔ `TeamMembers` ↔ `TechnicalRoles` y proyección directa a `AssigneeResponse`. **No** invoca `IBacklogItemLookup` (T043). La respuesta nunca incluye `itemId`, `createdAt` ni `createdBy`. No hay 400.

### Endpoint: `GET /api/team-members/{memberId}/items`
- **Tarea Spec Kit:** T054, T055 (US3); pruebas T051, T052, T038, T040
- **Propósito Funcional:** Consultar los elementos del backlog relacionados con un miembro (SC-05, FR-007, FR-008). Solo lectura.
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Parámetro de ruta:** `memberId` (`uuid`, restricción `:guid`).
- **Request Body:** Ninguno. Sin parámetros de consulta.
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path; SC-05), exactamente los elementos relacionados, orden no contractual:
  ```json
  [
      {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "title": "Registrar usuarios",
          "type": "Story"
      },
      {
          "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
          "title": "Corregir cálculo de puntos",
          "type": "Bug"
      }
  ]
  ```
  - ✅ **200 OK** (miembro sin elementos, o `memberId` bien formado pero inexistente; D7): `[]`
  - ❌ **401 Unauthorized** (Sad Path; SC-09). Sin cuerpo; no se lee ningún dato.
  - ❌ **404 Not Found** (sin cuerpo de aplicación): únicamente cuando `memberId` no es un GUID.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de lectura o del contrato). Sin trazas:
  ```json
  {
      "title": "An unexpected error occurred.",
      "status": 500
  }
  ```
- **Notas:**
  - Una sola lectura de `ItemId` por `MemberId` y **una única** llamada de lote a `IBacklogItemLookup.GetItemsAsync(ids, ct)` (sin N+1). Con cero relaciones **no** se llama al contrato.
  - Elementos que el contrato ya no devuelve se omiten con `LogWarning` (ADR-08).
  - Los valores de `type` mostrados son ilustrativos; los literales son los nombres del enum de `BacklogItem` (HU-001), que `Teams` trata como `string` opaco.

### Endpoint: `GET /api/backlog-items`
- **Tarea Spec Kit:** T025 (US1, aditivo); pruebas T020
- **Propósito Funcional:** Alimentar el selector de elementos del diálogo de asignación (UX, ADR-09). No es una capacidad de la HU: es una consulta de soporte de solo lectura en `Backlog`.
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Request Body:** Ninguno. Sin parámetros de consulta.
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path; quickstart 12), sin estimaciones, estado ni Sprint:
  ```json
  [
      {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "title": "Registrar usuarios",
          "type": "Story"
      }
  ]
  ```
  - ✅ **200 OK** (sin elementos): `[]`
  - ❌ **401 Unauthorized** (Sad Path). Sin cuerpo; no se lee ningún dato.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de lectura). Sin trazas:
  ```json
  {
      "title": "An unexpected error occurred.",
      "status": 500
  }
  ```
- **Notas:** `GET /api/backlog-items` coexiste con el `POST /api/backlog-items` de HU-001 en la misma ruta base; no lo altera (T020 verifica no regresión). Sin paginación ni filtros.

### Matriz de trazabilidad Spec → Contrato

| Requisito | Endpoint | Código |
|---|---|---|
| FR-001, FR-002, FR-003, FR-004, FR-005 | `POST /api/backlog-items/{itemId}/assignees` | 201 |
| Resolución humana B (duplicado idempotente) | `POST /api/backlog-items/{itemId}/assignees` | 200 |
| FR-009 | `POST /api/backlog-items/{itemId}/assignees` | 404 (`detail` miembro / elemento) |
| FR-010 | `POST /api/backlog-items/{itemId}/assignees` | 400 (`errors.itemId` / `errors.memberId`) |
| FR-012 | `POST /api/backlog-items/{itemId}/assignees` | 500 (sin fila parcial) |
| FR-006 | `GET /api/backlog-items/{itemId}/assignees` | 200 (con datos o `[]`) |
| FR-007 | `GET /api/team-members/{memberId}/items` | 200 |
| FR-008 | Los dos `GET` de la HU | 200 sin escritura |
| FR-011 | Los cuatro | 401 |
| FR-013 | Los cuatro: sin campos de estimación, estado ni Sprint en ninguna respuesta; ninguna escritura sobre `BacklogItem`/`TeamMember` | n/a |
| FR-014 | `GET /api/team-members/{memberId}/items`, `POST` | Datos del elemento solo vía `IBacklogItemLookup` |
| FR-015 | Ausencia de `PUT`/`PATCH`/`DELETE`, de tope de responsables, de paginación y de reglas rol/estimación/estado | n/a |
| SC-001, SC-007 | `POST` + dos `GET` | Visibilidad inmediata en ambos sentidos |
| SC-003 | `POST` | 400/404 sin fila |
| SC-004 | Los cuatro | 401 |
| SC-006 | `POST` | 500 sin fila parcial |

---

## 4. DEPENDENCIAS BLOQUEANTES
- `⚠️ BLOQUEO:` Ninguno. `db-015-relacion-personas-roles-elementos.md` cubre todos los campos expuestos: `ItemId` y `MemberId` de la fila, `memberName` y `role` por JOIN local, y `title`/`type` por el contrato in-process (no persistidos en `teams`). La auditoría no se expone.
- `⚠️ RIESGO (OpenAPI inexistente):` `specs/015-.../contracts/item-assignments-api.openapi.yaml` es referenciado por `plan.md`, `quickstart.md` y `tasks.md` (encabezado "Prerequisites") y **no existe**. Este documento es la única definición HTTP. Debe generarse/sincronizarse desde aquí antes de implementar (el QA Técnico debe exigirlo o registrar la desviación); declarar `itemId` como `string` en el `POST` y `string/uuid` en los `GET` (ADR-03).
- `⚠️ RIESGO (formato de errores documentado en api-012):` `api-012` describe un 500 con `detail` y `title` distinto; el código real de `CustomExceptionHandler` emite `title` "An unexpected error occurred." sin `detail`. Pruebas o clientes escritos contra `api-012` fallarán. Este contrato sigue el código.
- `⚠️ RIESGO (distinción miembro/elemento por texto):` El cliente separa los dos 404 solo por `detail` (ADR-05). Cambiar la redacción de `ItemAssignmentRules.MemberNotFoundMessage`/`ItemNotFoundMessage` rompe la UI (Estados 8 y 9).
- `⚠️ RIESGO (cliente debe leer 201 vs 200):` Un cliente que ignore el código pierde la distinción "asignado" / "ya era responsable" (ADR-04).
- `⚠️ RIESGO (Backlog depende de Teams en compilación):` `IBacklogItemLookup` vive en `Teams.Contracts` y `Backlog` lo implementa (T002); si `BacklogModule` no registra `BacklogItemLookup` (T024), toda asignación y `ListMemberItems` fallarían en ejecución con error de resolución de DI (500), no en compilación.
- `⚠️ RIESGO (colisión de rutas entre módulos):` `Teams` y `Backlog` registran ambos rutas bajo `/api/backlog-items`. Un `MapGet`/`MapPost` duplicado exacto se detectaría solo al arrancar. Verificar con T061/T063.
- `⚠️ RIESGO (consulta de ids inexistentes indistinguible de vacío):` `200 []` para elemento o miembro inexistente (ADR-07) oculta errores de cliente (un GUID equivocado parece "sin responsables").
- `⚠️ RIESGO (ListMemberItems sin tope y con huérfanos):` Un lote `IN` ilimitado hacia `Backlog` y omisión silenciosa de elementos no encontrados (ADR-08).
- `⚠️ RIESGO (enumeración de datos sin permisos por rol):` Sin autorización por rol, cualquier token válido consulta la carga de cualquier persona y lista todos los elementos (CB-11, ADR-02).
- `⚠️ RIESGO (identificadores en logs):` El `LogWarning` de ADR-08 y los logs del `LoggingBehavior` no deben incluir `memberName` (T060).
- `⚠️ RIESGO (supuestos de negocio abiertos):` Máximo de responsables, baja o reemplazo, coherencia rol/estimaciones, restricciones por estado o Sprint, rol elegible por asignación y formato de consultas (puntos abiertos 1 a 7 de la HU) siguen sin definir; resolver cualquiera altera este contrato (p. ej. un `DELETE` o un `role` en el request). El rol derivado puede cambiar retroactivamente si HU-012 permite cambiar el rol de un miembro.

---

## 5. ORDEN DE DELEGACIÓN PARA EL TRACKER

@QT: Los contratos de integración (API) y endpoints para Relación entre Personas, Roles y Elementos de Trabajo (Asignar y Consultar) han sido definidos en api-015-relacion-personas-roles-elementos.md basados en spec.md y db-015-relacion-personas-roles-elementos.md. Por favor, procede con la auditoría cruzada y la compilación del Tech Design (TDD).
