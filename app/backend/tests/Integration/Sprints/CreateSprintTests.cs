using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Npgsql;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-003 / FR-001, FR-002, FR-006, FR-010..FR-013 — host real (<c>Program</c>) vía WebApplicationFactory.</summary>
[Collection(PostgresCollection.Name)]
public class CreateSprintTests : IDisposable
{
    private const string Route = "/api/sprints";
    private const string ValidBody = """{"identification":"Sprint 2026-01","startDate":"2026-10-05","endDate":"2026-10-18"}""";

    private readonly SprintsApiFactory _api;

    public CreateSprintTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    [Fact]
    public async Task CreateSprint_ConVentanaValida_DebeResponder201ConLocationYLosCuatroDatos()
    {
        // Arrange
        var client = _api.AuthenticatedClient();

        // Act
        var response = await client.PostAsync(Route, Json(ValidBody));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetGuid();
        id.Should().NotBe(Guid.Empty);
        body.GetProperty("identification").GetString().Should().Be("Sprint 2026-01");
        body.GetProperty("startDate").GetString().Should().Be("2026-10-05");
        body.GetProperty("endDate").GetString().Should().Be("2026-10-18");
        body.EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo("id", "identification", "startDate", "endDate");
        response.Headers.Location!.ToString().Should().Be($"{Route}/{id}");
    }

    [Fact]
    public async Task CreateSprint_ConDatosValidos_DebePersistirConAuditoriaDesdeElClaimYSinTocarElBacklog()
    {
        // Arrange (FR-006, FR-013: CreatedBy sale del sub del token; el backlog no cambia)
        var client = _api.AuthenticatedClient();
        var before = DateTime.UtcNow.AddSeconds(-5);

        // Act
        var response = await client.PostAsync(Route, Json(ValidBody));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = (await _api.StoredSprintsAsync()).Should().ContainSingle().Subject;
        stored.StartDate.Should().Be(new DateOnly(2026, 10, 5));
        stored.EndDate.Should().Be(new DateOnly(2026, 10, 18));
        stored.CreatedBy.Should().Be(TestAuthHandler.UserId);
        stored.CreatedAt.Should().BeAfter(before).And.BeBefore(DateTime.UtcNow.AddSeconds(5));
        (await _api.BacklogItemCountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task CreateSprint_ConCreatedByEnElCuerpo_DebeIgnorarloYUsarElClaim()
    {
        // Arrange (FR-006: nunca se acepta del cuerpo)
        var client = _api.AuthenticatedClient();
        var body = """{"identification":"Sprint","startDate":"2026-10-05","endDate":"2026-10-18","createdBy":"intruso"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.StoredSprintsAsync()).Should().ContainSingle().Which.CreatedBy.Should().Be(TestAuthHandler.UserId);
    }

    [Fact]
    public async Task CreateSprint_ConIdentificacionRepetida_DebeCrearAmbosSprints()
    {
        // Arrange (ADR-006: sin unicidad, riesgo aceptado)
        var client = _api.AuthenticatedClient();

        // Act
        var first = await client.PostAsync(Route, Json(ValidBody));
        var second = await client.PostAsync(Route, Json(ValidBody));

        // Assert
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        second.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = await _api.StoredSprintsAsync();
        stored.Should().HaveCount(2);
        stored.Select(s => s.Id).Should().OnlyHaveUniqueItems();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Bearer token-invalido")]
    public async Task CreateSprint_SinTokenOConTokenInvalido_DebeResponder401SinPersistir(string? authorization)
    {
        // Arrange (FR-010)
        var client = _api.AnonymousClient();
        if (authorization is not null) client.DefaultRequestHeaders.Add("Authorization", authorization);

        // Act
        var response = await client.PostAsync(Route, Json(ValidBody));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredSprintsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateSprint_ConTokenSinClaimDeIdentidad_DebeResponder401SinPersistir()
    {
        // Arrange (nunca se persiste un CreatedBy vacío)
        var client = _api.AuthenticatedClient(TestAuthHandler.NoSubjectToken);

        // Act
        var response = await client.PostAsync(Route, Json(ValidBody));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredSprintsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateSprint_ConFalloDePersistencia_DebeResponder500SinTrazasInternasNiSprintParcial()
    {
        // Arrange (FR-011): se rompe el almacenamiento tras arrancar (y migrar) el host
        _ = _api.Services;
        await using (var connection = new NpgsqlConnection(_api.ConnectionString))
        {
            await connection.OpenAsync();
            await using var rename = new NpgsqlCommand("ALTER TABLE sprints.\"Sprints\" RENAME TO \"SprintsRota\"", connection);
            await rename.ExecuteNonQueryAsync();
        }

        var client = _api.AuthenticatedClient();

        // Act
        var response = await client.PostAsync(Route, Json(ValidBody));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var raw = await response.Content.ReadAsStringAsync();
        var problem = JsonDocument.Parse(raw).RootElement;
        problem.GetProperty("status").GetInt32().Should().Be(500);
        raw.Should().NotContainAny("Npgsql", "Exception", "StackTrace", "   at ", "SprintsRota", "relation");
    }
}
