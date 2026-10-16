# REPORTE DE AUDITORÍA QA: RECHAZADO

- **Historia de Usuario Evaluada:** Pruebas de Integración contra Keycloak Real y Catálogo Real del Módulo Application
- **Archivo Fuente Evaluado:** 002-pruebas-integracion-keycloak-y-catalogo-application.md
- **Fecha de Auditoría:** 03-10-2026
- **Dictamen:** ❌ RECHAZADO (Retorno a Business Analyst para Subsanación)

---

## 1. RESUMEN EJECUTIVO DE NO-CONFORMIDADES
La auditoría se ejecutó en modo Brownfield (existe `.specify/memory/constitution.md`) contra `pb-tech-work-hub.md`. Hay conformidad con el ecosistema preexistente: Keycloak con JWT Bearer, schemas aislados y sin queries cross-schema, y el DoD incluye el ítem de respeto al ecosistema. Los supuestos principales (tipo, prioridad, idempotencia, catálogo vacío) están tipificados, y los vacíos sobre realm, semilla y política ante Keycloak caído se declaran como `❓ No documentado`, lo cual es válido.

Aun así, la historia incumple la rúbrica en tres puntos: (1) no es atómica, porque mezcla la verificación de autenticación, la consulta del catálogo, el registro de un ítem y la creación de una semilla de datos; (2) el diagrama de secuencia no refleja uno a uno los flujos de los Criterios de Aceptación (omite SC-06 y CB-05, y fusiona SC-01 y SC-02); (3) hay hechos de comportamiento y un actor que no figuran en el Product Brief ni están etiquetados. Adicionalmente, SC-04 agrupa varios casos disyuntivos en un único escenario, lo que debilita su testabilidad binaria.

---

## 2. TABLA DETALLADA DE HALLAZGOS

| ID Hallazgo | Dimensión Afectada | Gravedad (Bloqueante / Mayor) | Descripción de la No-Conformidad | Evidencia en el Documento | Acción Correctiva Requerida |
|---|---|---|---|---|---|
| H-01 | 2. Atomicidad e INVEST (Small) | Bloqueante | La HU abarca más de una transacción de negocio: consulta del catálogo (SC-01), registro de un ítem de backlog (SC-02/SC-03), rechazo de credenciales (SC-04/SC-05) y creación de una semilla de datos con idempotencia (SC-06). La semilla es una capacidad propia, con preguntas abiertas propias (contenido, alcance test vs. entornos reales). La matriz de decisión exige rechazo si mezcla más de una transacción básica. | §2.2 SC-01, SC-02, SC-06; §6 Puntos Abiertos 2 y 4. | Particionar la historia: separar la semilla reproducible del catálogo (SC-06, CB-05, CB-07, puntos abiertos 2 y 4) de la verificación contra Keycloak real y catálogo real, o justificar con evidencia documental por qué constituyen una única transacción indivisible. Indicar al PM si la partición exige nuevas filas en el Ledger. |
| H-02 | 4. Consistencia Lógica (Diagramación) | Mayor | El diagrama de secuencia no coincide uno a uno con los CA. Muestra la semilla una sola vez, mientras SC-06 exige dos ejecuciones consecutivas. No representa el catálogo vacío (CB-05). Fusiona en una sola rama "Happy Path" los flujos GET (SC-01) y POST (SC-02), que son escenarios independientes. El DoD afirma que el diagrama "refleja con fidelidad el flujo de Happy y Sad Path". | §5 `sequenceDiagram` (paso 1 y rama `alt`) vs. §2.2 SC-06 y §3 CB-05. | Alinear el diagrama con los escenarios que permanezcan en la HU tras la subsanación de H-01: un flujo por escenario o, en su defecto, una nota explícita de qué escenarios no se diagraman. |
| H-03 | 3. Cobertura BDD / Testabilidad | Mayor | SC-04 agrupa en un solo escenario tres condiciones (sin cabecera, firma alterada, token expirado) y dos endpoints mediante "o". Un escenario con disyunciones en `Cuando` no se traduce a un único caso binario. Además, CB-02 prevé "emisor distinto al configurado" y ningún escenario Gherkin lo cubre. | §2.2 SC-04 (`When ... sin cabecera Authorization, con un token con firma alterada o con un token expirado`); §3 CB-02. | Expresar cada condición como escenario independiente o como esquema del escenario con tabla de ejemplos, y cubrir "emisor distinto" o retirarlo de la matriz. |
| H-04 | 1. Trazabilidad y Alcance | Mayor | Comportamientos presentados como hecho sin etiqueta ni fuente en el Product Brief: respuesta "ordenada por nombre, con `id` y `name`" (SC-01). Solo SC-05 declara verificación contra código; la fuente de SC-01 son las preguntas del Code Review, que no establecen ese orden ni ese contenido. | §2.2 SC-01 Then; nota bajo §2.2 ("SC-01..SC-04 derivan de las preguntas 1 y 3 del Code Review"). | Citar la fuente verificable (documento o código) del orden y de los campos, o etiquetarlos `⚠️ [PROPUESTO]`. |
| H-05 | 1. Trazabilidad y Alcance (Actores) | Mayor | La versión de stakeholders introduce el actor "Product Owner" como autor de la HU y audiencia. El Product Brief define como actores al Líder Técnico, Desarrolladores, Analistas/Ingenieros de QA, Usuarios Reportantes y Administrador de Plataforma; "Product Owner" no existe y no está etiquetado. La HU técnica usa "Líder Técnico o Miembro del Equipo de Desarrollo/QA". Las dos versiones difieren en el actor. El mismo patrón existe en HU-001, pero eso no sustituye la fuente de la verdad. | `HUs-stakeholders/002-...md` líneas 5 y 10 vs. `pb-tech-work-hub.md` §2. | Sustituir por un actor del Product Brief o etiquetar `⚠️ [PROPUESTO]`, y unificar el actor entre ambas versiones. |

