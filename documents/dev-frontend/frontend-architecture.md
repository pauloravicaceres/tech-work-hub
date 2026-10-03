# 🏗️ ARQUITECTURA FRONTEND VIVA

## 1. Información General y Objetivo
- **Sistema:** TechWorkHub
- **Versión:** 1.0.0
- **Fecha de última actualización:** 2026-10-03
- **Equipo:** Frontend / SpecKit
- **Objetivo:** Plataforma modular basada en Angular 22 Zoneless con Signals para la gestión de proyectos y backlog multitipo.

## 2. Contexto y Arquitectura General
```mermaid
flowchart TD
    User((Usuario)) --> UI[Angular 22 Zoneless App]
    UI --> APIClient[API Client]
    APIClient --> Gateway[Modulith .NET 8 Backend]
    UI --> Keycloak[Keycloak OIDC]
```

## 3. Estructura del Proyecto y Enrutamiento
- **Módulos:**
  - `features/backlog/components/`: Componentes específicos de gestión de backlog.
  - `core/`: Servicios base (API, Auth).
- **Rutas Principales:**
```mermaid
flowchart TD
    Inicio[/ / ] --> Backlog[/ /backlog ]
    Backlog --> NuevoItem[/ /backlog/nuevo ]
```

## 4. Gestión de Estado y Autenticación
- **Estado Local:** Manejado mediante Signals de Angular 22 (`isSubmitting`, `sessionExpired`, `serverError`).
- **Autenticación:** OIDC con Keycloak. Las llamadas fallidas (401) muestran un diálogo bloqueante para reautenticación forzada.

## 5. Comunicación con Backend y Manejo de Errores
- **Interacción de Registro de Elementos (CreateBacklogItemComponent):**
```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as CreateBacklogItemComponent
    participant API as Backend POST /api/backlog/items

    U->>UI: Llena Formulario y Envía
    UI->>UI: Valida campos requeridos (Angular Reactive Forms)
    UI->>API: HTTP POST Payload
    alt Éxito (201)
        API-->>UI: 201 Created (UUID)
        UI-->>U: Muestra Toast de Éxito y Resetea Formulario
    else Error Validación (400)
        API-->>UI: 400 Bad Request
        UI-->>U: Muestra Mensaje de Error / Asigna invalidApp a Dropdown
    else Expira Sesión (401)
        API-->>UI: 401 Unauthorized
        UI-->>U: Muestra Diálogo Bloqueante de Reautenticación
    else Fallo Interno (500)
        API-->>UI: 500 Internal Server Error
        UI-->>U: Muestra Mensaje de Error (Mantiene estado)
    end
```

## 6. Registros de Decisiones de Arquitectura (ADRs)
### ADR-001: Angular 22 Zoneless + PrimeNG v22.1.1
- **Contexto:** Se requiere alta reactividad y performance sin las penalizaciones de zone.js.
- **Decisión:** Uso de `standalone components` y Signals, omitiendo zone.js.
- **Consecuencias:** Rendimiento superior, estado inmutable nativo, requiere conocimiento de Signals.

### ADR-002: Desacoplamiento de Estimaciones QA y Dev
- **Contexto:** Las tareas técnicas (Spikes, TechDebt) no requieren esfuerzo QA.
- **Decisión:** Inactivación reactiva del campo `qaPoints` con payload dinámico (`qaPoints: null`) basado en el selector de tipo.
- **Consecuencias:** Payload flexible alineado al FR-008.
