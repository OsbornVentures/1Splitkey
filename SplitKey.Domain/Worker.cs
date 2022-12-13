using CSharpFunctionalExtensions;

namespace SplitKey.Domain;

public class Worker : TrackedEntity
{
    public Guid Id { get; init; }
    public string Name { get; init; }
    public List<WorkerCard> WorkerCards { get; set; }

    public bool Active { get; private set; }

    public virtual List<MasterKey> MasterKeys { get; set; }
    public virtual List<LostKey> LostKeys { get; set; }

    private Worker (string name)
    {
        this.Name = name;
        this.Id = Guid.NewGuid();
    }

    private Worker(string name, List<GraphicCard> cards)
        : this(name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentNullException(nameof(name));
        }

    }

    public static Result<Worker> Create(string name, List<GraphicCard> cards)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure<Worker>("Worker name can't be empty.");
        }

        return Result.Success(new Worker(name, cards));
    }

    public void EnableWorker() => this.Active = true;

    public void DisableWorker() => this.Active = false;
}