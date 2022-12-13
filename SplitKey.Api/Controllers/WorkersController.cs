namespace SplitKey.Api.Controllers;

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitKey.DbContext;
using SplitKey.Dto;
using SplitKey.Dto.GraphicCard;
using SplitKey.Service.Contracts;

[ApiController]
[Route("api/workers")]
public class WorkersController : ControllerBase
{
    private readonly IWorkerService service;
    private readonly IMapper mapper;
    private readonly SplitKeyContext dbContext;

    public WorkersController(IWorkerService service, IMapper mapper, SplitKeyContext dbContext)
    {
        this.service = service;
        this.mapper = mapper;
        this.dbContext = dbContext;
    }

    [ProducesResponseType(typeof(List<WorkerDto>), StatusCodes.Status200OK)]
    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var workers = await this.dbContext.Workers.AsNoTracking().ToListAsync();
        return this.Ok(this.mapper.Map<List<WorkerDto>>(workers));
    }

    [ProducesResponseType(typeof(WorkerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var worker = await this.dbContext.Workers.Include(x => x.WorkerCards).ThenInclude(x => x.Card).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

        if (worker == null)
        {
            return this.NotFound($"Worker with id '{id}' does not exist.");
        }

        var responseDto = this.mapper.Map<WorkerDto>(worker);
        responseDto.Cards = this.mapper.Map<List<GraphicCardDto>>(worker.WorkerCards.Select(x => x.Card).ToList());

        return this.Ok(responseDto);
    }

    [ProducesResponseType(typeof(WorkerDto), StatusCodes.Status201Created)]
    [HttpPost]
    public async Task<ActionResult> Create(CreateWorkerDto createDto)
    {
        var workerResult = await this.service.AddWorker(createDto.Name, createDto.Cards);

        if (workerResult.IsFailure)
        {
            return this.BadRequest(workerResult.Error);
        }

        var worker = workerResult.Value;
        var outputDto = this.mapper.Map<WorkerDto>(worker);
        outputDto.Cards = this.mapper.Map<List<GraphicCardDto>>(worker.WorkerCards.Select(x => x.Card));

        return this.CreatedAtAction(nameof(GetById), new { id = outputDto.Id }, outputDto);
    }

    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var worker = await this.dbContext.Workers.FindAsync(id);

        if (worker == null)
        {
            return this.NotFound($"Worker with id {id} does not exist.");
        }

        this.dbContext.Workers.Remove(worker);
        await this.dbContext.SaveChangesAsync();
        return this.NoContent();
    }

    [ProducesResponseType(typeof(WorkerDto), StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPost("{id}/enable")]
    public async Task<ActionResult> EnableWorker(Guid id)
    {
        var worker = await this.dbContext.Workers.FindAsync(id);

        if (worker == null)
        {
            return this.NotFound($"Worker with id {id} does not exist.");
        }

        worker.EnableWorker();
        this.dbContext.Update(worker);
        await this.dbContext.SaveChangesAsync();

        return this.NoContent();
    }

    [ProducesResponseType(typeof(WorkerDto), StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPost("{id}/disable")]
    public async Task<ActionResult> DisableWorker(Guid id)
    {
        var worker = await this.dbContext.Workers.FindAsync(id);

        if (worker == null)
        {
            return this.NotFound($"Worker with id {id} does not exist.");
        }

        worker.DisableWorker();
        this.dbContext.Update(worker);
        await this.dbContext.SaveChangesAsync();

        return this.NoContent();
    }
}