# Historia de Usuario: Refactorización de Esqueleto UI — Layout de Aplicación y Tipografía Global (PrimeNG 22)

## 1. METADATOS Y CONTEXTO
- **ID de Historia:** 035-HU
- **Épica:** Deuda Técnica / UI Core
- **Tipo:** Refactor (deuda técnica)
- **Requiere interfaz:** Sí
- **Consumo SDD:** `/speckit.specify documents/business-analyst/035-HU_refactorizacion_esqueleto_ui.md`
- **Decisión de atomicidad (H-04):** Partición aprobada por el humano (opción 1, tracker 05-10-2026). Esta HU cubre únicamente **layout de aplicación + tipografía global**. El resto del alcance original se entrega en HUs separadas (sección 8).

### 1.1. Contexto
El frontend (`app/frontend`) renderiza cada pantalla de forma aislada: `AppComponent` es únicamente un `<router-outlet />`, por lo que no hay topbar, sidebar, breadcrumbs ni footer, y la tipografía global no está definida (el navegador aplica una fuente serif por defecto). Esto viola la directiva de distribución estructural (Skeleton) de la Constitución.

Existe una plantilla antigua en `./app/template-primeng/` que NO es compatible con el proyecto (usa `NgModule`, `[(ngModel)]`, la grilla `ed-grid`, módulos de PrimeNG anteriores a la v18 como `primeng/dropdown` o `primeng/calendar`, y estilos corporativos con `!important`). Solo es válida como referencia visual de la **distribución** de las zonas del layout (header, navegación lateral, contenedor, footer, breadcrumb).

Nota: el proyecto ya migró de PrimeFlex a Tailwind CSS v4; esta HU parte de ese estado y no debe reintroducir PrimeFlex. La pila técnica se define en la sección 7.

### 1.2. Narrativa ⚠️ [PROPUESTO]
**Como** Usuario Final de la aplicación
**Quiero** que todas las pantallas se muestren dentro de un esqueleto común (barra superior, navegación lateral, área de contenido y pie de página) con una tipografía uniforme
**Para** orientarme y moverme entre Backlog, Sprints y Equipo sin que cada pantalla se vea y se comporte distinto.

**Actores:** Usuario Final (beneficiario); Desarrollador Frontend (implementador, sujeto a las restricciones de la sección 7).

## 2. ALCANCE
**Incluido:** el layout de aplicación que envuelve las pantallas existentes (Registro de Elemento de Backlog, Sprints —listado, formulario, detalle y elementos asignados—, Equipo —página y diálogo de registro de miembro— y el diálogo de asignación de elemento a Sprint) y la tipografía global. Las pantallas existentes no cambian su contenido interno en esta HU.

**Excluido (HUs derivadas, sección 8):** título y migas de pan por pantalla, contenedores y jerarquía de formularios, grilla responsiva, patrón de formularios, acciones de formulario y la verificación visual por cada pantalla (captura de las 8 pantallas a 1920 px y 768 px), asignada a su propia HU derivada (sección 8). En esta HU la verificación se reduce a una captura de una pantalla por módulo (CA-10), decisión registrada en el punto abierto 6.

No se modifica ninguna regla de negocio, API ni contrato de datos. Toda pantalla futura debe nacer dentro del mismo esqueleto.

## 3. ESPECIFICACIÓN FUNCIONAL Y CRITERIOS DE ACEPTACIÓN (BDD)

### 3.1. Layout de aplicación
- **CA-01 — Layout de aplicación [Happy Path]:**
  - **Dado** un usuario autenticado en cualquiera de las rutas existentes,
  - **Cuando** la pantalla se carga,
  - **Entonces** se muestran siempre: una barra superior con el perfil y las acciones del usuario a la derecha, una navegación lateral izquierda colapsable con acceso a Backlog, Sprints y Equipo, un pie de página inferior y el contenido de la pantalla en el área central,
  - **Y** todas las URL existentes siguen resolviendo a la misma pantalla que antes.
- **CA-01.1 — Ruta no definida [Sad Path] ⚠️ [PROPUESTO]:**
  - **Dado** un usuario autenticado,
  - **Cuando** navega a una ruta que no existe,
  - **Entonces** la barra superior, la navegación lateral y el pie de página permanecen visibles y el área central no muestra contenido de otra pantalla (comportamiento específico de la página de error: ❓ No documentado).
