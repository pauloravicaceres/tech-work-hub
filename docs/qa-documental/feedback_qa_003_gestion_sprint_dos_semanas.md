# REPORTE DE AUDITORÍA QA: RECHAZADO

- **Historia de Usuario Evaluada:** Gestión de Sprint de Dos Semanas (Crear y Consultar)
- **Archivo Fuente Evaluado:** 003-HU_gestion_sprint_dos_semanas.md
- **Fecha de Auditoría:** 04-10-2026
- **Dictamen:** ❌ RECHAZADO (Retorno a Business Analyst para Subsanación)

---

## 1. RESUMEN EJECUTIVO DE NO-CONFORMIDADES
La auditoría se ejecutó en modo Brownfield, contra `pb_tech_work_hub.md` y `.specify/memory/constitution.md`. La HU es sólida en trazabilidad y alcance. Los supuestos están tipificados como `⚠️ [PROPUESTO]`. Los puntos abiertos están catalogados como `❓ No documentado`. El ciclo de vida del Sprint y la relación Sprint–tarjeta quedan fuera de alcance. El ítem de no-regresión está en el DoD de la HU técnica y en la de stakeholders. La aritmética de los límites de SC-04 es correcta bajo el supuesto de 14 días inclusivos.

Dos no-conformidades impiden el paso a la fase técnica. La primera es una contradicción de precondiciones entre el `Background` y SC-07. La segunda es que un comportamiento de la matriz de casos borde (CB-07) no tiene escenario Gherkin ni rama en el diagrama, aunque el DoD declara cubierto el fallo de persistencia y la sección 5 declara una rama por escenario.

---

## 2. TABLA DETALLADA DE HALLAZGOS

| ID Hallazgo | Dimensión Afectada | Gravedad (Bloqueante / Mayor) | Descripción de la No-Conformidad | Evidencia en el Documento | Acción Correctiva Requerida |
|---|---|---|---|---|---|
| H-01 | Consistencia Lógica (Dim. 4) / Testabilidad (Dim. 2) | Bloqueante | El `Background` se ejecuta antes de cada escenario del Feature. Declara un usuario autenticado con token válido, y SC-07 parte de una solicitud sin token o con token inválido o expirado. Las precondiciones se contradicen, así que SC-07 no puede convertirse en un caso de prueba binario tal como está escrito. | §2.2: `Background: Given un usuario autenticado con un token válido` frente a `Scenario Outline: SC-07 ... Given una solicitud sin token o con un token inválido o expirado`. | Eliminar la contradicción entre `Background` y SC-07. SC-07 debe quedar con precondiciones coherentes y no heredar una autenticación válida. Mantener intactos los demás escenarios. |
| H-02 | Cobertura BDD (Dim. 3) / Consistencia con el diagrama (Dim. 4) | Mayor | CB-07 define un comportamiento verificable ante fallo de persistencia: no queda Sprint parcial y no se exponen trazas, con HTTP 500. No existe escenario Gherkin ni rama en el diagrama que lo respalde. El DoD afirma que la matriz cubre el fallo de persistencia y §5 afirma "Cada rama `alt` corresponde a un escenario". Un comportamiento exigido en la matriz sin escenario no es testeable ni trazable. | §3 fila CB-07 frente a los escenarios SC-01..SC-07 (ninguno lo cubre) y al `sequenceDiagram` de §5 (sin rama de error de persistencia). | Resolver la inconsistencia entre CB-07, la sección 2.2 y el diagrama. Si CB-07 es un requisito de la HU, debe tener escenario y rama de diagrama, tipificado como `⚠️ [PROPUESTO]`. Si no lo es, debe reclasificarse en la matriz como `❓ No documentado`, como se hizo con CB-08 a CB-11. |

---

## 3. AUDITORÍA ESPECÍFICA DE CRITERIOS GHERKIN (BDD)
- **Happy Path:** Conforme. SC-01, SC-02 y SC-03 tienen resultados específicos y verificables.
- **Sad Paths / Edge Cases:** Insuficiente. Existen SC-04 a SC-07 con cobertura amplia de ventana y de datos obligatorios, pero SC-07 es inconsistente con el `Background` (H-01) y el fallo de persistencia de CB-07 no tiene escenario (H-02).

---

## 4. DIRECTIVA DE SUBSANACIÓN PARA EL BA
Estimado Business Analyst: procede a editar el archivo `003-HU_gestion_sprint_dos_semanas.md` resolviendo puntualmente las acciones correctivas listadas en la sección 2. Mantén intactos los criterios y secciones lógicas que no fueron observadas. Si la corrección altera los escenarios, sincroniza también la versión de stakeholders en `HUs-stakeholders/003-HU_gestion_sprint_dos_semanas.md`. Al finalizar, actualiza el tracker delegando nuevamente la auditoría al QA.
