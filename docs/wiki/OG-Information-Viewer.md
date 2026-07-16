# OG Information Viewer

The OG Information Viewer brings together functional annotations, environmental expression, and protein-structure information for an individual SAR11 orthogroup.

## Search For An Orthogroup

Enter an orthogroup ID such as `OG0000173`. The autocomplete search also accepts COG IDs, KEGG Orthology (KO) IDs, Pfam accessions or names, and gene names. Select a suggestion and press **Update OG Data**.

After an orthogroup is loaded, the shortcut buttons open its genome-context view, neighboring-gene network, or expression profile.

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

The map displays the metatranscriptomic Expression Score of the selected orthogroup across Tara Oceans stations using a log-style visual scale. The score is the sum of TPM values assigned to the OG within a sample and is not a conventional single-gene TPM measurement. Use the linked orthogroup name or **Expression Profile** button to open the full [Metatranscriptome Viewer](Metatranscriptome-Viewer).

## Protein Structure

When a matching cultured-strain protein is available, the page displays a predicted structure through Mol*. Links to strain HTCC1062 are preferred; otherwise, the cultured-strain match with the highest amino-acid identity is used.

The structure-link dataset has not yet been regenerated for the complete 542-genome release. Structure results may therefore be unavailable for newly added or renumbered orthogroups until that update is complete.

The reported UniProt accession is a sequence match and is not necessarily identical to every member of the orthogroup. Some accessions may no longer resolve in the current UniProt release or may not have an AlphaFold DB prediction.

## Related Pages

- [All OG List](All-OG-List) helps identify an orthogroup before opening this viewer.
- [Neighboring Genes](Neighboring-Genes) compares gene order around the selected orthogroup.
- [Neighboring Network](Neighboring-Network) explores conserved neighborhood relationships.