- **CA-01.2 — Navegación lateral colapsada o ancho reducido [Edge Case] ⚠️ [PROPUESTO]:**
  - **Dado** un usuario con la ventana a 768 px de ancho o con la navegación lateral colapsada,
  - **Cuando** consulta cualquier pantalla,
  - **Entonces** el contenido ocupa el ancho disponible sin desbordar horizontalmente la ventana y los tres módulos siguen accesibles mediante un control visible para expandir la navegación.
- **CA-01.3 — Área de contenido con medidas definidas (H-11) [Happy Path] ⚠️ [PROPUESTO]:**
  - **Dado** una pantalla mostrada en una ventana de 1920 px de ancho,
  - **Cuando** se mide el área de contenido central,
  - **Entonces** su ancho máximo es 1280 px y está centrada horizontalmente, y su espaciado interior es 1.5 rem en los cuatro lados,
  - **Y** el espaciado interior es el mismo valor en todas las pantallas del alcance (Pasa si la medición coincide en todas; Falla si alguna difiere).

### 3.2. Tipografía global
- **CA-06 — Tipografía base única [Happy Path]:**
  - **Dado** cualquier pantalla del alcance,
  - **Cuando** se muestra,
  - **Entonces** todo el texto usa la misma familia sans-serif del sistema, sin descargar fuentes externas ni definir una marca, y el cuerpo de la página no tiene márgenes por defecto.
- **CA-06.1 — Verificación del límite de la excepción [Sad Path] ⚠️ [PROPUESTO]:**
  - **Dado** el código fuente de `app/frontend` tras la refactorización,
  - **Cuando** se busca cualquier declaración de familia tipográfica o de margen del cuerpo de la página,
  - **Entonces** existe exactamente una, en el archivo de estilos globales; si hay más de una, la HU no se cierra.

### 3.3. Verificación de cierre
- **CA-10 — Cierre verificado [Happy Path]:**
  - **Dado** el layout y la tipografía terminados,
  - **Cuando** se ejecutan las verificaciones de calidad definidas en la sección 7,
  - **Entonces** terminan sin errores, los tests de componentes existentes siguen en verde y se adjunta una captura de una pantalla de cada módulo (Backlog, Sprints, Equipo) mostrando barra superior, navegación lateral, contenido y pie de página, a 1920 px y a 768 px de ancho.
- **CA-10.1 — Verificación fallida [Sad Path] ⚠️ [PROPUESTO]:**
  - **Dado** que alguna verificación termina con error, o falta una captura de algún módulo o de alguno de los dos anchos,
  - **Cuando** se intenta cerrar la HU,
  - **Entonces** la HU permanece abierta y no pasa a ACTIVE hasta corregir la causa.

## 4. MATRIZ DE CASOS BORDE Y EXCEPCIONES ⚠️ [PROPUESTO]

| ID | Condición Límite / Error | Comportamiento Esperado | Escenario |
|---|---|---|---|
| CB-01 | Ruta inexistente | Layout visible; sin contenido de otra pantalla | CA-01.1 |
| CB-02 | Ancho 768 px / navegación colapsada | Sin desborde horizontal; módulos accesibles | CA-01.2 |
| CB-03 | Pantalla con espaciado distinto al definido | Falla CA-01.3 | CA-01.3 |
| CB-04 | Más de una declaración tipográfica global | HU no se cierra | CA-06.1 |
| CB-05 | Verificación o captura faltante | HU no se cierra | CA-10.1 |

## 5. PRECONDICIONES Y POSTCONDICIONES
- **Precondiciones:** Tailwind CSS v4 y el tema neutral ya configurados en el proyecto (nota de contexto); usuario autenticado para las rutas del layout.
- **Postcondiciones:** todas las pantallas existentes viven dentro del layout; la tipografía global es única; ninguna regla de negocio, API ni contrato de datos cambió; las URL existentes no cambiaron.

## 6. DEFINITION OF DONE (FUNCIONAL)
- [ ] Todos los escenarios de la sección 3 están en sintaxis Dado/Cuando/Entonces y cada uno es verificable como Pasa/Falla.
- [ ] Existe al menos un escenario negativo o de borde por bloque funcional (layout, tipografía, verificación).
- [ ] La funcionalidad respeta las reglas de negocio y restricciones del ecosistema preexistente documentado (Constitución: Form Pattern, Skeleton vs. Theme, Vertical Slicing); sin regresión en pantallas, rutas ni tests existentes.
- [ ] Las restricciones de la sección 7 se cumplen y sus verificaciones están en verde.
- [ ] Ausencia de supuestos no tipificados (toda inferencia está marcada como ⚠️ [PROPUESTO] y los vacíos como ❓ No documentado).

