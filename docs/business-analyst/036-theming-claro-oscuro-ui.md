# Historia de Usuario: Theming de la Aplicación — Modo Claro y Oscuro (PrimeNG 22)

## 1. METADATOS Y CONTEXTO
- **ID de Historia:** 036-HU
- **Épica:** Deuda Técnica / UI Core
- **Tipo:** Enhancement (deuda técnica)
- **Requiere interfaz:** Sí
- **Consumo SDD:** `/speckit.specify documents/business-analyst/036-theming-claro-oscuro-ui.md`
- **Dependencia:** HU-035 (layout de aplicación) fusionada en la rama base. Enmienda "🎨 Theme Visual (HU-036)" vigente en `.specify/memory/constitution.md`.
- **Decisión de atomicidad:** una sola HU porque la paleta de ambos modos y el conmutador son inseparables: sin conmutador el modo oscuro no se puede ver ni verificar, y sin los tokens de ambos modos el conmutador no tiene efecto. El entregable único y verificable es "la aplicación se ve con la identidad de las maquetas en claro y en oscuro".
- **Decisión humana (H-05, auditoría QA del 06-10-2026):** el humano aprobó mantener una sola HU, incluida la gobernanza automática (CA-04, CA-04.1, RT-07). Justificación: sin las reglas de lint el tema no es verificable ni inmutable para las HUs futuras, porque nada impediría que una pantalla nueva declare colores propios; la gobernanza es el mecanismo que hace obligatorio el Theme para toda HU posterior. Registro de la decisión: bloque del tracker del 06-10-2026 (respuesta del humano a la pregunta 4, opción A).

### 1.1. Contexto
La aplicación se muestra con el tema neutral por defecto: no tiene identidad visual propia ni modo oscuro. Existen dos maquetas de referencia (`specs/evidences/claro.png` y `specs/evidences/oscuro.png`). De ellas se toman únicamente la paleta, los radios y la jerarquía de superficies. No se copian logotipos ni nombres de marca, la tipografía de la maqueta, la barra de vista previa ("Themes", "Get access", conmutador de dispositivo) ni los elementos que ninguna HU pida (buscador, ayuda, notificaciones, "Share", selector de workspace, sección "Apps").

Esta HU fija el Theme Visual, cuyos valores están en la Constitución (enmienda HU-036) y se repiten en la sección 7 con su verificación. Gobernará de forma obligatoria a todas las HUs futuras.

### 1.2. Narrativa ⚠️ [PROPUESTO]
**Como** Usuario Final de la aplicación
**Quiero** que toda la aplicación se vea con una identidad visual coherente y poder alternar entre modo claro y modo oscuro
**Para** trabajar con comodidad según mi entorno y que toda pantalla nueva se vea igual que las existentes sin trabajo adicional.

**Actores:** Usuario Final (beneficiario); Desarrollador Frontend (implementador, sujeto a la sección 7).

## 2. ALCANCE
**Incluido:** paleta y radios de ambos modos aplicados a la aplicación completa; conmutador claro/oscuro en la barra superior del layout; persistencia de la elección; verificación de contraste; reglas automáticas que impiden colores fuera del tema; verificación visual de las pantallas existentes (Registro de Elemento de Backlog, Sprints, Equipo) en ambos modos. Las pantallas existentes no cambian su contenido, rutas ni comportamiento.

**Excluido:** reconstrucción del layout (HU-035); título, migas de pan y pestañas de navegación secundaria; contenedores, grilla y patrón de formularios (HUs derivadas de la HU-035); distribución "etiqueta a la izquierda y campo a la derecha" de la maqueta (contradice el Patrón de Formularios de la Constitución); buscador, ayuda, notificaciones, "Share" y selector de workspace del topbar de la maqueta; sombras personalizadas; estados hover, foco y deshabilitado más allá de los que derivan del color primario del tema (❓ No documentado en las maquetas).

No se modifica ninguna regla de negocio, API ni contrato de datos.

## 3. ESPECIFICACIÓN FUNCIONAL Y CRITERIOS DE ACEPTACIÓN (BDD)

