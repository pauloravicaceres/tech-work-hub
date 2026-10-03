using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Shared.Identity;

public interface ICurrentUser
{
    /// <summary>Identificador del claim de identidad del JWT; nulo si el claim no existe.</summary>
    string? UserId { get; }
}

public sealed class HttpContextCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private const string SubjectClaim = "sub";

    public string? UserId
    {
        get
        {
            var user = accessor.HttpContext?.User;
            var value = user?.FindFirst(SubjectClaim)?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }
}
