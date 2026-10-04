# Paso de despliegue (#18): genera y ejecuta los bundles de migraciones Code-First de cada módulo.
# La API nunca migra por sí sola fuera de Development (Database:MigrateOnStartup=false).
# Uso: $env:ConnectionStrings__Database = "Host=...;Database=...;Username=...;Password=..."; ./scripts/apply-migrations.ps1
$ErrorActionPreference = 'Stop'

if (-not $env:ConnectionStrings__Database) {
    throw 'Defina ConnectionStrings__Database por variable de entorno (no se versionan secretos).'
}

$root = Split-Path -Parent $PSScriptRoot
$out = if ($env:MIGRATION_BUNDLE_DIR) { $env:MIGRATION_BUNDLE_DIR } else { Join-Path $root 'artifacts/migrations' }
New-Item -ItemType Directory -Force $out | Out-Null

if (-not (Get-Command dotnet-ef -ErrorAction SilentlyContinue)) {
    dotnet tool install --global dotnet-ef --version 8.0.11
}

foreach ($module in 'Application', 'Backlog', 'Sprints') {
    $project = Join-Path $root "src/Modules/$module/$module.csproj"
    $bundle = Join-Path $out "efbundle-$($module.ToLower())"
    dotnet ef migrations bundle --project $project --startup-project $project --self-contained --force --output $bundle
    if ($LASTEXITCODE -ne 0) { throw "Falló la generación del bundle de $module" }
    & "$bundle.exe" --connection $env:ConnectionStrings__Database
    if ($LASTEXITCODE -ne 0) { throw "Falló la aplicación de migraciones de $module" }
}
