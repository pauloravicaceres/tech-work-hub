# Feature Specification: Theming de la Aplicación — Modo Claro y Oscuro

**Feature Branch**: `main`

**Created**: 2026-10-06

**Status**: 🔗 Consolidado en specs/README.md (Product State Ledger)

**Input**: User description: "documents/business-analyst/036-HU_theming_claro_oscuro_ui.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la aplicación con identidad visual propia en modo claro (Priority: P1)

Como Usuario Final autenticado, quiero que toda pantalla se muestre con la paleta y los radios de las maquetas de referencia en modo claro, para trabajar con una interfaz coherente y reconocible en lugar del tema neutral por defecto.

**Why this priority**: Es el entregable base: sin la paleta aplicada a la aplicación completa no existe identidad visual, y el modo oscuro y el conmutador se construyen sobre los mismos valores.

**Independent Test**: Con el modo claro activo, abrir cada pantalla (Registro de Elemento de Backlog, Sprints, Equipo) y medir el color de fondo de página, tarjetas, navegación lateral, barra superior, pie, bordes, textos y botón primario contra la tabla de valores del modo claro.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con el modo claro activo, **When** consulta cualquier pantalla, **Then** el fondo de la página es `#f9fafb`; las tarjetas, la navegación lateral, la barra superior y el pie son `#ffffff`; los bordes y separadores son `#e5e7eb`; el texto principal es `#1e2939` y el secundario `#6a7282`; el botón primario tiene fondo `#0092b8` y etiqueta blanca.
2. **Given** el modo claro activo y el usuario en una pantalla de un módulo, **When** observa la navegación lateral, **Then** la entrada del módulo actual se resalta con fondo `#e5e7eb`, texto principal y esquinas redondeadas de `0.5rem`.
3. **Given** una pantalla con un botón de peligro en modo claro, **When** se muestra, **Then** usa el rojo `#fb2c36` como color de texto y de borde, sobre el fondo del contenedor.
4. **Given** el modo claro activo, **When** se observan contenedores, controles y botones, **Then** los contenedores tienen esquinas de `0.75rem` y los controles y botones de `0.5rem`.

---

### User Story 2 - Alternar entre modo claro y oscuro con un conmutador (Priority: P1)

Como Usuario Final, quiero un conmutador claro/oscuro en la barra superior que cambie toda la pantalla de inmediato, para trabajar con comodidad según mi entorno sin perder lo que estoy haciendo.

**Why this priority**: Sin conmutador el modo oscuro no se puede ver ni verificar; junto con la Historia 1 forma el entregable mínimo viable inseparable.

**Independent Test**: En cualquier pantalla, con un formulario a medio llenar, activar el conmutador y comprobar que la paleta oscura se aplica sin recargar, sin cambiar de ruta y conservando lo escrito; activarlo otra vez y comprobar que vuelve el modo anterior.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con el modo oscuro activo, **When** consulta cualquier pantalla, **Then** el fondo de la página es `#101828`; las tarjetas, la navegación lateral, la barra superior y el pie son `#1e2939`; los bordes y separadores son `#364153`; el texto principal es `#e5e7eb` y el secundario `#99a1af`; el color de acento es `#00b8db`; el botón primario tiene fondo `#00b8db` y etiqueta blanca; la entrada activa de la navegación tiene fondo `#364153`.
2. **Given** un usuario en cualquier pantalla, **When** activa el conmutador de la barra superior, **Then** toda la pantalla cambia de modo de inmediato, sin recargar la página, sin perder lo escrito en los formularios y sin cambiar de ruta.
3. **Given** un usuario que acaba de cambiar de modo, **When** activa el conmutador de nuevo, **Then** vuelve al modo anterior.
4. **Given** el conmutador en la barra superior, **When** el usuario lo opera solo con teclado o con un lector de pantalla, **Then** es alcanzable, activable y anuncia su propósito y estado mediante una etiqueta accesible.
5. **Given** una pantalla en modo oscuro con un botón de peligro, **When** se muestra, **Then** usa el rojo `#fb2c36` como texto y borde sobre el fondo del contenedor.

