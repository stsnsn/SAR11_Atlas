(function () {
    "use strict";

    const DATA_PATHS = {
        genomes: "../data/overview/genome_summary.tsv",
        annotations: "../data/overview/annotation_intersections.tsv",
        lengths: "../data/overview/protein_length_bins.tsv",
        orthogroups: "../data/overview/orthogroup_summary.tsv"
    };

    const TYPE_COLORS = {
        MAG: "#d84b4b",
        SAG: "#3b82f6",
        Isolate: "#f2c94c",
        Unknown: "#9aa9af"
    };

    const state = {
        genomes: [],
        annotations: [],
        lengths: [],
        orthogroups: [],
        genomeType: "All",
        subclade: "All",
        annotation: "All"
    };

    const $ = (id) => document.getElementById(id);
    const numberFormat = new Intl.NumberFormat("en-US");
    const compactFormat = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1
    });
    const statAnimations = new WeakMap();

    function loadTsv(url) {
        return fetch(url).then((response) => {
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.text();
        }).then((text) => Papa.parse(text, {
            header: true,
            delimiter: "\t",
            dynamicTyping: true,
            skipEmptyLines: true
        }).data);
    }

    function cleanCategory(value) {
        if (value === null || value === undefined || value === "" || value === "NA") {
            return "Unknown";
        }
        return String(value);
    }

    function updateStatValue(id, value, options = {}) {
        const element = $(id);
        const numericValue = Number(value);
        const decimals = options.decimals || 0;
        const suffix = options.suffix || "";
        const existingAnimation = statAnimations.get(element);

        if (existingAnimation) cancelAnimationFrame(existingAnimation);
        if (!Number.isFinite(numericValue)) {
            element.textContent = "–";
            return;
        }

        const valueFormat = decimals
            ? new Intl.NumberFormat("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            })
            : numberFormat;
        const formatValue = (current) => `${valueFormat.format(current)}${suffix}`;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const currentValue = Number(element.textContent.replace(/[^0-9.-]/g, ""));
        const startValue = Number.isFinite(currentValue) ? currentValue : 0;

        if (reducedMotion || startValue === numericValue) {
            element.textContent = formatValue(numericValue);
            return;
        }

        const startTime = performance.now();
        const duration = 360;
        const animate = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = formatValue(startValue + (numericValue - startValue) * eased);

            if (progress < 1) {
                statAnimations.set(element, requestAnimationFrame(animate));
            } else {
                statAnimations.delete(element);
            }
        };

        statAnimations.set(element, requestAnimationFrame(animate));
    }

    function isTrue(value) {
        return value === true || String(value).toUpperCase() === "TRUE";
    }

    function matchesGlobalFilters(row) {
        const type = cleanCategory(row.genome_type);
        const subclade = cleanCategory(row.subclade);
        return (state.genomeType === "All" || type === state.genomeType) &&
            (state.subclade === "All" || subclade === state.subclade);
    }

    function uniqueSorted(values) {
        return Array.from(new Set(values.map(cleanCategory))).sort((a, b) => {
            if (a === "Unknown") return 1;
            if (b === "Unknown") return -1;
            return a.localeCompare(b, undefined, { numeric: true });
        });
    }

    function addOptions(select, values) {
        values.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function chartTheme() {
        const dark = document.body.classList.contains("dark-mode");
        return {
            text: dark ? "#d7ebf1" : "#45616d",
            title: dark ? "#f0fbff" : "#143f50",
            grid: dark ? "rgba(154, 195, 208, 0.14)" : "rgba(11, 61, 87, 0.10)",
            zero: dark ? "rgba(154, 195, 208, 0.22)" : "rgba(11, 61, 87, 0.18)"
        };
    }

    function baseLayout() {
        const theme = chartTheme();
        return {
            autosize: true,
            margin: { l: 58, r: 20, t: 20, b: 52 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { family: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", color: theme.text },
            hoverlabel: { bgcolor: darkBackground(), bordercolor: theme.zero, font: { color: theme.title } }
        };
    }

    function darkBackground() {
        return document.body.classList.contains("dark-mode") ? "#102733" : "#ffffff";
    }

    function plotConfig() {
        return { responsive: true, displayModeBar: false, scrollZoom: false };
    }

    function filteredGenomes() {
        return state.genomes.filter(matchesGlobalFilters);
    }

    function filteredAnnotations() {
        return state.annotations.filter(matchesGlobalFilters);
    }

    function filteredLengths() {
        return state.lengths.filter((row) => {
            return matchesGlobalFilters(row) &&
                (state.annotation === "All" || row.annotation_combination === state.annotation);
        });
    }

    function selectedOrthogroupSummary() {
        return state.orthogroups.find((row) => {
            return cleanCategory(row.genome_type) === state.genomeType &&
                cleanCategory(row.subclade) === state.subclade;
        });
    }

    function renderStats() {
        const genomes = filteredGenomes();
        const annotations = filteredAnnotations();
        const proteinCount = annotations.reduce((sum, row) => sum + Number(row.n_proteins || 0), 0);
        const annotatedCount = annotations.reduce((sum, row) => {
            return sum + (row.annotation_combination === "No annotation" ? 0 : Number(row.n_proteins || 0));
        }, 0);
        const subclades = new Set(genomes.map((row) => cleanCategory(row.subclade)).filter((value) => value !== "Unknown"));
        const orthogroupSummary = selectedOrthogroupSummary();

        updateStatValue("statGenomes", genomes.length);
        updateStatValue("statProteins", proteinCount);
        updateStatValue("statSubclades", subclades.size);
        updateStatValue("statAnnotated", proteinCount ? annotatedCount / proteinCount * 100 : NaN, {
            decimals: 1,
            suffix: "%"
        });
        updateStatValue(
            "statOrthogroups",
            orthogroupSummary ? Number(orthogroupSummary.n_orthogroups || 0) : NaN
        );
        $("statOrthogroupCoverage").hidden = state.genomeType !== "All" || state.subclade !== "All";
    }

    function renderGenomeTypes() {
        const counts = new Map();
        filteredGenomes().forEach((row) => {
            const type = cleanCategory(row.genome_type);
            counts.set(type, (counts.get(type) || 0) + 1);
        });

        const preferredOrder = ["MAG", "SAG", "Isolate", "Unknown"];
        const labels = preferredOrder.filter((label) => counts.has(label));
        const values = labels.map((label) => counts.get(label));
        const colors = labels.map((label) => TYPE_COLORS[label] || TYPE_COLORS.Unknown);
        const total = values.reduce((sum, value) => sum + value, 0);
        $("genomeTypeMeta").textContent = `${numberFormat.format(total)} genomes`;

        const layout = baseLayout();
        Object.assign(layout, {
            margin: { l: 12, r: 12, t: 8, b: 34 },
            showlegend: true,
            legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.05, font: { size: 11 } },
            annotations: [{
                text: `<b>${numberFormat.format(total)}</b><br><span style="font-size:11px">genomes</span>`,
                x: 0.5,
                y: 0.52,
                showarrow: false,
                font: { color: chartTheme().title, size: 19 }
            }]
        });

        Plotly.react("genomeTypeChart", [{
            type: "pie",
            labels,
            values,
            hole: 0.64,
            sort: false,
            direction: "clockwise",
            marker: { colors, line: { color: darkBackground(), width: 3 } },
            textinfo: "none",
            hovertemplate: "%{label}<br><b>%{value}</b> genomes · %{percent}<extra></extra>"
        }], layout, plotConfig());
    }

    function aggregateAnnotationCombinations() {
        const combinations = new Map();
        filteredAnnotations().forEach((row) => {
            const key = row.annotation_combination;
            if (!combinations.has(key)) {
                combinations.set(key, {
                    label: key,
                    COG: isTrue(row.COG_hit),
                    KO: isTrue(row.KO_hit),
                    Pfam: isTrue(row.Pfam_hit),
                    count: 0
                });
            }
            combinations.get(key).count += Number(row.n_proteins || 0);
        });
        return Array.from(combinations.values()).sort((a, b) => b.count - a.count);
    }

    function svgElement(name, attributes, text) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.entries(attributes || {}).forEach(([key, value]) => element.setAttribute(key, value));
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function renderUpSet() {
        const container = $("annotationUpSet");
        container.replaceChildren();
        const data = aggregateAnnotationCombinations();
        if (!data.length) {
            container.textContent = "No proteins match the selected filters.";
            return;
        }

        const width = Math.max(680, container.clientWidth || 680);
        const height = 320;
        const left = 88;
        const right = 18;
        const barTop = 20;
        const barBottom = 178;
        const matrixTop = 225;
        const rowGap = 30;
        const plotWidth = width - left - right;
        const columnWidth = plotWidth / data.length;
        const maxCount = Math.max(...data.map((item) => item.count), 1);
        const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
        svg.appendChild(svgElement("title", {}, "Annotation overlap across COG, KO, and Pfam"));

        [0, 0.5, 1].forEach((fraction) => {
            const y = barBottom - fraction * (barBottom - barTop);
            svg.appendChild(svgElement("line", { x1: left, x2: width - right, y1: y, y2: y, class: "atlas-upset__guide" }));
            svg.appendChild(svgElement("text", { x: left - 10, y: y + 4, "text-anchor": "end" }, compactFormat.format(Math.round(maxCount * fraction))));
        });

        ["COG", "KO", "Pfam"].forEach((setName, rowIndex) => {
            const y = matrixTop + rowIndex * rowGap;
            svg.appendChild(svgElement("text", { x: left - 18, y: y + 4, "text-anchor": "end" }, setName));
        });

        data.forEach((item, index) => {
            const centerX = left + columnWidth * index + columnWidth / 2;
            const barWidth = Math.min(42, columnWidth * 0.62);
            const barHeight = item.count / maxCount * (barBottom - barTop);
            const bar = svgElement("rect", {
                x: centerX - barWidth / 2,
                y: barBottom - barHeight,
                width: barWidth,
                height: Math.max(barHeight, 1),
                rx: 3,
                class: item.label === "No annotation" ? "atlas-upset__bar atlas-upset__bar--none" : "atlas-upset__bar"
            });
            bar.appendChild(svgElement("title", {}, `${item.label}: ${numberFormat.format(item.count)} proteins`));
            svg.appendChild(bar);
            svg.appendChild(svgElement("text", {
                x: centerX,
                y: Math.max(barTop + 10, barBottom - barHeight - 7),
                "text-anchor": "middle",
                class: "atlas-upset__count"
            }, compactFormat.format(item.count)));

            const activeRows = [item.COG, item.KO, item.Pfam]
                .map((active, rowIndex) => active ? rowIndex : -1)
                .filter((rowIndex) => rowIndex >= 0);
            if (activeRows.length > 1) {
                svg.appendChild(svgElement("line", {
                    x1: centerX,
                    x2: centerX,
                    y1: matrixTop + activeRows[0] * rowGap,
                    y2: matrixTop + activeRows[activeRows.length - 1] * rowGap,
                    class: "atlas-upset__connector"
                }));
            }
            [item.COG, item.KO, item.Pfam].forEach((active, rowIndex) => {
                const circle = svgElement("circle", {
                    cx: centerX,
                    cy: matrixTop + rowIndex * rowGap,
                    r: active ? 6 : 4.5,
                    class: active ? "atlas-upset__dot" : "atlas-upset__dot atlas-upset__dot--off"
                });
                circle.appendChild(svgElement("title", {}, item.label));
                svg.appendChild(circle);
            });
        });

        container.appendChild(svg);
    }

    function renderGenomeScatter() {
        const genomes = filteredGenomes();
        const grouped = new Map();
        genomes.forEach((row) => {
            const type = cleanCategory(row.genome_type);
            if (!grouped.has(type)) grouped.set(type, []);
            grouped.get(type).push(row);
        });

        const maxProteins = Math.max(...genomes.map((row) => Number(row.n_proteins || 0)), 1);
        const traces = Array.from(grouped.entries()).map(([type, rows]) => ({
            type: "scatter",
            mode: "markers",
            name: type,
            x: rows.map((row) => Number(row.genome_size_bp) / 1e6),
            y: rows.map((row) => Number(row.gc_percent)),
            text: rows.map((row) => [
                `<b>${row.genome_id}</b>`,
                `${cleanCategory(row.subclade)} · ${type}`,
                `${(Number(row.genome_size_bp) / 1e6).toFixed(3)} Mbp · ${Number(row.gc_percent).toFixed(2)}% GC`,
                `${numberFormat.format(row.n_proteins)} proteins`,
                `${Number(row.completeness).toFixed(1)}% complete · ${Number(row.contamination).toFixed(2)}% contamination`
            ].join("<br>")),
            hovertemplate: "%{text}<extra></extra>",
            marker: {
                color: TYPE_COLORS[type] || TYPE_COLORS.Unknown,
                opacity: 0.76,
                size: rows.map((row) => 7 + Number(row.n_proteins || 0) / maxProteins * 8),
                line: { color: darkBackground(), width: 0.8 }
            }
        }));

        const theme = chartTheme();
        const layout = baseLayout();
        Object.assign(layout, {
            margin: { l: 60, r: 18, t: 12, b: 55 },
            legend: { orientation: "h", x: 0, y: 1.08, font: { size: 11 } },
            xaxis: {
                title: { text: "Genome size (Mbp)", standoff: 12 },
                gridcolor: theme.grid,
                zerolinecolor: theme.zero,
                fixedrange: true
            },
            yaxis: {
                title: { text: "GC content (%)", standoff: 8 },
                gridcolor: theme.grid,
                zerolinecolor: theme.zero,
                fixedrange: true
            },
            hovermode: "closest"
        });
        Plotly.react("genomeScatter", traces, layout, plotConfig());
    }

    function renderProteinLengths() {
        const rows = filteredLengths();
        const bins = new Map();
        rows.forEach((row) => {
            const start = Number(row.length_bin_start);
            bins.set(start, (bins.get(start) || 0) + Number(row.n_proteins || 0));
        });
        const starts = Array.from(bins.keys()).sort((a, b) => a - b);
        const values = starts.map((start) => bins.get(start));
        const labels = starts.map((start) => start >= 2000 ? "≥2,000 aa" : `${start}–${start + 25} aa`);
        const theme = chartTheme();
        const layout = baseLayout();
        Object.assign(layout, {
            bargap: 0.04,
            margin: { l: 64, r: 18, t: 12, b: 55 },
            xaxis: {
                title: { text: "Protein length (aa)", standoff: 12 },
                range: [-10, 2050],
                gridcolor: "rgba(0,0,0,0)",
                zerolinecolor: theme.zero,
                fixedrange: true
            },
            yaxis: {
                title: { text: "Proteins", standoff: 8 },
                gridcolor: theme.grid,
                zerolinecolor: theme.zero,
                rangemode: "tozero",
                fixedrange: true
            }
        });

        Plotly.react("proteinLengthChart", [{
            type: "bar",
            x: starts.map((start) => start + 12.5),
            y: values,
            width: starts.map(() => 24),
            marker: { color: "#159a9c", line: { width: 0 } },
            customdata: labels,
            hovertemplate: "%{customdata}<br><b>%{y:,}</b> proteins<extra></extra>"
        }], layout, plotConfig());
    }

    function renderAll() {
        renderStats();
        renderGenomeTypes();
        renderUpSet();
        renderGenomeScatter();
        renderProteinLengths();
    }

    function initializeFilters() {
        addOptions($("filterGenomeType"), uniqueSorted(state.genomes.map((row) => row.genome_type)));
        addOptions($("filterSubclade"), uniqueSorted(state.genomes.map((row) => row.subclade)));
        addOptions($("filterAnnotation"), uniqueSorted(state.annotations.map((row) => row.annotation_combination)));

        $("filterGenomeType").addEventListener("change", (event) => {
            state.genomeType = event.target.value;
            renderAll();
        });
        $("filterSubclade").addEventListener("change", (event) => {
            state.subclade = event.target.value;
            renderAll();
        });
        $("filterAnnotation").addEventListener("change", (event) => {
            state.annotation = event.target.value;
            renderProteinLengths();
        });
        $("resetOverviewFilters").addEventListener("click", () => {
            state.genomeType = "All";
            state.subclade = "All";
            state.annotation = "All";
            $("filterGenomeType").value = "All";
            $("filterSubclade").value = "All";
            $("filterAnnotation").value = "All";
            renderAll();
        });
    }

    function initialize() {
        window.addEventListener("sar11:themechange", () => {
            if (state.genomes.length) renderAll();
        });
        Promise.all([
            loadTsv(DATA_PATHS.genomes),
            loadTsv(DATA_PATHS.annotations),
            loadTsv(DATA_PATHS.lengths),
            loadTsv(DATA_PATHS.orthogroups)
        ]).then(([genomes, annotations, lengths, orthogroups]) => {
            state.genomes = genomes;
            state.annotations = annotations;
            state.lengths = lengths;
            state.orthogroups = orthogroups;
            initializeFilters();
            $("overviewLoading").hidden = true;
            $("overviewDashboard").hidden = false;
            renderAll();
        }).catch((error) => {
            console.error(error);
            $("overviewLoading").hidden = true;
            $("overviewError").hidden = false;
        });
    }

    document.addEventListener("DOMContentLoaded", initialize);
}());
