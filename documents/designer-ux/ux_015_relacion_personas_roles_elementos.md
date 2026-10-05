# ESPECIFICACIÓN DE DISEÑO UX: Relación entre Personas, Roles y Elementos de Trabajo

- **Historia de Usuario Fuente:** `documents/business-analyst/015-HU_relacion_personas_roles_elementos.md`
- **Spec Kit Fuente:** `specs/015-HU_relacion_personas_roles_elementos/spec.md` y `specs/015-HU_relacion_personas_roles_elementos/checklists/requirements.md`
- **Fecha de Diseño:** 04-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (subordinado a `.specify/memory/constitution.md`)
- **Stack de Presentación:** Angular 22 (Zoneless, Signals) + PrimeNG v22.1.1. La solución opera como **módulo embebido** en el shell existente (Topbar + Sidebar + Breadcrumb + Footer) usado por Backlog (HU-001), Sprints (HU-003), Asignaciones (HU-004) y Equipos y Roles (HU-012). Se añade una pestaña `Responsables` dentro de la pantalla `Equipos y Roles`.
- **Requiere interfaz (HU):** Sí.
- **Resolución humana incorporada:** el tracker registra que el Humano resolvió la ambigüedad de FR-015 (asignación duplicada) con la **Opción B: idempotente** (éxito con la relación existente, sin crear otra y sin alterar su auditoría). `spec.md` aún no refleja esa respuesta con un escenario propio; el diseño la cubre en el Estado 7 (ver B-01).

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `015-HU_relacion_personas_roles_elementos` - Relación entre Personas, Roles y Elementos de Trabajo (asignar un responsable a un elemento; consultar personas de un elemento; consultar elementos de un miembro).
- **Enfoque de Usabilidad:** Una pestaña `Responsables` con dos vistas de solo lectura, `Por elemento` y `Por miembro`, que se consultan eligiendo un elemento o un miembro en un selector. Un diálogo modal de dos campos (elemento y miembro) asigna el responsable; el rol se muestra solo como dato informativo del miembro elegido (FR-005), de modo que el usuario asigna y verifica la relación en menos de 1 minuto (SC-002).
- **Alcance visual (restricciones respetadas en el 100 % de las pantallas):**
  - Cada solicitud relaciona **un** miembro con **un** elemento (FR-001): sin selección múltiple de miembros ni asignación en lote.
  - El rol **no es editable** por asignación (FR-005): se muestra el rol técnico registrado del miembro.
  - **No existe** quitar ni reemplazar un responsable, ni "cambio de responsable" (FR-015, CB-08): ninguna grilla tiene acciones por fila.
  - La asignación **no muestra ni permite editar** `devPoints`, `qaPoints`, estado ni Sprint del elemento (FR-013).
  - Sin filtros, buscador, orden ni paginación en las grillas (formato de consulta no definido, supuesto de `spec.md`). Sin máximo de responsables ni validación de coherencia rol/estimaciones/estado/Sprint (FR-015).
  - Columnas exactas: personas de un elemento = identificador, nombre y rol (FR-006); elementos de un miembro = identificador, título y tipo (FR-007). No se muestran `CreatedAt` ni `CreatedBy`.
- **Mapa de rutas (provisionales, a confirmar por el Solutions Architect):** `/equipos/responsables` (vista `Por elemento`, por defecto) y `/equipos/responsables/miembro` (vista `Por miembro`). La asignación es un diálogo modal sin ruta propia.

### Trazabilidad Escenario → Estado Visual (1 a 1)

