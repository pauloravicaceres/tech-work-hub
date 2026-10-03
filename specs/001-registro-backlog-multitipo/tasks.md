---
description: "Lista de tareas para la implementación de la funcionalidad de Registro de Elementos en Backlog Multitipo"
---

# Tareas: Registro de Elementos en Backlog Multitipo

**Input**: Documentos de diseño desde `/specs/001-registro-backlog-multitipo/`

**Prerrequisitos**: plan.md (requerido), spec.md (requerido para historias de usuario), research.md, data-model.md, contracts/

**Organización**: Las tareas están agrupadas por historia de usuario para permitir la implementación y prueba independiente de cada historia.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (diferentes archivos, sin dependencias)
- **[Story]**: A qué historia de usuario pertenece esta tarea (ej. US1, US2)

---

## Fase 1: Configuración (Setup)

**Propósito**: Inicialización de la estructura y carpetas del módulo

- [X] T001 Crear estructura de carpetas para la feature `CreateBacklogItem` en `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/`
- [X] T002 [P] Crear estructura de carpetas de dominio en `src/Modules/Backlog/Domain/BacklogItems/Events/`
- [X] T003 [P] Crear estructura de carpetas de datos en `src/Modules/Backlog/Data/Configurations/`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura core y entidades de dominio que DEBEN estar completas antes de iniciar las historias de usuario.

**⚠️ CRÍTICO**: Ningún trabajo de historia de usuario puede comenzar hasta que esta fase esté completa.

- [X] T004 [P] Crear enumeración `BacklogItemType` en `src/Modules/Backlog/Domain/BacklogItems/BacklogItemType.cs` con los valores: UserStory, Bug, TechEvolution, TechRequirement, TechDebt, Research, Spike.
- [X] T005 [P] Crear enumeración `BacklogItemStatus` en `src/Modules/Backlog/Domain/BacklogItems/BacklogItemStatus.cs` con el valor inmutable inicial `Backlog`.
- [X] T006 [P] Crear evento de dominio `BacklogItemCreatedDomainEvent` en `src/Modules/Backlog/Domain/BacklogItems/Events/BacklogItemCreatedDomainEvent.cs` con propiedades `BacklogItemId`, `Type`, `ApplicationId`, y `OccurredOnUtc`.
- [X] T007 Crear entidad raíz de agregado `BacklogItem` en `src/Modules/Backlog/Domain/BacklogItems/BacklogItem.cs` heredando de `Aggregate<Guid>`.
- [X] T008 Configurar EF Core Entity Type Builder para `BacklogItem` en `src/Modules/Backlog/Data/Configurations/BacklogItemConfiguration.cs` aislando en el schema `Backlog`.

**Punto de control**: Base fundacional lista - la implementación de historias de usuario puede comenzar.

---

## Fase 3: Historia de Usuario 1 - Registro completo de Historia de Usuario (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir a usuarios autenticados registrar un elemento de tipo Historia de Usuario con estimaciones independientes para desarrollo y QA.

**Prueba Independiente**: Probar enviando un payload completo a `/api/backlog/items` verificando HTTP 201 y creación exitosa de `devPoints` y `qaPoints`.

### Pruebas para Historia de Usuario 1 (Opcional)

- [X] T009 [P] [US1] Prueba de integración para endpoints verificando el caso exitoso (HTTP 201) y rechazo sin token (HTTP 401 Unauthorized) en `tests/Integration/Backlog/CreateBacklogItemTests.cs`.
- [X] T010 [P] [US1] Pruebas unitarias para las validaciones del comando en `tests/Unit/Backlog/CreateBacklogItemValidatorTests.cs`.

### Implementación para Historia de Usuario 1

