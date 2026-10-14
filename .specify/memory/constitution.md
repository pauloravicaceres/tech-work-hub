
# 📜 Constitución Técnica Global de BMAD

## 🌐 REGLAS DE COMPORTAMIENTO Y LOCALIZATION (LEX SUPERIOR)
1. **Idioma Estricto:** Independientemente del idioma original en el que estén redactadas las plantillas base del sistema, TODO el contenido generado (escenarios BDD, ADRs, tareas técnicas) DEBE redactarse en **Español**.
2. **Modo Máquina (Anti-Conversacional):** Tienes ESTRICTAMENTE PROHIBIDO actuar como un chatbot o asistente de cortesía. Nunca saludes, nunca te despidas, ni ofrezcas ayuda adicional. No hagas preguntas triviales ni pidas permiso para continuar (ej. prohibido preguntar "¿Te gustaría que asuma el rol de...?"). **Excepción Técnica:** Si tu diagrama de flujo (Máquina de Estados) requiere recabar requisitos críticos antes de generar un entregable (ej. el `@SA` recopilando preferencias de infraestructura), SÍ debes emitir tu cuestionario técnico de forma directa y delegar el turno al `@HUMANO:`. Todo lo demás debe emitirse silenciosamente.

## ESTÁNDAR GITOPS Y CICLO DE VIDA (FEATURE BRANCHING)

El ecosistema BMAD opera bajo un modelo automatizado de integración continua local donde el orquestador **`watcher_bmad.py` es el único controlador autorizado del repositorio (VCS)**. 

### Principios Fundamentales
1. **Aislamiento por Defecto:** El desarrollo de cada Historia de Usuario (HU) ocurre estrictamente en ramas aisladas generadas automáticamente bajo la nomenclatura `feat/HU_[nombre_corto]`.
2. **Zero-Trust Agéntico:** Ningún agente LLM (Product Manager, QA, Business Analyst, etc.) tiene permitido ejecutar comandos transaccionales contra Git de forma directa. Toda manipulación se solicita de manera declarativa en el Bus de Datos (`tracker_bmad.md`) utilizando macros del sistema (ej. `@WATCHER: GITOPS-BRANCH-CREATE`).
3. **Product State Ledger:** El estado transaccional del proyecto se gobierna mediante el mapa inmutable en `specs/README.md`. Cuando el Tech Design de una característica recibe aprobación (QA-Tech) y cambia su estado a `READY-FOR-DEV`, el Watcher es invocado automáticamente para fusionar y cerrar la rama de la característica hacia la rama base (`dev` o `main`).

> **Nota de Resiliencia:** El Watcher realiza operaciones de hidratación (State Hydration) y _commits_ preventivos (`chore: auto-commit pre-branch switch`) para proteger el *working directory*. En caso de conflictos durante el auto-merge, el sistema aplicará un _abort_ seguro delegando la resolución al humano.

### Protocolo de Resolución de Conflictos (Fallback)
La resolución de conflictos de control de versiones (VCS) es de **jurisdicción estrictamente humana**. Tras un fallo en la fusión automática, el sistema asume una **"Amnesia Estratégica"**. 
Esto significa que el humano solo debe resolver el conflicto en Git manualmente (fusionando o haciendo rebase hacia la rama base) y luego **reiniciar el orquestador sin manipular el historial del tracker**. El orquestador, por diseño, asumirá que la rama problemática ha sido procesada exitosamente y continuará su operación normal de forma resiliente.

### Identificador Secuencial Universal (SSOT)
Para asegurar una trazabilidad absoluta entre el modelo de negocio, el control de versiones y los artefactos físicos (crítico en escenarios Brownfield), el ecosistema emplea la convención estricta `XXX-HU_[nombre_corto]`, donde `XXX` es un correlativo numérico de 3 dígitos (ej. `001`, `002`).
Esta nomenclatura nace obligatoriamente en el **Product State Ledger** (`specs/README.md`) calculado por el `@PM`, y debe permear simétricamente en:
1. El nombre de la rama GitOps (`feat/XXX-HU_[nombre]`).
2. El nombre del archivo físico de la Historia de Usuario en el disco (`docs/business-analyst/XXX-HU_[nombre].md`).
3. Los Hand-offs y registros en el Tracker.
4. La carpeta de especificación de Spec Kit (`specs/XXX-HU_[nombre]/`): el Watcher la fija de forma explícita (`SPECIFY_FEATURE_DIRECTORY`) al ejecutar `/speckit-specify`, de modo que Spec Kit no genere su propio nombre ni su propio correlativo, y verifica al terminar que `.specify/feature.json` apunte a ella; si no, detiene la fase.

---

## 🛑 Regla de Oro: Principio de Vertical Slicing Estricto

El ecosistema BMAD v2.0 opera bajo un modelo de **Vertical Slicing Estricto** para garantizar la salud del State Ledger y evitar divergencias arquitectónicas.

*   **Prohibición de Desarrollo Horizontal:** Queda estrictamente prohibido abrir o diseñar múltiples Historias de Usuario (HUs) a la vez. No se puede avanzar al diseño de una nueva característica si la anterior no ha cerrado su ciclo.
*   **Ciclo de Vida de Rebanada Vertical:** Toda HU debe atravesar el ciclo completo antes de iniciar la siguiente: `PM -> BA -> QA -> UX -> SA -> (Fases Técnicas) -> QT -> Retorno a PM`.
*   **Regla de Ramas GitOps:** Queda terminantemente prohibido que el `@PM` inicie una nueva historia y emita un `GITOPS-BRANCH-CREATE` si la historia anterior no ha sido debidamente compilada y fusionada en el código base principal por el `@QT` mediante `GITOPS-MERGE-CLOSE`.