| Escenario | Estado Visual |
|---|---|
| SC-03 Consultar personas y roles de un elemento | Estado 1 (vista Por elemento con datos) |
| SC-04 Consultar un elemento sin responsables | Estado 2 (vista vacía) |
| SC-05 Consultar elementos de un miembro | Estado 3 (vista Por miembro) |
| SC-01 Asignar responsable con rol Desarrollo | Estado 4 (diálogo) + Estado 5 (confirmación) |
| SC-02 Asignar segundo responsable con rol QA | Estado 6 |
| FR-015 resuelto: asignación duplicada idempotente (respuesta humana, sin SC en `spec.md`) | Estado 7 |
| SC-06 Miembro inexistente | Estado 8 |
| SC-07 Elemento inexistente | Estado 9 |
| SC-08 Identificadores ausentes o inválidos (4 variantes) | Estado 10 |
| SC-09 Acceso sin credenciales válidas (asignar, consultar elemento, consultar miembro) | Estado 11 |
| SC-10 Fallo de persistencia al asignar | Estado 12 |

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Personas y Roles de un Elemento - Happy Path
- **Escenario Cubierto:** SC-03 [Happy Path] Consulta de personas relacionadas con "item-101": HTTP 200 OK, exactamente las dos personas con identificador, nombre y rol, sin modificar datos (FR-006, FR-008; US2-A1).
- **ID de Tarea Spec Kit:** `Task-UI-01: Vista ItemAssignees` (provisional: `tasks.md` de la HU 015 aún no existe; el SA debe reconciliar el ID).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Equipos y Roles > Responsables > Por elemento                    |
|                         +------------------------------------------------------------------------------------------+
| [o] Sprints             | RESPONSABLES DE ELEMENTOS                                                                |
| [o] Backlog Multitipo   | Personas y roles técnicos relacionados con el trabajo.      [ [+] Asignar responsable ]  |
| [o] Incidentes          |                                                                                          |
| [o] Aplicaciones        | [p-tabs]  Miembros   Roles técnicos   ( Responsables )                                   |
| [>] Equipos y Roles     | [p-selectbutton]  ( Por elemento )   Por miembro                                         |
|     - [Responsables]    |                                                                                          |
| [o] Reuniones           | ELEMENTO                                                                                 |
| [o] Configuración       | [ item-101 - Título del elemento ........................................... [v] ]        |
|                         | +--------------------------------------------------------------------------------------+ |
|                         | | [p-table]  Personas relacionadas con item-101                                        | |
|                         | | IDENTIFICADOR            | NOMBRE            | ROL                                       | |
|                         | |--------------------------+-------------------+-------------------------------------------| |
|                         | | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo                                | |
|                         | | 8f90-04bc-...-2e77       | Luis Rojas        | QA                                        | |
|                         | +--------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
| [Footer] TechWorkHub v1.0 | Modulith .NET 8 + Angular 22 Zoneless | PrimeNG v22.1.1                               |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-menubar>`, `<p-sidebar>`, `<p-breadcrumb>`, `<p-tabs>`, `<p-selectbutton>`, `<p-select>`, `<p-table>`, `<p-button>`.
  - **Modo de integración:** módulo embebido; la pestaña `Responsables` se suma a las dos pestañas de HU-012 dentro de `Equipos y Roles`. No se crea una entrada nueva en el sidebar.
  - **Disparadores de Estado:** clic en la pestaña `Responsables` y elección de un elemento en el selector; respuesta HTTP 200 OK con personas.
  - **Reglas de Componente:**
    - Columnas exactamente: identificador, nombre y rol. **Sin columna de acciones** (no existe baja ni reemplazo; decisión D-03).
    - El selector `ELEMENTO` muestra identificador y título de los elementos existentes (decisión D-02). Cambiar el elemento dispara una nueva consulta de solo lectura.
    - La consulta no modifica datos; el botón `Asignar responsable` abre el diálogo del Estado 4 precargando el elemento elegido.

---

### Estado 2: Elemento sin Responsables (Empty State) - Happy Path
- **Escenario Cubierto:** SC-04 [Happy Path] Consulta de un elemento sin responsables: HTTP 200 OK con colección vacía (FR-006; US2-A2).
- **ID de Tarea Spec Kit:** `Task-UI-01: Vista ItemAssignees` (variante vacía, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Responsables > Por elemento                                              |
+--------------------------------------------------------------------------------------------------------------------+
| RESPONSABLES DE ELEMENTOS                                                         [ [+] Asignar responsable ]      |
| [p-tabs]  Miembros   Roles técnicos   ( Responsables )                                                             |
| [p-selectbutton]  ( Por elemento )   Por miembro                                                                   |
|                                                                                                                    |
| ELEMENTO                                                                                                           |
| [ item-103 - Título del elemento ......................................................................... [v] ]  |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-table]  IDENTIFICADOR | NOMBRE | ROL                                                                        | |
| |----------------------------------------------------------------------------------------------------------------| |
| |                                                                                                                | |
| |                   (i)  Este elemento aún no tiene responsables asignados.                                      | |
| |                        Use "Asignar responsable" para relacionar al primero.                                   | |
| |                                                                                                                | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-table>` con plantilla `emptymessage`, `<p-button>`.
  - **Disparadores de Estado:** respuesta HTTP 200 OK con colección vacía.
  - **Reglas de Componente:** el mensaje es informativo, no un error (Edge Case: "devuelve una colección vacía, no un error"); el botón `Asignar responsable` permanece activo.

