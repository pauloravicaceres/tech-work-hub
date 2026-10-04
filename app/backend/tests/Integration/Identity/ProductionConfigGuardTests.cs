using FluentAssertions;
using Integration.Identity.Fixtures;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Integration.Identity;

/// <summary>Guardias transversales: configuración de producción intacta y suite sin simulados (FR-003, FR-012, SC-002).</summary>
[Collection(IdentityCollection.Name)]
public class ProductionConfigGuardTests(KeycloakFixture keycloak, PostgresFixture postgres) : IDisposable
{
    private const string GuardFileName = nameof(ProductionConfigGuardTests) + ".cs";

    // Se construyen por concatenación para que este archivo no contenga literalmente los términos prohibidos.
    private static readonly string[] ForbiddenTerms =
    [
        "TestAuth" + "Handler",
        "FakeApplication" + "Catalog",
        "Remove" + "All<",
        "Skip" + " =",
        "Skippable" + "Fact",
        "Backlog." + "IntegrationTests"
    ];

    private readonly RealApiFactory _api = new(keycloak, postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public void ConfiguracionEfectiva_MantieneAudienciaYEmisorDeProduccion()
    {
        // Act
        var configuration = _api.Services.GetRequiredService<IConfiguration>();

        // Assert
        configuration["Keycloak:verify-token-audience"].Should().BeEquivalentTo("true");
        configuration["Keycloak:realm"].Should().Be("techworkhub");
        configuration["Keycloak:resource"].Should().Be("techworkhub-api");
    }

    [Fact]
    public void Suite_NoUsaSimuladosDeAutenticacionNiCatalogo()
    {
        // Arrange
        var suiteRoot = FindSuiteRoot();
        var binSegment = $"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}";
        var objSegment = $"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}";

        // Act
        var violations = Directory.EnumerateFiles(suiteRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !path.Contains(binSegment) && !path.Contains(objSegment)
                           && Path.GetFileName(path) != GuardFileName)
            .SelectMany(path => ForbiddenTerms
                .Where(term => File.ReadAllText(path).Contains(term, StringComparison.Ordinal))
                .Select(term => $"{Path.GetFileName(path)}: {term}"))
            .ToList();

        // Assert
        violations.Should().BeEmpty("la suite debe usar Keycloak y catálogo reales (FR-012)");
    }

    /// <summary>Sube desde el directorio de salida hasta la carpeta que contiene el .csproj de la suite.</summary>
    private static string FindSuiteRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !directory.EnumerateFiles("Identity.IntegrationTests.csproj").Any())
            directory = directory.Parent;

        return directory?.FullName
               ?? throw new DirectoryNotFoundException("No se encontró Identity.IntegrationTests.csproj sobre el directorio de salida.");
    }
}
