namespace SplitKey.Api.Mappings;

using AutoMapper;
using SplitKey.Domain;
using SplitKey.Dto;

public class EstimatesMapper : Profile
{
    public EstimatesMapper()
    {
        this.CreateMap<Estimates, EstimatesDto>();
    }
}