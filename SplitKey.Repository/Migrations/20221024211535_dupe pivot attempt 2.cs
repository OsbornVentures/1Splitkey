using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SplitKey.DbContext.Migrations
{
    public partial class dupepivotattempt2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Feedback",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2500)", maxLength: 2500, nullable: false),
                    Resolved = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedback", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GraphicCards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MKeysPerSecond = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GraphicCards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletName = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    WalletType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaseSensitive = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Difficulty = table.Column<decimal>(type: "decimal(20,0)", nullable: false),
                    PublicKey = table.Column<string>(type: "nchar(130)", fixedLength: true, maxLength: 130, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    HallOfFame = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Requests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Workers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workers", x => x.Id);
                });

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

            migrationBuilder.CreateTable(
                name: "LostKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartialPrivate = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    WalletResult = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    WorkerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LostKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LostKeys_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LostKeys_Workers_WorkerId",
                        column: x => x.WorkerId,
                        principalTable: "Workers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MasterKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartialPrivate = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    WalletResult = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Redeemed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MasterKeys_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MasterKeys_Workers_WorkerId",
                        column: x => x.WorkerId,
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

            migrationBuilder.CreateIndex(
                name: "IX_LostKeys_RequestId",
                table: "LostKeys",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_LostKeys_WorkerId",
                table: "LostKeys",
                column: "WorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_MasterKeys_RequestId",
                table: "MasterKeys",
                column: "RequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MasterKeys_WorkerId",
                table: "MasterKeys",
                column: "WorkerId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CardWorker");

            migrationBuilder.DropTable(
                name: "Feedback");

            migrationBuilder.DropTable(
                name: "LostKeys");

            migrationBuilder.DropTable(
                name: "MasterKeys");

            migrationBuilder.DropTable(
                name: "GraphicCards");

            migrationBuilder.DropTable(
                name: "Requests");

            migrationBuilder.DropTable(
                name: "Workers");
        }
    }
}
