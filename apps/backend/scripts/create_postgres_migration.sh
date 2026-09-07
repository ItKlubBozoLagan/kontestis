#!/bin/bash

set -euo pipefail

NAME=${1-}
DIR="src/database/postgres/migrations"

if [[ -z $NAME ]] || [[ ! $NAME =~ ^[a-z0-9_]+$ ]]; then
  echo "Usage: $0 <snake_case_migration_name>"
  exit 1
fi

LAST_MIGRATION_NUMBER=$(find "$DIR"/[0-9][0-9][0-9][0-9]_*.ts -exec basename {} \; | cut -d '_' -f 1 | sort | tail -1)
NEXT_VERSION=$((10#$LAST_MIGRATION_NUMBER + 1))
NEXT_MIGRATION_NUMBER=$(printf "%04d" "$NEXT_VERSION")
NEXT_MIGRATION_LOCATION="$DIR/${NEXT_MIGRATION_NUMBER}_${NAME}.ts"

if [[ -e $NEXT_MIGRATION_LOCATION ]]; then
  echo "Migration already exists: $NEXT_MIGRATION_LOCATION"
  exit 1
fi

cat <<EOF > "$NEXT_MIGRATION_LOCATION"
import { defineSqlMigration } from "./types";

const sql = \`
-- Write forward-only PostgreSQL SQL here.
\`;

export const migration${NEXT_MIGRATION_NUMBER} = defineSqlMigration({
    version: $NEXT_VERSION,
    name: "$NAME",
    sql,
});
EOF

echo "Created $NEXT_MIGRATION_LOCATION"
echo "Add migration${NEXT_MIGRATION_NUMBER} to src/database/postgres/migrations/index.ts"
