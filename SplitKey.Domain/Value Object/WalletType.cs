namespace SplitKey.Domain.Entities;

public class WalletType
{
    public string Name { get; init; }
    public string Prefix { get; init; }

    private WalletType(string name, string prefix)
    {
        Name = name;
        Prefix = prefix;
    }

    public static readonly WalletType Unknown = new ("Unknown", string.Empty);
    public static readonly WalletType Legacy = new ("legacy", "1");
    public static readonly WalletType SegwitP2sh = new ("SegWit P2SH", "3");
    public static readonly WalletType SegwitBech = new ("SegWit Bech32", "bc1q");

    public static WalletType FromString(string input)
    {
        return input.ToLower() switch
        {
            "legacy" => Legacy,
            "segwit p2sh" => SegwitP2sh,
            "segwitt bech32" => SegwitBech,
            _ => Unknown,
        };
    }

    public override string ToString() => this.Name;
    public static bool operator ==(WalletType a, WalletType b) => a.Name.Equals(b?.Name);
    public static bool operator !=(WalletType a, WalletType b) => !(a == b);
    public override int GetHashCode() => Name.GetHashCode();
    public override bool Equals(object? obj)
    {
        if (obj == null)
        {
            return false;
        }

        if (obj is WalletType)
        {
            WalletType? other = (WalletType)obj;
            return other.Name.Equals(Name);
        }

        return false;
    }
}