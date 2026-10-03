# PLAN ESTRATÉGICO Y BACKLOG DEL MVP: TechWorkHub

- **Documento Fuente:** pb_tech_work_hub.md
- **Fecha de Elaboración:** 2026-10-03
- **Product Manager:** Agente Orquestador BMAD (Fase M)

---

## 1. VISIÓN ESTRATÉGICA DEL MVP
*(Sección evaluada por el Quality Gate del Watcher)*

- **Foco de Gestión:** Centralizar la gestión operativa del equipo técnico en Sprints de 2 semanas, asegurando la trazabilidad del trabajo planificado y no planificado mediante un backlog multitipo con estimaciones diferenciadas por rol (Desarrollo vs. QA), visibilidad temprana de bloqueos/retrasos y vinculación contextual de incidentes, reuniones y aplicativos.
- **Criterio de Éxito Rector:** El 100% de las tarjetas del Sprint deben poder gestionarse y consultarse con responsable, rol técnico, estado, estimación desglosada y dependencias contextuales desde un único punto unificado, eliminando la dispersión de información.

---

## 2. BACKLOG INICIAL (ÉPICAS FUNCIONALES)
*(Sección evaluada por el Quality Gate del Watcher)*

Organización del alcance en bloques de valor estructurados bajo el estándar de Ruta Crítica (P1 a P5):

### [P1] Épica: Planificación y Control de Sprints con Backlog Multitipo
- **Descripción de Negocio:** Permite administrar ciclos de trabajo acotados a 2 semanas y gobernar un backlog diverso que soporta múltiples tipos de elementos (Historias de Usuario, Bugs, Evoluciones Tecnológicas, Requerimientos Técnicos, Deuda Técnica, Investigaciones, Spikes). Incluye la asignación de elementos al Sprint, visualización de estimaciones diferenciadas e independientes por rol técnico (Desarrollo y QA), seguimiento de flujo de estados, fechas de compromiso versus reales, y detección/registro explícito de bloqueos, retrasos y tarjetas en riesgo.
- **Justificación de Prioridad:** Constituye el núcleo transaccional (Core) insustituible del producto. Si se elimina esta funcionalidad, TechWorkHub pierde su razón de ser, ya que el propósito rector es controlar el ciclo de vida del trabajo planificado y la capacidad técnica del equipo.
- **Trazabilidad PRD:** Secciones 3.1, 4.1 (Módulo 2: Gestión del Backlog Multitipo y Módulo 3: Planificación y Control de Sprints) y Sección 5.
- **Impacto Brownfield:** Nueva capacidad desacoplada (Módulo de dominio central dentro del Modulith con aislamiento transaccional y persistencia propia mediante schema dedicado).

### [P2] Épica: Gestión de Equipos, Roles Técnicos y Catálogo de Aplicativos
- **Descripción de Negocio:** Gestiona las entidades maestras que sustentan el ecosistema operativo: administración de miembros del equipo técnico con asignación de roles especializados (Desarrollo, QA, etc.) y configuración de capacidades por rol; junto con el catálogo centralizado de aplicativos (fichas técnicas, tecnologías utilizadas, ambientes, componentes, referencias a repositorios y dependencias asociadas).
- **Justificación de Prioridad:** Representa las dependencias de datos maestros y vitrina de consulta que alimentan directamente al flujo P1. Para asignar tarjetas con puntajes diferenciados y vincularlas a sistemas reales, es indispensable disponer previamente del catálogo de colaboradores y del inventario de aplicativos.
- **Trazabilidad PRD:** Sección 4.1 (Módulo 1: Gestión de Equipos y Roles Técnicos y Módulo 6: Centro de Documentación de Aplicativos).
- **Impacto Brownfield:** Nueva capacidad desacoplada (Módulos de datos maestros integrados con la infraestructura de identidad existente para gestión de usuarios).

### [P3] Épica: Gestión de Actividades Operativas e Incidentes Fuera de Sprint
- **Descripción de Negocio:** Habilita la captura y control del trabajo no planificado mediante dos circuitos especializados: registro de actividades operativas (análisis técnico, investigación, coordinación, soporte, documentación y tareas administrativas con distinción de trabajo planificado vs. no planificado) y la bitácora estructurada de incidentes reactivos fuera de sprint (usuario reportante, aplicativo afectado, severidad, tiempos de atención y resolución, diagnóstico, solución aplicada y evidencias).
- **Justificación de Prioridad:** Ocupa el tercer nivel de prelación (Autogestión y Excepciones) al resolver la fuga invisible de esfuerzo que afecta la capacidad del equipo, garantizando que las tareas no programadas y las contingencias se cuantifiquen sin distorsionar el tablero del Sprint planificado.
- **Trazabilidad PRD:** Sección 4.1 (Módulo 4: Gestión de Actividades / Trabajo Operativo y Módulo 5: Bitácora de Incidentes Fuera de Sprint) y Sección 5.
- **Impacto Brownfield:** Nueva capacidad desacoplada (Circuito transaccional segregado del backlog principal para resguardar la consistencia de las métricas ágiles).

