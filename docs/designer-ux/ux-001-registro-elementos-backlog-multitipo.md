# ESPECIFICACIÓN DE DISEÑO UX: Registro de Elementos en Backlog Multitipo

- **Historia de Usuario Fuente:** `documents/business-analyst/001-registro-elementos-backlog-multitipo.md`
- **Spec Kit Fuente:** `specs/001-registro-elementos-backlog-multitipo/spec.md`
- **Fecha de Diseño:** 03-10-2026
- **Diseñador UX:** Agente UX Senior BMAD
- **Modo de Gobernanza:** Brownfield (subordinado a `.specify/memory/constitution.md`)
- **Stack de Presentación:** Angular 22 (Zoneless, Signals) + PrimeNG v22.1.1 (Tema Neutral)

---

## 1. RESUMEN DE DISEÑO
- **Historia Base:** `001-registro-elementos-backlog-multitipo` - Registro de Elementos en Backlog Multitipo.
- **Enfoque de Usabilidad:** La interfaz proporciona una captura rápida, tipificada y estructurada de elementos de trabajo mediante una grilla responsiva basada en PrimeNG. Optimiza la ergonomía separando visualmente el esfuerzo técnico por disciplina (Desarrollo vs. QA) y aplicando validación reactiva en tiempo real sobre los campos obligatorios, garantizando una carga cognitiva mínima para Líderes Técnicos y miembros del equipo.
- **Directiva Brownfield y Aclaración SDD:** Siguiendo la aclaración humana (Opción A: Backend API primero como rebanada vertical independiente), esta especificación define el contrato visual y la experiencia de usuario canónica de la interfaz Angular que consumirá el endpoint POST `/api/backlog/items`.

---

## 2. MAPA DE ESTADOS VISUALES

