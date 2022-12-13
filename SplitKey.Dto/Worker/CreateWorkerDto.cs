namespace SplitKey.Dto;

public class CreateWorkerDto
{
    public string Name { get; set; } = null!;
    public List<string> Cards { get; set; } = new List<string>();
}