---

### Estado 3: Elementos Relacionados con un Miembro - Happy Path
- **Escenario Cubierto:** SC-05 [Happy Path] Consulta de los elementos relacionados con "Ana Torres": HTTP 200 OK, exactamente "item-101" e "item-102" con identificador, título y tipo, sin modificar datos (FR-007, FR-008; US3-A1).
- **ID de Tarea Spec Kit:** `Task-UI-02: Vista MemberItems` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Responsables > Por miembro                                               |
+--------------------------------------------------------------------------------------------------------------------+
| RESPONSABLES DE ELEMENTOS                                                         [ [+] Asignar responsable ]      |
| [p-tabs]  Miembros   Roles técnicos   ( Responsables )                                                             |
| [p-selectbutton]  Por elemento   ( Por miembro )                                                                   |
|                                                                                                                    |
| MIEMBRO                                                                                                            |
| [ Ana Torres - Desarrollo ............................................................................... [v] ]  |
| +----------------------------------------------------------------------------------------------------------------+ |
| | [p-table]  Elementos relacionados con Ana Torres                                                               | |
| | IDENTIFICADOR            | TÍTULO                                           | TIPO                             | |
| |--------------------------+--------------------------------------------------+----------------------------------| |
| | item-101                 | Título del elemento 101                          | Historia                         | |
| | item-102                 | Título del elemento 102                          | Bug                              | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-selectbutton>`, `<p-select>`, `<p-table>`, `<p-button>`.
  - **Disparadores de Estado:** alternar a `Por miembro` y elegir un miembro; respuesta HTTP 200 OK con elementos.
  - **Reglas de Componente:**
    - Columnas exactamente: identificador, título y tipo. No se muestran estimaciones, estado ni Sprint (FR-013).
    - El selector `MIEMBRO` muestra nombre y rol, tomados de la consulta de miembros de HU-012.
    - Un miembro sin elementos muestra el mismo patrón de mensaje informativo del Estado 2 ("Este miembro aún no tiene elementos relacionados."), por analogía con la colección vacía de FR-006; heurística registrada en D-07.

---

### Estado 4: Diálogo de Asignación de Responsable - Happy Path (formulario)
- **Escenario Cubierto:** SC-01 [Happy Path] Asignar a "Ana Torres" (Desarrollo) como responsable de "item-101", fase de captura (FR-001, FR-005; US1-A1).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Responsables > Por elemento                                              |
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop; la vista del Estado 1 queda detrás)                                                  |
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR RESPONSABLE                                              [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            |  ELEMENTO (*)                                                                    |                    |
|            |  [ item-101 - Título del elemento ....................................... [v] ]  |                    |
|            |                                                                                  |                    |
|            |  MIEMBRO (*)                                                                     |                    |
|            |  [ Ana Torres .......................................................... [v] ]  |                    |
|            |                                                                                  |                    |
|            |  ROL TÉCNICO                                                                     |                    |
|            |  [ Desarrollo ] (solo lectura: rol registrado del miembro)                       |                    |
|            |  (i) Se asigna un miembro por solicitud. Puede haber más de un responsable.      |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog>` modal, `<p-select>` (filtro de texto interno), `<input pInputText [readonly]>`, `<p-button>`.
  - **Disparadores de Estado:** clic en `Asignar responsable`.
  - **Reglas de Componente:**
    - Auto-focus en el selector `MIEMBRO` cuando el elemento llega precargado; si no, en `ELEMENTO`.
    - `ROL TÉCNICO` es un campo de solo lectura que se actualiza al elegir el miembro; no es un selector (FR-005, punto abierto 2).
    - Al pulsar `Asignar`: deshabilitar el botón, mostrar spinner (`[loading]`) y enviar una sola relación. El botón permanece habilitado antes del envío: los errores se muestran tras la respuesta del servidor (decisión D-05).
    - Backdrop no descartable durante el envío; `Cancelar` o `[x]` cierran el diálogo sin persistir.

