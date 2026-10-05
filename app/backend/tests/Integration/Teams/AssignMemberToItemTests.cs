using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / US1 — asignación de miembros a elementos sobre el host real (escenarios 1–3).</summary>
[Collection(PostgresCollection.Name)]
public class AssignMemberToItemTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public AssignMemberToItemTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Asignar_ConMiembroYElementoValidos_DebeResponder201ConLocationYCuerpoSinAuditoria()
    {
        var item = _api.Items.Add("item-101");
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);

        var response = await _api.AuthenticatedClient().AssignAsync(item, ana);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location!.ToString().Should().Be(ItemAssignmentsSupport.AssigneesRoute(item));
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("itemId").GetGuid().Should().Be(item);
        body.GetProperty("memberId").GetGuid().Should().Be(ana);
        body.GetProperty("memberName").GetString().Should().Be("Ana Torres");
        body.GetProperty("role").GetString().Should().Be("Desarrollo");
        body.EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo("itemId", "memberId", "memberName", "role");
    }

    [Fact]
    public async Task Asignar_DebePersistirAuditoriaDesdeElClaimNuncaDelCuerpo()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var before = DateTime.UtcNow.AddSeconds(-5);

        var response = await _api.AuthenticatedClient()
            .PostAsJsonAsync(ItemAssignmentsSupport.AssigneesRoute(item), new { memberId = ana, createdBy = "intruso", role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = (await _api.StoredAssignmentsAsync()).Should().ContainSingle().Subject;
        stored.CreatedBy.Should().Be(TestAuthHandler.UserId);
        stored.CreatedAt.Should().BeAfter(before).And.BeBefore(DateTime.UtcNow.AddSeconds(5));
        stored.ItemId.Should().Be(item);
        stored.MemberId.Should().Be(ana);
    }

    [Fact]
    public async Task Asignar_UnSegundoMiembro_DebeResponder201ConSuRolYConservarLaFilaDelPrimero()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var luis = await _api.SeedMemberAsync("Luis Rojas", TechnicalRoleSeed.QaId);
        var client = _api.AuthenticatedClient();
        await client.AssignAsync(item, ana);
        var anaRow = (await _api.StoredAssignmentsAsync()).Single();

        var response = await client.AssignAsync(item, luis);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("role").GetString().Should().Be("QA");
        var rows = await _api.StoredAssignmentsAsync();
        rows.Should().HaveCount(2);
        var anaAfter = rows.Single(r => r.Id == anaRow.Id);
        anaAfter.CreatedAt.Should().Be(anaRow.CreatedAt);
        anaAfter.CreatedBy.Should().Be(anaRow.CreatedBy);
    }

    [Fact]
    public async Task Asignar_ElMismoParDeNuevo_DebeResponder200IdempotenteSinNuevaFilaNiCambioDeAuditoria()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var client = _api.AuthenticatedClient();
        var first = await client.AssignAsync(item, ana);
        var firstBody = await first.Content.ReadAsStringAsync();
        var row = (await _api.StoredAssignmentsAsync()).Single();

        var second = await client.AssignAsync(item, ana);

        second.StatusCode.Should().Be(HttpStatusCode.OK);
        (await second.Content.ReadAsStringAsync()).Should().Be(firstBody);
        var after = (await _api.StoredAssignmentsAsync()).Should().ContainSingle().Subject;
        after.Id.Should().Be(row.Id);
        after.CreatedAt.Should().Be(row.CreatedAt);
        after.CreatedBy.Should().Be(row.CreatedBy);
        after.LastModified.Should().BeNull();
    }
}
