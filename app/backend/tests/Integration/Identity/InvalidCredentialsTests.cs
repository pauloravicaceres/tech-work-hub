using System.Net;
using FluentAssertions;
using Integration.Identity.Fixtures;
using Integration.Identity.Support;
using Microsoft.IdentityModel.JsonWebTokens;
using Xunit;

namespace Integration.Identity;

/// <summary>US3 — 5 credenciales inválidas × 2 rutas = 10 casos de 401 sin efectos (FR-009..FR-011, SC-003).</summary>
[Collection(IdentityCollection.Name)]
public class InvalidCredentialsTests(KeycloakFixture keycloak, PostgresFixture postgres) : IDisposable
{
    public enum InvalidCredential
    {
        Ausente,
        FirmaAlterada,
        Expirada,
        OtroEmisor,
        OtraAudiencia
    }

    public enum Route
    {
        ListarAplicaciones,
        RegistrarItem
    }

    private static readonly TimeSpan ExpirationWaitLimit = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan ExpirationPollInterval = TimeSpan.FromMilliseconds(250);

    private readonly RealApiFactory _api = new(keycloak, postgres);

    public void Dispose() => _api.Dispose();

    public static TheoryData<InvalidCredential, Route> Combinations()
    {
        var data = new TheoryData<InvalidCredential, Route>();
        foreach (var credential in Enum.GetValues<InvalidCredential>())
            foreach (var route in Enum.GetValues<Route>())
                data.Add(credential, route);
        return data;
    }

    [Theory]
    [MemberData(nameof(Combinations))]
    public async Task Ruta_ConCredencialInvalida_Devuelve401SinEfectos(InvalidCredential credential, Route route)
    {
        // Arrange
        var applications = await _api.SeedApplicationsAsync("Portal Clientes", "Backoffice");
        var itemsBefore = (await _api.StoredItemsAsync()).Count;
        var applicationsBefore = await _api.ApplicationCountAsync();
        var token = await BuildTokenAsync(credential);
        var client = _api.ClientWithBearer(token);

        // Act
        var response = route == Route.ListarAplicaciones
            ? await client.GetAsync(ItemPayload.ApplicationsRoute)
            : await client.PostAsync(ItemPayload.BacklogItemsRoute, ItemPayload.Valid(applications[0]));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.ApplicationCountAsync()).Should().Be(applicationsBefore);
        (await _api.StoredItemsAsync()).Should().HaveCount(itemsBefore).And.BeEmpty();
    }

    private async Task<string?> BuildTokenAsync(InvalidCredential credential) => credential switch
    {
        InvalidCredential.Ausente => null,
        InvalidCredential.FirmaAlterada => TokenTamperer.TamperSignature(await keycloak.GetTokenAsync(TokenVariant.Valida)),
        InvalidCredential.Expirada => await ExpiredTokenAsync(),
        InvalidCredential.OtroEmisor => await keycloak.GetTokenAsync(TokenVariant.OtroEmisor),
        InvalidCredential.OtraAudiencia => await keycloak.GetTokenAsync(TokenVariant.OtraAudiencia),
        _ => throw new ArgumentOutOfRangeException(nameof(credential), credential, null)
    };

    /// <summary>
    /// Token del cliente de vida corta: se espera (espera activa acotada) a que el claim <c>exp</c> del propio
    /// token quede en el pasado; no se manipula el reloj del host (R6/D2).
    /// </summary>
    private async Task<string> ExpiredTokenAsync()
    {
        var token = await keycloak.GetTokenAsync(TokenVariant.Expirada);
        var expiration = new JsonWebToken(token).ValidTo;

        var deadline = DateTime.UtcNow + ExpirationWaitLimit;
        while (DateTime.UtcNow <= expiration)
        {
            if (DateTime.UtcNow > deadline)
                throw new TimeoutException($"El token de vida corta no expiró dentro de {ExpirationWaitLimit.TotalSeconds}s.");
            await Task.Delay(ExpirationPollInterval);
        }

        return token;
    }
}
