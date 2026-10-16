# ESPECIFICACIÓN DE DISEÑO UX: Theming de la Aplicación — Modo Claro y Oscuro

- **Historia de Usuario Fuente:** `036-theming-claro-oscuro-ui.md` (`documents/business-analyst/036-theming-claro-oscuro-ui.md`)
- **Spec Kit Fuente:** `specs/036-theming-claro-oscuro-ui/spec.md` y `specs/036-theming-claro-oscuro-ui/checklists/requirements.md`
- **Fecha de Diseño:** 06-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (`.specify/memory/constitution.md`, enmienda "Theme Visual (HU-036)" y Shell de Aplicación HU-035). La solución es una **capa de tema sobre el shell existente**: no crea zonas nuevas; solo agrega un conmutador a la barra superior y colorea las cuatro zonas ya existentes.
- **Requiere interfaz (HU):** Sí.
- **Resolución humana incorporada:** sin parpadeo del modo equivocado al cargar (Opción A): el modo se aplica antes del primer pintado. Cubierta en los Estados 9 y 10.

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `036-theming-claro-oscuro-ui` — Theming de la Aplicación, modo claro y oscuro (PrimeNG 22).
- **Enfoque de Usabilidad:** Un único conmutador claro/oscuro, siempre visible a la derecha de la barra superior y junto a las acciones del usuario, cambia toda la pantalla en un solo paso sin recarga ni pérdida de datos. La jerarquía de superficies (página < tarjeta/navegación/barra/pie, separadas por bordes sutiles) es idéntica en ambos modos; solo cambian los valores de la tabla de tokens.
- **Alcance visual (restricciones respetadas en el 100 % de los estados):**
  - **No se agregan zonas ni elementos** al shell: nada de buscador, ayuda, notificaciones, "Share", selector de workspace, sección "Apps", barra de vista previa, logotipo ni marca (FR-018). Solo se añade el conmutador (FR-007).
  - **No se rediseñan pantallas existentes** (Registro de Elemento de Backlog, Sprints, Equipo): se muestran como marcador "contenido original sin cambios" (FR-017). No hay título, migas de pan, pestañas secundarias, contenedores/grilla ni formularios con etiqueta a la izquierda (fuera de alcance).
  - **Sin sombras personalizadas** ni estados hover/foco/deshabilitado propios más allá de los derivados del color primario.
  - **Sin errores visibles** ante almacenamiento inválido o no disponible (FR-011): no existe ningún mensaje de error de tema.
  - Los códigos hexadecimales aparecen en los wireframes solo como **anotaciones de la tabla de tokens**, no como código.
- **Leyenda de anotaciones:** `{T:rol}` indica el rol de la tabla de tokens que debe medirse en esa zona.

**Tabla de tokens de referencia (de `spec.md`):**

```text
+-------------------------------------+-----------+-----------+
| Rol                                 | Claro     | Oscuro    |
+-------------------------------------+-----------+-----------+
| Primario (botón primario, foco)     | #0092b8   | #00b8db   |
| Fondo de página                     | #f9fafb   | #101828   |
| Tarjeta/nav lateral/barra/pie       | #ffffff   | #1e2939   |
| Borde y separador                   | #e5e7eb   | #364153   |
| Elemento de navegación activo       | #e5e7eb   | #364153   |
| Texto principal                     | #1e2939   | #e5e7eb   |
| Texto secundario                    | #6a7282   | #99a1af   |
| Peligro                             | #fb2c36   | #fb2c36   |
| Texto de enlace                     | #007595   | #00b8db   |
+-------------------------------------+-----------+-----------+
Radios: contenedores 0.75rem · controles y botones 0.5rem · entrada activa de navegación 0.5rem
```

### Trazabilidad Escenario → Estado Visual (1 a 1)