### 3.1. Modo claro
- **CA-01 — Paleta del modo claro [Happy Path]:**
  - **Dado** un usuario autenticado con el modo claro activo,
  - **Cuando** consulta cualquier pantalla,
  - **Entonces** el fondo de la página es `#f9fafb`; las tarjetas, la navegación lateral, la barra superior y el pie son `#ffffff`; los bordes y separadores son `#e5e7eb`; el texto principal es `#1e2939` y el secundario `#6a7282`; el botón primario tiene fondo `#0092b8` y etiqueta blanca (Pasa si cada valor coincide; Falla si alguno difiere).
- **CA-01.1 — Elemento de navegación activo [Happy Path] ⚠️ [PROPUESTO] (radio `0.5rem`, medida visual aproximada; ver RT-02):**
  - **Dado** el modo claro activo,
  - **Cuando** el usuario está en una pantalla de un módulo,
  - **Entonces** su entrada en la navegación lateral se resalta con fondo `#e5e7eb`, texto principal y esquinas redondeadas de `0.5rem`.
- **CA-01.2 — Acción de peligro [Happy Path] ⚠️ [PROPUESTO]:**
  - **Dado** una pantalla con un botón de peligro,
  - **Cuando** se muestra en modo claro,
  - **Entonces** usa el rojo `#fb2c36` como color de texto y de borde, sobre fondo del contenedor.

### 3.2. Modo oscuro
- **CA-02 — Paleta del modo oscuro [Happy Path]:**
  - **Dado** un usuario autenticado con el modo oscuro activo,
  - **Cuando** consulta cualquier pantalla,
  - **Entonces** el fondo de la página es `#101828`; las tarjetas, la navegación lateral, la barra superior y el pie son `#1e2939`; los bordes y separadores son `#364153`; el texto principal es `#e5e7eb` y el secundario `#99a1af`; el color de acento es `#00b8db`; el botón primario tiene fondo `#00b8db` y etiqueta blanca (decisión humana H-04; la maqueta oscura no define la etiqueta); la entrada activa de la navegación tiene fondo `#364153` (Pasa si cada valor coincide; Falla si alguno difiere).
- **CA-02.1 — Conmutador de modo [Happy Path]:**
  - **Dado** un usuario en cualquier pantalla,
  - **Cuando** activa el conmutador claro/oscuro de la barra superior,
  - **Entonces** toda la pantalla cambia de modo de inmediato, sin recargar la página, sin perder lo escrito en los formularios y sin cambiar de ruta,
  - **Y** al activarlo de nuevo vuelve al modo anterior.
- **CA-02.2 — Persistencia de la elección [Happy Path] ⚠️ [PROPUESTO]:**
  - **Dado** un usuario que eligió un modo,
  - **Cuando** recarga la página o vuelve a abrir la aplicación en el mismo navegador,
  - **Entonces** se muestra el modo elegido.
- **CA-02.3 — Primera visita [Edge Case] ⚠️ [PROPUESTO]:**
  - **Dado** un usuario sin elección guardada,
  - **Cuando** abre la aplicación,
  - **Entonces** se muestra el modo que coincide con la preferencia de su sistema operativo, y mientras no elija manualmente sigue esa preferencia.
- **CA-02.4 — Elección no recuperable [Sad Path] ⚠️ [PROPUESTO]:**
  - **Dado** que la elección guardada es inválida o el navegador no permite guardar datos,
  - **Cuando** el usuario abre la aplicación o usa el conmutador,
  - **Entonces** la aplicación muestra el modo de su sistema operativo, no muestra ningún error, y el conmutador sigue funcionando durante la sesión.

### 3.3. Contraste y legibilidad
- **CA-03 — Contraste suficiente [Happy Path]:**
  - **Dado** los pares texto/fondo del layout y de los componentes en ambos modos,
  - **Cuando** se mide su contraste,
  - **Entonces** el texto normal alcanza al menos 4.5:1 y los componentes de interfaz al menos 3:1, salvo los pares enumerados en la tabla de excepciones de la sección 7 (E-01 a E-09), que se miden con el ratio indicado en cada modo: la etiqueta blanca sobre el botón primario de cada modo (3.62:1 claro y 2.37:1 oscuro), el texto de marcador de posición `#99a1af` en modo claro (2.60:1; el par de modo oscuro está ❓ No documentado, ver sección 7), el texto de peligro (3.81:1 claro y 3.85:1 oscuro), el texto secundario sobre la navegación activa (3.91:1 claro y 3.96:1 oscuro) y los bordes decorativos (1.24:1 claro y 1.42:1 oscuro). Los pares E-03 a E-09 son ampliaciones ⚠️ [PROPUESTO] aprobadas por el humano (H-01 y H-04) y pendientes de ratificación en la Constitución.