### Estado 1: Formulario de Registro Completo - Happy Path (Historia de Usuario)
- **Escenario Cubierto:** SC-01 [Happy Path] Registro exitoso de elemento tipo Historia de Usuario con estimaciones completas por rol (FR-001, FR-002, FR-003, FR-006, FR-007, FR-009, FR-010).
- **ID de Tarea Spec Kit:** `Task-UI-01: Formulario Reactivo BacklogItemForm`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-menubar] TechWorkHub                                              [Notificaciones (0)] [Usuario: Lead / Dev v] |
+--------------------------------------------------------------------------------------------------------------------+
| [p-sidebar]             | [p-breadcrumb] Inicio > Backlog Multitipo > Nuevo Elemento                              |
|                         +------------------------------------------------------------------------------------------+
| [*] Dashboard           | REGISTRO DE ELEMENTO EN BACKLOG MULTITIPO                                                |
| [o] Sprints             | Diligencie los campos requeridos para incorporar el requerimiento a la planificación.    |
| [>] Backlog Multitipo   |                                                                                          |
|     - Ver Backlog       | +--------------------------------------------------------------------------------------+ |
|     - [+ Nuevo Item]    | | [p-card]                                                   [ Cancelar ] [ Guardar ] | |
| [o] Incidentes          | |--------------------------------------------------------------------------------------| |
| [o] Aplicaciones        | | TÍTULO DEL ELEMENTO (*)                      TIPO (*)            PRIORIDAD (*)       | |
| [o] Equipos y Roles     | | [ Implementar autenticación OIDC Keycloak.. ] [ UserStory       v] [ High          v] | |
| [o] Reuniones           | |                                                                                      | |
| [o] Configuración       | | APLICACIÓN VINCULADA                         ESTADO INICIAL (Fijo)                   | |
|                         | | [ app-id-101 (Tech Gateway)             v]   [ Backlog (Inmutable)      ] (Disabled) | |
|                         | |                                                                                      | |
|                         | | ESTIMACIÓN DESARROLLO (DevPoints)            ESTIMACIÓN QA (QAPoints)                | |
|                         | | [ 5.0                                  ^v]   [ 3.0                                ^v]| |
|                         | |                                                                                      | |
|                         | | DESCRIPCIÓN TÉCNICA                                                                  | |
|                         | | [ Configurar middleware Bearer JWT en el gateway modular......................... ] | |
|                         | | [ ............................................................................... ] | |
|                         | |                                                                                      | |
|                         | | CRITERIOS DE ACEPTACIÓN                                                              | |
|                         | | [ El token JWT debe validarse contra el realm configurado........................ ] | |
|                         | | [ ............................................................................... ] | |
|                         | +--------------------------------------------------------------------------------------+ |
|                         |                                          [ [X] Cancelar ]     [ [✓] Guardar Elemento ]  |
+--------------------------------------------------------------------------------------------------------------------+
| [p-toast] Arriba-Derecha: (i) Éxito: Elemento registrado en Backlog con UUID a7b9-4c12-98ef.                     |
+--------------------------------------------------------------------------------------------------------------------+
| [Footer] TechWorkHub v1.0 | Modulith .NET 8 + Angular 22 Zoneless | PrimeNG v22.1.1                               |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-menubar>`, `<p-sidebar>`, `<p-breadcrumb>`, `<p-card>`, `<p-inputtext>`, `<p-dropdown>`, `<p-inputnumber>`, `<p-textarea>`, `<p-button>`, `<p-toast>`.
  - **Disparadores de Estado:** Carga de ruta `/backlog/nuevo` o clic en "+ Nuevo Item" desde la navegación.
  - **Reglas de Componente:**
    - Campo `Título`: autofocus al renderizar, obligatorio, longitud máxima de 200 caracteres con contador reactivo `(chars/200)`.
    - Campo `Estado Inicial`: renderizado como `<input pInputText [disabled]="true" value="Backlog" />` para asegurar FR-003.
    - Campos de Estimación: `<p-inputnumber [min]="0" [step]="0.5" mode="decimal">` permitiendo decimales mayores o iguales a 0.
    - Al pulsar `Guardar Elemento`: deshabilitar botón, mostrar spinner en `<p-button [loading]="isSubmitting()">`, ejecutar llamada POST hacia `/api/backlog/items` y mostrar `<p-toast>` de confirmación 201 Created.

---

### Estado 2: Elemento Técnico / Spike con QA Points Deshabilitados (Estimación Parcial / Nula)
- **Escenario Cubierto:** SC-02 [Happy Path] Registro exitoso de elemento técnico alternativo con estimación parcial o nula (FR-005, FR-008).
- **ID de Tarea Spec Kit:** `Task-UI-02: Reactividad de Campos por Tipo de Ítem`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-card]                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------|
| TÍTULO DEL ELEMENTO (*)                      TIPO (*)            PRIORIDAD (*)                             |
| [ Spike sobre latencia de réplica en Post.. ] [ Spike             v] [ Medium        v]                             |
|                                                                                                                    |
| APLICACIÓN VINCULADA (Opcional)              ESTADO INICIAL                                                        |
| [ (Sin aplicación vinculada)             v]  [ Backlog                  ] (Disabled)                               |
|                                                                                                                    |
| ESTIMACIÓN DESARROLLO (DevPoints)            ESTIMACIÓN QA (QAPoints)                                              |
| [ 2.0                                  ^v]   [ N/A - No aplica para Spike     ] (DISABLED / READONLY)              |
|                                              * Este tipo de ítem técnico no requiere validación QA *               |
|                                                                                                                    |
| DESCRIPCIÓN TÉCNICA                                                                                                |
| [ Evaluar tiempo de respuesta en consultas de lectura pesada en PostgreSQL.......................................] |
|                                                                                                                    |
| CRITERIOS DE ACEPTACIÓN (Opcional)                                                                                 |
| [ Documentar benchmark y tiempos percentiles p95 y p99...........................................................] |
+--------------------------------------------------------------------------------------------------------------------+
|                                                          [ [X] Cancelar ]               [ [✓] Guardar Elemento ]  |
+--------------------------------------------------------------------------------------------------------------------+
| [p-toast] (i) Éxito: Spike registrado exitosamente. qaPoints almacenado como null.                                 |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dropdown>` con evento `(onChange)="onTypeChange($event)"`, `<p-inputnumber [disabled]="isQaNotApplicable()" placeholder="N/A">`.
  - **Disparadores de Estado:** Selección del tipo `Spike`, `Research` o `TechDebt` en el dropdown de tipos.
  - **Reglas de Componente:**
    - Signal reactivo `isQaNotApplicable = computed(() => ['Spike', 'Research'].includes(selectedType()))`.
    - Al activarse, limpia el valor de `qaPoints`, lo asigna como `null` y deshabilita el control interactivo mostrando mensaje auxiliar informativo.
    - El payload emitido envía `"qaPoints": null`, satisfaciendo SC-02 y FR-008.

---

