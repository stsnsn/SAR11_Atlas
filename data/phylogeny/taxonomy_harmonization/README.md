# Taxonomy harmonization

Topology-based Family, Genus, and Subclade assignments use only the
SAR11_165 IQ-TREE 2 phylogeny:

`data/phylogeny/tree/SAR11_542_SCG165_iqtree.tree`

An assignment is accepted only when its seed-bounded crown has UFBoot support
of at least 0.95. Candidates below 0.95 remain unassigned; there is no
provisional topology category. Direct literature assignments and species
transfers supported by both ANI >=95% and AAI >=95% are retained.

The current outputs are in
`outputs/final_sar11_165_iqtree_high_support/`. Its `original_*` audit columns
provide the preceding classification required for a self-contained rerun.
Superseded outputs and comparison artifacts are kept locally under the ignored
`tmp/taxonomy_archive/` directory and are not part of the current release.

Reproducibility scripts are packaged in
`data/phylogeny/phylogeny_scripts.tar.gz`. From the repository root, extract
the archive and run:

```sh
Rscript scripts/build_harmonized_taxonomy.R
Rscript scripts/promote_harmonized_taxonomy.R
Rscript scripts/audit_taxonomy_outputs.R
Rscript data/overview/build_overview_tables.R
node scripts/build_og_search_database.mjs
```
