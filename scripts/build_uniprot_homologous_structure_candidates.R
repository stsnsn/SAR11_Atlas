#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(data.table))

args <- commandArgs(trailingOnly = TRUE)
sprot_path <- if (length(args) >= 1L) args[[1L]] else "~/Downloads/sar11_vs_sprot_2026_01_pid30_max10seqs.tsv"
trembl_path <- if (length(args) >= 2L) args[[2L]] else "~/Downloads/sar11_vs_trembl_2026_01_pid30_max10seqs.tsv"
annotation_path <- if (length(args) >= 3L) args[[3L]] else "~/Desktop/SGA配布ファイル/all_prot_annotations.tsv"
filtered_path <- if (length(args) >= 4L) args[[4L]] else "~/Downloads/uniprot_pid30_cov80_filtered_hits.tsv.gz"
candidate_path <- if (length(args) >= 5L) args[[5L]] else "/tmp/uniprot_pid30_afdb_candidates.tsv"

input_names <- c(
  "gene_id", "Accession_number", "pident", "alnlen", "qlen", "slen",
  "qcovhsp", "scovhsp", "evalue", "bitscore"
)

read_hits <- function(path, source_name) {
  hits <- fread(
    path,
    header = FALSE,
    col.names = input_names,
    showProgress = TRUE
  )
  hits <- hits[
    pident >= 30 &
      qcovhsp >= 80 &
      scovhsp >= 80 &
      evalue <= 1e-5
  ]
  hits[, db_source := source_name]
  hits
}

sprot <- read_hits(path.expand(sprot_path), "Swiss-Prot")
trembl <- read_hits(path.expand(trembl_path), "TrEMBL")
hits <- rbindlist(list(sprot, trembl), use.names = TRUE)
rm(sprot, trembl)

# Retain the strongest duplicate if an accession was reported more than once.
setorder(hits, gene_id, Accession_number, -bitscore, evalue)
hits <- unique(hits, by = c("gene_id", "Accession_number"))

annotation <- fread(
  path.expand(annotation_path),
  select = c(
    "protein_id", "query", "OG_ID", "ko_best", "ko_best_definition",
    "cog_best", "cog_best_gene", "cog_best_description"
  ),
  na.strings = c("", "NA")
)
setnames(
  annotation,
  c(
    "protein_id", "query", "OG_ID", "ko_best", "ko_best_definition",
    "cog_best", "cog_best_gene", "cog_best_description"
  ),
  c(
    "gene_id", "genome", "Orthogroup", "ko_id", "ko_description",
    "COG_ID", "GENE_NAME", "COG_NAME"
  )
)

hits <- annotation[hits, on = "gene_id"]
stopifnot(nrow(hits) > 0L, !anyNA(hits$gene_id))

output_columns <- c(
  "Orthogroup", "gene_id", "genome", "Accession_number", "db_source",
  "pident", "alnlen", "qlen", "slen", "qcovhsp", "scovhsp", "evalue",
  "bitscore", "ko_id", "ko_description", "COG_ID", "GENE_NAME", "COG_NAME"
)
fwrite(
  hits[, ..output_columns],
  path.expand(filtered_path),
  sep = "\t",
  quote = FALSE,
  na = "NA",
  compress = "gzip"
)

candidates <- hits[!is.na(Orthogroup)]
candidates[, min_coverage := pmin(qcovhsp, scovhsp)]
setorder(
  candidates,
  Orthogroup,
  -pident,
  -min_coverage,
  -qcovhsp,
  -scovhsp,
  -bitscore,
  evalue
)
candidates <- unique(candidates, by = c("Orthogroup", "Accession_number"))
candidates <- candidates[, head(.SD, 5L), by = Orthogroup]
candidates[, c("min_coverage") := NULL]
candidates[, afdb_available := NA]

web_columns <- c(
  "Orthogroup", "gene_id", "genome", "Accession_number", "db_source",
  "pident", "qcovhsp", "scovhsp", "evalue", "bitscore", "afdb_available",
  "ko_id", "ko_description", "COG_ID", "GENE_NAME", "COG_NAME"
)
fwrite(
  candidates[, ..web_columns],
  candidate_path,
  sep = "\t",
  quote = FALSE,
  na = "NA"
)

cat(sprintf(
  paste0(
    "Filtered hits: %s rows across %s proteins and %s orthogroups.\n",
    "AFDB candidates: %s rows (%s unique accessions) across %s orthogroups.\n"
  ),
  format(nrow(hits), big.mark = ","),
  format(uniqueN(hits$gene_id), big.mark = ","),
  format(uniqueN(na.omit(hits$Orthogroup)), big.mark = ","),
  format(nrow(candidates), big.mark = ","),
  format(uniqueN(candidates$Accession_number), big.mark = ","),
  format(uniqueN(candidates$Orthogroup), big.mark = ",")
))
