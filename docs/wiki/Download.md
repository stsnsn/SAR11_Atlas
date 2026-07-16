# Download

The Download page is the entry point for reusable files underlying the SAR11 Genome Atlas.

## Direct Downloads

The Download page provides the compact files used directly by the current web interface:

- **Genome metadata**: `subclade_master.tsv`, the complete metadata table for the atlas collection.
- **Orthogroup annotations and chart data**: `og_suggest.tsv` plus the KO and COG pie-chart and Pfam bar-chart source tables used by the OG Information Viewer.
- **Comparative-genome networks**: `neighbor_network.tsv` and `corgias_network.tsv`, the edge tables used by the corresponding interactive viewers.
- **Species phylogenies**: the rooted bac120 IQ-TREE tree plus FastTree phylogenies inferred from the Meren Lab `SAR11_165` collection and the bac120 marker set.
- **SAR11 literature table**: `250729_SAR11_paper_list.tsv`, the publication metadata displayed on the Literature page, updated on 2025-07-29.

Select a named resource in an **Available** card to download it. OG-specific Neighboring Genes tables can also be downloaded from that visualization with **Download TSV**.

The displayed bac120 IQ-TREE file contains the same 542 SAR11 tips used by the Genome Information Taxonium view. The additional `SAR11_542_SCG165_fasttree.tree` and `SAR11_542_bac120_fasttree.tree` files provide alternative marker-set and inference-method results for download. The HMM profiles used for the SAR11_165 analysis were obtained from the [Meren Lab SAR11 phylogenomics workflow](https://merenlab.org/data/sar11-phylogenomics/). That workflow describes SAR11_165 as the 165 genes retained for SAR11 phylogenomics from an earlier curated collection of 200 Alphaproteobacterial SCGs.

## Metadata Files

The complete metadata table is offered as the public download. Two derived forms are maintained for the web interface:

- `subclade_master.tsv` is the source-preserving master table with numeric and categorical sampling fields.
- `subclade.txt` is optimized for the searchable table and map, retaining numeric depth and coordinates.
- `subclade_cat.tsv` is optimized for Taxonium and categorical metadata coloring.

All three contain 542 SAR11 genomes and 20 phylogenetic outgroups. Marine Longhurst information is kept where applicable. Nonmarine records use `NA` for Longhurst fields and retain habitat and waterbody descriptions instead. Download `subclade_master.tsv` unless a web-component-specific input is required.

## Orthogroup And Network Files

The current annotation interface uses one 4,577-row `og_suggest.tsv` table plus combined KO, COG, and Pfam count tables rather than thousands of per-OG annotation files. The KO and COG tables supply the pie charts and the Pfam table supplies the bar chart shown for a selected OG in the OG Information Viewer. These are distinct from the summary tables used by the Overview page. The network downloads are the complete edge tables used by the Neighboring Network and CORGIAS Network pages.

## Coming Soon On Zenodo

Large or complete reproducibility datasets remain marked **Coming soon** until their versioned Zenodo release is ready:

- FNA genome assemblies and FAA protein sequences for all 542 SAR11 genomes.
- Full protein-level physicochemical, KO, COG, Pfam, and orthogroup annotations.
- Complete OrthoFinder clustering tables, statistics, and associated outputs.
- Complete neighborhood, operon, network, CORGIAS, and related comparative-analysis archives.
- Protein-to-UniProt similarity-search results for all 542 genomes and representative matches for each OG.
- Sample-level metatranscriptome mapping results and OG-level expression summaries used by the Metatranscriptome Viewer.
- An all-vs-all average nucleotide identity matrix for the 542 SAR11 genomes.
- A 95% ANI-dereplicated representative SAR11 genome set, accompanied by the cluster membership table, documented representative-selection criteria, and sequence archives. This is a technical dereplication resource rather than a species classification.
- Profile HMM files and gene trees representing all 4,577 orthogroups.

The compact summaries available from the website are intended for browsing and routine reuse. Use the future Zenodo archives when complete records, all intermediate outputs, or a citable frozen release are required.

## Choosing A File

Use the [SAR11 Genome Information](SAR11-Genome-Information) page to inspect genome metadata before downloading genomes. Use the [All OG List](All-OG-List) or [OG Information Viewer](OG-Information-Viewer) to identify orthogroups before downloading full tables, trees, or HMM profiles.

Large collections will be distributed as compressed, versioned archives. Check the included README, column names, and release information before combining downloaded files with results from another atlas release.
