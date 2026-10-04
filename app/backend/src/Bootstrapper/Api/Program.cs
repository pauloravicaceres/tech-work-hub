using System.Text.Json.Serialization;
using Application;
using Backlog;
using Carter;
using Keycloak.AuthServices.Authentication;
using Shared;
using Sprints;

const string MigrateOnStartupKey = "Database:MigrateOnStartup";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSharedInfrastructure();
builder.Services.AddCarter();
builder.Services.AddBacklogModule(builder.Configuration);
builder.Services.AddApplicationModule(builder.Configuration);
builder.Services.AddSprintsModule(builder.Configuration);

// priority y type viajan como texto ("High"), no como entero (FR-011).
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddKeycloakWebApiAuthentication(builder.Configuration);
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.MapCarter();

if (app.Configuration.GetValue<bool>(MigrateOnStartupKey))
{
    await app.Services.MigrateApplicationModuleAsync();
    await app.Services.MigrateBacklogModuleAsync();
    await app.Services.MigrateSprintsModuleAsync();
}

app.Run();

public partial class Program;
