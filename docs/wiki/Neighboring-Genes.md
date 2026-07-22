# Neighboring Genes

The Neighboring Genes page compares local gene arrangements around proteins belonging to a selected orthogroup across the current 542-genome collection. For every focal protein, the dataset retains the focal gene and up to five genes on either side within the same contig.

## Load A Genome Context

Enter an OG ID, gene name, COG ID, KO ID, or Pfam term and select an autocomplete suggestion. Press **Visualize neighborhood** to display the genomic neighborhoods available for the selected orthogroup.

Each row represents one occurrence of the focal orthogroup. The genome and contig are shown at the left, and arrows indicate neighboring genes and their orientation. The focal gene has a heavier outline.

## Filter Genomes

Use the filters above the visualization to limit the displayed rows:

- **Genome type** selects cultured strains, SAGs, MAGs, or all genome types. The default is **Cultured strain**.
- **Family-level lineage** restricts rows using the current family assignment rather than the historical broad clade grouping. Clade IV remains available as a family-unassigned lineage.
- **Subclade** provides a more specific historical lineage filter based on the selected genome type and family-level lineage.

The status text reports the number of focal-gene neighborhoods and genomes matching the current filters. Filtering affects the visualization but does not remove records from the underlying OG-specific TSV.

## Read The Visualization

- The 20 most frequent neighboring orthogroups are assigned distinct colors.
- Other orthogroups are shown in gray.
- Labels display the final four digits of the OG ID to keep the figure compact.
- Hover over a gene to view its full sequence ID, OG ID, COG assignment, gene name, KO ID, and KO description.
- Select an OG label to open its [OG Information Viewer](OG-Information-Viewer).

Use **Actual gene lengths** to switch between a shared base-pair scale and a row-fitted display. The focal OG is aligned across rows, and the horizontally scrollable drawing area prevents long labels and neighborhoods from being clipped.

- **Shared-OG ribbons** connects matching OGs between adjacent rows.
- **Sort by neighborhood similarity** places similar local OG arrangements next to one another.
- **Show color legend** displays the top-20 neighboring-OG key.
- **Pin labels to left** keeps genome and contig labels in a fixed left column and is enabled by default.

The default display uses actual gene lengths, shared-OG ribbons, and pinned labels. Neighborhood-similarity sorting and the color legend are off by default.

## Export Data And Figures

After the visualization has loaded, use **Download SVG** for a scalable figure. **Download TSV** downloads the complete OG-specific neighborhood table, including all genome types; it is not reduced by the current display filters.

For a network-level summary of conserved neighbors, use the [Neighboring Network](Neighboring-Network).
