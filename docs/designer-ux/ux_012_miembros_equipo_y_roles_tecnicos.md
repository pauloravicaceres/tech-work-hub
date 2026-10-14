# ESPECIFICACIÓN DE DISEÑO UX: Miembros del Equipo y Roles Técnicos

- **Historia de Usuario Fuente:** `documents/business-analyst/012-HU_miembros_equipo_y_roles_tecnicos.md`
- **Spec Kit Fuente:** `specs/012-HU_miembros_equipo_y_roles_tecnicos/spec.md` y `specs/012-HU_miembros_equipo_y_roles_tecnicos/checklists/requirements.md`
- **Fecha de Diseño:** 04-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (subordinado a `.specify/memory/constitution.md`)
- **Stack de Presentación:** Angular 22 (Zoneless, Signals) + PrimeNG v22.1.1 (Tema Neutral). La solución opera como **módulo embebido** en el shell existente (Topbar + Sidebar + Breadcrumb + Footer) que ya usan los módulos Backlog (HU-001), Sprints (HU-003) y Asignaciones (HU-004). La entrada `Equipos y Roles` del sidebar ya figura en el esqueleto de la navegación.
- **Requiere interfaz (HU):** Sí.

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `012-HU_miembros_equipo_y_roles_tecnicos` - Miembros del Equipo y Roles Técnicos (registrar un miembro con un rol técnico; consultar miembros; consultar el catálogo de roles).
- **Enfoque de Usabilidad:** Una única pantalla `Equipos y Roles` con dos pestañas de solo lectura, `Miembros` y `Roles técnicos`, y un diálogo modal de registro de dos campos (nombre y rol). El rol se elige de una lista alimentada por el propio catálogo, de modo que el usuario solo escribe el nombre y ve el resultado en la misma grilla sin cambiar de contexto (SC-001: registrar y ver al miembro en menos de 1 minuto).
- **Alcance visual (restricciones respetadas en el 100 % de las pantallas):**
  - Cada solicitud registra **un** miembro con **un** rol (FR-001): sin selección múltiple de roles ni registro en lote.
  - **No existe** modificar, desactivar, eliminar un miembro ni cambiar su rol, ni crear o editar roles del catálogo (fuera de alcance, puntos abiertos 3 y 4): ninguna grilla tiene acciones por fila.
  - El miembro se identifica solo por **nombre** (FR-010): no hay campos de correo, usuario de acceso ni otros datos de la persona, y no hay vínculo con el servidor de identidad (punto abierto 5).
  - Sin filtros, buscador, orden ni paginación (punto abierto 7). Sin mensajes de unicidad ni de longitud máxima del nombre (puntos abiertos 2).
  - La pantalla no muestra ni modifica backlog, Sprints ni asignaciones (FR-014).
- **Mapa de rutas del módulo:** `/equipos` (pestaña `Miembros`, por defecto) y `/equipos/roles` (pestaña `Roles técnicos`). El registro es un diálogo modal sobre `/equipos`, sin ruta propia. Rutas provisionales, a confirmar por el Solutions Architect.

### Trazabilidad Escenario → Estado Visual (1 a 1)

