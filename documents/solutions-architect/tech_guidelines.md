# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 03-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `plan.md` y `tasks.md` (GitHub Spec Kit), `spec.md` y `ux_001_registro_elementos_backlog_multitipo.md`.

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub - Plataforma de gestión ágil.
- **Qué problema resuelve:** Permite el registro tipificado de elementos de trabajo (HU, Bug, Spike, etc.) con estimaciones separadas por rol (Desarrollo y QA) minimizando la carga cognitiva y estructurando el backlog.
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica).
- **Arquitectura general:** Modular Monolith (.NET 8/10) utilizando Vertical Slice Architecture (VSA) y frontend Angular 22 (Zoneless).

## 2. Repository Structure
- **Backend:** `app/backend/Modules/Backlog/`
- **Frontend:** `app/frontend/src/app/` (Postergado temporalmente, backend-first per explicit Human choice).
- **Importante:** Agrupación estricta por Feature (VSA). El Endpoint, Command, Handler y Validador de creación del elemento de backlog deben residir en la misma carpeta física `app/backend/Modules/Backlog/Features/CreateBacklogItem/`.
- **Qué NO debe tocar:** Infraestructura genérica en `BuildingBlocks/Shared/` salvo para reutilizar `Entity<T>`, interceptores, MediatR Behaviors y Excepciones base.

## 3. Tech Stack
- **Runtime:** .NET 8/10 (Backend)
- **Framework:** Carter (Minimal APIs) para endpoints.
- **Database:** PostgreSQL (Npgsql con EF Core, schema independiente `backlog`).
- **Infrastructure:** Docker (rootless), RabbitMQ para mensajería y MassTransit, Keycloak para Autenticación.
- **Testing:** xUnit / NSubstitute / FluentAssertions. Tests no tautológicos.

## 4. Development Workflow
- **Cómo levantar el proyecto:** `docker-compose up -d` para contenedores de soporte (PostgreSQL, RabbitMQ, Redis, Keycloak) y `dotnet run` en el host o contenedor del API.
- **Cómo ejecutar tests / lint / build:** `dotnet test`, `dotnet build`.
- **Cómo ejecutar migraciones:** `dotnet ef migrations add InitialBacklog -c BacklogDbContext -o Data/Migrations` y aplicar.

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:** Vertical Slice Architecture (VSA), CQRS intra-proceso (MediatR), validación antes del handler (FluentValidation) y uso incondicional de los interceptores globales (`AuditableEntityInterceptor` y `DispatchDomainEventsInterceptor`).
- **Dependencias permitidas:** Mapster para DTOs, Scrutor para decoradores.
- **Patrones prohibidos:** Queda estrictamente prohibido el uso de variables "hardcodeadas". Prohibido el uso de Controllers clásicos (`[ApiController]`). Prohibido cruzar schemas de base de datos directamente (joins entre módulos).

### 5.1. State Management Architecture
- **Frontera de Estado:** La verdad transaccional reside en PostgreSQL (schema `backlog`). El frontend consumirá estados desde la API.
- **Estrategia de Sincronización:** Backend API First. El cliente (Angular) utilizará peticiones HTTP síncronas.
- **Consistencia:** Fuerte dentro del módulo Backlog. Consistencia eventual hacia otros módulos si se requiere notificación asíncrona mediante RabbitMQ.

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:** La base de datos es la dependencia crítica de escritura.
- **Patrones de Tolerancia a Fallos:** Retries transitorios de EF Core para la base de datos y validaciones robustas previas. Uso obligatorio de las excepciones del bloque compartido (`ValidationException`, `NotFoundException`).
- **Proporcionalidad:** Diseño minimalista. Si se emiten eventos críticos al bus para otros subsistemas, se debe usar **Transactional Outbox**. Por ahora la HU menciona emisión interna (MediatR domain events), pero si escala, Outbox es mandatorio.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Validados, formalizados y enriquecidos desde el plan.md de Spec Kit)*

#### ADR-001: Framework de API y Patrón de Arquitectura
- **Estado:** Aceptado (heredado)
- **Contexto:** Construcción del nuevo caso de uso `CreateBacklogItem` según el estándar corporativo.
- **Decisión:** Uso inmutable de Minimal APIs con Carter, organizado bajo Vertical Slice Architecture, encapsulando endpoint, handler y validación en un feature folder.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Alta cohesión y bajo acoplamiento arquitectónico, eliminando la dispersión horizontal en Controllers o Services genéricos.
  - ⚠️ **Trade-off / Costo Real:** Curva de aprendizaje inicial para modelar estrictamente bajo VSA.

