# Keycloak de desarrollo

`techworkhub-dev-realm.json` define lo mínimo para iniciar sesión desde el frontend Angular en local:

| Elemento | Valor |
|---|---|
| Realm | `techworkhub` |
| Cliente web | `techworkhub-web` (público, Authorization Code + PKCE `S256`) |
| Redirect URI / Web origin | `http://localhost:4200/*` / `http://localhost:4200` |
| Cliente API | `techworkhub-api` (bearer-only); el cliente web le añade la audiencia al token |
| Usuario | `dev.user` / `Dev-Pass-123!` (solo desarrollo, no usar en producción) |

El frontend (`app/frontend/src/app/core/auth/auth.config.ts`) y la API (`appsettings.Development.json`) esperan Keycloak en `http://localhost:8080/`.

## Importarlo

**Opción A: al crear el contenedor** (recomendada; la importación solo ocurre si el realm no existe):

```
docker run -p 8080:8080 -p 9000:9000 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin ^
  -v "%cd%\app\keycloak:/opt/keycloak/data/import" quay.io/keycloak/keycloak:24.0 start-dev --import-realm
```

Las variables del administrador son `KEYCLOAK_ADMIN` y `KEYCLOAK_ADMIN_PASSWORD` (propias de la imagen 24.0; las `KC_BOOTSTRAP_*` son de la 26). Ajusta usuario y contraseña. El ejemplo usa sintaxis de `cmd`; en PowerShell cambia `^` por `` ` `` y `%cd%` por `$PWD`.

**Opción B: contenedor ya creado.** En la consola de administración: *Create realm → Resource file*, selecciona este JSON y pulsa *Create*.

Si el contenedor se recrea sin volumen, el realm se pierde; con la opción A se reimporta solo.