- **CA-03.1 — Par por debajo del umbral [Sad Path]:**
  - **Dado** que algún par texto/fondo o componente que no figura en la tabla de excepciones de la sección 7 queda por debajo del umbral,
  - **Cuando** se intenta cerrar la HU,
  - **Entonces** la HU no se cierra hasta corregir el par.

### 3.4. Gobernanza del tema
- **CA-04 — Fuente única de colores [Happy Path]:**
  - **Dado** el código fuente del frontend tras la HU,
  - **Cuando** se buscan colores literales, clases de paleta de Tailwind o estilos de color en línea,
  - **Entonces** los colores literales existen solo en el archivo de tema y no hay ninguno de los otros.
- **CA-04.1 — Color fuera del archivo de tema [Sad Path]:**
  - **Dado** que un componente o página declara un color por su cuenta,
  - **Cuando** se ejecuta la verificación automática de estilos,
  - **Entonces** termina con error indicando el archivo y la línea, y la HU no se cierra.
- **CA-04.2 — Pantalla futura [Happy Path]:**
  - **Dado** una pantalla nueva construida solo con componentes del sistema de diseño y sin colores propios,
  - **Cuando** se muestra en cada modo,
  - **Entonces** adopta la paleta de ese modo sin declarar nada adicional.

### 3.5. Pantallas existentes
- **CA-05 — Sin regresión visual ni funcional [Happy Path]:**
  - **Dado** las pantallas existentes (Registro de Elemento de Backlog, Sprints, Equipo),
  - **Cuando** se muestran en cada modo,
  - **Entonces** conservan su contenido, rutas y comportamiento, y ningún texto, borde ni control queda ilegible o invisible.
- **CA-05.1 — Pantalla con estilo propio previo [Sad Path]:**
  - **Dado** que una pantalla existente trae un color o estilo propio que impide adoptar el tema,
  - **Cuando** se detecta en la verificación,
  - **Entonces** ese estilo propio se elimina en esta HU sin cambiar el contenido de la pantalla.

### 3.6. Verificación de cierre
- **CA-06 — Cierre verificado [Happy Path]:**
  - **Dado** el tema terminado,
  - **Cuando** se ejecutan las verificaciones de la sección 7,
  - **Entonces** terminan sin errores, los tests existentes siguen en verde y se adjuntan 6 capturas (una pantalla de cada módulo —Backlog, Sprints y Equipo— en modo claro y en modo oscuro, a 1920 px de ancho) que muestran barra superior, navegación lateral, contenido y pie,
  - **Y** cada captura se compara con la maqueta del mismo modo en los roles 1 a 8 de la tabla de la sección 7, y el rol 9 (texto de enlace) se compara contra el valor de la tabla de tokens (en modo claro `#007595`, desviación declarada respecto de la maqueta, que usa `#0092b8`; en modo oscuro `#00b8db`) (Pasa si los 8 roles coinciden con la maqueta y el rol 9 con la tabla; Falla si alguno difiere).
- **CA-06.1 — Verificación fallida [Sad Path]:**
  - **Dado** que alguna verificación termina con error, o falta una de las 6 capturas,
  - **Cuando** se intenta cerrar la HU,
  - **Entonces** la HU permanece abierta hasta corregir la causa.

## 4. MATRIZ DE CASOS BORDE Y EXCEPCIONES ⚠️ [PROPUESTO]

| ID | Condición Límite / Error | Comportamiento Esperado | Escenario |
|---|---|---|---|
| CB-01 | Primera visita sin elección guardada | Sigue la preferencia del sistema | CA-02.3 |
| CB-02 | Valor guardado inválido o almacenamiento no disponible | Modo del sistema; sin error; conmutador funcional en la sesión | CA-02.4 |
| CB-03 | Cambio de modo con un formulario a medio llenar | No se pierde lo escrito ni se cambia de ruta | CA-02.1 |
| CB-04 | Par texto/fondo bajo el umbral fuera de las excepciones | La HU no se cierra | CA-03.1 |
| CB-05 | Color declarado fuera del archivo de tema | La verificación automática falla | CA-04.1 |
| CB-06 | Pantalla existente con estilo propio de color | Se elimina en esta HU | CA-05.1 |
| CB-07 | Falta una captura o una verificación falla | La HU no se cierra | CA-06.1 |

