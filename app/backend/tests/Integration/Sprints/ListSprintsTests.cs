using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-003 / FR-007, FR-010, SC-005 — listado contra el host real y PostgreSQL real.</summary>
[Collection(PostgresCollection.Name)]
public class ListSprintsTests : IDisposable
{
    private const string Route = "/api/sprints";

    private readonly SprintsApiFactory _api;

    public ListSprintsTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task ListSprints_ConSprintsSembrados_DebeResponder200ConExactamenteEsosSprints()
    {
        // Arrange
        var second = await _api.SeedSprintAsync("Sprint 2", new DateOnly(2026, 10, 19));
        var first = await _api.SeedSprintAsync("Sprint 1", new DateOnly(2026, 10, 5));

        // Act
        var response = await _api.AuthenticatedClient().GetAsync(Route);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        items.Select(i => i.GetProperty("id").GetGuid()).Should().Equal(first, second);
        items[0].GetProperty("identification").GetString().Should().Be("Sprint 1");
        items[0].GetProperty("startDate").GetString().Should().Be("2026-10-05");
        items[0].GetProperty("endDate").GetString().Should().Be("2026-10-18");
        items[0].EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo("id", "identification", "startDate", "endDate");
    }

    [Fact]
    public async Task ListSprints_SinSprints_DebeResponder200ConArregloVacio()
    {
        // Act
        var response = await _api.AuthenticatedClient().GetAsync(Route);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task ListSprints_SinCredenciales_DebeResponder401()
    {
        // Arrange
        await _api.SeedSprintAsync("Sprint", new DateOnly(2026, 10, 5));

        // Act
        var response = await _api.AnonymousClient().GetAsync(Route);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ListSprints_AlConsultar_NoDebeModificarLosDatos()
    {
        // Arrange
        await _api.SeedSprintAsync("Sprint", new DateOnly(2026, 10, 5));
        var before = await _api.StoredSprintsAsync();

        // Act
        await _api.AuthenticatedClient().GetAsync(Route);

        // Assert
        var after = await _api.StoredSprintsAsync();
        after.Should().BeEquivalentTo(before);
    }

    [Fact]
    public async Task ListSprints_Con100Sprints_DebeResponderEnMenosDe2Segundos()
    {
        // Arrange (SC-005): la primera llamada calienta el host; se mide la siguiente.
        var start = new DateOnly(2026, 1, 5);
        for (var i = 0; i < 100; i++)
        {
            await _api.SeedSprintAsync($"Sprint {i}", start.AddDays(14 * i));
        }

        var client = _api.AuthenticatedClient();
        await client.GetAsync(Route);

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await client.GetAsync(Route);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(100);
        stopwatch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(2));
    }
}
