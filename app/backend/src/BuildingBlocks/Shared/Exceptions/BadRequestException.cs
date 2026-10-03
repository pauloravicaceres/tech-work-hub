namespace Shared.Exceptions;

/// <summary>Regla de negocio violada que el cliente puede corregir; se mapea a HTTP 400 con <c>errors{campo}</c>.</summary>
public class BadRequestException(string message, string field = BadRequestException.GeneralField) : Exception(message)
{
    public const string GeneralField = "Request";

    public string Field { get; } = field;
}
