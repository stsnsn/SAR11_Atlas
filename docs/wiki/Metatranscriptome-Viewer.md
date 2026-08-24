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

The complete Tara Oceans metadata table is retained for download, but only suitable continuous variables are offered as plot axes. Carbonate fields are excluded because the integrated values are inconsistent with station-level measurements. Fluorescence and Density are omitted because they duplicate fCDOM and Sigma-theta, respectively. The lower size fraction is constant and is therefore omitted; the varying upper size fraction remains available as a violin plot.

Negative calibrated Chlorophyll A values are treated as missing for plots and correlations. Original values and excluded fields remain available in the downloadable metadata table.

The [OG Information Viewer](OG-Information-Viewer) provides a compact expression map alongside functional and structural annotations.
