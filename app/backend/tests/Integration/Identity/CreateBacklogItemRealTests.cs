using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backlog.Domain.BacklogItems;
using FluentAssertions;
using Integration.Identity.Fixtures;
using Integration.Identity.Support;
using Microsoft.IdentityModel.JsonWebTokens;
using Xunit;

namespace Integration.Identity;

/// <summary>US2 — POST /api/backlog/items con credencial real y aplicación del catálogo real (FR-006..FR-008, FR-011).</summary>
[Collection(IdentityCollection.Name)]
public class CreateBacklogItemRealTests(KeycloakFixture keycloak, PostgresFixture postgres) : IDisposable
{
    private const string ApplicationIdField = "ApplicationId";

    private readonly RealApiFactory _api = new(keycloak, postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task RegistrarItem_ConCredencialRealYAplicacionExistente_Devuelve201()
    {
        // Arrange
        var applicationId = (await _api.SeedApplicationsAsync("Portal Clientes")).Single();
        var token = await keycloak.GetTokenAsync(TokenVariant.Valida);

        // Act
        var response = await _api.ClientWithBearer(token)
            .PostAsync(ItemPayload.BacklogItemsRoute, ItemPayload.Valid(applicationId));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        response.Headers.Location!.ToString().Should().EndWith($"{ItemPayload.BacklogItemsRoute}/{id}");
    }

    [Fact]
    public async Task RegistrarItem_ConCredencialReal_PersisteCreatedByIgualAlSub()
    {
        // Arrange
        var applicationId = (await _api.SeedApplicationsAsync("Portal Clientes")).Single();
        var token = await keycloak.GetTokenAsync(TokenVariant.Valida);
        var sub = new JsonWebToken(token).Subject;

        // Act
        var response = await _api.ClientWithBearer(token)
            .PostAsync(ItemPayload.BacklogItemsRoute, ItemPayload.Valid(applicationId));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = (await _api.StoredItemsAsync()).Should().ContainSingle().Subject;
        stored.Status.Should().Be(BacklogItemStatus.Backlog);
        stored.ApplicationId.Should().Be(applicationId);
        sub.Should().NotBeNullOrWhiteSpace();
        stored.CreatedBy.Should().Be(sub);
    }

    [Fact]
    public async Task RegistrarItem_ConApplicationIdInexistente_Devuelve400SinPersistir()
    {
        // Arrange
        var token = await keycloak.GetTokenAsync(TokenVariant.Valida);

        // Act
        var response = await _api.ClientWithBearer(token)
            .PostAsync(ItemPayload.BacklogItemsRoute, ItemPayload.Valid(Guid.NewGuid()));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").TryGetProperty(ApplicationIdField, out _).Should().BeTrue();
        (await _api.StoredItemsAsync()).Should().BeEmpty();
    }
}
