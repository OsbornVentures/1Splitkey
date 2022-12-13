namespace SplitKey.Api.Controllers;

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SplitKey.DbContext;
using SplitKey.Domain;
using SplitKey.Dto;

[ApiController]
[Route("api/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly IMapper mapper;
    private readonly SplitKeyContext dbContext;

    public FeedbackController(IMapper mapper, SplitKeyContext dbContext)
    {
        this.mapper = mapper;
        this.dbContext = dbContext;
    }

    [ProducesResponseType(typeof(List<FeedbackDto>), StatusCodes.Status200OK)]
    [HttpGet]
    public async Task<ActionResult> GetAllFeedback([FromQuery] bool? resolved)
    {
        var feedbacks = this.dbContext.Feedback.AsQueryable();
        
        if (resolved.HasValue)
        {
            feedbacks = feedbacks.Where(x => x.Resolved == resolved.Value);
        }

        var response = await feedbacks.ToListAsync();

        Log.Logger.Information("User retrieved overview of all feedback.");
        return this.Ok(this.mapper.Map<List<FeedbackDto>>(feedbacks));
    }

    [ProducesResponseType(typeof(FeedbackDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var feedback = await this.dbContext.Feedback.FindAsync(id);

        if(feedback == null)
        {
            return this.NotFound($"Feedback with id '{id}' does not exist.");
        }

        return this.Ok(this.mapper.Map<FeedbackDto>(feedback));
    }


    [ProducesResponseType(typeof(FeedbackDto), StatusCodes.Status201Created)]
    [HttpPost]
    public async Task<ActionResult> AddFeedback(CreateFeedbackDto createDto)
    {
        var feedback = new Feedback(createDto.Content);

        this.dbContext.Feedback.Add(feedback);
        await this.dbContext.SaveChangesAsync();


        Log.Logger.Information($"New feedback created with id '{feedback.Id}'.");
        return this.CreatedAtAction(nameof(GetById), new { id = feedback.Id }, this.mapper.Map<FeedbackDto>(feedback));
    }

    [ProducesResponseType(typeof(FeedbackDto), StatusCodes.Status303SeeOther)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPost("{id}/resolved")]
    public async Task<ActionResult> ResolveFeedback(Guid id)
    {
        var feedback = this.dbContext.Feedback.Find(id);

        if (feedback == null)
        {
            return this.NotFound($"Feedback with id '{id}' does not exist.");
        }

        feedback.Resolved = true;
        this.dbContext.Feedback.Update(feedback);
        await this.dbContext.SaveChangesAsync();
        Log.Logger.Information($"Feedback with id '{id}' has been resolved.");

        return this.NoContent();
    }
}