| Escenario | Estado Visual |
|---|---|
| SC-03 Consulta de los miembros registrados | Estado 1 (grilla con datos) |
| SC-04 Consulta sin miembros registrados | Estado 2 (grilla vacía) |
| SC-05 Consulta del catálogo de roles técnicos | Estado 3 (pestaña Roles técnicos) |
| SC-01 Registro de un miembro con el rol Desarrollo | Estado 4 (diálogo de registro) + Estado 5 (confirmación y grilla actualizada) |
| SC-02 Registro de un miembro con el rol QA | Estado 6 |
| SC-06 Registro con un rol inexistente en el catálogo | Estado 7 |
| SC-07 Datos obligatorios ausentes o vacíos (nombre ausente, nombre de espacios, rol ausente) | Estado 8 (tres variantes) |
| SC-08 Acceso sin credenciales válidas (registrar, consultar miembros, consultar roles) | Estado 9 |
| SC-09 Fallo de persistencia al registrar | Estado 10 |

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Miembros Registrados con Datos - Happy Path
- **Escenario Cubierto:** SC-03 [Happy Path] Consulta de los miembros registrados: HTTP 200 OK, exactamente los miembros registrados con identificador, nombre y rol (FR-008; US2-A1).
- **ID de Tarea Spec Kit:** `Task-UI-01: Grilla TeamMembers` (provisional: `tasks.md` de la HU 012 aún no existe; el SA debe reconciliar el ID).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                       |
|                         +------------------------------------------------------------------------------------------+
| [o] Sprints             | MIEMBROS DEL EQUIPO                                                                      |
| [o] Backlog Multitipo   | Personas del equipo técnico y su rol.                       [ [+] Registrar miembro ]    |
| [o] Incidentes          |                                                                                          |
| [o] Aplicaciones        | [p-tabs]  ( Miembros )   Roles técnicos                                                  |
| [>] Equipos y Roles     | +--------------------------------------------------------------------------------------+ |
|     - [Miembros]        | | [p-table]                                                                            | |
| [o] Reuniones           | | IDENTIFICADOR            | NOMBRE            | ROL                                       | |
| [o] Configuración       | |--------------------------+-------------------+-------------------------------------------| |
|                         | | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo                                | |
|                         | | 8f90-04bc-...-2e77       | Luis Rojas        | QA                                        | |
|                         | +--------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
| [Footer] TechWorkHub v1.0 | Modulith .NET 8 + Angular 22 Zoneless | PrimeNG v22.1.1                               |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-menubar>`, `<p-sidebar>`, `<p-breadcrumb>`, `<p-tabs>`, `<p-table>`, `<p-button>`.
  - **Modo de integración:** módulo embebido en el shell existente; solo se activa la entrada `Equipos y Roles` que ya existe en el sidebar.
  - **Disparadores de Estado:** clic en `Equipos y Roles` del sidebar o navegación directa a `/equipos`; respuesta HTTP 200 OK con miembros.
  - **Reglas de Componente:**
    - Columnas exactamente las que indica el escenario: identificador, nombre y rol. No se muestran `CreatedAt` ni `CreatedBy`, ni estado del miembro (no tiene ciclo de vida, FR-015).
    - **Sin columna de acciones:** la HU no define ninguna operación por fila (decisión D-03). Se omite esa parte del esqueleto estándar.
    - Botón principal `Registrar miembro` anclado en la zona superior derecha del contenedor de datos.
    - Consulta de solo lectura: ninguna interacción de la grilla modifica datos. Sin buscador, filtros, orden configurable ni paginación (decisión D-04).

---

### Estado 2: Sin Miembros Registrados (Empty State) - Happy Path
- **Escenario Cubierto:** SC-04 [Happy Path] Consulta sin miembros registrados: HTTP 200 OK con colección vacía (FR-009; US2-A2).
- **ID de Tarea Spec Kit:** `Task-UI-01: Grilla TeamMembers` (variante vacía, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
| MIEMBROS DEL EQUIPO                                                                                                |
| Personas del equipo técnico y su rol.                                                [ [+] Registrar miembro ]     |
|                                                                                                                    |
| [p-tabs]  ( Miembros )   Roles técnicos                                                                            |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-table]  IDENTIFICADOR | NOMBRE | ROL                                                                        | |
| |----------------------------------------------------------------------------------------------------------------| |
| |                                                                                                                | |
| |                        (i)  Aún no hay miembros registrados en el equipo.                                     | |
| |                             Use "Registrar miembro" para agregar el primero.                                   | |
| |                                                                                                                | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-table>` con plantilla `emptymessage`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 200 OK con colección vacía.
  - **Reglas de Componente:** el mensaje es informativo, no un error; el botón `Registrar miembro` permanece activo.

---

