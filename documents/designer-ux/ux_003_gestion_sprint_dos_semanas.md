# ESPECIFICACIÓN DE DISEÑO UX: Gestión de Sprint de Dos Semanas (Crear y Consultar)

- **Historia de Usuario Fuente:** `documents/business-analyst/003-HU_gestion_sprint_dos_semanas.md`
- **Spec Kit Fuente:** `specs/003-HU_gestion_sprint_dos_semanas/spec.md` y `specs/003-HU_gestion_sprint_dos_semanas/checklists/requirements.md`
- **Fecha de Diseño:** 04-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (subordinado a `.specify/memory/constitution.md`)
- **Stack de Presentación:** Angular 22 (Zoneless, Signals) + PrimeNG v22.1.1 (Tema Neutral). La solución opera como **módulo embebido** dentro del shell existente (Topbar + Sidebar + Breadcrumb + Footer), reutilizando el mismo layout que el módulo Backlog (HU-001).

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `003-HU_gestion_sprint_dos_semanas` - Gestión de Sprint de Dos Semanas (Crear y Consultar).
- **Enfoque de Usabilidad:** Tres vistas mínimas (formulario de creación, listado y detalle) que cubren exactamente las capacidades de la HU: crear un Sprint con identificación y fechas, y consultarlo. La regla de la ventana de 2 semanas se comunica antes del envío (texto de ayuda bajo las fechas) y se reitera en el error, de modo que el Líder Técnico corrige sin ensayo y error.
- **Alcance visual (restricciones de negocio respetadas en el 100 % de las pantallas):** el Sprint se muestra únicamente con sus cuatro datos funcionales (identificador, identificación, fecha de inicio, fecha de fin). **No existe** ningún estado, botón de abrir/cerrar, editar, cancelar o eliminar (FR-014), ni relación con tarjetas del backlog (FR-013), ni filtros, orden o buscador del listado (punto abierto 9).
- **Mapa de rutas del módulo:** `/sprints` (listado), `/sprints/nuevo` (creación), `/sprints/:id` (detalle).

### Trazabilidad Escenario → Estado Visual (1 a 1)

