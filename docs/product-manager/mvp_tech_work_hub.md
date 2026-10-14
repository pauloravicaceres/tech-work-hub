# PLAN ESTRATÉGICO Y BACKLOG DEL MVP: TechWorkHub

- **Documento Fuente:** `pb_tech_work_hub.md`
- **Fecha de Elaboración:** 2026-10-03
- **Product Manager:** Agente Orquestador BMAD (Fase M)
- **Versión:** 1.1 — Refinamiento HITL

---

## 1. VISIÓN ESTRATÉGICA DEL MVP

### Foco de Gestión

Centralizar la gestión operativa del equipo técnico en Sprints de 2 semanas, asegurando la trazabilidad del trabajo planificado y no planificado mediante un backlog multitipo con estimaciones diferenciadas por rol (Desarrollo vs. QA), visibilidad temprana de bloqueos/retrasos y vinculación contextual de incidentes, reuniones y aplicativos.

### Criterio de Éxito Rector

El trabajo técnico gestionado en TechWorkHub debe poder consultarse junto con su responsable, estado, esfuerzo y contexto relacionado, manteniendo trazabilidad entre planificación, ejecución, incidencias, decisiones y documentación.

---

## 2. BACKLOG INICIAL (ÉPICAS FUNCIONALES)

El alcance se organiza en seis épicas funcionales. La separación del catálogo de aplicativos respecto de equipos y roles permite mantener dominios de negocio más claros sin fragmentar artificialmente las capacidades transversales.

### [P1] Épica: Planificación y Control de Sprints con Backlog Multitipo

**Descripción de Negocio**

Permite administrar ciclos de trabajo acotados a 2 semanas y gobernar un backlog diverso que soporta múltiples tipos de elementos:

- Historias de Usuario.
- Bugs.
- Evoluciones Tecnológicas.
- Requerimientos Técnicos.
- Deuda Técnica.
- Investigaciones.
- Spikes.
- Otros tipos que puedan incorporarse posteriormente.

Incluye:

- Configuración y seguimiento de ciclos (Sprints) de 2 semanas.
- Asignación de elementos al Sprint.
- Estimaciones diferenciadas e independientes por rol técnico (Desarrollo y QA).
- Seguimiento del flujo de estados.
- Fechas de compromiso versus fechas reales.
- Detección y registro de bloqueos.
- Identificación de retrasos.
- Identificación de tarjetas en riesgo.
- Relaciones con personas, actividades, reuniones, incidentes y aplicaciones.
- Historial de eventos relevantes de las tarjetas.

**Historias candidatas**

- `003-HU_gestion_sprint_dos_semanas` ⚠️ [PROPUESTO]: Crear y gestionar Sprints de 2 semanas: configuración del ciclo (identificación y fechas de inicio y fin acotadas estrictamente a una ventana de 2 semanas) y consulta y seguimiento del Sprint. Sin dependencia de otras épicas. La creación y consulta no tienen bloqueos; el ciclo de vida (estados, apertura y cierre) queda bloqueado por ❓ reglas de apertura, cierre y estados de un Sprint. Sin dependencias de otras historias; la 004 depende de ella.
- `004-HU_asignacion_elementos_sprint` ⚠️ [PROPUESTO]: Asignación de elementos del backlog a un Sprint de 2 semanas. Depende de 003 (el Sprint debe existir); sin otros puntos abiertos.
- `005-HU_flujo_estados_backlog` ⚠️ [PROPUESTO]: Seguimiento del flujo de estados de las tarjetas. Bloqueada por ❓ catálogo de estados y reglas de transición.
- `006-HU_fechas_compromiso_vs_reales` ⚠️ [PROPUESTO]: Fechas de compromiso versus fechas reales de las tarjetas. Depende de 004 y del flujo de estados (005).
- `007-HU_bloqueos_backlog` ⚠️ [PROPUESTO]: Detección y registro de bloqueos de tarjetas. Depende de 005.
- `008-HU_retrasos_backlog` ⚠️ [PROPUESTO]: Identificación de tarjetas retrasadas. Bloqueada por ❓ definición formal de "Retrasada"; depende de 006.
- `009-HU_tarjetas_en_riesgo` ⚠️ [PROPUESTO]: Identificación de tarjetas en riesgo. Bloqueada por ❓ definición formal de "En riesgo"; depende de 006.
- `010-HU_relaciones_backlog_con_entidades` ⚠️ [PROPUESTO]: Relaciones de las tarjetas con personas, actividades, reuniones, incidentes y aplicaciones. Depende de datos de P2, P3, P4 y P5.
- `011-HU_historial_eventos_tarjetas` ⚠️ [PROPUESTO]: Historial de eventos relevantes de las tarjetas (capacidad transversal Timeline). Depende de 005; implementación técnica a definir en Architecture.

