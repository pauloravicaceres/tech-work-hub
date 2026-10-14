# TECHNICAL GUIDELINES & ARCHITECTURE RULES

- **Fecha de Definición:** 03-10-2026
- **Solutions Architect:** Agente SA Senior BMAD
- **Fuente SDD:** `spec.md` y `checklists/requirements.md` de `specs/002-pruebas-integracion-keycloak-catalogo/` (`plan.md` y `tasks.md` los genera Spec Kit tras el SDD-FREEZE). Sin `ux_*.md` con wireframes: la HU no tiene interfaz gráfica.

---

## 1. Project Overview
- **Qué es el sistema:** Tech Work Hub - Plataforma de gestión ágil. Esta HU no añade funcionalidad de producto: añade una suite de integración que verifica la HU-001 contra un Keycloak real y contra el catálogo real del módulo Application.
- **Qué problema resuelve:** Cierra el riesgo residual aceptado en HU-001 (identidad y catálogo simulados con `TestAuthHandler` y `FakeApplicationCatalog`). Da evidencia automatizada y reproducible de que `GET /api/applications` y `POST /api/backlog/items` funcionan de extremo a extremo con JWT reales.
- **Naturaleza del Proyecto:** Brownfield (Subordinado a las directrices de la Constitución Técnica). Coexiste con la suite de HU-001 (`app/backend/tests/Integration/Backlog/`), que se conserva intacta. HU-001 está fusionada; el comportamiento de producción no cambia (FR-013).
- **Arquitectura general:** Modular Monolith .NET 8 con Vertical Slice Architecture (VSA). La historia solo toca el árbol `tests/`, aparte de la configuración por entorno que el host ya expone.

## 2. Repository Structure
- **Backend (producción):** `app/backend/src/` (`Bootstrapper/Api`, `BuildingBlocks/Shared`, `Modules/Backlog`, `Modules/Application`). **Solo lectura** en esta HU.
- **Backend (pruebas, zona de trabajo):** `app/backend/tests/Integration/Identity/` (proyecto nuevo `Identity.IntegrationTests`). Se propone un proyecto aparte, y no ampliar `Backlog.IntegrationTests`, por tres motivos:
  - FR-012 exige que ninguna prueba de la HU use `TestAuthHandler` ni `FakeApplicationCatalog`, y esos tipos viven en el proyecto actual.
  - Los contenedores de Keycloak y PostgreSQL de esta suite no deben arrancar con la suite rápida de HU-001.
  - El proyecto nuevo se añade a `app/backend/TechWorkHub.sln`.
- **Frontend:** `app/frontend/` no se toca (la HU no tiene UI).
- **Importante:** El realm de prueba vive como fichero versionado en `app/backend/tests/Integration/Identity/Realm/techworkhub-test-realm.json`. Cada feature de prueba se agrupa por escenario (lectura de catálogo, registro de ítem, rechazo de credenciales), no por capa.
- **Qué NO debe tocar:** `src/**`, `Backlog.IntegrationTests`, contratos HTTP (`contracts/api.md` de HU-001), migraciones y `Shared`. Si una prueba exige cambiar código de producción, debe detenerse y escalar como defecto (capa PLAN o CODE) y no corregirlo dentro de esta HU.

