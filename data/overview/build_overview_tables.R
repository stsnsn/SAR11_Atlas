suppressPackageStartupMessages({
  library(data.table)
})

annotation_path <- Sys.getenv(
  "SAR11_ALL_PROT_ANNOTATIONS",
  unset = "/Users/satoshinishino/Desktop/SGA配布ファイル/all_prot_annotations.tsv"
)
metadata_path <- "data/phylogeny/subclade_master.tsv"
genome_summary_path <- "data/overview/genome_summary.tsv"
output_dir <- "data/overview"

stopifnot(
  file.exists(annotation_path),
  file.exists(metadata_path),
  file.exists(genome_summary_path)
)

metadata <- fread(metadata_path, na.strings = "NA")
metadata <- metadata[Clade1 != "outgroup"]
stopifnot(nrow(metadata) == 542L, !anyDuplicated(metadata$genome))

metadata[, genome_type := fifelse(
  type == "isolate",
  "Isolate",
  fifelse(type %chin% c("SAG", "MAG"), type, "Unknown")
)]

taxonomy <- metadata[, .(
  genome_id = genome,
  clade_1 = Clade1,
  clade_2 = Clade2,
  subclade = Subclade,
  subgroup = Subgroup,
  Order,
  Family,
  Genus,
  Species,
  reference,
  type_strain_Freel_2024,
  genome_type,
  depth,
  latitude,
  longitude,
  depth_cat,
  latitude_cat,
  longhurst_code,
  description,
  habitat_type,
  waterbody_name,
  habitat_source
)]

genome_summary <- fread(genome_summary_path, na.strings = "NA")
metadata_columns <- setdiff(names(taxonomy), "genome_id")
genome_summary[, (metadata_columns) := NULL]
genome_summary <- taxonomy[
  genome_summary,
  on = "genome_id"
]
stopifnot(nrow(genome_summary) == 542L, !anyNA(genome_summary$genome_id))

preferred_order <- c(
  "genome_id", "genome_size_bp", "gc_percent", "n_contigs", "n50",
  "min_contig_length", "max_contig_length", "n_proteins",
  "median_protein_length", "mean_protein_length", "p95_protein_length",
  "max_protein_length", "COG_coverage", "KO_coverage", "Pfam_coverage",
  "any_annotation_coverage", "completeness", "contamination",
  "completeness_model", "translation_table", "coding_density",
  "checkm2_contig_n50", "checkm2_average_gene_length",
  "checkm2_genome_size", "checkm2_gc_content",
  "checkm2_total_coding_sequences", "checkm2_total_contigs",
  "checkm2_max_contig_length", "checkm2_notes", "quality_class",
  metadata_columns
)
setcolorder(
  genome_summary,
  c(preferred_order[preferred_order %chin% names(genome_summary)],
    setdiff(names(genome_summary), preferred_order))
)

genes <- fread(
  annotation_path,
  select = c(
    "protein_id", "query", "OG_ID", "length",
    "ko_best", "cog_best", "pfam_accessions"
  ),
  na.strings = "NA"
)
stopifnot(nrow(genes) == 675669L, all(genes$query %chin% metadata$genome))

gene_metadata <- metadata[, .(
  query = genome,
  genome_type,
  family = Family,
  genus = Genus,
  subclade = Subclade
)]
genes <- gene_metadata[genes, on = "query"]

genes[, `:=`(
  COG_hit = !is.na(cog_best) & nzchar(cog_best),
  KO_hit = !is.na(ko_best) & nzchar(ko_best),
  Pfam_hit = !is.na(pfam_accessions) & nzchar(pfam_accessions)
)]
genes[, annotation_combination := fcase(
  COG_hit & KO_hit & Pfam_hit, "COG + KO + Pfam",
  COG_hit & KO_hit, "COG + KO",
  COG_hit & Pfam_hit, "COG + Pfam",
  KO_hit & Pfam_hit, "KO + Pfam",
  COG_hit, "COG only",
  KO_hit, "KO only",
  Pfam_hit, "Pfam only",
  default = "No annotation"
)]

annotation_intersections <- genes[, .(
  n_proteins = .N
), by = .(
  genome_type, family, genus, subclade,
  COG_hit, KO_hit, Pfam_hit, annotation_combination
)]
setorder(
  annotation_intersections,
  genome_type, family, genus, subclade, -n_proteins
)

genes[, length_bin_start := fifelse(
  length >= 2000,
  2000,
  floor(length / 25) * 25
)]
genes[, length_bin_end := fifelse(
  length_bin_start == 2000,
  NA_real_,
  length_bin_start + 25
)]
protein_length_bins <- genes[, .(
  n_proteins = .N
), by = .(
  genome_type, family, genus, subclade,
  annotation_combination, length_bin_start, length_bin_end
)]
setorder(
  protein_length_bins,
  genome_type, family, genus, subclade,
  annotation_combination, length_bin_start
)

gene_ogs <- unique(
  genes[!is.na(OG_ID), .(
    query, OG_ID, genome_type, family, genus, subclade
  )]
)
dimensions <- c("genome_type", "family", "genus", "subclade")
orthogroup_rollups <- vector("list", 2^length(dimensions))

for (mask in 0:(2^length(dimensions) - 1L)) {
  current <- copy(gene_ogs)
  active <- as.logical(intToBits(mask))[seq_along(dimensions)]
  for (index in seq_along(dimensions)) {
    if (!active[index]) {
      set(current, j = dimensions[index], value = "All")
    }
  }
  orthogroup_rollups[[mask + 1L]] <- current[, .(
    n_genomes = uniqueN(query),
    n_orthogroups = uniqueN(OG_ID)
  ), by = dimensions]
}

orthogroup_summary <- unique(rbindlist(orthogroup_rollups))
setorder(
  orthogroup_summary,
  genome_type, family, genus, subclade
)

fwrite(
  genome_summary,
  file.path(output_dir, "genome_summary.tsv"),
  sep = "\t",
  na = "NA",
  quote = FALSE
)
fwrite(
  annotation_intersections,
  file.path(output_dir, "annotation_intersections.tsv"),
  sep = "\t",
  na = "NA",
  quote = FALSE
)
fwrite(
  protein_length_bins,
  file.path(output_dir, "protein_length_bins.tsv"),
  sep = "\t",
  na = "NA",
  quote = FALSE
)
fwrite(
  orthogroup_summary,
  file.path(output_dir, "orthogroup_summary.tsv"),
  sep = "\t",
  na = "NA",
  quote = FALSE
)

message("Overview tables regenerated from the harmonized taxonomy.")
