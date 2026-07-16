# Release Checklist

## Handoff For The Next Session

The broad UI update and the 542-genome updates for genome metadata, orthogroup annotations, neighboring-gene views, neighboring and CORGIAS networks, and the species phylogeny are complete. Browser-based visual confirmation remains with the project owner.

Resume the remaining analyses in this order:

1. Complete the UniProtKB `2026_01` transfer and run the all-protein similarity search with either MMseqs2 or DIAMOND. Freeze the database metadata and search parameters before generating the complete hit archive and one representative hit per OG for the Web interface.
2. Run FastANI v1.34 all-vs-all on the 542 SAR11 genomes. Preserve directional output and alignment fractions, prepare the reciprocal-mean matrix, and generate the separately documented 95% ANI representative genome set.
3. After metatranscriptome mapping finishes, aggregate the results by OG, update the Metatranscriptome Viewer inputs, and prepare the sample-level and OG-level release tables.

After these analyses, update the affected HTML and Wiki pages, prepare the versioned Zenodo archives, replace the Coming soon cards with final links, switch temporary public-data URLs to `stsnsn/SAR11_Atlas`, and complete the final file-size, literature-date, and phylogeny-order checks.

## Pending Analysis Updates

- [ ] Download and verify the archived UniProtKB release `2026_01` locally.
- [ ] Extract the Swiss-Prot and TrEMBL FASTA files and transfer them to the analysis server with a resumable transfer.
- [ ] Select MMseqs2 or DIAMOND, search all proteins from the 542 SAR11 genomes against UniProtKB `2026_01`, and record the tool version, command, thresholds, database checksums, and download date.
- [ ] Prepare the complete protein-to-UniProt hit table and supporting metadata for deposition in Zenodo.
- [ ] Prepare a compact Web table containing one representative UniProt hit per OG, with AlphaFold DB availability where possible.
- [ ] Replace `data/structure/allhitog_uniprot.tsv` and `data/structure/tophitog_uniprot.tsv`, then update the Protein Structures page, OG Information Viewer, and related Wiki pages.
- [ ] Update the metatranscriptome datasets and OG mappings after the ongoing computation is complete, prepare the mapping and OG-level expression results for release, and add their download link. This task is currently on hold.
- [ ] Calculate all-vs-all average nucleotide identity for the 542 SAR11 genomes with FastANI v1.34. Retain directional ANI values, matched and total fragment counts, and alignment fractions; generate a reciprocal-mean symmetric matrix with unreported comparisons represented as `NA`; and record the complete command and parameters. Prepare both raw and matrix-form results for download.
- [ ] Cluster the 542 SAR11 genomes at 95% ANI and prepare a representative genome set. Document the clustering procedure and representative-selection priorities, provide the complete cluster membership table, and release representative FNA/FAA archives. State explicitly that 95% ANI is used here for technical dereplication rather than SAR11 species classification.
- [ ] Review the three species-phylogeny downloads on `html/download.html` and finalize their order by scientific importance and recommended use. Clearly distinguish the primary tree from the alternative `SAR11_165` and bac120 marker-set or inference-method trees in both the card text and Download Wiki.
- [ ] Prepare versioned Zenodo archives for the 542-genome FNA/FAA collection, full gene-level annotations, OrthoFinder clustering outputs, complete comparative-analysis results, and OG HMM profiles and gene trees; then replace the corresponding Coming soon cards with release links.
- [ ] Recalculate every file-size badge and verify the displayed literature-table update date on `html/download.html` after the final release files are frozen and before publication.

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
