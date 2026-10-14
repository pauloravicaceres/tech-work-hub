# CONTRATO DE INTEGRACIÓN (API): Miembros del Equipo y Roles Técnicos (Registrar y Consultar)

- **Especificación SDD Base:** `specs/012-HU_miembros_equipo_y_roles_tecnicos/spec.md`, `tasks.md` y `contracts/teams-api.openapi.yaml` (Spec Kit)
- **Modelo Base de Datos:** `db_012_miembros_equipo_y_roles_tecnicos.md`
- **Fecha de Diseño:** 04-10-2026
- **API Architect:** Agente API Senior BMAD
- **Modo de gobernanza:** Brownfield (`.specify/memory/constitution.md` prevalece)

> **Dictamen de alcance:** tres endpoints sobre dos entidades del schema `teams`: registrar miembro (`POST /api/team-members`), consultar miembros (`GET /api/team-members`) y consultar el catálogo de roles (`GET /api/technical-roles`). Las respuestas exponen solo `id`, `name` y `role` (miembro) e `id` y `name` (rol); `CreatedAt`/`CreatedBy` se persisten pero **no se exponen** (UX D-09). Sin estado, sin paginación, sin filtros, sin modificar/desactivar/eliminar miembros y sin alta, edición ni baja de roles (FR-015, puntos abiertos 1 a 8 de la HU). No hay 403, 404 ni 409 en ningún endpoint.
>
> **Reconciliación con el OpenAPI existente:** `contracts/teams-api.openapi.yaml` ya existe en disco (el DA lo daba por inexistente). Este contrato lo adopta sin contradicciones y añade lo que el OpenAPI no fija: orden de evaluación detallado, cuerpos de error por caso, mapeo payload → columnas y trazabilidad.

---

## 1. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

### ADR-01: Protocolo y capa de interfaz (Carter Minimal APIs, VSA)
- **Estado:** Aceptado (heredado)
- **Contexto:** La Constitución (§2 y §7) exige Carter `ICarterModule`, MediatR, FluentValidation y Mapster, con Endpoint, Handler y Validador co-localizados por feature, y prohíbe `[ApiController]` y carpetas horizontales.
- **Decisión:** Tres features en el módulo `Teams`: `Features/TeamMembers/RegisterTeamMember/`, `Features/TeamMembers/ListTeamMembers/` y `Features/TechnicalRoles/ListTechnicalRoles/`, cada una con su `*Endpoint.cs` (Carter), Command/Query, Validador (solo en registrar) y Handler. `TeamMemberResponse` y `TechnicalRoleResponse` son DTO compartidos dentro de su carpeta de agregado. Request → Command con `request.Adapt<T>()` (Mapster).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Mismo patrón que `Sprints`; cada endpoint se audita contra una historia de usuario (US1 a US5).
  - ⚠️ **Trade-off / Costo Real:** `TeamMemberResponse` lo comparten registrar y listar: un cambio de forma afecta a ambos endpoints y a la grilla del frontend. Varios ficheros por un modelo de dos campos (costo fijo de VSA).

### ADR-02: Autenticación y autorización (Bearer JWT / Keycloak)
- **Estado:** Aceptado (heredado)
- **Contexto:** FR-011 y la Constitución (§5) exigen `.RequireAuthorization()` en toda ruta no pública. Los permisos por rol de acceso no están documentados (punto abierto 6).
- **Decisión:** Los tres endpoints exigen `Authorization: Bearer <JWT>` validado por `Keycloak.AuthServices.Authentication`, con `.RequireAuthorization()` sin política por rol: basta un token válido con identidad. `CreatedBy` sale del claim `sub` vía `ICurrentUser`, nunca del cuerpo.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Cualquier intento anónimo, inválido o expirado recibe 401 antes de leer o persistir datos (SC-003).
  - ⚠️ **Trade-off / Costo Real:** Cualquier usuario autenticado puede registrar miembros. Al definirse roles de acceso habrá que añadir políticas y el contrato ganaría un 403 visible para clientes existentes.

