namespace SplitKey.Domain;

public class TrackedEntity
{
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }
}