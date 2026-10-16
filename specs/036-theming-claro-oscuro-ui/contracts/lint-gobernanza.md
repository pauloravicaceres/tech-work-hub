# Contrato: reglas de gobernanza del tema en `lint:primeng`

**Archivo**: `app/frontend/scripts/lint-primeng.mjs`. Cada violación imprime `archivo:línea` y termina con `process.exit(1)`. Se analiza `src/` sin `*.spec.ts` y con comentarios descartados (`stripComments`). Raíz alterna con la variable de entorno `LINT_ROOT`.

| # | Regla | Alcance | Notas |
|---|---|---|---|
| 1 | Literales de color: hexadecimales `#` + 3, 4, 6 u 8 dígitos hex + `\b`, y las funciones `rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color` con la expresión `(?<![\w$.-])(?:rgba?\|hsla?\|hwb\|lab\|lch\|oklab\|oklch\|color)\(` | `.ts/.css/.scss/.html` salvo `src/app/core/theme/app-theme.ts` | **Límite de palabra obligatorio**: `getColor(`, `.color(` y `data-color(` no disparan la regla. En `.html` solo valores de atributo y bloques `<style>` (las referencias `#end`, `#add` no cuentan); `index.html` incluido |
| 2 | Clases de paleta de Tailwind (`bg\|text\|border\|ring\|outline\|fill\|stroke\|from\|via\|to\|divide\|decoration\|accent\|caret\|shadow\|placeholder` + nombre de color, con o sin peldaño, opacidad y variantes) | Atributos de clase y literales `.ts` | — |
| 3 | Estilos de color en línea sobre **propiedades concretas**: en `style="…"`, `[style]`, `[style.x]`, `[ngStyle]` las propiedades `color`, `background*`, `border*`, `outline*`, `box-shadow`, `text-shadow`, `fill`, `stroke`, `accent-color`, `caret-color`; en `.ts` e `index.html` las asignaciones `\.style\.(?:color\|background\w*\|border\w*\|outline\w*\|boxShadow\|textShadow\|fill\|stroke\|accentColor\|caretColor)\b` y `setProperty`/`setStyle` con esos nombres | Todo `src/` | **`color-scheme` / `style.colorScheme` está exento** (el `\b` tras `color` impide la coincidencia): es lo único que `ThemeService.apply()` y el script de `index.html` escriben. `[style]="{ width: '100%' }"` sigue permitido |
| 4 | Declaraciones de `color`, `background*`, `border*`, `outline*`, `box-shadow`, `text-shadow`, `fill`, `stroke` | `.scss`/`.css` distinto de `src/styles.css` | Los 11 `.scss` actuales son comentarios |
| 5 | Utilidades de color o radio: `bg-surface-*`, `text-surface-*`, `border-surface-*`, `bg-primary`, `text-primary`, `text-muted-color`, `text-color`, `dark:*`, `rounded*`, `shadow*` | Fuera de `src/app/core/layout/`, solo cuando aparecen como clase (`class`, `styleClass`, `*Class`, `[class.*]`, `[ngClass]`) | Dentro del shell solo se permiten los tokens semánticos con `dark:`; `rounded*` y `shadow*` quedan prohibidos también ahí. `[rounded]="true"` de `p-button` es legítimo |
| 6 | Se conservan: `::ng-deep`, `!important`, `ed-grid`, imports retirados, declaración tipográfica única | — | — |

## Pruebas (`lint-gobernanza.spec.ts`)

- Archivo limpio en `LINT_ROOT` temporal → código 0.
- Violaciones inyectadas, cada una → código ≠ 0 e imprime archivo y línea: `#fff` en `.ts`; `bg-red-500` en `.html`; `style="color: red"`; `el.style.color = 'red'` en `.ts`; `.scss` con `border`; `bg-surface-100` en una página; `rounded-lg` en el layout.
- Casos que **no** deben fallar: `document.documentElement.style.colorScheme = 'dark'` (en `.ts` y en `index.html`); `getColor(x)` y `.color(` en `.ts`; `#end` y `#add` como referencias de plantilla en `.html`; `[style]="{ width: '100%' }"`; `[rounded]="true"`.
- **El código real NO se comprueba en esta spec** (solo directorios temporales): la comprobación de 0 violaciones, 0 coincidencias de `preline` y 0 importaciones de fuentes externas se ejecuta en la verificación final (T043/T044), tras la limpieza de T037 y T038.