**Justificación de Prioridad**

Constituye el núcleo transaccional del producto. Si se elimina esta funcionalidad, TechWorkHub pierde su capacidad principal de controlar el ciclo de vida del trabajo planificado.

**Trazabilidad al Product Brief**

- Sección 3: Objetivo.
- Sección 4.1 — Módulo 2: Gestión del Backlog Multitipo.
- Sección 4.1 — Módulo 3: Planificación y Control de Sprints.
- Sección 5: Restricciones de negocio y operativas.

---

### [P2] Épica: Gestión de Equipos y Roles Técnicos

**Descripción de Negocio**

Gestiona las entidades maestras relacionadas con las personas que participan en el trabajo técnico:

- Miembros del equipo.
- Roles técnicos.
- Capacidades.
- Asignaciones.
- Actividades y carga de trabajo por persona.
- Relación entre personas, roles y elementos de trabajo.

Debe permitir soportar las estimaciones diferenciadas por rol requeridas por el Backlog Multitipo y los Sprints.

**Historias candidatas**

- `012-HU_miembros_equipo_y_roles_tecnicos` ⚠️ [PROPUESTO]: Gestión de miembros del equipo y roles técnicos como datos maestros. Sin dependencia de puntos abiertos.
- `013-HU_capacidades_y_asignaciones` ⚠️ [PROPUESTO]: Capacidades y asignaciones de las personas. Bloqueada por ❓ modelo de cálculo de capacidad individual y por rol; depende de 012.
- `014-HU_actividades_y_carga_por_persona` ⚠️ [PROPUESTO]: Actividades y carga de trabajo por persona. Depende de 012 y de actividades de P4.
- `015-HU_relacion_personas_roles_elementos` ⚠️ [PROPUESTO]: Relación entre personas, roles y elementos de trabajo. Depende de 012 y de P1.

**Justificación de Prioridad**

Las personas y roles son datos maestros utilizados por la planificación y ejecución del trabajo. P2 mantiene la responsabilidad funcional sobre estos datos sin mezclarla con el dominio de aplicaciones y documentación.

**Dependencias**

P1 requiere determinados datos de P2 para asignar responsables, roles y estimaciones.

**Trazabilidad al Product Brief**

- Sección 2: Usuarios.
- Sección 4.1 — Módulo 1: Gestión de Equipos y Roles Técnicos.

---

### [P3] Épica: Catálogo y Documentación de Aplicaciones

**Descripción de Negocio**

Centraliza la información técnica de los aplicativos para evitar búsquedas dispersas en discos, repositorios y documentos independientes.

Cada aplicación podrá mantener, según corresponda:

- Información general.
- Responsables.
- Equipo relacionado.
- Tecnologías.
- Ambientes.
- Componentes.
- Integraciones.
- Referencias a repositorios.
- Documentación.
- Diagramas de arquitectura.
- Incidentes relacionados.
- Actividades relacionadas.
- Tarjetas relacionadas.
- Reuniones relacionadas.

**Historias candidatas**

- `016-HU_ficha_general_aplicacion` ⚠️ [PROPUESTO]: Información general, responsables, equipo relacionado y tecnologías de cada aplicación. Sin dependencia de puntos abiertos; el catálogo base ya existe por HU-002.
- `017-HU_ambientes_componentes_integraciones` ⚠️ [PROPUESTO]: Ambientes, componentes e integraciones de la aplicación. Depende de 016.
- `018-HU_referencias_repositorios_y_documentacion` ⚠️ [PROPUESTO]: Referencias a repositorios y documentación de la aplicación. Bloqueada por ❓ almacenamiento físico vs. referencias externas y ❓ visibilidad/edición; depende de 016.
- `019-HU_diagramas_arquitectura_aplicacion` ⚠️ [PROPUESTO]: Diagramas de arquitectura de la aplicación. Bloqueada por ❓ formatos/tamaño de adjuntos y ❓ visibilidad/edición; depende de 016.
- `020-HU_contexto_relacionado_aplicacion` ⚠️ [PROPUESTO]: Vista de incidentes, actividades, tarjetas y reuniones relacionadas con la aplicación. Depende de 016 y de datos de P1, P4 y P5.

