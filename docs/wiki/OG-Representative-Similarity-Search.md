# OG Representative Similarity Search (Beta)

The [OG Representative Similarity Search](https://stsnsn.github.io/SAR11_Atlas/html/SAR11_BLAST.html) compares one amino-acid query with one observed representative sequence from each of the 4,577 SAR11 orthogroups. It is intended for rapid exploration of candidate OGs, not definitive classification.

## Input

Paste one protein in FASTA format or as a plain amino-acid sequence. Spaces, line breaks, tabs, digits, `*`, and alignment-gap characters are removed before validation.

- One sequence per search
- Minimum length: 20 aa
- Maximum length: 5,000 aa
- Standard amino acids and `B`, `Z`, `X`, `J`, `U`, and `O` are accepted

The page rejects empty input, multiple FASTA entries, multiple blank-line-separated plain-sequence blocks, unsupported characters, oversized pasted content, embedded control characters, and input that is composed primarily of IUPAC nucleotide symbols. After removable formatting is stripped and the input has passed the amino-acid alphabet check, it is considered nucleotide-like when at least 98% of its characters belong to `A C G T U R Y S W K M B D H V N`. FNA, DNA, and RNA sequences are not searched. The compact status beside the input reports the current reason when a query is not valid.

## Search And Results

The query is compared with all OG representatives using Smith–Waterman local alignment, BLOSUM62, gap-open penalty 11, and gap-extension penalty 1. Results are ranked by raw alignment score. The result table also reports identity, alignment length, query coverage, subject coverage, representative length, annotation, and representative-genome subclade.

Open **Alignment** to inspect the local alignment or select an OG ID to continue to the OG Information Viewer. Results can be downloaded as TSV or CSV.

The top hit is a candidate, not an automatic OG assignment. The search does not calculate a BLAST-equivalent E-value. Closely related OGs, partial proteins, multidomain proteins, rapidly evolving sequences, and heterogeneous OGs can produce ambiguous rankings.

For more sensitive profile-based assignment, download the combined OG HMM library from the [Download](Download) page and search it with HMMER.

## Representative-Sequence Downloads

- [`OG_representative_sequences.faa`](https://stsnsn.github.io/SAR11_Atlas/data/BLAST/OG_representative_sequences.faa) provides one protein per OG with headers in `OG_ID|Sequence_ID` format.
- [`representative_sequences.tsv`](https://stsnsn.github.io/SAR11_Atlas/data/BLAST/representative_sequences.tsv) records selection statistics for every representative.

Each representative is an observed OG member selected as the sequence with the lowest EMBOSS `infoalign` percent change from the existing multiple-alignment consensus. It is not a synthetic consensus sequence.

## Privacy And Input Safety

The query and results remain in the browser. They are not transmitted, uploaded, logged, retained, or saved by this search. The SAR11 Genome Atlas does not collect query sequences, search results, or usage data through the OG Search.

The page does not use an AI model or interpret query text as instructions. Sequence and FASTA-header input is never inserted as executable HTML or JavaScript. A restrictive Content Security Policy blocks external scripts, inline scripts, `eval`-style execution, external network requests, and plugin objects on the search page. Validation is applied in both the page and its Web Worker, and downloadable tables neutralize spreadsheet-formula prefixes.
