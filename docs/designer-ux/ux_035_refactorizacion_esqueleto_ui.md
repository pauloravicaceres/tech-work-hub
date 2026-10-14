# ESPECIFICACIÓN DE DISEÑO UX: Refactorización de Esqueleto UI — Layout de Aplicación y Tipografía Global

- **Historia de Usuario Fuente:** `035-HU_refactorizacion_esqueleto_ui.md` (`documents/business-analyst/035-HU_refactorizacion_esqueleto_ui.md`)
- **Spec Kit Fuente:** `specs/035-HU_refactorizacion_esqueleto_ui/spec.md` y `specs/035-HU_refactorizacion_esqueleto_ui/checklists/requirements.md`
- **Fecha de Diseño:** 05-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (subordinado a `.specify/memory/constitution.md`, directiva "Skeleton vs. Theme").
- **Stack de Presentación:** Angular 22 (Zoneless, Signals) + PrimeNG v22.1.1, tema neutral por defecto, Tailwind CSS v4 solo para grid, espaciado y flex. Esta HU **crea** el shell que envuelve las pantallas autenticadas existentes: opera como **contenedor (shell) de la aplicación**, no como módulo embebido en otro.
- **Requiere interfaz (HU):** Sí.
- **Resolución humana incorporada:** el humano resolvió la ambigüedad de la navegación lateral con la **Opción B**: expandida en anchos amplios y colapsada automáticamente a 768 px; el cambio manual vale durante la sesión y **no se guarda tras recargar** (sin persistencia). Cubierta en los Estados 4, 5 y 6.

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `035-HU_refactorizacion_esqueleto_ui` — Refactorización de Esqueleto UI: layout de aplicación y tipografía global.
- **Enfoque de Usabilidad:** Un único esqueleto de cuatro zonas (barra superior, navegación lateral izquierda colapsable, área de contenido central y pie de página) envuelve todas las pantallas existentes sin tocar su contenido interno. La navegación a Backlog, Sprints y Equipo está siempre a un clic (dos si está colapsada) y el control para abrir o cerrar la navegación está siempre visible en la barra superior, de modo que ningún ancho de ventana deja al usuario sin acceso a los tres módulos.
- **Alcance visual (restricciones respetadas en el 100 % de los estados):**
  - Solo existen **cuatro zonas**: barra superior, navegación lateral, área de contenido, pie de página. **No** hay título de pantalla ni migas de pan (HU derivada "Estructura de página"), ni contenedores de formulario, ni grilla/tablas (HUs derivadas). El contenido de cada pantalla se representa como un marcador **"contenido original sin cambios"** (FR-004, FR-012).
  - La navegación lateral contiene **exactamente tres entradas**: Backlog, Sprints y Equipo (FR-003). Sin submenús, sin buscador, sin otros módulos.
  - **Sin marca ni identidad corporativa:** sin logotipo, sin paleta propia, sin fuentes externas (FR-008, FR-010). El look and feel recae 100 % en el tema neutral de PrimeNG.
  - **Sin lógica de negocio nueva:** no se agregan campos, entidades, filtros ni acciones de datos (FR-012). La barra superior solo muestra el perfil y las acciones del usuario ya resueltos por la autenticación existente.
  - **Sin persistencia** del estado de la navegación lateral entre recargas (resolución humana, Opción B).
  - Sin reutilización de código, estructura, selectores o estilos de `app/template-primeng` (FR-011); solo se calca la **distribución de zonas** (Constitución, "Skeleton vs. Theme").
- **Mapa de rutas existentes (no cambian, FR-004):** `/backlog/nuevo` (Registro de Elemento de Backlog), `/sprints` (listado), `/sprints/nuevo` (formulario), `/sprints/:id` (detalle), `/sprints/:id/elementos` (elementos asignados), `/equipos` y rutas hijas de Equipo (página con pestañas). El diálogo de registro de miembro y el diálogo de asignación de elemento a Sprint se abren sobre la pantalla que los invoca, sin ruta propia.

### Trazabilidad Escenario → Estado Visual (1 a 1)