### ADR-03: El rol se envía por nombre (`role`) y no por identificador
- **Estado:** Aceptado
- **Contexto:** Los escenarios de la spec expresan el rol como nombre ("Desarrollo", "QA", "Chef") y fijan 400 "rol no válido" (FR-006) distinto del 400 por campo ausente (FR-007). El SA lo fijó en su ADR-005.
- **Decisión:** `POST /api/team-members` recibe `{ "name": string?, "role": string? }`, con `role` = **nombre exacto** del rol del catálogo (comparación sensible a mayúsculas). La respuesta devuelve `role` como nombre; el `id` del rol solo aparece en `GET /api/technical-roles`. El rol inexistente se responde 400 con `detail` = "El rol indicado no es válido." (no 404).
- **Alternativas Evaluadas:**
  - **Alternativa A:** `roleId` (GUID) en el request. Descartada: "Chef" (SC-07) no es un identificador, un GUID malformado exigiría traducirse a "rol no válido" y la UI/pruebas deberían conocer GUID que la HU no menciona; el nombre ya es único por `UX_TechnicalRoles_Name`.
  - **Alternativa B:** Aceptar nombre o identificador indistintamente. Descartada: contrato ambiguo y superficie de pruebas duplicada sin requisito que lo pida.
  - **Alternativa C:** 404 por rol inexistente. Descartada: la spec fija explícitamente 400 (FR-006) y el rol es un valor del cuerpo, no un recurso de la ruta.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** El contrato coincide literalmente con los escenarios de negocio; el 400 por rol se distingue del 400 por campo por la presencia de `errors` frente a solo `detail`.
  - ⚠️ **Trade-off / Costo Real:** Si se permite renombrar roles (punto abierto 4), todo cliente que envíe el nombre se rompe y habrá que migrar a `roleId` con cambio de API versionado. "desarrollo" en minúsculas se rechaza; el selector de la UI evita el caso, un cliente de API directo lo sufre. La respuesta no incluye `roleId`, por lo que un consumidor que necesite el identificador debe cruzar con el catálogo por nombre.

### ADR-04: Código 201 Created con `Location` hacia la colección
- **Estado:** Aceptado
- **Contexto:** La HU solo dice "código de éxito" (FR-002). No existe `GET /api/team-members/{id}` (no hay consulta por identificador en alcance), por lo que no hay URL canónica del recurso individual. Es un valor ⚠️ [PROPUESTO] (research R-08).
- **Decisión:** `POST` responde **201 Created** con cuerpo `{ id, name, role }` y `Location: /api/team-members` (la colección), mediante `Results.Created("/api/team-members", response)`.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 200 OK. Descartada: el registro crea un recurso; 201 es el código semántico estándar y es la práctica de `api_001` y `api_003`.
  - **Alternativa B:** Crear `GET /api/team-members/{id}` solo para poblar `Location`. Descartada: inventa un endpoint sin escenario ni US que lo respalde (alcance mínimo, FR-015).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Semántica HTTP correcta sin ampliar la superficie de la API.
  - ⚠️ **Trade-off / Costo Real:** `Location` apunta a la colección y no al recurso creado, lo que no cumple la lectura estricta de RFC 9110 §10.2.2 (URI del recurso). Si más adelante se añade `GET /{id}`, el valor de `Location` cambiará y las pruebas que lo fijan (T027) deberán actualizarse.

