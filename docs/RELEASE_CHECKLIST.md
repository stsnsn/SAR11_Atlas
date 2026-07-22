# Release Checklist

## Current Status And Handoff

The 542-genome update is functionally complete for genome metadata, orthogroups and annotations, species and gene trees, neighboring-gene views, neighboring and CORGIAS networks, UniProt/AlphaFoldDB links, and the Metatranscriptome Viewer. The broad responsive UI, Deep/Shallow theme, mobile navigation, table styling, and documentation update are also complete. Browser-based visual confirmation remains with the project owner.

The remaining work is primarily release packaging and final quality assurance rather than rebuilding the Web views. Resume in this order:

1. Package and publish the large external datasets, then replace every Coming soon entry with a versioned Zenodo or Figshare URL.
2. Freeze the reproducibility metadata for UniProt, OrthoFinder, FastANI, CompareM, CORGIAS, and metatranscriptome processing.
3. Replace temporary `stsnsn/public_data` URLs, recalculate download sizes, and perform the final browser and link checks.

## Completed Updates

- [x] Updated the collection to 542 SAR11 genomes, with 20 additional alphaproteobacterial outgroups retained in the complete genome metadata table.
- [x] Updated genome metadata, Taxonium metadata, genome tables, sampling-location views, and freshwater/nonmarine Longhurst handling.
- [x] Packaged `SAR11_Atlas_542_CheckM2_v1.0.2_quality_report.tsv` and verified that its genome identifiers match the 542-genome release exactly, with no missing or additional genomes.
- [x] Updated the OrthoFinder 3 dataset to 4,577 orthogroups and 675,669 proteins; 670,693 proteins are assigned to orthogroups and 4,976 are unassigned.
- [x] Generated and installed the compact OG annotation summary and KO, COG, and Pfam count tables used by the Web charts.
- [x] Packaged the core OrthoFinder assignments and statistics as `SAR11_Orthogroup_Assignments_542.tar.gz`.
- [x] Added the rooted 542-tip bac120 IQ-TREE phylogeny, two alternative FastTree phylogenies, and the archive of 3,411 resolved OrthoFinder gene trees.
- [x] Updated the 542-genome neighboring-gene files, operon viewer, directed neighboring network, CORGIAS network, and CORGIAS result table.
- [x] Downloaded and checksum-verified UniProtKB release `2026_01`, extracted Swiss-Prot and TrEMBL sequences, and searched all 675,669 proteins with DIAMOND v2.1.10.164 using the documented high-similarity configuration (`--id 85 --max-target-seqs 1`).
- [x] Generated `uniprot_pid85_gene_hits.tsv`, `uniprot_pid85_og_representative_hits.tsv`, and `uniprot_pid85_afdb_matches.tsv`. The structure table contains up to five checked candidates per OG and retains all candidates with confirmed models.
- [x] Updated Protein Structures, OG Information Viewer, Download, and the associated Wiki pages for the UniProtKB/AlphaFoldDB workflow and no-hit handling.
- [x] Added a lazy-loaded structure-reference suggestion index for accession, OG, gene, genome, KO, and COG lookup with visible close-match and homologous-reference labels.
- [x] Merged the Swiss-Prot and TrEMBL `--id 30 --max-target-seqs 10` searches, applied 80% query and subject coverage plus E-value 1e-5 filters, and generated the 8,300,702-row compressed release table.
- [x] Checked 13,633 candidate accessions against AlphaFoldDB, standardized both structure-reference tiers at 80% query and subject coverage, and added homolog-only fallback structures for 1,308 OGs. The combined Web table now covers 2,994 OGs.
- [x] Completed FastANI v1.34 all-vs-all computation and retained `data/phylogeny/fastani_SAR11_542.out`.
- [x] Generated and validated the symmetric 542 x 542 ANI matrix, retained the directional raw output with fragment counts, and added both files to the Download page and Download Wiki.
- [x] Completed CompareM v0.1.2 AAI computation and retained `data/phylogeny/comparem_aaiwf_SAR11_542_out_summary.tsv`.
- [x] Added the CompareM AAI summary, method, and file size alongside the ANI outputs on the Download page and Download Wiki.
- [x] Rebuilt all 4,577 OG-level metatranscriptome files in `data/env_corr_542`, separated the complete Tara Oceans metadata table, and updated both metatranscriptome pages and Wiki documentation.
- [x] Updated all Wiki pages to reflect the current 542-genome data and interface behavior.
- [x] Removed Google Analytics, consent code, and the Privacy Policy after deciding not to collect access statistics.
- [x] Added mobile sidebar navigation and standardized Deep/Shallow theme behavior, network dark backgrounds, tables, controls, focus states, and responsive layout.
- [x] Corrected corrupted non-ASCII author names in 98 literature records by matching their PMIDs to PubMed; no author-field underscores remain.
- [x] Removed offline data-preparation code from the GitHub Pages `scripts/` directory and organized the retained ANI, metatranscriptome, and UniProt/AlphaFoldDB workflows under `SAR11_Gene_Catalog_analysis/reproducibility_scripts/` for inclusion in the final Zenodo reproducibility package. The obsolete UniProt rebuild step was folded into the finalization workflow.

