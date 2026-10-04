using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Backlog.Contracts;
using FluentAssertions;
using Xunit;

namespace Integration.Backlog;

/// <summary>#16 — GET /api/applications y #19 — identidad antes del catálogo, sobre el host real.</summary>
[Collection(PostgresCollection.Name)]
public class ListApplicationsTests : IDisposable
{
    private const string Route = "/api/applications";

    private readonly BacklogApiFactory _api;

    public ListApplicationsTests(PostgresFixture postgres) => _api = new BacklogApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task ListApplications_ConToken_DebeResponder200ConIdYName()
    {
        // Arrange
        var id = Guid.NewGuid();
        _api.Apps.Catalog.Add(new ApplicationSummary(id, "Portal Clientes"));
        var client = _api.AuthenticatedClient();

        // Act
        var response = await client.GetAsync(Route);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var item = body.EnumerateArray().Should().ContainSingle().Subject;
        item.GetProperty("id").GetGuid().Should().Be(id);
        item.GetProperty("name").GetString().Should().Be("Portal Clientes");
    }

    [Fact]
    public async Task ListApplications_SinToken_DebeResponder401SinConsultarElCatalogo()
    {
        // Act
        var response = await _api.AnonymousClient().GetAsync(Route);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        _api.Apps.Calls.Should().Be(0);
    }

    [Fact]
    public async Task CreateBacklogItem_ConTokenSinSubYApplicationId_DebeResponder401SinConsultarElCatalogo()
    {
        // Arrange (#19 / FR-009)
        var client = _api.AuthenticatedClient(TestAuthHandler.NoSubjectToken);
        var body = $$"""{"title":"Sin claim","type":"Bug","priority":"Medium","applicationId":"{{Guid.NewGuid()}}"}""";

        // Act
        var response = await client.PostAsync("/api/backlog/items", new StringContent(body, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        _api.Apps.Calls.Should().Be(0);
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }
}
