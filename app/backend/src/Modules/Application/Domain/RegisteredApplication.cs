namespace Application.Domain;

public class RegisteredApplication
{
    public const int NameMaxLength = 200;

    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;

    private RegisteredApplication() { } // For EF Core

    public static RegisteredApplication Create(Guid id, string name) => new() { Id = id, Name = name };
}
