namespace SplitKey.Domain;

public class GraphicCard
{
    private GraphicCard() 
    { 
    }

    public GraphicCard(string name, uint keyPerSecond)
    {
        this.Name = name;
        this.MKeysPerSecond = keyPerSecond;

        this.Id = Guid.NewGuid();
    }

    public Guid Id { get; set; }

    public string Name { get; set; }

    public uint MKeysPerSecond { get; set; }

    public virtual List<WorkerCard> WorkerCards { get; set; }
}