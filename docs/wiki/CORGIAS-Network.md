# CORGIAS Network

The CORGIAS Network displays correlation-based associations among SAR11 orthogroups.

Nodes represent orthogroups and are colored by COG functional category. Edges summarize statistically supported relationships:

- **Red** indicates a positive correlation or co-occurrence.
- **Blue** indicates a negative correlation or anti-occurrence.
- Edge width represents `-log10(q-value)`; thicker edges indicate stronger statistical support.

## Extract A Local Network

1. Enter a center OG ID such as `OG0001059`.
2. Set **Depth** to control how many network steps are included.
3. Set the **Significance (-log10 q)** threshold to exclude weaker edges.
4. Set **Max nodes** to limit the rendered network.
5. Press **Extract and show**.

The status line reports the total, selected, and visualized node counts. If the network is slow or visually crowded, reduce its depth, increase the significance threshold, or lower the maximum node count.

## Explore And Export

Hover over network elements to inspect orthogroup and annotation information. Use **Export PNG** for a figure or **Export JSON** for the currently extracted network.

CORGIAS relationships are correlations and should not by themselves be interpreted as direct physical interactions or evidence of a shared operon. Use [Neighboring Genes](Neighboring-Genes) or the [Neighboring Network](Neighboring-Network) to examine genome context.
