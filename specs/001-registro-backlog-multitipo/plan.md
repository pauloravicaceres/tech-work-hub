# Plan de Implementación: Registro de Elementos en Backlog Multitipo

**Branch**: `001-registro-backlog-multitipo` | **Date**: 2026-10-03 | **Spec**: [001-HU_registro_elementos_backlog_multitipo.md](./spec.md)

**Input**: Especificación de feature desde `specs/001-registro-backlog-multitipo/spec.md`

## Resumen

Desarrollo de un endpoint `POST /api/backlog/items` para permitir a usuarios autenticados (con JWT en Keycloak) registrar nuevos elementos de backlog (UserStory, Bug, Spike, etc.). Se aplicar Vertical Slice Architecture con Carter, CQRS (MediatR), validación FluentValidation y un mapeador (Mapster) en .NET 8/10 Modulith con PostgreSQL. Se persisten distintos tipos de ítems, controlando independientemente los puntos de estimación de Dev y QA. Se incluye la publicación del evento de dominio `BacklogItemCreatedDomainEvent` internamente en el módulo tras completar la transacción exitosamente.

## Contexto Técnico

**Lenguaje/Versión**: C# 12 / .NET 8 o 10 (Modulith).

**Dependencias Principales**: Carter (Minimal APIs), MediatR, Mapster, FluentValidation, EF Core (PostgreSQL). Seguridad con `Keycloak.AuthServices.Authentication`.

**Almacenamiento**: PostgreSQL con aislamiento multi-schema (Schema propio para el módulo Backlog).

**Pruebas**: xUnit o nUnit para Test-Driven Development (TDD) en el módulo correspondiente.

**Target Platform**: Contenedores Docker (Linux) en Arquitectura Modular Monolítica.

**Tipo de Proyecto**: Módulo de servicio web REST dentro de un Modulith.

**Objetivos de Rendimiento**: Tiempos de respuesta para creación menores a 500ms en condiciones normales (SC-004) y fallos de validación en menos de 200ms (SC-003).

**Restricciones**: El dominio y la capa de acceso a datos (EF Core) no pueden hacer JOIN ni consultas cross-schema a otros módulos. Las validaciones como existencia de `ApplicationId` deben realizarse por llamadas a interfaces intra-proceso (Comunicación síncrona según la matriz de arquitectura) o cachés.

**Escala/Alcance**: 100% de éxito de persistencia y encolamiento de Domain Events (CQRS/Event-Driven para dominio local).

## Chequeo de Constitución

*GATE: Superado satisfactoriamente (Phase 0 -> Phase 1).*

- **CQRS & VSA (@API)**: Endpoints se ubicarán en `Feature Folders` usando Carter e inyectando MediatR para las validaciones/comandos en lugar de Controladores MVC estándar.
- **Identidad (@API)**: Requiere políticas JWT (`.RequireAuthorization()`).
- **Domain Events (@DA)**: Se usarán agregados `Aggregate<TId>` con `IDomainEvent` despachado en la misma transacción mediante `DispatchDomainEventsInterceptor`. **No se aplicará Transactional Outbox** debido a que este no es un evento de integración (no es consumido por otro módulo).
- **Aislamiento Multi-schema (@DA)**: La estructura usará un schema `Backlog` dedicado, aislado del módulo de `Applications` o cualquier otro módulo.

## Estructura del Proyecto

### Documentación (Esta feature)

```text
specs/001-registro-backlog-multitipo/
 plan.md              # Este archivo (/speckit-plan command output)
 research.md          # Output de Fase 0 (investigación y clarificación)
 data-model.md        # Output de Fase 1 (modelo DDD)
 quickstart.md        # Output de Fase 1 (guía de prueba)
 contracts/           # Output de Fase 1
   api.md             # Contrato de API JSON
 tasks.md             # Generado en Fase 2 (por /speckit-tasks)
```

### Código Fuente (Raíz del Repositorio)

```text
src/
 Modules/
   Backlog/
     Features/
       BacklogItems/
         CreateBacklogItem/
           CreateBacklogItemEndpoint.cs
           CreateBacklogItemCommand.cs
           CreateBacklogItemCommandHandler.cs
           CreateBacklogItemValidator.cs
     Domain/
       BacklogItems/
         BacklogItem.cs
         BacklogItemType.cs
         BacklogItemStatus.cs
         Events/
           BacklogItemCreatedDomainEvent.cs
     Data/
       Configurations/
         BacklogItemConfiguration.cs
```

**Decisión Estructural**: Implementación de Vertical Slice Architecture en un sub-módulo `Backlog` dentro de la arquitectura modular monolítica general. Se respeta la directiva inmutable de agrupar el Endpoint (Carter), Comando, Handler (MediatR) y Validador (FluentValidation) dentro de la carpeta descriptiva de la feature `CreateBacklogItem`.

## Seguimiento de Complejidad

> No existen violaciones a la constitución, por lo tanto, no se requieren alternativas rechazadas documentadas.