| Escenario (`spec.md`) | Estado Visual |
|---|---|
| US1-A1 Paleta del modo claro | Estado 1 |
| US1-A2 Entrada activa de navegación en claro | Estado 2 |
| US1-A3 Botón de peligro en claro | Estado 3 |
| US1-A4 Radios de contenedores y controles | Estado 1 (anotaciones de radio) |
| US2-A1 Paleta del modo oscuro | Estado 4 |
| US2-A2 Conmutador cambia de inmediato sin pérdida de datos | Estado 5 |
| US2-A3 Segunda activación vuelve al modo anterior | Estado 6 |
| US2-A4 Conmutador por teclado y lector de pantalla | Estado 7 |
| US2-A5 Botón de peligro en oscuro | Estado 8 |
| US3-A1 Elección persistida tras recarga | Estado 9 |
| US3-A2 Primera visita sigue preferencia del sistema | Estado 10 |
| US3-A3 Elección inválida o almacenamiento no disponible | Estado 11 |
| US4-A1 Contraste con tabla de excepciones | Estado 12 |
| US4-A2 Par bajo el umbral bloquea el cierre | **Sin superficie visual:** compuerta de proceso (D-09) |
| US5-A1 / A2 Gobernanza del tema | **Sin superficie visual:** verificación de código (D-10) |
| US5-A3 Pantalla nueva hereda el tema | Estado 13 |
| US6-A1 Pantallas existentes sin regresión en ambos modos | Estado 13 |
| US6-A2 Estilo propio de color eliminado | **Sin superficie visual nueva:** el resultado visible es el Estado 13 (D-11) |
| US6-A3 / A4 / A5 Cierre verificado y 6 capturas | **Sin pantalla de usuario:** los Estados 1 y 4 fijan qué debe verse en las capturas (D-12) |

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Modo claro — paleta aplicada a todo el shell - Happy Path
- **Escenario Cubierto:** US1-A1 y US1-A4 (CA-01, FR-001, FR-003). Se muestra con Registro de Elemento de Backlog (`/backlog/nuevo`); idéntico en toda ruta.
- **ID de Tarea Spec Kit:** `Task-THEME-01: Preset de tema y paleta en modo claro` (provisional: `tasks.md` de la HU 036 aún no existe; el SA debe reconciliar el ID).
- **Wireframe Estructural (ASCII):**
```text
Fondo de página {T:fondo} #f9fafb
+----------------------------------------------------------------------------------------------------+
| BARRA SUPERIOR {T:tarjeta} #ffffff · borde inferior {T:borde} #e5e7eb                              |
| [ ≡ ] Nombre de la aplicación          [Acciones usuario] [ ☾ Conmutador ] [(o) Perfil v]          |
+------------------+---------------------------------------------------------------------------------+
| NAVEGACIÓN       |                                                                                 |
| {T:tarjeta}      |   +-------------------------------------------------------------------------+   |
| #ffffff          |   | TARJETA {T:tarjeta} #ffffff · borde #e5e7eb · radio 0.75rem             |   |
| borde derecho    |   |                                                                         |   |
| #e5e7eb          |   |  Texto principal {T:texto} #1e2939                                      |   |
|                  |   |  Texto secundario {T:texto2} #6a7282                                    |   |
| [ ] Sprints      |   |  Enlace de ejemplo {T:enlace} #007595                                   |   |
| [ ] Equipo       |   |                                                                         |   |
| [>] Backlog      |   |  Campo: [ valor........................ ] radio 0.5rem borde #e5e7eb |   |
|   (activa, ver   |   |                                                                         |   |
|    Estado 2)     |   |                          [ Guardar ] botón primario                     |   |
|                  |   |                          fondo #0092b8 · etiqueta blanca · radio 0.5rem |   |
|                  |   +-------------------------------------------------------------------------+   |
+------------------+---------------------------------------------------------------------------------+
| PIE {T:tarjeta} #ffffff · borde superior #e5e7eb · texto secundario #6a7282                        |
+----------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** usuario autenticado con modo claro activo (elegido o derivado del sistema) abre cualquier pantalla.
  - **Reglas de componente:** el color sale solo del preset de tema; páginas y formularios no declaran color ni radio (FR-013, FR-014). El foco de los controles usa el primario `#0092b8`.
  - **Brownfield:** capa de tema sobre el shell existente de la HU-035; no cambia la estructura de zonas.
  - La tarjeta de ejemplo representa cualquier contenedor de las pantallas existentes; no se agregan campos ni acciones.

---