**Justificación de Prioridad**

El catálogo de aplicaciones constituye un contexto transversal para el trabajo técnico. Permite relacionar las actividades del equipo con los sistemas reales sobre los cuales se trabaja y conservar su documentación en un punto central.

**Trazabilidad al Product Brief**

- Sección 4.1 — Módulo 6: Centro de Documentación de Aplicativos.
- Sección 7: Supuestos.
- Sección 9: Principios de producto.

---

### [P4] Épica: Gestión de Actividades Operativas e Incidentes Fuera de Sprint

**Descripción de Negocio**

Habilita la captura y control del trabajo no planificado mediante dos circuitos especializados:

#### Actividades operativas

Incluyen:

- Análisis técnico.
- Investigación.
- Coordinación.
- Soporte.
- Preparación de documentación.
- Revisión técnica.
- Actividades administrativas relacionadas con el trabajo.
- Otras tareas operativas.

Deben permitir registrar responsable, fechas, estado, duración, prioridad y relaciones con aplicaciones, tarjetas, incidentes y reuniones.

#### Incidentes

Permiten registrar:

- Usuario reportante.
- Aplicación afectada.
- Fecha y hora de reporte.
- Categorización.
- Severidad.
- Estado.
- Responsable.
- Inicio y fin de atención.
- Tiempo de atención.
- Tiempo de resolución.
- Diagnóstico.
- Solución.
- Evidencias y adjuntos.
- Relaciones con tarjetas, actividades, reuniones y documentación.
- Historial del incidente.

Los incidentes mantienen un circuito diferenciado del Backlog planificado para evitar distorsionar la lectura del Sprint.

**Historias candidatas**

- `021-HU_registro_actividades_operativas` ⚠️ [PROPUESTO]: Registro de actividades operativas con responsable, fechas, estado, duración y prioridad. Depende de 012 para responsables.
- `022-HU_relaciones_actividades_operativas` ⚠️ [PROPUESTO]: Relaciones de actividades con aplicaciones, tarjetas, incidentes y reuniones. Depende de 021 y de datos de P1, P3 y P5.
- `023-HU_registro_incidentes` ⚠️ [PROPUESTO]: Registro de incidentes: reportante, aplicación afectada, fecha y hora, categorización, severidad, estado y responsable. Bloqueada por ❓ flujo de estados de incidentes; depende de 016 y 012.
- `024-HU_atencion_y_resolucion_incidentes` ⚠️ [PROPUESTO]: Inicio y fin de atención, tiempos de atención y resolución, diagnóstico y solución. Depende de 023; afectada por ❓ flujo de estados de incidentes.
- `025-HU_evidencias_adjuntos_incidentes` ⚠️ [PROPUESTO]: Evidencias y adjuntos de incidentes. Bloqueada por ❓ tamaño máximo y formatos permitidos; depende de 023.
- `026-HU_relaciones_e_historial_incidente` ⚠️ [PROPUESTO]: Relaciones del incidente con tarjetas, actividades, reuniones y documentación, e historial del incidente. Depende de 023 y de datos de P1, P3 y P5.

**Justificación de Prioridad**

Permite visibilizar el trabajo que ocurre fuera de la planificación y cuantificar el esfuerzo operativo que consume capacidad del equipo.

**Trazabilidad al Product Brief**

- Sección 4.1 — Módulo 4: Gestión de Actividades / Trabajo Operativo.
- Sección 4.1 — Módulo 5: Bitácora de Incidentes.
- Sección 5: Restricciones.

---

### [P5] Épica: Reuniones, Acuerdos y Compromisos

**Descripción de Negocio**

Permite registrar reuniones y conservar el contexto de las decisiones tomadas durante el trabajo.

Una reunión podrá registrar:

- Fecha y hora.
- Participantes.
- Motivo.
- Elementos relacionados.
- Acta o minuta.
- Acuerdos.
- Compromisos.
- Responsable de cada compromiso.
- Fecha compromiso.
- Estado del compromiso.
- Adjuntos.

