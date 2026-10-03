Soy el líder técnico de desarrollo y arquitectura de software y necesito resolver el descontrol operativo generado por la dispersión de información y la falta de un sistema centralizado para la gestión del trabajo de mi equipo y mis aplicaciones.

Actualmente, enfrentamos graves fricciones en la gestión del día a día:

1. Pérdida de trazabilidad en los Sprints (2 semanas): Se nos dificulta hacer seguimiento a las tarjetas del backlog planificadas. Asignamos estimaciones diferenciadas por rol (ej. QA: 2 pts, Dev: 3 pts en una misma HU), pero no tenemos visibilidad en tiempo real de su avance, retrasos o bloqueos. Además, los acuerdos, actas y minutas de las reuniones asociadas a una tarjeta se pierden en correos o notas sueltas sin poder vincularse a la Historia de Usuario del sprint.
2. Atención de incidentes sin registro centralizado: Atendemos de forma reactiva fallas e incidentes no planificados fuera del sprint. Al no contar con una bitácora estructurada, perdemos la trazabilidad del error, usuario reportante, fecha, tiempos de solución, diagnóstico, solución aplicada y documentos de referencia adjuntos.
3. Desconexión y dispersión de la documentación técnica: La información general de las aplicaciones, diagramas de arquitectura y especificaciones técnicas están dispersas en discos duros locales y repositorios desconectados, dificultando su consulta rápida y actualización.

Para resolver esto, necesitamos construir TechWorkHub, una plataforma centralizada de gestión de trabajo técnico estructurada en los siguientes bloques funcionales:

• Gestión de Equipos y Roles: Control y asignación de roles técnicos (Desarrolladores, QAs, etc.) para monitorear la capacidad, actividades y puntajes específicos asignados a mis subordinados.
• Gestión del Backlog Multitipo: Registro integral de ítems con soporte para Historias de Usuario (con criterios de aceptación y objetivos de certificación), Bugs, Evoluciones Tecnológicas, Requerimientos Técnicos, Deuda Técnica, Investigaciones y Spikes.
• Planificación y Control de Sprints: Configuración de ciclos bisemanales con asignación de tarjetas, seguimiento de puntajes por rol, control de estados/bloqueos y vinculación directa de minutas, actas y acuerdos de reuniones a las tarjetas del sprint.
• Bitácora de Incidentes: Registro especializado de incidentes fuera de sprint con captura de evidencias, tiempos de atención/resolución y adjuntos.
• Centro de Documentación de Aplicativos (App Catalog): Módulo centralizado para estructurar información general, fichas técnicas y diagramas de arquitectura por aplicativo.