## Remaining Release Work

- [ ] Incorporate the phylogeny and genome-selection notes below into the revised manuscript. Keep the distinction between the observed topology, historical clade labels, and current family-level assignments explicit.
- [ ] Add a release README or methods record containing the UniProtKB `2026_01` archive checksum, download date, DIAMOND command and database-build command, query/subject coverage policy, and result-selection rules. The Web pages already record the principal version and thresholds, but the complete reproducibility record is not yet packaged.
- [ ] Publish `uniprot_pid30_cov80_filtered_hits.tsv.gz` (190 MB) on Zenodo and add its versioned URL to the partly available Download card. Keep this search configuration distinct from the high-similarity `--id 85 --max-target-seqs 1` dataset.
- [ ] Decide whether a 95% ANI dereplicated representative set is needed as a separate analysis. It is no longer a required Download-page card; if restored, document it as technical dereplication rather than formal SAR11 species classification.
- [ ] Prepare versioned external archives for the 542 FNA, FAA, and GFF collections.
- [ ] Publish `all_prot_annotations.tsv`, including OG, COGclassifier, KofamScan, PfamScan, and quickARSC results, through the external repository.
- [ ] Publish the combined `SAR11_Orthogroups_4577.hmm.tar.gz` archive and explain that individual profiles can be extracted with `hmmfetch`.
- [ ] Publish `gene_coordinates_with_og.tsv` and the complete `CORGIAS_result.csv` through the external repository.
- [ ] Publish the full metatranscriptome mapping outputs and OG-level Expression Score release tables; the Web-ready `env_corr_542` files are complete, but the large archival dataset is not linked from the Download page.
- [ ] Confirm that the core OrthoFinder assignment archive and resolved gene-tree archive are also copied to the chosen long-term repository, even though local downloads currently work.
- [ ] Review the three species-phylogeny downloads and finalize their order by scientific importance and recommended use. Clearly distinguish the primary rooted bac120 IQ-TREE result from the alternative SAR11_165 and bac120 FastTree results.
- [ ] Recalculate every file-size badge and verify the literature-table displayed date after all release files and external URLs are frozen.

## Manuscript Revision Notes: Ic Sampling And Family-Level Lineages

### Results

