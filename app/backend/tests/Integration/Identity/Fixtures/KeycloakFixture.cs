using System.Text.Json;
using Testcontainers.Keycloak;
using Xunit;

namespace Integration.Identity.Fixtures;

/// <summary>Variantes de credencial que la suite sabe pedir al Keycloak real.</summary>
public enum TokenVariant
{
    Valida,
    Expirada,
    OtroEmisor,
    OtraAudiencia
}

/// <summary>
/// Un único Keycloak real por suite, con los realms de <c>Realm/</c> importados. <see cref="BaseAddress"/> es la
/// misma URL para pedir tokens y para configurar el host (el <c>iss</c> se deriva del host de la solicitud).
/// </summary>
public sealed class KeycloakFixture : IAsyncLifetime
{
    public const string Realm = "techworkhub";
    public const string OtherRealm = "techworkhub-other";
    public const string ValidClient = "techworkhub-tests";
    public const string NoAudienceClient = "techworkhub-tests-noaud";
    public const string ShortLivedClient = "techworkhub-tests-shortlived";
    public const string TestUser = "qa.user";
    public const string TestPassword = "Qa-Pass-123!";

    private const int FirstTokenAttempts = 10;
    private static readonly TimeSpan FirstTokenDelay = TimeSpan.FromSeconds(1);

    private readonly KeycloakContainer _keycloak;
    private readonly HttpClient _http = new();

    public KeycloakFixture()
    {
        var realmDirectory = Path.Combine(AppContext.BaseDirectory, "Realm");
        _keycloak = new KeycloakBuilder()
            .WithImage("quay.io/keycloak/keycloak:24.0")
            .WithResourceMapping(Path.Combine(realmDirectory, "techworkhub-test-realm.json"), "/opt/keycloak/data/import/")
            .WithResourceMapping(Path.Combine(realmDirectory, "techworkhub-other-realm.json"), "/opt/keycloak/data/import/")
            .WithCommand("--import-realm")
            .Build();
    }

    /// <summary>URL base del Keycloak (única para tokens y configuración del host).</summary>
    public string BaseAddress => _keycloak.GetBaseAddress();

    public async Task InitializeAsync()
    {
        var timeout = StartupTimeout.FromEnvironment();
        using var cts = new CancellationTokenSource(timeout);
        try
        {
            await _keycloak.StartAsync(cts.Token);
            // Absorbe el final de la importación del realm: único punto con reintento acotado (R11).
            _ = await RequestTokenWithRetryAsync(TokenVariant.Valida, cts.Token);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                "No se pudo arrancar o consultar Keycloak para la suite Identity.IntegrationTests. " +
                $"Verifique que Docker esté en ejecución (timeout {timeout.TotalSeconds}s).", ex);
        }
    }

    public Task DisposeAsync()
    {
        _http.Dispose();
        return _keycloak.DisposeAsync().AsTask();
    }

    /// <summary>Pide un access token por password grant al Keycloak real.</summary>
    public async Task<string> GetTokenAsync(TokenVariant variant, CancellationToken cancellationToken = default)
    {
        var (realm, client) = variant switch
        {
            TokenVariant.Valida => (Realm, ValidClient),
            TokenVariant.Expirada => (Realm, ShortLivedClient),
            TokenVariant.OtroEmisor => (OtherRealm, ValidClient),
            TokenVariant.OtraAudiencia => (Realm, NoAudienceClient),
            _ => throw new ArgumentOutOfRangeException(nameof(variant), variant, null)
        };

        using var response = await _http.PostAsync(
            $"{BaseAddress.TrimEnd('/')}/realms/{realm}/protocol/openid-connect/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"] = client,
                ["username"] = TestUser,
                ["password"] = TestPassword
            }), cancellationToken);

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Keycloak rechazó la emisión del token ({variant}): {(int)response.StatusCode} {body}");

        using var document = JsonDocument.Parse(body);
        return document.RootElement.GetProperty("access_token").GetString()!;
    }

    private async Task<string> RequestTokenWithRetryAsync(TokenVariant variant, CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await GetTokenAsync(variant, cancellationToken);
            }
            catch (Exception) when (attempt < FirstTokenAttempts)
            {
                await Task.Delay(FirstTokenDelay, cancellationToken);
            }
        }
    }
}