## 3. Tech Stack
- **Runtime:** .NET 8 (`net8.0`, C# 12), igual que el resto de la solución.
- **Framework:** `WebApplicationFactory<Program>` (`Microsoft.AspNetCore.Mvc.Testing` 8.0.11) sobre el `Program` real, con Carter, MediatR, `ValidationBehavior`, interceptores de Shared y `Keycloak.AuthServices.Authentication` 2.5.2.
- **Database:** PostgreSQL 16 (`postgres:16-alpine`) por Testcontainers, con migraciones aplicadas por el arranque real (`Database:MigrateOnStartup=true`). Schemas `backlog` y `application` aislados.
- **Infrastructure:** Docker. Keycloak 24 (`quay.io/keycloak/keycloak:24.0`) efímero por Testcontainers con importación de realm al arrancar. Sin Redis ni RabbitMQ: la historia no los usa.
- **Testing:** xUnit 2.9.2 + FluentAssertions 6.12.2 + `Testcontainers.PostgreSql` 4.1.0 (ya en uso) + `Testcontainers.Keycloak` (misma línea 4.x, ADR-004). Pruebas no tautológicas: cada una debe poder fallar si se rompe la integración real.

## 4. Development Workflow
- **Cómo levantar el proyecto:** No hace falta `docker-compose`. La suite levanta y destruye sus propios contenedores. Requisito único: demonio Docker activo.
- **Cómo ejecutar tests / lint / build:** `dotnet build app/backend/TechWorkHub.sln` y `dotnet test app/backend/TechWorkHub.sln` (un solo comando, SC-006). Para solo esta suite: `dotnet test app/backend/tests/Integration/Identity/Identity.IntegrationTests.csproj`.
- **Cómo ejecutar migraciones:** No se crean migraciones nuevas. Se aplican las existentes de `Backlog` y `Application` al arrancar la fábrica de prueba.

## 5. Architecture Rules & Decision Framework
- **Principios que deben respetarse:**
  - **Realismo del borde:** las únicas piezas simuladas permitidas son las que HU-001 ya declara fuera de alcance. Aquí no se simula ninguna: se ejercen el Keycloak real, `ApplicationModuleApi` real y `ListApplicationsEndpoint` real.
  - **Producción como oráculo:** la API bajo prueba usa `appsettings.json` base (`ssl-required: external`, `verify-token-audience: true`). Solo se sobrescriben por `UseSetting` los valores de conexión (`auth-server-url`, cadena de conexión, `MigrateOnStartup`). Nunca se relaja `verify-token-audience` para que la prueba pase (FR-003).
  - **Aislamiento entre pruebas:** una base de datos por prueba (patrón de `PostgresFixture`) y un único contenedor Keycloak por suite (`ICollectionFixture`). Las aplicaciones de prueba las crea la suite (FR-004). Los datos se crean por el contexto del módulo Application (`ApplicationDbContext`), nunca por SQL cross-schema.
- **Dependencias permitidas:** Testcontainers, `System.IdentityModel.Tokens.Jwt` o `Microsoft.IdentityModel.JsonWebTokens` para leer y alterar tokens en pruebas. Prohibido: AutoMapper, `[ApiController]`, cualquier paquete que sustituya al esquema Keycloak del host.
- **Patrones prohibidos:** variables "hardcodeadas" (URLs, puertos, cadenas de conexión: salen del contenedor en tiempo de ejecución). Prohibido `TestAuthHandler`, `FakeApplicationCatalog`, `RemoveAll<IApplicationModuleApi>` o `RemoveAll` de autenticación en esta suite (FR-012). Prohibido `[Fact(Skip=...)]` y `SkippableFact` para ocultar la ausencia de Keycloak (CB-05). Prohibidos joins o consultas cross-schema, incluso para verificar el estado en pruebas.

### 5.1. State Management Architecture
- **Frontera de Estado:** La verdad de identidad es Keycloak (emisor de JWT). La verdad transaccional es PostgreSQL: schema `application` (catálogo) y schema `backlog` (ítems). La suite no guarda estado propio entre ejecuciones.
- **Estrategia de Sincronización:** Síncrona HTTP, sin sincronización asíncrona. El `sub` del JWT se propaga a `CreatedBy` vía `AuditableEntityInterceptor`; la prueba lo lee de una conexión nueva sin seguimiento.
- **Consistencia:** Fuerte y secuencial dentro de cada prueba. Se mitigan las condiciones de carrera de arranque con espera activa acotada a la salud de Keycloak (readiness del contenedor) antes de pedir tokens. Las pruebas de la colección no se paralelizan contra el mismo contenedor Keycloak si comparten usuario o sesión (`[Collection]` única).

### 5.2. System Resilience & Error Handling Strategy
- **Manejo de Fallas en Dependencias:** Si Keycloak o PostgreSQL no arrancan (o Docker no está activo), la suite **falla de forma explícita** con un mensaje claro y no se considera aprobada. Decisión humana ya tomada para CB-05 (opción A, 20:31:31). Los errores de `InitializeAsync` de las fixtures no se capturan para convertirlos en omisión.
- **Patrones de Tolerancia a Fallos:** Timeout obligatorio de arranque de contenedores (por ejemplo 120 s, configurable por variable de entorno) y reintento acotado solo en la obtención del primer token mientras Keycloak termina de importar el realm. Sin Circuit Breaker ni fallbacks: son pruebas, no producción. `CancellationToken` con timeout en cada `HttpClient.SendAsync`.
- **Proporcionalidad:** Complejidad mínima. Un único contenedor Keycloak por suite, un realm importado, sin orquestación propia ni scripts externos.

### 5.3. ARCHITECTURE DECISION RECORDS (ADR - Formato MADR)
*(Validados y formalizados desde `spec.md`; las decisiones impuestas por la constitución se marcan como heredadas.)*

#### ADR-001: Keycloak como proveedor de identidad y validación JWT del host
- **Estado:** Aceptado (heredado)
- **Contexto:** La spec (FR-001, FR-003) exige ejercitar un servidor de identidad real con la configuración de producción y verificación de audiencia activa. La constitución fija Keycloak v24+ y `Keycloak.AuthServices.Authentication` 2.5.2.
- **Decisión:** Se mantiene sin cambios el esquema `AddKeycloakWebApiAuthentication()` del host y los endpoints con `.RequireAuthorization()`. La suite se adapta al host, no al revés.
- **Alternativas Consideradas:** Exento (heredado).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** La evidencia corresponde al mismo código de autenticación que corre en producción.
  - ⚠️ **Trade-off / Costo Real:** Las pruebas dependen de la disponibilidad y el tiempo de arranque de Keycloak (decenas de segundos por ejecución de suite).

#### ADR-002: PostgreSQL con schemas aislados y sin consultas cross-schema
- **Estado:** Aceptado (heredado)
- **Contexto:** El catálogo real (`application`) y el backlog (`backlog`) comparten la base física pero no pueden cruzarse (constitución §3).
- **Decisión:** La suite crea las aplicaciones de prueba mediante el `ApplicationDbContext` del módulo Application y verifica el ítem persistido mediante `BacklogDbContext`. La referencia de `applicationId` se resuelve por `IApplicationModuleApi`, como en producción.
- **Alternativas Consideradas:** Exento (heredado).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Se verifica también el respeto de las fronteras de módulo.
  - ⚠️ **Trade-off / Costo Real:** Hace falta acceso al `ApplicationDbContext` desde el proyecto de pruebas; si su acceso es `internal`, se debe resolver con `InternalsVisibleTo` en la fase de plan, sin tocar el comportamiento.

#### ADR-003: Testcontainers para PostgreSQL con una BD por prueba
- **Estado:** Aceptado (heredado de HU-001)
- **Contexto:** HU-001 (T043) migró la integración a PostgreSQL 16 con Testcontainers (`PostgresFixture` + `ICollectionFixture`). La spec reutiliza esa infraestructura (Assumptions, FR-002, FR-014).
- **Decisión:** Se replica el patrón `PostgresFixture` en el proyecto nuevo (contenedor único por suite, base de datos nueva por prueba). No se referencia el proyecto `Backlog.IntegrationTests`: se evita acoplar suites; la duplicación es de ~30 líneas y es deliberada.
- **Alternativas Consideradas:** Exento (heredado).
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Idempotencia (FR-014, SC-005): dos ejecuciones seguidas dan el mismo resultado sin residuos.
  - ⚠️ **Trade-off / Costo Real:** Dos fixtures casi idénticas a mantener; se acepta frente a un proyecto compartido de utilidades que habría que crear solo para esto.

#### ADR-004: Keycloak efímero por Testcontainers con realm importado
- **Estado:** Aceptado
- **Contexto:** La spec asume un servidor de identidad de prueba aprovisionado sin intervención manual (Assumptions) y deja realm, cliente y usuario para la fase de planificación. La constitución no define cómo aprovisionar Keycloak en pruebas. Es un hueco de detalle, no de infraestructura: no exige cuestionario al humano porque el stack (Keycloak, Testcontainers, Docker) ya está impuesto.
- **Decisión:** `Testcontainers.Keycloak` levanta `quay.io/keycloak/keycloak:24.0` y importa `techworkhub-test-realm.json` (realm `techworkhub`, mismo nombre que `appsettings.json`). El realm define:
  - cliente `techworkhub-api` (el `resource` del host) y un cliente de prueba público con *direct access grants* para emitir tokens con usuario y contraseña;
  - un *Audience mapper* que añade `techworkhub-api` al claim `aud` (Keycloak por defecto emite `aud=account`; sin este mapper `verify-token-audience: true` rechazaría incluso el token válido);
  - un usuario de prueba con `sub` conocido por consulta, no por valor fijo;
  - un segundo cliente **sin** el mapper (token de "otra audiencia", SC-04.5);
  - un cliente con `access.token.lifespan` muy corto (token expirado, SC-04.3) y un segundo realm de prueba (token de "otro emisor", SC-04.4).
  - Firma alterada (SC-04.2) y ausencia de cabecera (SC-04.1) se generan en la propia prueba a partir de un token válido.
- **Alternativas Consideradas:**
  - **Alternativa A: Keycloak ya levantado con `docker-compose`.** Viable y más rápida de arrancar, pero depende de un estado manual y compartido (realm, usuarios y datos residuales), lo que viola FR-014 y SC-005 y rompe la ejecución con un solo comando.
  - **Alternativa B: Emitir JWT firmados con un emisor propio (servidor OIDC falso / `JwtSecurityTokenHandler` con clave local).** Rápida y determinista, pero no es un Keycloak real: reintroduce la simulación que la HU existe para eliminar (FR-001, FR-012, SC-002).
  - **Alternativa C: Aprovisionar el realm por la Admin API tras arrancar.** Más flexible, pero añade código imperativo y puntos de fallo; la importación declarativa del realm es más simple y reproducible.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Evidencia contra un Keycloak real, repetible y sin pasos manuales; el realm versionado documenta la configuración esperada.
  - ⚠️ **Trade-off / Costo Real:** Arranque lento (~20-60 s) y descarga de una imagen grande en la primera ejecución; el coste se amortiza con un único contenedor por suite. El emisor (`iss`) depende de la URL pública del contenedor, así que los tokens deben pedirse con la misma URL base que se inyecta en `auth-server-url`.

#### ADR-005: Proyecto de pruebas separado y política de fallo explícito
- **Estado:** Aceptado
- **Contexto:** FR-012 prohíbe reutilizar el esquema de prueba y el catálogo simulado de HU-001. CB-05 fue resuelto por el humano: fallar de forma explícita si Keycloak no está disponible.
- **Decisión:** Se crea `Identity.IntegrationTests` y se integra en la solución. Ninguna fixture traga excepciones de arranque; no se usan `Skip` ni traits que excluyan la suite de `dotnet test`.
- **Alternativas Consideradas:**
  - **Alternativa A: Ampliar `Backlog.IntegrationTests`.** Menos ficheros, pero convive con `TestAuthHandler` y `FakeApplicationCatalog` y mezcla una suite rápida con una lenta; compromete SC-002 (revisión de "0 pruebas con simulados").
  - **Alternativa B: Omitir las pruebas si no hay Keycloak (opciones B/C de la pregunta de clarificación).** Descartada por decisión humana: dejaría el riesgo residual abierto sin que nadie lo note.
- **Consecuencias:**
  - ✅ **Impacto Positivo:** Un `dotnet test` verde significa que el riesgo residual está cerrado; la revisión de SC-002 se reduce a buscar los tipos prohibidos en un solo proyecto.
  - ⚠️ **Trade-off / Costo Real:** Un entorno sin Docker no puede pasar `dotnet test` de la solución completa. Los equipos sin Docker deberán excluir el proyecto manualmente y asumir que no hay evidencia.

## 6. Coding Conventions
- **Naming:** PascalCase para tipos y métodos; nombres de prueba `Metodo_Condicion_ResultadoEsperado`. Ficheros por escenario: `ListApplicationsRealTests.cs`, `CreateBacklogItemRealTests.cs`, `InvalidCredentialsTests.cs`; fixtures `KeycloakFixture.cs`, `PostgresFixture.cs`, `RealApiFactory.cs`.
- **Organización:** Un caso `[Theory]` con `MemberData` o `InlineData` para la matriz 5 credenciales × 2 rutas = 10 combinaciones (SC-003).
- **Error handling:** Las aserciones comprueban código HTTP y, en 400, el `ProblemDetails`/`errors` de HU-001. No se capturan excepciones para pasar pruebas.
- **Logging:** Serilog del host sin cambios; en pruebas, la salida del contenedor Keycloak se vuelca al `ITestOutputHelper` solo ante fallo de arranque. Prohibido `Console.WriteLine`.
- **Async patterns:** `async`/`await` extremo a extremo; sin `.Result` ni `.GetAwaiter().GetResult()` en el código de la suite (la fábrica de HU-001 lo usa en un constructor; aquí se resuelve con `IAsyncLifetime`).

## 7. Testing
- **Qué debe testearse (mapeo a la spec):**
  - **US1 / SC-01, SC-02:** `GET /api/applications` con token real → 200, exactamente las aplicaciones creadas, con `id` y `name`, ordenadas por nombre. Verificar que se resuelve el servicio real (`IApplicationModuleApi` es `ApplicationModuleApi`).
  - **US2 / SC-03:** `POST /api/backlog/items` con token real y `applicationId` existente → 201, estado `Backlog`, `CreatedBy == sub` del token. Con `applicationId` inexistente → 400 sin persistencia.
  - **US3 / SC-04:** 5 credenciales inválidas × 2 rutas = 10 combinaciones → 401, sin efectos en catálogo ni backlog (conteo de filas antes y después, FR-010, FR-011).
  - **Idempotencia (FR-014, SC-005):** ejecutar la suite dos veces seguidas sin residuos.
- **Dónde están los tests:** `app/backend/tests/Integration/Identity/`.
- **Estrategia de cobertura:** Cobertura por escenario de aceptación, no por líneas de producción. La HU no cambia producción, así que no tiene sentido un umbral de cobertura de código.
- **Regla anti-tautología:** Cada prueba debe fallar si se sustituye Keycloak o el catálogo por un doble. Revisión explícita en QA-Tech con búsqueda de `TestAuthHandler`, `FakeApplicationCatalog` y `RemoveAll<`.

## 8. Security
- **Manejo de secretos:** Las credenciales del usuario de prueba y el *client secret* (si lo hay) viven solo en el realm de prueba versionado, que solo se importa a un contenedor efímero. No se reutilizan en ningún entorno real. Valores de conexión y URLs salen del contenedor en tiempo de ejecución, sin hardcodear.
- **Datos sensibles y Acciones prohibidas:** No registrar tokens completos en logs ni en la salida de las pruebas. Prohibido relajar `verify-token-audience` o la validación de emisor para ejecutar la suite. El Keycloak de Testcontainers sirve HTTP; el tratamiento de `ssl-required` en el entorno `Testing` debe registrarse en `plan.md` como excepción acotada a pruebas y requiere revisión de QA-Tech. Esa excepción no puede relajar la verificación de audiencia ni de emisor.

## 9. Database
- **Schema:** Relacional PostgreSQL con schemas `application` y `backlog` ya existentes.
- **Reglas para modificar DB:** No se modifica el modelo. Sin migraciones nuevas. Las migraciones existentes se aplican por `MigrateOnStartup` en cada base de datos de prueba.

## 10. Git & PR Rules
- **Naming de branches y Commits:** Rama `feat/002-HU_pruebas_integracion_keycloak_y_catalogo_application` (operada por el Watcher GitOps). Conventional Commits, por ejemplo `test(identity): añade suite de integración contra Keycloak real`. Prohibido commitear volcados de logs o tokens.

## 11. Agent Instructions (Dev Guidelines)
- **Qué debe hacer antes de modificar código:** Leer `specs/002-pruebas-integracion-keycloak-catalogo/spec.md`, `appsettings.json` y `Program.cs` del host y los endpoints `ListApplicationsEndpoint.cs` y `CreateBacklogItem*`. Confirmar que el demonio Docker está activo. Revisar que no se importe ningún tipo de `Backlog.IntegrationTests`.
- **Qué debe validar después / Cuándo pedir confirmación:** Ejecutar `dotnet test app/backend/TechWorkHub.sln` dos veces seguidas (SC-005) y comprobar por búsqueda que no existen `TestAuthHandler`, `FakeApplicationCatalog` ni `RemoveAll<` en el proyecto nuevo. Pedir confirmación antes de cualquier cambio en `src/`; si la suite revela un defecto real de producción, se reporta con su capa y no se corrige dentro de esta HU.
- **Puntos que el `plan.md` debe resolver (❓ No documentado en las fuentes):** (1) nombres concretos de realm, clientes y usuario de prueba; (2) tratamiento de `ssl-required` frente al Keycloak HTTP de Testcontainers, sin relajar audiencia ni emisor; (3) acceso del proyecto de pruebas a `ApplicationDbContext`; (4) roles: HU-001 solo exige `sub`, no se verifican roles.

## 12. Definition of Done
- Las 10 combinaciones de credencial inválida, el listado, el registro exitoso y el registro con aplicación inexistente se ejecutan de forma automatizada y pasan (SC-001, SC-003).
- Ninguna prueba usa el esquema de autenticación de prueba ni el catálogo simulado (SC-002, FR-012).
- `CreatedBy` coincide con el `sub` del token real en todos los casos (SC-004).
- Dos ejecuciones consecutivas dan el mismo resultado, sin datos ni configuración residuales (SC-005, FR-014).
- Sin credenciales, URLs ni puertos hardcodeados fuera del realm de prueba efímero.
- Si Keycloak o Docker no están disponibles, la suite falla con un mensaje claro y no se omite.
- Sin cambios en `app/backend/src/**` (FR-013). Tests y Lint pasan en CI (con Docker disponible).
