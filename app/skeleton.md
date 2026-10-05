# 📢 DIRECTIVA DE NEGOCIO PARA @BA (BUSINESS ANALYST): REFACTORIZACIÓN UI

Se ha detectado una severa desviación arquitectónica en el Frontend. Las pantallas generadas actualmente parecen formularios sin formato: no existe un layout de aplicación (topbar, sidebar, breadcrumbs, footer), la tipografía cae en la fuente por defecto del navegador y la estructura visual de las páginas es mínima. Esto viola la directiva "Skeleton vs. Theme" de la Constitución (`.specify/memory/constitution.md`, sección 1).
Tu misión es generar una Historia de Usuario (Deuda Técnica) para obligar a los agentes técnicos a estructurar la UI con **PrimeNG 22 nativo**, siguiendo el "Patrón Obligatorio de Formularios PrimeNG 22" de la Constitución y calcando únicamente la **distribución estructural** del layout, nunca el código ni el estilo de la plantilla antigua.

---

### 🛠️ TAREAS A EJECUTAR (MODO MÁQUINA)

**1. Actualización del Product Ledger (`specs/README.md`):**
   - N°: `035`
   - Épica Origen: `Deuda Técnica / UI Core`
   - Nombre spec / HU: `035-HU_refactorizacion_esqueleto_ui`
   - Qué aporta: `Layout de aplicación y estructura de páginas y formularios alineados al Skeleton de la Constitución, con PrimeNG 22 nativo`
   - Estado: `BACKLOG`
   - Rama: `feat/035-HU_refactorizacion_esqueleto_ui`

**2. Creación del FSaaDB (Documento en `documents/business-analyst/`):**
   - Crea físicamente el archivo `.md` correspondiente (`documents/business-analyst/035-HU_refactorizacion_esqueleto_ui.md`).
   - Dentro del archivo, inyecta EXACTAMENTE el siguiente contenido:

```markdown
# Historia de Usuario: Refactorización de Esqueleto UI (PrimeNG 22)

## 1. Contexto
El frontend (`app/frontend`) renderiza cada pantalla de forma aislada: `AppComponent` es únicamente un `<router-outlet />`, por lo que no hay topbar, sidebar, breadcrumbs ni footer; los formularios quedan pegados a los bordes de la ventana, los títulos y etiquetas no tienen jerarquía visual y la tipografía global no está definida (el navegador aplica una fuente serif por defecto). Esto viola la directiva de distribución estructural (Skeleton) de la Constitución.

Existe una plantilla antigua en `./app/template-primeng/` que NO es compatible con el proyecto (usa `NgModule`, `[(ngModel)]`, la grilla `ed-grid`, módulos de PrimeNG anteriores a la v18 como `primeng/dropdown` o `primeng/calendar`, y estilos corporativos con `!important`). Solo es válida como referencia visual de la **distribución** de las zonas del layout (header, navegación lateral, contenedor, footer, breadcrumb).

Nota: el proyecto ya migró de PrimeFlex a Tailwind CSS v4 (infraestructura, constitución, agentes y clases de las plantillas existentes); esta HU parte de ese estado y no debe reintroducir PrimeFlex.

Esta HU estandariza el esqueleto de la aplicación y de sus pantallas con PrimeNG 22 nativo, Tailwind CSS v4 con el plugin `tailwindcss-primeui` (solo para grilla y espaciado) y el tema neutral Aura ya configurado en `providePrimeNG`.

## 2. Actores
- Desarrollador Frontend
- Usuario Final

## 3. Alcance
Pantallas existentes: Registro de Elemento de Backlog, Sprints (listado, formulario, detalle y elementos asignados), Equipo (página, diálogo de registro de miembro) y el diálogo de asignación de elemento a Sprint. Toda pantalla futura debe nacer dentro del mismo esqueleto. No se modifica ninguna regla de negocio, API ni contrato de datos.

## 4. Criterios de Aceptación (CA)

- **CA-01 (Layout de aplicación):** Existe un componente de layout standalone que envuelve todas las rutas autenticadas mediante `<router-outlet />` y contiene, con componentes PrimeNG 22: un topbar superior (`p-menubar`) con perfil y acciones del usuario a la derecha, un sidebar izquierdo colapsable (`p-drawer` o el componente equivalente de PrimeNG 22) para la navegación entre módulos (Backlog, Sprints, Equipo) y un footer inferior. Las rutas existentes siguen funcionando sin cambios de URL.
- **CA-02 (Estructura de página):** Cada pantalla muestra su título y, debajo de él, breadcrumbs (`p-breadcrumb`) coherentes con la ruta. El contenido vive en un contenedor con ancho máximo y padding uniforme; los botones de acción principales de la pantalla se ubican en la zona superior derecha del contenedor de datos.
- **CA-03 (Contenedores y jerarquía):** Los formularios se envuelven en `p-card` o `p-panel` con título claro y márgenes interiores uniformes. Los grupos de campos relacionados se separan visualmente (por ejemplo con `p-fieldset` o `p-divider`) y los textos de ayuda no se renderizan con un tamaño ilegible.
- **CA-04 (Grilla responsiva):** Todos los formularios complejos (como el Registro de Elemento) se distribuyen con el sistema de grillas de Tailwind CSS (`grid grid-cols-12 gap-4`, `col-span-12 md:col-span-6 lg:col-span-4`), de **3 a 4 campos por fila en pantallas grandes** según dicta la Constitución, y colapsan a una columna en pantallas pequeñas. Los filtros y formularios complejos se ubican sobre las tablas de datos; las tablas llevan paginación inferior y la columna de acciones (iconos) a la derecha.
- **CA-05 (Patrón de formularios PrimeNG 22):** Cada formulario o diálogo sigue literalmente el "Patrón Obligatorio de Formularios PrimeNG 22" de la Constitución: campos a ancho completo con el componente `<p-fluid>`, errores con `<p-message severity="error" variant="simple" size="small">`, `[invalid]` en `pInputText` y `pTextarea`, y cada control con su `<label>` alineado en la parte superior del campo. Se usan únicamente componentes PrimeNG 22 (`p-select` en lugar de `p-dropdown`, `p-datepicker` en lugar de `p-calendar`, `pInputText`, `pTextarea`, `p-inputnumber`). Quedan prohibidas las clases heredadas de PrimeNG ≤15 (`p-error`, `class="p-fluid"`, `p-field`, `p-formgrid`).
- **CA-06 (Tipografía y espaciado globales):** Se declara una única vez, en los estilos globales (`src/styles.css`, que ya importa Tailwind CSS, `tailwindcss-primeui` y PrimeIcons), la tipografía base (pila de fuentes sans-serif del sistema, sin descargar fuentes externas ni definir una marca) y el reseteo de márgenes del `body`, de modo que todos los componentes la hereden. Esta declaración es la única excepción permitida a la restricción de CSS de CA-07.
- **CA-07 (Restricción de Tema):** Está estrictamente prohibido heredar la capa visual de `./app/template-primeng/` o inyectar CSS custom para colores, bordes, sombras o tipografías por componente, así como `::ng-deep` y estilos de maquetación en los `.scss` de componentes. La refactorización es ESTRUCTURAL (Skeleton): el look and feel recae 100% sobre el tema neutral Aura de PrimeNG, y la maquetación se resuelve con clases utilitarias de Tailwind CSS directamente en el `.html`.
- **CA-08 (Uso permitido de la plantilla antigua):** El agente puede leer `./app/template-primeng/src/app/layout/` únicamente para entender la distribución de zonas del layout. Está prohibido copiar sus módulos, selectores, grilla `ed-grid`, `[(ngModel)]`, importaciones de PrimeNG anteriores a la v18 o cualquier archivo de estilos.
- **CA-09 (Posicionamiento de Acciones):** Los botones de acción de un formulario (Guardar, Cancelar) se agrupan (`flex`, `gap-2`) y se alinean en la zona inferior derecha del contenedor del formulario, con el estilo primario para la acción principal y el secundario para Cancelar.
- **CA-10 (Verificación):** Al cerrar la HU: `npm run lint:primeng`, `npm run build` y `npm test` en `app/frontend` terminan sin errores; los tests de componentes existentes siguen en verde; y se adjunta una captura por cada pantalla del alcance, mostrando el layout completo (topbar, sidebar, breadcrumbs, contenido y footer), a 1920 px y a 768 px de ancho.
```
