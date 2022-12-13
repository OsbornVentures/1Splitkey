namespace SplitKey.Service.Contracts;

using CSharpFunctionalExtensions;
using SplitKey.Domain;

public interface IMailerService
{
    public Task SendAcceptedEmail(Request request);

    public Task<Result> SendCompletionEmail(Request request);
}
