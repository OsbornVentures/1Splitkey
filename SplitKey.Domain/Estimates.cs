namespace SplitKey.Domain;

public class Estimates
{
    public ulong Difficulty { get; init; }
    public uint TimeSeconds { get; init; }
    public double Price { get; init; }

    public Estimates(ulong difficulty, uint timeSeconds, double price)
    {
        this.Difficulty = difficulty;
        this.TimeSeconds = timeSeconds;
        this.Price = price;
    }
}