using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Backlog.Domain.BacklogItems;
using FluentAssertions;
using Xunit;

namespace Integration.Backlog;

/// <summary>
/// HU-001 SC-01..SC-06, CB-04, FR-008..FR-013 — host real (<c>Program</c>) vía WebApplicationFactory.
/// </summary>
public class CreateBacklogItemTests : IDisposable
{
    private const string Route = "/api/backlog/items";

    // El diccionario errors{} usa el nombre de propiedad C# del comando (FR-013).
    private const string TitleField = "Title";
    private const string TypeField = "Type";

    private readonly BacklogApiFactory _api = new();

    public void Dispose() => _api.Dispose();

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    private static async Task<string[]> ErrorsFor(HttpResponseMessage response, string field)
    {
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("status").GetInt32().Should().Be(400);
        problem.TryGetProperty("errors", out var errors).Should().BeTrue("FR-013: todo 400 incluye errors{}");
        errors.TryGetProperty(field, out var messages).Should().BeTrue($"errors debe incluir la clave '{field}'");
        return messages.EnumerateArray().Select(m => m.GetString()!).ToArray();
    }

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
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        response.Headers.Location!.ToString().Should().EndWith(id.ToString());
        var stored = (await _api.StoredItemsAsync()).Should().ContainSingle().Subject;
        stored.Id.Should().Be(id);
        stored.Status.Should().Be(BacklogItemStatus.Backlog);
        stored.DevPoints.Should().Be(5.0m);
        stored.QAPoints.Should().Be(3.0m);
        stored.Priority.Should().Be(BacklogItemPriority.High);
        stored.AcceptanceCriteria.Should().Be("ac");
    }

    [Fact]
    public async Task CreateBacklogItem_ConPrioridadComoTextoSegunHU_DebeResponder201()
    {
        // Arrange: el payload oficial de SC-01 usa "priority": "High" (FR-011, JsonStringEnumConverter global).
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Implementar OIDC","type":"UserStory","priority":"High","devPoints":5.0,"qaPoints":3.0}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.StoredItemsAsync()).Should().ContainSingle().Which.Priority.Should().Be(BacklogItemPriority.High);
    }

    [Fact]
    public async Task CreateBacklogItem_ConSpikeYQaPointsInformados_DebeResponder400ConErrorEnQaPointsSinPersistir()
    {
        // Arrange (FR-008: un tipo técnico con qaPoints se rechaza, no se descarta en silencio)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Spike latencia","type":"Spike","priority":"Medium","devPoints":2.0,"qaPoints":8.0}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ErrorsFor(response, nameof(BacklogItem.QAPoints))).Should().Contain(BacklogItem.TechnicalItemQaPointsMessage);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData("Spike")]
    [InlineData("TechRequirement")]
    public async Task CreateBacklogItem_ConTipoTecnicoSinQaPoints_DebePersistirQaPointsNulo(string type)
    {
        // Arrange (T015 / SC-02)
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Spike latencia","type":"{{type}}","priority":"Medium","devPoints":2.0,"qaPoints":null}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = (await _api.StoredItemsAsync()).Should().ContainSingle().Subject;
        stored.Type.Should().Be(Enum.Parse<BacklogItemType>(type));
        stored.QAPoints.Should().BeNull();
        stored.DevPoints.Should().Be(2.0m);
    }

    [Fact]
    public async Task CreateBacklogItem_ConUserStorySinQaPoints_DebePersistirNuloNoCero()
    {
        // Arrange (FR-008: ausente = "no estimado")
        var client = _api.AuthenticatedClient();
        var body = """{"title":"HU sin QA","type":"UserStory","priority":"Low","devPoints":3.0}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.StoredItemsAsync()).Should().ContainSingle().Which.QAPoints.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Bearer token-invalido")]
    public async Task CreateBacklogItem_SinTokenOConTokenInvalido_DebeResponder401SinTocarHandler(string? authorization)
    {
        // Arrange (SC-06 / CB-06)
        var client = _api.AnonymousClient();
        if (authorization is not null) client.DefaultRequestHeaders.Add("Authorization", authorization);
        var body = """{"title":"x","type":"Bug","priority":"Medium"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
        _api.CreatedEvents.Events.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConTokenSinClaimDeIdentidad_DebeResponder401SinPersistir()
    {
        // Arrange (FR-009 / T018: nunca se persiste un CreatedBy vacío)
        var client = _api.AuthenticatedClient(TestAuthHandler.NoSubjectToken);
        var body = """{"title":"Sin claim","type":"Bug","priority":"Medium"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConDatosValidos_DebeAuditarCreatedAtYCreatedByDesdeElClaim()
    {
        // Arrange (FR-009 / T018: asignado por AuditableEntityInterceptor, no por el handler)
        var client = _api.AuthenticatedClient();
        var before = DateTime.UtcNow.AddSeconds(-5);
        var body = """{"title":"Auditable","type":"Bug","priority":"Medium"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = (await _api.StoredItemsAsync()).Should().ContainSingle().Subject;
        stored.CreatedBy.Should().Be(TestAuthHandler.UserId);
        stored.CreatedAt.Should().BeAfter(before).And.BeBefore(DateTime.UtcNow.AddSeconds(5));
    }

    [Fact]
    public async Task CreateBacklogItem_ConDatosValidos_DebePublicarBacklogItemCreatedDomainEvent()
    {
        // Arrange (FR-010 / DEF-05: DispatchDomainEventsInterceptor)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Con evento","type":"Research","priority":"High"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var evt = _api.CreatedEvents.Events.Should().ContainSingle().Subject;
        evt.BacklogItemId.Should().Be(id);
        evt.Type.Should().Be(BacklogItemType.Research);
    }

    [Fact]
    public async Task CreateBacklogItem_ConTituloVacio_DebeResponder400ConErrorsSinPersistir()
    {
        // Arrange (SC-03 / DEF-01)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"","type":"Bug","priority":"High"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ErrorsFor(response, TitleField)).Should().NotBeEmpty();
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConTipoFueraDelCatalogo_DebeResponder400SinPersistir()
    {
        // Arrange (SC-04 / DEF-01)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Migración","type":"EpicGlobalInvalida","priority":"Medium"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ErrorsFor(response, TypeField)).Should().NotBeEmpty();
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_SinTipo_DebeResponder400SinPersistir()
    {
        // Arrange (DEF-02: Type nulo)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Sin tipo","priority":"Medium"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConDevPointsNegativos_DebeResponder400SinPersistir()
    {
        // Arrange (SC-05 / DEF-01)
        var client = _api.AuthenticatedClient();
        var body = """{"title":"Concurrencia","type":"Bug","priority":"High","devPoints":-3.0,"qaPoints":1.0}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ErrorsFor(response, nameof(BacklogItem.DevPoints))).Should().NotBeEmpty();
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData("description", BacklogItemRules.DescriptionMaxLength)]
    [InlineData("acceptanceCriteria", BacklogItemRules.AcceptanceCriteriaMaxLength)]
    public async Task CreateBacklogItem_ConTextoMasLargoQueElLimite_DebeResponder400(string field, int limit)
    {
        // Arrange (FR-012 / T019)
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Largo","type":"Bug","priority":"Low","{{field}}":"{{new string('x', limit + 1)}}"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConTextoEnElLimite_DebeResponder201()
    {
        // Arrange (frontera FR-012)
        var client = _api.AuthenticatedClient();
        var longText = new string('x', BacklogItemRules.DescriptionMaxLength);
        var title = new string('t', BacklogItemRules.TitleMaxLength);
        var body = $$"""{"title":"{{title}}","type":"Bug","priority":"Low","description":"{{longText}}","acceptanceCriteria":"{{longText}}"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateBacklogItem_ConCuerpoVacio_DebeResponder400()
    {
        // Arrange (T019: petición vacía)
        var client = _api.AuthenticatedClient();

        // Act
        var response = await client.PostAsync(Route, Json("{}"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConApplicationIdInexistente_DebeResponder400ConClaveApplicationId()
    {
        // Arrange (CB-04 / DEF-03 / FR-013)
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Con app","type":"Bug","priority":"Medium","applicationId":"{{Guid.NewGuid()}}"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ErrorsFor(response, nameof(BacklogItem.ApplicationId))).Should().NotBeEmpty();
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBacklogItem_ConApplicationIdExistente_DebeResponder201ConVinculo()
    {
        // Arrange
        var appId = Guid.NewGuid();
        _api.Apps.Known.Add(appId);
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Con app","type":"UserStory","priority":"Medium","applicationId":"{{appId}}"}""";

        // Act
        var response = await client.PostAsync(Route, Json(body));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.StoredItemsAsync()).Should().ContainSingle().Which.ApplicationId.Should().Be(appId);
    }

    [Fact]
    public async Task CreateBacklogItem_ConClienteQueCancela_DebePropagarElTokenDeLaSolicitudAlHandler()
    {
        // Arrange (CancellationToken en el endpoint): el handler queda bloqueado en ExistsAsync hasta que el cliente cancela.
        var appId = Guid.NewGuid();
        _api.Apps.Known.Add(appId);
        _api.Apps.BlockUntilCancelled = true;
        var client = _api.AuthenticatedClient();
        var body = $$"""{"title":"Cancelable","type":"Bug","priority":"Low","applicationId":"{{appId}}"}""";
        using var cts = new CancellationTokenSource();

        // Act
        var request = client.PostAsync(Route, Json(body), cts.Token);
        await _api.Apps.Started.Task.WaitAsync(TimeSpan.FromSeconds(10));
        cts.Cancel();

        // Assert
        var act = async () => await request;
        await act.Should().ThrowAsync<OperationCanceledException>();
        (await _api.Apps.SawCancellation.Task.WaitAsync(TimeSpan.FromSeconds(10))).Should().BeTrue();
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }
}
