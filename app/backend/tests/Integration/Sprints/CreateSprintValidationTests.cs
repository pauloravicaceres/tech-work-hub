using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Sprints.Domain.Sprints;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-003 / FR-003..FR-005, FR-012, SC-002 — todo rechazo es 400 con errors por campo y sin persistir.</summary>
[Collection(PostgresCollection.Name)]
public class CreateSprintValidationTests : IDisposable
{
    private const string Route = "/api/sprints";

    private readonly SprintsApiFactory _api;

    public CreateSprintValidationTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    private static string Body(string? identification, string? start, string? end)
    {
        static string Value(string? v) => v is null ? "null" : JsonSerializer.Serialize(v);
        return $$"""{"identification":{{Value(identification)}},"startDate":{{Value(start)}},"endDate":{{Value(end)}}}""";
    }

    private async Task<string[]> AssertBadRequestAsync(string body, string field)
    {
        var response = await _api.AuthenticatedClient().PostAsync(Route, Json(body));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("status").GetInt32().Should().Be(400);
        problem.TryGetProperty("errors", out var errors).Should().BeTrue("todo 400 incluye errors{}");
        errors.TryGetProperty(field, out var messages).Should().BeTrue($"errors debe incluir la clave camelCase '{field}'");
        (await _api.StoredSprintsAsync()).Should().BeEmpty("un rechazo nunca persiste un Sprint (FR-012)");
        return messages.EnumerateArray().Select(m => m.GetString()!).ToArray();
    }

    [Theory]
    [InlineData("2026-10-05", "2026-10-11")] // 7 días
    [InlineData("2026-10-05", "2026-10-17")] // 13 días
    [InlineData("2026-10-05", "2026-10-19")] // 15 días
    [InlineData("2026-10-05", "2026-10-25")] // 21 días
    public async Task CreateSprint_ConVentanaDistintaDe14Dias_DebeResponder400ConMensajeDeVentanaSobreEndDate(string start, string end)
    {
        var messages = await AssertBadRequestAsync(Body("Sprint", start, end), SprintRules.EndDateField);

        messages.Should().ContainSingle().Which.Should().Contain("ventana de 2 semanas");
    }

    [Theory]
    [InlineData("2026-10-05", "2026-10-05")]
    [InlineData("2026-10-05", "2026-10-01")]
    public async Task CreateSprint_ConFinIgualOAnteriorAlInicio_DebeResponder400SobreEndDate(string start, string end)
    {
        var messages = await AssertBadRequestAsync(Body("Sprint", start, end), SprintRules.EndDateField);

        messages.Should().ContainSingle().Which.Should().Be(SprintRules.EndNotAfterStartMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateSprint_ConIdentificacionAusente_DebeResponder400SobreIdentification(string? identification)
    {
        var messages = await AssertBadRequestAsync(Body(identification, "2026-10-05", "2026-10-18"), SprintRules.IdentificationField);

        messages.Should().ContainSingle().Which.Should().Be(SprintRules.IdentificationRequiredMessage);
    }

    [Fact]
    public async Task CreateSprint_ConIdentificacionDe101Caracteres_DebeResponder400()
    {
        var tooLong = new string('x', SprintRules.IdentificationMaxLength + 1);

        await AssertBadRequestAsync(Body(tooLong, "2026-10-05", "2026-10-18"), SprintRules.IdentificationField);
    }

    [Fact]
    public async Task CreateSprint_ConIdentificacionDe100Caracteres_DebeResponder201()
    {
        var atLimit = new string('x', SprintRules.IdentificationMaxLength);

        var response = await _api.AuthenticatedClient().PostAsync(Route, Json(Body(atLimit, "2026-10-05", "2026-10-18")));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("no-es-fecha")]
    [InlineData("05/10/2026")]
    public async Task CreateSprint_ConFechaDeInicioAusenteOMalformada_DebeResponder400SobreStartDate(string? start)
    {
        await AssertBadRequestAsync(Body("Sprint", start, "2026-10-18"), SprintRules.StartDateField);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("no-es-fecha")]
    [InlineData("2026-13-40")]
    public async Task CreateSprint_ConFechaDeFinAusenteOMalformada_DebeResponder400SobreEndDate(string? end)
    {
        await AssertBadRequestAsync(Body("Sprint", "2026-10-05", end), SprintRules.EndDateField);
    }

    [Fact]
    public async Task CreateSprint_ConCuerpoVacio_DebeResponder400ConErroresPorCadaCampo()
    {
        // Act
        var response = await _api.AuthenticatedClient().PostAsync(Route, Json("{}"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        errors.EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo(
            SprintRules.IdentificationField, SprintRules.StartDateField, SprintRules.EndDateField);
        (await _api.StoredSprintsAsync()).Should().BeEmpty();
    }
}
