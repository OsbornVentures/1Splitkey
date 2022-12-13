using System.Net.Mail;

namespace SplitKey.Dto
{
    public class RequestEstimatesDto
    {
        public string WalletName { get; set; }
        public string WalletType { get; set; }
        public bool CaseSensitive { get; set; }
        public string Email { get; set; }
    }
}
