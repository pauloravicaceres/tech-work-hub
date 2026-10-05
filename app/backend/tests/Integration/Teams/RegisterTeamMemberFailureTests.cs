using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Npgsql;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / US5 — un fallo de persistencia produce 500 sin trazas y sin miembro parcial.</summary>
[Collection(PostgresCollection.Name)]
public class RegisterTeamMemberFailureTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public RegisterTeamMemberFailureTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Registrar_ConFalloDePersistencia_DebeResponder500SinTrazasNiMiembroParcial()
    {
        _ = _api.Services; // fuerza el arranque (y la migración) antes de romper el almacenamiento
        await using (var connection = new NpgsqlConnection(_api.ConnectionString))
        {
            await connection.OpenAsync();
            await using var rename = new NpgsqlCommand("ALTER TABLE teams.\"TeamMembers\" RENAME TO \"TeamMembersRota\"", connection);
            await rename.ExecuteNonQueryAsync();
        }

        var response = await _api.AuthenticatedClient()
            .PostAsJsonAsync("/api/team-members", new { name = "Ana", role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var raw = await response.Content.ReadAsStringAsync();
        JsonDocument.Parse(raw).RootElement.GetProperty("status").GetInt32().Should().Be(500);
        raw.Should().NotContainAny("Npgsql", "Exception", "StackTrace", "   at ", "TeamMembersRota", "relation");

        await using var check = new NpgsqlConnection(_api.ConnectionString);
        await check.OpenAsync();
        await using var count = new NpgsqlCommand("SELECT count(*) FROM teams.\"TeamMembersRota\"", check);
        ((long)(await count.ExecuteScalarAsync())!).Should().Be(0);
    }
}
