# Clasificación de retrabajo (iteración 2, origen: Code Review)

Corregí `plan.md` y `contracts/api.md` y agregué las tareas T038–T043 a `tasks.md`. No toqué código, ni `tracker_bmad.md`, ni emití handoffs. No hay `.specify/extensions.yml`, así que no corrieron hooks.

Verifiqué en el código solo la configuración de Keycloak (#18): `appsettings.json` tiene `ssl-required: none` y `verify-token-audience: false`. Los otros tres hallazgos los tomé del informe del revisor sin reconfirmarlos en el código.

Los cuatro hallazgos del revisor son huecos de plan, salvo #19, que es un defecto de implementación. `spec.md` no necesitó cambios.

## Cambios en artefactos

- **`plan.md`:** nueva sección "Decisiones Técnicas Complementarias (retrabajo iteración 2/2)". Cubre el endpoint `GET /api/applications`, la autenticación del cliente, la configuración de Keycloak por entorno, el paso de migraciones y el orden de resolución de identidad en el handler.
- **`contracts/api.md`:** se agregó el contrato de `GET /api/applications` (200 con `{id, name}`, 401 sin token).
- **`tasks.md`:**
  - Desmarqué T018, T025 y T032, porque estaban cerradas sin cumplirse (identidad, auditoría y catálogo contra un endpoint inexistente).
  - Agregué la Fase 7 con T038–T043.
  - T013, T014, T017 y T019 ya estaban desmarcadas desde la fase anterior.

## Resultado

| Hallazgo | Capa | Tarea |
|---|---|---|
| #16 `GET /api/applications` inexistente | PLAN | T038 (servidor) |
| #17 sin interceptor Bearer ni login en el front | PLAN | T039 (interfaz) |
| #18 Keycloak inseguro por defecto | PLAN | T040 (servidor) |
| #18 sin paso de migraciones ni prueba en PostgreSQL | PLAN | T041 (servidor) |
| #19 identidad resuelta tarde, tras consultar el catálogo | CODE | T042 (servidor) |
| Verificación de #16..#19 | TASKS | T043 (servidor + interfaz, QA) |

## Notas

- **Constitución:** no encontré ambigüedades que requieran enmendarla con `/speckit-constitution`.
- **Alcance de la skill:** `speckit-converge` normalmente solo agrega tareas. Edité `plan.md` y `contracts/api.md` porque tu instrucción lo pedía para los hallazgos PLAN.
- **Siguiente paso:** `/speckit-implement` sobre T038–T042. T043 queda para QA cuando haya Docker.
