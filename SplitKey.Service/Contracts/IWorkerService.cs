using CSharpFunctionalExtensions;
using SplitKey.Domain;
using SplitKey.Dto;

namespace SplitKey.Service.Contracts;

public interface IWorkerService
{
    public Task<Result<Worker>> AddWorker(string name, List<string> cardNames);
}