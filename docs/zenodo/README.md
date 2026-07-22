# SAR11 Genome Atlas: 542-genome dataset

This archive contains genome sequences, gene annotations, orthogroup profiles,
comparative-genomic results, and UniProt similarity-search outputs generated for
the 542-genome release of the **SAR11 Genome Atlas**.

The collection comprises 542 SAR11 genomes, including cultured strains,
single-amplified genomes (SAGs), and selected metagenome-assembled genomes
(MAGs). A total of 675,669 predicted protein-coding genes were assigned to 4,577
orthogroups using OrthoFinder and integrated with functional annotations and
downstream comparative analyses.

## Dataset contents

### Genome sequences and gene models

| File | Description | Size |
|---|---|---:|
| `fna_files.tar.gz` | Nucleotide genome assemblies for all 542 SAR11 genomes. | 195.21 MB |
| `faa_files.tar.gz` | Predicted protein sequences for all 542 SAR11 genomes. | 134.49 MB |
| `gff_files.tar.gz` | Genome annotations and gene coordinates in GFF format. | 225.92 MB |
| `gene_coordinates_with_og.tsv` | Gene coordinates linked to protein identifiers and orthogroup assignments. This table supports gene-neighborhood and operon analyses. | 59.97 MB |

### Protein-coding gene annotations

| File | Description | Size |
|---|---|---:|
| `all_prot_annotations.tsv` | Gene-level master annotation table for 675,669 predicted proteins. It includes genome and protein identifiers, orthogroup assignments, COGclassifier results, KofamScan annotations, PfamScan results, and amino-acid composition statistics calculated with quickARSC. | 214.50 MB |

### Orthogroup HMM profiles

| File | Description | Size |
|---|---|---:|
| `SAR11_Orthogroups_4577.hmm.tar.gz` | HMM profiles for all 4,577 SAR11 orthogroups. Profiles were built from orthogroup multiple-sequence alignments and combined into a distributable HMM library. | 90.16 MB |

After extracting the archive, individual orthogroup profiles can be retrieved
from the combined library using `hmmfetch`:

```bash
tar -xzf SAR11_Orthogroups_4577.hmm.tar.gz
hmmfetch SAR11_Orthogroups_4577.hmm OG0001080 > OG0001080.hmm
```

The library can be indexed before repeated searches:

```bash
hmmpress SAR11_Orthogroups_4577.hmm
```

### CORGIAS results

| File | Description | Size |
|---|---|---:|
| `corgias_result.csv` | Complete CORGIAS output describing statistically evaluated positive and negative associations among SAR11 orthogroups while accounting for phylogenetic relationships. This file underlies the CORGIAS Network page of the SAR11 Genome Atlas. | 417.37 MB |

### UniProtKB similarity-search results

Protein sequences from all 542 genomes were searched against **UniProtKB
release 2026_01** using **DIAMOND v2.1.10.164**.

| File | Description | Size |
|---|---|---:|
| `sar11_vs_sprot_2026_01.tsv` | High-identity DIAMOND results against UniProtKB/Swiss-Prot, generated using a minimum sequence identity of 85% and `--max-target-seqs 1`. | 2.09 MB |
| `sar11_vs_trembl_2026_01.tsv` | High-identity DIAMOND results against UniProtKB/TrEMBL, generated using a minimum sequence identity of 85% and `--max-target-seqs 1`. | 14.62 MB |
| `uniprot_pid30_cov80_filtered_hits.tsv.gz` | Broader homologous-reference search results retained at sequence identity >=30%, query coverage >=80%, subject coverage >=80%, and E-value <=1 x 10^-5. Up to ten target sequences were evaluated per query before filtering. | 199.50 MB |

The high-identity searches support close sequence matches, whereas the broader
filtered dataset provides more distant homologous references. Similarity to a
UniProt accession does not demonstrate functional equivalence, and a UniProt
match does not necessarily have an experimentally determined or
AlphaFoldDB-predicted structure.

## MD5 checksums

| File | MD5 |
|---|---|
| `all_prot_annotations.tsv` | `b79f3afc626013a373261191985d0dc6` |
| `sar11_vs_trembl_2026_01.tsv` | `4d10ff06e50526edd4d18ecb1ccc50cd` |
| `corgias_result.csv` | `98dd1d2911e90cc7f8d89bc117f20230` |
| `faa_files.tar.gz` | `616e21ed699572f7f80c87a26306f815` |
| `fna_files.tar.gz` | `76bf12744b27bf9c8991bc91a48d5301` |
| `gene_coordinates_with_og.tsv` | `d98bb75e392d1ecb35eb0969ab45f0b5` |
| `gff_files.tar.gz` | `49dde517cd5af143515521a3cafece31` |
| `SAR11_Orthogroups_4577.hmm.tar.gz` | `3645caf19765d91a14beb6545c864e1a` |
| `uniprot_pid30_cov80_filtered_hits.tsv.gz` | `806178d82480a92fea0a2605ce367fa4` |
| `sar11_vs_sprot_2026_01.tsv` | `3aad351d1b5badf7e6bf96a29fe95ce7` |

Checksums can be verified with:

```bash
md5sum <filename>
```

On macOS, use:

```bash
md5 <filename>
```

## Related resources

- [SAR11 Genome Atlas](https://stsnsn.github.io/SAR11_Atlas/)
- [SAR11 Genome Atlas source repository](https://github.com/stsnsn/SAR11_Atlas)
- [Zenodo record](https://zenodo.org/records/21468730)

## Citation

Nishino et al. **"SAR11 Genome Atlas."** *In preparation.*
