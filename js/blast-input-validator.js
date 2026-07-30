"use strict";

(() => {
  const MIN_SEQUENCE_LENGTH = 20;
  const MAX_SEQUENCE_LENGTH = 5000;
  const MAX_RAW_INPUT_LENGTH = 100000;
  const MAX_QUERY_NAME_LENGTH = 120;
  const NUCLEOTIDE_FRACTION_THRESHOLD = 0.98;
  const AMINO_ACID_PATTERN = /^[ACDEFGHIKLMNPQRSTVWYBZJUO]+$/;
  const REMOVABLE_SEQUENCE_CHARACTERS = /[\s\d*\-]/g;
  const FORBIDDEN_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
  const IUPAC_NUCLEOTIDES = new Set([..."ACGTURYSWKMBDHVN"]);

  function sanitizeQueryName(value) {
    const normalized = String(value ?? "")
      .normalize("NFKC")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_QUERY_NAME_LENGTH);
    return normalized || "query";
  }

  function nucleotideFraction(sequence) {
    let nucleotideCharacters = 0;
    for (const character of sequence) {
      if (IUPAC_NUCLEOTIDES.has(character)) nucleotideCharacters += 1;
    }
    return nucleotideCharacters / sequence.length;
  }

  function neutralizeSpreadsheetCell(value) {
    let text = String(value ?? "").replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      " ",
    );
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return text;
  }

  function status(result, raw) {
    if (result.valid) return `${result.length.toLocaleString()} aa`;
    if (!String(raw ?? "").trim()) return "No sequence";

    const message = result.message || "";
    if (message.includes("nucleotide sequence")) {
      const percent = Number.isFinite(result.nucleotideFraction)
        ? ` (${Math.round(result.nucleotideFraction * 100)}% nucleotide symbols)`
        : "";
      return `Looks like DNA/RNA${percent}`;
    }
    if (message.startsWith("Unsupported sequence character")) {
      const invalid = message.split(":").slice(1).join(":").trim();
      return `Invalid character${invalid.includes(" ") ? "s" : ""}: ${invalid}`;
    }
    if (message.startsWith("Multiple FASTA entries")) return "Multiple FASTA entries";
    if (message.startsWith("Multiple plain-sequence blocks")) return "Multiple sequence blocks";
    if (message.startsWith("A FASTA header was found")) return "FASTA header after sequence";
    if (message.includes("too short")) {
      const length = message.match(/\((\d+ aa)\)/)?.[1];
      return length ? `${length} · too short` : "Sequence too short";
    }
    if (message.includes("too long")) return "Sequence too long";
    if (message.includes("too large")) return "Pasted input too large";
    if (message.includes("control characters")) return "Invalid control character";
    if (message.includes("No amino acid residues")) return "No amino acid residues";
    return "Invalid sequence";
  }

  function parse(raw, quiet = false) {
    if (typeof raw !== "string") {
      return { valid: false, message: quiet ? "" : "The query must be text." };
    }
    if (raw.length > MAX_RAW_INPUT_LENGTH) {
      return {
        valid: false,
        message: `The pasted input is too large. Submit one protein of at most ${MAX_SEQUENCE_LENGTH.toLocaleString()} aa.`,
      };
    }
    if (FORBIDDEN_CONTROL_CHARACTERS.test(raw)) {
      return {
        valid: false,
        message: "The input contains unsupported control characters.",
      };
    }

    const normalized = raw.replace(/\r\n?/g, "\n").trim();
    if (!normalized) {
      return { valid: false, message: quiet ? "" : "Enter an amino acid sequence." };
    }

    const lines = normalized.split("\n");
    const headerIndexes = [];
    lines.forEach((line, index) => {
      if (line.trimStart().startsWith(">")) headerIndexes.push(index);
    });

    if (headerIndexes.length > 1) {
      return {
        valid: false,
        message: `Multiple FASTA entries were detected (${headerIndexes.length}). Submit exactly one protein sequence.`,
      };
    }
    if (headerIndexes.length === 1 && headerIndexes[0] !== 0) {
      return {
        valid: false,
        message: "A FASTA header was found after sequence data. Submit exactly one FASTA entry.",
      };
    }

    const hasHeader = headerIndexes.length === 1;
    if (!hasHeader) {
      const plainSequenceBlocks = normalized
        .split(/\n\s*\n/)
        .filter((block) => block.trim());
      if (plainSequenceBlocks.length > 1) {
        return {
          valid: false,
          message:
            "Multiple plain-sequence blocks were detected. Submit exactly one protein sequence.",
        };
      }
    }
    const name = hasHeader
      ? sanitizeQueryName(lines[0].trimStart().slice(1))
      : "query";
    const sequenceSource = hasHeader ? lines.slice(1).join("") : normalized;
    const sequence = sequenceSource
      .replace(REMOVABLE_SEQUENCE_CHARACTERS, "")
      .toUpperCase();

    if (!sequence) {
      return { valid: false, message: "No amino acid residues were found." };
    }
    if (!AMINO_ACID_PATTERN.test(sequence)) {
      const invalid = [
        ...new Set(sequence.replace(/[ACDEFGHIKLMNPQRSTVWYBZJUO]/g, "")),
      ].slice(0, 12).join(" ");
      return {
        valid: false,
        message: `Unsupported sequence character${invalid.length > 1 ? "s" : ""}: ${invalid}`,
      };
    }
    if (sequence.length < MIN_SEQUENCE_LENGTH) {
      return {
        valid: false,
        message: `The sequence is too short (${sequence.length} aa). Minimum: ${MIN_SEQUENCE_LENGTH} aa.`,
      };
    }
    if (sequence.length > MAX_SEQUENCE_LENGTH) {
      return {
        valid: false,
        message: `The sequence is too long (${sequence.length.toLocaleString()} aa). Maximum: ${MAX_SEQUENCE_LENGTH.toLocaleString()} aa.`,
      };
    }
    const detectedNucleotideFraction = nucleotideFraction(sequence);
    if (detectedNucleotideFraction >= NUCLEOTIDE_FRACTION_THRESHOLD) {
      return {
        valid: false,
        nucleotideFraction: detectedNucleotideFraction,
        message:
          "The input appears to be a nucleotide sequence (FNA/DNA/RNA). This search accepts amino acid sequences only.",
      };
    }

    return { valid: true, name, sequence, length: sequence.length };
  }

  globalThis.SAR11BlastInput = Object.freeze({
    parse,
    status,
    sanitizeQueryName,
    neutralizeSpreadsheetCell,
    limits: Object.freeze({
      minSequenceLength: MIN_SEQUENCE_LENGTH,
      maxSequenceLength: MAX_SEQUENCE_LENGTH,
      maxRawInputLength: MAX_RAW_INPUT_LENGTH,
      nucleotideFractionThreshold: NUCLEOTIDE_FRACTION_THRESHOLD,
    }),
  });
})();
