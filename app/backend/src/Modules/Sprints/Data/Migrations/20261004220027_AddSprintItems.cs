using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sprints.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSprintItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SprintItems",
                schema: "sprints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SprintId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SprintItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SprintItems_Sprints_SprintId",
                        column: x => x.SprintId,
                        principalSchema: "sprints",
                        principalTable: "Sprints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SprintItems_SprintId",
                schema: "sprints",
                table: "SprintItems",
                column: "SprintId");

            migrationBuilder.CreateIndex(
                name: "UX_SprintItems_ItemId",
                schema: "sprints",
                table: "SprintItems",
                column: "ItemId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SprintItems",
                schema: "sprints");
        }
    }
}