| Escenario (`spec.md`) | Estado Visual |
|---|---|
| US1-A1 Esqueleto con las cuatro zonas en cualquier ruta existente | Estado 1 (esqueleto completo, ancho amplio, navegación expandida) |
| US1-A2 URL existente resuelve a la misma pantalla | Estado 2 (navegación activa por módulo y mapa de rutas) |
| US1-A3 Ruta inexistente | Estado 3 (esqueleto visible, área central sin contenido de otra pantalla) |
| US2-A1 Ancho 768 px o navegación colapsada, sin desborde, con control visible | Estado 4 (768 px, navegación colapsada) + Estado 5 (768 px, navegación abierta con el control) + Estado 6 (ancho amplio, colapsada manualmente) |
| US3-A1 Medidas del área de contenido a 1920 px | Estado 7 (medidas anotadas) |
| US3-A2 Mismo espaciado en todas las pantallas | Estado 7 (la misma estructura aplica a las pantallas del alcance; ver tabla de pantallas) |
| US4-A1 Tipografía sans-serif única y cuerpo sin márgenes | Estado 8 (borde a borde, tipografía uniforme) |
| US4-A2 Una sola declaración tipográfica y de margen en estilos globales | **Sin superficie visual:** es una verificación de código fuente; se traslada al Solutions Architect como criterio de plan (ver sección 3, D-09). |
| US5-A1 Cierre verificado (lint, build, tests, 6 capturas) | **Sin superficie visual nueva:** es una compuerta de proceso; el Estado 1 y el Estado 4 fijan qué debe verse en las capturas (D-10). |
| US5-A2 Cierre bloqueado por verificación o captura faltante | **Sin superficie visual:** regla de proceso, no hay pantalla de usuario. |
| Edge Case: diálogos sobre el esqueleto sin alterarlo | Estado 9 (diálogo sobre el esqueleto) |

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Esqueleto completo, ancho amplio, navegación expandida - Happy Path
- **Escenario Cubierto:** US1-A1 (CA-01, FR-001, FR-002, FR-003). Se muestra con la pantalla Registro de Elemento de Backlog (`/backlog/nuevo`); el esqueleto es idéntico en todas las rutas existentes.
- **ID de Tarea Spec Kit:** `Task-UI-01: Componente Layout de aplicación` (provisional: `tasks.md` de la HU 035 aún no existe; el SA debe reconciliar el ID).
- **Wireframe Estructural (ASCII):**
```text
+----------------------------------------------------------------------------------------------------+
| [p-menubar]  [ ≡ ]  Nombre de la aplicación                            [Acciones usuario] [(o) Perfil v] |
+------------------+---------------------------------------------------------------------------------+
| [navegación      |                                                                                 |
|  lateral]        |      +-------------------------------------------------------------------+      |
|                  |      |  AREA DE CONTENIDO (<router-outlet>)                              |      |
|  [>] Backlog     |      |  ancho maximo 1280 px, centrada, espaciado interior 1.5 rem       |      |
|  [ ] Sprints     |      |                                                                   |      |
|  [ ] Equipo      |      |   +-----------------------------------------------------------+   |      |
|                  |      |   | [Contenido original de la pantalla]                       |   |      |
|                  |      |   | Registro de Elemento de Backlog - sin cambios             |   |      |
|                  |      |   +-----------------------------------------------------------+   |      |
|                  |      |                                                                   |      |
|                  |      +-------------------------------------------------------------------+      |
+------------------+---------------------------------------------------------------------------------+
| Pie de pagina                                                                                      |
+----------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario autenticado carga o navega a cualquier ruta existente en ancho amplio. Por la resolución humana, la navegación **arranca expandida** en anchos amplios.
  - **Barra superior:** ocupa todo el ancho; a la izquierda, el control de navegación `[ ≡ ]` y el nombre de la aplicación **en texto plano, sin logotipo**; a la derecha, las acciones y el perfil del usuario (FR-002). El contenido del menú de perfil y las acciones es el que ya resuelve la autenticación existente (supuesto de `spec.md`); no se definen acciones nuevas.
  - **Navegación lateral:** tres entradas con icono y texto; la entrada del módulo activo se marca como seleccionada. Cada entrada es un enlace a la ruta de entrada de su módulo (un clic, SC-003).
  - **Área de contenido:** aloja la pantalla activa sin alterarla; las medidas están en el Estado 7.
  - **Pie de página:** ocupa todo el ancho debajo del contenido y la navegación; con contenido corto queda al fondo de la ventana (no flotante sobre el contenido).
  - **Reglas de componente:** barra superior `p-menubar` (RT-01); navegación lateral con `p-drawer` o equivalente de PrimeNG 22 que fije el SA (punto abierto 3 de la HU). Textos con i18n. El control `[ ≡ ]` tiene nombre accesible traducible ("Abrir navegación" / "Cerrar navegación") y es alcanzable por teclado; el orden de foco es barra superior, navegación, contenido, pie.
  - **Brownfield:** el esqueleto se concibe como **shell de la aplicación**; todas las pantallas autenticadas se montan dentro de él (FR-015: toda pantalla futura nace dentro).

---

### Estado 2: Navegación por módulo y URL existentes - Happy Path
- **Escenario Cubierto:** US1-A2 (CA-01 segunda parte, FR-004, SC-002). Ejemplo: usuario en `/sprints` (listado de Sprints).
- **ID de Tarea Spec Kit:** `Task-UI-02: Rutas existentes dentro del Layout` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+----------------------------------------------------------------------------------------------------+
| [p-menubar]  [ ≡ ]  Nombre de la aplicación                            [Acciones usuario] [(o) Perfil v] |
+------------------+---------------------------------------------------------------------------------+
| [navegación      |      +-------------------------------------------------------------------+      |
|  lateral]        |      |  AREA DE CONTENIDO                                                |      |
|                  |      |   +-----------------------------------------------------------+   |      |
|  [ ] Backlog     |      |   | [Contenido original de la pantalla]                       |   |      |
|  [>] Sprints     |      |   | Listado de Sprints (/sprints) - sin cambios               |   |      |
|  [ ] Equipo      |      |   +-----------------------------------------------------------+   |      |
|                  |      +-------------------------------------------------------------------+      |
+------------------+---------------------------------------------------------------------------------+
| Pie de pagina                                                                                      |
+----------------------------------------------------------------------------------------------------+

Pantallas del alcance dentro del mismo esqueleto (la URL no cambia):
+------------------------------------------+-------------------------------+------------------------+
| Pantalla                                 | URL existente                 | Entrada de navegación  |
+------------------------------------------+-------------------------------+------------------------+
| Registro de Elemento de Backlog          | /backlog/nuevo                | Backlog                |
| Sprints: listado                         | /sprints                      | Sprints                |
| Sprints: formulario                      | /sprints/nuevo                | Sprints                |
| Sprints: detalle                         | /sprints/:id                  | Sprints                |
| Sprints: elementos asignados             | /sprints/:id/elementos        | Sprints                |
| Equipo: página                           | /equipos (y rutas hijas)      | Equipo                 |
| Equipo: diálogo registro de miembro      | (sobre /equipos, sin ruta)    | Equipo                 |
| Asignación de elemento a Sprint (diálogo)| (sobre su pantalla, sin ruta) | Sprints                |
+------------------------------------------+-------------------------------+------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario hace clic en una entrada de la navegación o abre una URL existente directamente (marcador o recarga).
  - La entrada activa de la navegación se deriva de la ruta actual (módulo al que pertenece), también tras una recarga directa de una URL profunda como `/sprints/:id/elementos`.
  - El cambio de módulo reemplaza **solo el área de contenido**; barra superior, navegación y pie permanecen montados.
  - Las URL, parámetros y el contenido interno de cada pantalla no se modifican (FR-004, FR-012). La tabla anterior es de trazabilidad; no se dibuja en la interfaz.

---

### Estado 3: Ruta inexistente - Sad Path
- **Escenario Cubierto:** US1-A3 (CA-01.1, FR-005, CB-01).
- **ID de Tarea Spec Kit:** `Task-UI-03: Ruta comodín dentro del Layout` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+----------------------------------------------------------------------------------------------------+
| [p-menubar]  [ ≡ ]  Nombre de la aplicación                            [Acciones usuario] [(o) Perfil v] |
+------------------+---------------------------------------------------------------------------------+
| [navegación      |      +-------------------------------------------------------------------+      |
|  lateral]        |      |  AREA DE CONTENIDO                                                |      |
|                  |      |                                                                   |      |
|  [ ] Backlog     |      |   +-----------------------------------------------------------+   |      |
|  [ ] Sprints     |      |   | (i) [p-message severity="info"]                           |   |      |
|  [ ] Equipo      |      |   |     La ruta solicitada no existe.                         |   |      |
|                  |      |   +-----------------------------------------------------------+   |      |
|  (ninguna        |      |                                                                   |      |
|   marcada)       |      +-------------------------------------------------------------------+      |
+------------------+---------------------------------------------------------------------------------+
| Pie de pagina                                                                                      |
+----------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario autenticado abre una URL que no coincide con ninguna ruta existente.
  - Barra superior, navegación lateral y pie de página **permanecen visibles y operativos** (FR-005); el usuario sale con las entradas de la navegación.
  - El área central **no muestra contenido de ninguna otra pantalla**. Ninguna entrada de navegación aparece marcada como activa.
  - El diseño específico de la página de error está ❓ No documentado (borde de `spec.md`); se aplica una heurística mínima (D-05): un único mensaje informativo breve, sin botones, sin ilustraciones, sin enlaces nuevos.

---

### Estado 4: Ancho 768 px, navegación colapsada - Edge Case
- **Escenario Cubierto:** US2-A1 (CA-01.2, FR-006, SC-004, CB-02). Resolución humana: a 768 px la navegación arranca **colapsada** automáticamente.
- **ID de Tarea Spec Kit:** `Task-UI-04: Comportamiento responsivo del Layout (768 px)` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------+
| [p-menubar] [ ≡ ] Nombre de la aplicación   [Acc.] [(o) v]   |
+--------------------------------------------------------------+
|                                                              |
|  +--------------------------------------------------------+  |
|  | AREA DE CONTENIDO  (ancho disponible, sin desborde)    |  |
|  | espaciado interior 1.5 rem                             |  |
|  |                                                        |  |
|  |  +--------------------------------------------------+  |  |
|  |  | [Contenido original de la pantalla - sin cambios]|  |  |
|  |  +--------------------------------------------------+  |  |
|  |                                                        |  |
|  +--------------------------------------------------------+  |
|                                                              |
+--------------------------------------------------------------+
| Pie de pagina                                                |
+--------------------------------------------------------------+
         (sin barra de desplazamiento horizontal)
```
- **Nota de Interfaz:**
  - **Disparador:** carga o redimensionamiento de la ventana a un ancho de 768 px (Opción B). No se persiste.
  - **Colapsada = oculta:** la navegación no ocupa espacio; el contenido usa todo el ancho disponible. El control `[ ≡ ]` permanece **siempre visible** en la barra superior (FR-006).
  - Sin desplazamiento horizontal de la ventana en ninguna pantalla del alcance (SC-004). Lo que ya desbordaba dentro de una pantalla por su contenido interno queda fuera de esta HU (contenido sin cambios), pero el esqueleto no debe introducir desborde.
  - La barra superior conserva perfil y acciones visibles en 768 px; el nombre de la aplicación puede abreviarse por truncamiento antes de ocultar perfil o acciones.
  - Alcanzar un módulo desde aquí cuesta **dos clics** (abrir con `[ ≡ ]` y elegir entrada), coherente con SC-003.

