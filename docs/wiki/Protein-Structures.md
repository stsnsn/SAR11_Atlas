# Protein Structures

The Protein Structures page links proteins from the complete 542-genome SAR11 collection to UniProt accessions with confirmed AlphaFoldDB predictions. The web table contains 3,660 protein matches across 1,711 orthogroups.

All 675,669 SAR11 protein sequences were searched against UniProtKB release 2026_01 Swiss-Prot and TrEMBL with DIAMOND v2.1.10.164. Hits with at least 85% amino-acid identity were retained. For the structure-focused web table, candidates were further required to cover at least 70% of both the SAR11 query and UniProt subject. Up to the five highest-ranking candidates per orthogroup were checked with the AlphaFoldDB prediction API, and the web table retains those for which a model was available.

## Find A Protein Match

Use the searchable table to locate a SAR11 protein, gene, genome, orthogroup, annotation, or UniProt accession. The table reports sequence identity and coverage information together with KO and COG annotations where available. A `pident` value below 100% means that the SAR11 protein and UniProt sequence are not identical.

Select an accession to open the same page with that model loaded in the viewer below. Select an orthogroup to open its integrated [OG Information Viewer](OG-Information-Viewer). Use **Full screen view** when a larger table is needed.

## View And Compare A Structure

Enter a UniProt accession and press **Update structure**. The page checks the AlphaFoldDB prediction API; if a model exists, it is displayed with Mol* and the **Open Foldseek** button becomes available.

- Use **Open Mol* in full screen** for a larger interactive structure display.
- Use **Open Foldseek** to search for structurally similar proteins.

## Interpretation Notes

The web table includes only accessions confirmed through the AlphaFoldDB API when it was prepared. The complete UniProt similarity-search archive contains additional matches that may not have a predicted structure. A matched structure represents the UniProt sequence and is not necessarily identical to every protein in the corresponding orthogroup.

UniProtKB/TrEMBL redundancy reduction can remove or merge records that were present in an earlier release. If an accession no longer resolves, UniParc can be used to look for its historical sequence record. Complete gene-level and OG-representative UniProtKB 2026_01 search results are available from the [Download](Download) page.

Structure predictions should be interpreted together with sequence identity, domain annotations, and model confidence rather than as experimental structures.