### Estado 3: Validación Fallida - Título Requerido y Límites de Longitud (Sad Path)
- **Escenario Cubierto:** SC-03 [Sad Path] Rechazo de creación por omisión de título requerido y CB-01 (Longitud > 200 caracteres / FR-004).
- **ID de Tarea Spec Kit:** `Task-UI-03: Validación Reactiva de Título`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-card]                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------|
| TÍTULO DEL ELEMENTO (*)                      TIPO (*)            PRIORIDAD (*)                             |
| [                                          ] [ Bug               v] [ High           v]                             |
| [!] El título es un campo obligatorio y no   (Borde rojo PrimeNG)                                                  |
|     puede estar vacío (1 a 200 caracteres).                                                                        |
|                                                                                                                    |
| APLICACIÓN VINCULADA                         ESTADO INICIAL                                                        |
| [ app-id-101                             v]  [ Backlog                  ] (Disabled)                               |
|                                                                                                                    |
| ESTIMACIÓN DESARROLLO (DevPoints)            ESTIMACIÓN QA (QAPoints)                                              |
| [ 1.0                                  ^v]   [ 2.0                        ^v]                                      |
+--------------------------------------------------------------------------------------------------------------------+
| [p-message severity="error"] Formulario incompleto: Corrija los errores marcados antes de continuar.               |
|                                                          [ [X] Cancelar ]               [ (X) Guardar Elemento ]  |
|                                                                                         (Botón deshabilitado)      |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<input pInputText class="ng-invalid ng-dirty">`, `<small class="p-error">`, `<p-message severity="error">`.
  - **Disparadores de Estado:** Input tocado y vaciado (`touched && invalid`), o intento de envío con título en blanco o excediendo 200 caracteres.
  - **Reglas de Componente:**
    - `Validators.required`, `Validators.maxLength(200)`.
    - Borde rojo estandarizado por el tema neutro de PrimeNG (`.p-invalid`).
    - El botón de acción primaria `Guardar Elemento` permanece deshabilitado (`[disabled]="form.invalid"`) hasta que el usuario corrija la entrada.

---

### Estado 4: Validación Fallida - Estimaciones Negativas (Sad Path)
- **Escenario Cubierto:** SC-05 [Sad Path] Rechazo de creación por estimación numérica negativa y CB-03 (FR-006).
- **ID de Tarea Spec Kit:** `Task-UI-04: Control de Rango de Estimación`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-card]                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------|
| ESTIMACIÓN DESARROLLO (DevPoints)            ESTIMACIÓN QA (QAPoints)                                              |
| [ -3.0                                 ^v]   [ 1.0                        ^v]                                      |
| [!] Los puntos de desarrollo deben ser >= 0.                                                                       |
|     (Valor mínimo permitido: 0.0)                                                                                  |
+--------------------------------------------------------------------------------------------------------------------+
| [p-message severity="error"] Los puntos de estimación deben ser mayores o iguales a cero.                          |
|                                                          [ [X] Cancelar ]               [ (X) Guardar Elemento ]  |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-inputnumber [min]="0" class="ng-invalid ng-dirty">`, `<small class="p-error">`.
  - **Disparadores de Estado:** Ingreso de valores negativos por teclado numérico o pegado de texto.
  - **Reglas de Componente:**
    - Restricción nativa mediante `min=0` en PrimeNG.
    - Validador Angular `Validators.min(0)` en el Signal/FormControl correspondiente.
    - Si la API responde con HTTP 400 ValidationException (`"points must be >= 0"`), se enlaza dinámicamente el mensaje bajo el input correspondiente.

---

### Estado 5: Error de Integración Referencial - Aplicación Inexistente (Sad Path)
- **Escenario Cubierto:** CB-04 [Sad Path] Rechazo por `applicationId` inválido o eliminado del catálogo (FR-007).
- **ID de Tarea Spec Kit:** `Task-UI-05: Integración Referencial de Aplicaciones`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-card]                                                                                                           |
|--------------------------------------------------------------------------------------------------------------------|
| APLICACIÓN VINCULADA                                                                                               |
| [ app-id-999-invalida                    v] (Resaltado con advertencia)                                            |
| [!] La aplicación seleccionada ya no existe en el catálogo o no se encuentra disponible.                           |
+--------------------------------------------------------------------------------------------------------------------+
| [p-toast] (X) Error 400: La aplicación referenciada no existe en el módulo de aplicaciones.                       |
|                                                          [ [X] Cancelar ]               [ [✓] Reintentar ]         |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dropdown [filter]="true">`, `<p-toast severity="error">`.
  - **Disparadores de Estado:** Recepción de HTTP 400 / NotFoundException desde la API al enviar un identificador desactualizado.
  - **Reglas de Componente:**
    - El dropdown carga los aplicativos mediante llamada in-memory / query de catálogo.
    - En caso de inconsistencia devuelta por el servidor, se emite un toast de severidad `error` y se marca el control como inválido para forzar la re-selección o limpieza del campo.

---

### Estado 6: Error de Autenticación / Sesión Expirada (Sad Path)
- **Escenario Cubierto:** SC-06 [Sad Path] Rechazo por solicitud no autenticada sin token Bearer y CB-06 (Keycloak OIDC).
- **ID de Tarea Spec Kit:** `Task-UI-06: Gestión de Sesión OIDC`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| (Fondo difuminado / Modal Backdrop Bloqueante)                                                                     |
|                                                                                                                    |
|                  +---------------------------------------------------------------+                                 |
|                  | [p-dialog] SESIÓN EXPIRADA O INVÁLIDA                         |                                 |
|                  |---------------------------------------------------------------|                                 |
|                  | [!] Su sesión de trabajo en Keycloak ha expirado o no cuenta  |                                 |
|                  |     con un token de autorización válido para registrar ítems. |                                 |
|                  |                                                               |                                 |
|                  | Para preservar la seguridad, vuelva a autenticarse.           |                                 |
|                  |                                                               |                                 |
|                  |                               [ [->] Reautenticar con Keycloak ] |                              |
|                  +---------------------------------------------------------------+                                 |
|                                                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-dialog [modal]="true" [closable]="false" [visible]="sessionExpired()">`.
  - **Disparadores de Estado:** Interceptor HTTP de Angular captura código HTTP 401 Unauthorized.
  - **Reglas de Componente:**
    - Diálogo modal bloqueante no descartable por clic fuera de pantalla (`[dismissableMask]="false"`).
    - El botón redirige al flujo de login de Keycloak preservando en state la URL actual para retorno automático tras autenticación.

