using System.Net.Http.Json;
using Npgsql;

namespace Integration.Teams;

/// <summary>Utilidades compartidas por las pruebas de HU-015 sobre el host real.</summary>
internal static class ItemAssignmentsSupport
{
    public static string AssigneesRoute(Guid itemId) => $"/api/backlog-items/{itemId}/assignees";

    public static Task<HttpResponseMessage> AssignAsync(this HttpClient client, Guid itemId, Guid memberId) =>
        client.PostAsJsonAsync(AssigneesRoute(itemId), new { memberId });

    /// <summary>Inserta una asignación por SQL directo (las pruebas de lectura no dependen del endpoint de alta).</summary>
    public static async Task InsertAssignmentAsync(string connectionString, Guid itemId, Guid memberId, DateTime? createdAt = null)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO teams."ItemAssignments" ("Id", "ItemId", "MemberId", "CreatedAt", "CreatedBy")
            VALUES (@id, @itemId, @memberId, @createdAt, 'seed-user')
            """,
            connection);
        command.Parameters.AddWithValue("id", Guid.NewGuid());
        command.Parameters.AddWithValue("itemId", itemId);
        command.Parameters.AddWithValue("memberId", memberId);
        command.Parameters.AddWithValue("createdAt", createdAt ?? DateTime.UtcNow);
        await command.ExecuteNonQueryAsync();
    }
}
