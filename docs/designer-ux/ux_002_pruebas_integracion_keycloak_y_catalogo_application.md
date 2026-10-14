# ESPECIFICACIÓN DE DISEÑO UX: Pruebas de Integración contra Keycloak Real y Catálogo Real del Módulo Application

- **Historia de Usuario Fuente:** 002-HU_pruebas_integracion_keycloak_y_catalogo_application.md
- **Spec Kit Fuente:** specs/002-pruebas-integracion-keycloak-catalogo/spec.md
- **Fecha de Diseño:** 03-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Contexto:** Brownfield (`.specify/memory/constitution.md`: Angular 22 zoneless + PrimeNG v22.1.1)

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** Pruebas de Integración contra Keycloak Real y Catálogo Real del Módulo Application (HU-002).
- **Enfoque de Usabilidad:** La historia es una capacidad de verificación automatizada (suite de integración de backend) cuyo único actor es el equipo técnico ejecutando pruebas por línea de comandos. No define pantallas, formularios, componentes ni interacciones visuales. Por la Política Anti-Alucinación (§1) no se inventa ninguna interfaz: el entregable documenta el dictamen de **no aplicabilidad visual** y su trazabilidad escenario por escenario.
- **Dictamen:** **SIN INTERFAZ GRÁFICA NUEVA.** Cero wireframes. Coincide con el bypass de UX dictaminado por QA Documental (`aprobado_qa_002_pruebas_integracion_keycloak_y_catalogo_application.md`).

---

## 2. MAPA DE ESTADOS VISUALES

Mapeo 1 a 1 de cada escenario de `spec.md` / HU. Ninguno introduce un estado visual nuevo.

| Escenario spec.md / HU | Tipo | Estado visual | Justificación |
|---|---|---|---|
| US1-1 / SC-01 Listado de catálogo con token real | Happy Path | Ninguno | Verificación HTTP `GET /api/applications` ejecutada por la suite; sin pantalla. |
| US1-2 / SC-01 Origen en `ApplicationModuleApi` real | Happy Path | Ninguno | Aserción interna de la suite. |
| US2-1, US2-2 / SC-02 Registro de ítem con aplicación real | Happy Path | Ninguno (reutiliza el Happy Path de `ux_001_registro_elementos_backlog_multitipo.md`, sin cambios) | Verificación HTTP `POST /api/backlog/items`; la UI de HU-001 no se modifica (FR-013). |
| US2-3 / SC-03 Aplicación inexistente (HTTP 400) | Sad Path | Ninguno (el error en línea ya está cubierto en el UX de HU-001) | Comportamiento heredado de HU-001; sin cambios visuales. |
| US3-1..US3-6 / SC-04 Credencial inválida (HTTP 401) | Sad Path | Ninguno (la reautenticación del cliente pertenece a HU-001: interceptor Bearer y guard) | Rechazo en middleware; sin pantalla nueva. |

- **Escenario Cubierto:** US1, US2, US3 / SC-01..SC-04 — todos con dictamen "sin estado visual".
- **Wireframe Estructural (ASCII):** No aplica. Dibujar uno implicaría inventar interfaz no pedida por ningún Criterio de Aceptación.
- **ID de Tarea Spec Kit:** `tasks.md` de la feature 002 aún no existe; no hay tarea de UI que mapear.
- **Disparadores de Estado:** Ninguno; la ejecución es por comando de pruebas.
- **Reglas de Componente:** Ninguna. Restricciones heredadas respetadas: no se altera Topbar, Sidebar, Breadcrumbs ni ningún componente PrimeNG existente.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES
- **Heurísticas Aplicadas:**
  - Se documenta explícitamente la ausencia de interfaz en lugar de omitir el entregable, para preservar la trazabilidad 1:1 y el handoff vertical.
  - No se añaden pantallas de reporte de pruebas ni paneles de estado de Keycloak: no figuran en ningún CA.
  - Los mensajes de error de HU-002 (400 y 401) son comportamiento heredado de HU-001; su representación visual ya está definida en `ux_001_...` y no se redefine aquí.
- **Bloqueos de UX / Consultas para BA:** Ninguno. (CB-05, Keycloak no disponible, fue resuelto por el Humano: opción A, la suite falla explícitamente; es salida de consola, no UI.)

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER

**Auditoría de Alcance:** Backlog MVP = 6 épicas (P1..P6). Diseño visual realizado hasta ahora: P1 (HU-001). HU-002 deriva de P1 y no añade épica diseñada. Épicas diseñadas (1) < épicas del backlog (6): el MVP continúa. Por el Handoff Vertical Estricto del rol, el turno pasa de forma directa al SA.

`@SA: Diseño visual de la HU 002-HU_pruebas_integracion_keycloak_y_catalogo_application completado (sin interfaz gráfica, cero wireframes). Procede con el tech-design.`
