# Metatranscriptome Viewer

The Metatranscriptome Viewer shows the expression of a selected SAR11 orthogroup across Tara Oceans metatranscriptomic samples and compares expression with environmental measurements.

## Display An Expression Profile

Enter an OG ID such as `OG0000173` and press **Update Map and Correlation plots**. The map is updated with the selected orthogroup's Expression Score at the sampled stations.

Within each sample, Expression Score is the sum of TPM values assigned to the selected OG. It is an aggregate orthogroup signal rather than a conventional TPM measurement for one gene. Marker size represents this score, with **Log-scale** enabled by default to keep highly expressed samples from dominating the display.

After the data load, use **Download CSV** to save the sample-level values for the selected orthogroup.

## Environmental Correlations

The default scatter plots compare Expression Score with temperature, salinity, depth, and oxygen. Hover over points to inspect sample information and values.

Use **Additional parameter** and **Draw plot** to examine continuous numeric metadata, including sampling location and depth, hydrographic variables, nutrients, pigments, mixed-layer and oxygen depths, physical diagnostics, sigma-theta, and fCDOM. Categorical, date, and identifier fields remain available in the downloadable metadata table but are not offered as plot axes.

The OG CSV files contain only `sample_id` and `sumTPM`. The complete metadata are stored separately in `tara_metadata_542.tsv` and joined in the browser by `sample_id`.

Correlations describe associations across the sampled environments and do not by themselves establish a causal environmental response.

The [OG Information Viewer](OG-Information-Viewer) provides a compact expression map alongside functional and structural annotations.
