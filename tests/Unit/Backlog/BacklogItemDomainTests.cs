using Backlog.Domain.BacklogItems;
using Backlog.Domain.BacklogItems.Events;
using FluentAssertions;
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