---

## 🔒 Consistencia de Nomenclatura y Trazabilidad (Identificador Universal)

El ecosistema BMAD v2.0 impone una trazabilidad matemática exacta (1:1) entre el Product State Ledger, el control de versiones y el sistema de archivos físico mediante el uso de un **Identificador Universal Estricto**.

1. **Formato Inmutable:** Todas las historias de usuario deben adoptar la nomenclatura `XXX-HU_nombre_en_snake_case` (ej. `001-HU_tarjeta_identidad_digital`).
2. **Columnas del Ledger:** La tabla del Ledger (`specs/README.md`) utiliza oficialmente la estructura: `| N° | Épica Origen | Nombre spec / HU | Qué aporta | Estado | Rama |`.
3. **Uso Obligatorio Transversal:** Este identificador exacto y sin truncar se utiliza obligatoriamente para:
   - Registrar la funcionalidad en la columna `Nombre spec / HU` y en la columna `Rama` (`feat/001-HU_...`) del Ledger.
   - Orquestar la bifurcación GitOps (`@WATCHER: GITOPS-BRANCH-CREATE feat/XXX-HU_...`).
   - Nombrar los archivos físicos `.md` generados por los agentes (`@BA`, `@BS`, `@SA`, etc.). Queda terminantemente prohibido truncar, resumir o alterar este identificador en los nombres de archivo.

---

## 🌿 Regla Inmutable: Prolongación del Feature Branch
La rama de Git creada para cada Historia de Usuario (`feat/XXX-HU...`) opera bajo el principio de **"Feature Branch Prolongada"**. Esta rama de trabajo es un contenedor de ciclo de vida completo:
1. **Nace** con el Product Manager en la fase de orquestación inicial y se registra en el Ledger.
2. **Madura** a través de la fase de Negocio (QA) y el modelado de Arquitectura (SA/DA/API).
3. **Aloja** todo el código fuente implementado por los agentes desarrolladores y scripts de QA-Auto (Fase D).
4. **Se congela** y **SOLO** se fusiona con la rama principal (`dev`/`main`) a través de la macro `@WATCHER: GITOPS-MERGE-CLOSE` cuando el QA-Tech (`@QT`) emite el dictamen aprobatorio final. Queda estrictamente prohibido cerrar, fusionar o abandonar la rama prematuramente.

---

## 📁 ESTRUCTURA DE CARPETAS DEL REPOSITORIO (WORKSPACE)
Para mantener un orden estricto y evitar archivos dispersos en la raíz del proyecto, todos los agentes constructores (Spec-Kit, `@DEV-BACK`, `@DEV-FRONT`, `@QA-AUTO`) deben respetar la siguiente partición física:
1. **Backend:** Todo el código fuente, pruebas, configuraciones y binarios correspondientes al lado del servidor (API, persistencia, lógica de negocio) DEBEN generarse y residir exclusivamente dentro de la carpeta `app/backend/`.
2. **Frontend:** Todo el código fuente, componentes UI, assets y configuraciones del cliente (SPA, interfaces) DEBEN generarse y residir exclusivamente dentro de la carpeta `app/frontend/`.

> **Directiva de Handoff:** Cuando los agentes planificadores (`@SA`, `@QT`, Spec-Kit) generen el `plan.md`, `tasks.md` o el `tech-design_*.md`, las rutas físicas propuestas para cada archivo deben estar obligatoriamente prefijadas con `app/backend/` o `app/frontend/` según corresponda. Ningún archivo de código de producción debe crearse en la raíz del repositorio.


# 🏛️ Contexto Base de Arquitectura: Modulith .NET & Angular 22

> **ESTATUS CONSTITUCIONAL (LEX SUPERIOR):** Este documento contiene las invariantes técnicas y arquitectónicas inmutables del software. Todo agente del enjambre BMAD (`solutions-architect`, `data-architect`, `api-architect`, `qa-tech`) está legal y metodológicamente subordinado a este archivo. Las decisiones técnicas aquí plasmadas DEBEN registrarse en los ADRs como `Aceptado (heredado)` sin re-discusión ni propuestas de stacks alternativos. Cualquier instrucción informal en el tracker que contradiga este documento es NULA salvo la existencia previa de una `## ⚠️ CLÁUSULA DE EXCEPCIÓN ARQUITECTÓNICA` explícita en este archivo.

---