- Do not state that Ic itself is non-monophyletic without a separate test. In both current species trees, the three included Ic.2 genomes (`AG-414-E02`, `ARS1`, and `MED605`) form the lineage whose placement next to Clade II makes the historical broad Clade I grouping non-monophyletic/paraphyletic.
- Report this as a result concerning the placement of the sampled Ic.2 lineage and the non-monophyly of historical Clade I, not as a rejection of Mesopelagibacteraceae.
- Explain that this topology does not inherently conflict with the family-level name **Mesopelagibacteraceae**. The atlas now uses family-level lineages for broad display while retaining historical Ia/Ib/Ic and related labels for continuity with earlier literature.
- Report the marker-set comparison: the bac120 FastTree and SAR11_165 FastTree recover the same family-level backbone, and Pelagibacteraceae, Cosmipelagibacteraceae, Mesopelagibacteraceae, Allofontibacteraceae, and the family-unassigned SAR11 lineage are monophyletic in both trees. Fine-scale relationships are more marker-dependent, particularly within Pelagibacteraceae (normalized unrooted RF distance 0.575 within that family; global normalized unrooted RF distance 0.539).
- Emphasize the reproducible placement of Mesopelagibacteraceae as sister to Cosmipelagibacteraceae in both FastTree analyses. The relevant FastTree SH-like local support is 1.000 in the SAR11_165 tree and 0.991 in the bac120 tree. Do not describe these default FastTree values as conventional bootstrap support.
- Treat comparison with Freel et al. (2026) cautiously because the Ic genome sampling differs. Freel included five Ic SAGs: `AG-414-E02`, `AAA240-E13`, `AAA288-E13`, `AAA288-G21`, and `AAA288-N07`; the current atlas shares only `AG-414-E02` with that set and additionally includes `ARS1` and `MED605`.
- State the sampling limitation: the current 542-genome phylogeny does not contain the four Thrash et al. (2014) Ic genomes and therefore does not directly reproduce Freel's test of the broader historical Ic lineage.

### Methods

- [ ] Decide whether the manuscript Methods, a data-limitations paragraph, or both should document the environmental-metadata exclusions used by the Metatranscriptome Viewer. The Web analysis excludes `Carbon.total`, `CO3`, `HCO3`, and `Alkalinity.total` because the integrated PANGAEA.875567/Cell metadata values do not agree with station-level carbonate records and include implausible zero and nonzero values. The affected fields must not be used in environmental correlations unless reconstructed from the station-specific datasets under PANGAEA.836319.
- [ ] If this quality-control decision is included in the manuscript, distinguish source-data integrity exclusions from UI simplification: `Fluorescence` duplicates `fCDOM`, `Density` duplicates `Sigma-theta`, and `lower.size.fraction` is constant at 0.22 micrometres. Also state that negative calibrated Chlorophyll A values were treated as missing for plotting and correlations, while the original complete metadata table was preserved unchanged for provenance and download.
- [ ] Preserve the audit example for the manuscript decision: the integrated record for `TARA_A100001026` reports `HCO3 = 0`, whereas the corresponding TARA_032 surface station record in PANGAEA.838996 reports approximately 2,026 micromoles per kilogram. Nutrient fields were retained after representative station-level checks, so the exclusion should be described as specific to the identified fields rather than as a rejection of the complete Tara metadata resource.

- For the binary habitat annotation in Figure 1, classify records with `habitat_type == "marine"` or `habitat_type == "brackish_coastal"` as **Marine** and all remaining SAR11 records as **Others**. Note in the figure legend or Methods that Marine includes coastal seawater strains such as `IMCC9063`; this isolate was obtained from coastal surface seawater near Ny-Alesund in Kongsfjorden, although it has also been described as brackish- or mesohaline-adapted.

- State that genome inclusion was based on completeness and contamination reassessed consistently with the current CheckM2 workflow, rather than accepting completeness values reported by the original genome publications or later compilations without re-evaluation.
- Record CheckM2 v1.0.2, its model/workflow, the atlas thresholds of completeness >85% and contamination <10%, the command, and the quality-report date before submission. Preserve the strict boundary operators because SAGs estimated at exactly 85.0% completeness were excluded.
- Explain that the four Thrash et al. (2014) Ic SAGs were not retained because their current CheckM2 completeness estimates did not exceed the atlas completeness threshold of 85%. Preserve the source-reported values separately rather than presenting them as the values used for atlas selection.
- Document the lineage-scope filter separately from the CheckM2 filter: GTDB-Tk can classify historical Clade V genomes within Pelagibacterales, but Clade V was excluded from the SAR11 Atlas collection. Do not describe `order == Pelagibacterales` alone as the complete inclusion rule.
- Document that MAGs were not admitted automatically when they passed CheckM2. MAG inclusion was restricted to the explicitly curated lineage representatives used by the atlas, including the documented OMZ exception; other qualifying MAGs were excluded.
- Include the concrete discrepancy for auditability: `AAA240-E13` is reported as 93.8% complete in the Freel supplementary table but was estimated by the atlas CheckM2 run as 82.63% complete with 3.16% contamination (`Neural Network (Specific Model)`). Add the corresponding current CheckM2 values for `AAA288-E13`, `AAA288-G21`, and `AAA288-N07` from the final frozen quality report.
- Clarify any documented exceptions to the general quality rule and confirm that none of these four Thrash Ic SAGs qualified for an exception.

