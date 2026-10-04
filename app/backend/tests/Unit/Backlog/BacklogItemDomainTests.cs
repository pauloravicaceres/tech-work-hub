using Backlog.Domain.BacklogItems;
using Backlog.Domain.BacklogItems.Events;
using FluentAssertions;
using Shared.Exceptions;
using Xunit;

namespace Unit.Backlog;

/// <summary>HU-001 postcondiciones: estado inicial fijo, estimaciones desacopladas y evento de dominio.</summary>
public class BacklogItemDomainTests
{
    [Fact]
    public void Create_ConDatosValidos_DebeFijarEstadoBacklogYEstimacionesIndependientes()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        var item = BacklogItem.Create(id, "Titulo", "d", BacklogItemType.UserStory,
            BacklogItemPriority.High, "ac", 5.0m, 3.0m, null);

        // Assert
        item.Id.Should().Be(id);
        item.Status.Should().Be(BacklogItemStatus.Backlog);
        item.DevPoints.Should().Be(5.0m);
        item.QAPoints.Should().Be(3.0m);
        item.Priority.Should().Be(BacklogItemPriority.High);
        item.AcceptanceCriteria.Should().Be("ac");
    }

    [Fact]
    public void Create_ConDatosValidos_DebeEmitirUnSoloBacklogItemCreatedDomainEvent()
    {
        // Arrange
        var id = Guid.NewGuid();
        var appId = Guid.NewGuid();

        // Act
        var item = BacklogItem.Create(id, "T", null, BacklogItemType.Bug,
            BacklogItemPriority.Low, null, 1m, null, appId);

        // Assert
        var evt = item.DomainEvents.Should().ContainSingle().Subject
            .Should().BeOfType<BacklogItemCreatedDomainEvent>().Subject;
        evt.BacklogItemId.Should().Be(id);
        evt.Type.Should().Be(BacklogItemType.Bug);
        evt.ApplicationId.Should().Be(appId);
    }

    [Fact]
    public void Create_ConQaPointsNulos_DebeConservarNuloSinForzarValor()
    {
        // Arrange / Act (SC-02)
        var item = BacklogItem.Create(Guid.NewGuid(), "Spike", null, BacklogItemType.Spike,
            BacklogItemPriority.Medium, null, 2.0m, null, null);

        // Assert
        item.QAPoints.Should().BeNull();
        item.DevPoints.Should().Be(2.0m);
    }

    [Theory]
    [InlineData(BacklogItemType.Spike)]
    [InlineData(BacklogItemType.Research)]
    [InlineData(BacklogItemType.TechDebt)]
    [InlineData(BacklogItemType.TechEvolution)]
    [InlineData(BacklogItemType.TechRequirement)]
    public void Create_ConTipoTecnicoYQaPoints_DebeRechazarComoInvarianteDelAgregado(BacklogItemType type)
    {
        // Act (FR-008: la regla vive en el agregado, no en el handler)
        var act = () => BacklogItem.Create(Guid.NewGuid(), "T", null, type,
            BacklogItemPriority.Low, null, 1m, 8m, null);

        // Assert
        act.Should().Throw<BadRequestException>()
            .Which.Field.Should().Be(nameof(BacklogItem.QAPoints));
    }

    [Theory]
    [InlineData(BacklogItemType.UserStory, false)]
    [InlineData(BacklogItemType.Bug, false)]
    [InlineData(BacklogItemType.TechEvolution, true)]
    [InlineData(BacklogItemType.TechRequirement, true)]
    [InlineData(BacklogItemType.TechDebt, true)]
    [InlineData(BacklogItemType.Research, true)]
    [InlineData(BacklogItemType.Spike, true)]
    public void IsTechnical_SegunTipo_DebeClasificarCorrectamente(BacklogItemType type, bool expected)
    {
        type.IsTechnical().Should().Be(expected);
    }

    [Fact]
    public void MarkCreated_ConFechaYUsuario_DebeAsignarMetadatosDeAuditoria()
    {
        // Arrange
        var item = BacklogItem.Create(Guid.NewGuid(), "T", null, BacklogItemType.Bug,
            BacklogItemPriority.Low, null, null, null, null);
        var at = new DateTime(2026, 10, 3, 12, 0, 0, DateTimeKind.Utc);

        // Act
        item.MarkCreated(at, "user-1");

        // Assert
        item.CreatedAt.Should().Be(at);
        item.CreatedBy.Should().Be("user-1");
    }

    [Fact]
    public void ClearDomainEvents_TrasCrear_DebeVaciarLaColeccion()
    {
        // Arrange
        var item = BacklogItem.Create(Guid.NewGuid(), "T", null, BacklogItemType.Bug,
            BacklogItemPriority.Low, null, null, null, null);

        // Act
        item.ClearDomainEvents();

        // Assert
        item.DomainEvents.Should().BeEmpty();
    }
}
