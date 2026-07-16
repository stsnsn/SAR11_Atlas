# Neighboring Network

The Neighboring Gene Network summarizes recurrent genome-neighborhood relationships among SAR11 orthogroups.

Nodes represent orthogroups and are colored by COG functional category. An edge indicates that two orthogroups are frequently found near one another in the SAR11 genomes, using the frequency criterion described on the atlas page.

## Extract A Local Network

1. Enter a center OG ID such as `OG0000173`.
2. Set **Depth** to control how many network steps are included.
3. Set **Max nodes** to limit the size of the rendered network.
4. Optionally enable **Only show bidirectional edges** for relationships recorded in both directions.
5. Press **Extract and show**.

The status line reports the total network size, the number of nodes selected by the current settings, and the number actually visualized. Lower the depth or maximum node count if rendering becomes slow.

## Explore And Export

Hover over nodes and edges to inspect their metadata. Orthogroup annotations can include COG and KO information where available. The network can be exported as PNG for figures or JSON for downstream analysis.

The page also links to the full network in Cosmograph. For linear genome-context views, use [Neighboring Genes](Neighboring-Genes).
