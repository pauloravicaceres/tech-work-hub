using System.Text;

namespace Integration.Identity.Support;

/// <summary>Payload válido de HU-001 para POST /api/backlog/items y rutas bajo prueba.</summary>
public static class ItemPayload
{
    public const string ApplicationsRoute = "/api/applications";
    public const string BacklogItemsRoute = "/api/backlog/items";

    public static StringContent Valid(Guid? applicationId)
    {
        var application = applicationId is null ? "null" : $"\"{applicationId}\"";
        var json = "{\"title\":\"Registrar con identidad real\",\"type\":\"UserStory\",\"priority\":\"High\"," +
                   $"\"devPoints\":5.0,\"qaPoints\":3.0,\"applicationId\":{application}}}";
        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