- [X] T011 [P] [US1] Crear registro `CreateBacklogItemCommand` en `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/CreateBacklogItemCommand.cs`.
- [X] T012 [P] [US1] Crear validador `CreateBacklogItemValidator` en `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/CreateBacklogItemValidator.cs`. Incluir las siguientes reglas exactas: Title "NotEmpty().MaximumLength(200)", Type "IsInEnum() o validación contra el catálogo estático.", DevPoints "GreaterThanOrEqualTo(0).When(x => x.DevPoints.HasValue)", y QAPoints "GreaterThanOrEqualTo(0).When(x => x.QAPoints.HasValue)".
- [X] T013 [US1] Implementar `CreateBacklogItemCommandHandler` en `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/CreateBacklogItemCommandHandler.cs`. Incluir validación asíncrona exacta: "Si tiene valor, el handler verificará asincrónamente su existencia consultando el módulo Application (IApplicationModuleApi.ExistsAsync(applicationId)). Si no existe, lanzará ValidationException mapeada a HTTP 400." y publicar evento de dominio.
- [X] T014 [US1] Implementar Minimal API endpoint usando Carter en `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/CreateBacklogItemEndpoint.cs` para manejar `POST /api/backlog/items` requiriendo autorización JWT.

**Punto de control**: La Historia de Usuario 1 debe ser completamente funcional y testeable.

---

## Fase 4: Historia de Usuario 2 - Registro de elemento técnico sin estimación de QA (Prioridad: P2)

**Objetivo**: Permitir a usuarios autenticados registrar una investigación técnica preliminar (Spike) que no requiere puntos de QA.

**Prueba Independiente**: Probar enviando un elemento tipo `Spike` con `qaPoints` igual a nulo y verificando que se almacena correctamente.

### Pruebas para Historia de Usuario 2 (Opcional)

- [X] T015 [P] [US2] Prueba de integración para crear tipo Spike con `qaPoints` igual a nulo en `tests/Integration/Backlog/CreateBacklogItemTests.cs`.

### Implementación para Historia de Usuario 2

- [X] T016 [US2] Ajustar o verificar el manejo de nulos en `src/Modules/Backlog/Features/BacklogItems/CreateBacklogItem/CreateBacklogItemCommandHandler.cs` para asegurar que `qaPoints` en elementos técnicos se guarde y retorne como nulo correctamente.

**Punto de control**: Ambas historias de usuario deben funcionar independientemente.

---

## Fase 5: Pulido y Aspectos Transversales

**Propósito**: Mejoras finales, validaciones de extremos y aseguramiento de la calidad.

- [X] T017 [P] Ejecutar todos los escenarios de prueba descritos en `quickstart.md` localmente mediante cURL o postman.
- [X] T018 Confirmar la inyección correcta de `CreatedAt` y `CreatedBy` a través de interceptores (`AuditableEntityInterceptor`).
- [X] T019 Validar rechazo de peticiones vacías (HTTP 400) o campos excesivamente largos según FR-004.

---

## Dependencias y Orden de Ejecución

### Dependencias de Fase

- **Configuración (Fase 1)**: Sin dependencias.
- **Fundacional (Fase 2)**: Depende de Configuración - BLOQUEA todas las historias de usuario.
- **Historias de Usuario (Fase 3+)**: Dependen de la Fase Fundacional. Pueden desarrollarse en paralelo.
- **Pulido (Fase 5)**: Depende de completar todas las historias de usuario.

### Oportunidades de Paralelismo

- Las tareas marcadas con `[P]` en la Fase 1 y Fase 2 pueden avanzar en paralelo.
- La creación de enumeraciones y el evento de dominio (T004, T005, T006) pueden ser trabajadas simultáneamente antes de T007.
- La creación de pruebas (T009, T010, T015), el comando (T011) y el validador (T012) de la US1 pueden hacerse en paralelo.

## Estrategia de Implementación

### Entrega Incremental

1. Completar Configuración + Fundacional → La base está lista.
2. Añadir Historia de Usuario 1 → Probar de manera independiente → Entregar MVP.
3. Añadir Historia de Usuario 2 → Probar de manera independiente → Desplegar MVP mejorado.
