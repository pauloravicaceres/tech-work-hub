using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Teams.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItemAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItemAssignments",
                schema: "teams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemAssignments_TeamMembers_MemberId",
                        column: x => x.MemberId,
                        principalSchema: "teams",
                        principalTable: "TeamMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItemAssignments_MemberId",
                schema: "teams",
                table: "ItemAssignments",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "UX_ItemAssignments_ItemId_MemberId",
                schema: "teams",
                table: "ItemAssignments",
                columns: new[] { "ItemId", "MemberId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItemAssignments",
                schema: "teams");
        }
    }
}