## 7. RESTRICCIONES TÉCNICAS TRAZABLES (Constitución y `app/skeleton.md`)
Cada restricción tiene criterio de verificación. Las restricciones de formularios y grilla viajan a las HUs derivadas (sección 8).

| ID | Restricción | Fuente | Verificación |
|---|---|---|---|
| RT-01 | Layout como componente standalone que envuelve las rutas autenticadas con `<router-outlet />`; barra superior `p-menubar`; navegación lateral colapsable con `p-drawer` (alternativa "equivalente de PrimeNG 22": ❓ No documentado, se decide en Arquitectura); pie de página. | skeleton CA-01 | Revisión de plantillas; capturas CA-10 |
| RT-02 | Medidas del área de contenido (CA-01.3): ancho máximo 1280 px con `max-w-7xl mx-auto` y espaciado interior 1.5 rem con `p-6` (escala de la Constitución: 1 = 0.25rem) ⚠️ [PROPUESTO]. | Constitución (escala de espaciado); valores propuestos por el BA | Inspección de las clases en la plantilla del layout; medición a 1920 px |
| RT-05 | Tipografía base y reseteo de margen del `body` declarados una única vez en `src/styles.css` (que ya importa Tailwind CSS, `tailwindcss-primeui` y PrimeIcons). Es la única excepción a RT-06. | skeleton CA-06 | Búsqueda de `font-family` y `margin` de `body` en `app/frontend/src`: exactamente una declaración (CA-06.1) |
| RT-06 | Sin CSS custom para colores, bordes, sombras o tipografías por componente; sin `::ng-deep`; sin estilos de maquetación en `.scss` de componentes; maquetación con utilidades Tailwind en el `.html`; look and feel 100% del tema neutral Aura. | skeleton CA-07 | Búsqueda sin coincidencias de `::ng-deep` y `!important` en `app/frontend/src`; `.scss` de componentes sin reglas de maquetación |
| RT-07 | Se puede leer `./app/template-primeng/src/app/layout/` solo para entender la distribución de zonas. Prohibido copiar sus módulos, selectores, grilla `ed-grid`, `[(ngModel)]`, importaciones de PrimeNG anteriores a la v18 o archivos de estilos. | skeleton CA-08 | Búsqueda sin coincidencias de `ed-grid`, `[(ngModel)]`, `primeng/dropdown`, `primeng/calendar` en `app/frontend/src`; el diff no incluye archivos de la plantilla |
| RT-09 | Verificación de cierre: `npm run lint:primeng`, `npm run build` y `npm test` en `app/frontend`. | skeleton CA-10 | Salida de los tres comandos sin errores |

## 8. HUs DERIVADAS (PARTICIÓN APROBADA — H-04)
Aprobada por el humano. Los números y filas del Ledger los asigna el product-manager cuando esta HU pase QA; el BA no registra filas nuevas. Todas dependen de 035 (el layout debe existir). Los criterios originales de `app/skeleton.md` que salen de esta HU se conservan aquí con H-10 y H-11 ya resueltos.

