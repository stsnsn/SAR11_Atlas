// ダウンロードボタン
document.getElementById('downloadData').addEventListener('click', () => {
    const csvFilePath = `../data/env_corr/${document.getElementById('ogInput').value.trim()}.csv`;
    downloadCSV(csvFilePath);
});

// OG入力欄の初期値を設定（空ならOG0000000をセット）
const ogInputEl = document.getElementById('ogInput');
if (ogInputEl && !ogInputEl.value.trim()) {
    ogInputEl.value = 'OG0000000';
}

// Reset the user plot
const resetUserPlot = () => {
    // Clear the plot by removing the existing graph
    const userPlotDiv = document.getElementById('userPlot');
    userPlotDiv.innerHTML = ''; // This removes the current plot
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
                const data = results.data || [];
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

    doParse(fetchPath);
};

const map = L.map('map', {
    minZoom: 1,  // 最小ズームレベル
    maxZoom: 18  // 最大ズームレベル
}).setView([20, 0], 1); // 初期位置(緯度20度、経度0度, zoom 1）

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


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
    // レジェンドは leaflet のコントロールとして追加しているため
    // デフォルトでコントロールを非表示にする設定を無効化して
    // 印刷／エクスポートに含める
    hideControlContainer: false,
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
        Plotly.purge('userPlot');
    } catch (e) { /* ignore if plots not initialized */ }

    // add cache-busting timestamp if caller didn't already include one
    const fetchPath = csvFilePath.includes('ts=') ? csvFilePath : csvFilePath + (csvFilePath.includes('?') ? '&' : '?') + 'ts=' + Date.now();

    Papa.parse(fetchPath, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            // compute max TPM for linear scaling if needed
            const tpmValues = data.map(r => parseFloat(r.sumTPM)).filter(v => !isNaN(v) && v > 0);
            const dataMax = tpmValues.length ? Math.max(...tpmValues) : 0;
            const minRadius = 2;
            const maxRadius = 20;
            const useTransformed = (function(){
                try { const el = document.getElementById('sizeLogToggle'); return el ? !!el.checked : true; } catch(e) { return true; }
            })();

            function computeRadius(tpm) {
                if (isNaN(tpm) || tpm <= 0) return 0;
                if (useTransformed) {
                    // original power transform (kept for compatibility)
                    return Math.pow(tpm, 0.3);
                } else {
                    // linear scaling mapped to [minRadius, maxRadius] using dataMax
                    if (dataMax <= 0) return minRadius;
                    const frac = Math.min(1, tpm / dataMax);
                    return minRadius + frac * (maxRadius - minRadius);
                }
            }
            data.forEach(row => {
                const lat = parseFloat(row.Latitude);
                const lon = parseFloat(row.Longitude);
                const tpm = parseFloat(row.sumTPM);

                if (!isNaN(lat) && !isNaN(lon) && tpm > 0) {
                    const radius = computeRadius(tpm);

                    const circleMarker = L.circleMarker([lat, lon], {
                        color: 'blue',
                        fillColor: '#3388ff',
                        fillOpacity: 0.5,
                        radius: radius // TPMに基づいて円のサイズを設定
                    }).addTo(map).bindPopup(`
                        <b>sample_id:</b> ${row.sample || 'Unknown'}<br>
                        <b>sumTPM:</b> ${tpm.toFixed(2)}<br>
                        <b>Depth:</b> ${row.Depth || 'Unknown'}<br>
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
const initialCsvFile = `../data/env_corr/${initialOg}.csv?ts=${Date.now()}`;
// Clear plots and render initial circles
try { resetUserPlot(); } catch (e) {}
updateCircles(initialCsvFile);
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
        hdr.innerHTML = `Expression profile of: <a href="${hrefDef}" target="_blank" rel="noopener" title="Open OG info for ${ogEsc}">${ogEsc}</a>`;
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
        const grades = [10, 100, 1000, 10000, 100000]; // Define the TPM breakpoints
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
map.on('zoomend', () => updateCircles(`../data/env_corr/${document.getElementById('ogInput').value.trim()}.csv`));

// 地図更新ボタンのクリックイベント
document.getElementById('updateMap').addEventListener('click', () => {
    const ogNumber = document.getElementById('ogInput').value.trim();
    if (ogNumber) {
        const newCsvFile = `../data/env_corr/${ogNumber}.csv`;
        updateCircles(newCsvFile);
        resetUserPlot();
        // Show expression profile header between map and plots
        try {
            const hdr = document.getElementById('expressionProfileHeader');
            if (hdr) {
                const ogEsc = ogNumber.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const href = `./SAR11_OG_info.html?ogInput=${encodeURIComponent(ogNumber)}`;
                hdr.innerHTML = `Expression profile of: <a href="${href}" target="_blank" rel="noopener" title="Open OG info for ${ogEsc}">${ogEsc}</a>`;
                hdr.style.display = 'block';
            }
        } catch (e) {
            console.error('Failed to update expression profile header', e);
        }
    } else {
        alert('Enter OG ID');
    }
});

// Pearson corr calculation
const calculatePearsonCorrelation = (x, y) => {
    // x と y の配列から NaN や null を取り除く
    const validData = x
        .map((val, index) => [val, y[index]]) // x と y の対応する値をペアにする
        .filter(([xVal, yVal]) => !isNaN(xVal) && !isNaN(yVal)); // NaN を除外

    // 有効なデータがない場合は null を返す
    if (validData.length === 0) {
        return null;
    }

    // フィルタリング後の x と y の配列を再取得
    const validX = validData.map(([xVal]) => xVal);
    const validY = validData.map(([, yVal]) => yVal);

    const n = validX.length;
    const meanX = validX.reduce((a, b) => a + b, 0) / n;
    const meanY = validY.reduce((a, b) => a + b, 0) / n;

    const numerator = validX.reduce((sum, xi, i) => sum + (xi - meanX) * (validY[i] - meanY), 0);
    const denominator = Math.sqrt(
        validX.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0) *
        validY.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0)
    );

    return denominator !== 0 ? numerator / denominator : null;
};

// Helper: build paired arrays (x,y) from rows by keys, excluding rows where either value is NaN
function buildPairedArrays(rows, xKey, yKey) {
    const xs = [];
    const ys = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const xv = parseFloat(typeof xKey === 'function' ? xKey(row) : row[xKey]);
        const yv = parseFloat(typeof yKey === 'function' ? yKey(row) : row[yKey]);
        if (!isNaN(xv) && !isNaN(yv)) {
            xs.push(xv);
            ys.push(yv);
        }
    }
    return { x: xs, y: ys };
}

// Update plots
const updatePlots = (data) => {
    // Build paired arrays so NA are removed row-wise and x/y remain aligned
    const tempPair = buildPairedArrays(data, 'Temperature', 'sumTPM');
    const temperature = tempPair.x;
    const tpm_temp = tempPair.y;

    const salPair = buildPairedArrays(data, 'Salinity', 'sumTPM');
    const salinity = salPair.x;
    const tpm_sal = salPair.y;

    const depthPair = buildPairedArrays(data, 'Depth', 'sumTPM');
    const depth = depthPair.x;
    const tpm_depth = depthPair.y;

    const oxyPair = buildPairedArrays(data, 'Oxygen', 'sumTPM');
    const oxygen = oxyPair.x;
    const tpm_oxy = oxyPair.y;

    // 相関計算（各ペアで対応する tpm を使う）
    const tempCorr = calculatePearsonCorrelation(temperature, tpm_temp);
    const salinityCorr = calculatePearsonCorrelation(salinity, tpm_sal);
    const depthCorr = calculatePearsonCorrelation(depth, tpm_depth);
    const oxygenCorr = calculatePearsonCorrelation(oxygen, tpm_oxy);

    // プロット更新（x/y は常にペアで揃っている）
    // Determine whether to use log scale for TPM based on toggle
    const useLogAxis = (function(){ try { const el = document.getElementById('sizeLogToggle'); return el ? !!el.checked : true; } catch(e) { return true; } })();

    function preparePlot(xArr, yArr, color, label) {
        // filter pairs: if log axis requested, remove non-positive y values
        let xs = xArr.slice();
        let ys = yArr.slice();
        if (useLogAxis) {
            const xf = [], yf = [];
            for (let i=0;i<ys.length;i++) {
                const yv = ys[i];
                if (!isNaN(yv) && yv > 0 && !isNaN(xs[i])) { xf.push(xs[i]); yf.push(ys[i]); }
            }
            xs = xf; ys = yf;
        }

        // correlation: if log axis, compute correlation on log10(y), otherwise raw y
        let corr = null;
        try {
            if (useLogAxis) {
                const yl = ys.map(v => Math.log10(v));
                corr = calculatePearsonCorrelation(xs, yl);
            } else {
                corr = calculatePearsonCorrelation(xs, ys);
            }
        } catch (e) { corr = null; }

        const trace = { x: xs, y: ys, mode: 'markers', type: 'scatter', marker: { color: color, size: 10, opacity: 0.2 } };
        const layout = { title: `${label} vs TPM (r = ${corr !== null ? corr.toFixed(2) : 'N/A'})`, xaxis: { title: label }, yaxis: { title: useLogAxis ? 'TPM (log10)' : 'TPM', type: useLogAxis ? 'log' : 'linear' } };
        return { trace, layout };
    }

    const tPlot = preparePlot(temperature, tpm_temp, 'blue', 'Temperature');
    const sPlot = preparePlot(salinity, tpm_sal, 'green', 'Salinity');
    const dPlot = preparePlot(depth, tpm_depth, 'red', 'Depth');
    const oPlot = preparePlot(oxygen, tpm_oxy, 'purple', 'Oxygen');

    Plotly.newPlot('temperaturePlot', [tPlot.trace], tPlot.layout);
    Plotly.newPlot('salinityPlot', [sPlot.trace], sPlot.layout);
    Plotly.newPlot('depthPlot', [dPlot.trace], dPlot.layout);
    Plotly.newPlot('oxygenPlot', [oPlot.trace], oPlot.layout);
};

// ユーザー指定パラメータを基に相関プロット作成
document.getElementById('updateUserPlot').addEventListener('click', () => {
    // プルダウンメニューから選ばれたパラメータを取得
    const userParam = document.getElementById('userParameterSelect').value;
    const validParams = ['Temperature', 'Salinity', 'Depth', 'Oxygen', 'Latitude', 'Longitude', 'Sigma-theta', 'Nitrate', 'Chl_a', 'fCDOM']; // 使用可能なパラメータを定義

    // パラメータが有効かどうかをチェック
    if (validParams.includes(userParam)) {
    const ogId = document.getElementById('ogInput').value.trim();
    const csvFilePath = `../data/env_corr/${ogId}.csv?ts=${Date.now()}`;

        // CSVファイルをパース
        Papa.parse(csvFilePath, {
            download: true,
            header: true,
            complete: function(results) {
                const data = results.data;

                // 指定されたパラメータとTPMデータを行単位でペアにして抽出（NA を含む行を除外）
                const pair = buildPairedArrays(data, userParam, 'sumTPM');
                const paramData = pair.x;
                const tpm_p = pair.y;

                // ピアソン相関係数を計算
                const correlation = calculatePearsonCorrelation(paramData, tpm_p);

                // プロットデータの作成（x/y は対応）
                const userPlotData = {
                    x: paramData,
                    y: tpm_p,
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: 'brown', size: 10, opacity: 0.2 }
                };

                // プロットのレイアウト
                const userPlotLayout = {
                    title: `${userParam} vs TPM (r = ${correlation !== null ? correlation.toFixed(2) : 'N/A'})`,
                    xaxis: { title: userParam },
                    yaxis: { title: 'TPM' }
                };
                Plotly.newPlot('userPlot', [userPlotData], userPlotLayout);
            },

            // エラー処理
            error: function() {
                alert('Invalid OG ID. Please enter a valid OG ID');
            }
        });
    } else {
        alert('Invalid parameter. Valid options are: Latitude, Longitude, Temperature, Sigma-theta, Salinity, Oxygen, Nitrate, Chl_a, fCDOM, Depth');
    }
});


// ウィンドウサイズ変更時にプロットサイズを調整
window.onresize = () => {
    Plotly.Plots.resize('temperaturePlot');
    Plotly.Plots.resize('salinityPlot');
    Plotly.Plots.resize('depthPlot');
    Plotly.Plots.resize('oxygenPlot');
    Plotly.Plots.resize('userPlot');
};