---

## 3. AUDITORÍA ESPECÍFICA DE CRITERIOS GHERKIN (BDD)
- **Happy Path:** Conforme — SC-01, SC-02 y SC-06 describen resultados específicos y observables. Se observa el uso de `❓ No documentado` dentro de un `Given` (SC-01), lo cual es válido porque está declarado.
- **Sad Paths / Edge Cases:** Insuficiente — SC-03 y SC-05 son correctos. SC-04 es un escenario compuesto (ver H-03). CB-02 (emisor distinto), CB-05 (catálogo vacío), CB-06 (Keycloak no disponible) y CB-07 solo existen en la matriz, sin escenario Gherkin. CB-05 y CB-07 están etiquetados `⚠️ [PROPUESTO]` y CB-06 está catalogado como `❓ No documentado`, por lo que esas omisiones no son bloqueantes por sí mismas.

**Aspectos conformes verificados:** respeto de las restricciones brownfield (Keycloak v24+, schemas aislados, sin cross-schema); ítem de respeto al ecosistema en el DoD; independencia respecto de HU-001 (fusionada); ausencia de dobles de prueba como requisito explícito; puntos abiertos catalogados sin inventar reglas. La presencia de endpoints, claims y nombres de clases en la HU técnica se acepta bajo la Estrategia Dual-Output, porque la versión de stakeholders está libre de jerga de implementación; este punto no genera hallazgo.

---

## 4. DIRECTIVA DE SUBSANACIÓN PARA EL BA
Estimado Business Analyst: procede a editar el archivo `002-pruebas-integracion-keycloak-y-catalogo-application.md` (y su versión de stakeholders, para H-05) resolviendo puntualmente las acciones correctivas listadas en la sección 2. Mantén intactos los criterios y secciones lógicas que no fueron observadas. Al finalizar, actualiza el tracker delegando nuevamente la auditoría al QA.