Las reuniones podrán relacionarse con:

- HUs y demás elementos del Backlog.
- Actividades.
- Incidentes.
- Aplicaciones.
- Sprints.

**Timeline / Historial como capacidad transversal**

El Timeline no se considera una épica independiente. Es una capacidad transversal que debe permitir reconstruir cronológicamente eventos relevantes sobre tarjetas, incidentes, aplicaciones y otros elementos.

Ejemplos:

- Creación.
- Asignación.
- Cambio de estado.
- Cambio de responsable.
- Registro o resolución de bloqueo.
- Registro de retraso.
- Reunión.
- Acuerdo.
- Compromiso.
- Comentario.
- Resolución de incidente.
- Actualización de documentación.

La implementación técnica del Timeline deberá definirse durante Architecture.

**Historias candidatas**

- `027-HU_registro_reuniones` ⚠️ [PROPUESTO]: Registro de reuniones: fecha y hora, participantes, motivo, acta o minuta y adjuntos. Adjuntos bloqueados por ❓ tamaño y formatos; depende de 012.
- `028-HU_acuerdos_y_compromisos` ⚠️ [PROPUESTO]: Acuerdos y compromisos con responsable, fecha compromiso y estado. Bloqueada por ❓ criterio para convertir compromisos en actividades; depende de 027.
- `029-HU_relaciones_reuniones` ⚠️ [PROPUESTO]: Relación de reuniones con elementos del backlog, actividades, incidentes, aplicaciones y Sprints. Depende de 027 y de datos de P1, P3 y P4.
- `030-HU_timeline_transversal` ⚠️ [PROPUESTO]: Timeline cronológico transversal sobre incidentes, aplicaciones y demás elementos (extiende 011). Depende de 011; implementación técnica a definir en Architecture.

**Justificación de Prioridad**

Permite conservar decisiones y compromisos que de otro modo podrían quedar dispersos en correos, chats, notas o reuniones.

**Trazabilidad al Product Brief**

- Sección 4.1 — Módulo 7: Reuniones, Acuerdos y Compromisos.
- Sección 4.1 — Módulo 8: Historial / Timeline.
- Sección 9: Principios de producto.

---

### [P6] Épica: Dashboard Ejecutivo del Líder Técnico

**Descripción de Negocio**

Proporciona un panel unificado de supervisión y control operativo para el Líder Técnico.

Debe consolidar, según corresponda:

- Estado del Sprint activo.
- Distribución de tarjetas por estado.
- Puntos planificados y completados por rol.
- Tarjetas retrasadas.
- Tarjetas bloqueadas.
- Tarjetas en riesgo.
- Trabajo planificado versus no planificado.
- Actividades pendientes y en progreso.
- Incidentes abiertos y atendidos.
- Tiempo invertido en incidentes.
- Compromisos pendientes.
- Alertas relevantes.

**Historias candidatas**

- `031-HU_dashboard_estado_sprint` ⚠️ [PROPUESTO]: Estado del Sprint activo, distribución de tarjetas por estado y puntos planificados y completados por rol. Depende de 004 y 005.
- `032-HU_dashboard_alertas_retrasos_bloqueos_riesgo` ⚠️ [PROPUESTO]: Tarjetas retrasadas, bloqueadas y en riesgo, y alertas relevantes. Bloqueada por ❓ definiciones de "Retrasada" y "En riesgo"; depende de 007, 008 y 009.
- `033-HU_dashboard_trabajo_no_planificado` ⚠️ [PROPUESTO]: Trabajo planificado versus no planificado, actividades pendientes y en progreso, incidentes abiertos y atendidos y tiempo invertido en incidentes. Depende de P4.
- `034-HU_dashboard_compromisos_pendientes` ⚠️ [PROPUESTO]: Compromisos pendientes de reuniones. Depende de 028.

**Justificación de Prioridad**

Es una capacidad de supervisión que depende de la correcta operación y disponibilidad de los datos generados por las épicas anteriores.

**Trazabilidad al Product Brief**

- Sección 4.1 — Módulo 9: Dashboard del Líder Técnico.
- Sección 11: Resultado esperado del MVP.

---

## 3. CAPACIDADES TRANSVERSALES