| Escenario | Estado Visual |
|---|---|
| SC-01 Creación con ventana válida | Estado 1 (formulario) + Estado 2 (confirmación y retorno al listado) |
| SC-02 Listado de Sprints | Estado 3 (listado con datos) |
| SC-03 Detalle de un Sprint existente | Estado 5 (detalle) |
| SC-04 Ventana distinta de 2 semanas / fin ≤ inicio | Estado 6 |
| SC-05 Datos obligatorios ausentes o malformados | Estado 7 |
| SC-06 Sprint inexistente | Estado 8 |
| SC-07 Sin credenciales válidas (crear, listar, detalle) | Estado 9 |
| SC-08 Fallo de persistencia al crear | Estado 10 |
| (Estándar UX: vista vacía) Sin Sprints registrados | Estado 4 (sin escenario Gherkin propio; ver §3) |

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Formulario de Creación con Ventana Válida - Happy Path
- **Escenario Cubierto:** SC-01 [Happy Path] Creación de un Sprint con ventana válida de 2 semanas (FR-001, FR-002, FR-003, FR-006).
- **ID de Tarea Spec Kit:** `Task-UI-01: Formulario Reactivo SprintForm` (provisional: `tasks.md` de la HU 003 aún no existe; el SA debe reconciliar el ID).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Sprints > Nuevo Sprint                                           |
|                         +------------------------------------------------------------------------------------------+
| [*] Dashboard           | CREAR SPRINT                                                                             |
| [>] Sprints             | Indique la identificación y las fechas del ciclo de trabajo de 2 semanas.                |
|     - Ver Sprints       |                                                                                          |
|     - [+ Nuevo Sprint]  | +--------------------------------------------------------------------------------------+ |
| [o] Backlog Multitipo   | | [p-card]                                                                             | |
| [o] Incidentes          | |--------------------------------------------------------------------------------------| |
| [o] Aplicaciones        | | IDENTIFICACIÓN (*)                                                                   | |
| [o] Equipos y Roles     | | [ Sprint 2026-01 ................................................................ ] | |
| [o] Reuniones           | |                                                                                      | |
| [o] Configuración       | | FECHA DE INICIO (*)                          FECHA DE FIN (*)                        | |
|                         | | [ 05/10/2026                       [cal] ]   [ 18/10/2026                      [cal] ]| |
|                         | |                                              (i) Ventana de 2 semanas: 14 días       | |
|                         | |                                              calendario, extremos incluidos.         | |
|                         | +--------------------------------------------------------------------------------------+ |
|                         |                                          [ [X] Cancelar ]     [ [✓] Crear Sprint ]      |
+--------------------------------------------------------------------------------------------------------------------+
| [Footer] TechWorkHub v1.0 | Modulith .NET 8 + Angular 22 Zoneless | PrimeNG v22.1.1                               |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-menubar>`, `<p-sidebar>`, `<p-breadcrumb>`, `<p-card>`, `<p-inputtext>`, `<p-datepicker>` (x2), `<p-button>`.
  - **Modo de integración:** módulo embebido en el shell existente; la entrada "Sprints" del sidebar ya existe en la navegación definida por HU-001.
  - **Disparadores de Estado:** carga de la ruta `/sprints/nuevo` o clic en "+ Nuevo Sprint" (sidebar) o en "Nuevo Sprint" desde el listado.
  - **Reglas de Componente:**
    - Campo `Identificación`: autofocus al renderizar, obligatorio. Texto libre (formato y unicidad no definidos, punto abierto 4: no se imponen máscara ni validación de duplicados).
    - `Fecha de Inicio` y `Fecha de Fin`: ambas son entrada manual del usuario; la fecha de fin **no** se autocalcula (punto abierto 3 sin resolver).
    - El botón `Crear Sprint` permanece habilitado mientras el formulario no está en envío; los errores se muestran tras el intento de envío (Estados 6 y 7), no se bloquea el botón por validación para que el servidor siga siendo la fuente de verdad de FR-003..FR-005.
    - Al pulsar `Crear Sprint`: deshabilitar el botón y mostrar spinner (`<p-button [loading]="isSubmitting()">`), enviar POST a `/api/sprints` (ruta provisional, a confirmar por el API Architect) y, ante 201 Created, pasar al Estado 2.
    - `Cancelar` navega a `/sprints` sin persistir nada.
    - La fecha se envía en formato ISO `yyyy-MM-dd`; se muestra según la configuración regional (i18n).

---

### Estado 2: Sprint Creado - Confirmación (Happy Path)
- **Escenario Cubierto:** SC-01 [Happy Path] respuesta HTTP 201 Created con identificador único, identificación y fechas.
- **ID de Tarea Spec Kit:** `Task-UI-02: Confirmación y Retorno al Listado` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Sprints                                                          |
|                         +------------------------------------------------------------------------------------------+
| [>] Sprints             | SPRINTS                                                          +-------------------+   |
|     - Ver Sprints       |                                                                  | [p-toast]         |   |
|     - [+ Nuevo Sprint]  |                                                                  | (✓) Sprint        |   |
|                         |                                                                  | "Sprint 2026-01"  |   |
|                         | +--------------------------------------------------------------+ | creado.           |   |
|                         | | [p-table]                                                    | | ID: 3f1c-8a02-... |   |
|                         | | ID               | Identificación | Inicio     | Fin        | +-------------------+   |
|                         | |------------------+----------------+------------+------------|                           |
|                         | | 3f1c-8a02-..91de | Sprint 2026-01 | 05/10/2026 | 18/10/2026 |                           |
|                         | +--------------------------------------------------------------+                           |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-toast>` (posición arriba-derecha), `<p-table>`.
  - **Disparadores de Estado:** respuesta 201 Created del POST de creación.
  - **Reglas de Componente:**
    - Navegación automática a `/sprints` y toast de éxito de severidad `success` con la identificación y el identificador único devueltos por el servidor; el toast se descarta solo a los 5 s o con el botón de cierre.
    - El nuevo Sprint aparece en el listado (consulta fresca al servidor) para cumplir SC-001 (verlo en el listado en menos de 1 minuto).
    - No se muestra ningún indicador de elementos del backlog creados o asignados (FR-013).

---

