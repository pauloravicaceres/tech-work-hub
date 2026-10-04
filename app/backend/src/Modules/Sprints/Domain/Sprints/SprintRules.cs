using System.Globalization;

namespace Sprints.Domain.Sprints;

/// <summary>
/// Fuente única de la regla de ventana de 2 semanas (ADR-005): la comparten el validador, <see cref="Sprint.Create"/>
/// y la restricción <c>CK_Sprints_Window</c>. Los nombres de campo van en camelCase (contrato OpenAPI).
/// </summary>
public static class SprintRules
{
    public const int WindowDays = 14;
    public const int IdentificationMaxLength = 100;
    public const int UserMaxLength = 255;
    public const string DateFormat = "yyyy-MM-dd";

    public const string IdentificationField = "identification";
    public const string StartDateField = "startDate";
    public const string EndDateField = "endDate";

    public const string IdentificationRequiredMessage = "La identificación del Sprint es obligatoria.";
    public const string IdentificationTooLongMessage = "La identificación del Sprint no puede superar los 100 caracteres.";
    public const string StartDateRequiredMessage = "La fecha de inicio es obligatoria.";
    public const string EndDateRequiredMessage = "La fecha de fin es obligatoria.";
    public const string StartDateFormatMessage = "La fecha de inicio debe tener el formato yyyy-MM-dd.";
    public const string EndDateFormatMessage = "La fecha de fin debe tener el formato yyyy-MM-dd.";
    public const string EndNotAfterStartMessage = "La fecha de fin debe ser posterior a la fecha de inicio.";
    public const string WindowMessage = "El Sprint debe abarcar exactamente una ventana de 2 semanas.";

    /// <summary>Formato estricto <see cref="DateFormat"/>, independiente de la cultura (ADR-004).</summary>
    public static bool TryParseDate(string? value, out DateOnly date) =>
        DateOnly.TryParseExact(value, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
}
