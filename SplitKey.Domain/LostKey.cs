namespace SplitKey.Domain;

public class LostKey : TrackedEntity
{
    public LostKey(Guid requestId, Guid workerId, string partialPrivate, string walletResult)
    {
        this.RequestId = requestId;
        this.WorkerId = workerId;
        this.PartialPrivate = partialPrivate;
        this.WalletResult = walletResult;

        this.Id = Guid.NewGuid();
    }

    public Guid Id { get; init; }
    public Guid RequestId { get; init; }
    public string PartialPrivate { get; init; }
    public string WalletResult { get; init; }
    public Guid WorkerId { get; init; }
}