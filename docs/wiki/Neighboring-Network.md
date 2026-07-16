# Neighboring Network

The Neighboring Network summarizes recurrent genome-neighborhood relationships among the 4,577 orthogroups in the current 542-genome collection.

Nodes represent orthogroups and are colored by representative COG functional category from `og_suggest.tsv`. A directed edge `A -> B` is retained when at least 75% of focal proteins assigned to OG A have one or more OG B proteins within five genes on the same contig.

The network contains 18,040 directed edges among 3,914 OG nodes. The prevalence measure is based on the fraction of focal copies with a neighbor and therefore remains between 0 and 1. Tandem duplication is recorded separately as the mean number of neighboring copies rather than being allowed to inflate prevalence.

## Extract A Local Network

1. Enter a center OG ID such as `OG0000173`.
2. Set **Depth** to control how many network steps are included.
3. Set **Max nodes** to limit the size of the rendered network.
4. Optionally enable **Only show bidirectional edges** to require that both `A -> B` and `B -> A` pass the 75% threshold.
5. Press **Extract and show**.

The status line reports the total network size, the number of nodes selected by the current settings, and the number actually visualized. Lower the depth or maximum node count if rendering becomes slow.

## Explore And Export

Hover over nodes and edges to inspect their metadata. Orthogroup annotations can include COG and KO information where available. The network can be exported as PNG for figures or JSON for downstream analysis.

The page also links to the full network in Cosmograph. Cosmograph reads `neighbor_network.tsv` as the edge table and `og_suggest.tsv` as node metadata; source and target are the directed `source` and `target` fields, node labels are OG IDs, node colors use COG letters, and edge width uses prevalence. For linear genome-context views, use [Neighboring Genes](Neighboring-Genes).
