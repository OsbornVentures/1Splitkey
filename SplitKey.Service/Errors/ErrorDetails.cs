namespace SplitKey.Service.Errors;

public class ErrorDetails
{
    public int StatusCode { get; set; }
    public string Message { get; set; }

    public ErrorDetails(int statusCode, string message)
    {
        this.StatusCode = statusCode;
        this.Message = message;
    }
}