## 5. PRECONDICIONES Y POSTCONDICIONES
- **Precondiciones:** HU-035 fusionada (el layout existe y contiene la barra superior donde vive el conmutador); enmienda "Theme Visual (HU-036)" vigente en la Constitución; usuario autenticado para las rutas del layout.
- **Postcondiciones:** toda la aplicación se ve con la paleta y los radios de las maquetas en ambos modos; la elección del usuario persiste; solo el archivo de tema declara colores; las pantallas existentes conservan contenido, rutas y comportamiento; ninguna regla de negocio, API ni contrato de datos cambió.

## 6. DEFINITION OF DONE (FUNCIONAL)
- [ ] Todos los escenarios de la sección 3 están en sintaxis Dado/Cuando/Entonces y cada uno es verificable como Pasa/Falla.
- [ ] Existe al menos un escenario negativo o de borde por bloque funcional (modo claro y oscuro, contraste, gobernanza, pantallas existentes, cierre).
- [ ] La funcionalidad respeta las reglas de negocio y restricciones del ecosistema preexistente documentado (Constitución: Skeleton vs. Theme con la enmienda HU-036, Shell de Aplicación HU-035, Form Pattern, Vertical Slicing); sin regresión en pantallas, rutas ni tests existentes.
- [ ] Las restricciones de la sección 7 se cumplen y sus verificaciones están en verde.
- [ ] Ausencia de supuestos no tipificados (toda inferencia está marcada como ⚠️ [PROPUESTO] y los vacíos como ❓ No documentado).

## 7. RESTRICCIONES TÉCNICAS TRAZABLES (Constitución — enmienda Theme Visual HU-036)
Los valores son los de la Constitución; si difieren, prevalece la Constitución. Cada restricción tiene criterio de verificación.

**Tabla de tokens (roles 1 a 8 comparados con la maqueta y rol 9 contra esta tabla, CA-06):**

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
| Texto de enlace sobre superficie clara ⚠️ [PROPUESTO] | `#007595` | `#00b8db` |

**Tabla de excepciones de contraste (pares exactos medidos en cada modo; fuente única de CA-03 y RT-08):**

| ID | Modo | Par (primer plano sobre fondo) | Tipo | Ratio | Origen |
|---|---|---|---|---|---|
| E-01 | Claro | Etiqueta blanca `#ffffff` sobre botón primario `#0092b8` | Texto | 3.62:1 | Constitución (paridad con la maqueta) |
| E-02 | Claro | Marcador de posición `#99a1af` sobre el fondo del campo `#ffffff` ⚠️ [PROPUESTO] (el 2.60:1 corresponde a fondo blanco; la fuente no nombra el fondo) | Texto | 2.60:1 | Constitución (paridad con la maqueta) |
| E-03 | Oscuro | Etiqueta blanca `#ffffff` sobre botón primario `#00b8db` | Texto | 2.37:1 | ⚠️ [PROPUESTO] decisión humana H-04 |
| E-04 | Claro | Texto de peligro `#fb2c36` sobre `#ffffff` | Texto | 3.81:1 | ⚠️ [PROPUESTO] decisión humana H-01 |
| E-05 | Oscuro | Texto de peligro `#fb2c36` sobre `#1e2939` | Texto | 3.85:1 | ⚠️ [PROPUESTO] decisión humana H-01 |
| E-06 | Claro | Texto secundario `#6a7282` sobre navegación activa `#e5e7eb` | Texto | 3.91:1 | ⚠️ [PROPUESTO] decisión humana H-01 |
| E-07 | Oscuro | Texto secundario `#99a1af` sobre navegación activa `#364153` | Texto | 3.96:1 | ⚠️ [PROPUESTO] decisión humana H-01 |
| E-08 | Claro | Borde decorativo `#e5e7eb` sobre `#ffffff` | Componente | 1.24:1 | ⚠️ [PROPUESTO] decisión humana H-01 |
| E-09 | Oscuro | Borde decorativo `#364153` sobre `#1e2939` | Componente | 1.42:1 | ⚠️ [PROPUESTO] decisión humana H-01 |

