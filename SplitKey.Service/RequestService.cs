namespace SplitKey.Service;

using Microsoft.Extensions.Configuration;
using SplitKey.Domain;
using SplitKey.Domain.Entities;
using SplitKey.Dto;
using SplitKey.DbContext;
using SplitKey.Service.Contracts;
using CSharpFunctionalExtensions;
using Microsoft.EntityFrameworkCore;
using Serilog;

public class RequestService : IRequestService
{
    private readonly SplitKeyContext dbContext;
    private readonly IConfiguration config;
    private readonly IMailerService mailingService;

    public RequestService(SplitKeyContext DbContext, IConfiguration config, IMailerService mailer)
    {
        this.dbContext = DbContext;
        this.config = config;
        this.mailingService = mailer;
    }

    public Request? GetPending()
    {
        return this.dbContext.Requests.FirstOrDefault(x => !this.dbContext.MasterKeys.Any(m => m.RequestId == x.Id));
    }

    public async Task<Result<Request>> Create(
        string walletName,
        string walletType,
        bool caseSensitive,
        string publicKey,
        string? email,
        string ipAddress,
        bool hallOfFame)
    {
        var publicKeyResult = HexString.Create(publicKey);
        if (publicKeyResult.IsFailure)
        {
            return Result.Failure<Request>($"{nameof(publicKey)} is not a valid hexadecimal string");
        }
        
        HexString pubKey = publicKeyResult.Value;
        WalletType type = WalletType.FromString(walletType);

        var requestResult = Request.Create(walletName, type, caseSensitive, pubKey, email, ipAddress, hallOfFame);

        if (requestResult.IsFailure)
        {
            return Result.Failure<Request>(requestResult.Error);
        }

        var request = requestResult.Value;

        this.dbContext.Requests.Add(request);
        await this.dbContext.SaveChangesAsync();

        await this.mailingService.SendAcceptedEmail(request);

        return Result.Success(request);
    }

    public async Task<Result<Estimates>> CalculateEstimates(
        string walletName,
        string walletType,
        bool caseSensitive,
        string email,
        string ip)
    {
        if (string.IsNullOrWhiteSpace(walletName))
        {
            return Result.Failure<Estimates>($"{nameof(walletName)} is empty.");
        }

        WalletType type = WalletType.FromString(walletType);

        if (type != WalletType.Legacy)
        {
            return Result.Failure<Estimates>($"Wallet type '{walletType}' is not supported.");
        }

        ulong diff = Request.CalculateDifficulty(walletName, type, caseSensitive);
        var estimateTimeResult = await this.EstimateTimeForDifficulty(diff);

        if (estimateTimeResult.IsFailure)
        {
            return Result.Failure<Estimates>(estimateTimeResult.Error);
        }

        uint timeSeconds = estimateTimeResult.Value;
        double price = this.CalculatePriceForTime(timeSeconds);

        int ordersLastWeek = await this.dbContext.Requests.Where(x => x.Email == email && (DateTime.Now.AddDays(-7) < x.CreatedAt || x.IpAddress == ip)).CountAsync();

        if (ordersLastWeek > 0)
        {
            // If the user has previously ordered a wallet from us the last 7 days, they're paying atleast $1.
            price = Math.Max(price, 1.0);
        }

        // Orders BELOW $1 are free. Repeat orders cost exactly $1, so those don't count.
        if (price < 1.0)
        {
            price = 0.0;
        }

        return Result.Success(new Estimates(diff, timeSeconds, price));
    }

    public async Task<Result> Complete(Request request, Worker worker, string partialPrivate, string walletResult)
    {
        if (string.IsNullOrEmpty(partialPrivate))
        {
            return Result.Failure("Supplied partial private is empty.");
        }

        if (string.IsNullOrWhiteSpace(walletResult))
        {
            return Result.Failure("Supplied wallet result is empty.");
        }

        var masterKey = new MasterKey(request.Id, worker.Id, partialPrivate, walletResult);
        this.dbContext.MasterKeys.Add(masterKey);
        await this.dbContext.SaveChangesAsync();

        await this.mailingService.SendCompletionEmail(request);

        return Result.Success();
    }

    private async Task<Result<uint>> EstimateTimeForDifficulty(ulong difficulty)
    {
        Worker fastestWorker = await this.dbContext.Workers.OrderByDescending(x => x.WorkerCards.Select(x => x.Card).Sum(x => x.MKeysPerSecond)).FirstOrDefaultAsync();

        if (fastestWorker == null)
        {
            Log.Logger.Warning("User requested an estimate but there are no workers available.");
            return Result.Failure<uint>("No workers available for the requested estimate.");
        }

        var cardsInWorker = this.dbContext.WorkerCards.Where(x => x.Worker == fastestWorker).Select(x => x.Card);

        double fastestWorkerSpeed = cardsInWorker.Sum(x => x.MKeysPerSecond) * 1000000;
        double expectedSeconds = difficulty / fastestWorkerSpeed;
        double attemptsPerSuccess = 6;
        double errorMargin = 1.25;

        return (uint)(expectedSeconds * attemptsPerSuccess * errorMargin);
    }

    private double CalculatePriceForTime(uint timeSeconds)
    {
        // Do we want to base the upkeep on all (active) workers their combined upkeep cost?
        double dailyUpkeep = config.GetValue<double>("upkeepPerDay");
        double hourlyUpkeep = dailyUpkeep / 24.0;

        double earningMultiplierPercentage = config.GetValue<double>("earningMultiplierPercentage") / 100.0;
        double hourlyEarning = hourlyUpkeep * earningMultiplierPercentage;

        double hoursOnJob = (timeSeconds / 3600.0);

        return RoundToDimes(hourlyEarning * hoursOnJob);
    }

    private static double RoundToDimes(double dollars)
    {
        double dimes = Math.Round(dollars * 10);
        return dimes / 10.0;
    }
}