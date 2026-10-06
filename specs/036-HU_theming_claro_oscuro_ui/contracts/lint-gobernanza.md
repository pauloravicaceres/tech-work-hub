# Contrato: reglas de gobernanza del tema en `lint:primeng`

**Archivo**: `app/frontend/scripts/lint-primeng.mjs`. Cada violación imprime `archivo:línea` y termina con `process.exit(1)`. Se analiza `src/` sin `*.spec.ts` y con comentarios descartados (`stripComments`). Raíz alterna con la variable de entorno `LINT_ROOT`.

| # | Regla | Alcance | Notas |
|---|---|---|---|
| 1 | Literales de color: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `hwb(`, `lab(`, `lch(`, `oklab(`, `oklch(`, `color(` | `.ts/.css/.scss/.html` salvo `src/app/core/theme/app-theme.ts` | En `.html` solo valores de atributo y bloques `<style>` (las referencias `#end`, `#add` no cuentan); `index.html` incluido |
| 2 | Clases de paleta de Tailwind (`bg\|text\|border\|ring\|outline\|fill\|stroke\|from\|via\|to\|divide\|decoration\|accent\|caret\|shadow\|placeholder` + nombre de color, con o sin peldaño, opacidad y variantes) | Atributos de clase y literales `.ts` | — |
| 3 | Estilos de color en línea: `style="…"`, `[style]`, `[style.x]`, `[ngStyle]`, `.style.` con `color\|background\|border\|outline\|shadow\|fill\|stroke` | Todo `src/` | `[style]="{ width: '100%' }"` sigue permitido |
| 4 | Declaraciones de `color`, `background*`, `border*`, `outline*`, `box-shadow`, `text-shadow`, `fill`, `stroke` | `.scss`/`.css` distinto de `src/styles.css` | Los 11 `.scss` actuales son comentarios |
| 5 | Utilidades de color o radio: `bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`, `text-color`, `dark:*`, `rounded*`, `shadow*` | Fuera de `src/app/core/layout/`, solo cuando aparecen como clase (`class`, `styleClass`, `*Class`, `[class.*]`, `[ngClass]`) | Dentro del shell solo se permiten los tokens semánticos con `dark:`; `rounded*` y `shadow*` quedan prohibidos también ahí. `[rounded]="true"` de `p-button` es legítimo |
| 6 | Se conservan: `::ng-deep`, `!important`, `ed-grid`, imports retirados, declaración tipográfica única | — | — |

## Pruebas (`lint-gobernanza.spec.ts`)

- Archivo limpio en `LINT_ROOT` temporal → código 0.
- Violaciones inyectadas, cada una → código ≠ 0 e imprime archivo y línea: `#fff` en `.ts`; `bg-red-500` en `.html`; `style="color: red"`; `.scss` con `border`; `bg-surface-100` en una página; `rounded-lg` en el layout.
- Código real: 0 violaciones, 0 coincidencias de `preline`, 0 importaciones de fuentes externas.
