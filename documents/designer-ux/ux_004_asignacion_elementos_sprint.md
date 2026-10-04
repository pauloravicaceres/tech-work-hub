# ESPECIFICACIÓN DE DISEÑO UX: Asignación de Elementos del Backlog a un Sprint

- **Historia de Usuario Fuente:** `documents/business-analyst/004-HU_asignacion_elementos_sprint.md`
- **Spec Kit Fuente:** `specs/004-HU_asignacion_elementos_sprint/spec.md` y `specs/004-HU_asignacion_elementos_sprint/checklists/requirements.md`
- **Resolución Humana Incorporada:** clarificación de `tracker_bmad.md` (04-10-2026, 10:32:00), opción **A**: un elemento pertenece a un solo Sprint; solicitar asignar un elemento ya asignado a cualquier Sprint (mismo u otro) se rechaza con **HTTP 409 Conflict**.
- **Fecha de Diseño:** 04-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (subordinado a `.specify/memory/constitution.md`)
- **Stack de Presentación:** Angular 22 (Zoneless, Signals) + PrimeNG v22.1.1 (Tema Neutral). La solución opera como **módulo embebido** dentro del shell existente (Topbar + Sidebar + Breadcrumb + Footer) que ya usan los módulos Backlog (HU-001) y Sprints (HU-003).

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `004-HU_asignacion_elementos_sprint` - Asignación de Elementos del Backlog a un Sprint (asignar y consultar lo asignado).
- **Enfoque de Usabilidad:** Una única vista contextual por Sprint, "Elementos asignados", que reúne las dos capacidades de la HU: consultar lo asignado (grilla de solo lectura) y asignar un elemento (diálogo modal de un solo campo). El Sprint se toma siempre del contexto de la ruta, de modo que el Líder Técnico solo debe indicar el identificador del elemento y ve el resultado en la misma pantalla, sin cambiar de contexto (SC-001: asignar y verlo en menos de 1 minuto).
- **Alcance visual (restricciones de negocio respetadas en el 100 % de las pantallas):**
  - Cada solicitud asigna **un** elemento a **un** Sprint (FR-001): no existe selección múltiple ni asignación en lote.
  - **No existe** desasignar, mover ni reasignar un elemento (fuera de alcance, punto abierto 5): la grilla no tiene acciones de quitar.
  - **No se muestra ni se modifica el estado** del elemento ni del Sprint (FR-013, FR-014): la grilla solo contiene identificador, título, tipo y estimaciones por rol (FR-008).
  - Sin filtros, orden, buscador ni paginación (punto abierto 7 de la HU); sin límites de carga ni indicadores de capacidad (punto abierto 4).
  - Sin restricción visual por estado o fecha del Sprint ni por tipo/estado del elemento (puntos abiertos 3 y 4).
- **Mapa de rutas del módulo:** `/sprints/:id/elementos` (vista "Elementos asignados"; la asignación es un diálogo modal sobre esta misma ruta, sin ruta propia).
- **Punto de entrada:** botón `Elementos asignados` en la vista de detalle del Sprint de HU-003 (`/sprints/:id`). Es un añadido de navegación; no altera los cuatro datos ni el resto de la vista de HU-003 (FR-013).

### Trazabilidad Escenario → Estado Visual (1 a 1)

