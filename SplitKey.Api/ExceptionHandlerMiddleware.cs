using SplitKey.Service.Errors;
using System.Text.Json;

public class ExceptionHandlerMiddleware
{
    private readonly RequestDelegate next;
    public ExceptionHandlerMiddleware(RequestDelegate next)
    {
        this.next = next;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await this.next(ctx);
        }
        catch (Exception error)
        {
            ctx.Response.ContentType = "application/json";

            ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var result = JsonSerializer.Serialize(new ErrorDetails(ctx.Response.StatusCode, error.Message));
            await ctx.Response.WriteAsync(result);
        }
    }
}