using IdentityModel.Client;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Serilog;
using SplitKey.Webpage.Data;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
  .WriteTo.Seq("http://192.168.178.116:5341", apiKey: "WRuzghhc8yWKz0rlFAUq")
  .CreateLogger();

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped(sp =>
{
    var client = new HttpClient();
    client.BaseAddress = new Uri("https://localhost:8001");
    client.SetBearerToken(Program.AccessToken);
    return client;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.MapBlazorHub();
app.MapFallbackToPage("/_Host");

Program.SetupAccessTokenRefreshTimer();

app.Run();

public static partial class Program
{
    private static Timer timer = null!;

    public static string? AccessToken { get; set; }

    public static void SetupAccessTokenRefreshTimer()
    {
        timer = new Timer(async (e) =>
        {
            Log.Logger.Information("Token expiring soon, requesting new access token...");
            var tokenResponse = await new HttpClient().RequestClientCredentialsTokenAsync(
                new ClientCredentialsTokenRequest
                {
                    Address = "https://identity.devquep.com/connect/token",
                    ClientId = "SplitKey Webpage",
                    ClientSecret = "5077E541-4E68-4F14-BA92-3E657362D037",
                    Scope = "splitkey.api.create",
                });

            if (tokenResponse.IsError)
            {
                Log.Logger.Error("Error retrieving new access token: " + tokenResponse.Error);
                throw new InvalidProgramException("Unable to update Client credentials token: " + tokenResponse.Error);
            }
            AccessToken = tokenResponse.AccessToken;
            Log.Logger.Information($"Got new access token (expiration: {tokenResponse.ExpiresIn} sec). Scheduling new request in {tokenResponse.ExpiresIn - 60} seconds.");
            timer!.Change(TimeSpan.FromSeconds(tokenResponse.ExpiresIn - 60), TimeSpan.FromMilliseconds(Timeout.Infinite));
        });
        timer.Change(5000, Timeout.Infinite);
    }
}