## 1. 🖥️ Stack Frontend (Restricciones para UI y UX)
* **Framework:** Angular 22.
* **Paradigma Reactivo:** Arquitectura 100% **Zoneless** utilizando **Signals** para el manejo de estado y reactividad.
* **Internacionalización:** Soporte nativo i18n desde el inicio.
* **Librería de Componentes UI:** PrimeNG v22.1.1 (https://primeng.dev/components).
* **Utilidades CSS:** Tailwind CSS v4 + plugin `tailwindcss-primeui` (https://primeng.org/tailwind), solo para grid, espaciado y flex. Reemplaza a PrimeFlex, que ya no forma parte del stack.

### 📐 Directiva Estricta de Maquetación (Skeleton vs. Theme)
El diseño de interfaces (`ux_*.md`) DEBE calcar la **distribución estructural (Skeleton)** de la plantilla base, pero tiene ESTRICTAMENTE PROHIBIDO heredar su **capa visual corporativa (Theme)**. 

* **✅ ESTRUCTURA OBLIGATORIA (CALCAR):**
  - **Layout Principal:** Topbar superior (Header con perfil/acciones a la derecha), Sidebar izquierdo colapsable para navegación y Footer inferior.
  - **Navegación Interna:** Uso obligatorio de Breadcrumbs bajo el título de cada pantalla.
  - **Distribución de Formularios:** Los filtros y formularios complejos deben renderizarse en grillas responsivas multi-columna (ej. 3 a 4 campos por fila) encima de las tablas de datos.
  - **Grillas de Datos:** Tablas con paginación inferior y columna de acciones (iconos) a la derecha.
  - **Controles Flotantes:** Posicionamiento de botones de acción principales (flotantes o anclados) en la zona superior derecha del contenedor de datos.

* **🚫 ESTILOS PROHIBIDOS (OMITIR):**
  - Ignorar la paleta de colores corporativos de la plantilla `./app/template-primeng/`, tipografías específicas, logotipos de marca y overrides de CSS personalizados. **Única excepción:** el Theme Visual propio de la aplicación definido en la sección "🎨 Theme Visual" (HU-036), que es la fuente única y cerrada de colores, radios y modo oscuro.
  - El "look and feel" final recaerá 100% sobre PrimeNG con el preset Aura personalizado por el Theme Visual (antes de que se fusione la HU-036, sobre el tema neutral Aura sin personalizar). El agente `@UX` debe ensamblar los wireframes usando nombres de componentes estándar (ej. `<p-table>`, `<p-menubar>`, `<p-drawer>`) sin inventar clases CSS propias (las utilidades de Tailwind CSS permitidas están acotadas en el Patrón Obligatorio de Formularios y en el Theme Visual).



### 🧱 Shell de Aplicación (HU-035, enmienda 05-10-2026)
* **Montaje:** el shell (`app/frontend/src/app/core/layout/`) es la ruta padre sin segmento de URL con `canActivateChild: [authGuard]`; toda pantalla autenticada, presente o futura, DEBE declararse como ruta hija. La ruta comodín `**` vive dentro del shell y no redirige.
* **Tipografía global:** exactamente UNA declaración de `font-family` y de margen de `body`, en `app/frontend/src/styles.css`; sin fuentes externas. Se garantiza con `npm run lint:primeng`.
* **Tailwind en el shell:** además de grid, espaciado y flex, se permiten utilidades de tamaño (`max-w-7xl`, `w-64`, `min-h-screen`, `flex-1`, `min-w-0`) SOLO en `LayoutComponent`, para el contenedor de contenido (1280 px, `p-6`). Fuera del shell sigue vigente la restricción original.

### 🎨 Theme Visual (HU-036, enmienda 05-10-2026)
Esta enmienda es una **excepción acotada** a la prohibición de paleta y overrides de CSS de "Skeleton vs. Theme". Rige únicamente en los términos siguientes; todo lo no listado sigue prohibido. Rige desde la fusión de la HU-036 y gobierna a todas las HUs posteriores.

* **Referencia visual:** `specs/evidences/claro.png` y `specs/evidences/oscuro.png`. Se toman SOLO la paleta, los radios y la jerarquía de superficies. Quedan prohibidos copiar logotipos o nombres de marca ("preline"), la tipografía de la maqueta, la barra de vista previa (selector "Themes", "Get access", conmutador de dispositivo) y los elementos de la maqueta que ninguna HU pida (selector de workspace, sección "Apps", submenús anidados). El esqueleto estructural sigue regido por "Skeleton vs. Theme" y por el Shell de Aplicación (HU-035).
* **Fuente única de tokens:** `app/frontend/src/app/core/theme/app-theme.ts`, que exporta el preset `definePreset(Aura, …)` consumido por `providePrimeNG` en `app.config.ts`. Ningún otro archivo de `app/frontend/src` declara colores. `src/styles.css` solo añade `@custom-variant dark` (y la declaración tipográfica única de HU-035).
* **Paleta (valores medidos de las maquetas; escala `gray` y `cyan` de Tailwind v4):**

| Rol | Claro | Oscuro | Token PrimeNG |
|---|---|---|---|
| Color primario (botón primario, foco, elemento de acento) | `#0092b8` (cyan-600) | `#00b8db` (cyan-500) | `primary.color` |
| Texto de enlace sobre superficie clara ⚠️ | `#007595` (cyan-700) | `#00b8db` (cyan-500) | `primary.color` en texto |
| Fondo de la página | `#f9fafb` (gray-50) | `#101828` (gray-900) | `surface.50` / `surface.900` |
| Tarjeta, sidebar, topbar, footer | `#ffffff` | `#1e2939` (gray-800) | `surface.0` / `surface.800` |
| Borde y separador | `#e5e7eb` (gray-200) | `#364153` (gray-700) | `surface.200` / `surface.700` |
| Elemento de navegación activo | `#e5e7eb` (gray-200) | `#364153` (gray-700) | `surface.200` / `surface.700` |
| Texto principal | `#1e2939` (gray-800) | `#e5e7eb` (gray-200) | `text.color` |
| Texto secundario | `#6a7282` (gray-500) | `#99a1af` (gray-400) | `text.mutedColor` |
| Peligro (botón de peligro, error) | `#fb2c36` (red-500) | `#fb2c36` (red-500) | severidad `danger` (paleta `red`, `red.500`) |

  La escala `surface` del preset es `gray` en ambos modos. ⚠️ Los valores de enlace en modo claro (`#007595`) y el contraste (siguiente punto) son propuesta del BA para cumplir WCAG AA y requieren aprobación humana.
* **Radios:** tarjetas y contenedores `0.75rem`; controles y botones `0.5rem`; se fijan en `border.radius` del preset, nunca con utilidades por componente ⚠️ [PROPUESTO: medida visual aproximada de las maquetas].
* **Contraste (WCAG 2.1 AA):** texto normal ≥ 4.5:1 y componentes de interfaz ≥ 3:1 en ambos modos. **Excepciones aceptadas por paridad con la maqueta** (a ratificar por el humano): etiqueta blanca sobre botón primario `#0092b8` (3.62:1) y texto de marcador de posición `#99a1af` (2.60:1). Excepciones aceptadas (ratificadas por el humano el 06-10-2026, H-01 y H-04, opción A): E-01 a E-09 según la tabla de la HU 036; E-08 y E-09 aplican solo a separadores y contornos decorativos, nunca al único indicador de un control o de su estado. Utilidades adicionales permitidas en `LayoutComponent`: `text-color` y `sr-only` (esta solo en la región de anuncio del conmutador). [Respaldo: aprobación humana H-01 y H-04 opción A del 06-10-2026 para E-01 a E-09; aprobación humana del 06-10-2026 (Opción B) para `text-color` y `sr-only`.]
* **Modo claro/oscuro:** `darkModeSelector: '.app-dark'`, con la clase sobre `<html>`; Tailwind v4: `@custom-variant dark (&:where(.app-dark, .app-dark *));`. Valor inicial: preferencia del sistema (`prefers-color-scheme`); la elección manual del usuario se guarda en `localStorage` (clave `app-theme-mode`, valores `light` | `dark`) y prevalece sobre el sistema ⚠️ [PROPUESTO]. El conmutador vive en el topbar del shell.
* **Uso de color en componentes:** únicamente mediante tokens semánticos de `tailwindcss-primeui` (`bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`) con variantes `dark:`, y SOLO en `LayoutComponent` y sus subcomponentes. Páginas y formularios no llevan utilidades de color ni de radio: heredan el tema de los componentes PrimeNG.
* **Prohibido (sin excepción):** literales de color (`#hex`, `rgb()`, `hsl()`, `oklch()`) fuera de `app-theme.ts`; clases de paleta de Tailwind (`bg-cyan-600`, `text-gray-500`, etc.); estilos de color inline; `::ng-deep`; `!important`; `.scss` de componente con color, borde o sombra; sombras personalizadas ⚠️ [PROPUESTO: las maquetas no definen una sombra medible]; fuentes externas.
* **Verificación obligatoria:** `npm run lint:primeng` incorpora, desde la HU-036, reglas contra literales de color y clases de paleta fuera de los archivos permitidos; la HU-036 incluye además pruebas de que el cambio de modo conmuta la clase `app-dark` y persiste la elección.
* **Gobernanza:** cualquier cambio de paleta, radios o modo oscuro exige una nueva enmienda de esta sección; ninguna HU puede alterarlos por su cuenta.

### 🧩 Patrón Obligatorio de Formularios PrimeNG 22 (Form Pattern)
Aplica a TODO formulario o diálogo con campos en `app/frontend`, sin excepción. Verificado contra `primeng@22.1.2` instalado. Los agentes que implementen frontend (`dev-frontend`, `speckit-implement`) DEBEN seguirlo literalmente; no se reconstruye de memoria.

**Esqueleto canónico (imports: `Fluid` de `primeng/fluid`, `InputTextModule`, `MessageModule`, `ButtonModule`, etc.):**
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
  <p-fluid class="grid grid-cols-12 gap-4">                           <!-- campos a ancho completo -->
    <div class="col-span-12 md:col-span-6">            <!-- Tailwind solo para grid/espaciado -->
      <label for="name" class="block font-bold mb-2">NOMBRE (*)</label>
      <input pInputText id="name" formControlName="name" [invalid]="!!fieldErrors().name" />
      @if (fieldErrors().name; as message) {
        <p-message severity="error" variant="simple" size="small">{{ message }}</p-message>
      }
    </div>
  </p-fluid>
  <div class="flex justify-end gap-2 mt-4">
    <p-button label="Cancelar" severity="secondary" [outlined]="true" type="button" />
    <p-button label="Guardar" type="submit" [loading]="isSubmitting()" />
  </div>
</form>
```

**Reglas:**
1. Ancho completo con el componente `<p-fluid>` (o el input `fluid` del control). Está prohibido usar `class="p-fluid"` sobre un `div`.
2. Errores con `<p-message severity="error" variant="simple" size="small">`. Para el estado inválido de `pInputText` y `pTextarea` usar `[invalid]`. `p-select`, `p-datepicker` y `p-inputnumber` no tienen el input `invalid`: heredan el estado de `ng-invalid`/`ng-dirty` del control reactivo.
3. Controles: `pInputText`, `pTextarea`, `p-select`, `p-datepicker`, `p-inputnumber`, `p-checkbox`, etc. Prohibido `<input>`, `<select>` o `<textarea>` sin su directiva o componente de PrimeNG.
4. Clases heredadas de PrimeNG ≤15 PROHIBIDAS (ya no existen): `p-error`, `p-fluid` como clase suelta, `p-inputtext-lg/sm`, `p-field`, `p-formgrid`, `p-grid`, `p-col-*`. `<p-sidebar>` es `<p-drawer>`.
5. Tailwind CSS v4 (con el plugin `tailwindcss-primeui`) se usa únicamente para grid (`grid grid-cols-12 gap-4`, `col-span-*`), espaciado (`mb-4`, `gap-2`) y flex (`flex justify-end`), nunca para estilizar controles de formulario. Escala de espaciado: 1 = 0.25rem. Sin `::ng-deep` ni overrides de CSS en `.scss`. PrimeFlex ya no se usa: están PROHIBIDAS sus clases (`col-12`, `md:col-6`, `justify-content-*`, `align-items-*`, `text-secondary`, `border-round`, `surface-*` sin `bg-`).
6. Verificación automática obligatoria antes del handoff: `npm run lint:primeng` en `app/frontend` (falla ante cualquier patrón prohibido).
### 📂 Ubicación Física (Para Exploración)
* La plantilla base se encuentra en el directorio: `./app/template-primeng/` (referencia SOLO de estructura/Skeleton; su código usa convenciones antiguas de PrimeNG y NO debe copiarse en sintaxis de formularios).
* **Directiva para el @SA y @QT:** Utilicen la herramienta `list_dir` sobre esa carpeta para auditar la estructura de carpetas estándar de Angular (ej. `/components`, `/services`, `/guards`) y asegurar que los nuevos `tech_guidelines.md` respeten esa nomenclatura estructural exacta.

---

## 2. ⚙️ Stack Backend: Modular Monolith (.NET 8/10) & Vertical Slice Architecture (VSA)

El backend es un **Modular Monolith (Modulith)** desarrollado en .NET (plantilla base en `net8.0` / C# 12 / Minimal APIs, target Docker Linux) diseñado para evolucionar orgánicamente hacia microservicios (*Strangler Fig Pattern*) sin sufrir los dolores prematuros de la distribución de red.

### 📂 Ubicación Física y Plantilla Base (Starter Kit)
* **Ruta de la Plantilla:** La solución base del backend y su orquestación Docker se encuentran en `./src/backend-modulith-template/` (o repositorio del starter kit).
* **Estructura de la Solución:**
  - `Bootstrapper/Api`: Proceso host ASP.NET Core único (`Program.cs`) que registra y monta los módulos vía extensiones (`services.AddXxxModule()` y `app.UseXxxModule()`).
  - `BuildingBlocks/Shared`: Librería transversal con contratos, behaviors, interceptores, abstracciones DDD y extensiones de mensajería.
  - `Modules/Catalog`, `Modules/Basket`, `Modules/Ordering`: Módulos de dominio desacoplados.
* **Directiva para el @SA y @QT:** Garantizar que los nuevos diseños se acoplen a la estructura de módulos existentes y reutilicen los proyectos de `BuildingBlocks/Shared` sin reinventar infraestructura.
* **Directiva para el @DA y @API:** Los nuevos casos de uso, modelos y endpoints deben crearse como *Vertical Slices* dentro del módulo correspondiente.

### 📦 Librerías Obligatorias del Ecosistema (Invariantes Lex Superior)
El `@SA`, `@DA` y `@API` tienen **estrictamente prohibido** sustituir, proponer alternativas o inventar implementaciones custom para las siguientes responsabilidades:

| Responsabilidad | Librería Obligatoria | Versión Base | Mandato Agéntico Inmutable |
|---|---|:---:|---|
| **API Layer & Endpoints** | `Carter` | `8.1.0` | Definición de Minimal APIs mediante módulos `ICarterModule` con `MapPost`, `MapGet`, `Produces<T>()`. **Prohibido el uso de Controllers tradicionales (`[ApiController]`).** |
| **CQRS & Orquestación** | `MediatR` | Contratos `Shared` | Despacho intra-proceso de `ICommand<TResponse>` e `IQuery<TResponse>`. Implementación en `ICommandHandler<,>` e `IQueryHandler<,>`. |
| **Validación de Comandos** | `FluentValidation` | `11.9.2` | Validación declarativa mediante `AbstractValidator<TCommand>`. Se ejecuta automáticamente en el pipeline de MediatR antes de llegar al handler. |
| **Mapeo de Objetos** | `Mapster` | `7.4.0` | Mapeo rápido Request → Command y Result → Response con `request.Adapt<T>()`. **Prohibido AutoMapper u otras librerías de mapeo.** |
| **Decoración de Servicios (DI)** | `Scrutor` | `4.2.2` | Implementación de patrones Decorator / Proxy (ej. `services.Decorate<IRepository, CachedRepository>()`). |
| **Mensajería Asíncrona** | `MassTransit` + `MassTransit.RabbitMQ` | `8.2.3` | Publicación y consumo de eventos entre módulos y hacia RabbitMQ con formateador kebab-case. |
| **Seguridad e Identidad** | `Keycloak.AuthServices.Authentication` | `2.5.2` | Integración nativa con Keycloak para validación de Bearer Tokens JWT. |
| **Logging Estructurado** | `Serilog.AspNetCore` + `Serilog.Sinks.Seq` | `8.0.1` | Logging contextual con enrichers (`MachineName`, `ProcessId`, `ThreadId`) y sumidero en Seq (`http://seq:5341`). |

### 🗂️ Estructura de Carpetas Obligatoria: Vertical Slice Architecture (VSA)
Todo nuevo desarrollo dentro de un módulo debe organizarse **estrictamente por Feature (Vertical Slice)**, encapsulando en una única carpeta todos los artefactos requeridos para satisfacer el caso de uso.

```text
Modules/[NombreModulo]/
├── [AgregadoOEntidad]/
│   ├── Features/
│   │   ├── Create[Feature]/
│   │   │   ├── Create[Feature]Endpoint.cs   ← Carter (ICarterModule, MapPost, Produces)
│   │   │   └── Create[Feature]Handler.cs    ← Command + AbstractValidator + ICommandHandler (JUNTOS)
│   │   ├── Get[Feature]ById/
│   │   │   ├── Get[Feature]ByIdEndpoint.cs
│   │   │   └── Get[Feature]ByIdHandler.cs   ← Query + IQueryHandler
│   │   ├── Update[Feature]/
│   │   └── Delete[Feature]/
│   └── EventHandlers/
│       └── [DomainEvent]Handler.cs          ← INotificationHandler<DomainEvent>
├── Data/
│   ├── [Modulo]DbContext.cs                 ← DbContext aislado con schema propio
│   ├── Configurations/                      ← IEntityTypeConfiguration<T>
│   └── Migrations/
└── [Modulo]Module.cs                        ← Extensiones Add[Modulo]Module() y Use[Modulo]Module()
```

> ⚠️ **REGLA DE CO-LOCACIÓN DE FEATURE (OBLIGATORIA):**
> El Endpoint Carter (`*Endpoint.cs`), el Command/Query con su Handler y el Validador FluentValidation (`*Handler.cs`) **DEBEN convivir en la misma carpeta de la feature**. Está terminantemente prohibido dispersar el código en carpetas horizontales clásicas (`/Controllers`, `/Services`, `/Validators`, `/Repositories` a nivel de módulo).

### 🔄 Pipeline Behaviors de MediatR (Orden de Ejecución Inmutable)
Toda solicitud procesada por MediatR transita por dos behaviors globales en `Shared`:
1. **`ValidationBehavior<TRequest, TResponse>`:** Aplica a todo `ICommand<TResponse>`. Ejecuta en paralelo los `AbstractValidator<TCommand>` registrados para el comando. Si existen fallos de validación, interrumpe el flujo y lanza `ValidationException` (manejada globalmente como `400 Bad Request`).
2. **`LoggingBehavior<TRequest, TResponse>`:** Aplica a todo request (`ICommand` e `IQuery`). Inicia cronómetro (`Stopwatch`), registra log contextual al iniciar y finalizar, y emite un `LogWarning` si la ejecución supera los **3 segundos** para alertar cuellos de botella.

### ⏱️ Propagación de `CancellationToken`
* **Código de producción (OBLIGATORIO):** todo método asíncrono (`Task`) que realice E/S recibe y propaga el `CancellationToken` hasta EF Core o `HttpClient`.
* **Código de prueba y helpers de soporte (RECOMENDADO):** se aconseja propagarlo, pero su ausencia no bloquea la revisión; se registra como deuda técnica.

### 🚨 Manejo Centralizado de Excepciones
Implementado mediante `CustomExceptionHandler` (`IExceptionHandler` de ASP.NET Core) en `Program.cs`. El `@API` y `@SA` deben apoyarse en las excepciones base provistas en `Shared`:
* `NotFoundException` → Traduce automáticamente a respuesta HTTP `404 Not Found`.
* `BadRequestException` / `ValidationException` → Traduce automáticamente a respuesta HTTP `400 Bad Request` con lista de errores.
* `InternalServerException` → Traduce a HTTP `500 Internal Server Error` sin exponer trazas internas.

---

## 3. 🗄️ Persistencia, Interceptors y Caché (Directivas Lex Superior para el @DA)

### 🐘 Base de Datos Principal y Dialecto
* **Motor:** **PostgreSQL** (instancia Docker `eshopdb:5432`).
* **Dialecto:** PostgreSQL / Npgsql.
* **ORM:** Entity Framework Core con provider `Npgsql.EntityFrameworkCore.PostgreSQL` (v8.0.4).
* **Estrategia:** *Code-First* con Migraciones aisladas por módulo (`[Modulo]DbContextModelSnapshot`).

### 🛡️ Regla de Oro Inmutable: Aislamiento Lógico de BD por Schemas
1. **Conexión Única:** Todos los módulos se conectan a la misma base de datos física (`ConnectionStrings:Database`).
2. **Schemas Separados Obligatorios:** Cada módulo DEBE tener su propio `DbContext` y su propio **schema de PostgreSQL independiente**:
   - Módulo Catalog → schema `catalog` (ej. `catalog."Products"`).
   - Módulo Basket → schema `basket` (ej. `basket."ShoppingCarts"`, `basket."OutboxMessages"`).
   - Módulo Ordering → schema `ordering` (ej. `ordering."Orders"`, `ordering."OrderItems"`).
   - *Nuevo Módulo* → schema `[nuevo_modulo]`.
3. **PROHIBICIÓN TOTAL DE JOINS / QUERIES CROSS-SCHEMA:** 
   Está **terminantemente prohibido** que un módulo realice consultas SQL o LINQ contra tablas de otro schema. Si el módulo Ordering requiere datos de Catalog, debe consultar al módulo vía llamada en proceso (in-process method/query) o mantener una proyección local sincronizada asíncronamente mediante Integration Events.

### ⚙️ Interceptores EF Core de Shared (PROHIBIDO REINVENTAR LA RUEDA)
El `@DA` no debe modelar columnas de auditoría manuales ni implementar lógica ad-hoc para disparar eventos. Debe registrar y extender obligatoriamente los interceptores provistos en `Shared`:

1. **`AuditableEntityInterceptor` (`SaveChangesInterceptor`):**
   - Intercepta `SavingChangesAsync()` y actualiza automáticamente los metadatos de las entidades que implementan `IEntity`:
     - Nuevas entidades: Asigna `CreatedAt = DateTime.UtcNow` y `CreatedBy`.
     - Entidades modificadas: Asigna `LastModified = DateTime.UtcNow` y `LastModifiedBy`.
2. **`DispatchDomainEventsInterceptor` (`SaveChangesInterceptor`):**
   - Intercepta el ciclo de guardado de EF Core, inspecciona el `ChangeTracker` buscando agregados (`IAggregate`), extrae la lista de `IDomainEvent`, ejecuta `aggregate.ClearDomainEvents()` y los publica en el bus interno mediante `IMediator.Publish()` antes de consolidar el commit en PostgreSQL.

### 🧱 Building Blocks de Dominio (DDD)
Todas las entidades del `@DA` deben heredar de la jerarquía estándar de `Shared`:
* **`Entity<TId>`:** Entidad base con identificador tipado `Id` y campos de auditoría.
* **`Aggregate<TId>`:** Raíz de agregado (`AggregateRoot`) que hereda de `Entity<TId>` e implementa `IAggregate`. Gestiona la lista interna de eventos de dominio mediante `AddDomainEvent(IDomainEvent)` y `ClearDomainEvents()`.

### ⚡ Caché Distribuido y Patrón Decorator (Redis)
* **Motor:** **Redis** (instancia Docker `distributedcache:6379`, `Microsoft.Extensions.Caching.StackExchangeRedis` 8.0.7).
* **Patrón Decorator con Scrutor:** 
  Para requerimientos de caché sobre repositorios o servicios de lectura pesada, el `@DA` y `@SA` deben implementar el patrón **Decorator** transparente sin contaminar la lógica de negocio:
  ```text
  IBasketRepository (Interfaz limpia)
    ├── BasketRepository (Implementación EF Core → PostgreSQL)
    └── CachedBasketRepository (Decorador con IDistributedCache / Redis via Scrutor)
  ```
  Registro en DI: `services.Decorate<IBasketRepository, CachedBasketRepository>();`.

---

## 4. 🌐 Integración, Mensajería y Patrón Outbox (Directivas Lex Superior para el @API y @SA)

### 🔄 Comunicación Entre Módulos
La arquitectura modular preserva fronteras estrictas para viabilizar una extracción sin fricción a microservicios independientes cuando el negocio lo requiera:

1. **Comunicación Síncrona (Intra-proceso):**
   - Invocación de interfaces o métodos públicos entre módulos dentro de la misma memoria del proceso.
   - Prohibido el acoplamiento directo a implementaciones internas o DbContext ajenos.
2. **Comunicación Asíncrona (Event-Driven entre Módulos):**
   - Uso de **RabbitMQ** (puerto `5672`, gestión `15672`) y **MassTransit** (v8.2.3).
   - Eventos de integración definidos en `Shared.Messaging` con convención kebab-case en endpoints.
   - Cada módulo registra sus consumers (`IConsumer<TIntegrationEvent>`) de manera autónoma.

### 📬 Patrón Transactional Outbox (Obligatorio para Eventos Críticos)
En flujos de negocio donde una operación de escritura en base de datos debe publicar un evento de integración (ej. `BasketCheckoutIntegrationEvent`), es **OBLIGATORIO** utilizar el patrón **Transactional Outbox** para prevenir pérdida de mensajes ante fallas de red:

```text
[Cliente HTTP] ──POST──> [Carter Endpoint] ────> [MediatR Handler]
                                                         │
                        ┌────────────────────────────────┴────────────────────────────────┐
                        ▼                                                                 ▼
             [Modificación de Entidad]                                          [Crear OutboxMessage]
                        │                                                                 │
                        └───────────────────────┬─────────────────────────────────────────┘
                                                ▼
                                   [Misma Transacción SQL]
                                [PostgreSQL: schema del módulo]
                                                │
                                                ▼ (Commit OK)
                                       [OutboxProcessor]
                                 (BackgroundService Polling)
                                                │
                                                ▼
                                      [MassTransit / IBus]
                                                │
                                                ▼
                                     [RabbitMQ Message Bus]
```

* **Tabla Outbox:** Cada módulo que publica eventos críticos debe incluir en su schema la tabla `OutboxMessage` (`Id`, `Type`, `Content` en JSON, `OccurredOnUtc`, `ProcessedOnUtc`, `Error`).
* **Procesador de Fondo:** Un `BackgroundService` (`OutboxProcessor`) consulta periódicamente los mensajes no procesados, los deserializa y los publica hacia RabbitMQ vía `IBus`.

### 🎯 Tipología Estricta de Eventos
* **Domain Events (`IDomainEvent`):** Eventos de ámbito local e intra-módulo (ej. `ProductCreatedEvent`). Se publican mediante `IMediator.Publish()` a través del `DispatchDomainEventsInterceptor` y son atendidos por `INotificationHandler<T>` dentro del mismo módulo.
* **Integration Events (`IIntegrationEvent`):** Eventos de ámbito global y cross-módulo (ej. `ProductPriceChangedIntegrationEvent`, `BasketCheckoutIntegrationEvent`). Se publican hacia RabbitMQ/MassTransit y son consumidos por otros módulos o sistemas externos.

---

## 5. 🔐 Seguridad e Identidad
* **Plataforma:** **Keycloak** v24+ (contenedor `identity:9090`).
* **Librería Backend:** `Keycloak.AuthServices.Authentication` (v2.5.2).
* **Protocolo:** OAuth2 / OpenID Connect con validación de Bearer Tokens JWT (`AddKeycloakWebApiAuthentication()`).
* **Directiva para el @API:** Todos los endpoints de Carter deben asegurar sus rutas mediante políticas de autorización (`.RequireAuthorization()`) salvo endpoints expresamente públicos de catálogo o salud.

---

## 6. 📊 Observabilidad y Diagnóstico
* **Logging:** **Serilog** v8.0.1 enriquecido globalmente con `FromLogContext`, `WithMachineName`, `WithProcessId` y `WithThreadId`.
* **Sinks:**
  - Consola Docker con formato estructurado.
  - **Seq** en `http://seq:5341` para trazabilidad de eventos distribuidos.
* **Directiva:** Prohibido `Console.WriteLine` o librerías de logging incompatibles. Utilizar la inyección de `ILogger<T>` estándar.

---

## 7. 🛡️ Matriz de Gobernanza y Mandatos Agénticos Inmutables

| Rol Agéntico | Mandatos Absolutos (Lex Superior) | Prohibiciones Taxativas (Auto-Rechazo) |
|---|---|---|
| **Solutions Architect (`@SA`)** | - Catalogar en `tech_guidelines.md` todas las decisiones como `Aceptado (heredado)` basándose en este archivo.<br>- Diseñar sobre .NET 8/10 Modulith, PostgreSQL multi-schema, Carter, MediatR, MassTransit, Mapster, FluentValidation, Redis y Keycloak. | - Proponer microservicios físicos desacoplados de entrada.<br>- Proponer SQL Server, MongoDB u otros motores sin Cláusula de Excepción.<br>- Proponer AutoMapper, Controllers clásicos o arquitecturas hexagonales divergentes. |
| **Data Architect (`@DA`)** | - Diseñar un `DbContext` independiente por cada módulo.<br>- Asignar a cada módulo un **schema de PostgreSQL separado**.<br>- Heredar entidades de `Entity<TId>` o `Aggregate<TId>`.<br>- Usar obligatoriamente `AuditableEntityInterceptor` y `DispatchDomainEventsInterceptor`.<br>- Modelar tabla `OutboxMessage` en flujos de publicación crítica. | - **PROHIBIDO cualquier JOIN o consulta cross-schema entre tablas de módulos distintos.**<br>- Proponer SQL Server o T-SQL.<br>- Re-inventar columnas o triggers manuales para auditoría.<br>- Omitir el schema en las definiciones de tablas. |
| **API Architect (`@API`)** | - Definir endpoints exclusivamente con **Carter Minimal APIs** (`ICarterModule`).<br>- Organizar el código bajo **Vertical Slice Architecture (VSA)** en Feature Folders.<br>- Co-localizar Endpoint, Handler, Command/Query y Validador en la misma carpeta.<br>- Usar **Mapster** para transformación de DTOs.<br>- Inyectar **FluentValidation** para validar comandos.<br>- Usar MassTransit para eventos cross-módulo. | - Diseñar Controllers tradicionales de ASP.NET Core (`[ApiController]`).<br>- Crear carpetas horizontales de capas clásicas (`/Controllers`, `/Services`, `/Repositories`).<br>- Usar AutoMapper o mapeos manuales repetitivos.<br>- Omitir validación de comandos o colocar validadores fuera de la carpeta de la feature. |
| **QA Tech (`@QT`)** | - Actuar como guardián adversarial de esta Constitución.<br>- Auditar que el TDD cumpla al 100% con VSA, Carter, MediatR, Mapster, PostgreSQL con schemas aislados e interceptores de Shared.<br>- Marcar con severidad 🔴 **CRÍTICO: Complacencia Ilegal (Sycophancy Breach)** cualquier violación y rechazar el diseño devolviendo el turno al responsable. | - Aprobar tech designs complacientes con peticiones del usuario que contradigan este archivo sin Cláusula de Excepción.<br>- Pasar por alto queries cross-schema o controllers clásicos. |