### ADR-05: Formato de errores `ProblemDetails` (`application/problem+json`)
- **Estado:** Aceptado (heredado)
- **Contexto:** El `CustomExceptionHandler` de `Shared` traduce `ValidationException`→400 con `errors`, `BadRequestException`→400 con `detail`, `UnauthorizedAccessException`→401 y excepciones no controladas→500 sin trazas. El OpenAPI de la HU fija `application/problem+json`.
- **Decisión:** Todo 400/500 se emite como `ProblemDetails` (`title`, `status`, `detail`); el 400 de validación añade `errors` como `{ campoCamelCase: [mensajes] }` bajo las claves `name` y `role` (`TeamMemberRules.NameField`/`RoleField`). El 400 por rol inexistente lleva solo `detail`. Se adopta este formato y **no** el sobre `{ "error", "message" }` de la plantilla genérica ni de `api_001`. El 401 lo emite el middleware sin cuerpo definido.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Estándar RFC 9457, errores atribuibles a cada campo, reutilización de `Shared` sin modificarlo y mismo formato que `api_003`.
  - ⚠️ **Trade-off / Costo Real:** Difiere del formato de `api_001`; el frontend de Teams parsea `errors.name`/`errors.role` y `detail` por separado. Para distinguir "rol inexistente" de "campo inválido" el cliente depende de la ausencia de `errors` y del texto de `detail`, no de un código de error máquina-legible.

### ADR-06: Orden de evaluación determinista del `POST` (400 validador → 401 identidad → 400 rol)
- **Estado:** Aceptado
- **Contexto:** Un mismo request puede incumplir varias reglas (nombre vacío y rol "Chef"). El SA (§5) y el OpenAPI fijan una única secuencia. FR-011 exige 401 sin leer datos.
- **Decisión:** (0) El middleware de autenticación rechaza token ausente/inválido/expirado con 401 antes de MediatR. (1) `RegisterTeamMemberValidator` (400 por campo `name`/`role`, `ValidationBehavior`). (2) El handler resuelve `ICurrentUser.UserId`; sin claim `sub` ⇒ `UnauthorizedAccessException` (401). (3) El handler busca el rol por nombre; si no existe ⇒ `BadRequestException` (400, "El rol indicado no es válido."). (4) Un único `SaveChangesAsync`. Con nombre inválido **y** rol inexistente gana el 400 del validador: no se consulta la BD con datos ya inválidos.
- **Alternativas Evaluadas:**
  - **Alternativa A:** Resolver el rol antes de validar el nombre. Descartada: consulta la BD con un request ya inválido y mezcla dos clases de 400 en una sola respuesta.
  - **Alternativa B:** Acumular todos los errores (campo + rol) en un único 400. Descartada: exige consulta previa a la BD durante la validación y contradice el orden fijado por el SA.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Respuesta predecible y testeable (T036); cero lecturas de BD ante entradas inválidas.
  - ⚠️ **Trade-off / Costo Real:** Un cliente con dos errores necesita dos intentos para ver ambos: primero el de campo y luego el de rol. Que el 401 por falta de `sub` llegue después del validador significa que un token sin `sub` pero con cuerpo inválido recibe 400 y no 401; es un caso límite aceptado (el token pasó la autenticación del middleware).

### ADR-07: Colecciones como arreglo JSON plano, sin paginación, filtros ni orden configurable
- **Estado:** Aceptado
- **Contexto:** Formato de consulta, orden, filtros y paginación no están definidos (punto abierto 7); SC-007 se mide hasta 100 miembros.
- **Decisión:** `GET /api/team-members` y `GET /api/technical-roles` devuelven un arreglo JSON plano con **todo** lo registrado, sin parámetros de consulta. Orden ⚠️ [PROPUESTO] y **no contractual**: miembros por `CreatedAt` y `Id`; roles por `Name`. Sin registros ⇒ `200 []` (nunca 404).
- **Alternativas Evaluadas:**
  - **Alternativa A:** Paginación (`page`, `pageSize`) con sobre `{ items, total }`. Descartada: no está requerida y rompe la forma de arreglo del OpenAPI.
  - **Alternativa B:** Filtro opcional `?role=`. Descartada: invento fuera de alcance (punto abierto 7).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Contrato mínimo; la grilla pinta lo recibido sin lógica adicional.
  - ⚠️ **Trade-off / Costo Real:** El tamaño de la respuesta crece linealmente; a miles de miembros habrá que paginar, y pasar de arreglo a sobre sería un cambio incompatible (o un parámetro opcional que mantenga el arreglo por defecto). Como el orden no es contractual, los clientes no deben depender de él.

