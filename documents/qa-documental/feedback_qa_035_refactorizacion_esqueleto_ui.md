# REPORTE DE AUDITORÍA QA: RECHAZADO

- **Historia de Usuario Evaluada:** Refactorización de Esqueleto UI — Layout de Aplicación y Tipografía Global (PrimeNG 22)
- **Archivo Fuente Evaluado:** 035-HU_refactorizacion_esqueleto_ui.md
- **Fecha de Auditoría:** 05-10-2026 (tercera auditoría; reemplaza el reporte de la anterior)
- **Dictamen:** ❌ RECHAZADO (Retorno a Business Analyst para Subsanación)

---

## 1. RESUMEN EJECUTIVO DE NO-CONFORMIDADES
Verificación de los hallazgos vigentes de la segunda auditoría contra el texto actual de la HU:

- **H-04 (Atomicidad): RESUELTO.** La HU se acotó a layout de aplicación y tipografía global por decisión humana (opción 1), verificada en el tracker (entrada HUMANO, estado APPROVE). Las HU derivadas quedan descritas en la sección 8 sin crear filas en el Ledger.
- **H-10 (RT-03 vs. CA-04): RESUELTO.** La regla de columnas (1, 2, 3 y 4 por fila) y las clases de grilla quedaron en una única definición coherente en la HU derivada de grilla (sección 8). La HU 035 ya no contiene el criterio de grilla.
- **H-11 (valores verificables): RESUELTO.** CA-01.3 fija ancho máximo 1280 px y espaciado 1.5 rem, tipificados `⚠️ [PROPUESTO]`, con criterio Pasa/Falla y restricción RT-02 trazable.

Las demás dimensiones se mantienen conformes: Gherkin con Happy Path y Sad Paths/Edge Cases, DoD con ítem de no-regresión Brownfield, `Requiere interfaz: Sí`, narrativa Como/Quiero/Para y cuerpo de los CA sin polución técnica.

Se detecta una omisión nueva, introducida por la partición: un requisito de la directiva quedó sin dueño (H-12). Mientras no se asigne, la trazabilidad hacia `app/skeleton.md` no es completa.

---

## 2. TABLA DETALLADA DE HALLAZGOS

| ID Hallazgo | Dimensión Afectada | Gravedad (Bloqueante / Mayor) | Descripción de la No-Conformidad | Evidencia en el Documento | Acción Correctiva Requerida |
|---|---|---|---|---|---|
| H-12 | Trazabilidad y Alcance | Mayor | La directiva (CA-10 de `app/skeleton.md`) exige una captura por cada pantalla del alcance, a 1920 px y a 768 px. La HU 035 la reduce a una pantalla por módulo (CA-10) y la sección 2 declara excluida "su verificación", pero ninguna de las cuatro HU derivadas de la sección 8 absorbe la captura por cada pantalla. El requisito original queda sin dueño y se pierde silenciosamente. | Sección 2 ("Excluido… y su verificación"), CA-10 (sección 3.3) y tabla de la sección 8 (sin fila de verificación; CA-10 no figura en "Criterios originales que absorbe"). | Asignar explícitamente el requisito de captura por cada pantalla a una HU derivada (o añadir una fila de verificación en la sección 8) y registrar la reducción a una pantalla por módulo en 035 como decisión trazable o punto abierto. |

---

## 3. AUDITORÍA ESPECÍFICA DE CRITERIOS GHERKIN (BDD)
- **Happy Path:** Conforme — CA-01, CA-01.3, CA-06 y CA-10 siguen la sintaxis Dado/Cuando/Entonces con resultados verificables.
- **Sad Paths / Edge Cases:** Conforme — CA-01.1, CA-01.2, CA-06.1 y CA-10.1, tipificados `⚠️ [PROPUESTO]`, con matriz CB-01 a CB-05 coherente con los escenarios.

---

## 4. DIRECTIVA DE SUBSANACIÓN PARA EL BA
Estimado Business Analyst: procede a editar el archivo `035-HU_refactorizacion_esqueleto_ui.md` resolviendo puntualmente la acción correctiva de H-12 listada en la sección 2. Mantén intactos los criterios y secciones lógicas que no fueron observadas. Si el cambio altera lo decidido por el humano, regístralo como punto abierto. Al finalizar, actualiza el tracker delegando nuevamente la auditoría al QA.

**Observación no bloqueante para el product-manager:** la fila 035 del Ledger (`specs/README.md`) aún describe "estructura de páginas y formularios" en "Qué aporta", lo que ya no coincide con el alcance acotado de esta HU. Debe actualizarse al registrar las HU derivadas.
