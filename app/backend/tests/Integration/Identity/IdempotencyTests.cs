using System.Net;
using FluentAssertions;
using Integration.Identity.Fixtures;
using Integration.Identity.Support;
using Xunit;

namespace Integration.Identity;

/// <summary>FR-014, SC-005 — el mismo escenario sobre dos fábricas con BD distintas produce el mismo resultado.</summary>
[Collection(IdentityCollection.Name)]
public class IdempotencyTests(KeycloakFixture keycloak, PostgresFixture postgres)
{
    [Fact]
    public async Task EscenarioDeRegistro_EjecutadoEnDosFabricas_ProduceElMismoResultado()
    {
        // Act
        var first = await RunScenarioAsync();
        var second = await RunScenarioAsync();

        // Assert
        first.Should().Be((HttpStatusCode.Created, 1));
        second.Should().Be(first);
    }

    private async Task<(HttpStatusCode Status, int StoredItems)> RunScenarioAsync()
    {
        using var api = new RealApiFactory(keycloak, postgres);
        var applicationId = (await api.SeedApplicationsAsync("Portal Clientes")).Single();
        var token = await keycloak.GetTokenAsync(TokenVariant.Valida);

        var response = await api.ClientWithBearer(token)
            .PostAsync(ItemPayload.BacklogItemsRoute, ItemPayload.Valid(applicationId));

        return (response.StatusCode, (await api.StoredItemsAsync()).Count);
    }
}
