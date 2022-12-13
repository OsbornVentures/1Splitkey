using SplitKey.Domain;
using SplitKey.Dto.GraphicCard;

namespace SplitKey.Dto;

public class WorkerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<GraphicCardDto> Cards { get; set; } = null!;
    public bool Active { get; set; }
}