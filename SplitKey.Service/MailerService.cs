using CSharpFunctionalExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Serilog;
using SplitKey.DbContext;
using SplitKey.Domain;
using SplitKey.Service.Contracts;
using System.Net;
using System.Net.Mail;

namespace SplitKey.Service;

public class MailerService : IMailerService
{
    private readonly string emailsFolder;
    private readonly SplitKeyContext dbContext;

    public MailerService(IConfiguration config, SplitKeyContext dbContext)
    {
        emailsFolder = config.GetValue<string>("emailsFolderpath");
        this.dbContext = dbContext;
    }

    public async Task SendAcceptedEmail(Request request)
    {
        return;

        string mailContent = File.ReadAllText(Path.Combine(emailsFolder, "accepted_order.html"));
        mailContent = mailContent.Replace("{{WALLET_NAME}}", request.WalletName);
        
        await this.SendMail(request.Email, "We've received your 1SPLiTKEY order!", mailContent);
        Log.Logger.Information($"Send confirmation email for request with id '{request.Id}'.");
    }

    public async Task<Result> SendCompletionEmail(Request request)
    {
        return Result.Success();

        var masterKey = await this.dbContext.MasterKeys.Where(x => x.RequestId == request.Id).FirstOrDefaultAsync();

        if (masterKey == null)
        {
            return Result.Failure("The request has not been completed yet.");
        }

        string mailContent = File.ReadAllText(Path.Combine(emailsFolder, "completed_work.html"))
            .Replace("{{POOL_KEY}}", masterKey.PartialPrivate)
            .Replace("{{WALLET_NAME}}", masterKey.WalletResult);

        await this.SendMail(request.Email, "We've completed your 1SPLiTKEY order!", mailContent);
        Log.Logger.Information($"Completion email sent for request with id '{request.Id}'.");
        return Result.Success();
    }

    private async Task SendMail(string email, string subject, string body)
    {
        var smtpClient = new SmtpClient("mail.smtp2go.com")
        {
            Port = 587,
            Credentials = new NetworkCredential("result@1splitkey.com", "lkmMTdsjPsUeORy8"),
            EnableSsl = true,
        };

        MailMessage mail = new MailMessage("result@1splitkey.com", email, subject, body) { IsBodyHtml = true };
        await smtpClient.SendMailAsync(mail);
    }
}