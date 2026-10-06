# REPORTE DE AUDITORÍA ADVERSARIAL Y RECHAZO TÉCNICO ❌ (Re-auditoría 1)

- **Fecha de Auditoría:** 06-10-2026
- **Archivos Auditados:** `documents/solutions-architect/036-HU_theming_claro_oscuro_ui.md` (corregido), `documents/data-architect/db_036_theming_claro_oscuro_ui.md`, `documents/designer-ux/ux_036_theming_claro_oscuro_ui.md`, `specs/036-HU_theming_claro_oscuro_ui/` (`tasks.md`, `contracts/lint-gobernanza.md`, `plan.md`) y `.specify/memory/constitution.md` (Brownfield)
- **API:** No existe `api_*.md` (solo frontend, FR-019).
- **Dictamen:** ❌ RECHAZADO (Requiere Subsanación Agéntica)

---

## 1. MATRIZ DE HALLAZGOS ADVERSARIALES

| Nivel de Severidad | Componente / ADR Afectado | Descripción del Hallazgo y Riesgo Técnico | Agente Responsable |
|---|---|---|:---:|
| 🔴 **CRÍTICO** | Violación de Gobernanza (Lex Superior): E-03 a E-09, `text-color`, `sr-only` | **Único bloqueo vigente en la Re-auditoría 2; sin cambios respecto de la primera auditoría.** `constitution.md` línea 128 sigue listando solo E-01 y E-02; no existe enmienda física ni Cláusula de Excepción. La aprobación del tracker no deroga la Constitución. El SA lo declaró fuera de su jurisdicción. Mientras no se ratifique, T032 y `app-theme.ts` contradicen la Lex Superior. | `@SA:` (enmienda humana, ver §4) |
| ✅ Subsanado (Re-auditoría 2, verificado en disco: contrato con regla 3 por propiedades y `colorScheme` exento, regla 1 con límite de palabra, T008/T018 con ADR-012, T034 con casos positivos y negativos, aserción de código real en T043) | `specs/036-.../tasks.md` y `contracts/lint-gobernanza.md` (hallazgo previo) | El ADR-009 del SA ya redefine la regla 3 (propiedades concretas, `colorScheme` exento) y exige límite de palabra en la regla 1, pero **los artefactos SDD que consume el desarrollador no se regeneraron**: `contracts/lint-gobernanza.md` conserva la regla 3 original (`.style.` con `color\|background…`, que rechaza `style.colorScheme`) y la regla 1 sin límite de palabra; `tasks.md` T034 conserva la aserción "código real 0 violaciones" (falla hasta T037/T038) y no incluye los casos "no debe fallar / debe fallar" de `colorScheme`; T008/T018 no incorporan explícitamente `formField.borderColor` de ADR-012. El `/speckit.analyze` posterior al congelamiento no corrigió los archivos (`git diff -- specs` vacío). El desarrollador implementaría contra un contrato que reproduce el defecto crítico ya señalado. Zero-Trust: se audita el artefacto ejecutable, no la declaración del SA. | `@SA:` |
| ✅ Subsanado | ADR-009 (regla 3 y regla 1), ADR-012, alternativas de ADR-009/011, aserción de código real | Verificado en el documento del SA: regla 3 por propiedades concretas con `colorScheme` fuera; ADR-012 incluido en Task-THEME-01/04; alternativas reemplazadas; aserción de código real movida a la verificación final. | — |
| 🟡 **ADVERTENCIA** | ADR-006 | Script en línea en `<head>`: una CSP futura lo bloquearía; lógica duplicada con control por spec de paridad (T028). Se registra como Deuda Técnica. | Informar |
| 🟢 **SUGERENCIA** | ADR-005 / ADR-003 | Documentar la coincidencia script/servicio ante valor inválido; añadir aserción de inventario de tokens de Aura en T005. | Informar |

---

## 2. CRITERIOS ADVERSARIALES ESTRICTOS (Detector de Mentiras y Calidad)
- **Alternativa Falsa:** tecnología absurda o "No hacer nada".
- **Trade-off Falso:** justificaciones cosméticas sin costo de infraestructura, latencia, concurrencia, acoplamiento o cuello de botella.
- **Complacencia Ilegal (Sycophancy):** el tracker carece de facultades derogatorias; toda petición sin Cláusula de Excepción física es nula.

---

## 3. CHECKLIST DE VERIFICACIÓN FALLIDA
- [ ] Falsas Alternativas en ADRs: sin hallazgo.
- [ ] Omisión o Falsedad en Trade-offs: sin hallazgo.
- [ ] Desconexión UI vs Data: sin hallazgo.
- [ ] Desproporción Arquitectónica: sin hallazgo.
- [ ] Inconsistencia DB vs API: no aplica.
- [x] **Artefactos SDD (`tasks.md`, `contracts/`) inconsistentes con el diseño corregido:** 🔴.
- [x] **Complacencia Ilegal / Lex Superior sin enmienda física (E-03..E-09):** 🔴.

---

## 4. ORDEN DE REPARACIÓN EN TRACKER

1. `@SA:` solicitar la regeneración real de `tasks.md` y `contracts/lint-gobernanza.md` (y `contracts/theme-service.md` si aplica) desde el documento corregido, y verificar en disco: regla 3 por propiedades con `colorScheme` exento; regla 1 con límite de palabra; T034 con los casos `style.colorScheme = 'dark'` (no falla) y `el.style.color = 'red'` (falla) y sin la aserción de código real; T008/T018 con `formField.borderColor`/`hoverBorderColor` de ADR-012; aserción de código real en T043.
2. **Humano:** ratificar en `.specify/memory/constitution.md`, Theme Visual, "Contraste": *"Excepciones aceptadas (ratificadas por el humano el 06-10-2026, H-01 y H-04, opción A): E-01 a E-09 según la tabla de la HU 036; E-08 y E-09 aplican solo a separadores y contornos decorativos, nunca al único indicador de un control o de su estado. Utilidades adicionales permitidas en `LayoutComponent`: `text-color` y `sr-only` (esta solo en la región de anuncio del conmutador)."* El QT no se autoriza a derogar la Constitución.

`@SA: Se ha emitido feedback adversarial crítico en documents/qa-tech/feedback_tech_036_theming_claro_oscuro_ui.md. Por favor, subsana las inconsistencias señaladas para proceder con la re-auditoría.`