### Estado 3: Listado de Sprints con Datos - Happy Path
- **Escenario Cubierto:** SC-02 [Happy Path] Consulta del listado de Sprints (FR-007).
- **ID de Tarea Spec Kit:** `Task-UI-03: Grilla de Listado SprintList` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Sprints                                                          |
|                         +------------------------------------------------------------------------------------------+
| [>] Sprints             | SPRINTS                                                                                  |
|     - [Ver Sprints]     | Ciclos de trabajo de 2 semanas registrados.                      [ [+] Nuevo Sprint ]    |
|     - [+ Nuevo Sprint]  |                                                                                          |
| [o] Backlog Multitipo   | +--------------------------------------------------------------------------------------+ |
| [o] Incidentes          | | [p-table]                                                                            | |
| [o] Aplicaciones        | | IDENTIFICADOR         | IDENTIFICACIÓN   | FECHA DE INICIO | FECHA DE FIN | ACCIONES    | |
| [o] Equipos y Roles     | |-----------------------+------------------+-----------------+--------------+-------------| |
| [o] Reuniones           | | 3f1c-8a02-...-91de    | Sprint 2026-01   | 05/10/2026      | 18/10/2026   | [ojo]       | |
| [o] Configuración       | | 7b20-1e44-...-0c3a    | Sprint 2026-02   | 19/10/2026      | 01/11/2026   | [ojo]       | |
|                         | | c9d1-55f0-...-72aa    | Sprint 2026-03   | 02/11/2026      | 15/11/2026   | [ojo]       | |
|                         | +--------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
| [Footer] TechWorkHub v1.0 | Modulith .NET 8 + Angular 22 Zoneless | PrimeNG v22.1.1                               |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-table>`, `<p-button>` (icono `pi-eye` en la columna de acciones, con `pTooltip` "Ver detalle").
  - **Disparadores de Estado:** carga de la ruta `/sprints` o clic en "Ver Sprints".
  - **Reglas de Componente:**
    - Columnas exactamente las cuatro de la HU (identificador, identificación, fecha de inicio, fecha de fin) más la columna de acciones del esqueleto estándar. **No hay** columna de estado, ni de avance, ni de tarjetas (FR-013, FR-014).
    - Botón principal `Nuevo Sprint` anclado en la zona superior derecha del contenedor de datos (directiva de maquetación).
    - Única acción por fila: `Ver detalle` (navega a `/sprints/:id`). No se ofrecen editar, cancelar ni eliminar (FR-014).
    - Sin buscador, filtros, orden configurable ni paginación: el listado devuelve todos los Sprints registrados (Assumptions de la spec; punto abierto 9). Ver §3, decisión D-03.
    - Consulta de solo lectura: ninguna interacción del listado modifica datos.

---

### Estado 4: Listado Vacío (Empty State)
- **Escenario Cubierto:** Estándar UX de vistas vacías aplicado a SC-02 cuando no existen Sprints registrados (sin escenario Gherkin propio; no se agrega ninguna funcionalidad nueva).
- **ID de Tarea Spec Kit:** `Task-UI-03: Grilla de Listado SprintList` (variante vacía, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
| SPRINTS                                                                                                            |
| Ciclos de trabajo de 2 semanas registrados.                                              [ [+] Nuevo Sprint ]      |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-table]  IDENTIFICADOR | IDENTIFICACIÓN | FECHA DE INICIO | FECHA DE FIN | ACCIONES                          | |
| |----------------------------------------------------------------------------------------------------------------| |
| |                                                                                                                | |
| |                              (i)  Aún no hay Sprints registrados.                                              | |
| |                                   Cree el primero con "Nuevo Sprint".                                          | |
| |                                                                                                                | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-table>` con plantilla `emptymessage`.
  - **Disparadores de Estado:** respuesta 200 OK con colección vacía.
  - **Reglas de Componente:** el mensaje es informativo (no es error); el botón `Nuevo Sprint` permanece activo.

---

