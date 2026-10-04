# 🗺️ Mapa de Specs (Product State Ledger)

> **Regla de Actualización:** Este archivo es el registro histórico del estado del producto. Las modificaciones a la tabla deben respetar estrictamente el formato Markdown para permitir su parseo automatizado.

### Glosario de Estados Permitidos (Diccionario Finito)
Para mantener el determinismo del *Ledger*, los agentes mutadores y lectores utilizarán estrictamente este conjunto cerrado de estados:
* **`ACTIVE`**: Funcionalidad probada y en producción. Es la fuente de verdad actual.
* **`IN-PROGRESS`**: Spec en diseño activo.
* **`READY-FOR-DEV`**: Diseño técnico aprobado, listo para Fase D.
* **`DRAFT` / `BACKLOG`**: Idea o requerimiento sin refinar; sin diseño técnico ni código asociado.
* **`BLOCKED`**: Avance detenido por falta de definiciones o dependencias externas.
* **`DEPRECATED`**: Funcionalidad completamente obsoleta o reemplazada. Estrictamente prohibido usarla como base.
* **`DEPRECATED-PARTIAL`**: Funcionalidad reemplazada solo parcialmente. Obligatorio consultar las *Notas de Relación* para identificar qué partes siguen vivas.

---

### Registro del Ledger

| N° | Épica Origen | Nombre spec / HU | Qué aporta | Estado | Rama |
|----|--------------|------------------|------------|--------|------|
| 001 | [P1] Planificación y Control de Sprints con Backlog Multitipo | 001-HU_registro_elementos_backlog_multitipo | Registro y tipificación de ítems en backlog multitipo con estimación por rol (Dev/QA) | READY-FOR-DEV | feat/001-HU_registro_elementos_backlog_multitipo |
| 002 | [P1] Planificación y Control de Sprints con Backlog Multitipo | 002-HU_pruebas_integracion_keycloak_y_catalogo_application | Cubre el riesgo residual de HU-001: pruebas de integración contra un Keycloak real (emisión y validación de JWT) y contra el catálogo real del módulo Application (`ApplicationModuleApi` y `GET /api/applications` sin dobles), más una semilla del catálogo | BACKLOG | N/A |

---

## 🔗 Notas de Relación entre Specs
* (Aún no hay relaciones registradas)

