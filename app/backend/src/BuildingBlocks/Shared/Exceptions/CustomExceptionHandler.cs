using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Shared.Exceptions;

/// <summary>Mapea excepciones a <c>ProblemDetails</c>; los 400 incluyen siempre el diccionario <c>errors</c> por campo (FR-013).</summary>
public class CustomExceptionHandler(ILogger<CustomExceptionHandler> logger) : IExceptionHandler
{
    private const string ValidationTitle = "One or more validation errors occurred.";
    private const string BadRequestType = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
    private const string ProblemContentType = "application/problem+json";
    private const int ClientClosedRequest = 499;

    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException && context.RequestAborted.IsCancellationRequested)
        {
            context.Response.StatusCode = ClientClosedRequest;
            return true;
        }

        ProblemDetails problem = exception switch
        {
            ValidationException validation => BadRequest(
                validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray())),
            BadRequestException badRequest => BadRequest(
                new Dictionary<string, string[]> { [badRequest.Field] = [badRequest.Message] }),
            BadHttpRequestException badHttp => BadRequest(
                new Dictionary<string, string[]> { [BadRequestException.GeneralField] = [badHttp.Message] }),
            UnauthorizedAccessException unauthorized => new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = unauthorized.Message,
                Status = StatusCodes.Status401Unauthorized
            },
            NotFoundException notFound => new ProblemDetails
            {
                Title = "Not Found",
                Detail = notFound.Message,
                Status = StatusCodes.Status404NotFound
            },
            _ => new ProblemDetails
            {
                Title = "An unexpected error occurred.",
                Status = StatusCodes.Status500InternalServerError
            }
        };

        if (problem.Status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Error no controlado en {Path}", context.Request.Path);
        }

        context.Response.StatusCode = problem.Status!.Value;
        await context.Response.WriteAsJsonAsync(problem, problem.GetType(), options: null, contentType: ProblemContentType, cancellationToken: cancellationToken);
        return true;
    }

    private static ValidationProblemDetails BadRequest(IDictionary<string, string[]> errors) =>
        new(errors)
        {
            Type = BadRequestType,
            Title = ValidationTitle,
            Status = StatusCodes.Status400BadRequest
        };
}
