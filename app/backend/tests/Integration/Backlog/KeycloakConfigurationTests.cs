using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Integration.Backlog;

/// <summary>#18 — la configuración base de Keycloak no puede quedar insegura; solo Development la relaja.</summary>
public class KeycloakConfigurationTests
{
    private static IConfigurationSection Keycloak(string environment)
    {
        var apiDirectory = Path.GetDirectoryName(typeof(Program).Assembly.Location)!;
        return new ConfigurationBuilder()
            .SetBasePath(apiDirectory)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build()
            .GetSection("Keycloak");
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public void ConfiguracionBase_FueraDeDevelopment_DebeExigirSslYAudiencia(string environment)
    {
        var keycloak = Keycloak(environment);

        keycloak["ssl-required"].Should().NotBe("none");
        keycloak.GetValue<bool>("verify-token-audience").Should().BeTrue();
        keycloak["resource"].Should().NotBeNullOrWhiteSpace();
        keycloak["auth-server-url"].Should().StartWith("https://");
    }

    [Fact]
    public void Development_PuedeRelajarSslYAudiencia()
    {
        var keycloak = Keycloak("Development");

        keycloak["ssl-required"].Should().Be("none");
        keycloak.GetValue<bool>("verify-token-audience").Should().BeFalse();
    }

    [Fact]
    public void ConfiguracionBase_NoDebeContenerSecretos()
    {
        var keycloak = Keycloak("Production");

        keycloak.GetChildren().Select(c => c.Key).Should().NotContain(["credentials", "secret", "client-secret"]);
    }
}