Las siguientes capacidades no se modelan como épicas independientes porque atraviesan múltiples dominios:

### 3.1 Timeline / Historial

Permite reconstruir eventos relevantes y mantener trazabilidad histórica.

### 3.2 Seguridad y Autorización

Incluye autenticación, autorización y control de acceso según roles como:

- Líder Técnico.
- Desarrollador.
- QA.
- Reportante.
- Administrador.

La integración con Keycloak y las reglas detalladas de permisos se definirán durante Architecture y análisis funcional.

### 3.3 Adjuntos y Evidencias

Capacidad reutilizable para:

- Evidencias de incidentes.
- Actas y minutas.
- Documentación de aplicaciones.
- Diagramas.
- Otros documentos relacionados.

### 3.4 Relaciones entre Entidades

Las entidades deben poder relacionarse sin quedar aisladas.

Ejemplo:

```text
Aplicación
    │
    ├── Sprint
    │     └── HU
    │           ├── Responsable
    │           ├── Reuniones
    │           ├── Acuerdos
    │           ├── Bloqueos
    │           └── Actividades
    │
    ├── Incidentes
    │
    └── Documentación
```

---

## 4. DEPENDENCIAS ENTRE ÉPICAS

La prioridad de negocio no implica necesariamente un orden estricto de implementación.

Por ejemplo, P1 es el núcleo del producto, pero requiere determinados datos maestros de P2.

Dependencias conceptuales iniciales:

```text
P2 ───────────────┐
                  │
                  ▼
P1 ───────────────┼──────────────┐
                  │              │
P3 ───────────────┤              │
                  │              ▼
P4 ───────────────┤             P5
                  │              │
                  └──────────────┤
                                 ▼
                                P6
```

Estas dependencias deberán validarse durante BA y Architecture.

---

## 5. RIESGOS, DEPENDENCIAS Y PUNTOS ABIERTOS

### 5.1 Bloqueantes potenciales

- ⚠️ **SUPUESTO:** El líder técnico y el equipo adoptarán TechWorkHub como punto central para registrar y consultar el contexto operativo gestionado por la plataforma.
- ⚠️ **SUPUESTO:** La autenticación y asignación de permisos base se integrarán con el servidor de identidades existente (Keycloak).
- ⚠️ **SUPUESTO:** El almacenamiento de evidencias, actas y documentos adjuntos se resolverá mediante el mecanismo definido para la infraestructura local del proyecto, sin dependencias cloud externas en el MVP.
- ⚠️ **SUPUESTO:** Las estimaciones diferenciadas por rol técnico utilizarán una escala acordada por el equipo.

### 5.2 Ambigüedades de negocio

- ❓ Catálogo de estados y reglas de transición para cada tipo de elemento del Backlog Multitipo.
- ❓ Definición formal para determinar cuándo una tarjeta está "Retrasada".
- ❓ Definición formal para determinar cuándo una tarjeta está "En riesgo".
- ❓ Modelo de cálculo de capacidad individual y por rol para el Sprint de 2 semanas.
- ❓ Flujo de estados de los incidentes.
- ❓ Alcance de las estimaciones por rol para Bugs, Spikes, Deuda Técnica y demás tipos.
- ❓ Criterio para convertir compromisos de reuniones en actividades.
- ❓ Tamaño máximo y formatos permitidos para adjuntos.
- ❓ Nivel de visibilidad y edición de documentación y diagramas.
- ❓ Almacenamiento físico de documentación versus referencias a repositorios externos.
- ❓ Integración futura con Azure DevOps, Jira u otras herramientas.
- ❓ Reglas de apertura, cierre y estados de un Sprint (el Product Brief solo fija su duración de 2 semanas).

---

## 6. RIESGOS BROWNFIELD

### Riesgo de acoplamiento transaccional

Cada módulo debe preservar la segregación de schemas en la persistencia común, evitando dependencias cruzadas directas que comprometan la modularidad.

### Riesgo de compatibilidad de roles

El mapeo de perfiles desde el gestor de identidades debe alinearse con la granularidad operativa requerida.

### Riesgo de latencia del Timeline

La captura de eventos históricos debe realizarse de forma desacoplada para no penalizar las operaciones primarias.

### Riesgo de dependencia entre P1 y P2