---

### Estado 5: Ancho 768 px, navegación abierta con el control - Edge Case
- **Escenario Cubierto:** US2-A1 (FR-006: "control visible para expandir la navegación y acceder a los tres módulos"; FR-003).
- **ID de Tarea Spec Kit:** `Task-UI-04: Comportamiento responsivo del Layout (768 px)` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------+
| [p-menubar] [ ≡ ] Nombre de la aplicación   [Acc.] [(o) v]   |
+------------------+-------------------------------------------+
| [navegación      |//////////////////////////////////////////|
|  lateral abierta |/// contenido atenuado por la capa ///////|
|  sobre contenido]|//////////////////////////////////////////|
|                  |//////////////////////////////////////////|
|  [>] Backlog     |//////////////////////////////////////////|
|  [ ] Sprints     |//////////////////////////////////////////|
|  [ ] Equipo      |//////////////////////////////////////////|
|                  |//////////////////////////////////////////|
+------------------+-------------------------------------------+
| Pie de pagina                                                |
+--------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** clic o activación por teclado del control `[ ≡ ]` con la ventana en 768 px.
  - La navegación se abre **superpuesta** al contenido (capa), sin empujarlo, para no provocar desborde horizontal ni reflujo del contenido.
  - Se cierra con: elegir una entrada (navega y se cierra), clic sobre la capa atenuada, tecla Escape o el mismo control `[ ≡ ]`.
  - Al abrir, el foco pasa a la primera entrada; al cerrar, vuelve al control `[ ≡ ]`.
  - El estado abierto/cerrado vale durante la sesión y no se guarda tras recargar (Opción B).

