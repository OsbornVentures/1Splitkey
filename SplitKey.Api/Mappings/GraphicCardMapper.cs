using AutoMapper;
using SplitKey.Domain;
using SplitKey.Dto.GraphicCard;

public class GraphicCardMapper : Profile
{
    public GraphicCardMapper()
    {
        this.CreateMap<GraphicCard, GraphicCardDto>();
    }
}