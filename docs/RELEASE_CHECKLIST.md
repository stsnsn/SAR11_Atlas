# Release Checklist

## Pending Analysis Updates

- [ ] Download and verify the archived UniProtKB release `2026_01` locally.
- [ ] Extract the Swiss-Prot and TrEMBL FASTA files and transfer them to the analysis server with a resumable transfer.
- [ ] Search all proteins from the 542 SAR11 genomes against UniProtKB `2026_01` and record the MMseqs2 version, command, thresholds, database checksums, and download date.
- [ ] Prepare the complete protein-to-UniProt hit table and supporting metadata for deposition in Zenodo.
- [ ] Prepare a compact Web table containing one representative UniProt hit per OG, with AlphaFold DB availability where possible.
- [ ] Replace `data/structure/allhitog_uniprot.tsv` and `data/structure/tophitog_uniprot.tsv`, then update the Protein Structures page, OG Information Viewer, and related Wiki pages.
- [ ] Update the metatranscriptome datasets and OG mappings after the ongoing computation is complete. This task is currently on hold.

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