---

### User Story 3 - Recordar la elección y respetar la preferencia del sistema (Priority: P2)

Como Usuario Final, quiero que la aplicación recuerde el modo que elegí y, si nunca elegí, siga la preferencia de mi sistema operativo, para no tener que reconfigurarla en cada visita.

**Why this priority**: Mejora la comodidad pero la aplicación ya es utilizable sin ella (Historias 1 y 2).

**Independent Test**: Elegir un modo, recargar y reabrir la aplicación en el mismo navegador y comprobar que se conserva; borrar la elección y comprobar que se sigue la preferencia del sistema; corromper la elección guardada o bloquear el almacenamiento y comprobar que no aparece ningún error.

**Acceptance Scenarios**:

1. **Given** un usuario que eligió un modo, **When** recarga la página o vuelve a abrir la aplicación en el mismo navegador, **Then** se muestra el modo elegido.
2. **Given** un usuario sin elección guardada, **When** abre la aplicación, **Then** se muestra el modo que coincide con la preferencia de su sistema operativo, y mientras no elija manualmente sigue esa preferencia.
3. **Given** que la elección guardada es inválida o el navegador no permite guardar datos, **When** el usuario abre la aplicación o usa el conmutador, **Then** la aplicación muestra el modo de su sistema operativo, no muestra ningún error y el conmutador sigue funcionando durante la sesión.

---

### User Story 4 - Texto y controles legibles en ambos modos (Priority: P2)

Como Usuario Final, quiero que los textos y controles tengan contraste suficiente en ambos modos, para leer y operar la aplicación sin esfuerzo.

**Why this priority**: Es una condición de calidad y accesibilidad sobre los valores de las Historias 1 y 2; no aporta valor sin ellas.

**Independent Test**: Calcular el contraste de todos los pares texto/fondo y de los componentes en ambos modos y compararlos con el umbral y con la tabla de excepciones.

**Acceptance Scenarios**:

1. **Given** los pares texto/fondo del layout y de los componentes en ambos modos, **When** se mide su contraste, **Then** el texto normal alcanza al menos 4.5:1 y los componentes de interfaz al menos 3:1, salvo los pares de la tabla de excepciones (ver Requisitos), que coinciden con el ratio declarado.
2. **Given** que algún par que no figura en la tabla de excepciones queda por debajo del umbral, **When** se intenta cerrar la historia, **Then** la historia no se cierra hasta corregir el par.

---

### User Story 5 - Garantizar que toda pantalla futura herede el tema (Priority: P2)

Como Desarrollador Frontend, quiero que el tema sea la única fuente de colores y que una verificación automática rechace cualquier color propio, para que toda pantalla nueva se vea igual que las existentes sin trabajo adicional.

**Why this priority**: Hace el tema obligatorio e inmutable para las historias futuras (decisión humana H-05), pero no es visible para el Usuario Final.

**Independent Test**: Ejecutar la verificación automática de estilos sobre el código: debe terminar sin errores; inyectar un color propio en un componente y comprobar que falla indicando archivo y línea.

**Acceptance Scenarios**:

1. **Given** el código fuente del frontend tras la historia, **When** se buscan colores literales, clases de paleta o estilos de color en línea, **Then** los colores literales existen solo en el archivo de tema y no hay ninguno de los otros.
2. **Given** que un componente o página declara un color por su cuenta, **When** se ejecuta la verificación automática de estilos, **Then** termina con error indicando el archivo y la línea, y la historia no se cierra.
3. **Given** una pantalla nueva construida solo con componentes del sistema de diseño y sin colores propios, **When** se muestra en cada modo, **Then** adopta la paleta de ese modo sin declarar nada adicional.

---

### User Story 6 - Pantallas existentes sin regresión y cierre verificado (Priority: P1)

Como Usuario Final, quiero que Registro de Elemento de Backlog, Sprints y Equipo conserven contenido, rutas y comportamiento en ambos modos, para que el cambio visual no rompa mi trabajo; y como responsable de la entrega, quiero evidencia verificable del resultado.

