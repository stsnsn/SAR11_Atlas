#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
output_dir="$project_root/data/BLAST/search"
cache_dir="${TMPDIR:-/tmp}/sar11-wasm-build-cache"

if ! command -v emcc >/dev/null 2>&1; then
    echo "Error: emcc (Emscripten) is required to rebuild the Wasm module." >&2
    exit 1
fi

mkdir -p "$output_dir" "$cache_dir"

EM_CACHE="$cache_dir" emcc \
    "$project_root/wasm/smith_waterman.c" \
    -O3 \
    -s STANDALONE_WASM=1 \
    --no-entry \
    -s INITIAL_MEMORY=262144 \
    -s ALLOW_MEMORY_GROWTH=0 \
    -Wl,--strip-all \
    -o "$output_dir/smith_waterman.wasm"

echo "Built $output_dir/smith_waterman.wasm"
