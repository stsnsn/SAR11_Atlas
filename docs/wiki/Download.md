# Download

The Download page is the entry point for reusable files underlying the SAR11 Genome Atlas.

## Available Resource Types

Resources are organized into the following categories:

- **Genome information**: complete metadata for 542 SAR11 genomes and 20 phylogenetic outgroups, including numeric sampling values and their categorical summaries.
- **SAR11 genomes**: genome assemblies included in the atlas.
- **Tables**: orthogroup, annotation, expression, and related analysis tables. The current orthogroup release contains 4,577 OGs inferred from 542 genomes.
- **Phylogenetic trees**: the updated bac120 IQ-TREE phylogeny contains 542 SAR11 genomes and 20 outgroups. Orthogroup-level trees are prepared separately.
- **OG HMM profiles**: profile HMMs representing individual orthogroups. HMMs are built from FAMSA alignments and are being prepared as a combined HMMER-format resource.

Select a named resource to download it. Categories marked as awaiting a download link are not yet available from the public page.

The displayed bac120 IQ-TREE file can be downloaded directly from the phylogenetic-tree card. It contains the same 562 tips used by the Genome Information Taxonium view.

## Metadata Files

The genome metadata are maintained in three related forms:

- `subclade_master.tsv` is the source-preserving master table with numeric and categorical sampling fields.
- `subclade.txt` is optimized for the searchable table and map, retaining numeric depth and coordinates.
- `subclade_cat.tsv` is optimized for Taxonium and categorical metadata coloring.

All three contain 542 SAR11 genomes and 20 phylogenetic outgroups. Marine Longhurst information is kept where applicable. Nonmarine records use `NA` for Longhurst fields and retain habitat and waterbody descriptions instead.

## Orthogroup And Neighborhood Files

The current annotation interface uses one 4,577-row `og_suggest.tsv` table plus combined KO, COG, and Pfam count tables rather than thousands of per-OG annotation files. The Neighboring Network uses `neighbor_network.tsv`; OG-specific Neighboring Genes tables can also be downloaded directly from the visualization with **Download TSV**.

## Choosing A File

Use the [SAR11 Genome Information](SAR11-Genome-Information) page to inspect genome metadata before downloading genomes. Use the [All OG List](All-OG-List) or [OG Information Viewer](OG-Information-Viewer) to identify orthogroups before downloading full tables, trees, or HMM profiles.

Large collections may be distributed as compressed archives. Check the included README, column names, and release information before combining downloaded files with results from another atlas release.
