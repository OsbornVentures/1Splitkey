namespace SplitKey.Webpage.Data;

public class RequestSubmission
{
    public string? Email { get; set; }
    public string PublicKey { get; set; }
    public string WalletType { get; set; } = "legacy";
    public bool CaseSensitive { get; set; }
    public string WalletName { get; set; }
    public bool HallOfFame { get; set; }
}