### ADR-08: Sin idempotencia ni control de duplicados en `POST`
- **Estado:** Aceptado
- **Contexto:** La unicidad del miembro (homónimos) no está definida (punto abierto 2) y el DA no creó índice único sobre `Name` (ADR-05 del DA).
- **Decisión:** `POST /api/team-members` no usa `Idempotency-Key` ni responde 409. Dos solicitudes idénticas crean dos miembros distintos.
- **Alternativas Evaluadas:**
  - **Alternativa A:** 409 Conflict por nombre duplicado. Descartada: inventaría una regla de negocio no confirmada y prohibiría homónimos legítimos.
  - **Alternativa B:** Cabecera `Idempotency-Key`. Descartada: requiere almacenar claves, fuera del esquema aprobado por el DA.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Sin reglas inventadas; añadir unicidad después es aditivo.
  - ⚠️ **Trade-off / Costo Real:** Un doble clic o un reintento de red tras un timeout duplica al miembro; la única mitigación es el botón deshabilitado durante `isSubmitting()`. Añadir 409 más tarde sería una respuesta nueva para clientes existentes.

---

## 2. ESPECIFICACIONES GLOBALES
- **Autenticación:** JWT en `Authorization: Bearer <token>` (Keycloak). Todas las operaciones.
- **Base URL:** `/api/team-members` y `/api/technical-roles` (rutas de API independientes de las rutas de UI `/equipos`).
- **Content-Type de error:** `application/problem+json` (400 y 500); el 401 no define cuerpo.
- **Nomenclatura JSON:** camelCase.
- **Idioma de mensajes:** español; los textos exactos los fija `TeamMemberRules`. El contrato vinculante es el código de estado y la clave de campo.

### Esquemas
| Esquema | Campos |
|---|---|
| `RegisterTeamMemberRequest` | `name` (`string?`, obligatorio, no vacío ni solo espacios, sin longitud máxima), `role` (`string?`, nombre de un rol del catálogo, obligatorio, no vacío ni solo espacios) |
| `TeamMemberResponse` | `id` (`uuid`), `name` (`string`), `role` (`string`, nombre del rol) |
| `TechnicalRoleResponse` | `id` (`uuid`), `name` (`string`) |
| `ValidationProblem` | `title`, `status`, `detail`, `errors` (`{ campo: string[] }`) |
| `Problem` | `title`, `status`, `detail` |

### Mapeo payload → columnas (`db_012`)
| Campo JSON | Columna | Nota |
|---|---|---|
| `TeamMemberResponse.id` | `teams."TeamMembers"."Id"` (`uuid`) | Generado por el servidor en `TeamMember.Create`; no se acepta en el request |
| `RegisterTeamMemberRequest.name` / `TeamMemberResponse.name` | `teams."TeamMembers"."Name"` (`text NOT NULL`) | Se persiste con `Trim()`; sin UNIQUE ni límite (ADR-05 del DA) |
| `RegisterTeamMemberRequest.role` | `teams."TechnicalRoles"."Name"` → `TeamMembers."TechnicalRoleId"` | El handler resuelve el nombre contra `UX_TechnicalRoles_Name` y guarda el `Id` en la FK |
| `TeamMemberResponse.role` | `teams."TechnicalRoles"."Name"` | Por `JOIN` local con `IX_TeamMembers_TechnicalRoleId` |
| `TechnicalRoleResponse.id` | `teams."TechnicalRoles"."Id"` (`uuid`) | GUID fijo de `TechnicalRoleSeed` |
| `TechnicalRoleResponse.name` | `teams."TechnicalRoles"."Name"` (`text NOT NULL`, único) | Semilla: `Desarrollo`, `QA` |
| *(no expuesto)* | `TeamMembers."CreatedAt"`, `"CreatedBy"` | Interceptor; `CreatedBy` = `sub` del token |
| *(no expuesto)* | `TeamMembers."LastModified"`, `"LastModifiedBy"` | Siempre `NULL` en esta HU |

