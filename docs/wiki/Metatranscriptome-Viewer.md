# Metatranscriptome Viewer

The Metatranscriptome Viewer shows the Expression Score of a selected SAR11 orthogroup across 509 Tara Oceans metatranscriptomic runs and compares that score with environmental measurements.

## Display An Expression Profile

Enter an OG ID such as `OG0000173`, or search by a functional annotation, and press **Update map and plots**. The map is updated with the selected orthogroup's Expression Score at the sampled stations.

Within each sample, Expression Score is the sum of TPM values assigned to the selected OG. It is an aggregate orthogroup signal rather than a conventional TPM measurement for one gene. Marker size represents this score, with **Log scale** enabled by default to keep highly expressed samples from dominating the display.

After the data load, use **Download CSV** to save the sample-level Expression Scores joined to the shared metadata for the selected orthogroup.

## Environmental Correlations

The default scatter plots compare Expression Score with temperature, salinity, nominal sampling depth, and oxygen. Each panel reports Pearson correlation on the displayed scale, Spearman rank correlation, and the number of paired samples. Hover over points to inspect sample information and values.

Use **Additional parameter** and **Draw plot** to examine continuous numeric metadata, including sampling location and depth, hydrographic variables, nutrients, pigments, mixed-layer and oxygen depths, physical diagnostics, sigma-theta, and fCDOM. The upper size fraction is shown as a vertical violin plot with an embedded box plot, mean line, and individual sample points rather than as a continuous scatter plot. Categorical, date, and identifier fields remain available in the downloadable metadata table but are not offered as plot axes.

The 4,577 OG CSV files contain only `sample_id` and `sumTPM`. The complete 509-row Tara metadata table is stored separately in `tara_metadata_542.tsv` and joined in the browser by ENA run ID (`sample_id`). This avoids repeating the 40 metadata fields in every OG file.

The underlying expression table was joined to the current protein-to-OG mapping and summed by sample and OG. Missing sample/OG combinations are represented by zero when the per-OG files are generated. The shared metadata combines direct run-level coordinates and measurements with the broader Tara station/depth metadata table; unmatched fields remain `NA` rather than being inferred.

Correlations describe associations across the sampled environments and do not by themselves establish a causal environmental response. The default **Log scale** setting changes marker scaling and the Expression Score axis; it does not convert the aggregate score into a conventional gene-level TPM.

## Environmental Metadata Quality Control

The complete Tara Oceans metadata table is retained for provenance and download, but not every source field is offered in **Additional parameter**. The following fields were excluded from interactive plotting:

- `Carbon.total`, `CO3`, `HCO3`, and `Alkalinity.total` were excluded because the values in the integrated environmental-context table are inconsistent with the corresponding station-level carbonate measurements. For example, the integrated record for run `TARA_A100001026` reports `HCO3 = 0`, whereas the station-level source reports approximately 2,026 micromoles per kilogram at the corresponding TARA_032 surface sample. Nonzero values in the integrated carbonate columns are also implausibly small, so replacing only zeros with missing values would not resolve the problem. These four fields must not be used for environmental correlations unless they are reconstructed from the station-specific source tables.
- `Fluorescence` was excluded because it duplicates `fCDOM` across the available records. `fCDOM` is retained as the displayed variable.
- `Density` was excluded because it duplicates `Sigma-theta` across the available records. `Sigma-theta` is retained as the displayed variable.
- `lower.size.fraction` was excluded because it is constant at 0.22 micrometres for all included samples and therefore contains no variation to compare with Expression Score. The varying upper size fraction remains available as a violin plot.

Negative calibrated Chlorophyll A values are treated as missing only when plots and correlations are calculated because they represent background-correction artifacts rather than biologically meaningful negative concentrations. The original values and all excluded columns remain unchanged in the downloadable metadata table so that the source data and these decisions remain auditable.

The carbonate-field assessment compared the integrated Tara environmental-context table ([PANGAEA.875567](https://doi.org/10.1594/PANGAEA.875567)) with its station-specific primary records, including TARA_032 ([PANGAEA.838996](https://doi.org/10.1594/PANGAEA.838996)), within the Tara Oceans environmental-data collection ([PANGAEA.836319](https://doi.org/10.1594/PANGAEA.836319)). Nutrient fields such as phosphate, nitrite, nitrate plus nitrite, and silicate were retained after representative values were checked against the station-level source.

The [OG Information Viewer](OG-Information-Viewer) provides a compact expression map alongside functional and structural annotations.
