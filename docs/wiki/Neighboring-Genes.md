# Neighboring Genes

The Genome Context Viewer compares local gene arrangements around proteins belonging to a selected orthogroup.

## Load A Genome Context

Enter an OG ID, gene name, COG ID, KO ID, or Pfam term and select an autocomplete suggestion. Press **Load Data** to display the genomic neighborhoods available for the selected orthogroup.

Each row represents one occurrence of the focal orthogroup. The genome and contig are shown at the left, and arrows indicate neighboring genes and their orientation. The focal gene has a heavier outline.

## Read The Visualization

- The 20 most frequent neighboring orthogroups are assigned distinct colors.
- Other orthogroups are shown in gray.
- Labels display the final four digits of the OG ID to keep the figure compact.
- Hover over a gene to view its full sequence ID, OG ID, COG assignment, gene name, KO ID, and KO description.
- Select an OG label to open its [OG Information Viewer](OG-Information-Viewer).

Use the **Length** switch to choose between proportional genomic lengths and a row-fitted display. Strand orientation is normalized around the focal gene to make neighborhoods easier to compare.

## Export The Figure

After the visualization has loaded, use **Download SVG** for a scalable figure or **Download PDF (print)** to open the browser print dialog and save a PDF.

For a network-level summary of conserved neighbors, use the [Neighboring Network](Neighboring-Network).