### Estado 2: Modo claro — entrada activa de la navegación lateral - Happy Path
- **Escenario Cubierto:** US1-A2 (CA-01.1, FR-004).
- **ID de Tarea Spec Kit:** `Task-THEME-02: Resaltado de entrada activa de navegación` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+------------------+
| NAVEGACIÓN       |
| fondo #ffffff    |
|                  |
|  [ ] Sprints     |   <- texto principal #1e2939, sin fondo
|  +------------+  |
|  |[>] Backlog |  |   <- ACTIVA: fondo #e5e7eb · texto principal #1e2939
|  +------------+  |      esquinas 0.5rem
|  [ ] Equipo      |
+------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario está en una pantalla de un módulo (la entrada se deriva de la ruta, incluso tras recarga en una URL profunda, igual que HU-035).
  - **Reglas de componente:** solo una entrada activa a la vez; el resaltado ocupa el ancho de la entrada. Cualquier texto secundario sobre la entrada activa es la excepción E-06 (3.91:1).
  - **Brownfield:** no cambia las tres entradas existentes.

---

### Estado 3: Modo claro — botón de peligro - Happy Path
- **Escenario Cubierto:** US1-A3 (CA-01.2, FR-005).
- **ID de Tarea Spec Kit:** `Task-THEME-03: Variante contorneada de peligro` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+-------------------------------------------------------------+
| TARJETA / contenedor  fondo #ffffff                         |
|                                                             |
|   [ Cancelar ]  secundario          +-------------------+   |
|                                     | Eliminar (peligro)|   |
|                                     +-------------------+   |
|                                     texto #fb2c36           |
|                                     borde #fb2c36 · radio   |
|                                     0.5rem · fondo = el del |
|                                     contenedor (sin relleno)|
+-------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** cualquier pantalla existente que ya muestre un botón de peligro (la HU no agrega ninguno).
  - **Reglas de componente:** variante contorneada, sin relleno. El par texto de peligro sobre `#ffffff` es la excepción E-04 (3.81:1). El borde de este botón es indicador del control, por lo que debe cumplir ≥ 3:1 (el rojo sobre blanco lo cumple).
  - **Decisión de la HU:** sigue la maqueta oscura ("Delete my account").

---

### Estado 4: Modo oscuro — paleta aplicada a todo el shell - Happy Path
- **Escenario Cubierto:** US2-A1 (CA-02, FR-002, FR-003).
- **ID de Tarea Spec Kit:** `Task-THEME-04: Paleta del modo oscuro` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Fondo de página {T:fondo} #101828
+----------------------------------------------------------------------------------------------------+
| BARRA SUPERIOR #1e2939 · borde inferior #364153                                                    |
| [ ≡ ] Nombre de la aplicación          [Acciones usuario] [ ☀ Conmutador ] [(o) Perfil v]          |
+------------------+---------------------------------------------------------------------------------+
| NAVEGACIÓN       |                                                                                 |
| #1e2939          |   +-------------------------------------------------------------------------+   |
| borde der. #364153|  | TARJETA #1e2939 · borde #364153 · radio 0.75rem                         |   |
|                  |   |                                                                         |   |
| [ ] Sprints      |   |  Texto principal #e5e7eb                                                |   |
| [ ] Equipo       |   |  Texto secundario #99a1af                                               |   |
| +------------+   |   |  Enlace / acento #00b8db                                                |   |
| |[>] Backlog |   |   |                                                                         |   |
| +------------+   |   |  Campo: [ valor........................ ] fondo #1e2939 borde #364153  |   |
|  activa: fondo   |   |         marcador de posición #99a1af (5.63:1, sin excepción)           |   |
|  #364153         |   |                                                                         |   |
|                  |   |                          [ Guardar ] botón primario                     |   |
|                  |   |                          fondo #00b8db · etiqueta blanca                |   |
|                  |   +-------------------------------------------------------------------------+   |
+------------------+---------------------------------------------------------------------------------+
| PIE #1e2939 · borde superior #364153 · texto secundario #99a1af                                    |
+----------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** modo oscuro activo (elegido o derivado del sistema).
  - **Reglas de componente:** mismos radios y misma jerarquía que el Estado 1; solo cambian los valores. El fondo del campo oscuro se asume `#1e2939` (supuesto de `spec.md`; pendiente de confirmación humana, ver B-01). Etiqueta blanca sobre primario oscuro es la excepción E-03 (2.37:1).
  - El ícono del conmutador pasa a "sol" (ofrece volver a claro); ver D-03.

