#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(data.table))

score_file <- "data/env_corr_542/sample_og_sumTPM.tsv"
coordinate_metadata_file <- "data/env_corr_542/sample_metadata.tsv"
tara_metadata_file <- path.expand("~/Downloads/Tara_metaT_metadata.txt")
run_metadata_file <- path.expand("~/Downloads/tara_metadata.txt")
output_dir <- "data/env_corr_542"
full_metadata_file <- file.path(output_dir, "tara_metadata_542.tsv")

dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)

scores <- fread(score_file, na.strings = c("", "NA"))

# Prefer the supplemental table because it directly maps all 509 ERR run IDs
# to Tara station metadata. The larger Tara table supplies the remaining
# station-level fields when station and nominal depth match.
if (file.exists(run_metadata_file)) {
  run_metadata <- fread(run_metadata_file, skip = 2, na.strings = c("", "NA"), check.names = FALSE)
  if (ncol(run_metadata) != 22) {
    stop("Unexpected number of columns in tara_metadata.txt: ", ncol(run_metadata))
  }
  setnames(run_metadata, c(
    "ENA_Run_ID", "Sample_ID", "Latitude", "Longitude", "Station",
    "Depth_nominal", "Temperature", "Conductivity", "Salinity",
    "Potential_temperature", "Sigma_theta", "Oxygen", "NO3",
    "ChlorophyllA", "beta470", "bb470", "bbp470", "fCDOM",
    "bac660", "bacp660", "PAR_day", "PAR_percent"
  ))
  run_metadata[, join_key := paste(
    Station,
    sprintf("%.6f", as.numeric(Depth_nominal)),
    sep = "|"
  )]

  tara_metadata <- fread(tara_metadata_file, na.strings = c("", "NA"), check.names = FALSE)
  tara_metadata[, join_key := paste(
    Station.label,
    sprintf("%.6f", as.numeric(Depth.nominal)),
    sep = "|"
  )]
  if (anyDuplicated(tara_metadata$join_key)) {
    stop("Tara metadata contains duplicated station/depth keys")
  }

  matched <- tara_metadata[match(run_metadata$join_key, tara_metadata$join_key)]
  metadata <- copy(matched[, !"join_key", with = FALSE])
  metadata[, sample_id := run_metadata$ENA_Run_ID]
  setcolorder(metadata, c("sample_id", setdiff(names(metadata), "sample_id")))

  # Prefer run-level values from the supplemental table for fields measured at
  # each ENA run, while retaining station-level values from the full table.
  metadata[["Station.label"]] <- run_metadata$Station
  metadata[["Latitude"]] <- run_metadata$Latitude
  metadata[["Longitude"]] <- run_metadata$Longitude
  metadata[["Depth.nominal"]] <- as.numeric(run_metadata$Depth_nominal)
  metadata[["Temperature"]] <- run_metadata$Temperature
  metadata[["Oxygen"]] <- run_metadata$Oxygen
  metadata[["Salinity"]] <- run_metadata$Salinity
  metadata[["ChlorophyllA"]] <- run_metadata$ChlorophyllA
  metadata[["NO3"]] <- run_metadata$NO3
  metadata[["Sigma-theta"]] <- run_metadata$Sigma_theta
  metadata[["fCDOM"]] <- run_metadata$fCDOM

  unmatched <- which(is.na(metadata[["PANGAEA sample id"]]))
  if (length(unmatched)) {
    warning(
      length(unmatched),
      " run-level rows have no exact station/depth match in the full Tara table;",
      " their run-level fields are retained and unmatched fields remain NA."
    )
  }
  fwrite(metadata, full_metadata_file, sep = "\t", na = "NA")
  cat("Wrote", full_metadata_file, "with", nrow(metadata), "samples and", ncol(metadata) - 1, "Tara metadata fields\n")
} else if (!file.exists(full_metadata_file)) {
  coordinate_metadata <- fread(coordinate_metadata_file, na.strings = c("", "NA"))
  tara_metadata <- fread(tara_metadata_file, na.strings = c("", "NA"), check.names = FALSE)

  if (!all(c("sample_id", "Latitude", "Longitude") %in% names(coordinate_metadata))) {
    stop("Coordinate metadata must contain sample_id, Latitude, and Longitude")
  }
  if (!all(c("PANGAEA sample id", "Latitude", "Longitude") %in% names(tara_metadata))) {
    stop("Tara metadata must contain PANGAEA sample id, Latitude, and Longitude")
  }

  coordinate_metadata[, coord_key := sprintf("%.6f|%.6f", Latitude, Longitude)]
  tara_metadata[, coord_key := sprintf("%.6f|%.6f", Latitude, Longitude)]
  if (anyDuplicated(tara_metadata$coord_key)) {
    stop("Tara metadata contains duplicated coordinate keys")
  }

  metadata <- merge(
    coordinate_metadata[, .(sample_id, coord_key)],
    tara_metadata,
    by = "coord_key",
    all.x = TRUE,
    sort = FALSE
  )
  if (anyNA(metadata[["PANGAEA sample id"]])) {
    missing_rows <- which(is.na(metadata[["PANGAEA sample id"]]))
    missing_ids <- metadata$sample_id[missing_rows]
    warning(
      "No exact Tara metadata match for sample IDs: ",
      paste(missing_ids, collapse = ", "),
      ". Retaining their existing basic metadata and leaving other fields as NA."
    )

    fallback <- coordinate_metadata[match(metadata$sample_id, coordinate_metadata$sample_id)]
    fallback_columns <- c("Latitude", "Longitude", "Temperature", "Oxygen", "Salinity")
    for (column in fallback_columns) {
      set(metadata, i = missing_rows, j = column, value = fallback[[column]][missing_rows])
    }
    set(metadata, i = missing_rows, j = "NO3", value = fallback$Nitrate[missing_rows])
    set(metadata, i = missing_rows, j = "ChlorophyllA", value = fallback$Chl_a[missing_rows])
    set(metadata, i = missing_rows, j = "Depth.nominal", value = fallback$Depth[missing_rows])
  }
  metadata[, coord_key := NULL]
  setorder(metadata, sample_id)
  fwrite(metadata, full_metadata_file, sep = "\t", na = "NA")
  cat("Wrote", full_metadata_file, "with", nrow(metadata), "samples and", ncol(metadata) - 1, "Tara metadata fields\n")
} else {
  metadata <- fread(full_metadata_file, na.strings = c("", "NA"), check.names = FALSE)
}

metadata <- unique(metadata, by = "sample_id")

og_ids <- sprintf("OG%07d", 0:4576)
sample_ids <- metadata[, .(sample_id)]
grid <- CJ(sample_id = sample_ids$sample_id, OG_ID = og_ids, unique = TRUE)

grid <- merge(grid, scores, by = c("sample_id", "OG_ID"), all.x = TRUE)
grid[is.na(sumTPM), sumTPM := 0]
grid <- merge(grid, metadata, by = "sample_id", all.x = TRUE, sort = FALSE)

setorder(grid, OG_ID, sample_id)

for (og in og_ids) {
  fwrite(
    grid[OG_ID == og, .(sample_id, sumTPM)],
    file.path(output_dir, paste0(og, ".csv"))
  )
}

fwrite(scores, file.path(output_dir, "sample_og_sumTPM.tsv"), sep = "\t")
cat("Wrote", length(og_ids), "OG files\n")
