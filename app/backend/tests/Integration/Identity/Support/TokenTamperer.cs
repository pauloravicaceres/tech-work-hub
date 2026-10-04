namespace Integration.Identity.Support;

/// <summary>Altera la firma de un JWT manteniendo un base64url válido y tres segmentos.</summary>
public static class TokenTamperer
{
    private const char Separator = '.';
    private const string Base64UrlAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    public static string TamperSignature(string jwt)
    {
        var segments = jwt.Split(Separator);
        if (segments.Length != 3) throw new ArgumentException("El token no tiene tres segmentos.", nameof(jwt));

        var signature = segments[2].ToCharArray();
        // Se muta un carácter del medio (los últimos bits del último carácter pueden ser relleno y no alterar la firma).
        var index = signature.Length / 2;
        signature[index] = Base64UrlAlphabet[(Base64UrlAlphabet.IndexOf(signature[index]) + 1) % Base64UrlAlphabet.Length];
        segments[2] = new string(signature);

        var tampered = string.Join(Separator, segments);
        if (tampered.Split(Separator).Length != 3 || tampered == jwt)
            throw new InvalidOperationException("La alteración de la firma no produjo un token distinto de tres segmentos.");
        return tampered;
    }
}