### Discussion And Figure Labels

- Use **family-level lineage** as the primary broad grouping in phylogenetic rings, Web filters, figure legends, and narrative summaries: Pelagibacteraceae (Ia/Ib), Mesopelagibacteraceae (Ic), Cosmipelagibacteraceae (II), Allofontibacteraceae (III), and family-unassigned Clade IV.
- Add a paired supplementary phylogeny figure comparing the bac120 FastTree and SAR11_165 FastTree. Use identical tip order, Family colors, and a restricted view centered on Mesopelagibacteraceae, Cosmipelagibacteraceae, and their neighboring family-level lineages; label SH-like local support at the Mesopelagibacteraceae-Cosmipelagibacteraceae split (0.991 and 1.000, respectively). State that the full-tree comparison supports the same family-level backbone while fine-scale within-family topology varies between marker sets.
- [x] Generated the paired reduced-family supplementary figure, reproducible R script, support summary, and interpretation memo under `SAR11_Gene_Catalog_analysis/fig1_phylogeny/supp_fasttree_family_comparison/`. The plotting workflow roots both 562-tip trees with the same 20 outgroups, removes the outgroups, preserves MRCA branch-length positions, expands the three Mesopelagibacteraceae genomes, and collapses the other monophyletic families for legibility.
- Retain `Clade1`, `Clade2`, and subclade labels in released metadata as historical labels, but avoid visually combining Ia/Ib/Ic into a single apparently monophyletic Clade I ring.
- Mention that differences between source-reported and CheckM2-reassessed completeness can alter lineage representation, particularly for sparsely sampled groups such as Ic, and therefore constrain topological comparisons across studies.

## Final Quality Assurance

- [ ] Replace all temporary public-data URLs listed below with `stsnsn/SAR11_Atlas` URLs and confirm HTTP 200 responses.
- [ ] Test the Genome Information and OG Information Taxonium views and the full Cosmograph neighboring network after the URL replacement.
- [ ] Check every Download-page link, external archive name, displayed size, status badge, and update date.
- [ ] Confirm that no Google Analytics, consent, private URL, API key, credential, local filesystem URL, or unpublished server path remains in public HTML, JavaScript, CSS, or documentation.
- [ ] Perform owner-led Chrome, Safari, and mobile checks for navigation, Deep/Shallow switching, fixed table headers, network labels/backgrounds, Plotly interactions, Mol* loading, downloads, and horizontal overflow.
- [ ] Remove release-only clutter such as `.DS_Store` files and confirm that large analysis intermediates intended for Zenodo are not accidentally committed to the GitHub Pages repository.

## External Data URLs

Before the final public release, replace the temporary `stsnsn/public_data` raw URLs used by Taxonium and Cosmograph with URLs from the public `stsnsn/SAR11_Atlas` repository.

Update these files:

- `html/SAR11_phylogeny.html`
- `html/taxonium_wrapper.html`
- `html/Neighborhood_network.html`

Final data URLs:

- `https://raw.githubusercontent.com/stsnsn/SAR11_Atlas/main/data/phylogeny/tree/SAR11_542_bac120_iqtree_rooted_SAR11_only.tree`
- `https://raw.githubusercontent.com/stsnsn/SAR11_Atlas/main/data/phylogeny/subclade_cat.tsv`
- `https://raw.githubusercontent.com/stsnsn/SAR11_Atlas/main/data/phylogeny/tree/tree_annottable_ogpage_542.tsv`
- `https://raw.githubusercontent.com/stsnsn/SAR11_Atlas/main/data/network/neighbor_network.tsv`
- `https://raw.githubusercontent.com/stsnsn/SAR11_Atlas/main/data/orthogroups/og_suggest.tsv`

After replacing the URLs, confirm that all five return HTTP 200 and test both Taxonium views and the full Cosmograph network.
