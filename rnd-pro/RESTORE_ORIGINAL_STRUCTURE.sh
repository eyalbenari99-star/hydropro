#!/bin/zsh
set -euo pipefail

rnd_flat_directory="${0:A:h}"
rnd_restored_directory="$rnd_flat_directory/RESTORED_HydroNexis_RND_Developer_Package"

mkdir -p "$rnd_restored_directory"

for rnd_flat_file in "$rnd_flat_directory"/*; do
  [[ -f "$rnd_flat_file" ]] || continue
  rnd_flat_name="${rnd_flat_file:t}"

  case "$rnd_flat_name" in
    FLAT_PACKAGE_README.md|RESTORE_ORIGINAL_STRUCTURE.sh)
      continue
      ;;
  esac

  rnd_relative_path="${rnd_flat_name//___DIR___//}"
  rnd_destination="$rnd_restored_directory/$rnd_relative_path"
  mkdir -p "${rnd_destination:h}"
  cp "$rnd_flat_file" "$rnd_destination"
done

print "Restored buildable package: $rnd_restored_directory"
