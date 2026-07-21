# OG Information Viewer

The OG Information Viewer brings together functional annotations, phylogenetic distribution, environmental expression, genome-context links, and protein-structure information for an individual SAR11 orthogroup.

## Search For An Orthogroup

Enter an orthogroup ID such as `OG0000173`. The autocomplete search also accepts COG IDs, KEGG Orthology (KO) IDs, Pfam accessions or names, and gene names. Select a suggestion and press **Update OG Data**.

After an orthogroup is loaded, the shortcut buttons open its genome-context view, neighboring-gene network, CORGIAS network, or expression profile.

## Annotation Summary

The annotation header reports representative COG, KO, and Pfam assignments calculated from the current 542-genome protein annotation table. External links open the corresponding NCBI COG, KEGG, or InterPro/Pfam record.

The plots summarize how often individual annotations occur among proteins in the orthogroup:

- **COG Annotation Results** shows the distribution of the best COG hit assigned to each protein.
- **KO Annotation Results** shows the distribution of the best supported KO hit assigned to each protein.
- **Pfam** shows domain-level annotations and can contain multiple domains per protein.

The COG and KO pie charts include an unannotated slice when some orthogroup members lack that annotation. Pfam counts are domain/type counts and therefore should not be interpreted as mutually exclusive protein fractions.

Select a plotted annotation to open its external database record when a link is available. **No Annotation** or **data not found** means that the corresponding annotation source did not provide a supported assignment for that orthogroup.

## Phylogenetic Distribution

The Taxonium panel shows presence or absence of the selected orthogroup across the bac120 IQ-TREE phylogeny. The tree was rooted with 20 alphaproteobacterial outgroups and then pruned to the 542 SAR11 genomes shown in the panel. Orthogroup presence is calculated from the current 542-genome OrthoFinder assignment.

## Expression Profile

The map displays the metatranscriptomic Expression Score of the selected orthogroup across Tara Oceans samples using a log-style visual scale. The score is the sum of TPM values assigned to the OG within a sample and is not a conventional single-gene TPM measurement. Use the linked orthogroup name or **Expression Profile** button to open the full [Metatranscriptome Viewer](Metatranscriptome-Viewer).

## Protein Structure

The structure panel uses the AFDB-confirmed structure-reference table generated from the 542-genome protein collection. It prioritizes close sequence matches. If an OG has no close match, a homologous reference meeting the 30% identity, 80% query coverage, 80% subject coverage, and E-value 1e-5 criteria is displayed when available. The accession is loaded into Mol*, and **Open Foldseek** starts a structural-homology search for that AlphaFoldDB model.

Protein sequences were searched against UniProtKB release 2026_01 with DIAMOND v2.1.10.164. Hits with at least 85% amino-acid identity were retained, and the highest-ranking hit was saved for each query protein. A UniProt match below 100% identity is not sequence-identical to the SAR11 protein.

When a homologous reference is used, the viewer warns that the model belongs to a homologous UniProt protein and is not a prediction of the SAR11 protein itself. If no confirmed reference is available, the viewer hides the empty Mol* frame and suggests AlphaFold Server when a new prediction for a specific SAR11 protein is needed.

## Related Pages

- [All OG List](All-OG-List) helps identify an orthogroup before opening this viewer.
- [Neighboring Genes](Neighboring-Genes) compares gene order around the selected orthogroup.
- [Neighboring Network](Neighboring-Network) explores conserved neighborhood relationships.