| HU derivada (nombre sugerido) | Criterios originales que absorbe | Valores y reglas ya definidos |
|---|---|---|
| Estructura de página (título y migas de pan) | CA-02, CA-02.1 | Una entrada de miga por nivel de jerarquía; la última coincide con el título; sin jerarquía → inicio + pantalla actual. Botones de acción principales en la zona superior derecha del contenedor de datos. Contenedor con las medidas de CA-01.3 (1280 px máximo, 1.5 rem). |
| Contenedores y jerarquía de formularios | CA-03 | Contenedor con título visible (`p-card` o `p-panel`); grupos separados con `p-fieldset` o `p-divider`. **H-11:** el espaciado interior de los contenedores es el valor por defecto del tema, sin clases de espaciado que lo sobrescriban; Pasa si ningún formulario del alcance lo sobrescribe. Texto de ayuda ≥ 12 px ⚠️ [PROPUESTO]. |
| Grilla responsiva y tablas | CA-04, CA-04.1, CA-04.2 | **H-10 resuelto:** una sola regla para criterio y restricción — menos de 768 px: 1 columna (`col-span-12`); 768–1023 px: 2 por fila (`md:col-span-6`); desde 1024 px: 3 por fila (`lg:col-span-4`); desde 1280 px: 4 por fila solo para campos cortos —fecha, número, selección— (`xl:col-span-3`); campos largos (texto multilínea) ocupan fila completa (`col-span-12`). Grilla base `grid grid-cols-12 gap-4`. Filtros sobre la tabla, paginación inferior, acciones (iconos) a la derecha; tabla vacía muestra mensaje de lista vacía. |
| Verificación visual por pantalla (cierre del esqueleto) — **H-12** | CA-10 original de `app/skeleton.md` en su parte de capturas | Una captura por **cada** pantalla del alcance original (Registro de Elemento de Backlog; Sprints: listado, formulario, detalle y elementos asignados; Equipo: página y diálogo de registro de miembro; diálogo de asignación de elemento a Sprint), mostrando el layout completo (barra superior, navegación lateral, migas de pan, contenido y pie de página), a 1920 px y a 768 px de ancho. Pasa si existen las 8 capturas × 2 anchos (16); Falla si falta alguna. Depende de las demás HUs derivadas, porque las migas de pan y el contenido final de cada pantalla se entregan en ellas. Las ejecuciones de `npm run lint:primeng`, `npm run build` y `npm test` de esa HU cubren el conjunto completo de pantallas. |
| Patrón de formularios y acciones | CA-05, CA-05.1, CA-09, CA-09.1 | Patrón Obligatorio de Formularios PrimeNG 22: `<p-fluid>`, `<p-message severity="error" variant="simple" size="small">`, `[invalid]` en `pInputText` y `pTextarea`, `<label>` superior; `p-select`, `p-datepicker`, `pInputText`, `pTextarea`, `p-inputnumber`; prohibidos `p-error`, `class="p-fluid"`, `p-field`, `p-formgrid`, `p-dropdown`, `p-calendar`. Acciones Guardar/Cancelar con `flex gap-2`, abajo a la derecha, primario/secundario. |

## 9. ❓ PUNTOS ABIERTOS
1. **Valores propuestos (H-11):** ancho máximo 1280 px y espaciado 1.5 rem son propuesta del BA, no vienen de la directiva ni de la Constitución; confirmar con el humano.
2. **Comportamiento ante ruta inexistente (CA-01.1):** no documentado en la directiva ni en el Ledger.
3. **Componente de navegación lateral equivalente (RT-01):** Arquitectura debe fijar uno.
4. **Breakpoints y criterio de "campo corto" (HU derivada de grilla):** propuesta del BA (1024 y 1280 px); confirmar con el humano antes de especificar esa HU.
5. **Registro en el Ledger de las HUs derivadas:** pendiente del product-manager tras la aprobación de QA (cinco HUs derivadas, incluida la de verificación visual). Al registrarlas, actualizar también la columna "Qué aporta" de la fila 035, que debe describir solo layout de aplicación y tipografía global.
6. **Reducción de la captura por pantalla a una por módulo (H-12):** la directiva exige una captura por cada pantalla del alcance; la HU 035 la acota a una pantalla por módulo porque solo entrega layout y tipografía. El requisito completo queda asignado a la HU derivada de verificación visual (sección 8). Esta reducción es consecuencia de la partición aprobada por el humano; confirmar que es aceptable.

---
> **Origen:** `app/skeleton.md` (directiva de negocio para @BA), `.specify/memory/constitution.md` (modo Brownfield) y decisión humana de partición registrada en `documents/tracker_bmad.md`. Todo contenido generado que no esté explícito en la fuente se marca como `⚠️ [PROPUESTO]`.

## 10. ORDEN DE DELEGACIÓN PARA EL QA
*(Una sola línea de texto continuo)*

@QA: La Historia de Usuario de deuda técnica Refactorización de Esqueleto UI (layout de aplicación y tipografía global) fue particionada por decisión humana y subsanada en los hallazgos H-04, H-10 y H-11, y está lista en el archivo 035-HU_refactorizacion_esqueleto_ui.md. Por favor, procede con la nueva auditoría documental contra la directiva app/skeleton.md y el reporte feedback_qa_035_refactorizacion_esqueleto_ui.md.
