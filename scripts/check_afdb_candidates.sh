#!/usr/bin/env bash
set -euo pipefail

candidate_file="${1:-/tmp/uniprot_pid30_afdb_candidates.tsv}"
status_file="${2:-/tmp/afdb_pid30_candidate_status.tsv}"
parallel_jobs="${AFDB_PARALLEL_JOBS:-2}"

pending_file="$(mktemp)"
trap 'rm -f "$pending_file"' EXIT

if [[ ! -f "$status_file" ]]; then
    printf 'Accession_number\thttp_status\n' > "$status_file"
fi

awk -F '\t' '
    NR == FNR {
        if (FNR > 1 && ($2 == "200" || $2 == "404")) checked[$1] = 1
        next
    }
    FNR == 1 {
        for (i = 1; i <= NF; i++) if ($i == "Accession_number") accession_col = i
        next
    }
    accession_col && !checked[$accession_col] && !seen[$accession_col]++ {
        print $accession_col
    }
' "$status_file" "$candidate_file" > "$pending_file"

remaining="$(wc -l < "$pending_file" | tr -d ' ')"
printf 'Checking %s previously untested AlphaFoldDB accessions with %s workers.\n' "$remaining" "$parallel_jobs"

export status_file
xargs -n 1 -P "$parallel_jobs" sh -c '
    accession="$1"
    status="$(curl \
        --location \
        --silent \
        --show-error \
        --retry 3 \
        --retry-delay 2 \
        --connect-timeout 10 \
        --max-time 30 \
        --user-agent "SAR11-Genome-Atlas/1.0 (academic data preparation)" \
        --output /dev/null \
        --write-out "%{http_code}" \
        "https://alphafold.ebi.ac.uk/api/prediction/${accession}" || printf "000")"
    printf "%s\t%s\n" "$accession" "$status" >> "$status_file"
    sleep 0.15
' _ < "$pending_file"

printf 'AlphaFoldDB status cache written to %s.\n' "$status_file"