**Why this priority**: Evita que la mejora visual degrade lo ya entregado y condiciona el cierre de la historia.

**Independent Test**: Mostrar cada pantalla existente en ambos modos y verificar contenido, rutas y legibilidad; ejecutar las verificaciones de cierre y revisar las 6 capturas.

**Acceptance Scenarios**:

1. **Given** las pantallas existentes, **When** se muestran en cada modo, **Then** conservan su contenido, rutas y comportamiento, y ningún texto, borde ni control queda ilegible o invisible.
2. **Given** que una pantalla existente trae un color o estilo propio que impide adoptar el tema, **When** se detecta en la verificación, **Then** ese estilo propio se elimina sin cambiar el contenido de la pantalla.
3. **Given** el tema terminado, **When** se ejecutan las verificaciones de cierre, **Then** terminan sin errores, las pruebas existentes siguen en verde y se adjuntan 6 capturas (una pantalla de cada módulo —Backlog, Sprints y Equipo— en modo claro y en modo oscuro, a 1920 px de ancho) que muestran barra superior, navegación lateral, contenido y pie.
4. **Given** las 6 capturas, **When** se comparan con la maqueta del mismo modo, **Then** los roles 1 a 8 de la tabla de tokens coinciden con la maqueta y el texto de enlace (rol 9) coincide con la tabla (modo claro `#007595`, desviación declarada respecto de la maqueta, que usa `#0092b8`; modo oscuro `#00b8db`).
5. **Given** que alguna verificación termina con error o falta una de las 6 capturas, **When** se intenta cerrar la historia, **Then** la historia permanece abierta hasta corregir la causa.

---

### Edge Cases

- Primera visita sin elección guardada: se sigue la preferencia del sistema operativo.
- Valor guardado inválido o almacenamiento no disponible: se usa el modo del sistema, sin error, y el conmutador funciona durante la sesión.
- Cambio de modo con un formulario a medio llenar: no se pierde lo escrito ni se cambia de ruta.
- Par texto/fondo bajo el umbral y fuera de las excepciones: la historia no se cierra.
- Color declarado fuera del archivo de tema: la verificación automática falla.
- Pantalla existente con estilo propio de color: se elimina en esta historia.
- Falta una captura o una verificación falla: la historia no se cierra.
- El usuario cambia la preferencia del sistema operativo mientras la aplicación está abierta y sin elección manual: la aplicación sigue esa preferencia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST aplicar la paleta del modo claro (tabla de tokens) a toda pantalla de la aplicación.
- **FR-002**: El sistema MUST aplicar la paleta del modo oscuro (tabla de tokens) a toda pantalla de la aplicación.
- **FR-003**: El sistema MUST aplicar radios de `0.75rem` a contenedores y `0.5rem` a controles y botones en ambos modos.
- **FR-004**: El sistema MUST resaltar la entrada activa de la navegación lateral con el fondo del token "elemento de navegación activo" de cada modo y esquinas de `0.5rem`.
- **FR-005**: El sistema MUST mostrar los botones de peligro con variante contorneada en rojo `#fb2c36` (texto y borde) sobre el fondo del contenedor en ambos modos.
- **FR-006**: El sistema MUST mostrar los textos de enlace con `#007595` en modo claro y `#00b8db` en modo oscuro.
- **FR-007**: El sistema MUST ofrecer un conmutador claro/oscuro en la barra superior del layout, alcanzable y operable por teclado y con etiqueta accesible.
- **FR-008**: El sistema MUST cambiar de modo de inmediato al activar el conmutador, sin recargar la página, sin cambiar de ruta y sin perder datos escritos en formularios.
- **FR-009**: El sistema MUST persistir la elección del usuario en el navegador y restaurarla al recargar o reabrir la aplicación.
- **FR-010**: El sistema MUST usar la preferencia de modo del sistema operativo cuando no hay elección guardada, y seguirla mientras el usuario no elija manualmente.
- **FR-011**: El sistema MUST tolerar una elección guardada inválida o un almacenamiento no disponible usando el modo del sistema, sin mostrar errores y con el conmutador funcional durante la sesión.
- **FR-012**: El sistema MUST cumplir contraste de texto normal ≥ 4.5:1 y de componentes ≥ 3:1 en ambos modos, salvo los pares de la tabla de excepciones, cuyo ratio medido MUST coincidir con el declarado.
- **FR-013**: Los colores literales MUST existir únicamente en el archivo de tema; el código no MUST contener clases de paleta, estilos de color en línea ni colores, bordes o sombras propios en estilos de componente.
- **FR-014**: Las páginas y formularios MUST NOT usar utilidades de color ni de radio; el color en componentes del layout MUST obtenerse solo de tokens semánticos del tema con variante para modo oscuro.
- **FR-015**: La verificación automática de estilos MUST fallar indicando archivo y línea ante cualquier color declarado fuera del archivo de tema, y MUST conservar las reglas existentes (sin `::ng-deep`, sin `!important`, declaración tipográfica única).
- **FR-016**: Una pantalla nueva construida solo con componentes del sistema de diseño MUST adoptar la paleta de cada modo sin declaraciones adicionales.
- **FR-017**: Las pantallas existentes MUST conservar contenido, rutas y comportamiento; solo se elimina estilo propio de color que impida adoptar el tema.
- **FR-018**: El sistema MUST NOT incorporar fuentes externas, logotipos ni nombres de marca de las maquetas, ni copiar código de la plantilla `./app/template-primeng/`.
- **FR-019**: La historia MUST NOT modificar el backend, sus APIs, contratos de datos ni reglas de negocio.
- **FR-020**: El cierre MUST requerir la verificación de estilos, la compilación y las pruebas existentes sin errores, más 6 capturas a 1920 px (`backlog`, `sprints`, `equipo` × `claro`, `oscuro`) con nombre `{modulo}-{modo}.png` en la carpeta de evidencias de la feature.

