using Xunit;

namespace Integration.Identity.Fixtures;

/// <summary>Una sola colección: las pruebas corren en serie contra el mismo Keycloak y PostgreSQL.</summary>
[CollectionDefinition(Name)]
public sealed class IdentityCollection : ICollectionFixture<KeycloakFixture>, ICollectionFixture<PostgresFixture>
{
    public const string Name = "Identity";
}
