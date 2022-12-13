using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SplitKey.DbContext;
using SplitKey.Domain;
using SplitKey.Domain.Entities;
using SplitKey.Dto;
using SplitKey.Service.Contracts;

namespace SplitKey.Api.Controllers;

[ApiController]
[Authorize("Api.Create")]
[Route("api/requests")]
public class RequestsController : ControllerBase
{
    private readonly IRequestService service;
    private readonly IMapper mapper;
    private readonly SplitKeyContext dbContext;

    public RequestsController(IRequestService service, IMapper mapper, SplitKeyContext dbContext)
    {
        this.service = service;
        this.mapper = mapper;
        this.dbContext = dbContext;
    }

    [ProducesResponseType(typeof(List<RequestDto>), StatusCodes.Status200OK)]
    [HttpGet]
    public ActionResult GetAll()
    {
        var requests = this.dbContext.Requests.ToList();

        Log.Logger.Information("User retrieved overview of all requests.");
        return this.Ok(this.mapper.Map<List<RequestDto>>(requests));
    }

    [ProducesResponseType(typeof(RequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpGet("{id}", Name = "RequestById")]
    public async Task<ActionResult> GetById(string hash)
    {
        var inputResult = HexString.Create(hash);

        if (inputResult.IsFailure)
        {
            return this.BadRequest($"Url part '{hash}' is in an invalid format.");
        }

        var request = await this.dbContext.Requests.Where(x => x.Hash == inputResult.Value).FirstOrDefaultAsync();

        if (request == null)
        {
            return this.NotFound($"Request with id '{hash}' does not exist.");
        }

        return this.Ok(this.mapper.Map<RequestDto>(request));
    }

    [ProducesResponseType(typeof(RequestDto), StatusCodes.Status201Created)]
    [HttpPost]
    public async Task<ActionResult> AddRequest(CreateRequestDto createDto)
    {
        var requestResult = await this.service.Create(
            createDto.WalletName,
            createDto.WalletType,
            createDto.CaseSensitive,
            createDto.PublicKey,
            createDto.Email,
            createDto.IpAddress,
            createDto.HallOfFame);

        if (requestResult.IsFailure)
        {
            return this.BadRequest(requestResult.Error);
        }

        var request = requestResult.Value;
        Log.Logger.Information($"New Request created with id '{request.Id}'.");
        return this.CreatedAtAction(nameof(GetById), new { id = request.Id }, this.mapper.Map<RequestDto>(request));
    }

    [ProducesResponseType(typeof(RequestDto), StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [HttpPost("{id}/complete")]
    public async Task<ActionResult> CompleteRequest(Guid id, [FromBody] RequestSolutionDto solution)
    {
        var request = await this.dbContext.Requests.FindAsync(id);

        if (request == null)
        {
            return this.NotFound($"Request with id '{id}' does not exist.");
        }

        var worker = await this.dbContext.Workers.FindAsync(solution.WorkerId);

        if (worker == null)
        {
            return this.NotFound($"Worker with id '{solution.WorkerId}' does not exist.");
        }

        var result = await this.service.Complete(request, worker, solution.PartialPrivate, solution.WalletResult);

        if (result.IsFailure)
        {
            return this.BadRequest(result.Error);
        }

        Log.Logger.Information($"Request with id '{id}' has been completed.");
        return this.NoContent();
    }

    [ProducesResponseType(typeof(EstimatesDto), StatusCodes.Status200OK)]
    [HttpPost("estimate")]
    public async Task<ActionResult> CalculateEstimates(RequestEstimatesDto requestDto)
    {
        var ip = this.Request.HttpContext.Connection.RemoteIpAddress!.ToString();
        var estimatesResult = await this.service.CalculateEstimates(
            requestDto.WalletName,
            requestDto.WalletType,
            requestDto.CaseSensitive,
            requestDto.Email,
            ip);

        if (estimatesResult.IsSuccess)
        {
            var estimates = estimatesResult.Value;
            Log.Logger.Information($"User requested a price estimate: '{requestDto.WalletName}' ({requestDto.WalletType}), Case-sensitive: {requestDto.CaseSensitive}, Price: {estimates.Price.ToString("0.00")}");
            return this.Ok(this.mapper.Map<EstimatesDto>(estimates));
        }
        else
        {
            return this.BadRequest(estimatesResult.Error);
        }
    }
}