**Tabla de tokens** (roles 1 a 8 comparados con la maqueta; rol 9 contra esta tabla):

| Rol | Claro | Oscuro |
|---|---|---|
| Primario (botón primario, foco) | `#0092b8` | `#00b8db` |
| Fondo de página | `#f9fafb` | `#101828` |
| Tarjeta, navegación lateral, barra superior, pie | `#ffffff` | `#1e2939` |
| Borde y separador | `#e5e7eb` | `#364153` |
| Elemento de navegación activo | `#e5e7eb` | `#364153` |
| Texto principal | `#1e2939` | `#e5e7eb` |
| Texto secundario | `#6a7282` | `#99a1af` |
| Peligro | `#fb2c36` | `#fb2c36` |
| Texto de enlace | `#007595` | `#00b8db` |

**Tabla de excepciones de contraste** (pares exactos medidos en cada modo):

| ID | Modo | Par (primer plano sobre fondo) | Tipo | Ratio |
|---|---|---|---|---|
| E-01 | Claro | Etiqueta blanca sobre botón primario `#0092b8` | Texto | 3.62:1 |
| E-02 | Claro | Marcador de posición `#99a1af` sobre fondo de campo `#ffffff` | Texto | 2.60:1 |
| E-03 | Oscuro | Etiqueta blanca sobre botón primario `#00b8db` | Texto | 2.37:1 |
| E-04 | Claro | Texto de peligro `#fb2c36` sobre `#ffffff` | Texto | 3.81:1 |
| E-05 | Oscuro | Texto de peligro `#fb2c36` sobre `#1e2939` | Texto | 3.85:1 |
| E-06 | Claro | Texto secundario `#6a7282` sobre navegación activa `#e5e7eb` | Texto | 3.91:1 |
| E-07 | Oscuro | Texto secundario `#99a1af` sobre navegación activa `#364153` | Texto | 3.96:1 |
| E-08 | Claro | Borde decorativo `#e5e7eb` sobre `#ffffff` | Componente | 1.24:1 |
| E-09 | Oscuro | Borde decorativo `#364153` sobre `#1e2939` | Componente | 1.42:1 |

