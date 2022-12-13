namespace SplitKey.Service.Contracts;

using CSharpFunctionalExtensions;
using SplitKey.Domain;
using SplitKey.Dto;

public interface IRequestService
{

    public Task<Result<Estimates>> CalculateEstimates(string walletName, string walletType, bool caseSensitive, string email, string ip);

    public Task<Result<Request>> Create(
        string walletName,
        string walletType,
        bool caseSensitive,
        string publicKey,
        string? email,
        string ipAddress,
        bool hallOfFame);

    public Task<Result> Complete(Request request, Worker worker, string partialPrivate, string walletResult);
}