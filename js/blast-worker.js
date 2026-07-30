"use strict";

const SEARCH_ROOT = "../data/BLAST/search/";
const AMINO_ACIDS = "ARNDCQEGHILKMFPSTWYVBZX";
const BLOSUM62 = [
  [4,-1,-2,-2,0,-1,-1,0,-2,-1,-1,-1,-1,-2,-1,1,0,-3,-2,0,-2,-1,0,-4],
  [-1,5,0,-2,-3,1,0,-2,0,-3,-2,2,-1,-3,-2,-1,-1,-3,-2,-3,-1,0,-1,-4],
  [-2,0,6,1,-3,0,0,0,1,-3,-3,0,-2,-3,-2,1,0,-4,-2,-3,3,0,-1,-4],
  [-2,-2,1,6,-3,0,2,-1,-1,-3,-4,-1,-3,-3,-1,0,-1,-4,-3,-3,4,1,-1,-4],
  [0,-3,-3,-3,9,-3,-4,-3,-3,-1,-1,-3,-1,-2,-3,-1,-1,-2,-2,-1,-3,-3,-2,-4],
  [-1,1,0,0,-3,5,2,-2,0,-3,-2,1,0,-3,-1,0,-1,-2,-1,-2,0,3,-1,-4],
  [-1,0,0,2,-4,2,5,-2,0,-3,-3,1,-2,-3,-1,0,-1,-3,-2,-2,1,4,-1,-4],
  [0,-2,0,-1,-3,-2,-2,6,-2,-4,-4,-2,-3,-3,-2,0,-2,-2,-3,-3,-1,-2,-1,-4],
  [-2,0,1,-1,-3,0,0,-2,8,-3,-3,-1,-2,-1,-2,-1,-2,-2,2,-3,0,0,-1,-4],
  [-1,-3,-3,-3,-1,-3,-3,-4,-3,4,2,-3,1,0,-3,-2,-1,-3,-1,3,-3,-3,-1,-4],
  [-1,-2,-3,-4,-1,-2,-3,-4,-3,2,4,-2,2,0,-3,-2,-1,-2,-1,1,-4,-3,-1,-4],
  [-1,2,0,-1,-3,1,1,-2,-1,-3,-2,5,-1,-3,-1,0,-1,-3,-2,-2,0,1,-1,-4],
  [-1,-1,-2,-3,-1,0,-2,-3,-2,1,2,-1,5,0,-2,-1,-1,-1,-1,1,-3,-1,-1,-4],
  [-2,-3,-3,-3,-2,-3,-3,-3,-1,0,0,-3,0,6,-4,-2,-2,1,3,-1,-3,-3,-1,-4],
  [-1,-2,-2,-1,-3,-1,-1,-2,-2,-3,-3,-1,-2,-4,7,-1,-1,-4,-3,-2,-2,-1,-2,-4],
  [1,-1,1,0,-1,0,0,0,-1,-2,-2,0,-1,-2,-1,4,1,-3,-2,-2,0,0,0,-4],
  [0,-1,0,-1,-1,-1,-1,-2,-2,-1,-1,-1,-1,-2,-1,1,5,-2,-2,0,-1,-1,0,-4],
  [-3,-3,-4,-4,-2,-2,-3,-2,-2,-3,-2,-3,-1,1,-4,-3,-2,11,2,-3,-4,-3,-2,-4],
  [-2,-2,-2,-3,-2,-1,-2,-3,2,-1,-1,-2,-1,3,-3,-2,-2,2,7,-1,-3,-2,-1,-4],
  [0,-3,-3,-3,-1,-2,-2,-3,-3,3,1,-2,1,-1,-2,-2,0,-3,-1,4,-3,-2,-1,-4],
  [-2,-1,3,4,-3,0,1,-1,0,-3,-4,0,-3,-3,-2,0,-1,-4,-3,-3,4,1,-1,-4],
  [-1,0,0,1,-3,3,4,-2,0,-3,-3,1,-1,-3,-1,0,-1,-3,-2,-2,1,4,-1,-4],
  [0,-1,-1,-1,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-2,0,0,-2,-1,-1,-1,-1,-1,-4],
  [-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,1],
];

let databasePromise;

function report(stage, message, completed = 0, total = 0) {
  self.postMessage({ type: "progress", stage, message, completed, total });
}