---

### Estado 5: Conmutador activado — cambio inmediato sin pérdida de datos - Happy Path
- **Escenario Cubierto:** US2-A2 (CA-02.1, FR-008, CB-03).
- **ID de Tarea Spec Kit:** `Task-THEME-05: Conmutador en barra superior y servicio de tema` (provisional).
- **Wireframe Estructural (ASCII):**
```text
ANTES (claro)                               DESPUÉS (oscuro), misma ruta, sin recarga
+--------------------------------+          +--------------------------------+
| [≡] App      [☾] [(o) Perfil v]|  clic →  | [≡] App      [☀] [(o) Perfil v]|
+--------------------------------+          +--------------------------------+
| Nombre: [ Refactor login___ ]  |          | Nombre: [ Refactor login___ ]  |
| Notas : [ a medio escribir__ ] |          | Notas : [ a medio escribir__ ] |
|            [ Guardar ]         |          |            [ Guardar ]         |
+--------------------------------+          +--------------------------------+
 Lo escrito, el foco y la posición de                     ← se conservan idénticos
 scroll no cambian; la URL no cambia.
```
- **Nota de Interfaz:**
  - **Disparador:** clic o activación por teclado del conmutador de la barra superior.
  - **Reglas de componente:** el cambio es de todo el documento en un solo paso (SC-002); no hay recarga, no hay navegación, el shell no se remonta, los formularios conservan valores, foco y desplazamiento. Sin animación bloqueante ni pantalla intermedia; una transición de color breve es opcional y respeta `prefers-reduced-motion` (D-04).
  - **Brownfield:** el conmutador vive en la barra superior del shell HU-035 (la misma zona de acciones del usuario).

---

### Estado 6: Conmutador activado de nuevo — vuelve al modo anterior - Happy Path
- **Escenario Cubierto:** US2-A3 (CA-02.1, segunda parte).
- **ID de Tarea Spec Kit:** `Task-THEME-05: Conmutador en barra superior y servicio de tema` (provisional, mismo ID).
- **Wireframe Estructural (ASCII):**
```text
Oscuro  [☀]  --clic-->  Claro  [☾]  --clic-->  Oscuro  [☀]
  (cada activación alterna exactamente entre los dos modos; no existe un tercer modo "sistema")
```
- **Nota de Interfaz:**
  - **Disparador:** segunda activación consecutiva del conmutador.
  - **Reglas de componente:** el conmutador es binario (claro/oscuro); no se agrega una tercera opción "Sistema" (no está en la HU). La elección manual reemplaza la preferencia del sistema desde la primera activación.

---

### Estado 7: Conmutador operado por teclado y lector de pantalla - Edge Case
- **Escenario Cubierto:** US2-A4 (CA-02.1, FR-007).
- **ID de Tarea Spec Kit:** `Task-THEME-05: Conmutador en barra superior y servicio de tema` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Barra superior (foco visible con anillo de color primario)
+----------------------------------------------------------------------------+
| [≡]  App           [Acciones usuario]  [[ ☾ ]]  [(o) Perfil v]             |
|                                         ^^^^^^^                            |
|                                         anillo de foco {T:primario}        |
|                                         nombre accesible, ej.:             |
|                                         "Cambiar a modo oscuro"            |
|                                         (en oscuro: "Cambiar a modo claro")|
+----------------------------------------------------------------------------+
Teclas: Tab llega al conmutador · Enter o Espacio lo activa
Anuncio del lector: nombre + estado ("modo oscuro activado" tras activarlo)
```
- **Nota de Interfaz:**
  - **Disparador:** el usuario navega con Tab o con lector de pantalla.
  - **Reglas de componente:** orden de foco en la barra superior: `[≡]`, acciones del usuario, conmutador, perfil (el conmutador queda entre las acciones y el perfil). La etiqueta accesible es texto i18n y describe la acción siguiente (ver D-05). El indicador de foco usa el primario del modo activo con contraste ≥ 3:1 sobre la barra.

---

### Estado 8: Modo oscuro — botón de peligro - Happy Path
- **Escenario Cubierto:** US2-A5 (FR-005 en modo oscuro).
- **ID de Tarea Spec Kit:** `Task-THEME-03: Variante contorneada de peligro` (provisional).
- **Wireframe Estructural (ASCII):**
```text
+-------------------------------------------------------------+
| TARJETA / contenedor  fondo #1e2939                         |
|                                                             |
|   [ Cancelar ]  secundario          +-------------------+   |
|                                     | Eliminar (peligro)|   |
|                                     +-------------------+   |
|                                     texto #fb2c36           |
|                                     borde #fb2c36 · radio   |
|                                     0.5rem · sin relleno    |
+-------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Disparador:** pantalla existente con botón de peligro en modo oscuro.
  - **Reglas de componente:** mismo rojo `#fb2c36` en ambos modos. Texto de peligro sobre `#1e2939` es la excepción E-05 (3.85:1).