### Estado 3: Catálogo de Roles Técnicos - Happy Path
- **Escenario Cubierto:** SC-05 [Happy Path] Consulta del catálogo de roles técnicos: HTTP 200 OK con al menos "Desarrollo" y "QA", cada uno con identificador y nombre (FR-004, FR-005; US3-A1).
- **ID de Tarea Spec Kit:** `Task-UI-02: Grilla TechnicalRoles` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Roles técnicos                                                           |
+--------------------------------------------------------------------------------------------------------------------+
| ROLES TÉCNICOS DISPONIBLES                                                                                         |
| Roles que pueden asignarse al registrar un miembro.                                                                |
|                                                                                                                    |
| [p-tabs]   Miembros   ( Roles técnicos )                                                                           |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-table]                                                                                                      | |
| | IDENTIFICADOR                      | NOMBRE                                                                    | |
| |------------------------------------+---------------------------------------------------------------------------| |
| | 1a2b-3c4d-...-0001                 | Desarrollo                                                                | |
| | 1a2b-3c4d-...-0002                 | QA                                                                        | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-tabs>`, `<p-table>`.
  - **Disparadores de Estado:** clic en la pestaña `Roles técnicos` o navegación directa a `/equipos/roles`; respuesta HTTP 200 OK.
  - **Reglas de Componente:**
    - Vista de solo lectura: **no hay** botones de crear, editar ni eliminar roles (punto abierto 4). Sin botón principal en esta pestaña.
    - Muestra todo lo que devuelve el servidor; la UI no fija ni asume otros roles además de "Desarrollo" y "QA".
    - El mismo resultado alimenta la lista `Rol` del diálogo de registro (Estado 4), de modo que lo visible aquí es exactamente lo asignable.

---

### Estado 4: Diálogo de Registro de un Miembro - Happy Path (formulario)
- **Escenario Cubierto:** SC-01 [Happy Path] Registro de un miembro con el rol Desarrollo, fase de captura (FR-001; US1-A1).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo RegisterMemberDialog` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás)                                                 |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] REGISTRAR MIEMBRO DEL EQUIPO                                     [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  NOMBRE (*)                                                                      |                    |
|            |  [ Ana Torres ...............................................................  ] |                    |
|            |                                                                                  |                    |
|            |  ROL TÉCNICO (*)                                                                 |                    |
|            |  [ Desarrollo ...................................................... [v] ]     |                    |
|            |      (lista: Desarrollo | QA  <- tomada del catálogo)                            |                    |
|            |  (i) Se registra un miembro con un rol por solicitud.                            |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Registrar ]             |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog [modal]="true">`, `<p-inputtext>`, `<p-select>`, `<p-button>`.
  - **Disparadores de Estado:** clic en `Registrar miembro` desde los Estados 1 o 2.
  - **Reglas de Componente:**
    - Dos únicos campos editables: nombre (texto libre, autofocus al abrir, sin longitud máxima visible ni contador) y rol (selección única).
    - Las opciones del rol provienen de la consulta del catálogo (Estado 3); mientras carga, el selector muestra su estado de carga.
    - El botón `Registrar` permanece habilitado mientras no haya envío en curso: los errores se muestran tras el intento de envío (Estados 7 y 8) y el servidor es la fuente de verdad de FR-006 y FR-007 (decisión D-05).
    - Al pulsar `Registrar`: deshabilitar el botón y mostrar spinner (`<p-button [loading]="isSubmitting()">`), enviar la solicitud de registro (ruta provisional, a confirmar por el API Architect) y, ante éxito, pasar al Estado 5.
    - `Cancelar`, `[x]` y la tecla `Esc` cierran el diálogo sin persistir nada (no hay confirmación destructiva en esta operación).

---

### Estado 5: Registro Confirmado - Happy Path (rol Desarrollo)
- **Escenario Cubierto:** SC-01 [Happy Path] Confirmación con código de éxito, identificador único, nombre "Ana Torres" y rol "Desarrollo"; sin cambios en backlog, Sprints ni asignaciones (FR-002, FR-003, FR-014; US1-A1, US1-A3).
- **ID de Tarea Spec Kit:** `Task-UI-04: Confirmación y Refresco de Grilla` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
| MIEMBROS DEL EQUIPO                                                          +--------------------------------+    |
| Personas del equipo técnico y su rol.                                        | [p-toast]                      |    |
|                                              [ [+] Registrar miembro ]       | (✓) Miembro registrado.        |    |
|                                                                              | Nombre: Ana Torres             |    |
| +--------------------------------------------------------------------------+ | Rol:    Desarrollo             |    |
| | [p-table]                                                                | | Id:     5d2e-71aa-...-c013     |    |
| | IDENTIFICADOR            | NOMBRE            | ROL                       | +--------------------------------+    |
| |--------------------------+-------------------+---------------------------|                                         |
| | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo                |  <- fila nueva                          |
| +--------------------------------------------------------------------------+                                         |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-toast>` (arriba-derecha, severidad `success`), `<p-table>`.
  - **Disparadores de Estado:** respuesta de éxito del registro (el código exacto es ⚠️ [PROPUESTO] en la HU y lo fija el API Architect).
  - **Reglas de Componente:**
    - El diálogo se cierra; el toast muestra el identificador, el nombre y el rol devueltos por el servidor y se descarta solo a los 5 s o con el botón de cierre.
    - La grilla se refresca con una consulta fresca al servidor (no se inserta la fila de forma optimista) para que lo visible coincida exactamente con lo persistido (SC-004).
    - No se muestran ni se piden `CreatedAt`/`CreatedBy` en pantalla; la auditoría la resuelve el backend. No se ofrece editar el miembro recién creado.

