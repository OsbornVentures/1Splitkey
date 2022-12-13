using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SplitKey.DbContext;
using SplitKey.Service;
using SplitKey.Service.Contracts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
  .WriteTo.Seq("http://192.168.178.116:5341", apiKey: "5SEqggDT6gQeRHmiitZU")
  .CreateLogger();

builder.Services.AddDbContext<SplitKeyContext>(opts => opts.UseSqlServer(builder.Configuration.GetConnectionString("default")));

builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<IRequestService, RequestService>();
builder.Services.AddTransient<IMailerService, MailerService>();

builder.Services.AddAutoMapper(typeof(Program).Assembly);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication(auth => {
    auth.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    auth.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    auth.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(opts => 
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;
        opts.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://identity.devquep.com/",
            RequireExpirationTime = true,
            ValidateIssuerSigningKey = true,
            ValidateAudience = false,
        };
        opts.Authority = "https://identity.devquep.com/";
    });

builder.Services.AddAuthorization(opts => {
    opts.AddPolicy("Api.Create", policy => policy.RequireClaim("scope", "splitkey.api.create"));
});


var app = builder.Build();

app.UseMiddleware<ExceptionHandlerMiddleware>();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();