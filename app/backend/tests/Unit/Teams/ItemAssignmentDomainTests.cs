using FluentAssertions;
using Shared.Exceptions;
using Teams.Domain.ItemAssignments;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-015 — invariantes de <see cref="ItemAssignment"/>.</summary>
public class ItemAssignmentDomainTests
{
    [Fact]
    public void Create_ConIdentificadoresValidos_DebeConservarlosYGenerarId()
    {
        var itemId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        var assignment = ItemAssignment.Create(itemId, memberId);

        assignment.Id.Should().NotBe(Guid.Empty);
        assignment.ItemId.Should().Be(itemId);
        assignment.MemberId.Should().Be(memberId);
        assignment.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void Create_DosVeces_DebeGenerarIdsDistintos()
    {
        var a = ItemAssignment.Create(Guid.NewGuid(), Guid.NewGuid());
        var b = ItemAssignment.Create(Guid.NewGuid(), Guid.NewGuid());

        a.Id.Should().NotBe(b.Id);
    }

    [Fact]
    public void Create_ConItemIdVacio_DebeLanzarBadRequestSobreItemId()
    {
        var act = () => ItemAssignment.Create(Guid.Empty, Guid.NewGuid());

        var ex = act.Should().Throw<BadRequestException>().Which;
        ex.Field.Should().Be(ItemAssignmentRules.ItemIdField);
        ex.Message.Should().Be(ItemAssignmentRules.ItemIdRequiredMessage);
    }

    [Fact]
    public void Create_ConMemberIdVacio_DebeLanzarBadRequestSobreMemberId()
    {
        var act = () => ItemAssignment.Create(Guid.NewGuid(), Guid.Empty);

        var ex = act.Should().Throw<BadRequestException>().Which;
        ex.Field.Should().Be(ItemAssignmentRules.MemberIdField);
        ex.Message.Should().Be(ItemAssignmentRules.MemberIdRequiredMessage);
    }
}
