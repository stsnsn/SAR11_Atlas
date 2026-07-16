# SAR11 Genome Information

The Genome Information page provides three linked views for exploring the genomes included in the SAR11 Genome Atlas: a sampling-location map, an interactive phylogenetic tree, and a searchable metadata table.

## SAR11 Genome Map

The SAR11 Genome Map shows reported sampling locations for genomes included in the atlas.

Use the **Data filter** menu to switch between:

- **All**: show all genomes with valid latitude and longitude.
- **MAG**: show metagenome-assembled genomes only.
- **SAG**: show single-amplified genomes only.
- **Cultured strain**: show cultured isolates only.

Individual markers use the following colors:

- **Yellow**: cultured strain.
- **Blue**: SAG.
- **Red**: MAG.

Markers that are close together are automatically grouped into clusters. The number in the center of each cluster indicates how many genomes are included. The colored ring around the number is a pie chart showing the relative proportion of MAGs, SAGs, and cultured strains in that cluster, using the same colors as the individual markers.

Click an individual marker to open a popup containing the metadata for that genome.

## SAR11 Genome Phylogeny

The phylogenetic tree was inferred with IQ-TREE from the bac120 marker alignment, rooted with 20 alphaproteobacterial outgroups, and then pruned to the 542 SAR11 genomes displayed in Taxonium. Taxonium supports interactive zooming, panning, searching, and metadata-based coloring.

Use the tree controls to:

- Zoom in and out of the phylogeny.
- Search for genome names.
- Expand the tree to inspect individual genome labels.
- Change tip color coding with the **Color by:** menu.
- Click or hover over tree tips to view genome metadata.

The tree file and associated metadata are available from the [Download](Download) page.

## SAR11 Genome Information Table

The genome information table lists 542 SAR11 genomes and 20 cultured alphaproteobacterial genomes used as phylogenetic outgroups. Available fields include taxonomy, genome source type, numeric sampling depth and coordinates, marine Longhurst province, habitat, waterbody, and source references where available.

The generic **description** field contains the available sampling-region description. Longhurst codes are retained only for marine records. Freshwater and other nonmarine records keep Longhurst fields as `NA` and are described with **habitat_type** and **waterbody_name** instead.

Use the table controls to:

- Search for genomes or metadata terms.
- Sort columns to compare metadata fields.
- Scroll horizontally to inspect all columns; the header remains aligned with the table during scrolling.
- Export the displayed table as copy, CSV, JSON, Excel, or print output.

Use **Full screen view** to open the table in a dedicated page when a wider view is needed.

## Related Pages

- [Overview](Overview) summarizes genome size, GC content, source type, and annotation coverage.
- [Download](Download) provides access to genome metadata and phylogenetic resources.