---

### Estado 5: Asignación Confirmada - Happy Path (rol Desarrollo)
- **Escenario Cubierto:** SC-01 [Happy Path] Asignación confirmada con código de éxito: respuesta con identificador del elemento, identificador y nombre del miembro y su rol "Desarrollo" (FR-003, FR-004, FR-013; US1-A1).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (fase de éxito) + `Task-UI-01: Vista ItemAssignees` (refresco).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-toast] Arriba-Derecha: (✓) Responsable asignado: Ana Torres (Desarrollo) en item-101.                           |
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Responsables > Por elemento                                              |
+--------------------------------------------------------------------------------------------------------------------+
| RESPONSABLES DE ELEMENTOS                                                         [ [+] Asignar responsable ]      |
| [p-selectbutton]  ( Por elemento )   Por miembro                                                                   |
| ELEMENTO   [ item-101 - Título del elemento ........................................................... [v] ]     |
| +----------------------------------------------------------------------------------------------------------------+ |
| | IDENTIFICADOR            | NOMBRE            | ROL                                                             | |
| |--------------------------+-------------------+-----------------------------------------------------------------| |
| | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo                                                      | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta de éxito a la asignación.
  - **Reglas de Componente:**
    - El diálogo se cierra, aparece el `p-toast` (auto-descarte) y la grilla se vuelve a consultar y resalta brevemente la fila nueva (SC-001: consultable de inmediato en ambos sentidos).
    - No se muestran ni se actualizan estimaciones, estado ni Sprint del elemento: permanecen sin cambios (FR-013, SC-005).

---

