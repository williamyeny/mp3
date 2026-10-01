#!/bin/sh
# Turns each source photo (images/<series>/<name>.jpg) into the three WebP sizes the site uses,
# then deletes the JPEG: <name>-lg.webp (full screen), <name>-md.webp (feed), <name>-th.webp (table).
# Usage: ./make-variants.sh [images/<series> ...]   (default: every series folder)
set -e
cd "$(dirname "$0")"
[ $# -eq 0 ] && set -- images/*
for dir in "$@"; do
  for src in "$dir"/*.jpg; do
    [ -e "$src" ] || continue
    base="${src%.jpg}"
    magick "$src" -resize '1000x1000>' -quality 80 "$base-lg.webp"
    magick "$src" -resize '720x720>' -quality 70 "$base-md.webp"
    magick "$src" -resize '200x200>' -quality 70 "$base-th.webp"
    rm "$src"
  done
done
