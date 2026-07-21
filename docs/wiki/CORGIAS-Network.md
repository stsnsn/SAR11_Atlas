# CORGIAS Network

The CORGIAS Network displays phylogenetically informed associations among SAR11 orthogroups, calculated with [CORGIAS](https://doi.org/10.1093/nargab/lqaf182) from the current 542-genome orthogroup matrix and rooted bac120 phylogeny.

The network contains 18,606 significant associations among 2,987 OGs after multiple-testing correction: 18,403 positive associations and 203 negative associations. Node labels and functional annotations are read from the current `og_suggest.tsv` summary.

Nodes represent orthogroups and are colored by COG functional category. Edges summarize statistically supported relationships:

- **Red** indicates a positive correlation or co-occurrence.
- **Blue** indicates a negative correlation or anti-occurrence.
- Edge width represents `-log10(q-value)`; thicker edges indicate stronger statistical support.

## Extract A Local Network

1. Enter a center OG ID such as `OG0001059`.
2. Set **Depth** to control how many network steps are included.
3. Set the **Significance (-log10 q)** threshold to exclude weaker edges.
4. Set **Max nodes** to limit the rendered network.
5. Press **Show network**.

The status line reports the total, selected, and visualized node counts. If the network is slow or visually crowded, reduce its depth, increase the significance threshold, or lower the maximum node count.

## Browse Significant Associations

The **CORGIAS result table** lists all 18,606 significant associations and is ordered by ascending q-value by default. Search OG IDs or representative COG and KO annotations, or sort the table by association direction, p-value, q-value, or `-log10(q-value)`. Select an OG ID to open its integrated information page. The complete table can also be downloaded as TSV.

## Explore And Export

Hover over network elements to inspect orthogroup and annotation information. The pointer cursor identifies clickable nodes; select one to open its [OG Information Viewer](OG-Information-Viewer) in a separate tab. Use **Export PNG** for a figure or **Export JSON** for the currently extracted network.

CORGIAS relationships are phylogenetically informed statistical associations and should not by themselves be interpreted as direct physical interactions or evidence of a shared operon. Use [Neighboring Genes](Neighboring-Genes) or the [Neighboring Network](Neighboring-Network) to examine genome context.
