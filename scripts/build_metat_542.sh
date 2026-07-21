#!/usr/bin/env bash
set -euo pipefail

expression_file="${1:-$HOME/Downloads/SAR11_merged_metaT.tsv.gz}"
mapping_file="${2:-$HOME/Downloads/all_prot_annotations.tsv}"
score_file="${3:-data/env_corr_542/sample_og_sumTPM.tsv}"

mkdir -p "$(dirname "$score_file")"

LC_ALL=C awk -F '\t' '
  NR == FNR {
    if (FNR == 1) {
      for (i = 1; i <= NF; i++) {
        if ($i == "protein_id") protein_col = i
        if ($i == "OG_ID") og_col = i
      }
      next
    }
    if (protein_col && og_col && $(og_col) != "NA" && $(og_col) != "") {
      protein_to_og[$(protein_col)] = $(og_col)
    }
    next
  }
  FNR == 1 {
    for (i = 1; i <= NF; i++) {
      if ($i == "sample") sample_col = i
      if ($i == "feature") feature_col = i
      if ($i == "TPM") tpm_col = i
    }
    next
  }
  sample_col && feature_col && tpm_col {
    og = protein_to_og[$(feature_col)]
    if (og != "" && $(tpm_col) != "") {
      scores[$(sample_col) SUBSEP og] += $(tpm_col) + 0
    }
  }
  END {
    print "sample_id\tOG_ID\tsumTPM"
    for (key in scores) {
      split(key, fields, SUBSEP)
      print fields[1] "\t" fields[2] "\t" scores[key]
    }
  }
' "$mapping_file" <(gzip -cd "$expression_file") > "$score_file"

echo "Wrote $score_file"
