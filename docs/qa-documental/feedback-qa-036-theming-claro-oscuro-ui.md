# REPORTE DE AUDITORÍA QA: RECHAZADO

- **Historia de Usuario Evaluada:** Theming de la Aplicación — Modo Claro y Oscuro (PrimeNG 22)
- **Archivo Fuente Evaluado:** 036-theming-claro-oscuro-ui.md
- **Fecha de Auditoría:** 06-10-2026 (segunda ronda)
- **Dictamen:** ❌ RECHAZADO (Retorno a Business Analyst para Subsanación)

---

## 1. RESUMEN EJECUTIVO DE NO-CONFORMIDADES
Los hallazgos H-01 a H-05 de la primera ronda quedaron subsanados conforme a la decisión humana registrada (opción A en los cuatro).
- **H-01:** la tabla E-01 a E-09 enumera los pares exactos y CA-03 y RT-08 la referencian.
- **H-02:** CA-06 separa los roles 1 a 8, comparados con la maqueta, del rol 9, comparado con la tabla.
- **H-03:** CA-01.1 lleva la etiqueta `⚠️ [PROPUESTO]`.
- **H-04:** CA-02 define la etiqueta blanca del botón oscuro.
- **H-05:** la decisión humana de mantener una sola HU consta en la sección 1.

La ampliación de excepciones (E-03 a E-09) frente a la lista de dos de la Constitución se declara de forma transparente (punto abierto 7, `⚠️ [PROPUESTO]`, aprobada por el humano, ratificación pendiente). No se trata como hallazgo, pero queda como condición de arrastre, ver sección 4.

Persiste una no-conformidad nueva, introducida en la subsanación. La excepción E-02 declara un ratio de 2.60:1 para "Ambos" modos. Ese ratio solo es posible sobre fondo blanco, es decir, en modo claro. En modo oscuro, `#99a1af` sobre cualquier superficie del tema mide al menos 3.96:1. RT-08 exige que "cada par de la tabla coincida con su ratio declarado", por lo que esa prueba falla por construcción en modo oscuro.

---

## 2. TABLA DETALLADA DE HALLAZGOS

| ID Hallazgo | Dimensión Afectada | Gravedad (Bloqueante / Mayor) | Descripción de la No-Conformidad | Evidencia en el Documento | Acción Correctiva Requerida |
|---|---|---|---|---|---|
| H-06 | 4. Consistencia Lógica / 3. Resultados específicos | Mayor | E-02 declara modo "Ambos" con un único ratio 2.60:1 para el marcador de posición `#99a1af` "sobre el fondo del campo". El valor 2.60:1 corresponde a fondo blanco (modo claro). La HU no define el fondo del campo en modo oscuro; con las superficies oscuras del tema el ratio sería mucho mayor. CA-03 dice que los pares se miden "con el ratio indicado en cada modo" y RT-08 exige coincidencia con el ratio declarado, así que el criterio es inconsistente y no verificable en modo oscuro. | Sección 7, tabla de excepciones, fila E-02 (`Ambos`, `2.60:1`). CA-03: "el texto de marcador de posición `#99a1af` (2.60:1)". RT-08: "cada par de la tabla coincide con su ratio declarado". | Resolver la ambigüedad de E-02 para que cada modo tenga un par y un ratio determinables (fondo del campo y ratio por modo). Si el par oscuro no requiere excepción o su fondo no está documentado, tipificarlo según corresponda (`⚠️ [PROPUESTO]` o `❓ No documentado`). Ajustar CA-03 de forma coherente. |

---

## 3. AUDITORÍA ESPECÍFICA DE CRITERIOS GHERKIN (BDD)
- **Happy Path:** Conforme — CA-01, CA-01.1, CA-01.2, CA-02 (con la etiqueta del botón oscuro), CA-02.1, CA-02.2, CA-04, CA-04.2, CA-05 y CA-06 son sintácticamente canónicos y medibles.
- **Sad Paths / Edge Cases:** Conforme — CA-02.3, CA-02.4, CA-03.1, CA-04.1, CA-05.1, CA-06.1 y la matriz CB-01 a CB-07 cubren los fallos. Observado: la verificabilidad de CA-03 en modo oscuro depende de H-06.

---

## 4. DIRECTIVA DE SUBSANACIÓN PARA EL BA
Estimado Business Analyst: procede a editar el archivo `036-theming-claro-oscuro-ui.md` resolviendo puntualmente H-06. Mantén intactos los criterios y secciones lógicas que no fueron observadas. Si la corrección de E-02 exige un dato que no está en las fuentes, solicítalo al humano en lugar de asumirlo.

Condición de arrastre, no es un hallazgo: la Constitución sigue listando solo dos excepciones de contraste (E-01 y E-02) mientras la HU enumera nueve. La sección 7 dice que prevalece la Constitución, por lo que el punto abierto 7 requiere ratificación humana en la Constitución antes del cierre de la HU. Al finalizar, actualiza el tracker delegando nuevamente la auditoría al QA.