### Estado 6: Segundo Responsable Asignado - Happy Path (rol QA)
- **Escenario Cubierto:** SC-02 [Happy Path] Asignar a "Luis Rojas" (QA) a "item-101", que ya tiene a "Ana Torres" (Desarrollo): ambos relacionados y la relación previa intacta (FR-002; US1-A2).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` + `Task-UI-01: Vista ItemAssignees`.
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-toast] Arriba-Derecha: (✓) Responsable asignado: Luis Rojas (QA) en item-101.                                   |
+--------------------------------------------------------------------------------------------------------------------+
| RESPONSABLES DE ELEMENTOS                                                         [ [+] Asignar responsable ]      |
| ELEMENTO   [ item-101 - Título del elemento ........................................................... [v] ]     |
| +----------------------------------------------------------------------------------------------------------------+ |
| | IDENTIFICADOR            | NOMBRE            | ROL                                                             | |
| |--------------------------+-------------------+-----------------------------------------------------------------| |
| | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo                                                      | |
| | 8f90-04bc-...-2e77       | Luis Rojas        | QA                      (fila nueva resaltada)                  | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta de éxito a una asignación sobre un elemento que ya tiene responsables.
  - **Reglas de Componente:** la fila de "Ana Torres" se conserva sin cambios; solo se añade y resalta la fila nueva. No hay límite visible de responsables (FR-015).

---

### Estado 7: Asignación Repetida del Mismo Miembro - Idempotente (Edge Case resuelto por el Humano)
- **Escenario Cubierto:** Respuesta humana a FR-015 / Edge Case "asignar dos veces al mismo miembro": Opción B, éxito con la relación existente, sin crear otra ni alterar `CreatedAt` / `CreatedBy`. No tiene SC en `spec.md` (ver B-01).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (variante idempotente, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-toast] Arriba-Derecha: (i) Ana Torres ya era responsable de item-101. No se creó una relación nueva.            |
+--------------------------------------------------------------------------------------------------------------------+
| RESPONSABLES DE ELEMENTOS                                                         [ [+] Asignar responsable ]      |
| ELEMENTO   [ item-101 - Título del elemento ........................................................... [v] ]     |
| +----------------------------------------------------------------------------------------------------------------+ |
| | IDENTIFICADOR            | NOMBRE            | ROL                                                             | |
| |--------------------------+-------------------+-----------------------------------------------------------------| |
| | 5d2e-71aa-...-c013       | Ana Torres        | Desarrollo              (sin filas duplicadas)                  | |
| +----------------------------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta de éxito a una asignación cuya relación (elemento, miembro) ya existe.
  - **Reglas de Componente:**
    - Es un aviso informativo (severidad `info`), no un error ni una advertencia: el diálogo se cierra igual que en el Estado 5 y la grilla no cambia.
    - La UI no distingue el caso previamente: no bloquea la opción de miembros ya asignados ni la oculta del selector, porque el servidor es la fuente de verdad (D-05). El mensaje depende de que el API Architect exponga en la respuesta si la relación ya existía (ver B-01).

---

### Estado 8: Miembro Inexistente (Sad Path)
- **Escenario Cubierto:** SC-06 [Sad Path] Asignar a un miembro que no existe: HTTP 404 Not Found indicando que el miembro no existe, sin persistir relación (FR-009; US4-A1).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (variante 404 miembro, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop)                                                                                      |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR RESPONSABLE                                              [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            | [p-message severity=error] (!) El miembro seleccionado no existe.                |                    |
|            |   Actualice la lista de miembros y elija uno registrado.                         |                    |
|            |                                                                                  |                    |
|            |  ELEMENTO (*)  [ item-101 - Título del elemento ........................ [v] ]   |                    |
|            |  MIEMBRO (*)   [ Seleccione un miembro ................................. [v] ]   |                    |
|            |  ROL TÉCNICO   [ - ] (solo lectura)                                              |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta HTTP 404 cuyo detalle indica que falta el miembro.
  - **Reglas de Componente:** el banner indica **cuál** de los dos recursos falta (FR-009); el diálogo permanece abierto, conserva el elemento, vacía el miembro, recarga la lista de miembros y mantiene `Asignar` habilitado. No se persiste nada: la grilla de fondo no cambia.

---

### Estado 9: Elemento Inexistente (Sad Path)
- **Escenario Cubierto:** SC-07 [Sad Path] Asignar un responsable a un elemento que no existe: HTTP 404 Not Found indicando que el elemento no existe, sin persistir relación (FR-009; US4-A2).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (variante 404 elemento, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop)                                                                                      |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR RESPONSABLE                                              [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            | [p-message severity=error] (!) El elemento seleccionado no existe.               |                    |
|            |   Actualice la lista de elementos y elija uno existente.                         |                    |
|            |                                                                                  |                    |
|            |  ELEMENTO (*)  [ Seleccione un elemento ................................ [v] ]   |                    |
|            |  MIEMBRO (*)   [ Ana Torres ............................................ [v] ]   |                    |
|            |  ROL TÉCNICO   [ Desarrollo ] (solo lectura)                                     |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Asignar ]               |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta HTTP 404 cuyo detalle indica que falta el elemento.
  - **Reglas de Componente:** mismo patrón que el Estado 8 con el campo inverso: se conserva el miembro, se vacía el elemento y se recarga su lista. Nada se persiste.

---

### Estado 10: Identificadores Ausentes o Inválidos (Sad Path, cuatro variantes)
- **Escenario Cubierto:** SC-08 [Sad Path] Rechazo por identificadores ausentes o inválidos: HTTP 400 Bad Request con el detalle de los campos inválidos, sin persistir relación (FR-010; US4-A3).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (variantes 400, provisional).
- **Wireframe Estructural (ASCII):**
```text
Variante A - elemento ausente              Variante B - miembro ausente
+--------------------------------------+   +--------------------------------------+
| ELEMENTO (*)                         |   | ELEMENTO (*)                         |
| [ Seleccione un elemento ......[v] ] |   | [ item-101 - Título ...........[v] ] |
| * El elemento es obligatorio *       |   | MIEMBRO (*)                          |
| MIEMBRO (*)                          |   | [ Seleccione un miembro .......[v] ] |
| [ Ana Torres ..................[v] ] |   | * El miembro es obligatorio *        |
+--------------------------------------+   +--------------------------------------+

