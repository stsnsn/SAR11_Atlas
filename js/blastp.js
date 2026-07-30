"use strict";

(() => {
  const SAMPLE_SEQUENCE =
    "MKHRFNNLPSQLSGGEQQRVAIARAIAMKPELILADEPTGNLDTENSIMIANILFKYVKEEGSSLIMVTHDPKLADKAKRKIKIKDGKIK";

  const elements = {};
  let worker = null;
  let searchData = null;
  let activeAlignmentRank = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function parseInput(raw, quiet = false) {
    return globalThis.SAR11BlastInput.parse(raw, quiet);
  }

  function setInputMessage(message) {
    elements.inputMessage.textContent = message;
    elements.inputMessage.hidden = !message;
  }

  function updateInputState() {
    const parsed = parseInput(elements.query.value, true);
    elements.search.disabled = !parsed.valid || Boolean(worker);
    const inputStatus = globalThis.SAR11BlastInput.status(parsed, elements.query.value);
    elements.sequenceSummary.textContent = inputStatus;
    elements.sequenceSummary.title = parsed.valid
      ? `Valid amino acid sequence: ${parsed.length.toLocaleString()} aa`
      : parsed.message || "Enter one amino acid sequence.";
    elements.sequenceSummary.setAttribute(
      "aria-label",
      parsed.valid ? `Valid sequence, ${parsed.length} amino acids` : inputStatus,
    );
    if (elements.inputMessage.hidden === false) setInputMessage("");
  }

  function setSearching(searching) {
    elements.search.disabled = searching || !parseInput(elements.query.value, true).valid;
    elements.search.textContent = searching ? "Searching…" : "Search";
    elements.sample.disabled = searching;
    elements.clear.disabled = searching;
    elements.query.disabled = searching;
    elements.cancel.hidden = !searching;
  }

  function setProgress(stage, message, completed = 0, total = 0) {
    const labels = {
      database: "Loading database",
      wasm: "Initializing WebAssembly",
      search: "Searching OG representatives",
      alignment: "Calculating alignments",
      format: "Preparing results",
    };
    const fixedProgress = { database: 5, wasm: 12, format: 99 };
    let percent = fixedProgress[stage] ?? 0;
    if (total && stage === "search") percent = 15 + Math.round((completed / total) * 60);
    if (total && stage === "alignment") percent = 75 + Math.round((completed / total) * 23);

    elements.progressPanel.hidden = false;
    elements.progressHeading.textContent = labels[stage] ?? "Searching";
    elements.progressMessage.textContent = message;
    elements.progressPercent.textContent = `${Math.min(percent, 100)}%`;
    elements.progressBar.style.width = `${Math.min(percent, 100)}%`;
  }

  function formatPercent(value) {
    return `${Number(value).toFixed(1)}%`;
  }

  function makeCell(text, className = "") {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  }

  function renderResults() {
    if (!searchData) return;
    const limit = Number(elements.resultLimit.value);
    elements.resultsBody.replaceChildren();

    for (const result of searchData.results.slice(0, limit)) {
      const row = document.createElement("tr");
      row.dataset.rank = result.rank;
      row.append(makeCell(String(result.rank), "blast-rank"));

      const ogCell = document.createElement("td");
      const ogLink = document.createElement("a");
      ogLink.href = `./SAR11_OG_info.html?ogInput=${encodeURIComponent(result.og_id)}`;
      ogLink.target = "_blank";
      ogLink.rel = "noopener";
      ogLink.textContent = result.og_id;
      ogCell.append(ogLink);
      row.append(ogCell);

      const annotationCell = makeCell(result.annotation, "blast-annotation");
      if (result.ko || result.cog || result.pfam) {
        const codes = document.createElement("small");
        codes.className = "blast-annotation-codes";
        for (const code of [result.ko, result.cog, result.pfam].filter(Boolean)) {
          const codeElement = document.createElement("span");
          codeElement.className = "blast-annotation-code";
          codeElement.textContent = code;
          codes.append(codeElement);
        }
        annotationCell.append(document.createElement("br"), codes);
      }
      row.append(annotationCell);
      row.append(makeCell(String(result.score), "blast-number"));
      row.append(makeCell(formatPercent(result.identity), "blast-number"));
      row.append(makeCell(String(result.alignment_length), "blast-number"));
      row.append(makeCell(formatPercent(result.query_coverage), "blast-number"));
      row.append(makeCell(formatPercent(result.subject_coverage), "blast-number"));
      row.append(makeCell(String(result.sequence_length), "blast-number"));

      const actionCell = document.createElement("td");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-sm btn-link blast-detail-button";
      button.textContent = activeAlignmentRank === result.rank ? "Hide" : "Alignment";
      button.setAttribute("aria-expanded", String(activeAlignmentRank === result.rank));
      button.addEventListener("click", () => toggleAlignment(result.rank));
      actionCell.append(button);
      row.append(actionCell);
      elements.resultsBody.append(row);
    }
  }

  function alignmentText(result, width = 60) {
    const blocks = [];
    let queryPosition = result.query_start;
    let subjectPosition = result.subject_start;

    for (let start = 0; start < result.aligned_query.length; start += width) {
      const queryPart = result.aligned_query.slice(start, start + width);
      const comparisonPart = result.comparison.slice(start, start + width);
      const subjectPart = result.aligned_subject.slice(start, start + width);
      const queryResidues = queryPart.replace(/-/g, "").length;
      const subjectResidues = subjectPart.replace(/-/g, "").length;
      const queryEnd = queryPosition + queryResidues - 1;
      const subjectEnd = subjectPosition + subjectResidues - 1;

      blocks.push(
        `Query  ${String(queryPosition).padStart(5)}  ${queryPart}  ${String(queryEnd).padEnd(5)}`,
        `              ${comparisonPart}`,
        `Target ${String(subjectPosition).padStart(5)}  ${subjectPart}  ${String(subjectEnd).padEnd(5)}`,
        "",
      );
      queryPosition = queryEnd + 1;
      subjectPosition = subjectEnd + 1;
    }
    return blocks.join("\n");
  }

  function toggleAlignment(rank) {
    if (activeAlignmentRank === rank) {
      activeAlignmentRank = null;
      elements.alignmentDetails.hidden = true;
      elements.alignmentDetails.replaceChildren();
      renderResults();
      return;
    }

    const result = searchData.results.find((candidate) => candidate.rank === rank);
    if (!result) return;
    activeAlignmentRank = rank;

    const heading = document.createElement("div");
    heading.className = "blast-alignment-heading";
    const title = document.createElement("h3");
    title.textContent = `${result.og_id} · ${result.sequence_id}`;
    const metrics = document.createElement("p");
    metrics.textContent =
      `Score ${result.score} · ${formatPercent(result.identity)} identity · ` +
      `Query ${result.query_start}–${result.query_end} · ` +
      `Target ${result.subject_start}–${result.subject_end}`;
    heading.append(title, metrics);

    const pre = document.createElement("pre");
    pre.textContent = alignmentText(result);
    elements.alignmentDetails.replaceChildren(heading, pre);
    elements.alignmentDetails.hidden = false;
    elements.alignmentDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
    renderResults();
  }

  function interpretResults(results) {
    if (!results.length) return "No candidates were returned.";
    const first = results[0];
    const second = results[1];
    if (second && second.score / first.score >= 0.95) {
      return "The top candidates have similar scores. Consider multiple OGs and inspect their alignments and annotations.";
    }
    if (first.identity < 25 || first.query_coverage < 30) {
      return "The best candidate has weak identity or limited query coverage. Treat this result as exploratory.";
    }
    return "Candidates are ranked by raw local-alignment score. The first result is not an automatic OG assignment.";
  }

  function showResults(data) {
    searchData = data;
    activeAlignmentRank = null;
    elements.progressPanel.hidden = true;
    elements.resultsPanel.hidden = false;
    elements.resultsSummary.textContent =
      `${data.query.name} · ${data.query.length.toLocaleString()} aa · searched against ${data.version.orthogroup_count.toLocaleString()} representatives`;
    elements.interpretation.textContent = interpretResults(data.results);
    renderResults();
    elements.resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function endSearch() {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    setSearching(false);
  }

  function startSearch() {
    const parsed = parseInput(elements.query.value);
    if (!parsed.valid) {
      setInputMessage(parsed.message);
      return;
    }

    setInputMessage("");
    searchData = null;
    activeAlignmentRank = null;
    elements.resultsPanel.hidden = true;
    elements.alignmentDetails.hidden = true;
    setSearching(true);
    setProgress("database", "Loading the local search assets…");

    worker = new Worker("../js/blast-worker.js");
    worker.addEventListener("message", (event) => {
      const data = event.data;
      if (data.type === "progress") {
        setProgress(data.stage, data.message, data.completed, data.total);
      } else if (data.type === "results") {
        showResults(data);
        endSearch();
      } else if (data.type === "error") {
        setInputMessage(`Search failed: ${data.message}`);
        elements.progressPanel.hidden = true;
        endSearch();
      }
    });
    worker.addEventListener("error", () => {
      setInputMessage("The search Worker stopped unexpectedly. Please try again.");
      elements.progressPanel.hidden = true;
      endSearch();
    });
    worker.postMessage({ type: "search", name: parsed.name, sequence: parsed.sequence });
  }

  function cancelSearch() {
    endSearch();
    elements.progressPanel.hidden = true;
    setInputMessage("Search cancelled. You can edit the query and search again.");
  }

  function delimitedResults(delimiter) {
    const headers = [
      "Query_name", "Query_length", "Rank", "OG_ID", "Representative_sequence_ID",
      "Annotation", "Score", "Normalized_score", "Identity_percent", "Alignment_length",
      "Query_coverage_percent", "Subject_coverage_percent", "Subject_length",
      "Database_version", "Search_date", "Scoring_matrix", "Gap_open", "Gap_extension",
    ];
    const escape = (value) => {
      const text = globalThis.SAR11BlastInput.neutralizeSpreadsheetCell(value);
      return delimiter === ","
        ? `"${text.replace(/"/g, '""')}"`
        : text.replace(/\t|\r?\n/g, " ");
    };
    const rows = searchData.results.map((result) => [
      searchData.query.name, searchData.query.length, result.rank, result.og_id,
      result.sequence_id, result.annotation, result.score, result.normalized_score.toFixed(4),
      result.identity.toFixed(2), result.alignment_length, result.query_coverage.toFixed(2),
      result.subject_coverage.toFixed(2), result.sequence_length,
      searchData.version.database_version, searchData.searched_at,
      searchData.version.scoring_matrix, searchData.version.gap_open,
      searchData.version.gap_extension,
    ]);
    return [headers, ...rows].map((row) => row.map(escape).join(delimiter)).join("\n");
  }

  function downloadResults(format) {
    if (!searchData) return;
    const delimiter = format === "csv" ? "," : "\t";
    const blob = new Blob([delimitedResults(delimiter)], {
      type: format === "csv" ? "text/csv;charset=utf-8" : "text/tab-separated-values;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sar11_og_candidates.${format}`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function loadVersion() {
    try {
      const response = await fetch("../data/BLAST/search/database_version.json");
      if (!response.ok) throw new Error();
      const version = await response.json();
      elements.databaseVersion.textContent =
        `${version.database_version} · ${version.orthogroup_count.toLocaleString()} OGs · ` +
        `${version.total_residues.toLocaleString()} aa · ${version.created_at}`;
    } catch {
      elements.databaseVersion.textContent = "Database version information is unavailable.";
    }
  }

  function initialize() {
    Object.assign(elements, {
      query: byId("querySequence"),
      search: byId("searchButton"),
      sample: byId("sampleButton"),
      clear: byId("clearButton"),
      cancel: byId("cancelButton"),
      sequenceSummary: byId("sequenceSummary"),
      inputMessage: byId("inputMessage"),
      progressPanel: byId("progressPanel"),
      progressHeading: byId("progressHeading"),
      progressMessage: byId("progressMessage"),
      progressPercent: byId("progressPercent"),
      progressBar: byId("progressBar"),
      resultsPanel: byId("resultsPanel"),
      resultsSummary: byId("resultsSummary"),
      resultLimit: byId("resultLimit"),
      resultsBody: byId("resultsBody"),
      interpretation: byId("interpretationMessage"),
      alignmentDetails: byId("alignmentDetails"),
      databaseVersion: byId("databaseVersion"),
    });

    elements.query.addEventListener("input", updateInputState);
    elements.search.addEventListener("click", startSearch);
    elements.cancel.addEventListener("click", cancelSearch);
    elements.sample.addEventListener("click", () => {
      elements.query.value = `>sample_OG0000000_representative\n${SAMPLE_SEQUENCE}`;
      setInputMessage("");
      updateInputState();
      elements.query.focus();
    });
    elements.clear.addEventListener("click", () => {
      elements.query.value = "";
      setInputMessage("");
      elements.resultsPanel.hidden = true;
      updateInputState();
      elements.query.focus();
    });
    elements.resultLimit.addEventListener("change", renderResults);
    byId("downloadTsv").addEventListener("click", () => downloadResults("tsv"));
    byId("downloadCsv").addEventListener("click", () => downloadResults("csv"));

    updateInputState();
    loadVersion();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