| Escenario | Estado Visual |
|---|---|
| SC-03 Consulta de elementos asignados a un Sprint | Estado 1 (grilla con datos) |
| SC-04 Consulta de un Sprint sin elementos asignados | Estado 2 (grilla vacía) |
| SC-01 Asignación de un elemento a un Sprint existente | Estado 3 (diálogo de asignación) + Estado 4 (confirmación y grilla actualizada) |
| SC-02 Asignación de varios elementos distintos al mismo Sprint | Estado 5 (segunda asignación; el Sprint queda con exactamente dos elementos) |
| SC-05 Asignación a un Sprint inexistente | Estado 6 |
| SC-06 Asignación de un elemento inexistente | Estado 7 |
| SC-07 Identificadores ausentes o malformados | Estado 8 |
| SC-08 Consulta de los elementos de un Sprint inexistente | Estado 9 |
| SC-09 Acceso sin credenciales válidas (asignar, consultar) | Estado 10 |
| SC-10 Fallo de persistencia al asignar | Estado 11 |
| Clarificación humana A: elemento ya asignado (409) | Estado 12 (sin escenario Gherkin en la HU ni en `spec.md` todavía; ver §3, B-01) |

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Elementos Asignados a un Sprint con Datos - Happy Path
- **Escenario Cubierto:** SC-03 [Happy Path] Consulta de los elementos asignados a un Sprint (FR-008; US2-A1).
- **ID de Tarea Spec Kit:** `Task-UI-01: Grilla SprintAssignedItems` (provisional: `tasks.md` de la HU 004 aún no existe; el SA debe reconciliar el ID).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                   |
|                         +------------------------------------------------------------------------------------------+
| [>] Sprints             | ELEMENTOS ASIGNADOS - SPRINT 2026-01                                                     |
|     - [Ver Sprints]     | Trabajo planificado para el ciclo (05/10/2026 - 18/10/2026).  [ [+] Asignar elemento ]   |
|     - [+ Nuevo Sprint]  |                                                                                          |
| [o] Backlog Multitipo   | +--------------------------------------------------------------------------------------+ |
| [o] Incidentes          | | [p-table]                                                                            | |
| [o] Aplicaciones        | | IDENTIFICADOR      | TÍTULO                       | TIPO       | EST. DEV | EST. QA | ACCIONES| |
| [o] Equipos y Roles     | |--------------------+------------------------------+------------+----------+---------+---------| |
| [o] Reuniones           | | 9a41-33c0-...-7e10 | Registro de aplicaciones     | UserStory  | 8        | 5       | [ojo]   | |
| [o] Configuración       | | b2f7-90d1-...-04aa | Corregir cálculo de puntos   | Bug        | 3        | 2       | [ojo]   | |
|                         | | e5c8-1a77-...-5d92 | Migrar esquema de auditoría  | TechDebt   | 5        | --      | [ojo]   | |
|                         | +--------------------------------------------------------------------------------------+ |
|                         | [ [<] Volver al detalle del Sprint ]                                                     |
+--------------------------------------------------------------------------------------------------------------------+
| [Footer] TechWorkHub v1.0 | Modulith .NET 8 + Angular 22 Zoneless | PrimeNG v22.1.1                               |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-menubar>`, `<p-sidebar>`, `<p-breadcrumb>`, `<p-table>`, `<p-button>` (acción principal e icono `pi-eye` con `pTooltip` "Ver elemento").
  - **Modo de integración:** módulo embebido en el shell existente; el nivel "Sprints" del breadcrumb y de la navegación ya existe por HU-003.
  - **Disparadores de Estado:** clic en `Elementos asignados` desde `/sprints/:id`, o navegación directa a `/sprints/:id/elementos`; respuesta HTTP 200 OK con elementos.
  - **Reglas de Componente:**
    - Columnas exactamente las indicadas por FR-008 (identificador, título, tipo, estimaciones por rol) más la columna de acciones del esqueleto estándar. **No hay** columna de estado del elemento (FR-013, FR-014).
    - Las estimaciones por rol se muestran como las define HU-001 (Dev y QA, independientes); un valor no informado (p. ej. QA de un ítem técnico) se muestra como `--`.
    - Botón principal `Asignar elemento` anclado en la zona superior derecha del contenedor de datos (directiva de maquetación).
    - Única acción por fila: `Ver elemento` (navega al elemento en el módulo Backlog existente; no es una funcionalidad nueva de esta HU). **No se ofrece** quitar, mover ni reasignar.
    - Sin buscador, filtros, orden configurable ni paginación (decisión D-03). Consulta de solo lectura: ninguna interacción de la grilla modifica datos.
    - Sin indicadores de capacidad, totales de puntos ni límites de carga (punto abierto 4).

---

### Estado 2: Sprint sin Elementos Asignados (Empty State) - Happy Path
- **Escenario Cubierto:** SC-04 [Happy Path] Consulta de un Sprint sin elementos asignados: HTTP 200 OK con colección vacía (FR-009; US2-A2).
- **ID de Tarea Spec Kit:** `Task-UI-01: Grilla SprintAssignedItems` (variante vacía, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-02 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| ELEMENTOS ASIGNADOS - SPRINT 2026-02                                                                               |
| Trabajo planificado para el ciclo (19/10/2026 - 01/11/2026).                         [ [+] Asignar elemento ]      |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-table]  IDENTIFICADOR | TÍTULO | TIPO | EST. DEV | EST. QA | ACCIONES                                       | |
| |----------------------------------------------------------------------------------------------------------------| |
| |                                                                                                                | |
| |                        (i)  Este Sprint aún no tiene elementos asignados.                                      | |
| |                             Use "Asignar elemento" para agregar el primero.                                    | |
| |                                                                                                                | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-table>` con plantilla `emptymessage`, `<p-button>`.
  - **Disparadores de Estado:** respuesta 200 OK con colección vacía.
  - **Reglas de Componente:** el mensaje es informativo, no un error; el botón `Asignar elemento` permanece activo.

