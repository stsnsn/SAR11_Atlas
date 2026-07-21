# Download

The Download page is the entry point for reusable files underlying the SAR11 Genome Atlas. Compact web-facing files are served directly from the atlas repository, while larger sequence, annotation, HMM, and analysis archives are listed with their current external-release status.

## Available Atlas Datasets

The following resources can currently be downloaded directly:

- **Genome metadata**: `subclade_master.tsv` contains the complete metadata for 542 SAR11 genomes and 20 phylogenetic outgroups.
- **Orthogroup assignments and statistics**: `SAR11_Orthogroup_Assignments_542.tar.gz` contains the core OrthoFinder 3 assignment, count, overlap, hierarchical-orthogroup, species-tree, and run-information files.
- **Orthogroup annotations and chart data**: `og_suggest.tsv` contains representative annotations for all 4,577 orthogroups. The KO and COG count tables drive the pie charts, and the Pfam count table drives the bar chart in the OG Information Viewer.
- **Resolved orthogroup gene trees**: `Resolved_Gene_Trees.txt.tar.gz` contains 3,411 resolved gene trees.
- **Species phylogenies**: the rooted bac120 IQ-TREE phylogeny and alternative FastTree phylogenies inferred from bac120 and SAR11_165 marker sets.
- **All-vs-all ANI and AAI results**: the directional FastANI v1.34 output, a symmetric 542-genome ANI matrix, and the CompareM v0.1.2 pairwise AAI summary.
- **Neighboring-gene network**: `neighbor_network.tsv` is the directed edge table used by the Neighboring Network page.
- **CORGIAS network**: `corgias_network.tsv` contains the significant phylogenetically informed OG associations used by the network and result table.
- **High-similarity UniProt matches**: gene-level, OG-representative, and AlphaFoldDB-confirmed match tables generated against UniProtKB release 2026_01 at a minimum of 85% identity.
- **SAR11 literature table**: `250729_SAR11_paper_list.tsv`, updated on 2025-07-29, contains the publication metadata displayed on the Literature page.

The Download cards show the file size next to each available resource. OG-specific neighborhood tables are downloaded separately from the [Neighboring Genes](Neighboring-Genes) page.

## Genome Metadata

`subclade_master.tsv` is the public, source-preserving metadata table. Two derived forms are maintained for web components:

- `subclade.txt` emphasizes numeric sampling depth and coordinates for the searchable table and map.
- `subclade_cat.tsv` emphasizes categorical metadata for Taxonium coloring.

All three forms contain 542 SAR11 genomes and 20 phylogenetic outgroups. Marine Longhurst codes and descriptions are retained where applicable. Freshwater and other nonmarine records keep Longhurst fields as `NA` and are represented through habitat and waterbody fields instead. Use `subclade_master.tsv` unless a web-component-specific input is required.

## Orthogroup Assignments And Trees

The OrthoFinder archive includes `Orthogroups.tsv`, `Orthogroups.GeneCount.tsv`, `Orthogroups_UnassignedGenes.tsv`, overall and per-species statistics, species-overlap counts, the root-level hierarchical orthogroup table, the rooted node-labeled species tree, and a README recording the 542-genome analysis.

The resolved gene-tree archive contains trees for the 3,411 orthogroups with at least four protein sequences. In the OrthoFinder 3 default workflow, amino-acid sequences were aligned with FAMSA, approximate maximum-likelihood trees were inferred with FastTree using `-fastest`, and OrthoFinder rooted and resolved the trees with its hybrid species-overlap/duplication-loss coalescent procedure.

The combined `SAR11_Orthogroups_4577.hmm.tar.gz` archive remains listed as an external release. It will provide one profile HMM for each orthogroup in a combined HMM file; individual profiles can be extracted with `hmmfetch`.

## Species Phylogenies

`SAR11_542_bac120_iqtree_rooted_SAR11_only.tree` contains the same 542 SAR11 tips displayed in the Genome Information and OG Information Taxonium views. It was rooted using 20 alphaproteobacterial outgroups before those outgroups were pruned.