---

## 3. ENDPOINTS DEFINIDOS

### Endpoint: `POST /api/team-members`
- **Tarea Spec Kit:** T030, T031, T032, T038 (US1, US4, US5); pruebas T026, T027, T028, T034, T035, T036, T040, T041
- **Propósito Funcional:** Registrar un miembro del equipo técnico con un rol del catálogo (FR-001 a FR-003, FR-006, FR-007, FR-011 a FR-014). Un miembro y un rol por solicitud.
- **Request Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <token>`
- **Request Body (Payload JSON):**
```json
{
    "name": "Ana Torres",
    "role": "Desarrollo"
}
```
- **Respuestas (Status Codes):**
  - ✅ **201 Created** (Happy Path; SC-01 y SC-02). Header `Location: /api/team-members`:
  ```json
  {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Ana Torres",
      "role": "Desarrollo"
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Nombre ausente, vacío o solo espacios; FR-007):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "name": ["El nombre del miembro es obligatorio."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Rol ausente, vacío o solo espacios; FR-007):
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "role": ["El rol técnico es obligatorio."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Ambos campos inválidos a la vez; FR-007). Se reportan los dos campos en la misma respuesta:
  ```json
  {
      "title": "One or more validation errors occurred.",
      "status": 400,
      "detail": "Validation failed",
      "errors": {
          "name": ["El nombre del miembro es obligatorio."],
          "role": ["El rol técnico es obligatorio."]
      }
  }
  ```
  - ❌ **400 Bad Request** (Sad Path - Rol inexistente en el catálogo, p. ej. "Chef"; FR-006). Sin `errors`:
  ```json
  {
      "title": "Bad Request",
      "status": 400,
      "detail": "El rol indicado no es válido."
  }
  ```
  - ❌ **401 Unauthorized** (Sad Path - Sin token, inválido o expirado, o token sin claim `sub`; FR-011). Sin cuerpo definido; emitido por el middleware de autenticación o por `CustomExceptionHandler`. No se lee ni persiste nada.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de persistencia; FR-013). Sin trazas internas ni miembro parcial:
  ```json
  {
      "title": "An error occurred while processing your request.",
      "status": 500,
      "detail": "Ha ocurrido un error inesperado al procesar la solicitud."
  }
  ```
- **Notas:**
  - Orden de evaluación (ADR-06): 401 de middleware → 400 de validador → 401 por falta de `sub` → 400 de rol inexistente → persistencia. Con nombre inválido y rol "Chef" a la vez, la respuesta es el 400 de validador por campo `name`.
  - `name` se guarda recortado: `"  Ana Torres  "` responde y persiste `"Ana Torres"`. La respuesta refleja el valor persistido.
  - `id` y `createdBy` enviados en el cuerpo se ignoran (el DTO no los define). `CreatedBy` proviene del `sub`.
  - Los textos de mensaje son ilustrativos (los fija `TeamMemberRules`, salvo `InvalidRoleMessage` = "El rol indicado no es válido." que sí es literal de la spec); el contrato vinculante es el código de estado y las claves `name`/`role`.
  - Un cuerpo no-JSON, un tipo JSON distinto de string en `name`/`role` o un `Content-Type` ausente produce el 400/415 de binding de ASP.NET, sin atribución por campo (no cubierto por la HU).

### Endpoint: `GET /api/team-members`
- **Tarea Spec Kit:** T048, T049 (US2); pruebas T045, T046, T040
- **Propósito Funcional:** Consultar los miembros registrados y verificar quién forma parte del equipo y con qué rol (FR-008, FR-009, SC-004, SC-007). Solo lectura (`AsNoTracking`).
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Request Body:** Ninguno. Sin parámetros de consulta (sin paginación ni filtros).
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path), ordenado por `CreatedAt` y luego `Id` (no contractual):
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
  - ✅ **200 OK** (sin miembros registrados; FR-009): `[]`
  - ❌ **401 Unauthorized** (Sad Path; FR-011). Sin cuerpo; no se lee ningún dato de miembros ni de roles.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de lectura). Sin trazas internas:
  ```json
  {
      "title": "An error occurred while processing your request.",
      "status": 500,
      "detail": "Ha ocurrido un error inesperado al procesar la solicitud."
  }
  ```