---

### Estado 6: Ancho amplio, navegación colapsada manualmente - Edge Case
- **Escenario Cubierto:** US2-A1 (CA-01.2 "o con la navegación lateral colapsada", FR-003, FR-006).
- **ID de Tarea Spec Kit:** `Task-UI-05: Colapso manual de la navegación lateral` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+----------------------------------------------------------------------------------------------------+
| [p-menubar]  [ ≡ ]  Nombre de la aplicación                            [Acciones usuario] [(o) Perfil v] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|           +--------------------------------------------------------------------------+            |
|           |  AREA DE CONTENIDO (max 1280 px, centrada, espaciado interior 1.5 rem)   |            |
|           |   +------------------------------------------------------------------+   |            |
|           |   | [Contenido original de la pantalla - sin cambios]                |   |            |
|           |   +------------------------------------------------------------------+   |            |
|           +--------------------------------------------------------------------------+            |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
| Pie de pagina                                                                                      |
+----------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario activa `[ ≡ ]` con la navegación expandida en ancho amplio (Estado 1).
  - La navegación desaparece y el área de contenido sigue centrada con el mismo máximo de 1280 px; el control `[ ≡ ]` permanece visible para reabrirla (FR-006).
  - **Sin persistencia:** la elección manual vale solo durante la sesión; al recargar vuelve al comportamiento por ancho (expandida en ancho amplio, colapsada a 768 px).
  - Al cambiar entre pantallas dentro de la sesión, el estado elegido se mantiene (la navegación es parte del esqueleto, que no se remonta).
  - Con la navegación colapsada, alcanzar un módulo cuesta dos clics (SC-003).

