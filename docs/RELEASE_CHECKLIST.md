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
- [x] Updated the OrthoFinder 3 dataset to 4,577 orthogroups and 675,669 proteins; 670,693 proteins are assigned to orthogroups and 4,976 are unassigned.
- [x] Generated and installed the compact OG annotation summary and KO, COG, and Pfam count tables used by the Web charts.
- [x] Packaged the core OrthoFinder assignments and statistics as `SAR11_Orthogroup_Assignments_542.tar.gz`.
- [x] Added the rooted 542-tip bac120 IQ-TREE phylogeny, two alternative FastTree phylogenies, and the archive of 3,411 resolved OrthoFinder gene trees.
- [x] Updated the 542-genome neighboring-gene files, operon viewer, directed neighboring network, CORGIAS network, and CORGIAS result table.
- [x] Downloaded and checksum-verified UniProtKB release `2026_01`, extracted Swiss-Prot and TrEMBL sequences, and searched all 675,669 proteins with DIAMOND v2.1.10.164 at a minimum of 85% identity with one top hit per query.
- [x] Generated `uniprot_pid85_gene_hits.tsv`, `uniprot_pid85_og_representative_hits.tsv`, and `uniprot_pid85_afdb_matches.tsv`. The structure table contains up to five checked candidates per OG and retains all candidates with confirmed models.
- [x] Updated Protein Structures, OG Information Viewer, Download, and the associated Wiki pages for the UniProtKB/AlphaFoldDB workflow and no-hit handling.
- [x] Completed FastANI v1.34 all-vs-all computation and retained `data/phylogeny/fastani_SAR11_542.out`.
- [x] Generated and validated the symmetric 542 x 542 ANI matrix, retained the directional raw output with fragment counts, and added both files to the Download page and Download Wiki.
- [x] Completed CompareM v0.1.2 AAI computation and retained `data/phylogeny/comparem_aaiwf_SAR11_542_out_summary.tsv`.
- [x] Added the CompareM AAI summary, method, and file size alongside the ANI outputs on the Download page and Download Wiki.
- [x] Rebuilt all 4,577 OG-level metatranscriptome files in `data/env_corr_542`, separated the complete Tara Oceans metadata table, and updated both metatranscriptome pages and Wiki documentation.
- [x] Updated all Wiki pages to reflect the current 542-genome data and interface behavior.
- [x] Removed Google Analytics, consent code, and the Privacy Policy after deciding not to collect access statistics.
- [x] Added mobile sidebar navigation and standardized Deep/Shallow theme behavior, network dark backgrounds, tables, controls, focus states, and responsive layout.
- [x] Corrected corrupted non-ASCII author names in 98 literature records by matching their PMIDs to PubMed; no author-field underscores remain.

## Remaining Release Work

- [ ] Add a release README or methods record containing the UniProtKB `2026_01` archive checksum, download date, DIAMOND command and database-build command, query/subject coverage policy, and result-selection rules. The Web pages already record the principal version and thresholds, but the complete reproducibility record is not yet packaged.
- [ ] Publish the broader UniProtKB/TrEMBL similarity-search result generated with DIAMOND using `--id 30 --max-target-seqs 10` on Zenodo, then replace its Coming soon Download card with the versioned archive link and file size. Keep this search configuration distinct from the current high-similarity `--id 85 --max-target-seqs 1` dataset.
- [ ] Decide whether a 95% ANI dereplicated representative set is needed as a separate analysis. It is no longer a required Download-page card; if restored, document it as technical dereplication rather than formal SAR11 species classification.
- [ ] Prepare versioned external archives for the 542 FNA, FAA, and GFF collections.
- [ ] Publish `all_prot_annotations.tsv`, including OG, COGclassifier, KofamScan, PfamScan, and quickARSC results, through the external repository.
- [ ] Publish the combined `SAR11_Orthogroups_4577.hmm.tar.gz` archive and explain that individual profiles can be extracted with `hmmfetch`.
- [ ] Publish `gene_coordinates_with_og.tsv` and the complete `CORGIAS_result.csv` through the external repository.
- [ ] Publish the full metatranscriptome mapping outputs and OG-level Expression Score release tables; the Web-ready `env_corr_542` files are complete, but the large archival dataset is not linked from the Download page.
- [ ] Confirm that the core OrthoFinder assignment archive and resolved gene-tree archive are also copied to the chosen long-term repository, even though local downloads currently work.
- [ ] Review the three species-phylogeny downloads and finalize their order by scientific importance and recommended use. Clearly distinguish the primary rooted bac120 IQ-TREE result from the alternative SAR11_165 and bac120 FastTree results.
- [ ] Recalculate every file-size badge and verify the literature-table displayed date after all release files and external URLs are frozen.

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