**Marcador de posición en modo oscuro:** el par `#99a1af` sobre el fondo del campo en modo oscuro no tiene excepción asignada y su fondo es ❓ No documentado (ni la Constitución ni la maqueta lo definen). Mientras no se defina, el par no está cubierto por la tabla y rige la regla general (≥ 4.5:1). Decisión humana pendiente (punto abierto 8).

Cualquier par texto/fondo o componente que no figure en esta tabla debe cumplir 4.5:1 (texto normal) o 3:1 (componente). Los bordes de E-08 y E-09 son decorativos (separadores y contornos de contenedor); no se aplica a los bordes que son el único indicador de un control o de su estado.

| ID | Restricción | Fuente | Verificación |
|---|---|---|---|
| RT-01 | Fuente única de tokens: `app/frontend/src/app/core/theme/app-theme.ts` exporta el preset `definePreset(Aura, …)` consumido por `providePrimeNG` en `app.config.ts`. Escala `surface` = `gray` en ambos modos; `primary` = `cyan`. | Constitución, Theme Visual | Una prueba unitaria (`app-theme.spec.ts`) comprueba cada valor de la tabla de tokens contra el preset |
| RT-02 | Radios en `border.radius` del preset: contenedores `0.75rem`, controles y botones `0.5rem` ⚠️ [PROPUESTO]. | Constitución, Theme Visual | La misma prueba unitaria; comparación visual con la maqueta (CA-06) |
| RT-03 | Modo oscuro: `darkModeSelector: '.app-dark'` en `providePrimeNG`, clase sobre `<html>`; Tailwind v4 `@custom-variant dark (&:where(.app-dark, .app-dark *));` en `src/styles.css`. | Constitución, Theme Visual | Prueba del servicio de tema: alternar conmuta la clase `app-dark` sobre `<html>` (CA-02.1) |
| RT-04 | Servicio de tema standalone con Signals (zoneless). Valor inicial: `prefers-color-scheme`; elección en `localStorage` clave `app-theme-mode` (`light` o `dark`); lectura y escritura dentro de `try/catch`; valor inválido o sin almacenamiento → modo del sistema ⚠️ [PROPUESTO]. | Constitución, Theme Visual | Pruebas del servicio de tema para CA-02.2, CA-02.3 y CA-02.4 |
| RT-05 | Conmutador en la barra superior de `LayoutComponent` (`p-button` o `p-toggleswitch`), accesible por teclado y con etiqueta accesible. | CA-02.1, WCAG | Prueba del componente; revisión de plantilla |
| RT-06 | Color en componentes solo con tokens semánticos de `tailwindcss-primeui` (`bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`) con `dark:`, y SOLO en `LayoutComponent` y subcomponentes. Páginas y formularios sin utilidades de color ni de radio. | Constitución, Theme Visual | `npm run lint:primeng` (RT-07) |
| RT-07 | `scripts/lint-primeng.mjs` incorpora reglas que fallan ante: literales `#hex`, `rgb()`, `hsl()`, `oklch()` fuera de `app-theme.ts`; clases de paleta de Tailwind (`bg-cyan-600`, `text-gray-500`, etc.); estilos de color en línea; `.scss` de componente con color, borde o sombra. Se mantienen `::ng-deep`, `!important` y la declaración tipográfica única. | Constitución, Theme Visual | `npm run lint:primeng` sin violaciones; caso de prueba con una violación inyectada falla (CA-04.1) |
| RT-08 | Contraste: texto normal ≥ 4.5:1, componentes ≥ 3:1 (WCAG 2.1 AA) en ambos modos, salvo las excepciones E-01 a E-09 de la tabla de excepciones de esta sección. | Constitución, Theme Visual; E-03 a E-09 ⚠️ [PROPUESTO] (decisión humana H-01 y H-04) | Prueba que calcula el contraste de los pares de las tablas de tokens y de excepciones: cada par fuera de la tabla de excepciones cumple el umbral y cada par de la tabla coincide con su ratio declarado |
| RT-09 | Sin fuentes externas, logotipos ni nombres de marca de la maqueta; sin copiar de `./app/template-primeng/`. | Constitución, Theme Visual | Búsqueda sin coincidencias de `preline` y de importaciones de fuentes externas en `app/frontend/src` |
| RT-10 | Verificación de cierre: `npm run lint:primeng`, `npm run build` y `npm test` en `app/frontend`; 6 capturas en `specs/036-theming-claro-oscuro-ui/evidence/` con nombre `{modulo}-{modo}.png` (`backlog`, `sprints`, `equipo` × `claro`, `oscuro`) a 1920 px. | CA-06 | Salida de los tres comandos sin errores; existencia de las 6 capturas |
| RT-11 | Sin cambios en `app/backend`, rutas ni contenido de las pantallas existentes (solo se elimina estilo propio de color, CA-05.1). | Alcance | `git diff` de `app/backend` vacío; tests existentes en verde |

