using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backlog.Contracts;
using FluentAssertions;
using Integration.Identity.Fixtures;
using Integration.Identity.Support;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Integration.Identity;

/// <summary>US1 — GET /api/applications con JWT real de Keycloak contra el catálogo real (FR-005, SC-001).</summary>
[Collection(IdentityCollection.Name)]
public class ListApplicationsRealTests(KeycloakFixture keycloak, PostgresFixture postgres) : IDisposable
{
    private readonly RealApiFactory _api = new(keycloak, postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task ListarAplicaciones_ConCredencialValida_Devuelve200ConAplicacionesOrdenadas()
    {
        // Arrange
        var ids = await _api.SeedApplicationsAsync("Zeta Portal", "Alfa Clientes", "Mercurio Pagos");
        var names = new Dictionary<Guid, string>
        {
            [ids[0]] = "Zeta Portal", [ids[1]] = "Alfa Clientes", [ids[2]] = "Mercurio Pagos"
        };
        var token = await keycloak.GetTokenAsync(TokenVariant.Valida);

        // Act
        var response = await _api.ClientWithBearer(token).GetAsync(ItemPayload.ApplicationsRoute);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var returned = body.EnumerateArray()
            .Select(a => (Id: a.GetProperty("id").GetGuid(), Name: a.GetProperty("name").GetString()!))
            .ToList();
        returned.Select(a => a.Id).Should().BeEquivalentTo(ids);
        returned.Should().OnlyContain(a => names[a.Id] == a.Name);
        returned.Select(a => a.Name).Should().BeInAscendingOrder(StringComparer.Ordinal);
    }

    [Fact]
    public void Catalogo_EnHostReal_EsImplementacionRealDelModuloApplication()
    {
        // Act
        using var scope = _api.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IApplicationModuleApi>();

        // Assert
        catalog.Should().BeOfType<global::Application.ApplicationModuleApi>();
    }

    [Fact]
    public async Task ListarAplicaciones_SinAplicacionesCreadas_Devuelve200ConListaVacia()
    {
        // Arrange
        var token = await keycloak.GetTokenAsync(TokenVariant.Valida);

        // Act
        var response = await _api.ClientWithBearer(token).GetAsync(ItemPayload.ApplicationsRoute);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetArrayLength().Should().Be(0);
    }
}
