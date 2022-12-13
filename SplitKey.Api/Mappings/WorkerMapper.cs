namespace SplitKey.Api.Mappings;

using AutoMapper;
using SplitKey.Domain;
using SplitKey.Dto;

public class WorkerMapper : Profile
{
    public WorkerMapper()
    {
        this.CreateMap<Worker, WorkerDto>()
            .ForMember(dst => dst.Cards, opts => opts.Ignore());
    }
}