using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SplitKey.DbContext.Migrations
{
    public partial class RenamedCardWorkertoWorkerCard : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CardWorker");

            migrationBuilder.CreateTable(
                name: "WorkerCards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CardsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkersId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkerCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkerCards_GraphicCards_CardsId",
                        column: x => x.CardsId,
                        principalTable: "GraphicCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkerCards_Workers_WorkersId",
                        column: x => x.WorkersId,
                        principalTable: "Workers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkerCards_CardsId",
                table: "WorkerCards",
                column: "CardsId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkerCards_WorkersId",
                table: "WorkerCards",
                column: "WorkersId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkerCards");

            migrationBuilder.CreateTable(
                name: "CardWorker",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CardsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkersId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CardWorker", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CardWorker_GraphicCards_CardsId",
                        column: x => x.CardsId,
                        principalTable: "GraphicCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CardWorker_Workers_WorkersId",
                        column: x => x.WorkersId,
                        principalTable: "Workers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CardWorker_CardsId",
                table: "CardWorker",
                column: "CardsId");

            migrationBuilder.CreateIndex(
                name: "IX_CardWorker_WorkersId",
                table: "CardWorker",
                column: "WorkersId");
        }
    }
}
