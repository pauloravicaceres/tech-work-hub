# Quickstart: validar el theming claro/oscuro (HU-036)

Guía de validación; la implementación vive en `tasks.md`. Contratos: [theme-service](./contracts/theme-service.md), [lint-gobernanza](./contracts/lint-gobernanza.md), [shell-conmutador](./contracts/shell-conmutador.md). Entidades: [data-model](./data-model.md).

## Prerrequisitos

- Node con las dependencias instaladas en `app/frontend` (`npm install`).
- Backend y Keycloak levantados por `docker-compose` para ver las pantallas autenticadas.

## 1. Verificaciones automáticas (en `app/frontend`)

```bash
npm run lint:primeng
npm run build
npm test
```

**Esperado**: las tres terminan sin errores; las pruebas existentes siguen en verde (SC-006). Con un color propio inyectado en un componente, `lint:primeng` falla con archivo y línea (SC-005).

## 2. Valores de tokens y contraste

`npm test -- app-theme contrast` → cada rol coincide con la tabla de tokens en ambos modos (SC-001); cada par cumple 4.5:1 / 3:1 o su ratio declarado de E-01..E-09 (SC-004).

## 3. Conmutador y persistencia (manual, `npm start`)

1. Abrir una pantalla con un formulario a medio llenar → activar el conmutador → la paleta cambia sin recarga, sin cambiar de ruta y sin perder lo escrito; activarlo otra vez vuelve al modo anterior (SC-002).
2. Recargar y reabrir en el mismo navegador → se conserva el modo elegido (SC-003).
3. Borrar `app-theme-mode` de `localStorage` → se sigue la preferencia del sistema; cambiarla con la app abierta → la app la sigue.
4. Guardar un valor inválido en `app-theme-mode` o bloquear el almacenamiento → modo del sistema, sin errores, conmutador funcional.
5. Teclado: Tab hasta el conmutador, Enter/Espacio lo activan; el lector de pantalla anuncia su propósito y, tras activarlo, el nuevo modo.

## 4. Sin parpadeo

Con modo oscuro guardado, recargar con red y CPU limitadas en las herramientas del navegador → no hay destello claro antes del primer pintado.

## 5. Revisión visual

- A 768 px la barra superior con el conmutador no desborda.
- Diálogos (registro de miembro, asignación a Sprint) y `p-toast` legibles en ambos modos.
- Radios: contenedores `0.75rem`, controles y botones `0.5rem`; entrada activa de navegación `0.5rem`.

## 6. Evidencia de cierre (FR-020, SC-007)

6 capturas a 1920 px en `specs/036-HU_theming_claro_oscuro_ui/evidence/`: `backlog-claro.png`, `backlog-oscuro.png`, `sprints-claro.png`, `sprints-oscuro.png`, `equipo-claro.png`, `equipo-oscuro.png`. Cada una muestra barra superior con conmutador, navegación, contenido y pie. Roles 1 a 8 contra la maqueta del mismo modo (`specs/evidences/claro.png`, `oscuro.png`); enlace contra la tabla (`#007595` claro, `#00b8db` oscuro).

## 7. Sin cambios fuera de alcance

```bash
git diff --stat -- app/backend app/template-primeng specs/evidences
```

**Esperado**: vacío. En `app/frontend/src/app/features/**` solo cambian las dos líneas de ADR-010.

## Puntos abiertos

No bloquean la implementación; requieren decisión humana (research R-10):

1. Ratificar en la Constitución las excepciones de contraste E-03..E-09 y el color de enlace `#007595` (hoy solo figuran E-01 y E-02).
2. Confirmar el borde de campo de formulario ≥ 3:1 (ADR-012), que se aparta del wireframe.
3. Confirmar las utilidades `text-color` y `sr-only`, no listadas en la enmienda "Theme Visual (HU-036)".
4. Confirmar el fondo de campo en modo oscuro `#1e2939`.
5. Pendientes de entorno: verificación manual (T041) y las 6 capturas de evidencia (T042) exigen app, backend y Keycloak en ejecución.
