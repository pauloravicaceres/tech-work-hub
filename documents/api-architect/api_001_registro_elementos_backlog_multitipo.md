# CONTRATO DE INTEGRACIÓN (API): Registro de Elementos en Backlog Multitipo

- **Especificación SDD Base:** `spec.md` y `tasks.md` (Spec Kit)
- **Modelo Base de Datos:** `db_001_registro_elementos_backlog_multitipo.md`
- **Fecha de Diseño:** 03-10-2026
- **API Architect:** Agente API Senior BMAD

---

## 1. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Registro de las decisiones de diseño sobre protocolos, seguridad y estructuras de payload)*

### ADR-01: Protocolo y Capa de Interfaz
- **Estado:** Aceptado (heredado)
  > *Regla: Usar "Aceptado (heredado)" si la decisión proviene de .specify/memory/constitution.md o .specify/memory/constitution.md. Las decisiones heredadas no requieren alternativas consideradas.*
- **Contexto:** El backend requiere la exposición de un endpoint para registrar elementos de backlog. Según la constitución (Modulith .NET 8/10), se exige un enfoque particular para la capa API.
- **Decisión:** Se utilizará el patrón **Minimal APIs** apoyado en la librería `Carter` mediante módulos `ICarterModule` (`MapPost`, `MapGet`, `Produces<T>()`), quedando totalmente prohibido el uso de Controllers clásicos (`[ApiController]`).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Menor overhead por request, enrutamiento ultra-rápido y adherencia al estándar del starter kit establecido.
  - ⚠️ **Trade-off / Costo Real:** Curva de aprendizaje inicial para la organización de los bindings y dependencias frente a los Controllers tradicionales.

### ADR-02: Diseño del Payload JSON y Serialización (VSA)
- **Estado:** Aceptado (heredado)
- **Contexto:** Se requiere orquestar la conversión entre el Request DTO, el Command de MediatR y, posteriormente, la Entidad en Base de Datos.
- **Decisión:** Los DTOs de entrada y salida se organizarán en la misma carpeta de la funcionalidad (Vertical Slice Architecture). Para el mapeo de `Request` hacia `Command` y del resultado a `Response` se usará estrictamente `Mapster` (`request.Adapt<T>()`).
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Alta co-localización de código (Feature Folders), previniendo la dispersión de contratos de red por todo el módulo.
  - ⚠️ **Trade-off / Costo Real:** Multiplicación de clases (Request, Command) que pueden lucir estructuralmente idénticas, resultando en un pequeño aumento de boilerplate.

### ADR-03: Seguridad y Autenticación del Endpoint
- **Estado:** Aceptado (heredado)
- **Contexto:** El registro de elementos en el backlog exige protección de acceso para asegurar que únicamente usuarios legítimos participen.
- **Decisión:** La ruta `/api/backlog/items` exigirá un Bearer Token válido orquestado y validado contra el Identity Provider (`Keycloak`), aplicando políticas `.RequireAuthorization()` en el endpoint de Carter.
- **Consecuencias:**
  - ✅ **Beneficio / Impacto Positivo:** Garantía de trazabilidad y delegación de la seguridad perimetral hacia un componente centralizado externo y robusto.
  - ⚠️ **Trade-off / Costo Real:** Necesidad de que los clientes administren el ciclo de vida del token (refresh/access), introduciendo complejidad en la invocación.

---

## 2. ESPECIFICACIONES GLOBALES
- **Autenticación:** JWT (Bearer Token en Header `Authorization`), gestionado vía Keycloak.
- **Base URL:** `/api/backlog`

---

## 3. ENDPOINTS DEFINIDOS
*(Mapeo 1 a 1 de endpoints y operaciones requeridas en spec.md y tasks.md)*

### Endpoint: `POST /api/backlog/items`
- **Tarea Spec Kit:** T014 (Fase 3 - MVP)
- **Propósito Funcional:** Registrar un elemento de tipo Historia de Usuario o elemento técnico (Spike, Bug, etc.) con sus estimaciones correspondientes y publicarlo en el backlog.
- **Request Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <token>`
- **Request Body (Payload JSON):**
```json
{
    "title": "Registro completo de Historia de Usuario",
    "description": "Como Líder Técnico quiero registrar un elemento...",
    "type": "UserStory",
    "priority": 3,
    "acceptanceCriteria": "Dado que... Cuando... Entonces...",
    "devPoints": 5.0,
    "qaPoints": 3.0,
    "applicationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```
*(Nota: `description`, `acceptanceCriteria`, `devPoints`, `qaPoints` y `applicationId` son opcionales y pueden recibir nulos o ser omitidos).*

- **Respuestas (Status Codes):**
  - ✅ **201 Created** (Happy Path):
  ```json
  { 
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6" 
  }
  ```

  - ❌ **401 Unauthorized** (Sad Path - Acceso sin Token válido):
  ```json
  {
      "error": "UNAUTHORIZED",
      "message": "Token faltante o inválido"
  }
  ```

  - ❌ **400 Bad Request** (Sad Path - Validaciones Gherkin / Reglas):
  ```json
  { 
      "error": "BAD_REQUEST", 
      "message": "Validation failed",
      "errors": [
          "El campo Title no puede estar vacío.",
          "DevPoints debe ser mayor o igual a 0."
      ]
  }
  ```

  - ❌ **400 Bad Request** (Sad Path - ApplicationId no existe):
  ```json
  { 
      "error": "BAD_REQUEST", 
      "message": "La aplicación referenciada no existe." 
  }
  ```

  - ❌ **500 Internal Server Error** (Sad Path - Falla persistencia o bus):
  ```json
  { 
      "error": "INTERNAL_SERVER_ERROR", 
      "message": "Ha ocurrido un error inesperado al procesar la solicitud." 
  }
  ```

---

## 4. DEPENDENCIAS BLOQUEANTES
- `⚠️ BLOQUEO:` Ninguno. El modelo proporcionado en `db_001_registro_elementos_backlog_multitipo.md` suministra la base requerida para satisfacer los contratos de interfaz y validaciones descritas. Es necesario garantizar que el módulo de "Application" exponga la verificación interna (`IApplicationModuleApi.ExistsAsync(applicationId)`) detallada en el plan de tareas (T013).

---

## 5. ORDEN DE DELEGACIÓN PARA EL TRACKER
*(Instrucción de una sola línea continua para notificar al QA Técnico)*

@QT: Los contratos de integración (API) y endpoints para Registro de Elementos en Backlog Multitipo han sido definidos en api_001_registro_elementos_backlog_multitipo.md basados en spec.md y db_001_registro_elementos_backlog_multitipo.md. Por favor, procede con la auditoría cruzada y la compilación del Tech Design (TDD).
