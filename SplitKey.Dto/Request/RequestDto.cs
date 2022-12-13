namespace SplitKey.Dto;

public class RequestDto
{
    public Guid Id { get; set; }

    public string WalletName { get; set; }

    public string WalletType { get; set; }

    public bool CaseSensitive { get; set; }

    public string PublicKey { get; set; }

    public string Email { get; set; }

    public DateTime CreatedAt { get; set; }

    public string IpAddress { get; set; }

    public string Hash { get; set; }
}