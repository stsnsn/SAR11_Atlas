# OG Information Viewer

The OG Information Viewer brings together functional annotations, environmental expression, and protein-structure information for an individual SAR11 orthogroup.

## Search For An Orthogroup

Enter an orthogroup ID such as `OG0000173`. The autocomplete search also accepts COG IDs, KEGG Orthology (KO) IDs, Pfam accessions or names, and gene names. Select a suggestion and press **Update OG Data**.

After an orthogroup is loaded, the shortcut buttons open its genome-context view, neighboring-gene network, or expression profile.

## Annotation Summary

The annotation header reports the representative COG, KO, and Pfam assignments available for the selected orthogroup. External links open the corresponding NCBI COG, KEGG, or InterPro/Pfam record.

The plots summarize how often individual annotations occur among proteins in the orthogroup:

- **COG Annotation Results** shows the distribution of COG assignments.
- **KO Annotation Results** shows the distribution of passing KO assignments.
- **Pfam** shows domain-level annotations and can contain multiple domains per protein.

Select a plotted annotation to open its external database record when a link is available. **No Annotation** or **data not found** means that the corresponding annotation source did not provide a supported assignment for that orthogroup.

## Expression Profile

The map displays the metatranscriptomic expression profile of the selected orthogroup across Tara Oceans stations. Values are shown as log-scaled TPM. Use the linked orthogroup name or **Expression Profile** button to open the full [Metatranscriptome Viewer](Metatranscriptome-Viewer).

## Protein Structure

When a matching cultured-strain protein is available, the page displays a predicted structure through Mol*. Links to strain HTCC1062 are preferred; otherwise, the cultured-strain match with the highest amino-acid identity is used.

The reported UniProt accession is a sequence match and is not necessarily identical to every member of the orthogroup. Some accessions may no longer resolve in the current UniProt release or may not have an AlphaFold DB prediction.

## Related Pages

- [All OG List](All-OG-List) helps identify an orthogroup before opening this viewer.
- [Neighboring Genes](Neighboring-Genes) compares gene order around the selected orthogroup.
- [Neighboring Network](Neighboring-Network) explores conserved neighborhood relationships.
