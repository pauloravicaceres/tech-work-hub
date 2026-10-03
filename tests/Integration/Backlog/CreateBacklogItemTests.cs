using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Backlog.Domain.BacklogItems;
using FluentAssertions;
using Xunit;

namespace Integration.Backlog;

/// <summary>
/// HU-001 SC-01, SC-02, SC-03, SC-04, SC-05, SC-06, CB-04 — endpoint real vía TestServer.
/// Los fallos de estas pruebas documentan brechas reales de producción (DEF-01, DEF-03, DEF-07), no se desactivan.
/// </summary>
public class CreateBacklogItemTests : IAsyncLifetime
{
    private readonly BacklogApiFactory _api = new();

    public Task InitializeAsync() => Task.CompletedTask;
    public async Task DisposeAsync() => await _api.DisposeAsync();

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    [Fact]
    public async Task CreateBacklogItem_ConPayloadNumericoValido_DebeResponder201YPersistirEstadoBacklog()
    {
        // Arrange
        var client = _api.AuthenticatedClient();
        var body = """
        {"title":"Implementar OIDC","type":"UserStory","description":"d","acceptanceCriteria":"ac",
         "priority":3,"devPoints":5.0,"qaPoints":3.0,"applicationId":null}
        """;

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        response.Headers.Location!.ToString().Should().EndWith(id.ToString());
        var stored = _api.Db.Items.Should().ContainSingle().Subject;
        stored.Id.Should().Be(id);
        stored.Status.Should().Be(BacklogItemStatus.Backlog);
        stored.DevPoints.Should().Be(5.0m);
        stored.QAPoints.Should().Be(3.0m);
        stored.Priority.Should().Be(BacklogItemPriority.High);
    }

    [Fact]
    public async Task CreateBacklogItem_ConPrioridadComoTextoSegunHU_DebeResponder201()
    {
        // Arrange: el payload oficial de SC-01 usa "priority": "High" (DEF-07 si el contrato no lo admite).
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Implementar OIDC","type":"UserStory","priority":"High","devPoints":5.0,"qaPoints":3.0}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        _api.Db.Items.Should().ContainSingle().Which.Priority.Should().Be(BacklogItemPriority.High);
    }

    [Fact]
    public async Task CreateBacklogItem_ConSpikeYQaPointsInformados_DebePersistirQaPointsNulo()
    {
        // Arrange (T015 / SC-02)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Spike latencia","type":"Spike","priority":2,"devPoints":2.0,"qaPoints":8.0}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = _api.Db.Items.Should().ContainSingle().Subject;
        stored.Type.Should().Be(BacklogItemType.Spike);
        stored.QAPoints.Should().BeNull();
        stored.DevPoints.Should().Be(2.0m);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Bearer token-invalido")]
    public async Task CreateBacklogItem_SinTokenOConTokenInvalido_DebeResponder401SinTocarHandler(string? authorization)
    {
        // Arrange (SC-06 / CB-06)
        var client = _api.AnonymousClient();
        if (authorization is not null) client.DefaultRequestHeaders.Add("Authorization", authorization);
        var body = """{"title":"x","type":"Bug","priority":2}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        _api.Db.Items.Should().BeEmpty();
        _api.Db.SaveCalls.Should().Be(0);
    }

    [Fact]
    public async Task CreateBacklogItem_ConTituloVacio_DebeResponder400SinPersistir()
    {
        // Arrange (SC-03; falla mientras no exista ValidationBehavior — DEF-01)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"","type":"Bug","priority":3}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        _api.Db.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConTipoFueraDelCatalogo_DebeResponder400SinPersistir()
    {
        // Arrange (SC-04; DEF-01)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Migración","type":"EpicGlobalInvalida","priority":2}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        _api.Db.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConDevPointsNegativos_DebeResponder400SinPersistir()
    {
        // Arrange (SC-05; DEF-01)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Concurrencia","type":"Bug","priority":3,"devPoints":-3.0,"qaPoints":1.0}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        _api.Db.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConApplicationIdInexistente_DebeResponder400SinPersistir()
    {
        // Arrange (CB-04; falla sin mapeo de ValidationException a 400 — DEF-03)
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Con app","type":"Bug","priority":2,"applicationId":"{{Guid.NewGuid()}}"}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        _api.Db.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConApplicationIdExistente_DebeResponder201ConVinculo()
    {
        // Arrange
        var appId = Guid.NewGuid();
        _api.Apps.Known.Add(appId);
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Con app","type":"UserStory","priority":2,"applicationId":"{{appId}}"}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        _api.Db.Items.Should().ContainSingle().Which.ApplicationId.Should().Be(appId);
    }
}
