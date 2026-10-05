# 📢 DIRECTIVA DE NEGOCIO PARA @BA (BUSINESS ANALYST): REFACTORIZACIÓN UI

Se ha detectado una severa desviación arquitectónica en el Frontend. Las pantallas generadas actualmente parecen formularios sin formato y violan la directiva "Skeleton vs. Theme" de la Constitución. 
Tu misión es generar una Historia de Usuario (Deuda Técnica) para obligar a los agentes técnicos a calcar el esqueleto de la plantilla base.

---

### 🛠️ TAREAS A EJECUTAR (MODO MÁQUINA)

**1. Actualización del Product Ledger (`specs/README.md`):**
   - N°: `035`.
   - Épica Origen: `Deuda Técnica / UI Core`
   - Nombre spec / HU: `035-HU_refactorizacion_esqueleto_ui`
   - Qué aporta: `Alineación estricta de formularios y layout al Skeleton de PrimeNG exigido por la Constitución`
   - Estado: `BACKLOG`
   - Rama: `feat/XXX-HU_refactorizacion_esqueleto_ui`

**2. Creación del FSaaDB (Documento en `documents/business-analyst/`):**
   - Crea físicamente el archivo `.md` correspondiente (ej. `documents/business-analyst/035-HU_refactorizacion_esqueleto_ui.md`).
   - Dentro del archivo, inyecta EXACTAMENTE el siguiente contenido:

```markdown
# Historia de Usuario: Refactorización de Esqueleto UI (PrimeNG)

## 1. Contexto
Actualmente, los formularios generados en el frontend carecen de estructura de grillas (Grid), presentando campos desalineados y un uso incorrecto de los contenedores. Esto viola la directiva de la Constitución que obliga a calcar la distribución estructural (Skeleton) de la plantilla base ubicada en `./app/template-primeng/`. Es imperativo estandarizar el layout utilizando el sistema de grillas nativo de PrimeNG.

## 2. Actores
- Desarrollador Frontend
- Usuario Final

## 3. Criterios de Aceptación (CA)

- **CA-01 (Auditoría de Plantilla):** El agente desarrollador DEBE leer y analizar el código fuente de los componentes en `./app/template-primeng/` para comprender el uso de las grillas y clases estructurales antes de modificar el proyecto actual.
- **CA-02 (Grilla Responsiva):** Todos los formularios complejos (como el Registro de Elementos) deben ser reescritos usando el sistema de grillas de PrimeNG (ej. `p-fluid`, clases grid/col), distribuyendo de **3 a 4 campos por fila** según dicta la Constitución, y no apilados verticalmente de forma desordenada.
- **CA-03 (Componentes Estándar):** Se debe garantizar el uso exclusivo de componentes PrimeNG (`p-dropdown`, `p-inputText`, `p-textarea`, etc.) con sus correctos *labels* y espaciados (márgenes y paddings).
- **CA-04 (Restricción de Tema):** Está estrictamente prohibido inyectar CSS custom para colores o tipografías. La refactorización es puramente ESTRUCTURAL (Skeleton). El look and feel debe recaer 100% sobre el tema neutral por defecto de PrimeNG.
- **CA-05 (Posicionamiento de Acciones):** Los botones de acción principales (Guardar, Cancelar) deben estar alineados correctamente en la zona inferior derecha del contenedor del formulario o en un *toolbar* flotante, siguiendo el estándar de la plantilla.
```