### Estado 5: Detalle de un Sprint - Happy Path
- **Escenario Cubierto:** SC-03 [Happy Path] Consulta del detalle de un Sprint existente (FR-008).
- **ID de Tarea Spec Kit:** `Task-UI-04: Vista de Detalle SprintDetail` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Sprints > Sprint 2026-01                                         |
|                         +------------------------------------------------------------------------------------------+
| [>] Sprints             | DETALLE DEL SPRINT                                                                       |
|     - Ver Sprints       |                                                                                          |
|     - [+ Nuevo Sprint]  | +--------------------------------------------------------------------------------------+ |
| [o] Backlog Multitipo   | | [p-card]                                                 [ [<] Volver al listado ]   | |
| [o] Incidentes          | |--------------------------------------------------------------------------------------| |
| [o] Aplicaciones        | | IDENTIFICADOR                                                                        | |
| [o] Equipos y Roles     | | 3f1c-8a02-...-91de                                                                   | |
| [o] Reuniones           | |                                                                                      | |
| [o] Configuración       | | IDENTIFICACIÓN                                                                       | |
|                         | | Sprint 2026-01                                                                       | |
|                         | |                                                                                      | |
|                         | | FECHA DE INICIO                              FECHA DE FIN                            | |
|                         | | 05/10/2026                                   18/10/2026                              | |
|                         | +--------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-card>`, `<p-button>` (volver), `<p-breadcrumb>` (el último nivel muestra la identificación del Sprint).
  - **Disparadores de Estado:** clic en `Ver detalle` desde el listado, o navegación directa a `/sprints/:id`; respuesta 200 OK.
  - **Reglas de Componente:** vista de **solo lectura** con los cuatro datos de la HU; sin campos editables, sin botones de editar, cancelar o eliminar (FR-014), sin sección de tarjetas ni de estado (FR-013, FR-014). Los metadatos de auditoría (`CreatedAt`, `CreatedBy`) no se muestran porque la HU no los incluye en la respuesta de consulta.

---

### Estado 6: Rechazo por Ventana Distinta de 2 Semanas (Sad Path)
- **Escenario Cubierto:** SC-04 [Sad Path] Rechazo de un Sprint cuya ventana no es de 2 semanas, incluidos fin igual o anterior al inicio (FR-003, FR-004, FR-012; CB-01, CB-02).
- **ID de Tarea Spec Kit:** `Task-UI-05: Manejo de Errores 400 de Ventana` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Nuevo Sprint                                                                     |
+--------------------------------------------------------------------------------------------------------------------+
| CREAR SPRINT                                                                                                       |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-message severity="error"]  (!) El Sprint debe abarcar exactamente una ventana de 2 semanas.                 | |
| |                                                                                                                | |
| | IDENTIFICACIÓN (*)                                                                                             | |
| | [ Sprint 2026-01 .................................................................................. ]       | |
| |                                                                                                                | |
| | FECHA DE INICIO (*)                              FECHA DE FIN (*)                    (borde de error)          | |
| | [ 05/10/2026                           [cal] ]   [ 19/10/2026                      [cal] ]                     | |
| |                                                  * La ventana es de 15 días; debe ser de 14 días. *            | |
| |                                                                                                                | |
| |                                                         [ [X] Cancelar ]     [ [✓] Crear Sprint ]            | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+

Variante (fin anterior o igual al inicio):
|   FECHA DE INICIO (*)                              FECHA DE FIN (*)                    (borde de error)            |
|   [ 05/10/2026                           [cal] ]   [ 04/10/2026                      [cal] ]                       |
|                                                    * La fecha de fin debe ser posterior a la de inicio. *          |
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-message severity="error">` (banner del formulario), mensaje en línea bajo el campo de fecha de fin (`<small class="p-error">` de PrimeNG, sin clases propias).
  - **Disparadores de Estado:** respuesta HTTP 400 del servidor con el motivo de ventana (casos 7, 13, 15 y 21 días, fin anterior o igual al inicio).
  - **Reglas de Componente:**
    - El texto del banner reproduce el mensaje del servidor: "el Sprint debe abarcar exactamente una ventana de 2 semanas".
    - El formulario conserva los valores ingresados; el foco pasa al campo de fecha de fin; el botón `Crear Sprint` vuelve a habilitarse (sin spinner).
    - No se muestra confirmación ni se agrega el Sprint al listado (no se persistió nada, FR-012).
    - Sin sugerencia automática de fecha de fin (no está definido en la HU).

---