---

### Estado 9: Reingreso con elección guardada - Happy Path
- **Escenario Cubierto:** US3-A1 (CA-02.2, FR-009, SC-003). Resolución humana: sin parpadeo.
- **ID de Tarea Spec Kit:** `Task-THEME-06: Persistencia de la elección y aplicación previa al primer pintado` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Elegiste oscuro → recargas (F5) o reabres la app en el mismo navegador

 Línea de tiempo visual                    Resultado
 [carga] ──► [primer pintado] ──► [app lista]
              ya en oscuro          oscuro (conmutador muestra ☀)
              (nunca se ve un destello claro)
```
- **Nota de Interfaz:**
  - **Disparador:** recarga o reapertura en el mismo navegador con elección guardada (`light` o `dark`).
  - **Reglas de componente:** el modo se determina antes del primer pintado (resolución humana, Opción A) para que no haya destello del modo equivocado; el SA define el mecanismo y su prueba de verificación. La persistencia es por navegador, no por cuenta ni entre dispositivos.

---

### Estado 10: Primera visita — sigue la preferencia del sistema - Edge Case
- **Escenario Cubierto:** US3-A2 (CA-02.3, FR-010, CB-01).
- **ID de Tarea Spec Kit:** `Task-THEME-06: Persistencia de la elección y aplicación previa al primer pintado` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Sin elección guardada
  Sistema = oscuro  ──►  app en oscuro, conmutador muestra ☀
  Sistema = claro   ──►  app en claro,  conmutador muestra ☾

Con la app abierta y SIN elección manual:
  el usuario cambia el sistema a oscuro  ──►  la app pasa a oscuro sola
Tras elegir manualmente:
  la app deja de seguir al sistema (la elección prevalece)
```
- **Nota de Interfaz:**
  - **Disparador:** apertura sin elección guardada; o cambio de la preferencia del sistema operativo con la app abierta y sin elección manual (edge case de `spec.md`).
  - **Reglas de componente:** misma ausencia de parpadeo que el Estado 9. No se muestra aviso ni mensaje al seguir al sistema.

---

