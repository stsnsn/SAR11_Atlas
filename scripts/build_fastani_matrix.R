#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly = TRUE)
input_path <- if (length(args) >= 1L) args[[1L]] else "data/phylogeny/fastani_SAR11_542.out"
output_path <- if (length(args) >= 2L) args[[2L]] else "data/phylogeny/fastani_SAR11_542_symmetric_matrix.tsv"

raw <- read.delim(
  input_path,
  header = FALSE,
  col.names = c("query", "reference", "ani", "matched_fragments", "total_fragments"),
  colClasses = c("character", "character", "numeric", "integer", "integer"),
  check.names = FALSE
)

stopifnot(
  nrow(raw) > 0L,
  !anyDuplicated(raw[c("query", "reference")]),
  all(raw$ani > 0 & raw$ani <= 100),
  all(raw$matched_fragments <= raw$total_fragments)
)

raw$query <- sub("\\.fna$", "", basename(raw$query))
raw$reference <- sub("\\.fna$", "", basename(raw$reference))
genomes <- sort(unique(c(raw$query, raw$reference)))

stopifnot(length(genomes) == 542L, !anyDuplicated(genomes))

ani_sum <- matrix(0, nrow = length(genomes), ncol = length(genomes), dimnames = list(genomes, genomes))
ani_n <- matrix(0L, nrow = length(genomes), ncol = length(genomes), dimnames = list(genomes, genomes))

for (i in seq_len(nrow(raw))) {
  query <- raw$query[[i]]
  reference <- raw$reference[[i]]
  ani <- raw$ani[[i]]

  ani_sum[query, reference] <- ani_sum[query, reference] + ani
  ani_n[query, reference] <- ani_n[query, reference] + 1L
  if (query != reference) {
    ani_sum[reference, query] <- ani_sum[reference, query] + ani
    ani_n[reference, query] <- ani_n[reference, query] + 1L
  }
}

ani_matrix <- ani_sum / ani_n
ani_matrix[ani_n == 0L] <- NA_real_
diag(ani_matrix) <- 100

stopifnot(
  identical(rownames(ani_matrix), colnames(ani_matrix)),
  isTRUE(all.equal(ani_matrix, t(ani_matrix), check.attributes = FALSE)),
  all(diag(ani_matrix) == 100)
)

output <- data.frame(genome = rownames(ani_matrix), ani_matrix, check.names = FALSE)
write.table(
  output,
  file = output_path,
  sep = "\t",
  quote = FALSE,
  row.names = FALSE,
  col.names = TRUE,
  na = "NA"
)

cat(sprintf(
  "Wrote %d x %d symmetric ANI matrix to %s (%d NA cells).\n",
  nrow(ani_matrix),
  ncol(ani_matrix),
  output_path,
  sum(is.na(ani_matrix))
))