---

### Estado 3: Diálogo de Asignación de un Elemento - Happy Path (formulario)
- **Escenario Cubierto:** SC-01 [Happy Path] Asignación de un elemento del backlog a un Sprint existente, fase de captura (FR-001; US1-A1).
- **ID de Tarea Spec Kit:** `Task-UI-02: Diálogo AssignItemDialog` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás)                                                 |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR ELEMENTO AL SPRINT                                       [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  SPRINT                                                                          |                    |
|            |  Sprint 2026-01  (3f1c-8a02-...-91de)                          (solo lectura)    |                    |
|            |                                                                                  |                    |
|            |  IDENTIFICADOR DEL ELEMENTO DEL BACKLOG (*)                                      |                    |
|            |  [ 7b1c2d3e-0000-4000-8000-000000000003 ......................................  ] |                    |
|            |  (i) Se asigna un elemento por solicitud.                                        |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog [modal]="true">`, `<p-inputtext>`, `<p-button>`.
  - **Disparadores de Estado:** clic en `Asignar elemento` desde los Estados 1 o 2.
  - **Reglas de Componente:**
    - El Sprint se muestra como dato de contexto, no editable (se toma de la ruta); el único campo editable es el identificador del elemento, con autofocus al abrir.
    - El botón `Asignar` permanece habilitado mientras no haya envío en curso: los errores se muestran tras el intento de envío (Estados 7, 8 y 12), de modo que el servidor sea la fuente de verdad de FR-005..FR-007 (decisión D-05).
    - Al pulsar `Asignar`: deshabilitar el botón y mostrar spinner (`<p-button [loading]="isSubmitting()">`), enviar la solicitud de asignación (ruta provisional, a confirmar por el API Architect) y, ante éxito, pasar al Estado 4.
    - `Cancelar` o `[x]` cierran el diálogo sin persistir nada. La tecla `Esc` también lo cierra (no hay confirmación destructiva en esta operación).

---

### Estado 4: Asignación Confirmada - Happy Path
- **Escenario Cubierto:** SC-01 [Happy Path] Confirmación con código de éxito e identificadores del Sprint y del elemento (FR-002, FR-003; US1-A1, US1-A2).
- **ID de Tarea Spec Kit:** `Task-UI-03: Confirmación y Refresco de Grilla` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| ELEMENTOS ASIGNADOS - SPRINT 2026-01                                         +--------------------------------+    |
| Trabajo planificado para el ciclo (05/10/2026 - 18/10/2026).                 | [p-toast]                      |    |
|                                              [ [+] Asignar elemento ]        | (✓) Elemento asignado.         |    |
|                                                                              | Sprint:   3f1c-8a02-...-91de   |    |
| +--------------------------------------------------------------------------+ | Elemento: 7b1c-2d3e-...-0003   |    |
| | [p-table]                                                                | +--------------------------------+    |
| | IDENTIFICADOR      | TÍTULO                    | TIPO      | EST. DEV | EST. QA | ACCIONES |                     |
| |--------------------+---------------------------+-----------+----------+---------+----------|                     |
| | 7b1c-2d3e-...-0003 | Registro de aplicaciones  | UserStory | 8        | 5       | [ojo]    |  <- fila nueva      |
| +--------------------------------------------------------------------------------------------+                     |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-toast>` (arriba-derecha, severidad `success`), `<p-table>`.
  - **Disparadores de Estado:** respuesta de éxito de la asignación (el código exacto es ⚠️ [PROPUESTO] en la HU y lo fija el API Architect).
  - **Reglas de Componente:**
    - El diálogo se cierra; el toast muestra el identificador del Sprint y el del elemento devueltos por el servidor y se descarta solo a los 5 s o con el botón de cierre.
    - La grilla se refresca con una consulta fresca al servidor (no se inserta la fila de forma optimista) para que lo visible coincida exactamente con lo persistido (SC-004).
    - El elemento mantiene sin cambios sus datos (título, tipo, estimaciones): la fila muestra los valores del servidor, sin mostrar estado ni ofrecer edición (FR-013, FR-014).

---

### Estado 5: Varios Elementos en el Mismo Sprint - Happy Path
- **Escenario Cubierto:** SC-02 [Happy Path] Asignación de dos elementos distintos al mismo Sprint en solicitudes sucesivas; el Sprint queda con exactamente esos dos elementos (FR-004; US1-A3).
- **ID de Tarea Spec Kit:** `Task-UI-03: Confirmación y Refresco de Grilla` (segunda ejecución del mismo flujo, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| ELEMENTOS ASIGNADOS - SPRINT 2026-01                                         +--------------------------------+    |
|                                              [ [+] Asignar elemento ]        | [p-toast]                      |    |
|                                                                              | (✓) Elemento asignado.         |    |
| +--------------------------------------------------------------------------+ | Elemento: b2f7-90d1-...-04aa   |    |
| | [p-table]                                                                | +--------------------------------+    |
| | IDENTIFICADOR      | TÍTULO                    | TIPO      | EST. DEV | EST. QA | ACCIONES |                     |
| |--------------------+---------------------------+-----------+----------+---------+----------|                     |
| | 7b1c-2d3e-...-0003 | Registro de aplicaciones  | UserStory | 8        | 5       | [ojo]    |  <- 1.ª asignación  |
| | b2f7-90d1-...-04aa | Corregir cálculo de puntos| Bug       | 3        | 2       | [ojo]    |  <- 2.ª asignación  |
| +--------------------------------------------------------------------------------------------+                     |
|   (la grilla contiene exactamente los dos elementos asignados; ninguno más, ninguno menos)                         |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-toast>`, `<p-table>`, `<p-dialog>` (mismo diálogo del Estado 3, reutilizado).
  - **Disparadores de Estado:** segunda asignación exitosa sobre el mismo Sprint, con un elemento distinto.
  - **Reglas de Componente:** el diálogo vuelve a abrirse limpio (campo vacío) cada vez; cada asignación es una solicitud independiente (sin asignación en lote). La grilla siempre se renderiza desde la respuesta del servidor.

---

### Estado 6: Asignación a un Sprint Inexistente (Sad Path)
- **Escenario Cubierto:** SC-05 [Sad Path] Asignación a un Sprint inexistente: HTTP 404 Not Found, sin persistencia (FR-005, FR-011; CB-01; US3-A1).
- **ID de Tarea Spec Kit:** `Task-UI-04: Manejo de 404 de Sprint al Asignar` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > No encontrado                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
| ELEMENTOS ASIGNADOS                                                                                                |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR ELEMENTO AL SPRINT                                       [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="error"]                                                    |                    |
|            |  (!) El Sprint indicado no existe. No se registró ninguna asignación.            |                    |
|            |                                                                                  |                    |
|            |  IDENTIFICADOR DEL ELEMENTO DEL BACKLOG (*)                                      |                    |
|            |  [ 7b1c2d3e-0000-4000-8000-000000000003 ......................................  ] |                    |
|            |                                                                                  |                    |
|            |                       [ [<] Volver al listado de Sprints ]     [ (X) Asignar ]   |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 404 al asignar, cuando el mensaje indica que el Sprint no existe (por ejemplo, el Sprint de la ruta ya no existe o la ruta fue manipulada).
  - **Reglas de Componente:**
    - El mensaje distingue explícitamente "Sprint" de "elemento" (Estado 7) para que el usuario sepa qué dato corregir.
    - El botón `Asignar` queda deshabilitado (reintentar con el mismo Sprint inexistente es inútil); el único camino de salida es `Volver al listado de Sprints`. El contexto del Sprint no es editable, por lo que no hay campo que corregir.
    - No se agrega ninguna fila a la grilla ni se muestra toast de éxito (FR-011).

---

### Estado 7: Asignación de un Elemento Inexistente (Sad Path)
- **Escenario Cubierto:** SC-06 [Sad Path] Asignación de un elemento inexistente: HTTP 404 Not Found, sin persistencia (FR-006, FR-011; CB-02; US3-A2).
- **ID de Tarea Spec Kit:** `Task-UI-05: Manejo de 404 de Elemento al Asignar` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás)                                                 |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR ELEMENTO AL SPRINT                                       [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="error"]                                                    |                    |
|            |  (!) El elemento del backlog indicado no existe. No se registró ninguna          |                    |
|            |      asignación.                                                                 |                    |
|            |                                                                                  |                    |
|            |  SPRINT                                                                          |                    |
|            |  Sprint 2026-01  (3f1c-8a02-...-91de)                          (solo lectura)    |                    |
|            |                                                                                  |                    |
|            |  IDENTIFICADOR DEL ELEMENTO DEL BACKLOG (*)                    (borde de error)  |                    |
|            |  [ 7b1c2d3e-0000-4000-8000-0000000000ff ......................................  ] |                    |
|            |  * No existe un elemento del backlog con este identificador. *                   |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, mensaje en línea bajo el campo (`<small class="p-error">` de PrimeNG, sin clases propias), estado `ng-invalid ng-dirty`.
  - **Disparadores de Estado:** respuesta HTTP 404 al asignar, cuando el mensaje indica que el elemento no existe.
  - **Reglas de Componente:**
    - El diálogo permanece abierto, conserva el valor ingresado y devuelve el foco al campo; el botón `Asignar` se rehabilita para corregir y reintentar.
    - No se agrega ninguna fila ni se muestra toast de éxito (FR-011).

---

### Estado 8: Identificadores Ausentes o Malformados (Sad Path)
- **Escenario Cubierto:** SC-07 [Sad Path] Rechazo HTTP 400 por identificador de Sprint o de elemento ausente o con formato inválido, con el detalle de los campos inválidos (FR-007, FR-011; CB-03; US3-A3).
- **ID de Tarea Spec Kit:** `Task-UI-06: Validación de Identificadores` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Variante A - Identificador del elemento ausente o con formato inválido (diálogo):
+--------------------------------------------------------------------------------------------------------------------+
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR ELEMENTO AL SPRINT                                       [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="error"]                                                    |                    |
|            |  (!) Revise los campos marcados: hay datos obligatorios ausentes o inválidos.    |                    |
|            |                                                                                  |                    |
|            |  IDENTIFICADOR DEL ELEMENTO DEL BACKLOG (*)                    (borde de error)  |                    |
|            |  [ no-es-un-identificador ....................................................  ] |                    |
|            |  * El identificador del elemento no tiene un formato válido. *                   |                    |
|            |                                                                                  |                    |
|            |      (campo vacío:  * El identificador del elemento es obligatorio. *)           |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+

Variante B - Identificador del Sprint ausente o con formato inválido (ruta /sprints/:id/elementos malformada):
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Identificador no válido                                                          |
+--------------------------------------------------------------------------------------------------------------------+
| ELEMENTOS ASIGNADOS                                                                                                |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-message severity="error"]                                                                                   | |
| |   (!) El identificador del Sprint es ausente o no tiene un formato válido.                                     | |
| |       No se registró ninguna asignación. Regrese al listado y seleccione un Sprint.                            | |
| |                                                  [ [<] Volver al listado de Sprints ]                          | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, mensajes en línea por campo, `<p-button>`.
  - **Disparadores de Estado:** intento de envío con el campo vacío o malformado (validación del cliente) o respuesta HTTP 400 con la lista de campos inválidos (validación del servidor, `errors` del ProblemDetails, patrón HU-001).
  - **Reglas de Componente:**
    - Cubre los cuatro casos de la HU: elemento ausente y elemento con formato inválido (Variante A) y Sprint ausente y Sprint con formato inválido (Variante B, al no poder fijarse desde la UI).
    - Cada campo inválido muestra su propio mensaje en línea tomado del detalle devuelto por el servidor cuando la validación proviene del backend. Foco automático en el campo inválido; el valor ingresado se conserva.
    - No se persiste nada ni se agrega fila a la grilla (FR-011).

---

### Estado 9: Consulta de un Sprint Inexistente (Sad Path)
- **Escenario Cubierto:** SC-08 [Sad Path] Consulta de los elementos de un Sprint inexistente: HTTP 404 Not Found (FR-005; US2-A3).
- **ID de Tarea Spec Kit:** `Task-UI-07: Estado 404 de Consulta` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > No encontrado                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
| ELEMENTOS ASIGNADOS                                                                                                |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-message severity="warn"]                                                                                    | |
| |   (!) El Sprint solicitado no existe.                                                                          | |
| |       Verifique el identificador o regrese al listado.                                                         | |
| |                                                                                                                | |
| |                                              [ [<] Volver al listado de Sprints ]                              | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-message severity="warn">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 404 al consultar `/sprints/:id/elementos`.
  - **Reglas de Componente:** se muestra en la misma ruta (sin redirección automática); no se renderiza la grilla ni el botón `Asignar elemento` (no hay Sprint al que asignar); el único camino de salida es `Volver al listado de Sprints`. El mensaje no revela detalles internos.

---

### Estado 10: Sesión Inválida o Expirada (Sad Path)
- **Escenario Cubierto:** SC-09 [Sad Path] Acceso sin credenciales válidas en las dos operaciones: asignar un elemento y consultar los elementos de un Sprint, HTTP 401 Unauthorized (FR-010, FR-011; CB-04; US4-A1).
- **ID de Tarea Spec Kit:** `Task-UI-08: Manejo de 401 y Reautenticación` (provisional; reutiliza el interceptor Bearer y el guard con reautenticación de HU-001).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Elementos asignados                                                              |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; sin datos de asignación visibles)                                                    |
|                                                                                                                    |
|                  +--------------------------------------------------------------------------+                     |
|                  | [p-dialog] SESIÓN NO VÁLIDA                                  (sin [x])  |                     |
|                  |--------------------------------------------------------------------------|                     |
|                  |  (!) Su sesión no es válida o ha expirado.                               |                     |
|                  |      Inicie sesión nuevamente para continuar.                            |                     |
|                  |                                                                          |                     |
|                  |                                        [ [✓] Iniciar sesión ]            |                     |
|                  +--------------------------------------------------------------------------+                     |
+--------------------------------------------------------------------------------------------------------------------+

Operaciones que pueden originar este estado (misma pantalla, mismo diálogo):
  - Asignar un elemento (envío del diálogo) -> no se persiste nada; el diálogo de asignación se cierra.
  - Consultar los elementos del Sprint (GET) -> la grilla no se renderiza con datos.
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog [modal]="true" [closable]="false" [closeOnEscape]="false">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 401 (token ausente, inválido o expirado) que persiste tras el reintento único de renovación del interceptor Bearer (HU-001).
  - **Reglas de Componente:**
    - Modal con backdrop no descartable; la única acción es `Iniciar sesión`, que dispara la reautenticación existente (flujo PKCE de HU-001).
    - Se oculta cualquier dato de asignación previamente cargado en pantalla y el diálogo de asignación. El diálogo no menciona detalles técnicos del token.

---

### Estado 11: Fallo de Persistencia al Asignar (Sad Path)
- **Escenario Cubierto:** SC-10 [Sad Path] Fallo de persistencia al asignar: HTTP 500 sin trazas internas y sin asignación parcial (FR-011, FR-012; CB-05; US4-A2).
- **ID de Tarea Spec Kit:** `Task-UI-09: Manejo de Error 500 en Asignación` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás, sin la fila del intento fallido)                |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR ELEMENTO AL SPRINT                                       [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="error"]                                                    |                    |
|            |  (!) No fue posible asignar el elemento. No se registró ninguna asignación.      |                    |
|            |      Intente nuevamente en unos minutos.                                         |                    |
|            |                                                                                  |                    |
|            |  IDENTIFICADOR DEL ELEMENTO DEL BACKLOG (*)                                      |                    |
|            |  [ 7b1c2d3e-0000-4000-8000-000000000003 ......................................  ] |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 500 Internal Server Error al enviar una asignación válida.
  - **Reglas de Componente:**
    - El mensaje es genérico: nunca se muestran trazas, códigos internos ni el cuerpo crudo de la respuesta.
    - El valor ingresado se conserva y el botón `Asignar` se rehabilita para reintento manual (sin reintento automático). No se agrega fila ni se muestra toast de éxito; no se muestra ninguna asignación parcial.

---

### Estado 12: Elemento Ya Asignado a un Sprint (Sad Path, clarificación humana)
- **Escenario Cubierto:** Resolución humana "A" del Spec Kit (04-10-2026, 10:32:00): HTTP 409 Conflict si el elemento ya está asignado a cualquier Sprint, mismo u otro; un elemento pertenece a un solo Sprint. **Sin escenario Gherkin en la HU ni en `spec.md`** al momento del diseño (ver §3, B-01); sustituye los casos borde CB-06 y CB-07, antes ❓ No documentado.
- **ID de Tarea Spec Kit:** `Task-UI-10: Manejo de 409 por Elemento ya Asignado` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Sprint 2026-01 > Elementos asignados                                             |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás, sin cambios)                                    |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR ELEMENTO AL SPRINT                                       [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="warn"]                                                     |                    |
|            |  (!) El elemento ya está asignado a un Sprint. Un elemento solo puede            |                    |
|            |      pertenecer a un Sprint. No se registró ninguna asignación.                  |                    |
|            |                                                                                  |                    |
|            |  IDENTIFICADOR DEL ELEMENTO DEL BACKLOG (*)                    (borde de error)  |                    |
|            |  [ 7b1c2d3e-0000-4000-8000-000000000003 ......................................  ] |                    |
|            |  * Este elemento ya pertenece a un Sprint. *                                     |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="warn">`, mensaje en línea bajo el campo, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 409 Conflict al asignar un elemento ya asignado (al mismo Sprint o a otro).
  - **Reglas de Componente:**
    - El mensaje es el mismo para ambos casos (mismo Sprint u otro): la regla es "un elemento, un solo Sprint". **No** se revela a qué Sprint pertenece ni se ofrece mover, reasignar o quitar el elemento (movimiento y desasignación están fuera de alcance).
    - El diálogo permanece abierto con el valor ingresado para que el usuario corrija el identificador; el botón `Asignar` se rehabilita. No se agrega fila ni toast de éxito, y la grilla permanece sin cambios.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES

- **Heurísticas Aplicadas:**
  - **D-01 Vista contextual por Sprint:** la asignación se resuelve como diálogo sobre la grilla de elementos del Sprint, en lugar de un formulario con selector de Sprint, porque la HU asigna siempre a un Sprint concreto y así se evita un segundo campo que podría quedar inválido. No altera reglas de negocio.
  - **D-02 Ruta de la vista y punto de entrada:** `/sprints/:id/elementos`, accesible desde un botón en el detalle del Sprint de HU-003. Se evita insertar la grilla dentro de la vista de HU-003 para no modificar su comportamiento (FR-013). La ruta es provisional hasta que el SA/API Architect la confirme.
  - **D-03 Grilla sin paginación, filtros ni orden:** el esqueleto estándar prevé paginación inferior, pero la política anti-alucinación prohíbe controles que no provengan de un criterio de aceptación y el formato de la consulta no está definido (punto abierto 7). El rendimiento está acotado a 100 elementos (SC-006). Se mantiene el resto del esqueleto (topbar, sidebar, breadcrumb, columna de acciones, acción principal arriba a la derecha, footer). Si el negocio define orden o paginación se rediseñará el Estado 1.
  - **D-04 Vista vacía (Estado 2):** es la representación visual de SC-04; mensaje informativo, sin funcionalidad nueva.
  - **D-05 Validación del servidor como fuente de verdad:** el botón `Asignar` no se bloquea por validación del cliente; los Estados 6, 7, 8 y 12 reflejan la respuesta del servidor (FR-005..FR-007), evitando duplicar reglas de negocio en el cliente.
  - **D-06 Ubicación de errores:** errores de recurso (404, 409, 500) en banner `p-message` dentro del diálogo, con mensaje en línea cuando el campo es el causante; errores de campo (400) en línea. La HU no fija banner vs. en línea; decisión heurística estándar. El 404 de Sprint (Estado 6) bloquea el reintento porque el Sprint no es editable en la UI.
  - **D-07 Refresco desde el servidor:** tras asignar se vuelve a consultar la grilla en lugar de insertar la fila localmente, para que lo visible coincida con lo persistido (SC-004).
  - **D-08 Captura del identificador del elemento:** el diálogo recibe el identificador del elemento como texto, porque la HU y la spec no definen un listado ni un buscador de elementos del backlog para esta funcionalidad (agregarlo sería inventar capacidad). Esto es coherente con los casos de la HU basados en el identificador (SC-06, SC-07). Ver B-02.
  - **D-09 IDs de tarea y rutas provisionales:** `tasks.md` de la HU 004 aún no existe (se genera en la fase de arquitectura). Los `Task-UI-xx` y las rutas de API son provisionales y deben ser reconciliados por el SA/API Architect.
  - **Restricciones de negocio verificadas en todas las pantallas:** un elemento por solicitud; sin desasignar, mover ni reasignar; sin estado del elemento ni del Sprint (FR-013, FR-014); sin límites de carga ni restricciones por tipo, estado o fecha. No se escribió código HTML/CSS/Angular.
- **Bloqueos de UX / Consultas para BA:**
  - **B-01 (informativo, para SA/BA; no bloquea este diseño):** la resolución humana "A" (409 si el elemento ya está asignado a cualquier Sprint) consta en `tracker_bmad.md`, pero `spec.md`, la HU técnica y la HU de stakeholders todavía la tratan como ❓ No documentado (CB-06, CB-07, CB-10 y FR-015, que dice que el sistema no debe imponer cardinalidad). El Estado 12 se diseñó según la decisión humana; el SA y el BA deben reconciliar la spec y la HU (nuevo escenario, nuevo FR y retiro de FR-015) para mantener el mapeo 1 a 1.
  - **B-02 (informativo):** el selector de elementos. Si el negocio quiere elegir el elemento desde una lista o buscador del backlog en lugar de escribir su identificador, hace falta definirlo en la HU (consulta de elementos asignables, criterios de elegibilidad). No se diseña por no estar en ningún criterio de aceptación.
  - **B-03 (informativo, sin alterar el diseño):** siguen ❓ No documentado en la HU: asignación en lote, desasignación y movimiento (punto 5); roles con permiso (punto 6, se diseña para cualquier usuario autenticado); formato de la consulta (punto 7); restricciones por estado o fecha del Sprint y elegibilidad del elemento (puntos 3 y 4); estado del elemento al asignar (punto 2).

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER
Handoff vertical estricto definido por el rol UX (Spec Kit Bridge); se entrega al Solutions Architect sin devolver el turno al Product Manager. Auditoría de alcance: el backlog del MVP tiene 6 épicas (P1 a P6); la épica P1 sigue en curso (HU 001 a 004 con diseño visual; HU 005 a 011 pendientes), por lo que el MVP no ha concluido.

`@SA: Diseño visual de la HU 004-HU_asignacion_elementos_sprint completado en documents/designer-ux/ux_004_asignacion_elementos_sprint.md. Procede con el tech-design.`
