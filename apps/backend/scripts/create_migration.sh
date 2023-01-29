#!/bin/bash

set -euo pipefail

DIR=${1-}
NAME=${2-}

if [[ -z $DIR ]] || [[ -z $NAME ]]; then
  echo "Usage: $0 <migrations_directory> <migration_name>"
  exit 1
fi

LAST_MIGRATION_NUMBER=$(find "$DIR"/[0-9][0-9][0-9][0-9]_*.ts -exec basename {} \; | cut -d '_' -f 1 | sort | tail -1)
NEXT_MIGRATION_NUMBER=$(printf "%04d\n" $((10#$LAST_MIGRATION_NUMBER + 1)))

NEXT_MIGRATION_NAME="${NEXT_MIGRATION_NUMBER}_$NAME.ts"
NEXT_MIGRATION_LOCATION="$DIR"/"$NEXT_MIGRATION_NAME"

cat <<EOF > "$NEXT_MIGRATION_LOCATION"
import { Migration } from "scyllo";

type MigrationType = {

}

export const migration_$NAME: Migration<MigrationType> = async (database, log) => {


    log("Done");
};
EOF

echo -e "\n----"
echo "$LAST_MIGRATION_NUMBER -> $NEXT_MIGRATION_NUMBER"
echo "Migration saved to \"$NEXT_MIGRATION_LOCATION\""
echo -e "----\n"

