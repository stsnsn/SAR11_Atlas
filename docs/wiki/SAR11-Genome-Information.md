# SAR11 Genome Information

The Genome Information page provides three linked views for exploring the genomes included in the SAR11 Genome Atlas: a sampling-location map, an interactive phylogenetic tree, and a searchable metadata table.

## SAR11 Genome Map

The SAR11 Genome Map shows reported sampling locations for genomes included in the atlas.

Use the linked map filters to restrict markers by:

- **Genome type**: show all genomes with valid coordinates or select MAGs,
  SAGs, or cultured isolates.
- **Family**: select a harmonized family-level lineage.
- **Genus**: select a harmonized genus within the selected genome type and
  family.
- **Reset**: restore all three map filters and display every SAR11 genome with
  valid coordinates.

Family and genus options are populated from the current genome metadata.
Unclassified records remain available as **Unassigned** rather than being
silently removed.

Individual markers use the following colors:

- **Yellow**: cultured strain.
- **Blue**: SAG.
- **Red**: MAG.

Markers that are close together are automatically grouped into clusters. The number in the center of each cluster indicates how many genomes are included. The colored ring around the number is a pie chart showing the relative proportion of MAGs, SAGs, and cultured strains in that cluster, using the same colors as the individual markers.

Click an individual marker to open a popup containing the metadata for that genome.

## SAR11 Genome Phylogeny

The phylogenetic tree was inferred with IQ-TREE from the bac120 marker alignment, rooted with 20 alphaproteobacterial outgroups, and then pruned to the 542 SAR11 genomes displayed in Taxonium. The tree and Taxonium metadata are loaded from the public atlas-data repository so the embedded viewer can access them while the development repository remains private. Taxonium supports interactive zooming, panning, searching, and metadata-based coloring.

Use the tree controls to:

- Zoom in and out of the phylogeny.
- Search for genome names.
- Expand the tree to inspect individual genome labels.
- Change tip color coding with the **Color by:** menu.
- Click or hover over tree tips to view genome metadata.

The tree is initially colored by **Family**, which is used as the atlas's broad family-level lineage display. Historical `Clade1`, `Clade2`, and subclade labels remain in the metadata for continuity with earlier SAR11 studies, but the historical Clade I grouping is not used as the primary higher-level grouping. Clade IV is retained as a family-unassigned lineage.

The tree file and associated metadata are available from the [Download](Download) page.

## SAR11 Genome Information Table

The genome information table lists 542 SAR11 genomes and 20 alphaproteobacterial genomes used as phylogenetic outgroups. Available fields include taxonomy, genome source type, numeric sampling depth and coordinates, marine Longhurst province, habitat, waterbody, genome-quality information, and source references where available.

The generic **description** field contains the available sampling-region description. Longhurst codes are retained only for marine records. Freshwater and other nonmarine records keep Longhurst fields as `NA` and are described with **habitat_type** and **waterbody_name** instead.

Marine provinces were assigned from sampling longitude and latitude using the **Longhurst Provinces version 4 (March 2010)** polygon layer distributed by [Marine Regions/Flanders Marine Institute](https://www.marineregions.org/downloads.php#longhurst). Coordinates were treated as WGS84 points and matched to the containing province by a point-in-polygon procedure. Re-running this assignment for the final metadata reproduced all 508 automatic assignments. Thirteen marine records outside the polygons near a coastline or boundary were retained as manually reviewed assignments: 12 records share one western Mediterranean sampling coordinate and one record is from the Antarctic Ocean. Records without coordinates were not inferred.

Longhurst is a marine classification, so freshwater, brackish, and other nonmarine records are intentionally left unassigned even when a coarse polygon overlap is possible. Their source environments are represented by the habitat and waterbody fields instead.

Use the table controls to:

- Search for genomes or metadata terms.
- Sort columns to compare metadata fields.
- Scroll horizontally to inspect all columns; the header remains aligned with the table during scrolling.
- Export the displayed table as copy, CSV, JSON, Excel, or print output.

Use **Full screen view** to open the table in a dedicated page when a wider view is needed.

## Related Pages

- [Overview](Overview) summarizes genome size, GC content, source type, and annotation coverage.
- [Download](Download) provides access to genome metadata and phylogenetic resources.
