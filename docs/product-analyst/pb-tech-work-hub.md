# PRODUCT BRIEF: TechWorkHub

- **Documento Fuente:** idea-tech-work-hub.md
- **Fecha de Elaboración:** 2026-10-03
- **Product Analyst:** Agente PA Senior BMAD (Fase Discovery)
- **Versión:** 1.1 — Refinamiento HITL

---

## 1. PROBLEMA
*(Diferenciar hechos comprobables de inferencias lógicas)*

### 1.1 Hechos comprobables

- **Pérdida de trazabilidad en los Sprints de 2 semanas:** dificultad para dar seguimiento a tarjetas planificadas con estimaciones diferenciadas por rol (ej. QA vs Dev dentro de la misma HU), incluyendo su estado, avance, retrasos y bloqueos.
- **Pérdida de acuerdos, actas y minutas de reuniones:** la información asociada a una tarjeta puede quedar dispersa en correos, notas o documentos sin una vinculación directa con la HU o tarjeta del Sprint.
- **Trabajo no planificado disperso:** además de los elementos del Sprint, el líder técnico y los miembros del equipo realizan actividades operativas, análisis, coordinaciones, soporte y otras tareas que consumen capacidad sin quedar necesariamente registradas.
- **Atención reactiva de incidentes:** las fallas no planificadas fuera del Sprint requieren una bitácora estructurada que conserve usuario reportante, fechas, tiempos de atención y resolución, diagnóstico, solución y evidencias.
- **Desconexión y dispersión de la documentación técnica:** la información general de aplicaciones, fichas técnicas, diagramas de arquitectura y otros documentos puede encontrarse en discos locales y repositorios desconectados, dificultando su consulta y mantenimiento.

### 1.2 Inferencias lógicas / hipótesis

- ⚠️ **SUPUESTO:** La falta de visibilidad sobre bloqueos, retrasos y esfuerzo por rol puede dificultar la identificación temprana de desviaciones y sobrecargas.
- ⚠️ **SUPUESTO:** La atención de incidentes sin una bitácora estructurada puede consumir capacidad del Sprint sin que quede cuantificado el esfuerzo operativo.
- ⚠️ **SUPUESTO:** La fragmentación documental puede incrementar el tiempo necesario para localizar información técnica y dificultar la incorporación de nuevos integrantes.
- ⚠️ **SUPUESTO:** La falta de un historial unificado puede dificultar reconstruir posteriormente las decisiones y eventos que afectaron una tarjeta, incidente o aplicación.

---

## 2. USUARIOS
*(Actores que experimentan el problema y usuarios que operarán la solución)*

### 2.1 Usuario principal

- **Líder Técnico de Desarrollo y Arquitectura de Software:** requiere centralizar la gestión operativa, supervisar capacidad y puntajes por rol, monitorear Sprints, controlar actividades propias y del equipo, gobernar la documentación de aplicativos y auditar incidentes fuera del Sprint.

### 2.2 Usuarios secundarios / operativos

- **Desarrolladores de Software:** registran y actualizan actividades y tarjetas asignadas, consultan criterios de aceptación, reportan bloqueos y consultan fichas técnicas o acuerdos vinculados.
- **Analistas / Ingenieros de QA:** registran y gestionan las actividades de certificación/prueba, validan criterios de aceptación y dan seguimiento a bugs e incidentes.
- **Usuarios Reportantes / Stakeholders Operativos:** actores que reportan fallas o incidentes no planificados para su atención y seguimiento.
- **Administrador de Plataforma:** gestiona usuarios, asignación de roles técnicos y catálogos base del sistema.

---

## 3. OBJETIVO (OUTCOME)
*(Resultado de negocio deseado o cambio de comportamiento observable; no una lista de features)*

### 3.1 Propósito central

Centralizar el seguimiento del trabajo planificado y no planificado del equipo técnico, manteniendo trazabilidad entre actividades, tarjetas, personas, reuniones, acuerdos, bloqueos, retrasos, incidentes, aplicaciones y documentación relacionada.

### 3.2 Resultado esperado

El líder técnico debe poder consultar desde un único punto:

- Qué trabajo fue planificado.
- Qué trabajo se encuentra actualmente en ejecución.
- Qué actividades propias y del equipo están pendientes, en progreso o completadas.
- Qué tarjetas están retrasadas o en riesgo.
- Qué tarjetas están bloqueadas y por qué.
- Qué trabajo no planificado ocurrió durante el Sprint.
- Qué incidentes fueron atendidos y cuánto tiempo requirieron.
- Qué reuniones se realizaron respecto de una tarjeta, aplicación o incidente.
- Qué acuerdos y compromisos surgieron.
- Qué documentación existe sobre las aplicaciones involucradas.
- Qué eventos ocurrieron históricamente sobre una tarjeta, incidente o aplicación.

---

## 4. ALCANCE INICIAL (MVP)
*(Límites y módulos funcionales prioritarios para la primera versión)*

### 4.1 Módulos incluidos

#### Módulo 1: Gestión de Equipos y Roles Técnicos

- Administración de miembros del equipo técnico y asignación de roles (Desarrollo, QA, etc.).
- Configuración de capacidades y monitoreo de puntajes/actividades específicas por rol.
- Consulta de actividades y carga de trabajo por persona.

#### Módulo 2: Gestión del Backlog Multitipo

El sistema debe mantener un backlog capaz de administrar diferentes tipos de elementos de trabajo, sin limitarse exclusivamente a Historias de Usuario.

Tipos iniciales contemplados:

- Historias de Usuario (HU).
- Bugs.
- Evoluciones Tecnológicas (ET).
- Requerimientos Técnicos.
- Deuda Técnica.
- Investigaciones.
- Spikes.
- Otros tipos podrán incorporarse posteriormente si el modelo funcional lo requiere.

Los elementos podrán incluir, según su tipo:

- Objetivo.
- Descripción.
- Criterios de aceptación.
- Responsable(s).
- Roles involucrados.
- Estimaciones diferenciadas por rol.
- Estado.
- Prioridad.
- Fechas.
- Relaciones con aplicaciones, reuniones, incidentes, bloqueos y documentación.

#### Módulo 3: Planificación y Control de Sprints

- Configuración y seguimiento de ciclos de 2 semanas.
- Asignación de tarjetas del Backlog al Sprint.
- Visualización de estimaciones diferenciadas por rol (ej. Dev / QA) sobre una misma tarjeta.
- Control del flujo de estados.
- Registro y visibilidad de bloqueos.
- Seguimiento de fechas de compromiso y fechas reales.
- Identificación de retrasos a partir de fechas y estado.
- Identificación de tarjetas en riesgo.
- Vinculación directa de reuniones, actas, minutas, acuerdos y compromisos con las tarjetas.
- Consulta del historial de eventos relevantes de una tarjeta.

#### Módulo 4: Gestión de Actividades / Trabajo Operativo

Este módulo representa actividades que no necesariamente corresponden a una tarjeta del Backlog ni a un incidente.

Ejemplos:

- Análisis técnico.
- Investigación.
- Coordinación.
- Soporte.
- Preparación de documentación.
- Revisión técnica.
- Actividades administrativas relacionadas con el trabajo del equipo.
- Otras tareas operativas.

Cada actividad podrá registrar, según corresponda:

- Descripción.
- Responsable.
- Fecha de inicio y fin.
- Estado.
- Tiempo o duración.
- Prioridad.
- Aplicación relacionada.
- Tarjeta relacionada.
- Incidente relacionado.
- Reuniones o acuerdos relacionados.

Las actividades deben poder distinguirse entre trabajo planificado y trabajo no planificado cuando aplique.

#### Módulo 5: Bitácora de Incidentes (Fuera de Sprint)

- Registro estructurado de fallas e incidentes no planificados.
- Usuario reportante.
- Aplicación afectada.
- Fecha y hora de reporte.
- Categorización y severidad.
- Estado del incidente.
- Responsable de atención.
- Inicio y fin de atención.
- Tiempo de atención y tiempo de resolución.
- Diagnóstico.
- Solución aplicada.
- Evidencias y documentos adjuntos.
- Relación con tarjetas, actividades, reuniones y documentación cuando corresponda.
- Historial de eventos del incidente.

Los incidentes se gestionan en un circuito diferenciado del Backlog planificado para no distorsionar la lectura del Sprint.

#### Módulo 6: Centro de Documentación de Aplicativos (App Catalog)

- Catálogo centralizado de aplicativos.
- Información general y ficha técnica.
- Responsables y equipos relacionados.
- Tecnologías utilizadas.
- Ambientes.
- Componentes e integraciones relevantes.
- Repositorios o referencias técnicas cuando corresponda.
- Documentación asociada.
- Diagramas de arquitectura asociados.
- Relación con tarjetas, actividades, incidentes y reuniones.