Variante C - elemento con formato inválido  Variante D - miembro con formato inválido
+--------------------------------------+   +--------------------------------------+
| ELEMENTO (*)                         |   | ELEMENTO (*)                         |
| [ no-es-id ....................[v] ] |   | [ item-101 - Título ...........[v] ] |
| * El identificador del elemento no   |   | MIEMBRO (*)                          |
|   tiene un formato válido *          |   | [ no-es-id ....................[v] ] |
| MIEMBRO (*)                          |   | * El identificador del miembro no    |
| [ Ana Torres ..................[v] ] |   |   tiene un formato válido *          |
+--------------------------------------+   +--------------------------------------+
Todas las variantes: banner superior [p-message severity=error] (!) Revise los campos marcados.
Botones: [ [X] Cancelar ]  [ [✓] Asignar ]  (el diálogo permanece abierto)
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta HTTP 400 con la lista de campos inválidos; también ocurre si el cliente envía un identificador vacío.
  - **Reglas de Componente:** el error se muestra en línea bajo el campo señalado por el detalle del servidor (`p-message` en línea) y el campo se marca como inválido; se enfoca el primer campo con error. Como ambos campos son selectores de valores existentes, las variantes C y D son un caso defensivo (D-05). Nada se persiste.

---

### Estado 11: Sesión Inválida o Expirada (Sad Path)
- **Escenario Cubierto:** SC-09 [Sad Path] Acceso sin credenciales válidas: HTTP 401 Unauthorized en asignar, consultar personas de un elemento o consultar elementos de un miembro; no se muestra ningún dato de relaciones, miembros ni elementos (FR-011; US5-A1).
- **ID de Tarea Spec Kit:** `Task-UI-04: Manejo de sesión (interceptor 401)` (provisional; reutiliza el patrón de HU-001 y HU-012).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                                                  [ Iniciar sesión ]        |
+--------------------------------------------------------------------------------------------------------------------+
| [p-breadcrumb] Inicio > Equipos y Roles > Responsables                                                             |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] SESIÓN NO VÁLIDA                                                      |                    |
|            |----------------------------------------------------------------------------------|                    |
|            | (!) Su sesión no es válida o ha expirado. Inicie sesión de nuevo para continuar. |                    |
|            |                                                                                  |                    |
|            |                                                     [ [✓] Iniciar sesión ]       |                    |
|            +----------------------------------------------------------------------------------+                    |
|                                                                                                                    |
|            (el contenido de la pestaña Responsables no se muestra: sin filas ni selectores con datos)              |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** cualquiera de las tres operaciones recibe HTTP 401 (sin token, token inválido o token expirado).
  - **Reglas de Componente:** diálogo de bloqueo con backdrop no descartable y un único botón que redirige al servidor de identidad; se descartan los datos en memoria de la pestaña. Se aplica al diálogo de asignación abierto (se cierra y se muestra este estado). La UI no ofrece diferenciar entre token ausente, inválido o expirado.

---

