using System.Net;
using System.Text.Json;
using FluentAssertions;
using Npgsql;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / US5 — un fallo de persistencia produce 500 sin trazas y sin fila parcial (escenario 10).</summary>
[Collection(PostgresCollection.Name)]
public class AssignMemberToItemFailureTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public AssignMemberToItemFailureTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private async Task ExecuteAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(_api.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    [Fact]
    public async Task Asignar_ConFalloDePersistencia_DebeResponder500SinTrazasNiFilaParcial()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        // Una restricción CHECK imposible hace fallar el INSERT (23514), distinta del índice único del par.
        await ExecuteAsync("ALTER TABLE teams.\"ItemAssignments\" ADD CONSTRAINT \"CK_rota\" CHECK (false)");

        var response = await _api.AuthenticatedClient().AssignAsync(item, ana);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var raw = await response.Content.ReadAsStringAsync();
        JsonDocument.Parse(raw).RootElement.GetProperty("status").GetInt32().Should().Be(500);
        raw.Should().NotContainAny("Npgsql", "Exception", "StackTrace", "   at ", "CK_rota", "Ana Torres");
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConViolacionDeOtroConstraint_NoDebeConfundirseConLaCarreraYTerminaEn500()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var luis = await _api.SeedMemberAsync("Luis Rojas", TechnicalRoleSeed.QaId);
        // Un índice UNIQUE distinto (solo por ItemId) produce 23505 pero con otro ConstraintName.
        await ExecuteAsync("CREATE UNIQUE INDEX \"UX_otro\" ON teams.\"ItemAssignments\" (\"ItemId\")");
        var client = _api.AuthenticatedClient();
        (await client.AssignAsync(item, ana)).StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.AssignAsync(item, luis);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        (await _api.StoredAssignmentsAsync()).Should().ContainSingle().Which.MemberId.Should().Be(ana);
    }
}