---

### Estado 6: Registro Confirmado - Happy Path (rol QA)
- **Escenario Cubierto:** SC-02 [Happy Path] Registro de un miembro con el rol QA: confirmación con identificador único, nombre "Luis Rojas" y rol "QA" (FR-001, FR-002; US1-A2).
- **ID de Tarea Spec Kit:** `Task-UI-04: Confirmación y Refresco de Grilla` (segunda ejecución del mismo flujo, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] REGISTRAR MIEMBRO DEL EQUIPO                                     [x]  |   (antes de enviar) |
|            |  NOMBRE (*)    [ Luis Rojas ................................................  ] |                    |
|            |  ROL TÉCNICO (*) [ QA ...................................................[v] ]  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Registrar ]             |                    |
|            +----------------------------------------------------------------------------------+                    |
|                                                                                                                    |
| (tras la respuesta de éxito)                                                 +--------------------------------+    |
| +--------------------------------------------------------------------------+ | [p-toast]                      |    |
| | IDENTIFICADOR            | NOMBRE            | ROL                       | | (✓) Miembro registrado.        |    |
| |--------------------------+-------------------+---------------------------| | Nombre: Luis Rojas             |    |
| | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo                | | Rol:    QA                     |    |
| | 8f90-04bc-...-2e77       | Luis Rojas        | QA                        | | Id:     8f90-04bc-...-2e77     |    |
| +--------------------------------------------------------------------------+ +--------------------------------+    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** los mismos de los Estados 4 y 5 (`<p-dialog>`, `<p-select>`, `<p-toast>`, `<p-table>`).
  - **Disparadores de Estado:** segundo registro exitoso con el rol "QA".
  - **Reglas de Componente:** el diálogo se abre limpio (nombre vacío, rol sin seleccionar) en cada apertura; cada registro es una solicitud independiente (sin registro en lote). Cada rol del catálogo se trata igual; no hay tratamiento visual distinto por rol.

---

