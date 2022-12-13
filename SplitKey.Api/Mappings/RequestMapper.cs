namespace SplitKey.Api.Mappings;

using AutoMapper;
using SplitKey.Domain;
using SplitKey.Dto;

public class RequestMapper : Profile
{
    public RequestMapper()
    {
        this.CreateMap<Request, RequestDto>();
    }
}