- **Notas:** Una sola consulta con `JOIN` local a `TechnicalRoles` y proyección directa a `TeamMemberResponse`. La respuesta nunca incluye `createdAt`, `createdBy` ni estado. No hay 400 (sin parámetros) ni 404.

### Endpoint: `GET /api/technical-roles`
- **Tarea Spec Kit:** T055 (US3); pruebas T052, T053, T040
- **Propósito Funcional:** Consultar el catálogo de roles técnicos disponibles para saber qué valor de `role` es válido al registrar (FR-004, FR-005, SC-005). Solo lectura (`AsNoTracking`).
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Request Body:** Ninguno. Sin parámetros de consulta.
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path), ordenado por `name` (no contractual). Contiene como mínimo "Desarrollo" y "QA" con los GUID fijos de `TechnicalRoleSeed`; los valores de `id` mostrados son ilustrativos:
  ```json
  [
      {
          "id": "11111111-1111-1111-1111-111111111111",
          "name": "Desarrollo"
      },
      {
          "id": "22222222-2222-2222-2222-222222222222",
          "name": "QA"
      }
  ]
  ```
  - ❌ **401 Unauthorized** (Sad Path; FR-011). Sin cuerpo; no se lee ningún dato.
  - ❌ **500 Internal Server Error** (Sad Path - Fallo de lectura). Sin trazas internas:
  ```json
  {
      "title": "An error occurred while processing your request.",
      "status": 500,
      "detail": "Ha ocurrido un error inesperado al procesar la solicitud."
  }
  ```
- **Notas:** El catálogo es de solo lectura. No existen `POST`, `PUT`, `PATCH` ni `DELETE` sobre `/api/technical-roles`; responden 404/405 del enrutador (T053). El `id` del rol es informativo para el cliente: **no** se usa en el request de registro (ADR-03). Un catálogo vacío no es alcanzable (la migración siembra dos filas); si ocurriera, respondería `200 []`.

### Matriz de trazabilidad Spec → Contrato

| Requisito | Endpoint | Código |
|---|---|---|
| FR-001, FR-002, FR-003, FR-010, FR-014 | `POST /api/team-members` | 201 |
| FR-006 | `POST /api/team-members` | 400 (`detail`, sin `errors`) |
| FR-007 | `POST /api/team-members` | 400 (`errors.name` / `errors.role`) |
| FR-011 | Los tres | 401 |
| FR-012, FR-013 | `POST /api/team-members` | 500 (sin fila parcial) |
| FR-008 | `GET /api/team-members` | 200 |
| FR-009 | `GET /api/team-members` | 200 `[]` |
| FR-004, FR-005 | `GET /api/technical-roles` | 200 |
| FR-015 | Ausencia de endpoints PUT/PATCH/DELETE, de `GET /{id}`, de alta de roles y de campos de estado, correo o varios roles | n/a |
| FR-016 | Los tres: Carter, `.RequireAuthorization()`, `CustomExceptionHandler`, schema `teams` | n/a |
| SC-007 | `GET /api/team-members`, `GET /api/technical-roles` | 200 en < 2 s con hasta 100 miembros |

---

