namespace SplitKey.Domain;

using CSharpFunctionalExtensions;
using SplitKey.Domain.Entities;

public class Request : TrackedEntity
{

    private Request(string walletName, WalletType walletType, bool caseSensitive,
        HexString publicKey, string? email, string ipAddress, bool hallOfFame)
    {
        this.WalletName = walletName;
        this.WalletType = walletType;
        this.CaseSensitive = caseSensitive;
        this.PublicKey = publicKey;
        this.Email = email;
        this.IpAddress = ipAddress;
        this.HallOfFame = hallOfFame;

        this.Id = Guid.NewGuid();
        this.Hash = HexString.Create(this.Id.ToString().Replace("-", "")).Value;

        this.Difficulty = CalculateDifficulty();
    }

    public Guid Id { get; set; }

    public string WalletName { get; init; }

    public WalletType WalletType { get; init; }

    public bool CaseSensitive { get; init; }

    public ulong Difficulty { get; private set; }

    public HexString PublicKey { get; init; }

    public string? Email { get; init; }

    public string IpAddress { get; init; }

    public HexString Hash { get; init; }

    public bool HallOfFame { get; private set; }

    public virtual MasterKey MasterKey { get; set; } = null!;
    public virtual List<LostKey> LostKeys { get; set; } = null!;

    public ulong CalculateDifficulty()
    {
        return CalculateDifficulty(this.WalletName, this.WalletType, this.CaseSensitive);
    }

    public static Result<Request> Create(
        string walletName,
        WalletType walletType,
        bool caseSensitive,
        HexString publicKey,
        string? email,
        string ipAddress,
        bool hallOfFame)
    {
        Result walletNameResult = Result.Success();
        Result walletTypeResult = Result.Success();
        Result publicKeyResult = Result.Success();
        Result ipAddressResult = Result.Success();

        if (string.IsNullOrWhiteSpace("walletName")) 
        {
            walletNameResult = Result.Failure($"{nameof(walletName)} can't be empty.");
        }

        if (walletType != WalletType.Legacy)
        {
            walletTypeResult = Result.Failure($"Wallet type '{walletType.Name}' not supported.");
        }

        if (publicKey.Value.Length != 130)
        {
            publicKeyResult = Result.Failure("Public key is in incorrect format.");
        }

        if (string.IsNullOrWhiteSpace(ipAddress))
        {
            ipAddressResult = Result.Failure($"{ipAddress} in invalid format or missing.");
        }

        Result result = Result.Combine(walletNameResult, walletTypeResult, publicKeyResult, ipAddressResult);
        if (result.IsFailure)
        {
            return Result.Failure<Request>(result.Error);
        }

        return Result.Success(new Request(walletName, walletType, caseSensitive, publicKey, email, ipAddress, hallOfFame));
    }

    public static ulong CalculateDifficulty(string walletName, WalletType type, bool caseSensitive)
    {
        if (type != WalletType.Legacy) return 0;

        bool leadingOnes = true;

        string uncaseable = "123456789oiL";
        int caseable = 0;
        int noncaseable = 0;

        string _1Q = "234567890ABCDEFGHIJKLMNOPQ";
        string Rz = "RSTUVWXYZabcdefghijklmnopqrstuvxyz";

        ulong diff = 256;
        if (_1Q.Contains(walletName[0]))
        {
            diff = 23;
        }
        else if (Rz.Contains(walletName[0]))
        {
            diff = 1354;
        }
        for (int i = 1; i < walletName.Length; i++)
        {
            if (uncaseable.Contains(walletName[i]))
            {
                noncaseable++;
            }
            else
            {
                caseable++;
            }

            if (walletName[i] == '1' && leadingOnes)
            {

                diff *= 256;
            }
            else
            {
                diff *= 58;
            }

            if (walletName[i] != '1')
                leadingOnes = false;
        }

        if (!caseSensitive && caseable > 0)
        {
            if (noncaseable > 0)
            {
                diff = (ulong)(diff / 1.3);
            }
            else
            {
                diff = (ulong)(diff / 2);
            }
        }
        return diff;
    }
}