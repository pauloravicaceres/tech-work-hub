namespace Backlog.Domain.BacklogItems;

/// <summary>Límites de longitud compartidos por el validador (FR-004, FR-012) y la configuración EF.</summary>
public static class BacklogItemRules
{
    public const int TitleMaxLength = 200;
    public const int DescriptionMaxLength = 4000;
    public const int AcceptanceCriteriaMaxLength = 4000;
    public const int EnumColumnMaxLength = 50;
    public const int UserMaxLength = 255;
    public const int PointsPrecision = 18;
    public const int PointsScale = 2;
}
