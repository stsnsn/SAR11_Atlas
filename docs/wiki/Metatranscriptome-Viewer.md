# Metatranscriptome Viewer

The Metatranscriptome Viewer shows the expression of a selected SAR11 orthogroup across Tara Oceans metatranscriptomic samples and compares expression with environmental measurements.

## Display An Expression Profile

Enter an OG ID such as `OG0000173` and press **Update Map and Correlation plots**. The map is updated with the selected orthogroup's Expression Score at the sampled stations.

Within each sample, Expression Score is the sum of TPM values assigned to the selected OG. It is an aggregate orthogroup signal rather than a conventional TPM measurement for one gene. Marker size represents this score, with **Log-scale** enabled by default to keep highly expressed samples from dominating the display.

After the data load, use **Download CSV** to save the sample-level values for the selected orthogroup.

## Environmental Correlations

The default scatter plots compare Expression Score with temperature, salinity, depth, and oxygen. Hover over points to inspect sample information and values.

Use **Choose another parameter** and **Draw Plot** to examine an additional variable. Available options include:

- Latitude and longitude
- Temperature and sigma-theta
- Salinity and oxygen
- Nitrate, chlorophyll a, and fCDOM
- Sampling depth

Correlations describe associations across the sampled environments and do not by themselves establish a causal environmental response.

The [OG Information Viewer](OG-Information-Viewer) provides a compact expression map alongside functional and structural annotations.
