#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(data.table))

args <- commandArgs(trailingOnly = TRUE)
candidate_path <- if (length(args) >= 1L) args[[1L]] else "/tmp/uniprot_pid30_afdb_candidates.tsv"
status_path <- if (length(args) >= 2L) args[[2L]] else "/tmp/afdb_pid30_candidate_status.tsv"
output_path <- if (length(args) >= 3L) args[[3L]] else "data/structure/uniprot_pid30_homologous_afdb_matches.tsv"
close_match_path <- if (length(args) >= 4L) args[[4L]] else "data/structure/uniprot_pid85_afdb_matches.tsv"
combined_path <- if (length(args) >= 5L) args[[5L]] else "data/structure/uniprot_structure_references.tsv"

candidates <- fread(candidate_path, na.strings = c("", "NA"))
status <- fread(status_path, na.strings = c("", "NA"))
status <- status[http_status != "000"]
status <- unique(status, by = "Accession_number", fromLast = TRUE)

result <- status[candidates, on = "Accession_number"]
result[, afdb_available := http_status == "200"]
result <- result[afdb_available == TRUE]
result[, http_status := NULL]

setorder(result, Orthogroup, -pident, -qcovhsp, -scovhsp, -bitscore, evalue)
setcolorder(
  result,
  c(
    "Orthogroup", "gene_id", "genome", "Accession_number", "db_source",
    "pident", "qcovhsp", "scovhsp", "evalue", "bitscore",
    "afdb_available", "ko_id", "ko_description", "COG_ID", "GENE_NAME",
    "COG_NAME"
  )
)
fwrite(result, output_path, sep = "\t", quote = FALSE, na = "NA")

close_matches <- fread(close_match_path, na.strings = c("", "NA"))
close_matches <- close_matches[qcovhsp >= 80 & scovhsp >= 80]
close_matches[, structure_match_type := "Close sequence match"]
result[, structure_match_type := "Homologous structure reference"]

# Use homologous references only for OGs lacking a close sequence match.
fallback_ogs <- setdiff(unique(result$Orthogroup), unique(close_matches$Orthogroup))
fallback_matches <- result[Orthogroup %in% fallback_ogs]
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
fwrite(combined, combined_path, sep = "\t", quote = FALSE, na = "NA")

cat(sprintf(
  paste0(
    "Wrote %s AFDB-confirmed homologous references across %s orthogroups to %s.\n",
    "Combined table: %s rows across %s orthogroups, including %s homolog-only OGs, written to %s.\n"
  ),
  format(nrow(result), big.mark = ","),
  format(uniqueN(result$Orthogroup), big.mark = ","),
  output_path,
  format(nrow(combined), big.mark = ","),
  format(uniqueN(combined$Orthogroup), big.mark = ","),
  format(uniqueN(fallback_matches$Orthogroup), big.mark = ","),
  combined_path
))
