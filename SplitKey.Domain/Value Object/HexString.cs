namespace SplitKey.Domain.Entities;

using CSharpFunctionalExtensions;
using System.Text.RegularExpressions;

public class HexString
{
    public string Value { get; init; }

    private HexString(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentNullException(nameof(value));
        }

        this.Value = value;
    }

    public static Result<HexString> Create(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return Result.Failure<HexString>($"{nameof(input)} can't be empty.");
        }

        if (!hexRegex.IsMatch(input))
        {
            return Result.Failure<HexString>($"{nameof(input)} is not a valid hexadecimal string.");
        }

        return new HexString(input);
    }

    private static Regex hexRegex = new Regex(@"\A\b[0-9a-fA-F]+\b\Z");

    public override string ToString() => this.Value.ToUpper();
    public override int GetHashCode() => this.Value.ToString().GetHashCode();

    public override bool Equals(object? obj)
    {
        if (obj == null && this == null)
        {
            return true;
        }

        if(obj is HexString)
        {
            return this.ToString().Equals(obj?.ToString());
        }

        return false;
    }
}
