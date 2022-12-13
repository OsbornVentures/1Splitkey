namespace SplitKey.Domain;

public class Feedback : TrackedEntity
{
    public Feedback(string content)
    {
        this.Content = content;

        this.Resolved = false;
        this.Id = Guid.NewGuid();
    }

    public Guid Id { get; init; }
    public string Content { get; init; }
    public bool Resolved { get; set; }
}
