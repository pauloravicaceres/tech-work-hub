using FluentAssertions;
using Shared.Exceptions;
using Sprints.Domain.SprintItems;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-004 — fábrica del agregado SprintItem.</summary>
public class SprintItemDomainTests
{
    [Fact]
    public void Create_ConIdentificadoresValidos_DebeGenerarIdYConservarSprintEItem()
    {
        // Arrange
        var sprintId = Guid.NewGuid();
        var itemId = Guid.NewGuid();

        // Act
        var sprintItem = SprintItem.Create(sprintId, itemId);

        // Assert
        sprintItem.Id.Should().NotBe(Guid.Empty);
        sprintItem.SprintId.Should().Be(sprintId);
        sprintItem.ItemId.Should().Be(itemId);
    }

    [Fact]
    public void Create_DosVeces_DebeGenerarIdentificadoresDistintos()
    {
        // Act
        var first = SprintItem.Create(Guid.NewGuid(), Guid.NewGuid());
        var second = SprintItem.Create(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        first.Id.Should().NotBe(second.Id);
    }

    [Fact]
    public void Create_ConSprintIdVacio_DebeLanzarBadRequestSobreSprintId()
    {
        // Act
        var act = () => SprintItem.Create(Guid.Empty, Guid.NewGuid());

        // Assert
        act.Should().Throw<BadRequestException>().Which.Field.Should().Be(SprintItemRules.SprintIdField);
    }

    [Fact]
    public void Create_ConItemIdVacio_DebeLanzarBadRequestSobreItemId()
    {
        // Act
        var act = () => SprintItem.Create(Guid.NewGuid(), Guid.Empty);

        // Assert
        act.Should().Throw<BadRequestException>().Which.Field.Should().Be(SprintItemRules.ItemIdField);
    }

    [Fact]
    public void MarkCreated_DebeAsignarLosMetadatosDeAuditoria()
    {
        // Arrange
        var sprintItem = SprintItem.Create(Guid.NewGuid(), Guid.NewGuid());
        var at = new DateTime(2026, 10, 4, 12, 0, 0, DateTimeKind.Utc);

        // Act
        sprintItem.MarkCreated(at, "user-1");

        // Assert
        sprintItem.CreatedAt.Should().Be(at);
        sprintItem.CreatedBy.Should().Be("user-1");
    }
}
