# Download

The Download page is the entry point for reusable files underlying the SAR11 Genome Atlas. Compact web-facing files are served directly from the atlas repository, while larger sequence, annotation, HMM, and analysis archives are distributed through the versioned [Zenodo dataset](https://doi.org/10.5281/zenodo.21468730). Download links identify Zenodo-hosted files next to their displayed size.

## Available Atlas Datasets

The following resources can currently be downloaded directly:

- **Genome metadata and quality estimates**: `subclade_master.tsv` contains the complete metadata for 542 SAR11 genomes and 20 phylogenetic outgroups. `SAR11_Atlas_542_CheckM2_v1.0.2_quality_report.tsv` contains the CheckM2 quality estimates for the 542 released SAR11 genomes.
- **Genome and protein files**: versioned FNA, FAA, and GFF archives contain assemblies, predicted proteins, and annotations for all 542 SAR11 genomes.
- **Full protein-level annotations**: `all_prot_annotations.tsv` contains orthogroup assignments, COGclassifier, KOfamScan, PfamScan, quickARSC, and related fields for all 675,669 predicted proteins.
- **Orthogroup assignments and statistics**: `SAR11_Orthogroup_Assignments_542.tar.gz` contains the core OrthoFinder 3 assignment, count, overlap, hierarchical-orthogroup, species-tree, and run-information files.
- **Orthogroup annotations and chart data**: `og_suggest.tsv` contains representative annotations for all 4,577 orthogroups. The KO and COG count tables drive the pie charts, and the Pfam count table drives the bar chart in the OG Information Viewer.
- **OG representative protein sequences**: `OG_representative_sequences.faa` contains one observed representative protein for each of the 4,577 orthogroups. `representative_sequences.tsv` records the selected sequence ID, length, alignment gap count, identity and difference counts, and percent change from the multiple-alignment consensus.
- **Orthogroup HMM profiles**: `SAR11_Orthogroups_4577.hmm.tar.gz` contains the combined profile-HMM library for all 4,577 orthogroups.
- **Resolved orthogroup gene trees**: `Resolved_Gene_Trees.txt.tar.gz` contains 3,411 resolved gene trees.
- **Species phylogenies**: the final dual-IQ-TREE 2 analysis, comprising the default rooted SAR11_165 phylogeny, the original SAR11_165 and bac120 trees with outgroups, and the rooted bac120 derivative. The SAR11_165 and bac120 FastTree results are retained as comparison trees and are not the final taxonomy.
- **All-vs-all ANI and AAI results**: the directional FastANI v1.34 output, a symmetric 542-genome ANI matrix, and the CompareM v0.1.2 pairwise AAI summary.
- **Neighboring-gene network**: `neighbor_network.tsv` is the directed edge table used by the Neighboring Network page.
- **CORGIAS network**: `corgias_network.tsv` contains the significant phylogenetically informed OG associations used by the network and result table.
- **High-similarity UniProt matches**: gene-level, OG-representative, and AlphaFoldDB-confirmed match tables generated against UniProtKB release 2026_01 at a minimum of 85% identity.
- **Broader UniProt similarity results**: `uniprot_pid30_cov80_filtered_hits.tsv.gz` contains the filtered 30%-identity search results used to identify homologous structure references.
- **Tara Oceans metatranscriptomic quantification**: `SAR11_merged_metaT.tsv.gz` contains the gene-level quantification table for 509 runs used to derive OG Expression Scores.
- **SAR11 literature table**: `250729_SAR11_paper_list.tsv`, updated on 2025-07-29, contains the publication metadata displayed on the Literature page.

The Download cards show the file size next to each available resource. OG-specific neighborhood tables are downloaded separately from the [Neighboring Genes](Neighboring-Genes) page.

## Genome Metadata

`subclade_master.tsv` is the complete metadata table with harmonized taxonomic labels. It records the evidence source, confidence category, dual-tree support, and ANI/AAI reference used for each applicable assignment. Previous labels are intentionally excluded from the public subclade tables to avoid mixing classification systems; they are retained only in the internal harmonization audit and archived pre-harmonization files. Two derived forms are maintained for web components:

- `subclade.txt` emphasizes numeric sampling depth and coordinates for the searchable table and map.
- `subclade_cat.tsv` emphasizes categorical metadata for Taxonium coloring.

All three forms contain 542 SAR11 genomes and 20 phylogenetic outgroups. Marine Longhurst codes and descriptions are retained where applicable. Freshwater and other nonmarine records keep Longhurst fields as `NA` and are represented through habitat and waterbody fields instead. Use `subclade_master.tsv` unless a web-component-specific input is required.

`SAR11_Atlas_542_CheckM2_v1.0.2_quality_report.tsv` contains CheckM2 v1.0.2 completeness and contamination estimates for exactly the 542 SAR11 genomes in the release; the 20 phylogenetic outgroups are not included. Genome selection used strict thresholds of completeness >85% and contamination <10%, with the documented cultured-strain exception `HIMB2304` and OMZ genome exception `ETNP2013_S02_SV82_300m_MAG_01` retained by design.

## Orthogroup Assignments And Trees

The OrthoFinder archive includes `Orthogroups.tsv`, `Orthogroups.GeneCount.tsv`, `Orthogroups_UnassignedGenes.tsv`, overall and per-species statistics, species-overlap counts, the root-level hierarchical orthogroup table, the rooted node-labeled species tree, and a README recording the 542-genome analysis.

The resolved gene-tree archive contains trees for the 3,411 orthogroups with at least four protein sequences. In the OrthoFinder 3 default workflow, amino-acid sequences were aligned with FAMSA, approximate maximum-likelihood trees were inferred with FastTree using `-fastest`, and OrthoFinder rooted and resolved the trees with its hybrid species-overlap/duplication-loss coalescent procedure.

The Zenodo-hosted `SAR11_Orthogroups_4577.hmm.tar.gz` archive provides one profile HMM for each orthogroup in a combined HMM file; individual profiles can be extracted with `hmmfetch`.

## OG Representative Sequences

The compact files used by the browser-based [OG Representative Similarity Search](OG-Representative-Similarity-Search) are available directly:

- [`OG_representative_sequences.faa`](https://stsnsn.github.io/SAR11_Atlas/data/BLAST/OG_representative_sequences.faa) contains one representative amino-acid sequence for each of the 4,577 orthogroups. FASTA headers use the form `OG_ID|Sequence_ID`.
- [`representative_sequences.tsv`](https://stsnsn.github.io/SAR11_Atlas/data/BLAST/representative_sequences.tsv) records the representative selection statistics.

For each OG, the representative is an observed member sequence rather than a synthetic consensus. It was selected as the sequence with the lowest EMBOSS `infoalign` percent change from the existing multiple-sequence-alignment consensus; ties were resolved by lower gap count and then sequence ID. These representatives support rapid exploratory assignment but do not capture all within-OG diversity. For more sensitive assignment, use the combined OG HMM profiles with HMMER.

## Species Phylogenies

`SAR11_542_SCG165_iqtree_rooted_SAR11_only.tree` is the default tree displayed in the Genome Information and OG Information Taxonium views. The original SAR11_165 IQ-TREE 2 tree was rooted using 20 alphaproteobacterial outgroups before those outgroups were pruned, leaving the 542 SAR11 tips.

The original 562-tip SAR11_165 and bac120 IQ-TREE 2 trees, the rooted 542-tip bac120 IQ-TREE 2 tree, and the two FastTree trees are retained for comparison. The SAR11_165 HMM profiles were obtained from the [Meren Lab SAR11 phylogenomics workflow](https://merenlab.org/data/sar11-phylogenomics/), which describes the SAR11-focused genes retained from an earlier curated collection of 200 Alphaproteobacterial single-copy genes.

## Functional Annotations

`og_suggest.tsv` summarizes representative KO, COG, and Pfam evidence for browsing. Representative values describe the most supported annotations within an orthogroup and are not necessarily shared by every member. The accompanying `og_ko_counts.tsv`, `og_cog_counts.tsv`, and `og_pfam_counts.tsv` files preserve the within-OG counts used by the interactive charts.

The full protein-coding gene annotation resource is a separate, larger table for all 675,669 proteins. It combines orthogroup IDs with outputs from COGclassifier, KOfamScan, PfamScan, quickARSC, and related protein-level fields. The complete `all_prot_annotations.tsv` table is distributed through Zenodo.

## UniProt And AlphaFoldDB Results

All SAR11 proteins were searched against UniProtKB release 2026_01 Swiss-Prot and TrEMBL with DIAMOND v2.1.10.164 using a minimum amino-acid identity of 85% and `--max-target-seqs 1`. Candidates for the AlphaFoldDB-linked web table were additionally required to cover at least 80% of both query and subject sequences.

- `uniprot_pid85_gene_hits.tsv` contains 226,536 matched SAR11 proteins across 1,912 orthogroups.
- `uniprot_pid85_og_representative_hits.tsv` contains one representative UniProt hit for each of those 1,912 orthogroups.
- `uniprot_pid85_afdb_matches.tsv` contains 3,622 close sequence matches with confirmed AlphaFoldDB models across 1,686 orthogroups.
- `uniprot_pid30_homologous_afdb_matches.tsv` contains 11,051 confirmed homologous structure references across 2,993 orthogroups after applying at least 30% identity, at least 80% query and subject coverage, and an E-value no greater than 1e-5.
- `uniprot_structure_references.tsv` is the downloadable compact Web table containing 8,057 AlphaFoldDB structure references. It retains close matches where available and uses homologous references only for the 1,308 additional orthogroups without a close match, covering 2,994 orthogroups in total.

A UniProt hit is a sequence-similarity result, not proof that every orthogroup member has the same sequence or structure. Use identity, coverage, domain annotations, and AlphaFold confidence together when interpreting a match.

A broader DIAMOND search using a minimum identity of 30% and `--max-target-seqs 10` was filtered at 80% query coverage, 80% subject coverage, and an E-value of 1e-5. For the combined structure-reference table, close matches require identity ≥85% and both coverage values ≥80%; homologous references require identity ≥30%, both coverage values ≥80%, and E-value ≤1e-5. The 30%-identity and 80%-coverage combination follows a sequence-similarity criterion used in [Seq2Symm](https://www.nature.com/articles/s41467-025-57148-3). The complete 8,300,702-row filtered table is distributed as the 199.50 MB compressed `uniprot_pid30_cov80_filtered_hits.tsv.gz` Zenodo file; compact AFDB-confirmed tables are available directly from the atlas.

## Network And Expression Resources

The directly available network files are the complete edge tables used by the Neighboring Network and CORGIAS Network interfaces. The CORGIAS edge table was calculated using the rooted SAR11_165 IQ-TREE 2 phylogeny. Larger supporting files are distributed through the Zenodo release:

- `gene_coordinates_with_og.tsv`, which underlies the neighborhood, operon, and neighboring-network analyses.
- `CORGIAS_result.csv`, the complete CORGIAS analysis output beyond the compact significant-edge table.
- `SAR11_merged_metaT.tsv.gz` contains gene-level quantification results for 509 Tara Oceans metatranscriptomic runs. Join its `feature` identifiers to the protein and orthogroup assignments, then sum TPM by sample and orthogroup, to reproduce the aggregate Expression Scores used by the Metatranscriptome Viewer.

## All-vs-all ANI And AAI

`fastani_SAR11_542.out` is the original directional five-column FastANI v1.34 output: query genome, reference genome, ANI, matched fragments, and total query fragments. `fastani_SAR11_542_symmetric_matrix.tsv` is a 542 x 542 matrix derived from that output. Reciprocal ANI estimates are averaged when both directions are reported; a single reported direction is retained when its reciprocal comparison is absent; comparisons absent in both directions are shown as `NA`; and the diagonal is set to 100. Genome names in the matrix omit the `.fna` suffix.

`comparem_aaiwf_SAR11_542_out_summary.tsv` is the all-vs-all amino-acid identity summary generated with CompareM v0.1.2 `aai_wf` from the predicted proteins of the same 542 genomes. It reports the protein-coding gene counts for each genome, number of detected orthologs, mean and standard deviation of AAI, and orthologous fraction for each genome pair.

The ANI and AAI files are comparative-genome measurements and are not presented as a formal SAR11 species classification. The ANI matrix can be regenerated with `build_fastani_matrix.R` from the accompanying reproducibility-script package.

## Distribution And Versioning

Small interactive tables are downloaded from the atlas repository. Large sequence collections, complete annotations, HMM profiles, CORGIAS output, UniProt similarity results, gene-coordinate data, and metatranscriptomic quantification are downloaded from Zenodo. The OrthoFinder assignment and resolved gene-tree archives currently remain direct atlas downloads.

## Choosing A File

Use [SAR11 Genome Information](SAR11-Genome-Information) to inspect genome metadata before downloading genome resources. Use [All OG List](All-OG-List) or [OG Information Viewer](OG-Information-Viewer) to identify orthogroups before downloading assignments, annotations, trees, or HMM profiles.

Large collections are distributed as compressed, versioned archives. Check each archive's README, column definitions, software versions, and release identifier before combining it with results from another atlas release.
