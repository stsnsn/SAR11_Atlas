#!/usr/bin/env node

import assert from "node:assert/strict";
import "../js/blast-input-validator.js";

const { parse, status, neutralizeSpreadsheetCell } = globalThis.SAR11BlastInput;
const protein =
  "MKHRFNNLPSQLSGGEQQRVAIARAIAMKPELILADEPTGNLDTENSIMIANILFKYVKEEGSSLIMVTHDPKLADKAKRKIKIKDGKIK";

function accepts(label, input) {
  const result = parse(input);
  assert.equal(result.valid, true, `${label}: ${result.message}`);
  return result;
}

function rejects(label, input, expectedMessage) {
  const result = parse(input);
  assert.equal(result.valid, false, `${label}: unexpectedly accepted`);
  assert.match(result.message, expectedMessage, `${label}: unexpected error message`);
}

assert.equal(accepts("plain protein", protein).length, protein.length);
assert.equal(accepts("FASTA protein", `>safe_query\n${protein}`).name, "safe_query");
assert.equal(
  accepts("lowercase and removable formatting", `>formatted\n${protein.toLowerCase().match(/.{1,15}/g).join(" 1\n")}`).sequence,
  protein,
);

rejects(
  "multiple FASTA entries",
  `>first\n${protein}\n>second\n${protein}`,
  /Multiple FASTA entries/,
);
rejects(
  "header after sequence",
  `${protein}\n>second\n${protein}`,
  /FASTA header was found after sequence data/,
);
rejects(
  "multiple plain-sequence blocks",
  `${protein}\n\n${protein}`,
  /Multiple plain-sequence blocks/,
);
rejects(
  "standard DNA",
  ">dna\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG",
  /nucleotide sequence/,
);
rejects(
  "ambiguous IUPAC DNA",
  ">ambiguous_dna\nACGTRYSWKMBDHVNACGTRYSWKMBDHVNACGTRYSWKM",
  /nucleotide sequence/,
);
rejects(
  "RNA with uracil",
  ">rna\nAUGCGUACGUAGCUAGCUAGCUAGCUAGCUAGCUAGCUAG",
  /nucleotide sequence/,
);
rejects("short protein", ">short\nMPEPTIDE", /too short/);
rejects("too-long protein", `>long\n${"E".repeat(5001)}`, /too long/);
rejects(
  "HTML/JavaScript in sequence body",
  `>query\n${protein}<script>alert(1)</script>`,
  /Unsupported sequence character/,
);
rejects(
  "event-handler payload in sequence body",
  `>query\n${protein}\" onerror=\"alert(1)`,
  /Unsupported sequence character/,
);
rejects("control character", `>query\u0000\n${protein}`, /control characters/);
rejects("oversized pasted input", "E".repeat(100001), /too large/);

const headerInjection = accepts(
  "HTML in FASTA header remains inert",
  `><img src=x onerror=alert(1)>\n${protein}`,
);
assert.equal(/[<>]/.test(headerInjection.name), false);
assert.equal(
  neutralizeSpreadsheetCell("=WEBSERVICE(\"https://example.test\")"),
  "'=WEBSERVICE(\"https://example.test\")",
);
assert.equal(neutralizeSpreadsheetCell("+CMD"), "'+CMD");
assert.equal(neutralizeSpreadsheetCell("-2+3"), "'-2+3");
assert.equal(neutralizeSpreadsheetCell("@SUM(A1:A2)"), "'@SUM(A1:A2)");
assert.equal(neutralizeSpreadsheetCell("OG0000001"), "OG0000001");
assert.equal(
  globalThis.SAR11BlastInput.limits.nucleotideFractionThreshold,
  0.99,
);
assert.equal(status(parse(""), ""), "No sequence");
assert.match(
  status(parse(">dna\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG"), "DNA"),
  /^Looks like DNA\/RNA \(100% nucleotide symbols\)$/,
);
assert.equal(
  status(parse(`>query\n${protein}+`), `${protein}+`),
  "Invalid character: +",
);
assert.equal(
  status(parse(`>one\n${protein}\n>two\n${protein}`), "multiple"),
  "Multiple FASTA entries",
);

console.log("BLAST input validation tests passed.");