async function loadDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = (async () => {
    report("database", "Loading the OG representative database…");
    const [wasmResponse, sequencesResponse, offsetsResponse, metadataResponse, versionResponse] =
      await Promise.all([
        fetch(`${SEARCH_ROOT}smith_waterman.wasm`),
        fetch(`${SEARCH_ROOT}og_sequences.bin`),
        fetch(`${SEARCH_ROOT}og_offsets.bin`),
        fetch(`${SEARCH_ROOT}og_metadata.json`),
        fetch(`${SEARCH_ROOT}database_version.json`),
      ]);

    for (const response of [
      wasmResponse,
      sequencesResponse,
      offsetsResponse,
      metadataResponse,
      versionResponse,
    ]) {
      if (!response.ok) throw new Error(`Could not load ${response.url}`);
    }

    report("wasm", "Initializing the local WebAssembly search engine…");
    const wasmBytes = await wasmResponse.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBytes, {
      wasi_snapshot_preview1: { proc_exit() {} },
    });

    const sequences = new Uint8Array(await sequencesResponse.arrayBuffer());
    const offsets = new Uint32Array(await offsetsResponse.arrayBuffer());
    const metadata = await metadataResponse.json();
    const version = await versionResponse.json();

    if (offsets.length !== metadata.length * 3) {
      throw new Error("The sequence index and metadata contain different record counts.");
    }

    return { wasm: instance.exports, sequences, offsets, metadata, version };
  })();

  return databasePromise;
}

function encodeSequence(sequence) {
  return Uint8Array.from(sequence, (aminoAcid) => {
    if ("JUO".includes(aminoAcid)) return 22;
    const code = AMINO_ACIDS.indexOf(aminoAcid);
    return code >= 0 ? code : 22;
  });
}

function decodeSequence(encoded) {
  let sequence = "";
  const chunkSize = 8192;
  for (let start = 0; start < encoded.length; start += chunkSize) {
    sequence += Array.from(
      encoded.subarray(start, start + chunkSize),
      (code) => AMINO_ACIDS[code] ?? "X",
    ).join("");
  }
  return sequence;
}

function tracebackAlignment(query, subject) {
  const queryLength = query.length;
  const subjectLength = subject.length;
  const width = subjectLength + 1;
  const cells = (queryLength + 1) * width;
  const scores = new Int32Array(cells);
  const directions = new Uint8Array(cells);
  const gapLengths = new Uint16Array(cells);
  const verticalScores = new Int32Array(width);
  const verticalLengths = new Uint16Array(width);
  verticalScores.fill(-1000000000);

  let bestScore = 0;
  let bestI = 0;
  let bestJ = 0;

  for (let i = 1; i <= queryLength; i += 1) {
    let horizontalScore = -1000000000;
    let horizontalLength = 0;
    const row = i * width;
    const previousRow = row - width;

    for (let j = 1; j <= subjectLength; j += 1) {
      const index = row + j;
      const verticalOpen = scores[previousRow + j] - 11;
      const verticalExtend = verticalScores[j] - 1;
      if (verticalOpen >= verticalExtend) {
        verticalScores[j] = verticalOpen;
        verticalLengths[j] = 1;
      } else {
        verticalScores[j] = verticalExtend;
        verticalLengths[j] += 1;
      }

      const horizontalOpen = scores[index - 1] - 11;
      const horizontalExtend = horizontalScore - 1;
      if (horizontalOpen >= horizontalExtend) {
        horizontalScore = horizontalOpen;
        horizontalLength = 1;
      } else {
        horizontalScore = horizontalExtend;
        horizontalLength += 1;
      }

      const diagonal =
        scores[previousRow + j - 1] + BLOSUM62[query[i - 1]][subject[j - 1]];
      let score = diagonal;
      let direction = 1;
      let gapLength = 0;

      if (verticalScores[j] > score) {
        score = verticalScores[j];
        direction = 2;
        gapLength = verticalLengths[j];
      }
      if (horizontalScore > score) {
        score = horizontalScore;
        direction = 3;
        gapLength = horizontalLength;
      }
      if (score <= 0) {
        score = 0;
        direction = 0;
        gapLength = 0;
      }

      scores[index] = score;
      directions[index] = direction;
      gapLengths[index] = gapLength;

      if (score > bestScore) {
        bestScore = score;
        bestI = i;
        bestJ = j;
      }
    }
  }

  let i = bestI;
  let j = bestJ;
  const alignedQuery = [];
  const alignedSubject = [];
  const comparison = [];

  while (i > 0 && j > 0) {
    const index = i * width + j;
    const direction = directions[index];
    if (!direction || !scores[index]) break;

    if (direction === 1) {
      const queryCode = query[i - 1];
      const subjectCode = subject[j - 1];
      alignedQuery.push(AMINO_ACIDS[queryCode]);
      alignedSubject.push(AMINO_ACIDS[subjectCode]);
      comparison.push(
        queryCode === subjectCode
          ? "|"
          : BLOSUM62[queryCode][subjectCode] > 0
            ? ":"
            : " ",
      );
      i -= 1;
      j -= 1;
    } else if (direction === 2) {
      const length = gapLengths[index];
      for (let count = 0; count < length; count += 1) {
        alignedQuery.push(AMINO_ACIDS[query[i - 1]]);
        alignedSubject.push("-");
        comparison.push(" ");
        i -= 1;
      }
    } else {
      const length = gapLengths[index];
      for (let count = 0; count < length; count += 1) {
        alignedQuery.push("-");
        alignedSubject.push(AMINO_ACIDS[subject[j - 1]]);
        comparison.push(" ");
        j -= 1;
      }
    }
  }

  alignedQuery.reverse();
  alignedSubject.reverse();
  comparison.reverse();

  const queryText = alignedQuery.join("");
  const subjectText = alignedSubject.join("");
  const comparisonText = comparison.join("");
  const alignmentLength = queryText.length;
  const identical = [...comparisonText].filter((symbol) => symbol === "|").length;
  const queryAligned = [...queryText].filter((aminoAcid) => aminoAcid !== "-").length;
  const subjectAligned = [...subjectText].filter((aminoAcid) => aminoAcid !== "-").length;

  return {
    score: bestScore,
    alignment_length: alignmentLength,
    identical_residues: identical,
    identity: alignmentLength ? (identical / alignmentLength) * 100 : 0,
    query_coverage: (queryAligned / queryLength) * 100,
    subject_coverage: (subjectAligned / subjectLength) * 100,
    query_start: i + 1,
    query_end: bestI,
    subject_start: j + 1,
    subject_end: bestJ,
    aligned_query: queryText,
    comparison: comparisonText,
    aligned_subject: subjectText,
  };
}