### Estado 7: Registro con un Rol Inexistente en el Catálogo (Sad Path)
- **Escenario Cubierto:** SC-06 [Sad Path] Rol que no existe en el catálogo: HTTP 400 Bad Request indicando que el rol no es válido, sin persistir (FR-006, FR-012; CB-01; US4-A1).
- **ID de Tarea Spec Kit:** `Task-UI-05: Manejo de 400 por Rol Inválido` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás, sin cambios)                                    |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] REGISTRAR MIEMBRO DEL EQUIPO                                     [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="error"]                                                    |                    |
|            |  (!) El rol indicado no es válido. No se registró ningún miembro.                |                    |
|            |                                                                                  |                    |
|            |  NOMBRE (*)                                                                      |                    |
|            |  [ Ana Torres ...............................................................  ] |                    |
|            |                                                                                  |                    |
|            |  ROL TÉCNICO (*)                                               (borde de error)  |                    |
|            |  [ Chef ............................................................ [v] ]     |                    |
|            |  * El rol seleccionado no existe en el catálogo de roles técnicos. *             |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Registrar ]             |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, `<p-select>`, mensaje en línea bajo el campo (`<small class="p-error">` de PrimeNG, sin clases propias), estado `ng-invalid ng-dirty`.
  - **Disparadores de Estado:** respuesta HTTP 400 cuyo detalle indica que el rol no es válido (por ejemplo, el catálogo cambió entre la carga de la lista y el envío, o la solicitud fue manipulada). Con una lista cerrada, el usuario no puede teclear un rol arbitrario: este estado es la defensa visual ante la validación del servidor.
  - **Reglas de Componente:**
    - El diálogo permanece abierto, conserva el nombre y el valor del rol, devuelve el foco al selector y vuelve a consultar el catálogo para refrescar las opciones; el botón `Registrar` se rehabilita para corregir y reintentar.
    - No se agrega ninguna fila ni se muestra toast de éxito (FR-012).

---

### Estado 8: Datos Obligatorios Ausentes o Vacíos (Sad Path)
- **Escenario Cubierto:** SC-07 [Sad Path] Escenario con tres ejemplos: nombre ausente, nombre compuesto de espacios y rol ausente. HTTP 400 Bad Request con el detalle de los campos inválidos, sin persistir (FR-007, FR-012; CB-02; US4-A2).
- **ID de Tarea Spec Kit:** `Task-UI-06: Validación de Campos Obligatorios` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Variante A - Nombre ausente (campo vacío):
+----------------------------------------------------------------------------------+
| [p-dialog] REGISTRAR MIEMBRO DEL EQUIPO                                     [x]  |
|----------------------------------------------------------------------------------|
|  [p-message severity="error"]                                                    |
|  (!) Revise los campos marcados: hay datos obligatorios ausentes o inválidos.    |
|                                                                                  |
|  NOMBRE (*)                                                    (borde de error)  |
|  [ ..........................................................................  ] |
|  * El nombre es obligatorio. *                                                   |
|                                                                                  |
|  ROL TÉCNICO (*)                                                                 |
|  [ Desarrollo ...................................................... [v] ]     |
|                               [ [X] Cancelar ]     [ [✓] Registrar ]             |
+----------------------------------------------------------------------------------+

Variante B - Nombre compuesto solo de espacios:
+----------------------------------------------------------------------------------+
|  NOMBRE (*)                                                    (borde de error)  |
|  [ "      " ..................................................................  ] |
|  * El nombre no puede estar vacío ni contener solo espacios. *                   |
+----------------------------------------------------------------------------------+

Variante C - Rol ausente (sin selección):
+----------------------------------------------------------------------------------+
|  NOMBRE (*)                                                                      |
|  [ Ana Torres ...............................................................  ] |
|                                                                                  |
|  ROL TÉCNICO (*)                                               (borde de error)  |
|  [ Seleccione un rol ............................................... [v] ]     |
|  * El rol es obligatorio. *                                                      |
+----------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, `<p-inputtext>`, `<p-select>` con placeholder `Seleccione un rol`, mensajes en línea por campo.
  - **Disparadores de Estado:** intento de envío con el nombre vacío o de solo espacios, o sin rol seleccionado (validación del cliente), o respuesta HTTP 400 con la lista de campos inválidos (validación del servidor, `errors` del ProblemDetails, patrón de HU-001).
  - **Reglas de Componente:**
    - Una variante por cada ejemplo de la tabla de SC-07. Cada campo inválido muestra su propio mensaje en línea; si ambos son inválidos se muestran ambos a la vez. Foco automático en el primer campo inválido; los valores ingresados se conservan.
    - Cuando la validación proviene del backend, el mensaje en línea toma el detalle devuelto por el servidor.
    - No se persiste nada ni se agrega fila a la grilla (FR-012).

