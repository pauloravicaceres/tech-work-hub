# CONTRATO DE INTEGRACIÓN (API): Pruebas de Integración contra Keycloak Real y Catálogo Real del Módulo Application

- **Especificación SDD Base:** `specs/002-pruebas-integracion-keycloak-catalogo/spec.md`, `tasks.md` y `contracts/test-contract.md` (Spec Kit)
- **Modelo Base de Datos:** `db_002_pruebas_integracion_keycloak_y_catalogo_application.md`
- **Fecha de Diseño:** 03-10-2026
- **API Architect:** Agente API Senior BMAD
- **Modo de gobernanza:** Brownfield (`.specify/memory/constitution.md` prevalece)

> **Dictamen de alcance:** esta historia **no define endpoints nuevos** (FR-013; `app/backend/src/**` es de solo lectura). Este documento formaliza los dos contratos HTTP **ya existentes** que la suite verifica (`GET /api/applications` y `POST /api/backlog/items`), verificados contra `ListApplicationsEndpoint.cs` y `CreateBacklogItemEndpoint.cs`, y la matriz de rechazo 401 (5 credenciales × 2 rutas). No se inventan rutas, campos ni códigos. Fuente de verdad de payloads: `specs/001-registro-backlog-multitipo/contracts/api.md`.

---

## 1. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)

### ADR-01: Protocolo y capa de interfaz (sin rutas nuevas)
- **Estado:** Aceptado (heredado)
- **Contexto:** La constitución (§2) impone Carter Minimal APIs (`ICarterModule`) y prohíbe Controllers. FR-013 prohíbe modificar contratos HTTP de HU-001.
- **Decisión:** Se documentan sin cambios `GET /api/applications` (módulo Application) y `POST /api/backlog/items` (módulo Backlog), cada uno como Vertical Slice con su propio `*Endpoint.cs`. El módulo Backlog no consulta el catálogo por SQL: resuelve `applicationId` vía `IApplicationModuleApi` (in-process).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Cero superficie nueva; el contrato probado es el contrato de producción.
  - ⚠️ **Trade-off / Costo Real:** La suite queda acoplada a los contratos de HU-001; cualquier cambio futuro de ruta o payload rompe la suite por diseño.

### ADR-02: Autenticación JWT de Keycloak con verificación de audiencia activa
- **Estado:** Aceptado (heredado)
- **Contexto:** Constitución §5: Bearer JWT validado con `Keycloak.AuthServices.Authentication` y `.RequireAuthorization()` en ambas rutas. FR-003 exige la configuración de producción con `verify-token-audience=true`.
- **Decisión:** Ambas rutas exigen `Authorization: Bearer <JWT>` emitido por el realm `techworkhub` para la audiencia `techworkhub-api`. Solo se verifica identidad (`sub`); no se verifican roles (no hay roles documentados).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Un token de otro emisor, otra audiencia, expirado o con firma alterada no alcanza el handler.
  - ⚠️ **Trade-off / Costo Real:** Sin verificación de roles, cualquier usuario autenticado del realm puede registrar ítems; queda como punto abierto de negocio (no documentado).

### ADR-03: Contrato uniforme de rechazo 401 sin cuerpo de negocio
- **Estado:** Aceptado
- **Contexto:** FR-009 y FR-010 exigen 401 ante cinco tipos de credencial inválida en ambas rutas, sin alcanzar catálogo ni persistencia. Los endpoints declaran `Produces(401)` sin tipo de cuerpo.
- **Decisión:** Todo rechazo de autenticación se contrata como **HTTP 401 sin cuerpo de negocio**, idéntico para los cinco motivos. La suite afirma solo el código de estado (y la ausencia de efectos), nunca el texto del motivo.
- **Alternativas Evaluadas:**
  - **Alternativa A:** `ProblemDetails` con motivo diferenciado (expirado, firma, audiencia). Descartada: no existe en producción (FR-013) y expondría al atacante el motivo exacto del rechazo.
  - **Alternativa B:** Afirmar la cabecera `WWW-Authenticate` con `error_description`. Descartada: depende de la implementación interna de la librería y vuelve frágil la suite ante actualizaciones de `Keycloak.AuthServices` (2.5.2).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Contrato mínimo, estable y no filtra información sensible.
  - ⚠️ **Trade-off / Costo Real:** La suite no distingue por qué se rechazó un token: un 401 por causa equivocada (p. ej. realm mal configurado) pasaría la prueba. Se mitiga con las pruebas de camino feliz (mismo token válido → 200/201) y la prueba anti-tautología T029.

---

## 2. ESPECIFICACIONES GLOBALES
- **Autenticación:** JWT (Bearer en header `Authorization`), emisor Keycloak realm `techworkhub`, audiencia `techworkhub-api`, claim `sub` obligatorio.
- **Base URL:** `/api` (rutas `/api/applications` y `/api/backlog/items`).
- **Content-Type:** `application/json`; errores 400 en `application/problem+json`.
- **Códigos no aplicables:** `403`, `404` y `409` no están definidos por estos contratos (sin roles, sin recurso por id consultable, sin conflicto de negocio) y no se contratan.

---

## 3. ENDPOINTS DEFINIDOS

### Endpoint: `GET /api/applications`
- **Tarea Spec Kit:** T013, T014, T015 (US1); T019–T021 (US3, filas de ruta GET)
- **Propósito Funcional:** Listar el catálogo real de aplicaciones (US1, FR-005). Base de datos: `application."Applications"` (`Id`, `Name`).
- **Request Headers:**
  - `Authorization`: `Bearer <token>`
