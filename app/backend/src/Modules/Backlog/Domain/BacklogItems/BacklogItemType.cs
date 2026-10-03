namespace Backlog.Domain.BacklogItems;

public enum BacklogItemType
{
    UserStory,
    Bug,
    TechEvolution,
    TechRequirement,
    TechDebt,
    Research,
    Spike
}

public static class BacklogItemTypeExtensions
{
    /// <summary>Única definición de los tipos técnicos (no admiten <c>qaPoints</c>, FR-008).</summary>
    private static readonly HashSet<BacklogItemType> TechnicalTypes =
    [
        BacklogItemType.TechEvolution,
        BacklogItemType.TechRequirement,
        BacklogItemType.TechDebt,
        BacklogItemType.Research,
        BacklogItemType.Spike
    ];

    public static bool IsTechnical(this BacklogItemType type) => TechnicalTypes.Contains(type);
}
