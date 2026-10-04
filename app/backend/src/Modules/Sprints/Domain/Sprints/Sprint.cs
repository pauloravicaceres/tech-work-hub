using Shared.Domain;
using Shared.Exceptions;

namespace Sprints.Domain.Sprints;

public class Sprint : Aggregate<Guid>, IAuditableEntity
{
    public string Identification { get; private set; } = default!;
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = default!;
    public DateTime? LastModified { get; private set; }
    public string? LastModifiedBy { get; private set; }

    private Sprint() { } // For EF Core

    /// <exception cref="BadRequestException">Identificación vacía o ventana distinta de <see cref="SprintRules.WindowDays"/> días (FR-003, FR-004, FR-015).</exception>
    public static Sprint Create(string identification, DateOnly startDate, DateOnly endDate)
    {
        if (string.IsNullOrWhiteSpace(identification))
        {
            throw new BadRequestException(SprintRules.IdentificationRequiredMessage, SprintRules.IdentificationField);
        }

        if (endDate <= startDate)
        {
            throw new BadRequestException(SprintRules.EndNotAfterStartMessage, SprintRules.EndDateField);
        }

        if (endDate.DayNumber - startDate.DayNumber != SprintRules.WindowDays - 1)
        {
            throw new BadRequestException(SprintRules.WindowMessage, SprintRules.EndDateField);
        }

        return new Sprint
        {
            Id = Guid.NewGuid(),
            Identification = identification,
            StartDate = startDate,
            EndDate = endDate
        };
    }

    public void MarkCreated(DateTime atUtc, string by)
    {
        CreatedAt = atUtc;
        CreatedBy = by;
    }

    public void MarkModified(DateTime atUtc, string by)
    {
        LastModified = atUtc;
        LastModifiedBy = by;
    }
}
