namespace SplitKey.Api.Mappings;

using AutoMapper;
using SplitKey.Domain;
using SplitKey.Dto;

public class FeedbackMapper : Profile
{
    public FeedbackMapper()
    {
        this.CreateMap<Feedback, FeedbackDto>();
        this.CreateMap<CreateFeedbackDto, Feedback>();
    }
}