---

### Estado 7: Medidas del área de contenido a 1920 px - Happy Path
- **Escenario Cubierto:** US3-A1 y US3-A2 (CA-01.3, FR-007, SC-005, CB-03).
- **ID de Tarea Spec Kit:** `Task-UI-06: Medidas uniformes del área de contenido` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Ventana 1920 px
|<--------------------------------------- 1920 px --------------------------------------------->|
+----------------------------------------------------------------------------------------------+
| [p-menubar]                                                                                  |
+------------------+---------------------------------------------------------------------------+
| [navegación]     |            |<------------ max 1280 px (centrada) ------------>|            |
|                  |            +--------------------------------------------------+            |
|                  |            |<-1.5rem->                              <-1.5rem->|            |
|                  |            | ^ 1.5 rem                                        |            |
|                  |            |   +------------------------------------------+   |            |
|                  |            |   | [Contenido original de la pantalla]      |   |            |
|                  |            |   +------------------------------------------+   |            |
|                  |            | v 1.5 rem                                        |            |
|                  |            +--------------------------------------------------+            |
+------------------+---------------------------------------------------------------------------+
| Pie de pagina                                                                                |
+----------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** cualquier pantalla del alcance mostrada a 1920 px de ventana.
  - **Medidas (FR-007):** ancho máximo del área de contenido 1280 px; centrada horizontalmente; espaciado interior 1.5 rem en los cuatro lados. Referencia de implementación de la HU (RT-02): `max-w-7xl mx-auto` y `p-6` (escala de la Constitución: 1 = 0.25rem). Son valores propuestos por el BA y adoptados como vigentes en `spec.md`.
  - **Mismo valor en todas las pantallas** (US3-A2): las ocho pantallas del alcance (tabla del Estado 2) heredan estas medidas del esqueleto; ninguna pantalla las redefine ni las sobrescribe. Pasa si la medición coincide en todas.
  - **Centrado:** se interpreta dentro de la zona de contenido (a la derecha de la navegación cuando está expandida), no respecto de la ventana completa (D-04).
  - Por debajo de 1280 px de zona disponible, el contenido ocupa el ancho disponible conservando el espaciado interior (Estado 4).
  - Las medidas se verifican en el esqueleto, no con estilos por pantalla (RT-06).

---

