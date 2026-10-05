using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Teams.Contracts;
using Xunit;

namespace Integration.Backlog;

/// <summary>HU-015 / ADR-006 — GET /api/backlog-items (selector del UX) y contrato <see cref="IBacklogItemLookup"/> sobre el host real.</summary>
[Collection(PostgresCollection.Name)]
public class ListBacklogItemsTests : IDisposable
{
    private const string Route = "/api/backlog-items";

    private readonly BacklogApiFactory _api;

    public ListBacklogItemsTests(PostgresFixture postgres) => _api = new BacklogApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private async Task<Guid> CreateAsync(HttpClient client, string title, string type, decimal? qa = null)
    {
        var response = await client.PostAsJsonAsync("/api/backlog/items", new
        {
            title,
            type,
            description = "d",
            acceptanceCriteria = "ac",
            priority = 3,
            devPoints = 5.0,
            qaPoints = qa,
            applicationId = (Guid?)null
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task Listar_ConToken_DebeResponder200SoloConIdTitleYTypeSinEstimacionesNiEstadoNiSprint()
    {
        var client = _api.AuthenticatedClient();
        var story = await CreateAsync(client, "Implementar OIDC", "UserStory", qa: 3.0m);
        var bug = await CreateAsync(client, "Corregir login", "Bug", qa: 2.0m);

        var response = await client.GetAsync(Route);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        body.Select(e => (e.GetProperty("id").GetGuid(), e.GetProperty("title").GetString(), e.GetProperty("type").GetString()))
            .Should().BeEquivalentTo([(story, "Implementar OIDC", "UserStory"), (bug, "Corregir login", "Bug")]);
        body.Should().OnlyContain(e => e.EnumerateObject().Select(p => p.Name).OrderBy(n => n).SequenceEqual(new[] { "id", "title", "type" }));
    }

    [Fact]
    public async Task Listar_SinToken_DebeResponder401()
    {
        var response = await _api.AnonymousClient().GetAsync(Route);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Lookup_DebeResponderExistenciaYDevolverSoloIdTituloYTipoOmitiendoLosInexistentes()
    {
        var client = _api.AuthenticatedClient();
        var story = await CreateAsync(client, "Implementar OIDC", "UserStory", qa: 3.0m);
        using var scope = _api.Services.CreateScope();
        var lookup = scope.ServiceProvider.GetRequiredService<IBacklogItemLookup>();

        (await lookup.ExistsAsync(story, CancellationToken.None)).Should().BeTrue();
        (await lookup.ExistsAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeFalse();
        var found = await lookup.GetItemsAsync([story, Guid.NewGuid()], CancellationToken.None);
        var empty = await lookup.GetItemsAsync([], CancellationToken.None);

        found.Should().ContainSingle().Which.Should().Be(new BacklogItemRef(story, "Implementar OIDC", "UserStory"));
        empty.Should().BeEmpty();
    }
}
