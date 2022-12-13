namespace SplitKey.Service;

using SplitKey.Domain;
using SplitKey.Dto;
using SplitKey.DbContext;
using SplitKey.Service.Contracts;
using SplitKey.Service.Errors;
using CSharpFunctionalExtensions;
using Serilog;

public class WorkerService : IWorkerService
{
    private readonly SplitKeyContext dbContext;
    public WorkerService(SplitKeyContext DbContext)
    {
        this.dbContext = DbContext;
    }

    public async Task<Result<Worker>> AddWorker(string name, List<string> graphicCards)
    {
        List<GraphicCard> cards = new List<GraphicCard>();

        List<GraphicCard> UnkownCardTypes = new List<GraphicCard>();
        foreach (string card in graphicCards)
        {
            GraphicCard cardRef = this.dbContext.GraphicCards.FirstOrDefault(x => x.Name.ToLower() == card.ToLower());
            if (cardRef == null)
            {
                Log.Logger.Warning($"Worker tried adding an unknown graphics card: '{card}'.");
                Log.Logger.Information($"Adding new GraphicCard '{card}' with 0 speed.");
                var newCard = new GraphicCard(card, 0);
                UnkownCardTypes.Add(newCard);
                cardRef = newCard;
            }

            cards.Add(cardRef);
        }
        if(UnkownCardTypes.Count > 0)
        {
            this.dbContext.GraphicCards.AddRange(UnkownCardTypes);
        }

        var workerResult = Worker.Create(name, cards);

        if (workerResult.IsFailure)
        {
            return Result.Failure<Worker>(workerResult.Error);
        }

        var worker = workerResult.Value;
        worker.WorkerCards = cards
            .ConvertAll(x => 
            new WorkerCard 
            { 
                Id = Guid.NewGuid(),
                Card = x,
                Worker = worker
            }).ToList();

        this.dbContext.Workers.Add(worker);
        this.dbContext.WorkerCards.AddRange(worker.WorkerCards);
        await this.dbContext.SaveChangesAsync();

        return worker;
    }
}
