#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(data.table))

args <- commandArgs(trailingOnly = TRUE)
input_path <- if (length(args) >= 1L) args[[1L]] else "data/structure/uniprot_structure_references.tsv"
output_path <- if (length(args) >= 2L) args[[2L]] else "data/structure/uniprot_structure_suggest.tsv"
annotation_path <- if (length(args) >= 3L) args[[3L]] else "data/orthogroups/og_suggest.tsv"

references <- fread(input_path, na.strings = c("", "NA"))
annotations <- fread(annotation_path, na.strings = c("", "NA"))
setorder(references, Orthogroup, Accession_number, -pident, -qcovhsp, -scovhsp, -bitscore, evalue)

# One compact search record per OG-accession pair is sufficient for autocomplete.
suggest <- unique(references, by = c("Orthogroup", "Accession_number"))[
  , .(
    accession = Accession_number,
    orthogroup = Orthogroup,
    match_type = structure_match_type,
    gene_name = GENE_NAME,
    gene_id,
    genome,
    ko_id,
    cog_id = COG_ID,
    pident
  )
]

suggest[
  annotations,
  on = .(orthogroup = og_id),
  `:=`(
    cog_gene = i.cog_gene,
    ko_name = i.ko_name,
    pfam_names = i.pfam_names
  )
]
setcolorder(
  suggest,
  c(
    "accession", "orthogroup", "match_type", "gene_name", "cog_gene",
    "ko_name", "pfam_names", "gene_id", "genome", "ko_id", "cog_id",
    "pident"
  )
)

fwrite(suggest, output_path, sep = "\t", quote = FALSE, na = "")
cat(sprintf(
  "Wrote %s suggestion records across %s OGs to %s.\n",
  format(nrow(suggest), big.mark = ","),
  format(uniqueN(suggest$orthogroup), big.mark = ","),
  output_path
))
