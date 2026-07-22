// ダウンロードボタン
document.getElementById('downloadData').addEventListener('click', () => {
    const csvFilePath = `../data/env_corr_542/${document.getElementById('ogInput').value.trim()}.csv`;
    downloadCSV(csvFilePath);
});

// OG入力欄の初期値を設定（空ならOG0000000をセット）
const ogInputEl = document.getElementById('ogInput');
if (ogInputEl && !ogInputEl.value.trim()) {
    ogInputEl.value = 'OG0000000';
}
let lastCorrelationData = null;
let lastUserPlotData = null;
let lastUserParameter = null;
let userPlotRequestId = 0;

// Reset the user plot
const resetUserPlot = () => {
    const userPlotDiv = document.getElementById('userPlot');
    // Plotly keeps state on the graph div. Removing only its children leaves a
    // stale graph object that can make the next Plotly.react() render blank.
    if (userPlotDiv) {
        try { Plotly.purge(userPlotDiv); } catch (error) { /* plot may not exist yet */ }
        userPlotDiv.replaceChildren();
    }
    userPlotRequestId += 1; // Ignore any response started for the previous OG.
    lastUserPlotData = null;
    lastUserParameter = null;
};

// CSVダウンロード
const downloadCSV = (csvFilePath) => {
    // add cache-busting timestamp if not present
    const fetchPath = csvFilePath.includes('ts=') ? csvFilePath : csvFilePath + (csvFilePath.includes('?') ? '&' : '?') + 'ts=' + Date.now();

    const doParse = (path, tryPlainFallback = true) => {
        Papa.parse(path, {
            download: true,
            header: true,
            complete: function(results) {
                const data = mergeExpressionMetadata(results.data || []);
                try {
                    const csv = Papa.unparse(data);
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    // filename from path or default
                    const og = (document.getElementById('ogInput') || {}).value || 'OG';
                    a.download = `${og}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) {
                    console.error('Failed to generate CSV download', e);
                    alert('Failed to generate CSV for download');
                }
            },
            error: function(err) {
                console.warn('CSV load error for', path, err);
                if (tryPlainFallback && path !== csvFilePath) {
                    // retry without ts param
                    const plain = csvFilePath.replace(/\?.*$/, '');
                    doParse(plain, false);
                    return;
                }
                alert('CSV file loading error');
            }
        });
    };

    loadMetadata().then(() => doParse(fetchPath)).catch(() => alert('Metadata file loading error'));
};

const map = L.map('map', {
    minZoom: 1,  // 最小ズームレベル
    maxZoom: 18  // 最大ズームレベル
}).setView([20, 0], 1); // 初期位置(緯度20度、経度0度, zoom 1）

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const METADATA_FILE = '../data/env_corr_542/tara_metadata_542.tsv';
let metadataRows = [];
let metadataBySample = new Map();
let metadataPromise = null;

function loadMetadata() {
    if (metadataPromise) return metadataPromise;
    metadataPromise = new Promise((resolve, reject) => {
        Papa.parse(`${METADATA_FILE}?ts=${Date.now()}`, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: results => {
                metadataRows = (results.data || []).filter(row => row.sample_id);
                metadataBySample = new Map(metadataRows.map(row => [row.sample_id, row]));
                resolve(metadataRows);
            },
            error: reject
        });
    });
    return metadataPromise;
}

function mergeExpressionMetadata(rows) {
    return rows
        .filter(row => row.sample_id)
        .map(row => ({ ...row, ...(metadataBySample.get(row.sample_id) || {}) }));
}


// Determine the current rendered map size (use Leaflet map size if available,
// otherwise fall back to the DOM element size). Use that size to create a
// fixed size mode for easyPrint so the export uses the same pixel dimensions
// as the on-screen map (prevents scaling differences between HTML and PDF).
const _mapSize = (function() {
    try {
        const s = map.getSize();
        if (s && s.x && s.y) return { width: s.x, height: s.y };
    } catch (e) { /* ignore */ }
    try {
        const el = document.getElementById('map');
        return { width: el.clientWidth || parseInt(getComputedStyle(el).width, 10) || 800,
                 height: el.clientHeight || parseInt(getComputedStyle(el).height, 10) || 600 };
    } catch (e) {
        return { width: 800, height: 600 };
    }
})();

const MapPrintPlugin = L.easyPrint({
    title: 'Save Map as Image',
    position: 'topright',
    exportOnly: true, // 印刷プレビューなしで直接ダウンロード
    // Use a single custom fixed-size mode matching the current map pixels
    sizeModes: [{ height: _mapSize.height, width: _mapSize.width, name: 'Map Size', className: 'MapSize page' }],
    filename: 'SAR11_metaT_Map',
    // エクスポート時は Leaflet の操作UIを画像から除外する
    // これでズームボタンや easyPrint ボタンが出力に混ざらない
    hideControlContainer: true,
}).addTo(map);


// 地図の円を更新する関数
let markers = [];
const updateCircles = (csvFilePath) => {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // purge existing plots to avoid showing stale data while new CSV loads
    try {
        Plotly.purge('temperaturePlot');
        Plotly.purge('salinityPlot');
        Plotly.purge('depthPlot');
        Plotly.purge('oxygenPlot');
    } catch (e) { /* ignore if plots not initialized */ }

    // add cache-busting timestamp if caller didn't already include one
    const fetchPath = csvFilePath.includes('ts=') ? csvFilePath : csvFilePath + (csvFilePath.includes('?') ? '&' : '?') + 'ts=' + Date.now();

    Papa.parse(fetchPath, {
        download: true,
        header: true,
        complete: function(results) {
            const data = mergeExpressionMetadata(results.data || []);
            // Compute the maximum expression score for linear marker scaling.
            const expressionValues = data.map(r => parseFloat(r.sumTPM)).filter(v => !isNaN(v) && v > 0);
            const dataMax = expressionValues.length ? Math.max(...expressionValues) : 0;
            const minRadius = 2;
            const maxRadius = 20;
            const useTransformed = (function(){
                try { const el = document.getElementById('sizeLogToggle'); return el ? !!el.checked : true; } catch(e) { return true; }
            })();

            function computeRadius(expressionScore) {
                if (isNaN(expressionScore) || expressionScore <= 0) return 0;
                if (useTransformed) {
                    // original power transform (kept for compatibility)
                    return Math.pow(expressionScore, 0.3);
                } else {
                    // linear scaling mapped to [minRadius, maxRadius] using dataMax
                    if (dataMax <= 0) return minRadius;
                    const frac = Math.min(1, expressionScore / dataMax);
                    return minRadius + frac * (maxRadius - minRadius);
                }
            }
            data.forEach(row => {
                const lat = parseFloat(row.Latitude);
                const lon = parseFloat(row.Longitude);
                const expressionScore = parseFloat(row.sumTPM);

                if (!isNaN(lat) && !isNaN(lon) && expressionScore > 0) {
                    const radius = computeRadius(expressionScore);

                    const circleMarker = L.circleMarker([lat, lon], {
                        color: 'blue',
                        fillColor: '#3388ff',
                        fillOpacity: 0.5,
                        radius: radius
                    }).addTo(map).bindPopup(`
                        <b>Sample:</b> ${row.sample_id || row.sample || 'Unknown'}<br>
                        <b>Expression Score:</b> ${expressionScore.toFixed(2)}<br>
                        <b>Depth:</b> ${row['Depth.nominal'] || 'Unknown'}<br>
                        <b>Temperature:</b> ${row.Temperature || 'Unknown'}<br>
                    `);

                    markers.push(circleMarker);
                }
            });
                    updatePlots(data);
                    // refresh legend to reflect current size scaling mode
                    try { addLegend(); } catch (e) { /* ignore */ }
        },
        error: function() {
            alert('CSV file loading error');
        }
    });
};

// 初期表示: URL パラメータに ogInput があればそれを使い、CSV 読み込み時はキャッシュバスターを付与
const urlParams = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, ''));
const ogFromUrl = urlParams.get('ogInput') || urlParams.get('og') || null;
const initialOg = (ogFromUrl && ogFromUrl.trim()) ? ogFromUrl.trim() : (ogInputEl && ogInputEl.value ? ogInputEl.value.trim() : 'OG0000000');
const initialCsvFile = `../data/env_corr_542/${initialOg}.csv?ts=${Date.now()}`;
// Clear plots and render initial circles
try { resetUserPlot(); } catch (e) {}
Promise.all([loadMetadata(), Promise.resolve()]).then(() => updateCircles(initialCsvFile));
// Ensure easyPrint filename includes OG id
try {
    const setPrintFilename = () => {
        const ogVal = (document.getElementById('ogInput') || {}).value.trim() || initialOg || 'OG0000000';
        if (typeof MapPrintPlugin !== 'undefined' && MapPrintPlugin && MapPrintPlugin.options) {
            MapPrintPlugin.options.filename = `SAR11_metaT_Map_${ogVal}`;
        }
    };
    setPrintFilename();
    // Update filename right before any print starts
    try { map.on('easyPrint-start', setPrintFilename); } catch(e) { /* ignore */ }
    // Also update when user requests an update (OG changed)
    try { document.getElementById('updateMap').addEventListener('click', setPrintFilename); } catch(e) { /* ignore */ }
} catch (e) { console.warn('Failed to initialize print filename updater', e); }
// 初期ヘッダー表示: デフォルトOGを表示
try {
    const hdr = document.getElementById('expressionProfileHeader');
    const ogDefault = (ogInputEl && ogInputEl.value && ogInputEl.value.trim()) ? ogInputEl.value.trim() : 'OG0000000';
    if (hdr) {
        const ogEsc = ogDefault.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const hrefDef = `./SAR11_OG_info.html?ogInput=${encodeURIComponent(ogDefault)}`;
        hdr.innerHTML = `Selected OG: <a href="${hrefDef}" target="_blank" rel="noopener" title="Open OG info for ${ogEsc}">${ogEsc}</a>`;
        hdr.style.display = 'block';
    }
} catch (e) {
    console.error('Failed to set initial expression profile header', e);
}

// 凡例の追加
const addLegend = () => {
    // remove existing legend DOM if present to allow re-creation when scale toggles
    try {
        const existing = document.querySelector('.info.legend');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    } catch (e) { /* ignore */ }
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [10, 100, 1000, 10000, 100000];
        div.innerHTML += '<b>Expression Score</b><br>';

        // Loop through the grades to create the circles with appropriate sizes
        grades.forEach((grade, index) => {
            const nextGrade = grades[index + 1];
            // Respect current toggle state when showing legend sizes
            const useTransformed = (function(){ try { const el = document.getElementById('sizeLogToggle'); return el ? !!el.checked : true; } catch(e) { return true; } })();
            const circleSize = useTransformed ? Math.pow(grade, 0.3) : (function(){ const minRadius = 2; const maxRadius = 20; const dataMax = grades[grades.length-1] || grade; const frac = Math.min(1, grade / dataMax); return minRadius + frac * (maxRadius - minRadius); })();
            div.innerHTML += `
                <i style="background: #3388ff; border-radius: 50%; width: ${circleSize}px; height: ${circleSize}px; display: inline-block;"></i>
                ${grade}<br>
            `;
        });
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        return div;
    };

    legend.addTo(map);
};
addLegend();


// 地図のズーム時に円のサイズを調整
map.on('zoomend', () => updateCircles(`../data/env_corr_542/${document.getElementById('ogInput').value.trim()}.csv`));

// 地図更新ボタンのクリックイベント
document.getElementById('updateMap').addEventListener('click', () => {
    const ogNumber = document.getElementById('ogInput').value.trim();
    if (ogNumber) {
        const newCsvFile = `../data/env_corr_542/${ogNumber}.csv`;
        loadMetadata().then(() => updateCircles(newCsvFile));
        resetUserPlot();
        // Show expression profile header between map and plots
        try {
            const hdr = document.getElementById('expressionProfileHeader');
            if (hdr) {
                const ogEsc = ogNumber.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const href = `./SAR11_OG_info.html?ogInput=${encodeURIComponent(ogNumber)}`;
                hdr.innerHTML = `Selected OG: <a href="${href}" target="_blank" rel="noopener" title="Open OG info for ${ogEsc}">${ogEsc}</a>`;
                hdr.style.display = 'block';
            }
        } catch (e) {
            console.error('Failed to update expression profile header', e);
        }
    } else {
        alert('Enter OG ID');
    }
});

const CORRELATION_PLOT_CONFIG = {
    responsive: true,
    displaylogo: false,
    scrollZoom: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
};
const CORRELATION_POINT_COLOR = '#0a8f91';
const CORRELATION_POINT_BORDER = '#075970';

const calculatePearsonCorrelation = (x, y) => {
    if (x.length < 2 || y.length < 2 || x.length !== y.length) return null;
    const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
    const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
    const numerator = x.reduce((sum, value, index) => sum + (value - meanX) * (y[index] - meanY), 0);
    const denominator = Math.sqrt(
        x.reduce((sum, value) => sum + (value - meanX) ** 2, 0) *
        y.reduce((sum, value) => sum + (value - meanY) ** 2, 0)
    );
    return denominator ? numerator / denominator : null;
};

function rankValues(values) {
    const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
    const ranks = new Array(values.length);
    let start = 0;
    while (start < sorted.length) {
        let end = start;
        while (end + 1 < sorted.length && sorted[end + 1].value === sorted[start].value) end += 1;
        const averageRank = (start + end + 2) / 2;
        for (let index = start; index <= end; index += 1) ranks[sorted[index].index] = averageRank;
        start = end + 1;
    }
    return ranks;
}

function calculateSpearmanCorrelation(x, y) {
    if (x.length < 2 || y.length < 2 || x.length !== y.length) return null;
    return calculatePearsonCorrelation(rankValues(x), rankValues(y));
}

function buildPairedArrays(rows, xKey, yKey) {
    const xs = [];
    const ys = [];
    const pairedRows = [];
    rows.forEach(row => {
        const xValue = parseFloat(typeof xKey === 'function' ? xKey(row) : row[xKey]);
        const yValue = parseFloat(typeof yKey === 'function' ? yKey(row) : row[yKey]);
        if (!isNaN(xValue) && !isNaN(yValue)) {
            xs.push(xValue);
            ys.push(yValue);
            pairedRows.push(row);
        }
    });
    return { x: xs, y: ys, rows: pairedRows };
}

function useLogExpressionScale() {
    try {
        const toggle = document.getElementById('sizeLogToggle');
        return toggle ? toggle.checked : true;
    } catch (error) {
        return true;
    }
}

function getSharedExpressionRange(data, useLogAxis) {
    const values = data.map(row => parseFloat(row.sumTPM)).filter(value => !isNaN(value) && (!useLogAxis || value > 0));
    if (!values.length) return undefined;
    if (useLogAxis) {
        const logValues = values.map(value => Math.log10(value));
        const minimum = Math.min(...logValues);
        const maximum = Math.max(...logValues);
        const padding = Math.max(0.15, (maximum - minimum) * 0.06);
        return [minimum - padding, maximum + padding];
    }
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const span = Math.max(1, maximum - minimum);
    return [minimum >= 0 ? 0 : minimum - span * 0.06, maximum + span * 0.06];
}

function getCorrelationPlotTheme() {
    const dark = document.body.classList.contains('dark-mode');
    return {
        text: dark ? '#eaf7fa' : '#143f50',
        muted: dark ? '#aac2cc' : '#607985',
        grid: dark ? 'rgba(170, 194, 204, 0.16)' : 'rgba(20, 63, 80, 0.12)',
        plot: dark ? '#102733' : '#f8fbfb'
    };
}

function formatCorrelation(value) {
    return value === null || !isFinite(value) ? 'N/A' : value.toFixed(2);
}

function prepareCorrelationPlot(pair, label, sharedRange, useLogAxis) {
    const filteredIndices = pair.y.map((value, index) => ({ value, index }))
        .filter(item => !useLogAxis || item.value > 0)
        .map(item => item.index);
    const xValues = filteredIndices.map(index => pair.x[index]);
    const yValues = filteredIndices.map(index => pair.y[index]);
    const rows = filteredIndices.map(index => pair.rows[index]);
    const pearsonY = useLogAxis ? yValues.map(value => Math.log10(value)) : yValues;
    const pearson = calculatePearsonCorrelation(xValues, pearsonY);
    const spearman = calculateSpearmanCorrelation(xValues, yValues);
    const theme = getCorrelationPlotTheme();
    const customdata = rows.map(row => [
        row.sample_id || row.sample || 'Unknown',
        row.Latitude || 'NA',
        row.Longitude || 'NA'
    ]);

    const correlationText = xValues.length
        ? `Pearson r = ${formatCorrelation(pearson)} &nbsp; Spearman ρ = ${formatCorrelation(spearman)} &nbsp; n = ${xValues.length}`
        : 'No numeric pairs available for this field';

    const trace = {
        x: xValues,
        y: yValues,
        customdata,
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: CORRELATION_POINT_COLOR,
            size: 6,
            opacity: 0.42,
            line: { color: CORRELATION_POINT_BORDER, width: 0.7 }
        },
        hovertemplate: `<b>%{customdata[0]}</b><br>${label}: %{x:.4g}<br>Expression Score: %{y:.4g}<br>Latitude: %{customdata[1]}<br>Longitude: %{customdata[2]}<extra></extra>`
    };
    const layout = {
        autosize: true,
        showlegend: false,
        hovermode: 'closest',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: theme.plot,
        font: { color: theme.text, family: 'Aptos, Helvetica Neue, sans-serif', size: 12 },
        margin: { l: 68, r: 22, t: 76, b: 58 },
        title: { text: `<b>${label}</b>`, x: 0.04, xanchor: 'left', font: { size: 16, color: theme.text } },
        annotations: [{
            x: 0.99,
            y: 1.13,
            xref: 'paper',
            yref: 'paper',
            xanchor: 'right',
            yanchor: 'top',
            showarrow: false,
            text: correlationText,
            font: { size: 10, color: theme.muted }
        }],
        xaxis: {
            title: { text: label, standoff: 10 },
            gridcolor: theme.grid,
            zerolinecolor: theme.grid,
            automargin: true
        },
        yaxis: {
            title: { text: useLogAxis ? 'Expression Score (log scale)' : 'Expression Score', standoff: 8 },
            type: useLogAxis ? 'log' : 'linear',
            range: sharedRange,
            gridcolor: theme.grid,
            zerolinecolor: theme.grid,
            automargin: true
        }
    };
    return { trace, layout };
}

function drawCorrelationPlot(elementId, pair, label, sharedRange, useLogAxis) {
    const plot = prepareCorrelationPlot(pair, label, sharedRange, useLogAxis);
    Plotly.react(elementId, [plot.trace], plot.layout, CORRELATION_PLOT_CONFIG);
}

const updatePlots = data => {
    lastCorrelationData = data;
    const useLogAxis = useLogExpressionScale();
    const sharedRange = getSharedExpressionRange(data, useLogAxis);
    drawCorrelationPlot('temperaturePlot', buildPairedArrays(data, 'Temperature', 'sumTPM'), 'Temperature', sharedRange, useLogAxis);
    drawCorrelationPlot('salinityPlot', buildPairedArrays(data, 'Salinity', 'sumTPM'), 'Salinity', sharedRange, useLogAxis);
    drawCorrelationPlot('depthPlot', buildPairedArrays(data, 'Depth.nominal', 'sumTPM'), 'Nominal depth', sharedRange, useLogAxis);
    drawCorrelationPlot('oxygenPlot', buildPairedArrays(data, 'Oxygen', 'sumTPM'), 'Oxygen', sharedRange, useLogAxis);
};

function renderUserCorrelationPlot(data, parameter) {
    const useLogAxis = useLogExpressionScale();
    const sharedRange = getSharedExpressionRange(data, useLogAxis);
    if (parameter === 'lower.size.fraction' || parameter === 'upper.size.fraction') {
        renderSizeFractionPlot(data, parameter, useLogAxis);
        return;
    }
    drawCorrelationPlot('userPlot', buildPairedArrays(data, parameter, 'sumTPM'), parameter, sharedRange, useLogAxis);
}

function renderSizeFractionPlot(data, parameter, useLogAxis) {
    const groups = new Map();
    data.forEach(row => {
        const fraction = parseFloat(row[parameter]);
        const score = parseFloat(row.sumTPM);
        if (isNaN(fraction) || isNaN(score) || (useLogAxis && score <= 0)) return;
        const label = Number.isInteger(fraction) ? String(fraction) : fraction.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(score);
    });

    const theme = getCorrelationPlotTheme();
    const labels = Array.from(groups.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));
    const colors = ['#0a8f91', '#2f8fba', '#5b73c4', '#a35eae', '#d46b84', '#e28a3b'];
    const traces = labels.map((label, index) => ({
        type: 'violin',
        name: label,
        x: Array(groups.get(label).length).fill(label),
        y: groups.get(label),
        box: { visible: true, width: 0.18 },
        meanline: { visible: true },
        points: 'all',
        jitter: 0.22,
        pointpos: 0,
        marker: {
            color: colors[index % colors.length],
            size: 4,
            opacity: 0.35,
            line: { color: colors[index % colors.length], width: 0.4 }
        },
        line: { color: colors[index % colors.length], width: 1.2 },
        fillcolor: colors[index % colors.length],
        opacity: 0.62,
        hovertemplate: `${label}<br>Expression Score: %{y:.4g}<extra></extra>`
    }));
    const n = traces.reduce((total, trace) => total + trace.y.length, 0);
    const label = parameter === 'lower.size.fraction' ? 'Lower size fraction' : 'Upper size fraction';
    const layout = {
        autosize: true,
        showlegend: false,
        hovermode: 'closest',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: theme.plot,
        font: { color: theme.text, family: 'Aptos, Helvetica Neue, sans-serif', size: 12 },
        margin: { l: 68, r: 22, t: 76, b: 64 },
        title: { text: `<b>Expression Score by ${label}</b>`, x: 0.04, xanchor: 'left', font: { size: 16, color: theme.text } },
        annotations: [{
            x: 0.99,
            y: 1.13,
            xref: 'paper',
            yref: 'paper',
            xanchor: 'right',
            yanchor: 'top',
            showarrow: false,
            text: `${n} plotted samples across ${labels.length} fraction groups`,
            font: { size: 10, color: theme.muted }
        }],
        xaxis: {
            title: { text: label, standoff: 10 },
            type: 'category',
            gridcolor: theme.grid,
            automargin: true
        },
        yaxis: {
            title: { text: useLogAxis ? 'Expression Score (log scale)' : 'Expression Score', standoff: 8 },
            type: useLogAxis ? 'log' : 'linear',
            gridcolor: theme.grid,
            zerolinecolor: theme.grid,
            automargin: true
        }
    };
    Plotly.react('userPlot', traces, layout, CORRELATION_PLOT_CONFIG);
}

document.getElementById('updateUserPlot').addEventListener('click', () => {
    const userParam = document.getElementById('userParameterSelect').value;
    const validParams = Array.from(document.querySelectorAll('#userParameterSelect option')).map(option => option.value);
    if (!validParams.includes(userParam)) {
        alert('Please select a Tara Oceans metadata field.');
        return;
    }

    const ogId = document.getElementById('ogInput').value.trim();
    if (!ogId) {
        alert('Please enter an OG ID.');
        return;
    }
    const requestId = ++userPlotRequestId;
    const csvFilePath = `../data/env_corr_542/${ogId}.csv?ts=${Date.now()}`;
    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        complete: function(results) {
            if (requestId !== userPlotRequestId) return;
            lastUserPlotData = mergeExpressionMetadata(results.data || []);
            lastUserParameter = userParam;
            renderUserCorrelationPlot(lastUserPlotData, lastUserParameter);
        },
        error: function() {
            if (requestId !== userPlotRequestId) return;
            alert('Invalid OG ID. Please enter a valid OG ID');
        }
    });
});

window.addEventListener('sar11:themechange', () => {
    if (lastCorrelationData) updatePlots(lastCorrelationData);
    if (lastUserPlotData && lastUserParameter) renderUserCorrelationPlot(lastUserPlotData, lastUserParameter);
});

const expressionScaleToggle = document.getElementById('sizeLogToggle');
if (expressionScaleToggle) {
    expressionScaleToggle.addEventListener('change', () => {
        if (lastUserPlotData && lastUserParameter) renderUserCorrelationPlot(lastUserPlotData, lastUserParameter);
    });
}


// ウィンドウサイズ変更時にプロットサイズを調整
window.onresize = () => {
    Plotly.Plots.resize('temperaturePlot');
    Plotly.Plots.resize('salinityPlot');
    Plotly.Plots.resize('depthPlot');
    Plotly.Plots.resize('oxygenPlot');
    Plotly.Plots.resize('userPlot');
};