---

### Estado 9: Sesión Inválida o Expirada (Sad Path)
- **Escenario Cubierto:** SC-08 [Sad Path] Acceso sin credenciales válidas, en las tres operaciones (registrar un miembro, consultar los miembros, consultar los roles técnicos): HTTP 401 Unauthorized, sin leer ni persistir datos (FR-011, FR-012; CB-03; US5-A1).
- **ID de Tarea Spec Kit:** `Task-UI-07: Manejo de 401 y Reautenticación` (provisional; reutiliza el interceptor Bearer y el guard con reautenticación de HU-001).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles                                                                            |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; sin datos de miembros ni de roles visibles)                                          |
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
  - Registrar un miembro (envío del diálogo)   -> no se persiste nada; el diálogo de registro se cierra.
  - Consultar los miembros (GET, pestaña Miembros)        -> la grilla no se renderiza con datos.
  - Consultar los roles técnicos (GET, pestaña Roles / lista del diálogo) -> la grilla y la lista no se pueblan.
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog [modal]="true" [closable]="false" [closeOnEscape]="false">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 401 (token ausente, inválido o expirado) en cualquiera de las tres operaciones, que persiste tras el reintento único de renovación del interceptor Bearer (HU-001).
  - **Reglas de Componente:**
    - Modal con backdrop no descartable; la única acción es `Iniciar sesión`, que dispara la reautenticación existente (flujo PKCE de HU-001).
    - Se oculta cualquier dato de miembros o de roles cargado antes y se cierra el diálogo de registro. El mensaje no menciona detalles técnicos del token.

---