El objetivo es disponer de un punto central para localizar información técnica sin depender de búsquedas manuales en diferentes ubicaciones.

#### Módulo 7: Reuniones, Acuerdos y Compromisos

Las reuniones deben poder registrarse y relacionarse con uno o varios elementos del sistema.

Una reunión podrá registrar:

- Fecha y hora.
- Participantes.
- Motivo.
- Elementos relacionados.
- Minuta o acta.
- Acuerdos.
- Compromisos.
- Responsable de cada compromiso.
- Fecha compromiso.
- Estado del compromiso.
- Adjuntos.

Las reuniones podrán relacionarse, según corresponda, con:

- HUs u otros elementos del Backlog.
- Actividades.
- Incidentes.
- Aplicaciones.
- Sprints.

#### Módulo 8: Historial / Timeline

El sistema debe conservar una línea de tiempo de eventos relevantes para permitir reconstruir el contexto de trabajo.

Ejemplos de eventos:

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
- Asociación o actualización de documentación.

El Timeline deberá estar disponible al menos para tarjetas, incidentes y aplicaciones, y podrá extenderse a otras entidades.

#### Módulo 9: Dashboard del Líder Técnico

El dashboard debe permitir visualizar de forma resumida:

- Estado actual del Sprint.
- Tarjetas por estado.
- Puntos planificados por rol.
- Puntos ejecutados/completados por rol, cuando corresponda.
- Tarjetas retrasadas.
- Tarjetas en riesgo.
- Tarjetas bloqueadas.
- Actividades pendientes y en progreso.
- Trabajo planificado vs trabajo no planificado.
- Incidentes abiertos y atendidos.
- Tiempo dedicado a incidentes.
- Compromisos pendientes.
- Alertas relevantes.

### 4.2 Exclusiones explícitas (fuera de alcance)

- Automatización de sincronización bidireccional con repositorios de código externos, incluyendo webhooks de GitHub/GitLab para auto-avance de tarjetas.
- Módulos de facturación, costeo financiero de horas hombre o nómina.
- Sistema de Helpdesk multicanal/omnicanal.
- Editor colaborativo en tiempo real estilo Google Docs para minutas.
- Pipeline de CI/CD embebido o despliegue automatizado de infraestructura.
- Aplicación móvil nativa en el MVP.
- Chat interno en el MVP.
- IA generativa en el MVP.
- Integraciones avanzadas con herramientas corporativas en el MVP, salvo que se definan posteriormente como una necesidad prioritaria.

### 4.3 Restricciones tecnológicas heredadas

Las siguientes restricciones corresponden al entorno técnico existente y no constituyen requisitos funcionales del producto:

- **Frontend:** Angular 22 zoneless con Signals, componentes PrimeNG v22.1.1, layout estándar (Topbar, Sidebar colapsable, Breadcrumbs, grillas PrimeNG), i18n nativo y código en `app/frontend/`.
- **Backend:** Modular Monolith (.NET 8/10, C# 12) bajo Vertical Slice Architecture (VSA), con features co-localizadas, Endpoint Carter, Command/Query MediatR y AbstractValidator FluentValidation. No utilizar Controllers tradicionales.
- **Persistencia:** PostgreSQL con esquemas separados y aislados por módulo; prohibición de queries o joins cross-schema; uso de `AuditableEntityInterceptor` y `DispatchDomainEventsInterceptor`.
- **Mensajería e integración:** MassTransit + RabbitMQ para comunicación asíncrona entre módulos y Transactional Outbox para eventos críticos.
- **Identidad y seguridad:** Keycloak mediante OAuth2/OpenID Connect con JWT Bearer Tokens, protegiendo los endpoints mediante `.RequireAuthorization()`.
- **Observabilidad:** Serilog contextualizado hacia Seq.

Estas restricciones deberán ser detalladas y validadas en la fase de Architecture.

---

## 5. RESTRICCIONES DE NEGOCIO Y OPERATIVAS

- Los Sprints deben estar acotados estrictamente a ventanas de 2 semanas de duración.
- Una tarjeta debe permitir estimaciones desglosadas por rol técnico (ej. Desarrollo y QA) sin unificar arbitrariamente el puntaje.
- Las reuniones, minutas, acuerdos y compromisos generados durante el trabajo deben poder quedar vinculados a los elementos correspondientes.
- Los incidentes deben registrarse en un circuito diferenciado e independiente del Backlog planificado del Sprint.
- El sistema debe permitir distinguir trabajo planificado de trabajo no planificado.
- Los elementos relevantes deben conservar historial suficiente para reconstruir decisiones, cambios y eventos.
- La documentación técnica debe poder localizarse desde el contexto de la aplicación correspondiente.
- Las reglas exactas de estados, transiciones, cálculo de retrasos, capacidad y métricas deberán definirse durante las fases posteriores de BMAD.

---

## 6. CRITERIOS DE ÉXITO
*(Métricas o evidencias para determinar si la solución resolvió el problema)*

### 6.1 Indicadores propuestos para el MVP

Los siguientes indicadores son objetivos iniciales y deberán validarse durante la fase de Product Management:

- **Trazabilidad de trabajo:** 100% de las tarjetas del Sprint deben poder consultarse con responsable, rol, estado, estimación y relaciones relevantes.
- **Trazabilidad de reuniones:** 100% de las reuniones relacionadas con trabajo registrado deben poder vincularse a los elementos correspondientes cuando aplique.
- **Trazabilidad de incidentes:** 100% de los incidentes gestionados mediante TechWorkHub deben contar con registro de reporte, estado y tiempos de atención/resolución.
- **Visibilidad del Sprint:** el líder técnico debe poder consultar desde el dashboard el estado de tarjetas, bloqueos, retrasos y trabajo planificado/no planificado.
- **Localización documental:** el líder técnico debe poder acceder a la documentación registrada de una aplicación desde su ficha sin realizar búsquedas manuales en diferentes ubicaciones.
- **Reconstrucción histórica:** debe ser posible consultar el historial de eventos relevantes de una tarjeta, incidente o aplicación.

### 6.2 Indicadores que requieren línea base

Antes de establecer metas cuantitativas definitivas deberán recopilarse datos reales sobre:

- Tiempo promedio actual utilizado para localizar documentación.
- Cantidad promedio mensual de incidentes fuera del Sprint.
- Tiempo promedio de atención y resolución de incidentes.
- Cantidad de reuniones relacionadas con tarjetas.
- Cantidad de tarjetas que presentan retrasos o bloqueos.
- Horas de trabajo no planificado durante un Sprint.
- Tiempo utilizado actualmente para preparar reportes del Sprint.

No se debe asumir una reducción porcentual específica hasta disponer de una línea base.

---

## 7. SUPUESTOS
*(Hipótesis que requieren validación)*

- ⚠️ **SUPUESTO:** El líder técnico y el equipo adoptarán TechWorkHub como punto central para registrar y consultar el contexto del trabajo gestionado por la plataforma.
- ⚠️ **SUPUESTO:** TechWorkHub no necesariamente reemplazará las herramientas corporativas existentes; podrá coexistir con ellas y, en versiones futuras, integrarse con ellas.
- ⚠️ **SUPUESTO:** Las estimaciones diferenciadas por rol utilizarán una escala acordada por el equipo.
- ⚠️ **SUPUESTO:** Los archivos y evidencias adjuntas se almacenarán inicialmente mediante el mecanismo estándar definido para la infraestructura del proyecto, sin requerir proveedores cloud externos en el MVP.
- ⚠️ **SUPUESTO:** La autenticación y roles de acceso se mapearán contra el servidor de identidad Keycloak existente.
- ⚠️ **SUPUESTO:** Las reglas exactas de cálculo de capacidad, retrasos y métricas serán definidas después de validar el proceso real del equipo.

---

## 8. PREGUNTAS ABIERTAS
*(Vacíos críticos que deben resolverse durante Product Management, UX y Architecture)*

1. ¿Qué estados y transiciones debe tener cada tipo de elemento del Backlog Multitipo?
2. ¿Qué estados y transiciones debe seguir una actividad operativa?
3. ¿Qué estados y transiciones debe seguir un incidente? Ejemplo: Reportado → En Diagnóstico → En Resolución → Resuelto → Cerrado.
4. ¿Cómo se determinará formalmente que una tarjeta está retrasada?
5. ¿Cómo se determinará que una tarjeta está "En riesgo"?
6. ¿Cómo se calculará la capacidad de una persona durante un Sprint?
7. ¿Los puntos de Dev y QA utilizan la misma escala o pueden tener reglas diferentes?
8. ¿Los ítems de tipo Bug, Deuda Técnica, Spike y demás elementos del Backlog Multitipo admiten estimaciones diferenciadas por rol?
9. ¿Una tarjeta puede pertenecer a más de un Sprint o debe existir una única pertenencia histórica?
10. ¿Qué actividades deben considerarse trabajo planificado y cuáles trabajo no planificado?
11. ¿Cómo se contabilizará una actividad que surge durante el Sprint pero que está relacionada con una HU existente?
12. ¿Una reunión puede relacionarse con múltiples tarjetas, aplicaciones, incidentes y actividades?
13. ¿Qué compromisos de una reunión deben generar automáticamente actividades?
14. ¿Qué tamaño máximo y formatos se permitirán para archivos y evidencias?
15. ¿Qué niveles de visibilidad y edición tendrán las fichas técnicas y diagramas de aplicaciones?
16. ¿La documentación se almacenará físicamente dentro de TechWorkHub o se mantendrán referencias a repositorios/documentos externos?
17. ¿TechWorkHub será una herramienta independiente o se integrará posteriormente con Azure DevOps/Jira u otras herramientas?
18. ¿Qué métricas deben formar parte del dashboard del líder técnico y cuáles deben quedar fuera del MVP?

---

## 9. PRINCIPIOS DE PRODUCTO

### 9.1 Contexto antes que cantidad

El valor principal de TechWorkHub está en conservar el contexto relacionado con el trabajo, no simplemente en almacenar tareas.

### 9.2 Trazabilidad

Los eventos, decisiones, acuerdos, bloqueos e incidentes relevantes deben poder reconstruirse posteriormente.

### 9.3 Trabajo planificado y no planificado

El producto debe permitir visualizar ambos tipos de trabajo para comprender cómo se utiliza realmente la capacidad del equipo.

### 9.4 Simplicidad

La aplicación debe evitar convertirse innecesariamente en una réplica completa de Jira u otras plataformas corporativas.

### 9.5 Relación entre información

Los elementos deben poder relacionarse entre sí para evitar información aislada.

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

### 9.6 Historial

La información relevante debe conservar una línea temporal que permita comprender cómo evolucionó el trabajo.

---

## 10. RELACIONES CONCEPTUALES PRINCIPALES

El modelo conceptual inicial del producto puede expresarse de la siguiente manera:

```text
                         ┌──────────────────┐
                         │    APLICACIÓN    │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
        DOCUMENTACIÓN         INCIDENTES          ACTIVIDADES
                                  │                    │
                                  │                    │
             ┌────────────────────┼────────────────────┘
             │
             ▼
        ┌─────────────┐
        │    SPRINT   │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │   BACKLOG   │
        │  MULTITIPO  │
        └──────┬──────┘
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
     HU       BUG       DT ...
      │
      ├── Roles / Personas
      ├── Puntos
      ├── Estados
      ├── Bloqueos
      ├── Retrasos
      ├── Actividades
      └── Reuniones
              │
              ├── Minuta / Acta
              ├── Acuerdos
              └── Compromisos

Todos los elementos relevantes mantienen:

                 ┌──────────────┐
                 │   TIMELINE   │
                 └──────────────┘
```

Este modelo es conceptual y no constituye todavía el diseño de base de datos.

---

## 11. RESULTADO ESPERADO DEL MVP

Al finalizar un Sprint, el líder técnico debe poder consultar TechWorkHub y responder, desde un único punto:

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
- ¿Qué incidentes y actividades están relacionados con ellas?

### Historial

- ¿Qué ocurrió?
- ¿Cuándo ocurrió?
- ¿Quién realizó el cambio?
- ¿Qué decisión o evento provocó el cambio?

---

## 12. ORDEN DE DELEGACIÓN PARA EL TRACKER
*(Pausa HITL antes de pasar a Product Management)*

El Product Brief debe ser revisado y aprobado por el humano responsable antes de continuar con la fase de Product Management.

**Estado:** Pendiente de aprobación HITL.

**Siguiente paso:** validar el presente Product Brief y, una vez aprobado, ejecutar el mecanismo de autorización definido por el flujo BMAD para delegar al `product-manager`.

> Nota: La aprobación del Product Brief no implica todavía la aprobación de arquitectura, modelo de datos, UX ni reglas funcionales detalladas. Estas decisiones deberán resolverse en las fases correspondientes.