- **Request Body:** Ninguno.
- **Respuestas (Status Codes):**
  - ✅ **200 OK** (Happy Path): lista de `{ id, name }` con solo las aplicaciones creadas por la suite, ordenada ascendentemente por `name`. Catálogo vacío devuelve `[]`.
  ```json
  [
    { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "Alfa" },
    { "id": "9b2c1d7e-4a1f-4c63-8e0a-52f1d9a3b7c4", "name": "Beta" }
  ]
  ```
  - ❌ **401 Unauthorized** (Sad Path: credencial ausente, firma alterada, expirada, otro emisor u otra audiencia): sin cuerpo de negocio; no se consulta el catálogo.

| Campo respuesta | Tipo | Columna `db_002` |
|---|---|---|
| `id` | `string (UUID)` | `Applications.Id` |
| `name` | `string` (≤ 200) | `Applications.Name` (orden ASC) |

---

### Endpoint: `POST /api/backlog/items`
- **Tarea Spec Kit:** T016, T017, T018 (US2); T019–T021 (US3, filas de ruta POST)
- **Propósito Funcional:** Registrar un ítem de backlog referenciando una aplicación del catálogo real y conservar `CreatedBy` = `sub` del token (FR-006 a FR-008).
- **Request Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <token>`
- **Request Body (Payload JSON)** (payload válido de referencia de HU-001):
```json
{
    "title": "Ítem de prueba de integración",
    "type": "UserStory",
    "priority": "High",
    "devPoints": 5.0,
    "qaPoints": 3.0,
    "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Campo | Tipo | Requerido | Columna `db_002` / Restricción |
|---|---|---|---|
| `title` | `string` | Sí | `Title` varchar(200) NOT NULL |
| `description` | `string` | No | `Description` varchar(4000) |
| `type` | `string` | Sí | `Type` varchar(50): `UserStory`, `Bug`, `TechEvolution`, `TechRequirement`, `TechDebt`, `Research`, `Spike` |
| `priority` | `string` | Sí | `Priority` varchar(50): `Low`, `Medium`, `High`, `Critical` |
| `acceptanceCriteria` | `string` | No | `AcceptanceCriteria` varchar(4000) |
| `devPoints` | `number` | No | `DevPoints` numeric(18,2), ≥ 0 |
| `qaPoints` | `number` | No | `QAPoints` numeric(18,2), ≥ 0; nulo en tipos técnicos |
| `applicationId` | `string (UUID)` | No | `ApplicationId` (referencia lógica, sin FK) |

No enviables por el cliente: `status` (siempre `Backlog`), `createdAt`, `createdBy` (= `sub`, lo asigna `AuditableEntityInterceptor`).

- **Respuestas (Status Codes):**
  - ✅ **201 Created** (Happy Path), cabecera `Location: /api/backlog/items/{id}`; exactamente 1 fila persistida con `Status=Backlog`, `ApplicationId` sembrado y `CreatedBy == sub`:
  ```json
  { "id": "123e4567-e89b-12d3-a456-426614174000" }
  ```
  - ❌ **400 Bad Request** (Sad Path: `applicationId` inexistente, FR-008; `ProblemDetails` con clave `ApplicationId`; cero ítems persistidos):
  ```json
  {
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "errors": { "ApplicationId": [ "The specified Application does not exist." ] }
  }
  ```
  - ❌ **401 Unauthorized** (Sad Path: credencial ausente, firma alterada, expirada, otro emisor u otra audiencia): sin cuerpo de negocio; cero ítems persistidos; catálogo no consultado.
  - ❌ **500 Internal Server Error**: heredado de HU-001 (`ProblemDetails` sin trazas); fuera de la matriz de pruebas de esta historia.

---

### Matriz de rechazo 401 (US3, SC-003)

| # | Credencial | Construcción en la suite | `GET /api/applications` | `POST /api/backlog/items` |
|---|---|---|:---:|:---:|
| 1 | Ausente | Sin header `Authorization` | 401 | 401 |
| 2 | Firma alterada | `TokenTamperer` sobre token válido | 401 | 401 |
| 3 | Expirada | Cliente `techworkhub-tests-shortlived`, espera hasta `exp` pasado | 401 | 401 |
| 4 | Otro emisor | Realm `techworkhub-other` | 401 | 401 |
| 5 | Otra audiencia | Cliente `techworkhub-tests-noaud` | 401 | 401 |

Total: 10 combinaciones, sin efectos sobre `application."Applications"` ni `backlog."BacklogItems"` (conteos sin cambios).

---

## 4. DEPENDENCIAS BLOQUEANTES
- `⚠️ BLOQUEO:` Ninguno. `db_002` cubre las tablas necesarias (`application."Applications"`, `backlog."BacklogItems"`).
- `⚠️ DERIVA (no bloqueante):` `api_001` ilustra `priority` como entero (`3`), mientras `specs/001-.../contracts/api.md` y la suite usan texto (`"High"`, y el servidor acepta el entero 1–4 por compatibilidad). Este contrato usa el texto; debe prevalecer el contrato de `specs/001`.
- `⚠️ PUNTO ABIERTO:` `test-contract.md` §2 fija `Keycloak:ssl-required=none` en `RealApiFactory`, pero `tasks.md` T008/T009 lo condiciona al spike de `ssl-required`. Se contrata como excepción acotada, solo si T008 lo confirma, sin relajar audiencia ni emisor.

---

## 5. ORDEN DE DELEGACIÓN PARA EL TRACKER

@QT: Los contratos de integración (API) y endpoints para Pruebas de Integración contra Keycloak Real y Catálogo Real del Módulo Application han sido definidos en api_002_pruebas_integracion_keycloak_y_catalogo_application.md basados en spec.md y db_002_pruebas_integracion_keycloak_y_catalogo_application.md. Por favor, procede con la auditoría cruzada y la compilación del Tech Design (TDD).