async function search(queryText, queryName) {
  if (
    typeof queryText !== "string" ||
    queryText.length < 20 ||
    queryText.length > 5000 ||
    !/^[ACDEFGHIKLMNPQRSTVWYBZJUO]+$/.test(queryText)
  ) {
    throw new Error("The Worker rejected an invalid amino acid query.");
  }
  const database = await loadDatabase();
  const query = encodeSequence(queryText);
  const { wasm, sequences, offsets, metadata, version } = database;
  const queryPointer = wasm.get_query_buffer();
  const subjectPointer = wasm.get_subject_buffer();
  const memory = new Uint8Array(wasm.memory.buffer);
  memory.set(query, queryPointer);

  report("search", `Searching 0 / ${metadata.length} OG representatives`, 0, metadata.length);
  const scores = [];

  for (let index = 0; index < metadata.length; index += 1) {
    const start = offsets[index * 3];
    const length = offsets[index * 3 + 1];
    const subject = sequences.subarray(start, start + length);
    memory.set(subject, subjectPointer);
    scores.push({
      index,
      score: wasm.score_pair(query.length, subject.length),
      normalized_score: 0,
    });
    scores[index].normalized_score =
      scores[index].score / Math.min(query.length, subject.length);

    if (index % 50 === 0 || index + 1 === metadata.length) {
      report(
        "search",
        `Searching ${index + 1} / ${metadata.length} OG representatives`,
        index + 1,
        metadata.length,
      );
    }
  }

  scores.sort((a, b) => b.score - a.score || b.normalized_score - a.normalized_score);
  const top = scores.slice(0, 100);
  report("alignment", "Reconstructing alignments for the top candidates…", 0, top.length);

  const results = [];
  for (let rank = 0; rank < top.length; rank += 1) {
    const hit = top[rank];
    const start = offsets[hit.index * 3];
    const length = offsets[hit.index * 3 + 1];
    const subject = sequences.subarray(start, start + length);
    const alignment = tracebackAlignment(query, subject);

    results.push({
      rank: rank + 1,
      ...metadata[hit.index],
      ...alignment,
      normalized_score: hit.normalized_score,
    });

    if (rank % 5 === 0 || rank + 1 === top.length) {
      report(
        "alignment",
        `Aligning candidate ${rank + 1} / ${top.length}`,
        rank + 1,
        top.length,
      );
    }
  }

  report("format", "Formatting results…");
  self.postMessage({
    type: "results",
    query: { name: queryName, sequence: queryText, length: query.length },
    results,
    version,
    searched_at: new Date().toISOString(),
  });
}

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "search") return;
  try {
    const safeName =
      typeof event.data.name === "string"
        ? event.data.name
            .replace(/[\u0000-\u001F\u007F<>]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 120) || "query"
        : "query";
    await search(event.data.sequence, safeName);
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