`SAR11_542_SCG165_fasttree.tree` and `SAR11_542_bac120_fasttree.tree` provide alternative marker-set and inference-method results. The SAR11_165 HMM profiles were obtained from the [Meren Lab SAR11 phylogenomics workflow](https://merenlab.org/data/sar11-phylogenomics/), which describes the SAR11-focused genes retained from an earlier curated collection of 200 Alphaproteobacterial single-copy genes.

## Functional Annotations

`og_suggest.tsv` summarizes representative KO, COG, and Pfam evidence for browsing. Representative values describe the most supported annotations within an orthogroup and are not necessarily shared by every member. The accompanying `og_ko_counts.tsv`, `og_cog_counts.tsv`, and `og_pfam_counts.tsv` files preserve the within-OG counts used by the interactive charts.

The full protein-coding gene annotation resource is a separate, larger table for all 675,669 proteins. It combines orthogroup IDs with outputs from COGclassifier, KOfamScan, PfamScan, quickARSC, and related protein-level fields. This complete table remains listed as an external archive until its versioned release is available.

## UniProt And AlphaFoldDB Results

All SAR11 proteins were searched against UniProtKB release 2026_01 Swiss-Prot and TrEMBL with DIAMOND v2.1.10.164 using a minimum amino-acid identity of 85% and `--max-target-seqs 1`. Candidates for the AlphaFoldDB-linked web table were additionally required to cover at least 70% of both query and subject sequences.

- `uniprot_pid85_gene_hits.tsv` contains 226,536 matched SAR11 proteins across 1,912 orthogroups.
- `uniprot_pid85_og_representative_hits.tsv` contains one representative UniProt hit for each of those 1,912 orthogroups.
- `uniprot_pid85_afdb_matches.tsv` contains 3,660 confirmed AlphaFoldDB-linked matches across 1,711 orthogroups and is the compact table used by the Protein Structures page.

A UniProt hit is a sequence-similarity result, not proof that every orthogroup member has the same sequence or structure. Use identity, coverage, domain annotations, and AlphaFold confidence together when interpreting a match.

A broader DIAMOND search using a minimum identity of 30% and `--max-target-seqs 10` is being prepared as a separate Zenodo release. It uses a different search configuration from the compact high-similarity tables above and is not yet served directly by the atlas.

## Network And Expression Resources

The directly available network files are the complete edge tables used by the Neighboring Network and CORGIAS Network interfaces. Larger supporting files remain external-release items:

- `gene_coordinates_with_og.tsv`, which underlies the neighborhood, operon, and neighboring-network analyses.
- `CORGIAS_result.csv`, the complete CORGIAS analysis output beyond the compact significant-edge table.
- Sample-level metatranscriptome mapping results and OG-level Expression Score summaries.

## All-vs-all ANI And AAI

`fastani_SAR11_542.out` is the original directional five-column FastANI v1.34 output: query genome, reference genome, ANI, matched fragments, and total query fragments. `fastani_SAR11_542_symmetric_matrix.tsv` is a 542 x 542 matrix derived from that output. Reciprocal ANI estimates are averaged when both directions are reported; a single reported direction is retained when its reciprocal comparison is absent; comparisons absent in both directions are shown as `NA`; and the diagonal is set to 100. Genome names in the matrix omit the `.fna` suffix.

`comparem_aaiwf_SAR11_542_out_summary.tsv` is the all-vs-all amino-acid identity summary generated with CompareM v0.1.2 `aai_wf` from the predicted proteins of the same 542 genomes. It reports the protein-coding gene counts for each genome, number of detected orthologs, mean and standard deviation of AAI, and orthologous fraction for each genome pair.

The ANI and AAI files are comparative-genome measurements and are not presented as a formal SAR11 species classification. The ANI matrix can be regenerated with `scripts/build_fastani_matrix.R`.

## External Archives Still Pending

The following large resources remain marked **Coming soon** or **Partly available** until their versioned external archives are released:

- FNA genome assemblies, FAA protein sequences, and GFF annotations for all 542 SAR11 genomes.
- Full protein-level annotations for all 675,669 proteins.
- The combined 4,577-orthogroup HMM archive.
- The complete gene-coordinate table and complete CORGIAS result table.
- Sample-level metatranscriptome mapping outputs and OG-level summaries.
- The broader UniProtKB similarity-search result generated with `--id 30 --max-target-seqs 10`.

## Choosing A File

Use [SAR11 Genome Information](SAR11-Genome-Information) to inspect genome metadata before downloading genome resources. Use [All OG List](All-OG-List) or [OG Information Viewer](OG-Information-Viewer) to identify orthogroups before downloading assignments, annotations, trees, or HMM profiles.

Large collections will be distributed as compressed, versioned archives. Check each archive's README, column definitions, software versions, and release identifier before combining it with results from another atlas release.