### Estado 11: Elección inválida o almacenamiento no disponible - Sad Path
- **Escenario Cubierto:** US3-A3 (CA-02.4, FR-011, CB-02).
- **ID de Tarea Spec Kit:** `Task-THEME-06: Persistencia de la elección y aplicación previa al primer pintado` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Valor guardado corrupto  /  almacenamiento bloqueado
+--------------------------------------------------------------+
| [≡] App                  [Acciones] [ ☾/☀ ] [(o) Perfil v]   |
+--------------------------------------------------------------+
| (la pantalla se ve normal en el modo del sistema operativo)  |
|  SIN banner · SIN toast · SIN mensaje de error · SIN aviso   |
+--------------------------------------------------------------+
El conmutador sigue cambiando el modo durante la sesión
(al recargar, si no se pudo guardar, vuelve al modo del sistema)
```
- **Nota de Interfaz:**
  - **Disparador:** valor de `app-theme-mode` distinto de `light`/`dark`, o lectura/escritura de almacenamiento bloqueada.
  - **Reglas de componente:** el fallo es silencioso para el usuario (FR-011, SC-003: 0 errores visibles). El conmutador queda totalmente operativo y no se deshabilita. No se agrega ningún estado de error visual por decisión de la HU (heurística D-06).

---

### Estado 12: Contraste — pares y excepciones declaradas - Happy Path
- **Escenario Cubierto:** US4-A1 (CA-03, FR-012, SC-004).
- **ID de Tarea Spec Kit:** `Task-THEME-07: Prueba de contraste de pares de tokens` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Pares y su ratio esperado (guía de revisión, no es una pantalla de usuario)

CLARO                                      OSCURO
+------------------------------------+     +------------------------------------+
| Texto principal sobre tarjeta      |     | Texto principal sobre tarjeta      |
|   >= 4.5:1                         |     |   >= 4.5:1                         |
| Enlace #007595 sobre superficie    |     | Enlace #00b8db sobre superficie    |
|   >= 4.5:1                         |     |   >= 4.5:1                         |
|                                    |     | Placeholder #99a1af sobre #1e2939  |
|                                    |     |   5.63:1 (sin excepción)           |
| EXCEPCIONES DECLARADAS             |     | EXCEPCIONES DECLARADAS             |
| E-01 etiqueta blanca/primario 3.62 |     | E-03 etiqueta blanca/primario 2.37 |
| E-02 placeholder claro        2.60 |     | E-05 peligro sobre tarjeta    3.85 |
| E-04 peligro sobre blanco     3.81 |     | E-07 secundario sobre nav act 3.96 |
| E-06 secundario sobre nav act 3.91 |     | E-09 borde decorativo         1.42 |
| E-08 borde decorativo         1.24 |     |                                    |
+------------------------------------+     +------------------------------------+
Componentes de interfaz (control, foco, indicador de estado) >= 3:1 en ambos modos
```
- **Nota de Interfaz:**
  - **Disparador:** revisión de contraste previa al cierre.
  - **Reglas de componente:** los bordes decorativos (E-08, E-09) solo se permiten en separadores y contornos de contenedor; un borde que sea el único indicador de un control o de su estado debe cumplir ≥ 3:1. Esta guía es de verificación; no se agrega una vista en la aplicación.

---

### Estado 13: Pantallas existentes en ambos modos, sin regresión; pantalla nueva hereda el tema - Happy Path
- **Escenario Cubierto:** US6-A1 (CA-05, FR-017) y US5-A3 (CA-04.2, FR-016).
- **ID de Tarea Spec Kit:** `Task-THEME-08: Verificación visual de pantallas existentes y limpieza de estilos propios` (provisional).
- **Wireframe Estructural (ASCII):**
```text
Las tres pantallas existentes, mismo contenido y misma ruta en ambos modos

 CLARO (1920 px)                                 OSCURO (1920 px)
+-------------------------------------------+   +-------------------------------------------+
|[≡] App                    [☾] [(o) Perfil v]|  |[≡] App                    [☀] [(o) Perfil v]|
+--------+----------------------------------+   +--------+----------------------------------+
| Nav    |  /backlog/nuevo  Registro de     |   | Nav    |  /backlog/nuevo  Registro de     |
| [>]Back|  Elemento de Backlog (sin cambios|   | [>]Back|  Elemento de Backlog (sin cambios|
| [ ]Spr |  /sprints  /equipos (idem)       |   | [ ]Spr |  /sprints  /equipos (idem)       |
| [ ]Equ |  textos, bordes y controles      |   | [ ]Equ |  textos, bordes y controles      |
+--------+  todos legibles                   |   +--------+  todos legibles                   |
| Pie                                         |   | Pie                                         |
+-------------------------------------------+   +-------------------------------------------+

Pantalla futura (solo componentes del sistema de diseño, sin colores propios):
  adopta la paleta del modo activo sin declarar nada adicional.
```
- **Nota de Interfaz:**
  - **Disparador:** mostrar cada pantalla existente (Backlog, Sprints, Equipo) en claro y en oscuro; o construir una pantalla nueva solo con componentes del sistema de diseño.
  - **Reglas de componente:** ningún texto, borde ni control puede quedar ilegible o invisible; contenido, rutas y comportamiento sin cambios (FR-017). Los diálogos (registro de miembro, asignación de elemento a Sprint) y los componentes de PrimeNG usados en estas pantallas deben revisarse en ambos modos; su color sale solo de tokens del tema.
  - **Brownfield:** el shell se mantiene como contenedor; esta HU no agrega rutas.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES
