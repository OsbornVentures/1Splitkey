namespace SplitKey.DbContext;

using Microsoft.EntityFrameworkCore;
using SplitKey.Domain;
using SplitKey.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

public class SplitKeyContext : DbContext
{
    public DbSet<Worker> Workers { get; set; } = null!;

    public DbSet<Request> Requests { get; set; } = null!;

    public DbSet<Feedback> Feedback { get; set; } = null!;

    public DbSet<GraphicCard> GraphicCards { get; set; } = null!;

    public DbSet<WorkerCard> WorkerCards { get; set; } = null!;

    public DbSet<MasterKey> MasterKeys { get; set; } = null!;

    public DbSet<LostKey> LostKeys { get; set; } = null!;

    public SplitKeyContext(DbContextOptions opts) : base(opts)
    {
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var trackedEntities = ChangeTracker.Entries().Where(x => x.Entity.GetType().IsSubclassOf(typeof(TrackedEntity))).ToList();

        foreach (var entity in trackedEntities)
        {
            switch (entity.State)
            {
                case EntityState.Deleted:
                    entity.CurrentValues["DeletedAt"] = DateTime.Now;
                    entity.State = EntityState.Modified;
                    break;
                case EntityState.Modified:
                    entity.CurrentValues["UpdatedAt"] = DateTime.Now;
                    break;
                case EntityState.Added:
                    entity.CurrentValues["UpdatedAt"] = DateTime.Now;
                    entity.CurrentValues["CreatedAt"] = DateTime.Now;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Worker>((worker) =>
        {
            worker.HasKey(worker => worker.Id);
            worker.Property(worker => worker.Name).HasMaxLength(20);
            worker.Property(worker => worker.Active).HasDefaultValue(false);

            worker.HasQueryFilter(x => x.DeletedAt == null);
        });

        builder.Entity<GraphicCard>((card) => 
        {
            card.HasKey(x => x.Id);
        });

        builder.Entity<WorkerCard>(wc => 
        {
            wc.HasKey(x => x.Id);
            wc.HasOne(x => x.Worker).WithMany(x => x.WorkerCards);
            wc.HasOne(x => x.Card).WithMany(x => x.WorkerCards);
        });

        builder.Entity<Request>((request) =>
        {
            request.HasKey(x => x.Id);
            request.Ignore(x => x.Hash);
            request.Property(x => x.WalletName).HasMaxLength(12);
            request.Property(x => x.PublicKey).HasMaxLength(130).IsFixedLength().HasConversion(to => to.Value, from => HexString.Create(from).Value);
            request.Property(x => x.WalletType).HasConversion(to => to.Name, from => WalletType.FromString(from));
            request.Property(x => x.IpAddress).HasMaxLength(255);
            request.Property(x => x.Email).HasMaxLength(255);
            request.Property(x => x.CaseSensitive).HasDefaultValue(false);
            request.HasOne(x => x.MasterKey).WithOne();
            request.HasMany(x => x.LostKeys).WithOne();

            request.HasQueryFilter(x => x.DeletedAt == null);
        });

        builder.Entity<MasterKey>((key) => 
        {
            key.HasKey(x => x.Id);
            key.Property(x => x.PartialPrivate).HasMaxLength(512);
            key.Property(x => x.WalletResult).HasMaxLength(256);
            key.Property(x => x.Redeemed).HasDefaultValue(false);

            key.HasQueryFilter(x => x.DeletedAt == null);
        });

        builder.Entity<LostKey>((key) =>
        {
            key.HasKey(x => x.Id);
            key.Property(x => x.PartialPrivate).HasMaxLength(512);
            key.Property(x => x.WalletResult).HasMaxLength(256);

            key.HasQueryFilter(x => x.DeletedAt == null);
        });

        builder.Entity<Feedback>((feedback) =>
        {
            feedback.HasKey(x => x.Id);
            feedback.Property(x => x.Content).HasMaxLength(2500).IsRequired();
            feedback.Property(x => x.Resolved).HasDefaultValue(false);

            feedback.HasQueryFilter(x => x.DeletedAt == null);
        });
    }
}