### Estado 10: Fallo de Persistencia al Registrar (Sad Path)
- **Escenario Cubierto:** SC-09 [Sad Path] Fallo de persistencia al registrar: HTTP 500 Internal Server Error sin trazas internas y sin miembro parcial (FR-012, FR-013; CB-04; US5-A2).
- **ID de Tarea Spec Kit:** `Task-UI-08: Manejo de Error 500 en Registro` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Miembros                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la grilla del Estado 1 queda detrás, sin la fila del intento fallido)                |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] REGISTRAR MIEMBRO DEL EQUIPO                                     [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  [p-message severity="error"]                                                    |                    |
|            |  (!) No fue posible registrar al miembro. No se registró ningún dato.            |                    |
|            |      Intente nuevamente en unos minutos.                                         |                    |
|            |                                                                                  |                    |
|            |  NOMBRE (*)                                                                      |                    |
|            |  [ Ana Torres ...............................................................  ] |                    |
|            |                                                                                  |                    |
|            |  ROL TÉCNICO (*)                                                                 |                    |
|            |  [ Desarrollo ...................................................... [v] ]     |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Registrar ]             |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>`, `<p-message severity="error">`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 500 Internal Server Error al enviar un registro válido.
  - **Reglas de Componente:**
    - El mensaje es genérico: nunca se muestran trazas, códigos internos ni el cuerpo crudo de la respuesta.
    - Los valores ingresados se conservan y el botón `Registrar` se rehabilita para reintento manual (sin reintento automático). No se agrega fila ni se muestra toast de éxito; no se muestra ningún miembro parcial.
    - Tras un fallo, el reintento exitoso pasa al Estado 5; la grilla no se actualiza hasta entonces.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES

- **Heurísticas Aplicadas:**
  - **D-01 Una pantalla, dos pestañas de solo lectura:** `Miembros` y `Roles técnicos` comparten la ruta base `/equipos`. Agrupa las tres capacidades de la HU (registrar, consultar miembros, consultar roles) sin crear navegación adicional. Rutas provisionales hasta que el SA/API Architect las confirme.
  - **D-02 Rol como lista cerrada alimentada por el catálogo:** el rol se elige con un selector en lugar de texto libre, porque SC-06 exige que el rol exista en el catálogo y escribirlo a mano invitaría al error. El Estado 7 se mantiene como defensa ante la validación del servidor. No agrega capacidad: usa la consulta SC-05.
  - **D-03 Sin columna de acciones:** el esqueleto estándar prevé una columna de iconos a la derecha, pero la HU no define ninguna operación por fila (modificar, desactivar y eliminar son ❓ No documentado, y no hay un detalle de miembro). Incluirla sería inventar funcionalidad. Se mantiene el resto del esqueleto.
  - **D-04 Grillas sin paginación, filtros ni orden:** el esqueleto estándar prevé paginación inferior, pero la política anti-alucinación prohíbe controles que no provengan de un criterio de aceptación y el formato de la consulta no está definido (punto abierto 7). El rendimiento está acotado a 100 miembros (SC-007). Si el negocio define orden, filtro por rol o paginación se rediseñarán los Estados 1 y 2.
  - **D-05 Validación del servidor como fuente de verdad:** el botón `Registrar` no se bloquea por validación del cliente; los Estados 7 y 8 reflejan la respuesta del servidor (FR-006, FR-007), evitando duplicar reglas de negocio en el cliente.
  - **D-06 Ubicación de errores:** errores de recurso (400 por rol, 500) en banner `p-message` dentro del diálogo, con mensaje en línea cuando el campo es el causante; errores de campo (400) en línea. La HU no fija banner vs. en línea; decisión heurística estándar.
  - **D-07 Refresco desde el servidor:** tras registrar se vuelve a consultar la grilla en lugar de insertar la fila localmente, para que lo visible coincida con lo persistido (SC-004).
  - **D-08 Vista vacía (Estado 2):** representación visual de SC-04; mensaje informativo, sin funcionalidad nueva.
  - **D-09 Auditoría invisible:** `CreatedAt` y `CreatedBy` no se muestran ni se editan; la HU solo los exige como persistencia (FR-003).
  - **D-10 IDs de tarea y rutas provisionales:** `tasks.md` de la HU 012 aún no existe (se genera en la fase de arquitectura). Los `Task-UI-xx` y las rutas de API son provisionales y deben ser reconciliados por el SA/API Architect.
  - **Restricciones de negocio verificadas en todas las pantallas:** un miembro y un rol por solicitud; sin modificar, desactivar ni eliminar miembros; sin administrar el catálogo de roles; sin datos de la persona distintos del nombre; sin vínculo con el servidor de identidad; sin backlog, Sprints ni asignaciones en pantalla. No se escribió código HTML/CSS/Angular.
- **Bloqueos de UX / Consultas para BA:** Ninguno bloqueante. Informativos, sin alterar el diseño:
  - **B-01:** no hay aviso ni regla de nombre duplicado ni longitud máxima del nombre (puntos abiertos 2, CB-05, CB-06): el diálogo permite registrar homónimos y no limita el texto. Si el negocio los define, se añadirán un estado de conflicto y una validación.
  - **B-02:** la cardinalidad miembro–rol (punto abierto 1) queda en un único rol por miembro porque así lo cubren los escenarios; si pasa a varios, el selector pasará a selección múltiple.
  - **B-03:** siguen ❓ No documentados y sin diseño: ciclo de vida del miembro (punto 3), alta o edición de roles (punto 4), vínculo con el servidor de identidad (punto 5), permisos por rol de acceso (punto 6, se diseña para cualquier usuario autenticado) y relación del catálogo con las estimaciones Dev y QA del backlog (punto 8).
  - **B-04:** la HU no define el comportamiento de la UI si la consulta del catálogo o de miembros falla con un error distinto de 401 (no hay escenario). El diseño solo cubre los escenarios existentes; el SA puede acordar un estado de error de lectura genérico con el BA.

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER
Handoff vertical estricto definido por el rol UX (Spec Kit Bridge); se entrega al Solutions Architect sin devolver el turno al Product Manager. Elegir la siguiente historia corresponde al Product Manager.

`@SA: El diseño visual de la HU [012-HU_miembros_equipo_y_roles_tecnicos] ha concluido exitosamente en [documents/designer-ux/ux_012_miembros_equipo_y_roles_tecnicos.md]. Procede con el tech-design y arquitectura.`