#### ADR-002: Base de Datos y Aislamiento por Schema
- **Estado:** Aceptado (heredado)
- **Contexto:** El módulo de Backlog requiere su propio almacén transaccional sin cruzar datos con el módulo de Applications (referenciado por ApplicationId).
- **Decisión:** Implementación de PostgreSQL con Entity Framework Core, estableciendo el schema lógico `backlog`. La integridad referencial hacia "Applications" se validará lógicamente sin joins SQL directos.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Prevención de joins prohibidos (cross-schema), asegurando un paso directo hacia microservicios cuando el proyecto escale.
  - ⚠️ **Trade-off / Costo Real:** Validaciones de llaves foráneas a módulos externos (ej. `ApplicationId`) deberán resolverse in-memory o mediante llamadas internas o proyecciones, agregando leve latencia.

#### ADR-003: Comunicación Asíncrona (Domain Events)
- **Estado:** Aceptado (heredado)
- **Contexto:** Se requiere notificar la creación del elemento de Backlog (FR-010).
- **Decisión:** Publicación del domain event `BacklogItemCreatedDomainEvent` internamente mediante `IMediator.Publish()` interceptado y gestionado por `DispatchDomainEventsInterceptor` de EF Core.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Separación clara entre la persistencia transaccional y los side-effects intra-módulo sin añadir librerías externas.
  - ⚠️ **Trade-off / Costo Real:** Si el evento debe trascender del módulo en un futuro, se requerirá la implementación obligatoria del Transactional Outbox.

## 6. Coding Conventions
- **Naming:** PascalCase para tipos, camelCase para argumentos y locales. Los endpoints de Carter se llamarán `CreateBacklogItemEndpoint.cs`, el handler `CreateBacklogItemHandler.cs`.
- **Organización:** Ubicación estricta en la feature folder `CreateBacklogItem`.
- **Error handling:** Manejo centralizado usando el middleware global y arrojando excepciones semánticas (e.g. `ValidationException`, `NotFoundException`).
- **Logging:** Uso del pipeline behavior de logging existente (Serilog), sin contaminar lógica de negocio.

## 7. Testing
- **Qué debe testearse y Dónde están los tests:**
  - Pruebas unitarias para `CreateBacklogItemHandler` aislando repositorios y verificando los devPoints y qaPoints por separado.
  - Pruebas de integración asegurando llamadas a DB con schemas correctos (sugerido testcontainers).
  - Validadores probados explícitamente para reglas de negocio (ej. puntaje >= 0).

## 8. Security
- **Manejo de secretos:** Todas las credenciales deben inyectarse mediante variables de entorno (ej. JWT Secret de Keycloak, Connection Strings).
- **Datos sensibles y Acciones prohibidas:** Los endpoints del módulo deben invocar `.RequireAuthorization()` requiriendo un Bearer Token JWT válido.

## 9. Database
- **Schema:** Relacional, schema aislado de base de datos `backlog`.
- **Reglas para modificar DB:** Migraciones generadas exclusivamente dentro de `app/backend/Modules/Backlog/Data/Migrations`, utilizando EF Core Code-First.

## 10. Git & PR Rules
- **Naming de branches y Commits:** Operado por el Watcher GitOps (`feat/001-HU_registro_elementos_backlog_multitipo`). Utilizar Conventional Commits internamente.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:** Analizar el `spec.md` para garantizar el Happy Path y Edge cases descritos.
- **Qué debe validar después / Cuándo pedir confirmación:** Asegurar que `app/backend/Modules/Backlog/Features/CreateBacklogItem` está consolidado bajo VSA, sin referenciar implementaciones concretas de componentes ajenos al módulo.

## 12. Definition of Done
- Todo el código nuevo cuenta con patrones de resiliencia y manejo de estado definidos.
- No hay ninguna credencial o variable de entorno hardcodeada.
- Las migraciones de base de datos han sido auditadas.
- Tests y Lint pasan exitosamente en el entorno de CI.