### Estado 12: Fallo de Persistencia al Asignar (Sad Path)
- **Escenario Cubierto:** SC-10 [Sad Path] Fallo de persistencia al asignar: HTTP 500 Internal Server Error sin exponer trazas internas; no queda ninguna relación parcial (FR-012; US5-A2).
- **ID de Tarea Spec Kit:** `Task-UI-03: Diálogo AssignAssigneeDialog` (variante 500, provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| (fondo atenuado por backdrop)                                                                                      |
|            +----------------------------------------------------------------------------------+                    |
|            | [p-dialog] ASIGNAR RESPONSABLE                                              [x]  |                    |
|            |----------------------------------------------------------------------------------|                    |
|            | [p-message severity=error] (!) No se pudo asignar el responsable.                |                    |
|            |   Ocurrió un error inesperado. No se guardó ningún cambio. Intente nuevamente.   |                    |
|            |                                                                                  |                    |
|            |  ELEMENTO (*)  [ item-101 - Título del elemento ........................ [v] ]   |                    |
|            |  MIEMBRO (*)   [ Ana Torres ............................................ [v] ]   |                    |
|            |  ROL TÉCNICO   [ Desarrollo ] (solo lectura)                                     |                    |
|            |                                                                                  |                    |
|            |                               [ [X] Cancelar ]     [ [✓] Reintentar ]            |                    |
|            +----------------------------------------------------------------------------------+                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparadores de Estado:** respuesta HTTP 500 al asignar.
  - **Reglas de Componente:** el mensaje es genérico: no se muestran trazas, códigos internos ni detalles de la base de datos. Los datos del formulario se conservan; el botón principal pasa a decir `Reintentar`. Como no hay relación parcial, la grilla de fondo se mantiene sin cambios.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES
- **Heurísticas Aplicadas:**
  - **D-01 Pestaña `Responsables` dentro de `Equipos y Roles`:** la relación depende de miembros y roles (HU-012) y de elementos (HU-001); se ubica en el módulo de equipos sin crear navegación adicional. Rutas provisionales hasta confirmación del SA.
  - **D-02 Selectores alimentados por consultas existentes:** elemento y miembro se eligen de listas (miembros de HU-012; elementos de HU-001) en lugar de escribir identificadores, para evitar los errores de los Estados 8, 9 y 10. No agrega capacidad nueva de la HU; el SA debe confirmar la fuente de cada lista respetando el aislamiento por schema (FR-014).
  - **D-03 Sin columna de acciones:** quitar o reemplazar un responsable es ❓ No documentado (CB-08, FR-015); incluirlo sería inventar funcionalidad.
  - **D-04 Grillas sin paginación, filtros ni orden:** el formato de las consultas no está definido (supuesto de `spec.md`, punto abierto 7). Si el negocio lo define se rediseñarán los Estados 1 a 3.
  - **D-05 Validación del servidor como fuente de verdad:** el botón `Asignar` no se bloquea por validación del cliente; los Estados 8 a 10 y 12 reflejan la respuesta del servidor (FR-009, FR-010, FR-012).
  - **D-06 Ubicación de errores:** errores de recurso (404, 500) en banner `p-message` dentro del diálogo; errores de campo (400) en línea; éxito en `p-toast`. La HU no fija el canal; heurística estándar.
  - **D-07 Vista vacía de un miembro:** el Estado 3 usa el mismo patrón informativo que el Estado 2 para un miembro sin elementos; la HU solo define la colección vacía para el sentido elemento→personas.
  - **D-08 Rol informativo, no editable:** FR-005 prohíbe elegir otro rol por asignación; se presenta como campo de solo lectura.
  - **Restricciones de negocio respetadas en el 100 % de las pantallas:** un miembro por solicitud; sin baja ni reemplazo; sin límite de responsables; sin estimaciones, estado ni Sprint; sin `CreatedAt` / `CreatedBy` visibles; sin código HTML/CSS/Angular en el entregable.
- **Bloqueos de UX / Consultas para BA:** Ninguno bloqueante. Informativos, sin alterar el diseño:
  - **B-01:** la resolución humana de FR-015 (asignación duplicada idempotente) figura en el tracker pero `spec.md` conserva FR-015 y el Edge Case como "no documentado" y no incluye un escenario. El Estado 7 se diseña según esa respuesta; el BA/Spec Kit debería reflejarla como escenario y el API Architect decidir cómo informa la respuesta que la relación ya existía.
  - **B-02:** siguen ❓ No documentados y sin diseño: máximo de responsables, baja o reemplazo, coherencia rol/estimaciones/estado/Sprint, permisos por rol de acceso (se diseña para cualquier usuario autenticado) y selección del rol por asignación.
  - **B-03:** la HU no define el comportamiento de la UI si una consulta falla con un error distinto de 401 (no hay escenario). El diseño solo cubre los escenarios existentes; el SA puede acordar un estado de error de lectura genérico con el BA.
  - **B-04:** la fuente de las listas de elementos y miembros para los selectores no está en el alcance de esta HU (D-02); el SA debe confirmarla.

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER
Handoff vertical estricto definido por el rol UX (Spec Kit Bridge); se entrega al Solutions Architect sin devolver el turno al Product Manager. Elegir la siguiente historia corresponde al Product Manager.

`@SA: El diseño visual de la HU [015-HU_relacion_personas_roles_elementos] ha concluido exitosamente en [documents/designer-ux/ux_015_relacion_personas_roles_elementos.md]. Procede con el tech-design y arquitectura.`
