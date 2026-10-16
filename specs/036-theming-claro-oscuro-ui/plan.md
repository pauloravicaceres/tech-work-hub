# Implementation Plan: Theming de la Aplicación — Modo Claro y Oscuro

**Branch**: `036-theming-claro-oscuro-ui` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/036-theming-claro-oscuro-ui/spec.md`

## Summary

Capa de presentación pura (sin backend). Se reemplaza el preset Aura sin personalizar por un preset propio (`definePreset(Aura, …)`) con la paleta y los radios de las maquetas en modo claro y oscuro; se añade un `ThemeService` basado en signals que alterna la clase `app-dark` en `<html>`, persiste la elección en `localStorage` y sigue `prefers-color-scheme`; se añade un conmutador accesible en la barra superior del shell; un script síncrono en `index.html` evita el parpadeo; y `lint:primeng` incorpora reglas que rechazan colores fuera de `app-theme.ts`. Decisiones técnicas: ver [research.md](./research.md) y los ADR-001..012 de `documents/solutions-architect/036-theming-claro-oscuro-ui.md`.

## Technical Context

**Language/Version**: TypeScript ~6.0, Angular 22.2 (Zoneless + Signals)

**Primary Dependencies**: PrimeNG 22.1.2, `@primeuix/themes` 3.0.1 (`definePreset`, Aura), Tailwind CSS 4.3.3 + `tailwindcss-primeui` 0.6.1, PrimeIcons. Sin paquetes nuevos.

**Storage**: `localStorage` del navegador (clave `app-theme-mode`, valores `light` | `dark`). Sin base de datos ni backend.

**Testing**: Jest 30 + `jest-preset-angular` (zoneless), jsdom. Verificación estática con `npm run lint:primeng`; compilación con `npm run build`.

**Target Platform**: SPA en navegadores modernos de escritorio y tablet (verificación a 1920 px y 768 px).

**Project Type**: web-application (solo `app/frontend/`).

**Performance Goals**: cambio de modo percibido como inmediato (síncrono, sin recarga, sin remontar el shell); modo correcto aplicado antes del primer pintado.

**Constraints**: colores literales solo en `app-theme.ts`; sin `::ng-deep`, `!important`, sombras personalizadas ni fuentes externas; no tocar `app/backend`, `app/template-primeng`, `specs/evidences`, rutas ni `core/auth`.

**Scale/Scope**: 3 pantallas existentes (Backlog, Sprints, Equipo) + shell; 2 modos; 9 roles de token; 9 excepciones de contraste.

Sin `NEEDS CLARIFICATION` pendientes (ver research.md).

## Constitution Check

*GATE: pasa antes de Phase 0; reevaluado tras Phase 1.*

| Regla de la Constitución | Estado | Evidencia |
|---|---|---|
| Idioma español en todo entregable | ✅ | Artefactos en español |
| Rutas físicas con prefijo `app/frontend/` | ✅ | Estructura abajo |
| Stack: Angular 22 Zoneless + Signals, PrimeNG 22, Tailwind v4 | ✅ | `ThemeService` con signals, sin Zone |
| Skeleton vs. Theme: excepción acotada "Theme Visual (HU-036)" | ✅ | Paleta/radios/modo solo según la enmienda |
| Fuente única de tokens `core/theme/app-theme.ts`; `styles.css` solo `@custom-variant dark` + tipografía única | ✅ | Ver estructura |
| `darkModeSelector: '.app-dark'`, clave `app-theme-mode`, conmutador en topbar | ✅ | ADR-004/005/008 |
| Color en componentes solo con tokens semánticos y `dark:`, solo en `LayoutComponent` | ✅ | ADR-007, regla 5 de lint |
| Prohibidos literales fuera del tema, clases de paleta, estilos inline, `::ng-deep`, `!important`, `.scss` con color/borde/sombra | ✅ | Reglas de lint (contracts/lint-gobernanza.md) |
| `lint:primeng` incorpora reglas del tema | ✅ | Tarea de gobernanza |
| Backend sin cambios | ✅ | FR-019 |
| Patrón de formularios PrimeNG 22 | ✅ | No se alteran formularios; solo se retira una utilidad de color |

**Puntos abiertos que NO bloquean el plan** (jurisdicción humana, research.md §R-10): ratificación de E-03..E-09 y del enlace `#007595` en la Constitución (hoy solo lista E-01 y E-02 y prevalece); borde de campo ≥ 3:1 (ADR-012); utilidad `sr-only` no listada en la enmienda.

