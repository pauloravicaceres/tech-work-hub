using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Teams.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialTeamsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "teams");

            migrationBuilder.CreateTable(
                name: "TechnicalRoles",
                schema: "teams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TechnicalRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TeamMembers",
                schema: "teams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    TechnicalRoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamMembers_TechnicalRoles_TechnicalRoleId",
                        column: x => x.TechnicalRoleId,
                        principalSchema: "teams",
                        principalTable: "TechnicalRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                schema: "teams",
                table: "TechnicalRoles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { new Guid("0b6f1d3a-5c1e-4d57-9a53-6a1c2f0e7b11"), "Desarrollo" },
                    { new Guid("7d2e9c48-3b6a-4f0c-8e15-b4a9d1c63f22"), "QA" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_TechnicalRoleId",
                schema: "teams",
                table: "TeamMembers",
                column: "TechnicalRoleId");

            migrationBuilder.CreateIndex(
                name: "UX_TechnicalRoles_Name",
                schema: "teams",
                table: "TechnicalRoles",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeamMembers",
                schema: "teams");

            migrationBuilder.DropTable(
                name: "TechnicalRoles",
                schema: "teams");
        }
    }
}