### Estado 8: Tipografía uniforme y cuerpo sin márgenes - Happy Path
- **Escenario Cubierto:** US4-A1 (CA-06, FR-008, FR-009).
- **ID de Tarea Spec Kit:** `Task-UI-07: Tipografía base global` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Borde de la ventana (sin margen del cuerpo, 0 px en los cuatro lados)
+----------------------------------------------------------------------------------------------+
|[p-menubar]  Aa  Texto en familia sans-serif del sistema                       Aa  Aa  [(o) v]|
+------------------+---------------------------------------------------------------------------+
| Aa Backlog       |                                                                           |
| Aa Sprints       |         Aa  Todo el texto del área de contenido                           |
| Aa Equipo        |             usa la misma familia sans-serif                               |
|                  |                                                                           |
+------------------+---------------------------------------------------------------------------+
| Aa Pie de pagina                                                                             |
+----------------------------------------------------------------------------------------------+
Las zonas llegan al borde de la ventana: barra superior y pie a todo el ancho, sin franja blanca alrededor.
```
- **Nota de Interfaz:**
  - **Disparador:** cualquier pantalla del alcance al mostrarse.
  - Una única familia sans-serif **del sistema** para todo el texto: barra superior, navegación, contenido, pie y diálogos. Sin fuentes externas descargadas, sin fuente de marca (FR-008). No debe aparecer la fuente serif por defecto del navegador en ninguna zona.
  - El cuerpo de la página no tiene márgenes por defecto: la barra superior y el pie tocan los bordes de la ventana.
  - La declaración de tipografía y del margen del cuerpo ocurre **una sola vez**, en el archivo de estilos globales (FR-009); no se repite por componente ni por pantalla.

---

### Estado 9: Diálogo sobre el esqueleto - Edge Case
- **Escenario Cubierto:** Edge Case de `spec.md`: "Pantallas que se abren como diálogo (registro de miembro, asignación de elemento a Sprint): se muestran sobre el esqueleto sin alterarlo ni cambiar su contenido interno" (FR-001, FR-004).
- **ID de Tarea Spec Kit:** `Task-UI-08: Diálogos sobre el Layout` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+----------------------------------------------------------------------------------------------------+
|[p-menubar] (atenuada)  [ ≡ ]  Nombre de la aplicación                 [Acciones usuario] [(o) v]  |
+------------------+---------------------------------------------------------------------------------+
|//(atenuada)//////|/////////////////////////////////////////////////////////////////////////////////|
|// [>] Equipo ////|///////////////  +-----------------------------------------+  ////////////////////|
|//////////////////|///////////////  | [p-dialog]  Título original del diálogo |  ////////////////////|
|//////////////////|///////////////  |-----------------------------------------|  ////////////////////|
|//////////////////|///////////////  | [Contenido original del diálogo,        |  ////////////////////|
|//////////////////|///////////////  |  sin cambios]                           |  ////////////////////|
|//////////////////|///////////////  +-----------------------------------------+  ////////////////////|
|//////////////////|/////////////////////////////////////////////////////////////////////////////////|
+------------------+---------------------------------------------------------------------------------+
|/ Pie de pagina (atenuado) //////////////////////////////////////////////////////////////////////////|
+----------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario abre el diálogo de registro de miembro (desde Equipo) o el diálogo de asignación de elemento a Sprint (desde su pantalla).
  - El diálogo se muestra **encima** del esqueleto completo con capa atenuada que cubre las cuatro zonas; el esqueleto no se reubica, no se recorta ni cambia de tamaño (CA-01).
  - El **contenido interno, los campos, validaciones y acciones del diálogo no cambian** (FR-004, FR-012); esta HU no los rediseña.
  - El diálogo es modal: mientras está abierto, el foco queda atrapado en él; al cerrarse, el foco vuelve al elemento que lo abrió.
  - A 768 px el diálogo conserva el ancho disponible sin generar desplazamiento horizontal de la ventana.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES
- **Heurísticas Aplicadas:**
  - **D-01 Navegación colapsada = oculta, con control siempre visible:** FR-006 exige "un control visible para expandir"; SC-003 admite "dos clics si está colapsada". Un riel de iconos daría un solo clic y contradice esa cifra; la navegación oculta con control `[ ≡ ]` permanente la cumple y libera ancho.
  - **D-02 Navegación abierta a 768 px como capa superpuesta:** evita empujar el contenido y el desborde horizontal (SC-004). En ancho amplio la navegación expandida ocupa una columna fija junto al contenido. El componente concreto lo decide el SA.
  - **D-03 Estado de la navegación solo en sesión:** conforme a la resolución humana (Opción B); sin almacenamiento local ni persistencia. Cambiar de pantalla dentro de la sesión conserva el estado porque el esqueleto no se remonta.
  - **D-04 Centrado dentro de la zona de contenido:** `spec.md` dice "centrada horizontalmente" sin precisar la referencia. Se centra dentro de la zona a la derecha de la navegación, no respecto de la ventana, para evitar solapar la navegación en anchos medios. A 1920 px, con la navegación expandida, la zona supera 1280 px y las medidas se cumplen igual.
  - **D-05 Ruta inexistente con un único mensaje informativo:** el diseño de la página de error está ❓ No documentado. Un área central vacía sería ambigua para el usuario; se usa un `p-message` informativo sin acciones ni enlaces. No es lógica de negocio.
  - **D-06 Nombre de la aplicación en texto plano:** FR-008 y la Constitución prohíben logotipo y marca. El texto exacto es contenido i18n por definir; el wireframe usa "Nombre de la aplicación".
  - **D-07 Pie de página sin contenido inventado:** `spec.md` no define su contenido. Se diseña como zona presente con texto neutro i18n; sin enlaces, sin versión, sin redes.
  - **D-08 Orden de foco y nombres accesibles:** barra superior, navegación, contenido, pie; nombres accesibles traducibles para el control `[ ≡ ]` y las entradas. No agrega funcionalidad; sigue el soporte i18n de la Constitución.
  - **D-09 Verificación de tipografía (US4-A2):** sin pantalla; el SA debe incluirla como criterio de plan: exactamente una declaración de familia tipográfica y de margen del cuerpo en el archivo de estilos globales, sin `::ng-deep` ni `!important` (RT-05, RT-06).
  - **D-10 Evidencia de cierre (US5):** sin pantalla nueva. Las 6 capturas (Backlog, Sprints, Equipo × 1920 px y 768 px) deben mostrar las cuatro zonas: a 1920 px con la navegación expandida (Estado 1) y a 768 px con la navegación colapsada (Estado 4), que son los estados iniciales fijados por la resolución humana.
  - **Restricciones de negocio respetadas en el 100 % de los estados:** sin título ni migas de pan (HU derivada); solo tres entradas de navegación; sin marca ni fuentes externas; sin campos, filtros ni acciones de datos nuevos; sin persistencia del estado de navegación; sin código HTML/CSS/Angular en el entregable (las clases de Tailwind y componentes de PrimeNG citados son referencias de las restricciones RT-01 y RT-02 de la HU, no código).
- **Bloqueos de UX / Consultas para BA:** Ninguno bloqueante. Informativos, sin alterar el diseño:
  - **B-01:** el diseño específico de la página de ruta inexistente sigue ❓ No documentado (punto abierto 2 de la HU); se resolvió con la heurística D-05. Si el negocio define otra, se rediseña solo el Estado 3.
  - **B-02:** el contenido del menú de perfil y de las "acciones del usuario" no lo define la HU (supuesto: lo resuelve la autenticación existente). El diseño reserva la zona sin definir acciones; el SA debe confirmar qué expone hoy `auth` para esa zona.
  - **B-03:** la entrada **Backlog** debe apuntar a una ruta existente. La única ruta de Backlog hoy es `/backlog/nuevo` (Registro de Elemento de Backlog); no existe un listado de Backlog en el alcance. El SA debe confirmar el destino de esa entrada sin crear rutas nuevas (FR-004).
  - **B-04:** la entrada **Equipo** y el comportamiento de sus pestañas internas (rutas hijas de `/equipos`) quedan como están; el SA debe confirmar cuál es la ruta de entrada del módulo para la navegación.
  - **B-05:** el componente concreto de la navegación lateral (punto abierto 3 de la HU) lo decide el SA; este diseño es válido para cualquier componente que ofrezca modo acoplado en ancho amplio, capa superpuesta a 768 px y control externo de apertura.
  - **B-06:** los valores de 1280 px y 1.5 rem siguen siendo una propuesta del BA (punto abierto 1) adoptada en `spec.md`; si cambian, solo se actualiza el Estado 7.

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER
Handoff vertical estricto definido por el rol UX (Spec Kit Bridge); se entrega al Solutions Architect sin devolver el turno al Product Manager. Elegir la siguiente historia corresponde al Product Manager.

`@SA: El diseño visual de la HU [035-HU_refactorizacion_esqueleto_ui] ha concluido exitosamente en [documents/designer-ux/ux_035_refactorizacion_esqueleto_ui.md]. Procede con el tech-design y arquitectura.`
