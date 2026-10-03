using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Backlog.Domain.BacklogItems;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public interface IApplicationModuleApi
{
    Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default);
}

public interface IBacklogDbContext
{
    Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class CreateBacklogItemCommandHandler : IRequestHandler<CreateBacklogItemCommand, Guid>
{
    private readonly IBacklogDbContext _dbContext;
    private readonly IApplicationModuleApi _applicationModuleApi;

    public CreateBacklogItemCommandHandler(
        IBacklogDbContext dbContext,
        IApplicationModuleApi applicationModuleApi)
    {
        _dbContext = dbContext;
        _applicationModuleApi = applicationModuleApi;
    }

    public async Task<Guid> Handle(CreateBacklogItemCommand request, CancellationToken cancellationToken)
    {
        if (request.ApplicationId.HasValue)
        {
            var exists = await _applicationModuleApi.ExistsAsync(request.ApplicationId.Value, cancellationToken);
            if (!exists)
            {
                throw new ValidationException("The specified Application does not exist.");
            }
        }

        var type = Enum.Parse<BacklogItemType>(request.Type, ignoreCase: true);

        // US2: T016 - Technical items like Spike do not require QA points. 
        // We ensure qaPoints is null or handle as per rules if needed. 
        // The task says "asegurar que qaPoints en elementos técnicos se guarde y retorne como nulo correctamente."
        int? qaPoints = request.QAPoints;
        if (type is BacklogItemType.Spike or BacklogItemType.Research or BacklogItemType.TechDebt or BacklogItemType.TechEvolution or BacklogItemType.TechRequirement)
        {
            qaPoints = null; // Enforce null for technical items
        }

        var item = BacklogItem.Create(
            Guid.NewGuid(),
            request.Title,
            request.Description,
            type,
            request.DevPoints,
            qaPoints,
            request.ApplicationId);

        await _dbContext.AddAsync(item, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return item.Id;
    }
}
