namespace SplitKey.Domain;

public class MasterKey : TrackedEntity
{
    public MasterKey(Guid requestId, Guid workerId, string partialPrivate, string walletResult)
    {
        this.RequestId = requestId;
        this.WorkerId = workerId;
        this.PartialPrivate = partialPrivate;
        this.WalletResult = walletResult;

        this.Redeemed = false;
        this.Id = Guid.NewGuid();
    }

    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    public Guid WorkerId { get; set; }
    public string PartialPrivate { get; init; }
    public string WalletResult { get; init; }
    public bool Redeemed { get; init; }
}