**Re-evaluación post-diseño**: sin violaciones nuevas. Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/036-theming-claro-oscuro-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── theme-service.md
│   ├── lint-gobernanza.md
│   └── shell-conmutador.md
├── evidence/            # 6 capturas {modulo}-{modo}.png (se crean en la implementación)
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
app/frontend/
├── scripts/lint-primeng.mjs                 # reglas de gobernanza del tema; admite LINT_ROOT
└── src/
    ├── index.html                           # <meta color-scheme> + script síncrono anti-parpadeo en <head>
    ├── styles.css                           # SOLO se añade @custom-variant dark
    └── app/
        ├── app.config.ts                    # appThemePreset + darkModeSelector + initializer del tema (antes del de Auth)
        ├── core/
        │   ├── theme/
        │   │   ├── app-theme.ts             # ÚNICO archivo con colores; preset + escalas explícitas
        │   │   ├── app-theme.spec.ts        # valores por rol, radios, contraste
        │   │   ├── contrast.ts              # contrastRatio(fg, bg) puro, sin colores
        │   │   ├── contrast.spec.ts
        │   │   ├── theme.service.ts         # signals, persistencia, matchMedia, apply()
        │   │   ├── theme.service.spec.ts
        │   │   ├── index-html.spec.ts       # paridad script de index.html ↔ servicio
        │   │   └── lint-gobernanza.spec.ts  # violaciones inyectadas con LINT_ROOT
        │   └── layout/
        │       ├── layout.component.html|ts # conmutador, superficies con tokens, región de anuncio
        │       ├── layout.texts.ts          # textos del conmutador
        │       └── layout-nav.ts            # clases de la entrada activa
        └── features/
            ├── teams/components/item-assignees-view/item-assignees-view.component.html   # ADR-010 punto 1
            └── backlog/components/create-backlog-item/create-backlog-item.component.html # ADR-010 punto 2
```

**Structure Decision**: aplicación web de un solo lado (frontend). El tema vive en `core/theme/` (transversal, como `core/auth` y `core/layout`); el shell consume el tema solo mediante tokens semánticos; las pantallas de `features/**` no se modifican salvo las dos líneas de ADR-010.

## Fases de diseño

- **Phase 0** → [research.md](./research.md): verificación contra paquetes instalados (paletas de Aura ≠ Tailwind v4, tokens PrimeNG, clase de fila seleccionada), decisiones y alternativas.
- **Phase 1** → [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Orden de implementación sugerido (insumo para `/speckit-tasks`)

1. Línea base verde: `npm test`, `npm run build`, `npm run lint:primeng`.
2. `contrast.ts` + spec (utilidad pura, TDD).
3. `app-theme.ts`: escalas explícitas, tokens modo claro, radios, botón peligro contorneado, enlace; spec de valores.
4. `app-theme.ts`: `colorScheme.dark`; spec de valores y contraste de todos los pares.
5. `ThemeService` + spec (matriz de entradas).
6. `app.config.ts` (preset, `darkModeSelector`, initializer previo al de Auth) + `styles.css` (`@custom-variant dark`).
7. `index.html` (meta + script síncrono) + spec de paridad.
8. Shell: superficies con tokens, entrada activa, conmutador, región de anuncio, textos; specs de `LayoutComponent`.
9. Limpieza ADR-010 (2 ediciones) + aserción.
10. Reglas de gobernanza en `lint-primeng.mjs` + spec de violaciones inyectadas.
11. Verificación manual (768 px, parpadeo, diálogos y toast) y 6 capturas en `evidence/`.

## Complexity Tracking

Sin violaciones de la Constitución que justificar.