---

### Estado 7: Fallo Interno del Servidor / Caída de Conexión (Sad Path)
- **Escenario Cubierto:** CB-05 [Sad Path] Inconsistencia o caída de conexión en PostgreSQL durante la transacción (HTTP 500).
- **ID de Tarea Spec Kit:** `Task-UI-07: Resiliencia ante Fallos de Servidor`
- **Wireframe Estructural (ASCII):**
```text
+--------------------------------------------------------------------------------------------------------------------+
| [p-card]                                                                                                           |
| [Formulario completado preservando los datos ingresados por el usuario sin pérdida de información]                 |
|                                                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
| [p-message severity="error"]                                                                                       |
| (X) ERROR 500: Ocurrió un error transaccional en el servidor al intentar guardar el ítem.                         |
|     No se aplicaron cambios en la base de datos. Sus datos se han conservado; intente nuevamente en unos instantes.  |
|                                                          [ [X] Cancelar ]               [ [↻] Reintentar Envío ]  |
+--------------------------------------------------------------------------------------------------------------------+
```
- **Nota de Interfaz:**
  - **Componentes PrimeNG:** `<p-message severity="error">`, `<p-button icon="pi pi-refresh">`.
  - **Disparadores de Estado:** Captura de HTTP 500 InternalServerException.
  - **Reglas de Componente:**
    - El formulario mantiene intactos los campos llenados por el usuario para evitar pérdida de trabajo.
    - Se habilita el botón "Reintentar Envío" con llamada directa al servicio sin recargar la página.

---

## 3. DECISIONES DE DISEÑO Y PUNTOS PENDIENTES

### Heurísticas Aplicadas:
1. **Navegación y Skeleton Consistente:** Se adoptó la estructura estricta de `constitution.md`: Topbar superior con menú `<p-menubar>`, Sidebar izquierdo colapsable `<p-sidebar>` y Breadcrumbs de ubicación clara.
2. **Layout Responsivo Multi-Columna:** En pantallas de escritorio, los selectores clave (Título, Tipo, Prioridad y Estimaciones) se distribuyen en filas compactas de 2 a 3 columnas para maximizar el espacio útil y permitir visualizar los campos de texto extenso (Descripción y Criterios de Aceptación) sin scrolling excesivo.
3. **Ergonomía de Estimación Desacoplada:** Los controles de DevPoints y QAPoints se colocan en columnas adyacentes con inputs tipo `<p-inputnumber>` independientes, reflejando el principio de diseño del producto de no unificar forzadamente las métricas de ambos roles.
4. **Respeto a la Aclaración SDD:** Al haberse aclarado que la entrega inmediata de esta HU es el Backend API, esta especificación visual se preserva como la definición canónica del cliente para cuando se active la implementación del frontend.

### Bloqueos de UX / Consultas para BA:
- **Ninguno.** Todos los campos, tipos permitidos (`[UserStory, Bug, TechEvolution, TechRequirement, TechDebt, Research, Spike]`), límites de datos y flujos de error están completamente alineados con la HU técnica `001-registro-elementos-backlog-multitipo.md` y `spec.md`.

---

## 4. ORDEN DE DELEGACIÓN PARA EL TRACKER

@SA: El diseño visual de la HU 001-registro-elementos-backlog-multitipo ha concluido exitosamente en documents/designer-ux/ux-001-registro-elementos-backlog-multitipo.md. Procede con el tech-design y arquitectura.
