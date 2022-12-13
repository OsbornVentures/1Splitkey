using System.Net;
using System.Net.Mail;

namespace SplitKey.Dto;

public class CreateRequestDto
{
    public string WalletName { get; set; }
    public string WalletType { get; set; }
    public bool CaseSensitive { get; set; }
    public string PublicKey { get; set; }
    public string Email { get; set; }
    public string IpAddress { get; set; }
    public bool HallOfFame { get; set; }
}