## 4. DEPENDENCIAS BLOQUEANTES
- `⚠️ BLOQUEO:` Ninguno. `db_012_miembros_equipo_y_roles_tecnicos.md` cubre los tres campos expuestos del miembro (`Id`, `Name`, rol por `JOIN`), los dos del rol y la auditoría no expuesta.
- `⚠️ RIESGO (contrato OpenAPI ya existente):` `specs/012-HU_miembros_equipo_y_roles_tecnicos/contracts/teams-api.openapi.yaml` existe en disco y es coherente con este contrato, pero no define ejemplos de error ni distingue las variantes de 400. Debe mantenerse sincronizado con este documento (T062). El DA lo reportó como inexistente; la discrepancia es solo documental.
- `⚠️ RIESGO (formato de errores):` `CustomExceptionHandler` (en `Shared`, no modificable en esta HU) debe emitir `errors` por campo en camelCase para `ValidationException`, mapear `BadRequestException` a 400 con `detail` y `UnauthorizedAccessException` a 401. T043 y T040 solo verifican; si falta algún mapeo se registra como punto abierto, no como cambio en `Shared`.
- `⚠️ RIESGO (FK / UNIQUE llegan como 500):` Una violación de `FK_TeamMembers_TechnicalRoles_TechnicalRoleId` o de `UX_TechnicalRoles_Name` llega como `DbUpdateException` (500), no como 400. Es inalcanzable por la API mientras el handler resuelva el rol antes de insertar; solo se observaría por una carrera con una migración que elimine el rol.
- `⚠️ RIESGO (nombre sin límite):` Sin longitud máxima, un token válido puede enviar un nombre muy grande hasta el límite de cuerpo de Kestrel (30 MB por defecto). La API no impone límite adicional porque FR-015 prohíbe inventarlo; si el negocio lo fija, se añade validador (400) y migración, y el contrato gana una regla visible (CB-06).
- `⚠️ RIESGO (doble registro):` Sin idempotencia ni unicidad, un reintento tras timeout duplica al miembro (ADR-08). Mitigación solo en UI.
- `⚠️ RIESGO (comparación de rol sensible a mayúsculas):` "desarrollo" o "qa" se rechazan con 400 (ADR-03). Un consumidor de API distinto de la UI debe consultar `GET /api/technical-roles` y reutilizar la grafía exacta.
- `⚠️ RIESGO (cardinalidad miembro–rol):` El contrato materializa un rol por miembro (`role: string`). Si el punto abierto 1 resuelve "varios roles", `role` pasaría a arreglo: cambio incompatible que exigiría versionar (`/api/v2/...`) o un campo nuevo. Las HU-013/014/015 no deben cimentar supuestos sobre la forma escalar de `role`.
- `⚠️ RIESGO (consumo desde otros módulos):` No se define `ITeamsModuleApi` ni contrato in-process (ADR-004 del SA); la primera HU consumidora (013, 014, 021, 023 o 027) deberá definirlo. Esta API HTTP no es el mecanismo de integración entre módulos (Constitución §4).
- `⚠️ RIESGO (código 201 y Location PROPUESTOS):` El 201 y el `Location` hacia la colección no están en la HU (ADR-04); si el BA confirma otro código, cambia el contrato y las pruebas T027.
- `⚠️ RIESGO (supuestos de negocio):` Cardinalidad (1), unicidad (2), ciclo de vida (3), administración del catálogo (4), vínculo con Keycloak (5), permisos por rol (6), formato de consultas (7) y relación con estimaciones Dev/QA (8) siguen sin definir; un cambio de cualquiera altera este contrato.
- `⚠️ RIESGO (error de lectura en UI):` El estado de error de lectura distinto de 401 (SA §5.2) es PROPUESTO y depende de que los dos `GET` respondan 500 con `ProblemDetails` genérico; la UI no debe mostrar el cuerpo.

---

## 5. ORDEN DE DELEGACIÓN PARA EL TRACKER

@QT: Los contratos de integración (API) y endpoints para Miembros del Equipo y Roles Técnicos (Registrar y Consultar) han sido definidos en api_012_miembros_equipo_y_roles_tecnicos.md basados en spec.md y db_012_miembros_equipo_y_roles_tecnicos.md. Por favor, procede con la auditoría cruzada y la compilación del Tech Design (TDD).
