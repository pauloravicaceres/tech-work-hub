# Data Model: Theming claro/oscuro (HU-036)

No hay entidades de base de datos. El modelo es de estado de cliente y de configuración de tema.

## ThemeMode (Modo de tema)

- **Tipo**: `'light' | 'dark'` (constante `THEME_MODES`).
- **Derivación**: `mode = choice() ?? (systemDark() ? 'dark' : 'light')`.
- **Proyección al DOM**: clase `app-dark` en `<html>` y `style.colorScheme` (`'dark'` | `'light'`). Nunca es fuente de verdad.

## ThemeChoice (Elección del usuario)

- **Almacenamiento**: `localStorage['app-theme-mode']` (constante `THEME_STORAGE_KEY`); por navegador, no por cuenta.
- **Estados**: ausente · `light` · `dark` · inválido (cualquier otro valor) · inaccesible (excepción al leer/escribir).
- **Reglas**: valor inválido o inaccesible equivale a ausente (`null`) sin error ni borrado; solo `toggle()` escribe.

## Transiciones de estado

| Estado actual | Evento | Resultado |
|---|---|---|
| Sin elección | `change` de `prefers-color-scheme` | `systemDark` se actualiza; se reaplica el modo |
| Con elección válida | `change` de `prefers-color-scheme` | Se ignora |
| Cualquiera | `toggle()` | `choice` = modo contrario al efectivo; intenta guardar (fallo silencioso); `apply()` síncrono |
| Almacenamiento roto | `toggle()` | `choice` queda en memoria; el conmutador funciona durante la sesión |

## ThemeToken (Token de tema)

- **Campos**: rol, valor claro, valor oscuro, token PrimeNG que lo implementa.
- **Roles (9)**: primario · fondo de página · tarjeta/navegación/barra/pie · borde y separador · navegación activa · texto principal · texto secundario · peligro · texto de enlace. Valores en `spec.md` (Tabla de tokens) y en el mapeo de ADR-003.
- **Radios**: contenedores `0.75rem`, controles y botones `0.5rem`; `menubar` y `menu` `0`.
- **Fuente única**: `app/frontend/src/app/core/theme/app-theme.ts` (`appThemePreset`).

## ContrastPair (Par de contraste)

- **Campos**: `rol`, `modo`, `primerPlano`, `fondo`, `tipo` (`texto` ≥ 4.5 | `componente` ≥ 3), `excepcion?: { id, ratio }`.
- **Reglas**: sin excepción cumple el umbral; con excepción el ratio medido coincide con el declarado (±0.01); la tabla de pares cubre todos los roles de texto y de control.
- **Excepciones**: E-01..E-09 (spec.md). El borde de campo de formulario **no** usa E-08/E-09 (ADR-012): cumple ≥ 3:1.

## EvidenceCapture (Captura de evidencia)

- **Campos**: módulo (`backlog` | `sprints` | `equipo`), modo (`claro` | `oscuro`), ancho 1920 px.
- **Archivo**: `specs/036-HU_theming_claro_oscuro_ui/evidence/{modulo}-{modo}.png`; 6 en total, cada una con barra superior (con conmutador), navegación, contenido y pie.