### Estado 7: Rechazo por Datos Obligatorios Ausentes o Malformados (Sad Path)
- **Escenario Cubierto:** SC-05 [Sad Path] Identificación vacía, fecha de inicio o fin ausente, fecha con formato inválido (FR-005, FR-012; CB-03, CB-04).
- **ID de Tarea Spec Kit:** `Task-UI-06: Validación de Campos Obligatorios` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Nuevo Sprint                                                                     |
+--------------------------------------------------------------------------------------------------------------------+
| CREAR SPRINT                                                                                                       |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-message severity="error"]  (!) Revise los campos marcados: hay datos obligatorios ausentes o inválidos.     | |
| |                                                                                                                | |
| | IDENTIFICACIÓN (*)                                                                      (borde de error)       | |
| | [                                                                                          ]                   | |
| | * La identificación es obligatoria. *                                                                          | |
| |                                                                                                                | |
| | FECHA DE INICIO (*)    (borde de error)          FECHA DE FIN (*)    (borde de error)                          | |
| | [ no-es-fecha                        [cal] ]     [                                   [cal] ]                   | |
| | * La fecha de inicio no tiene un formato *       * La fecha de fin es obligatoria. *                           | |
| | * válido. *                                                                                                    | |
| |                                                                                                                | |
| |                                                         [ [X] Cancelar ]     [ [✓] Crear Sprint ]            | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-message severity="error">`, mensajes en línea por campo, estado `ng-invalid ng-dirty` de PrimeNG para el borde de error.
  - **Disparadores de Estado:** intento de envío con campos vacíos o malformados (validación del cliente) o respuesta 400 con la lista de campos inválidos (validación del servidor).
  - **Reglas de Componente:**
    - Cada campo inválido muestra su propio mensaje en línea, tomado del detalle de campos inválidos devuelto por el servidor (`errors` del ProblemDetails, patrón HU-001) cuando la validación proviene del backend.
    - Los cuatro casos de la HU se resuelven con estos mensajes: identificación vacía, inicio ausente, fin ausente, inicio con formato inválido. El mismo patrón aplica a fin con formato inválido (CB-04).
    - Foco automático en el primer campo inválido. Los valores válidos se conservan. No se persiste nada.

---

### Estado 8: Sprint Inexistente (Sad Path)
- **Escenario Cubierto:** SC-06 [Sad Path] Consulta de un Sprint inexistente (FR-009; CB-05).
- **ID de Tarea Spec Kit:** `Task-UI-07: Estado 404 de Detalle` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > No encontrado                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
| DETALLE DEL SPRINT                                                                                                 |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-message severity="warn"]                                                                                    | |
| |   (!) El Sprint solicitado no existe.                                                                          | |
| |       Verifique el identificador o regrese al listado.                                                         | |
| |                                                                                                                | |
| |                                              [ [<] Volver al listado ]                                         | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-message severity="warn">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 404 Not Found al consultar `/sprints/:id`.
  - **Reglas de Componente:** se muestra en la misma ruta (sin redirección automática); no se renderiza ningún dato del Sprint; el único camino de salida es `Volver al listado`. El mensaje no revela detalles internos.

---

### Estado 9: Sesión Inválida o Expirada (Sad Path)
- **Escenario Cubierto:** SC-07 [Sad Path] Acceso sin credenciales válidas en las tres operaciones: crear un Sprint, consultar el listado y consultar el detalle (FR-010; CB-06).
- **ID de Tarea Spec Kit:** `Task-UI-08: Manejo de 401 y Reautenticación` (provisional; reutiliza el interceptor Bearer y el guard con reautenticación de HU-001).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; sin datos de Sprint visibles)                                                        |
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
  - Crear un Sprint (POST)        -> el formulario no se envía; no se persiste nada.
  - Consultar el listado (GET)    -> la grilla no se renderiza con datos.
  - Consultar el detalle (GET)    -> la tarjeta de detalle no se renderiza con datos.
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog [modal]="true" [closable]="false" [closeOnEscape]="false">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 401 Unauthorized (token ausente, inválido o expirado) que persiste tras el reintento único de renovación del interceptor Bearer (HU-001).
  - **Reglas de Componente:**
    - Modal con backdrop no descartable; la única acción es `Iniciar sesión`, que dispara la reautenticación existente (flujo PKCE de HU-001).
    - Se oculta cualquier dato de Sprint previamente cargado en pantalla.
    - El diálogo no menciona detalles técnicos del token.

---

### Estado 10: Fallo de Persistencia al Crear (Sad Path)
- **Escenario Cubierto:** SC-08 [Sad Path] Fallo de persistencia al crear un Sprint, HTTP 500 sin trazas internas y sin Sprint parcial (FR-011, FR-012; CB-07).
- **ID de Tarea Spec Kit:** `Task-UI-09: Manejo de Error 500 en Creación` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Sprints > Nuevo Sprint                                                                     |
+--------------------------------------------------------------------------------------------------------------------+
| CREAR SPRINT                                                                                                       |
|                                                                                                                    |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-message severity="error"]  (!) No fue posible crear el Sprint. No se registró ningún Sprint.                | |
| |                                   Intente nuevamente en unos minutos.                                          | |
| |                                                                                                                | |
| | IDENTIFICACIÓN (*)                                                                                             | |
| | [ Sprint 2026-01 .................................................................................. ]       | |
| |                                                                                                                | |
| | FECHA DE INICIO (*)                              FECHA DE FIN (*)                                              | |
| | [ 05/10/2026                           [cal] ]   [ 18/10/2026                      [cal] ]                     | |
| |                                                                                                                | |
| |                                                         [ [X] Cancelar ]     [ [✓] Crear Sprint ]            | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-message severity="error">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 500 Internal Server Error al enviar un Sprint válido.
  - **Reglas de Componente:**
    - El mensaje es genérico: nunca se muestran trazas, códigos internos ni el cuerpo crudo de la respuesta.
    - Los datos ingresados se conservan y el botón `Crear Sprint` se rehabilita para que el usuario pueda reintentar manualmente (sin reintento automático).
    - No se redirige al listado ni se muestra toast de éxito; no se muestra ningún Sprint parcial.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES

- **Heurísticas Aplicadas:**
  - **D-01 Retorno tras crear:** tras un 201 se navega al listado con toast de éxito (en lugar de quedarse en el formulario o ir al detalle), por ser la heurística estándar de confirmación y porque SC-001 mide "verlo en el listado". No altera reglas de negocio.
  - **D-02 Ubicación de errores:** errores de ventana (SC-04) y de fallo (SC-08) en banner `p-message` del formulario más mensaje en línea en el campo causante; errores de campo (SC-05) en línea. Decisión heurística estándar (la HU no fija banner vs. en línea).
  - **D-03 Listado sin paginación, filtros ni orden:** el esqueleto estándar de la constitución prevé paginación inferior, pero la política anti-alucinación prohíbe agregar controles que no provengan de un criterio de aceptación y la spec indica que el listado devuelve todos los Sprints (límite de rendimiento verificado hasta 100, SC-005). Se omite la paginación y se mantiene el resto del esqueleto (topbar, sidebar, breadcrumb, columna de acciones, acción principal arriba a la derecha, footer). Si el negocio define orden o paginación (punto abierto 9) se rediseñará el Estado 3.
  - **D-04 Vista vacía (Estado 4):** se agrega por mandato del estándar UX de "vistas vacías"; es solo un mensaje informativo y no introduce funcionalidad nueva.
  - **D-05 Validación del servidor como fuente de verdad:** el botón de envío no se bloquea por validación del cliente; los Estados 6 y 7 se alcanzan tras el intento de envío y reflejan el 400 del servidor (FR-003..FR-005), evitando duplicar la regla de negocio en el cliente.
  - **D-06 Formato de fecha:** visualización regional (i18n); envío en ISO `yyyy-MM-dd`.
  - **D-07 Texto de ayuda de la ventana:** el texto "14 días calendario, extremos incluidos" refleja el supuesto ⚠️ [PROPUESTO] de la HU (§2.2); si el negocio cambia la interpretación (punto abierto 3), solo cambia este texto y el mensaje del Estado 6.
  - **D-08 IDs de tarea provisionales:** `tasks.md` de la HU 003 aún no existe (se genera en la fase de arquitectura). Los `Task-UI-xx` y la ruta `/api/sprints` son provisionales y deben ser reconciliados por el SA/API Architect.
  - **Restricciones de negocio verificadas en todas las pantallas:** ningún estado, apertura o cierre del Sprint (FR-014); ninguna relación Sprint-tarjeta (FR-013); ninguna acción de editar, cancelar o eliminar; únicamente los cuatro campos funcionales de la HU. No se escribió código HTML/CSS/Angular.
- **Bloqueos de UX / Consultas para BA:** Ninguno bloqueante. Consultas informativas que no alteran este diseño y siguen ❓ No documentado en la HU: (1) interpretación exacta de "ventana de 2 semanas" (punto abierto 3) afecta solo textos del Estado 1 y 6; (2) formato y unicidad de la identificación (punto 4): sin escenario ni mensaje de duplicado; (3) solapamiento y fecha de inicio en el pasado (puntos 5 y 6): sin validación visual; (4) permisos por rol (punto 7): se diseña para cualquier usuario autenticado; (5) orden, filtros y paginación del listado (punto 9); (6) ciclo de vida del Sprint (punto 1) y modificación, cancelación o eliminación (punto 8): fuera de alcance, sin controles.

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER
Handoff vertical estricto definido por el rol UX (Spec Kit Bridge); se entrega al Solutions Architect sin devolver el turno al Product Manager:

`@SA: Diseño visual de la HU 003-HU_gestion_sprint_dos_semanas completado en documents/designer-ux/ux_003_gestion_sprint_dos_semanas.md. Procede con el tech-design.`
