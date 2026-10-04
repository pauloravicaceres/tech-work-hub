namespace Shared.Exceptions;

/// <summary>Estado actual del recurso que impide la operación; se mapea a HTTP 409 sin revelar datos ajenos.</summary>
public class ConflictException(string message) : Exception(message);
