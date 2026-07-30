#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const blastDir = path.join(root, "data", "BLAST");
const outputDir = path.join(blastDir, "search");

const fastaPath = path.join(blastDir, "OG_representative_sequences.faa");
const representativesPath = path.join(blastDir, "representative_sequences.tsv");
const annotationsPath = path.join(root, "data", "orthogroups", "og_suggest.tsv");
const taxonomyPath = path.join(
  root,
  "data",
  "phylogeny",
  "taxonomy_harmonization",
  "outputs",
  "final_dual_iqtree",
  "subclade_harmonized.tsv",
);

const AA_CODES = new Map(
  [..."ARNDCQEGHILKMFPSTWYVBZX"].map((aminoAcid, index) => [
    aminoAcid,
    index,
  ]),
);
for (const ambiguous of "JUO") AA_CODES.set(ambiguous, 22);

function parseTsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").replace(/\r/g, "").trimEnd().split("\n");
  const header = lines[0].split("\t");
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(
      header.map((key, index) => [
        key,
        (values[index] ?? "").replace(/^"(.*)"$/, "$1"),
      ]),
    );
  });
}

function parseFasta(filePath) {
  const records = [];
  let header = "";
  let sequence = [];

  for (const line of fs.readFileSync(filePath, "utf8").replace(/\r/g, "").split("\n")) {
    if (line.startsWith(">")) {
      if (header) records.push({ header, sequence: sequence.join("") });
      header = line.slice(1).trim().split(/\s+/, 1)[0];
      sequence = [];
    } else if (line.trim()) {
      sequence.push(line.trim().toUpperCase());
    }
  }
  if (header) records.push({ header, sequence: sequence.join("") });
  return records;
}

function optional(value) {
  return value && value !== "NA" ? value : "";
}

fs.mkdirSync(outputDir, { recursive: true });

const representatives = new Map(
  parseTsv(representativesPath).map((row) => [row.OG_ID, row]),
);
const annotations = new Map(
  parseTsv(annotationsPath).map((row) => [row.og_id, row]),
);
const taxonomyRows = parseTsv(taxonomyPath);
const taxonomy = new Map(taxonomyRows.map((row) => [row.genome, row]));
const genomeNames = [...taxonomy.keys()].sort((a, b) => b.length - a.length);
const fastaRecords = parseFasta(fastaPath);

const encodedSequences = [];
const offsets = new Uint32Array(fastaRecords.length * 3);
const metadata = [];
let residueOffset = 0;

for (const [index, record] of fastaRecords.entries()) {
  const separator = record.header.indexOf("|");
  if (separator < 1) throw new Error(`Invalid representative header: ${record.header}`);

  const ogId = record.header.slice(0, separator);
  const sequenceId = record.header.slice(separator + 1);
  const representative = representatives.get(ogId);
  const annotation = annotations.get(ogId) ?? {};

  if (!representative) throw new Error(`Missing selection metadata: ${ogId}`);
  if (representative.Sequence_ID !== sequenceId) {
    throw new Error(`Sequence ID mismatch for ${ogId}`);
  }
  if (Number(representative.Sequence_length) !== record.sequence.length) {
    throw new Error(`Sequence length mismatch for ${ogId}`);
  }

  const genomeId =
    genomeNames.find(
      (genome) => sequenceId === genome || sequenceId.startsWith(`${genome}_`),
    ) ?? sequenceId.split("_", 1)[0];
  const taxon = taxonomy.get(genomeId) ?? {};
  const encoded = Uint8Array.from(record.sequence, (aminoAcid) => {
    const code = AA_CODES.get(aminoAcid);
    if (code === undefined) throw new Error(`Unsupported amino acid ${aminoAcid} in ${ogId}`);
    return code;
  });

  encodedSequences.push(encoded);
  offsets[index * 3] = residueOffset;
  offsets[index * 3 + 1] = encoded.length;
  offsets[index * 3 + 2] = index;
  residueOffset += encoded.length;

  metadata.push({
    index,
    og_id: ogId,
    sequence_id: sequenceId,
    sequence_length: encoded.length,
    annotation:
      optional(annotation.ko_name) ||
      optional(annotation.cog_name) ||
      optional(annotation.pfam_names) ||
      "Uncharacterized protein",
    cog: optional(annotation.cog),
    cog_name: optional(annotation.cog_name),
    ko: optional(annotation.ko),
    ko_name: optional(annotation.ko_name),
    pfam: optional(annotation.pfams),
    pfam_name: optional(annotation.pfam_names),
    genome_id: genomeId,
    subclade: optional(taxon.Subclade) || optional(taxon.Clade2),
    family: optional(taxon.Family),
    genus: optional(taxon.Genus),
    og_url: `./SAR11_OG_info.html?ogInput=${encodeURIComponent(ogId)}`,
    consensus_percent_change: Number(representative.Percent_change),
  });
}

if (metadata.length !== representatives.size) {
  throw new Error(
    `FASTA/selection count mismatch: ${metadata.length} vs ${representatives.size}`,
  );
}

const sequenceBuffer = Buffer.alloc(residueOffset);
let writeOffset = 0;
for (const sequence of encodedSequences) {
  Buffer.from(sequence).copy(sequenceBuffer, writeOffset);
  writeOffset += sequence.length;
}

const databaseVersion = {
  database_version: "SAR11-OG-representatives-2026-07-30",
  created_at: "2026-07-30",
  atlas_release: "SAR11 Genome Atlas — 542 genomes",
  orthogroup_count: metadata.length,
  sequence_count: metadata.length,
  total_residues: residueOffset,
  representative_selection_method:
    "Observed sequence with the lowest EMBOSS infoalign percent change from the MSA consensus; ties resolved by gap count and sequence ID.",
  alignment_algorithm: "Smith–Waterman local alignment",
  scoring_matrix: "BLOSUM62",
  gap_open: 11,
  gap_extension: 1,
  e_value: false,
};

fs.writeFileSync(path.join(outputDir, "og_sequences.bin"), sequenceBuffer);
fs.writeFileSync(
  path.join(outputDir, "og_offsets.bin"),
  Buffer.from(offsets.buffer),
);
fs.writeFileSync(
  path.join(outputDir, "og_metadata.json"),
  `${JSON.stringify(metadata)}\n`,
);
fs.writeFileSync(
  path.join(outputDir, "database_version.json"),
  `${JSON.stringify(databaseVersion, null, 2)}\n`,
);

console.log(
  `Built ${metadata.length} OG representatives (${residueOffset} residues) in ${outputDir}`,
);