La planificación requiere personas y roles para asignar responsables y estimaciones. Architecture deberá determinar cómo mantener esta dependencia sin romper la segregación modular.

---

## 7. ORDEN DE PRIORIDAD

| Prioridad | Épica | Propósito |
|---|---|---|
| **P1** | Planificación y Control de Sprints + Backlog Multitipo | Núcleo transaccional del producto |
| **P2** | Gestión de Equipos y Roles Técnicos | Datos maestros para asignaciones y capacidad |
| **P3** | Catálogo y Documentación de Aplicaciones | Contexto técnico de los sistemas |
| **P4** | Actividades Operativas e Incidentes | Trabajo no planificado y contingencias |
| **P5** | Reuniones, Acuerdos y Compromisos | Trazabilidad de decisiones |
| **P6** | Dashboard Ejecutivo | Supervisión y consolidación |

---

## 8. ORDEN DE DELEGACIÓN PARA EL BA Y GITOPS

**Estado:** Pendiente de ejecución por el flujo BMAD.

El Business Analyst deberá iniciar el análisis de negocio y la especificación formal de las Historias de Usuario correspondientes a las épicas, respetando el orden de prioridad y las dependencias identificadas.

La primera historia propuesta por el Product Manager permanece como:

`001-HU_registro_elementos_backlog_multitipo`

correspondiente a la épica **P1 — Planificación y Control de Sprints con Backlog Multitipo**.

Antes de implementar esta HU deberán resolverse, como mínimo, las reglas de negocio que afecten su alcance directo:

- Tipos de elementos soportados.
- Datos obligatorios.
- Estados iniciales.
- Reglas de transición aplicables.
- Asignación de responsables.
- Roles técnicos.
- Modelo de estimación por rol.
- Relaciones mínimas con Sprint y demás entidades.

Las decisiones que dependan de otras épicas deberán quedar explícitamente identificadas por el BA y no asumirse sin validación.

---

## 9. CRITERIO PARA EL SIGUIENTE PASO BMAD

El Product Manager debe entregar al Business Analyst:

1. Las seis épicas funcionales.
2. Las capacidades transversales.
3. Las dependencias entre épicas.
4. Las preguntas abiertas de negocio.
5. Los riesgos Brownfield.
6. La primera HU priorizada.

El **Business Analyst** deberá convertir este backlog estratégico en especificaciones funcionales verificables, sin inventar reglas que todavía figuren como preguntas abiertas.

Posteriormente, **Architecture** deberá definir la solución técnica y resolver las decisiones relacionadas con modularidad, persistencia, eventos, Timeline, seguridad, adjuntos e integraciones.

---

## 10. RESULTADO ESPERADO DEL MVP

Al finalizar un Sprint, el Líder Técnico debe poder consultar TechWorkHub y responder desde un único punto:

### Planificación

- ¿Qué se planificó?
- ¿Qué personas y roles participan?
- ¿Cuántos puntos fueron asignados?

### Ejecución

- ¿Qué está terminado?
- ¿Qué está en progreso?
- ¿Qué está retrasado?
- ¿Qué está en riesgo?
- ¿Qué está bloqueado?
- ¿Por qué?

### Trabajo no planificado

- ¿Qué actividades aparecieron durante el Sprint?
- ¿Quién las atendió?
- ¿Cuánto tiempo consumieron?
- ¿Qué impacto tuvieron sobre el trabajo planificado?

### Incidentes

- ¿Qué incidentes fueron atendidos?
- ¿Quién los reportó?
- ¿Cuándo ocurrieron?
- ¿Cuánto tiempo tomó resolverlos?
- ¿Cuál fue el diagnóstico?
- ¿Cuál fue la solución?

### Reuniones y decisiones

- ¿Qué reuniones se realizaron?
- ¿Qué tarjetas, aplicaciones o incidentes estuvieron involucrados?
- ¿Qué acuerdos se tomaron?
- ¿Qué compromisos quedaron pendientes?

### Aplicaciones

- ¿Qué aplicaciones están relacionadas?
- ¿Dónde está su documentación?
- ¿Cuál es su arquitectura?
- ¿Qué incidentes y actividades están relacionados?

### Historial

- ¿Qué ocurrió?
- ¿Cuándo ocurrió?
- ¿Quién realizó el cambio?
- ¿Qué decisión o evento provocó el cambio?
