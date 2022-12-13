using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SplitKey.DbContext.Migrations
{
    public partial class ComplexWorkerCard : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkerCards_GraphicCards_CardsId",
                table: "WorkerCards");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkerCards_Workers_WorkersId",
                table: "WorkerCards");

            migrationBuilder.RenameColumn(
                name: "WorkersId",
                table: "WorkerCards",
                newName: "WorkerId");

            migrationBuilder.RenameColumn(
                name: "CardsId",
                table: "WorkerCards",
                newName: "CardId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkerCards_WorkersId",
                table: "WorkerCards",
                newName: "IX_WorkerCards_WorkerId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkerCards_CardsId",
                table: "WorkerCards",
                newName: "IX_WorkerCards_CardId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkerCards_GraphicCards_CardId",
                table: "WorkerCards",
                column: "CardId",
                principalTable: "GraphicCards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkerCards_Workers_WorkerId",
                table: "WorkerCards",
                column: "WorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkerCards_GraphicCards_CardId",
                table: "WorkerCards");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkerCards_Workers_WorkerId",
                table: "WorkerCards");

            migrationBuilder.RenameColumn(
                name: "WorkerId",
                table: "WorkerCards",
                newName: "WorkersId");

            migrationBuilder.RenameColumn(
                name: "CardId",
                table: "WorkerCards",
                newName: "CardsId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkerCards_WorkerId",
                table: "WorkerCards",
                newName: "IX_WorkerCards_WorkersId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkerCards_CardId",
                table: "WorkerCards",
                newName: "IX_WorkerCards_CardsId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkerCards_GraphicCards_CardsId",
                table: "WorkerCards",
                column: "CardsId",
                principalTable: "GraphicCards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkerCards_Workers_WorkersId",
                table: "WorkerCards",
                column: "WorkersId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