### [P4] Épica: Gestión de Reuniones, Acuerdos, Compromisos y Timeline de Eventos
- **Descripción de Negocio:** Provee la infraestructura de trazabilidad contextual y colaboración transversal: registro de reuniones vinculadas a tarjetas, incidentes o aplicativos (con actas, minutas, participantes, acuerdos y compromisos fechados con responsable asignado y seguimiento de estado); acompañado por la línea de tiempo inmutable (Timeline) que registra cronológicamente los eventos críticos ocurridos sobre tarjetas, incidentes y aplicaciones (creación, cambios de estado, bloqueos, resoluciones, comentarios).
- **Justificación de Prioridad:** Corresponde al nivel P4 (Automatizaciones y Trazabilidad Transversal). Añade el contexto histórico y colaborativo necesario para reconstruir decisiones pasadas y evitar la dispersión de compromisos acordados verbalmente o por vías informales.
- **Trazabilidad PRD:** Sección 4.1 (Módulo 7: Reuniones, Acuerdos y Compromisos y Módulo 8: Historial / Timeline) y Sección 9.
- **Impacto Brownfield:** Integración transversal (Módulo de eventos y auditoría contextual que escucha mutaciones en los dominios transaccionales adyacentes).

### [P5] Épica: Dashboard Ejecutivo del Líder Técnico y Monitoreo Integral
- **Descripción de Negocio:** Proporciona un panel unificado de supervisión y control operativo para el Líder Técnico, consolidando en tiempo real: estado del Sprint activo, distribución de tarjetas por estado, puntos planificados y completados por rol (Dev/QA), tarjetas retrasadas, bloqueadas o en riesgo, volumen de trabajo planificado vs. no planificado, incidentes abiertos y tiempo invertido, compromisos pendientes y alertas preventivas.
- **Justificación de Prioridad:** Se ubica en el nivel P5 (Supervisión, Backoffice y Gestión Operativa) al ser una herramienta de visualización agregada cuyo funcionamiento depende de que las transacciones, datos maestros y registros de P1 a P4 estén operando y generando métricas.
- **Trazabilidad PRD:** Sección 4.1 (Módulo 9: Dashboard del Líder Técnico) y Sección 11.
- **Impacto Brownfield:** Proyección de lectura desacoplada (Vistas consolidadas de agregación optimizadas para consulta sin impacto transaccional en los módulos operativos).

---

## 3. RIESGOS, DEPENDENCIAS Y PUNTOS ABIERTOS

### Bloqueantes Potenciales
- ⚠️ SUPUESTO: El líder técnico y el equipo adoptarán TechWorkHub de manera consistente como punto único de registro y consulta de contexto operativo.
- ⚠️ SUPUESTO: La autenticación de usuarios y asignación de permisos base se integrará con el servidor de identidades preexistente (Keycloak) bajo estándares OAuth2/OIDC sin requerir esquemas de autenticación propios.
- ⚠️ SUPUESTO: El almacenamiento de evidencias, actas y documentos adjuntos se resolverá mediante el mecanismo de persistencia estándar de la infraestructura local del proyecto, sin dependencias de servicios cloud externos en la fase MVP.
- ⚠️ SUPUESTO: Las estimaciones diferenciadas por rol técnico utilizarán una escala numérica o de story points acordada y compartida por el equipo de desarrollo y aseguramiento de calidad.

### Ambigüedades de Negocio (Para Control del BA)
- ❓ No documentado: Catálogo finito de estados y reglas de transición permitidas para cada uno de los tipos de elementos del Backlog Multitipo (ej. HU vs. Bug vs. Spike).
- ❓ No documentado: Definición algorítmica o heurística formal que determine cuándo una tarjeta pasa a clasificarse como "Retrasada" o "En riesgo" respecto a sus fechas de compromiso.
- ❓ No documentado: Modelo de cálculo de capacidad individual y por rol (Dev / QA) para la ventana fija de 2 semanas del Sprint.
- ❓ No documentado: Flujo de estados detallado y ciclo de atención para la Bitácora de Incidentes (ej. Reportado → En Diagnóstico → En Resolución → Resuelto → Cerrado).
- ❓ No documentado: Alcance de las estimaciones por rol en ítems técnicos que no sean Historias de Usuario (¿los Bugs o Spikes requieren obligatoriamente puntaje desglosado para Dev y QA?).
- ❓ No documentado: Criterio para la conversión automática o manual de compromisos originados en reuniones hacia actividades operativas del sistema.
- ❓ No documentado: Restricciones de volumen, tamaño máximo y formatos permitidos para la carga de evidencias y adjuntos en incidentes y fichas técnicas.

### Riesgos Brownfield de Regresión y Acoplamiento
- **Riesgo de Acoplamiento Transaccional:** Cada módulo debe preservar la segregación estricta de schemas en la persistencia común, evitando dependencias cruzadas directas que comprometan la modularidad.
- **Riesgo de Compatibilidad de Roles:** El mapeo de perfiles desde el gestor de identidades debe alinearse con la granularidad operativa requerida (Líder Técnico, Desarrollador, QA, Reportante).
- **Riesgo de Latencia en Timeline:** La captura de eventos para la línea de tiempo histórica debe realizarse de forma desacoplada para no penalizar el rendimiento de las operaciones de negocio primarias.

---

## 4. ORDEN DE DELEGACIÓN PARA EL BA Y GITOPS
*(Instrucción que se inyecta en tracker_bmad.md)*

@WATCHER: GITOPS-BRANCH-CREATE feat/001-HU_registro_elementos_backlog_multitipo
El Business Analyst (@BA:) debe iniciar el análisis de negocio y redacción formal de la especificación para la Historia de Usuario `001-HU_registro_elementos_backlog_multitipo` correspondiente a la Épica [P1], creando físicamente el archivo `documents/business-analyst/001-HU_registro_elementos_backlog_multitipo.md` bajo la plantilla canónica de HU y respetando estrictamente el identificador universal asignado.
