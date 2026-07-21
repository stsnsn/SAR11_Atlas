#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(data.table))

args <- commandArgs(trailingOnly = TRUE)
close_path <- if (length(args) >= 1L) args[[1L]] else "data/structure/uniprot_pid85_afdb_matches.tsv"
homolog_path <- if (length(args) >= 2L) args[[2L]] else "data/structure/uniprot_pid30_homologous_afdb_matches.tsv"
combined_path <- if (length(args) >= 3L) args[[3L]] else "data/structure/uniprot_structure_references.tsv"

close_matches <- fread(close_path, na.strings = c("", "NA"))
homolog_matches <- fread(homolog_path, na.strings = c("", "NA"))

# Both displayed reference tiers require substantial bidirectional coverage.
close_matches <- close_matches[qcovhsp >= 80 & scovhsp >= 80]
homolog_matches <- homolog_matches[qcovhsp >= 80 & scovhsp >= 80]

close_matches[, structure_match_type := "Close sequence match"]
homolog_matches[, structure_match_type := "Homologous structure reference"]

# Use broader homologous references only for OGs lacking a qualifying close match.
fallback_ogs <- setdiff(unique(homolog_matches$Orthogroup), unique(close_matches$Orthogroup))
fallback_matches <- homolog_matches[Orthogroup %in% fallback_ogs]
combined <- rbindlist(list(close_matches, fallback_matches), use.names = TRUE, fill = TRUE)

setorder(combined, Orthogroup, structure_match_type, -pident, -qcovhsp, -scovhsp, -bitscore, evalue)
setcolorder(
  combined,
  c(
    "Orthogroup", "gene_id", "genome", "Accession_number", "db_source",
    "structure_match_type", "pident", "qcovhsp", "scovhsp", "evalue",
    "bitscore", "afdb_available", "ko_id", "ko_description", "COG_ID",
    "GENE_NAME", "COG_NAME"
  )
)

close_tmp <- tempfile(tmpdir = dirname(close_path), fileext = ".tsv")
combined_tmp <- tempfile(tmpdir = dirname(combined_path), fileext = ".tsv")
fwrite(close_matches[, structure_match_type := NULL], close_tmp, sep = "\t", quote = FALSE, na = "NA")
fwrite(combined, combined_tmp, sep = "\t", quote = FALSE, na = "NA")
stopifnot(file.rename(close_tmp, close_path), file.rename(combined_tmp, combined_path))

cat(sprintf(
  paste0(
    "Close matches: %s rows across %s OGs.\n",
    "Homologous fallback: %s rows across %s OGs.\n",
    "Combined coverage: %s rows across %s of 4,577 OGs (%.1f%%).\n"
  ),
  format(nrow(close_matches), big.mark = ","),
  format(uniqueN(close_matches$Orthogroup), big.mark = ","),
  format(nrow(fallback_matches), big.mark = ","),
  format(uniqueN(fallback_matches$Orthogroup), big.mark = ","),
  format(nrow(combined), big.mark = ","),
  format(uniqueN(combined$Orthogroup), big.mark = ","),
  100 * uniqueN(combined$Orthogroup) / 4577
))
