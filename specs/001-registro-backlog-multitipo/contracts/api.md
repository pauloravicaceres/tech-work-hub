# Contratos de API: Registro de Elementos de Backlog

Este documento describe la interfaz expuesta para la creacin de un tem de backlog. El diseo sigue REST con esquemas JSON, expuesto bajo Carter Minimal APIs en .NET.

## Endpoint: Crear Elemento de Backlog

**Ruta:** `POST /api/backlog/items`
**Seguridad:** Requiere Token Bearer (JWT) validado contra Keycloak (Rol requerido: Usuario Autenticado / Lder Tcnico).
**Content-Type:** `application/json`

### Request Body (Carga til)

```json
{
  "title": "Configuracin de CI/CD para el monolito",
  "description": "Establecer pipelines de build y test automatizados usando GitHub Actions.",
  "type": "TechRequirement",
  "devPoints": 5,
  "qaPoints": null,
  "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Campo | Tipo JSON | Requerido | Restricciones |
|-------|-----------|-----------|---------------|
| `title` | `string` | S | Mximo 200 caracteres, no vaco. |
| `description` | `string` | No | - |
| `type` | `string` | S | Valores permitidos: `UserStory`, `Bug`, `TechEvolution`, `TechRequirement`, `TechDebt`, `Research`, `Spike`. |
| `devPoints` | `number` | No | Debe ser >= 0. |
| `qaPoints` | `number` | No | Debe ser >= 0. Permite nulos. |
| `applicationId`| `string (UUID)` | No | Debe ser un UUID vlido de una Aplicacin existente. |

### Respuestas (Responses)

#### 201 Created

Operacin exitosa. El elemento fue persistido correctamente en base de datos.
**Cabeceras:** `Location: /api/backlog/items/{id}`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### 400 Bad Request

Fallo en las validaciones (estructurales o de integridad).

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Title": [
      "The length of 'Title' must be 200 characters or fewer."
    ],
    "ApplicationId": [
      "The specified Application does not exist."
    ]
  }
}
```

#### 401 Unauthorized

Peticin realizada sin token JWT o con un token invlido / expirado.

#### 500 Internal Server Error

Error inesperado durante la persistencia o emisin del evento de dominio.
