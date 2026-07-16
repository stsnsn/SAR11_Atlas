# SAR11 Genome Atlas Overview

The Overview page provides a visual summary of the SAR11 Genome Atlas and serves as the main entry point to its genome-, orthogroup-, network-, literature-, and expression-level tools.

## Atlas Summary

The summary cards at the top of the page report the current size and annotation coverage of the atlas:

- **Genomes**: 542 SAR11 genomes in the unfiltered collection.
- **Subclades**: 25 represented SAR11 subclades in the unfiltered collection.
- **Proteins**: 675,669 predicted protein sequences.
- **With at least one annotation**: 91.8% of proteins have at least one COG, KO, or Pfam assignment.
- **Orthogroups**: 4,577 groups inferred across the collection; 670,693 proteins, or 99.3%, were assigned to an orthogroup.

The 99.3% orthogroup-assignment value is shown only for the complete collection because it is an overall OrthoFinder statistic. Other card values and the orthogroup count update dynamically after filtering.

Select a summary card to open the corresponding Genome Information or All OG List page.

## Explore The Atlas

The Explore cards provide direct access to the major tools in the atlas:

- **Genome Information**: explore genome sampling locations, phylogenetic relationships, and searchable genome metadata.
- **OG Information Viewer**: inspect orthogroup members, functional annotations, expression patterns, and related information.
- **CORGIAS Network**: explore correlation-based relationships among SAR11 orthogroups.
- **SAR11 Paper Network**: browse curated SAR11 publications and literature relationships.
- **Neighboring Network**: compare conserved neighboring-orthogroup relationships across SAR11 genomes.
- **Metatranscriptome Viewer**: examine orthogroup expression across Tara Oceans metatranscriptomic samples.

Hover over or focus a card to display its description. Select a card to open that tool in the current browser tab.

## Filtering The Collection

Use the controls under **Explore the collection** to filter the summary statistics and visualizations.

- **Genome type**: show all genomes or select MAGs, SAGs, or cultured isolates.
- **Subclade**: restrict the collection to a selected SAR11 subclade.
- **Reset**: return all filters to their default values.

The selected genome type and subclade are applied simultaneously to all panels. The protein-length panel also has its own annotation-group filter.

## Genome Sources

The donut chart summarizes the number and proportion of genomes obtained as:

- **MAG**: metagenome-assembled genome.
- **SAG**: single-amplified genome.
- **Isolate**: genome from a cultured strain.

The colors match those used on the SAR11 Genome Map: red for MAGs, blue for SAGs, and yellow for cultured isolates. Hover over a segment to view its genome count and percentage.

## Annotation Overlap

The annotation overlap panel is an UpSet plot showing how protein annotations overlap among **COG**, **KO**, and **Pfam**.

The bars show the number of proteins in each annotation combination. The connected dots below each bar indicate which annotation sources are included. Proteins without any of the three annotations are shown as **No annotation**.

This view can be used to distinguish proteins supported by multiple annotation systems from proteins detected by only one system.

## Genome Size And GC Content

The scatter plot compares genome size and GC content across the selected genomes.

- The horizontal axis shows genome size in megabase pairs.
- The vertical axis shows GC content as a percentage.
- Point color indicates genome type.
- Point size reflects the number of predicted proteins.

Hover over a point to view the genome name, subclade, genome type, genome size, GC content, protein count, completeness, and contamination.

## Protein Length Distribution

The protein-length histogram summarizes predicted protein sizes in 25-amino-acid intervals. Proteins of 2,000 amino acids or longer are combined into the final bin.

Use the **Annotation group** menu to display all proteins or a selected combination of COG, KO, and Pfam annotations. Hover over a bar to view the corresponding length interval and protein count.

## Display Theme

Use the **Deep mode** or **Shallow mode** button near the top of the page to change the display theme. The selected theme is retained while moving between atlas pages.
