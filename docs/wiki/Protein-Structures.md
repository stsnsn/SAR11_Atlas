# Protein Structures

The Protein Structures page links proteins from the complete 542-genome SAR11 collection to UniProt accessions with confirmed AlphaFoldDB predictions. The combined web table contains 8,057 structure references across 2,994 orthogroups.

The upper panel places an orthogroup-coverage summary beside the Mol* structure viewer. The searchable reference table is shown below them, so coverage, structure inspection, and accession lookup can be followed in that order.

## Orthogroup Coverage

- **Exact sequence matches:** 1,409/4,577 OGs (30.8%).
- **Additional close sequence matches:** 277/4,577 OGs (6.1%).
- **Additional distant homologous matches:** 1,308/4,577 OGs (28.6%).
- **No qualifying structure reference:** 1,583/4,577 OGs (34.6%).
- **Total covered:** 2,994/4,577 OGs (65.4%).

The exact-match class comprises 3,082 protein-to-UniProt links, and the remaining close-match class comprises 540 links. The distant-homolog-only OGs contribute another 4,435 displayed references. The orthogroup categories are mutually exclusive: exact matches take priority over close matches, and distant homologous matches are used only when an OG has neither an exact nor a close match.

## Mapping Workflow

All 675,669 SAR11 protein sequences were searched separately against the Swiss-Prot and TrEMBL sections of UniProtKB release 2026_01 with DIAMOND v2.1.10.164.

1. The close-match search used `--id 85 --max-target-seqs 1`. Hits were required to have at least 80% query and subject coverage.
2. The broader searches used `--id 30 --max-target-seqs 10`. Swiss-Prot and TrEMBL results were merged and duplicate gene-accession pairs were resolved by retaining the strongest result.
3. Broader-search hits were required to have at least 30% identity, at least 80% query coverage, at least 80% subject coverage, and an E-value no greater than 1e-5.
4. Hits were joined to the 542-genome protein annotation table by protein ID to add orthogroup, genome, KO, and COG fields.
5. Within each orthogroup, unique UniProt accessions were ranked by identity, minimum bidirectional coverage, query coverage, subject coverage, bitscore, and E-value. Up to five candidates were retained.
6. Candidate accessions were checked against the AlphaFoldDB prediction API. Only accessions with a confirmed model were retained.
7. Sequence matches were classified from their final alignment statistics: **exact sequence matches** have 100% identity and 100% query and subject coverage; **close sequence matches** have at least 85% identity and at least 80% query and subject coverage, excluding exact matches; and **distant homologous matches** have at least 30% identity, at least 80% query and subject coverage, and an E-value no greater than 1e-5.
8. The final Web table prioritizes exact matches, followed by close matches. AFDB-confirmed distant homologous matches are added only for OGs without either class.

These identity, coverage, and E-value thresholds are the operational cutoffs used to select structure references. The 30%-identity and 80%-coverage combination follows a sequence-similarity criterion used in [Seq2Symm](https://www.nature.com/articles/s41467-025-57148-3). Passing the cutoffs does not prove structural identity or conserved function.

## Find A Protein Match

Use the searchable table to locate a SAR11 protein, gene, genome, orthogroup, annotation, or UniProt accession. The table reports sequence identity and coverage information together with KO and COG annotations where available. A `pident` value below 100% means that the SAR11 protein and UniProt sequence are not identical.

Select an accession to reload the page with that model in the structure viewer above. Select an orthogroup to open its integrated [OG Information Viewer](OG-Information-Viewer). Use **Open the match table in full screen** when a larger table is needed.

## View And Compare A Structure

The accession field provides lightweight suggestions after it is focused. Search by UniProt accession, OG ID, COG-derived gene name, KO name, Pfam name, SAR11 gene ID, genome, KO ID, or COG ID. Each suggestion identifies the result as an **Exact / close** or **Distant homolog** candidate; the full table distinguishes exact from close matches using identity and bidirectional coverage. Selecting a suggestion loads the corresponding AlphaFoldDB structure reference in Mol*.

You can also enter a UniProt accession directly and press **Update structure**. The page checks the AlphaFoldDB prediction API; if a model exists, it is displayed with Mol* and the **Open Foldseek** button becomes available.

- Mol* opens in a focused structure view with its side controls collapsed. Use the wrench icon in the upper-right corner of Mol* when the full control interface is needed.
- Use **Open Mol* in full screen** for a larger interactive structure display.
- Use **Open Foldseek** to search for structurally similar proteins.

## Interpretation Notes

The web table includes only accessions confirmed through the AlphaFoldDB API when it was prepared. The complete UniProt similarity-search archive contains additional matches that may not have a predicted structure. Every displayed model represents its UniProt sequence. In particular, a structure reference identified through a distant homologous match is not a prediction of the linked SAR11 protein itself; differences in domains, insertions, active-site geometry, and oligomeric state remain possible.

UniProtKB/TrEMBL redundancy reduction can remove or merge records that were present in an earlier release. If an accession no longer resolves, UniParc can be used to look for its historical sequence record. Complete gene-level and OG-representative UniProtKB 2026_01 search results are available from the [Download](Download) page.

Structure predictions should be interpreted together with sequence identity, domain annotations, and model confidence rather than as experimental structures.