## 8. FUERA DE ALCANCE (HUs FUTURAS, SIN FILA EN EL LEDGER)
Los números y filas los asigna el product-manager; el BA no registra filas nuevas.

| Tema excluido | Motivo | Dónde se atiende |
|---|---|---|
| Pestañas de navegación secundaria (en la maqueta, la pestaña activa es una caja blanca con borde) | Es estructura de página, no tema | HU derivada "Estructura de página" de la HU-035; deberá usar los tokens de esta HU |
| Formularios con etiqueta a la izquierda y campo a la derecha | Contradice el Patrón de Formularios de la Constitución (etiqueta superior) | Requiere una enmienda previa del Patrón de Formularios; ❓ decisión humana |
| Buscador, ayuda, notificaciones, "Share", selector de workspace, sección "Apps" | Ninguna HU los pide | HU futura si el negocio los requiere |
| Sombras personalizadas, estados hover y deshabilitado propios | Las maquetas no los definen con valores medibles | ❓ No documentado |

## 9. ❓ PUNTOS ABIERTOS (confirmar con el humano)
1. **Color de enlace en modo claro (`#007595`):** la maqueta usa `#0092b8` (3.62:1 sobre blanco, no alcanza AA para texto normal); se propone un cyan más oscuro.
2. **Excepciones de contraste:** E-01 y E-02 (etiqueta del botón primario claro 3.62:1 y marcador de posición en modo claro 2.60:1) son de la Constitución, por paridad con la maqueta. E-03 a E-09 (etiqueta del botón primario oscuro, texto de peligro, texto secundario sobre navegación activa y bordes decorativos) las aprobó el humano en la auditoría del 06-10-2026 (H-01 y H-04, opción A) y requieren ratificación en la Constitución.
7. **Discrepancia con la Constitución:** la sección "Contraste" de la enmienda Theme Visual lista solo dos excepciones (E-01 y E-02); la HU enumera nueve. Como prevalece la Constitución (sección 7), debe ampliarse la lista de la Constitución o confirmarse que la HU rige. Los bordes decorativos y el texto de peligro tampoco figuran como tales en la Constitución. Decisión humana pendiente; el BA no edita la Constitución.
8. **Fondo del campo y marcador de posición en modo oscuro (H-06):** el fondo del campo en modo oscuro es ❓ No documentado. Con `#99a1af` como marcador, el contraste calculado es 5.63:1 sobre `#1e2939` (cumple, sin excepción) y 3.96:1 sobre `#364153` (requeriría una excepción). Pendiente que el humano indique el fondo del campo oscuro.
3. **Radios (`0.75rem` y `0.5rem`):** medida visual aproximada de las maquetas.
4. **Persistencia y primera visita:** clave `app-theme-mode` y preferencia del sistema como valor inicial.
5. **Variante del botón de peligro:** contorneada en rojo, según "Delete my account" de la maqueta oscura.
6. **Numeración:** esta HU toma el 036; las HUs derivadas de la 035 se registran después con números posteriores.

---
> **Origen:** `app/theme.md` (directiva de negocio para @BA), `specs/evidences/claro.png` y `specs/evidences/oscuro.png` (valores medidos de los píxeles), `.specify/memory/constitution.md` (enmienda Theme Visual, modo Brownfield) y `documents/business-analyst/035-refactorizacion-esqueleto-ui.md` (layout existente). Todo contenido generado que no esté explícito en la fuente se marca como `⚠️ [PROPUESTO]`.

## 10. ORDEN DE DELEGACIÓN PARA EL QA
*(Una sola línea de texto continuo)*

@QA: La Historia de Usuario de deuda técnica Theming de la Aplicación en modo claro y oscuro está lista en el archivo 036-theming-claro-oscuro-ui.md. Por favor, procede con la auditoría documental contra la directiva app/theme.md y la enmienda Theme Visual de la Constitución para asegurar que la historia cumple con los requerimientos originales.