Los bordes de E-08 y E-09 son decorativos (separadores y contornos de contenedor); la excepción no aplica a bordes que sean el único indicador de un control o de su estado.

### Key Entities *(include if feature involves data)*

- **Modo de tema**: valor `claro` u `oscuro` activo en la sesión; deriva de la elección guardada o, en su defecto, de la preferencia del sistema operativo.
- **Elección del usuario**: preferencia manual persistida en el navegador; puede estar ausente, ser inválida o no poder guardarse.
- **Token de tema**: rol visual (primario, fondo, tarjeta, borde, texto…) con un valor por modo; fuente única de colores y radios.
- **Par de contraste**: combinación primer plano/fondo con ratio medido, sujeta al umbral o a una excepción de la tabla.
- **Captura de evidencia**: imagen de una pantalla de un módulo en un modo, a 1920 px.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los roles de la tabla de tokens coincide con el valor medido en pantalla en ambos modos en las tres pantallas existentes.
- **SC-002**: Un usuario cambia de modo en un solo paso (una activación del conmutador) y el cambio es perceptible de inmediato, sin recarga ni pérdida de datos en formularios (0 casos de datos perdidos).
- **SC-003**: El 100 % de los reingresos a la aplicación en el mismo navegador muestra el modo elegido previamente; con almacenamiento inválido o no disponible, 0 errores visibles.
- **SC-004**: El 100 % de los pares texto/fondo y de componentes cumple el umbral de contraste o coincide con el ratio declarado de su excepción (0 pares fuera de tabla bajo el umbral).
- **SC-005**: 0 colores literales, clases de paleta o estilos de color en línea fuera del archivo de tema, y la verificación automática falla el 100 % de las veces ante una violación inyectada.
- **SC-006**: Las 3 pantallas existentes conservan el 100 % de su contenido, rutas y comportamiento (0 regresiones en pruebas existentes) y ningún elemento queda ilegible en ninguno de los 2 modos.
- **SC-007**: Se entregan las 6 capturas requeridas y los 8 roles comparables coinciden con la maqueta del mismo modo, y el rol de enlace coincide con la tabla.

## Assumptions

- La refactorización del layout (HU-035) ya está fusionada: existen barra superior, navegación lateral y pie donde alojar el conmutador.
- La enmienda "Theme Visual (HU-036)" de la Constitución está vigente y fija los valores de color, radios y reglas técnicas; si difiere de esta especificación, prevalece la Constitución.
- Los radios `0.75rem` y `0.5rem` son medidas visuales aproximadas de las maquetas (`specs/evidences/claro.png` y `specs/evidences/oscuro.png`).
- Del contenido de las maquetas solo se toman paleta, radios y jerarquía de superficies; no se replican logotipos, tipografía, barra de vista previa ni elementos que ninguna historia pida (buscador, ayuda, notificaciones, "Share", selector de workspace, sección "Apps").
- La elección se guarda en el navegador del usuario (por dispositivo, no por cuenta); no hay sincronización entre dispositivos.
- El fondo de los campos de formulario en modo oscuro es el de las tarjetas (`#1e2939`), de modo que el marcador de posición `#99a1af` alcanza 5.63:1 sin necesitar excepción (punto abierto 8 del documento de origen; si el humano define otro fondo, se revisará).
- Las excepciones E-03 a E-09 son ampliaciones aprobadas por el humano (H-01 y H-04) y pendientes de ratificación en la Constitución (punto abierto 7).
- La variante contorneada del botón de peligro sigue la maqueta oscura ("Delete my account").
- Quedan fuera de alcance: título, migas de pan y pestañas secundarias; contenedores, grilla y patrón de formularios; formularios con etiqueta a la izquierda; sombras personalizadas y estados hover, foco y deshabilitado más allá de los derivados del color primario.
- No se modifican reglas de negocio, APIs, contratos de datos ni el backend.
