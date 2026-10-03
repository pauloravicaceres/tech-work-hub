# Modelo de Datos: Backlog Multitipo

Este documento define las entidades y reglas de validacin segn las especificaciones funcionales (FR-002 a FR-009) y los lineamientos de la arquitectura (Lex Superior de la Constitucin).

## Entidades (Domain Driven Design)

### `BacklogItem` (Aggregate Root)

Hereda de `Aggregate<Guid>` (definido en el kernel o librera base compartida) e incorpora implementaciones implcitas para eventos de dominio.

| Campo | Tipo | Restricciones / Reglas |
|-------|------|------------------------|
| `Id` | `Guid` | Identificador nico principal. |
| `Title` | `string` | Requerido. No vaco. Mximo 200 caracteres (FR-004). |
| `Description` | `string` | Opcional. |
| `Type` | `BacklogItemType` | Requerido. Enum o ValueObject (UserStory, Bug, TechEvolution, TechRequirement, TechDebt, Research, Spike) (FR-005). |
| `Status` | `BacklogItemStatus` | Requerido. Inmutable en creacin a `Backlog` (FR-003). |
| `DevPoints` | `int?` | Opcional. Debe ser `>= 0` si existe (FR-006). |
| `QAPoints` | `int?` | Opcional. Debe ser `>= 0` si existe. Puede ser nulo para tems tcnicos (FR-008). |
| `ApplicationId` | `Guid?` | Opcional. Clave fornea lgica hacia el mdulo de Aplicaciones (FR-007). |
| `CreatedAt` | `DateTime` | Gestionado va `AuditableEntityInterceptor` (FR-009). |
| `CreatedBy` | `string` | Gestionado va `AuditableEntityInterceptor` a travs del token JWT (FR-009). |

### Reglas de Validacin Asociadas (FluentValidation)

- **Creacin de Command (`CreateBacklogItemCommand`)**:
  - `Title`: `NotEmpty().MaximumLength(200)`
  - `Type`: `IsInEnum()` o validacin contra el catlogo esttico.
  - `DevPoints`: `GreaterThanOrEqualTo(0).When(x => x.DevPoints.HasValue)`
  - `QAPoints`: `GreaterThanOrEqualTo(0).When(x => x.QAPoints.HasValue)`
  - `ApplicationId`: Si tiene valor, el handler verificar asncronamente su existencia consultando el mdulo Application (`IApplicationModuleApi.ExistsAsync(applicationId)`). Si no existe, lanzar `ValidationException` mapeada a HTTP 400.

### Eventos de Dominio

- `BacklogItemCreatedDomainEvent` (`IDomainEvent`)
  - Atributos: `BacklogItemId`, `Type`, `ApplicationId`, `OccurredOnUtc`
  - Comportamiento: Registrado automticamente en la entidad va `AddDomainEvent()` al finalizar su instanciacin, y recolectado por `DispatchDomainEventsInterceptor` antes de confirmar la transaccin en base de datos.
