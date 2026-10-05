using System.Net;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / escenario 11 — la carrera del mismo par se resuelve por el índice único y la relectura de la fila ganadora.</summary>
[Collection(PostgresCollection.Name)]
public class AssignMemberToItemConcurrencyTests : IDisposable
{
    private const int Requests = 8;

    private readonly TeamsApiFactory _api;

    public AssignMemberToItemConcurrencyTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Asignar_ElMismoParDeFormaSimultanea_DebeDevolverUnSolo201ElRestoOkYUnaSolaFila()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var client = _api.AuthenticatedClient();
        await client.GetAsync("/api/technical-roles"); // calienta el host antes de la carrera

        var responses = await Task.WhenAll(Enumerable.Range(0, Requests).Select(_ => Task.Run(() => client.AssignAsync(item, ana))));

        responses.Count(r => r.StatusCode == HttpStatusCode.Created).Should().Be(1);
        responses.Count(r => r.StatusCode == HttpStatusCode.OK).Should().Be(Requests - 1);
        (await _api.StoredAssignmentsAsync()).Should().ContainSingle();
    }
}
