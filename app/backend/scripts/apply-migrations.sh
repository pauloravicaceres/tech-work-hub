#!/usr/bin/env bash
# Paso de despliegue (#18): genera y ejecuta los bundles de migraciones Code-First de cada módulo.
# La API nunca migra por sí sola fuera de Development (Database:MigrateOnStartup=false).
# Uso: ConnectionStrings__Database="Host=...;Database=...;Username=...;Password=..." ./scripts/apply-migrations.sh
set -euo pipefail

: "${ConnectionStrings__Database:?Defina ConnectionStrings__Database por variable de entorno (no se versionan secretos)}"

root="$(cd "$(dirname "$0")/.." && pwd)"
out="${MIGRATION_BUNDLE_DIR:-$root/artifacts/migrations}"
mkdir -p "$out"

dotnet tool restore >/dev/null 2>&1 || true
command -v dotnet-ef >/dev/null 2>&1 || dotnet tool install --global dotnet-ef --version 8.0.11

for module in Application Backlog Sprints; do
  project="$root/src/Modules/$module/$module.csproj"
  bundle="$out/efbundle-${module,,}"
  dotnet ef migrations bundle --project "$project" --startup-project "$project" --self-contained -r linux-x64 --force --output "$bundle"
  "$bundle" --connection "$ConnectionStrings__Database"
done