- **Heurísticas Aplicadas:**
  - **D-01 Ubicación del conmutador:** a la derecha de la barra superior, entre las acciones del usuario y el perfil, para quedar siempre visible y cerca de los controles de usuario. La HU solo exige "barra superior".
  - **D-02 Conmutador de un solo control binario:** un botón o interruptor, sin menú desplegable ni tercera opción "Sistema" (no está en la HU; se evita scope creep). Cada activación alterna entre claro y oscuro (US2-A3).
  - **D-03 Ícono y etiqueta:** el ícono muestra el modo al que se pasará al activar (☾ en claro, ☀ en oscuro). Si el SA prefiere un interruptor con estado, debe mantener ubicación, nombre accesible y operación por teclado. Textos i18n (Constitución).
  - **D-04 Transición:** el cambio de modo es inmediato (SC-002). Si el SA agrega una transición de color corta, debe respetar `prefers-reduced-motion` y no retrasar el cambio.
  - **D-05 Etiqueta accesible:** el nombre accesible describe la acción siguiente ("Cambiar a modo oscuro" / "Cambiar a modo claro") y el cambio de estado se anuncia. La redacción final es contenido i18n por definir.
  - **D-06 Fallo silencioso de almacenamiento:** FR-011 prohíbe cualquier error visible; el sad path del Estado 11 se diseña como **ausencia** de mensaje.
  - **D-07 Fondo del campo oscuro `#1e2939`:** adoptado según el supuesto de `spec.md` (marcador 5.63:1 sin excepción); ver B-01.
  - **D-08 Sin parpadeo:** la resolución humana (Opción A) se refleja en los Estados 9 y 10; el mecanismo y su prueba corresponden al SA.
  - **D-09 US4-A2 (par bajo el umbral bloquea el cierre):** compuerta de proceso; el SA debe incluir en el plan la prueba que mide el contraste de los pares (RT-08).
  - **D-10 US5-A1 y A2 (gobernanza):** verificación de código sin pantalla; el SA debe incluir en el plan la regla de `lint:primeng` y el caso de violación inyectada (RT-07).
  - **D-11 US6-A2 (estilo propio de color):** sin superficie visual nueva; el resultado visible es el Estado 13.
  - **D-12 Evidencia de cierre:** 6 capturas (Backlog, Sprints, Equipo × claro, oscuro) a 1920 px con nombre `{modulo}-{modo}.png`. Cada captura debe mostrar barra superior (con conmutador), navegación lateral, contenido y pie, y compararse con la maqueta del mismo modo; los Estados 1 y 4 fijan qué debe verse.
  - **Restricciones de negocio respetadas en el 100 % de los estados:** sin logotipo, marca ni fuentes externas; sin elementos de la maqueta no pedidos; sin sombras personalizadas; sin campos, filtros ni acciones de datos nuevos; sin cambios de backend; sin código HTML/CSS/Angular en el entregable (los hexadecimales y radios son valores de la tabla de tokens de la HU, no código).
- **Bloqueos de UX / Consultas para BA:** Ninguno bloqueante. Informativos, sin alterar el diseño:
  - **B-01:** el fondo del campo de formulario en modo oscuro sigue pendiente de confirmación humana (punto abierto 8 de la HU). Se diseñó con `#1e2939`; si el humano define otro, se revisa solo el campo del Estado 4 y su excepción de contraste.
  - **B-02:** la ratificación en la Constitución de las excepciones E-03 a E-09 y del color de enlace `#007595` (puntos abiertos 1, 2 y 7) es decisión humana; este diseño las toma tal como están en `spec.md`.
  - **B-03:** el componente concreto del conmutador (`p-button` o `p-toggleswitch`, RT-05) lo decide el SA; el diseño vale para cualquiera que cumpla ubicación, nombre accesible y operación por teclado.
  - **B-04:** el contenido de las acciones del usuario y el perfil sigue lo resuelto en la HU-035; el SA debe confirmar que el conmutador no rompe la barra superior a 768 px.

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER
Handoff vertical estricto definido por el rol UX (Spec Kit Bridge); se entrega al Solutions Architect sin devolver el turno al Product Manager. Elegir la siguiente historia corresponde al Product Manager.

`@SA: El diseño visual de la HU [036-theming-claro-oscuro-ui] ha concluido exitosamente en [documents/designer-ux/ux-036-theming-claro-oscuro-ui.md]. Procede con el tech-design y arquitectura.`
