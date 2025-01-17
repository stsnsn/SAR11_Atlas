// ダウンロードボタン
document.getElementById('downloadData').addEventListener('click', () => {
    const csvFilePath = `../data/env_corr/${document.getElementById('ogInput').value.trim()}.csv`;
    downloadCSV(csvFilePath);
});

// Reset the user plot
const resetUserPlot = () => {
    // Clear the plot by removing the existing graph
    const userPlotDiv = document.getElementById('userPlot');
    userPlotDiv.innerHTML = ''; // This removes the current plot
};

// CSVダウンロード
const downloadCSV = (csvFilePath) => {
    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${document.getElementById('ogInput').value.trim()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        },
        error: function() {
            alert('CSV file loading error');
        }
    });
};

const map = L.map('map', {
    minZoom: 1,  // 最小ズームレベル
    maxZoom: 18  // 最大ズームレベル
}).setView([20, 0], 1); // 初期位置(緯度20度、経度0度, zoom 1）

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


const MapPrintPlugin = L.easyPrint({
    title: 'Save Map as Image',
    position: 'topright',
    exportOnly: true, // プレビューなしで直接ダウンロード
    sizeModes: ['A4Portrait'], // 選択肢
    filename: 'SAR11_metaT_Map',
}).addTo(map);


// 地図の円を更新する関数
let markers = [];
const updateCircles = (csvFilePath) => {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            data.forEach(row => {
                const lat = parseFloat(row.Latitude);
                const lon = parseFloat(row.Longitude);
                const tpm = parseFloat(row.TPM);

                if (!isNaN(lat) && !isNaN(lon) && tpm > 0) {
                    // radiusはピクセル単位に変更
                    const radius = Math.pow(tpm, 0.3) * 1/1 ; // ピクセル単位に調整

                    const circleMarker = L.circleMarker([lat, lon], {
                        color: 'blue',
                        fillColor: '#3388ff',
                        fillOpacity: 0.5,
                        radius: radius // TPMに基づいて円のサイズを設定
                    }).addTo(map).bindPopup(`
                        <b>ENA_Run_ID:</b> ${row.sample || 'Unknown'}<br>
                        <b>TPM:</b> ${tpm.toFixed(2)}<br>
                        <b>Depth:</b> ${row.Depth || 'Unknown'}<br>
                        <b>Temperature:</b> ${row.Temperature || 'Unknown'}<br>
                    `);

                    markers.push(circleMarker);
                }
            });
            updatePlots(data);
        },
        error: function() {
            alert('CSV file loading error');
        }
    });
};

// 初期表示
const initialCsvFile = '../data/env_corr/OG1.csv';
updateCircles(initialCsvFile);

// 凡例の追加
const addLegend = () => {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [10, 100, 1000, 10000, 100000]; // Define the TPM breakpoints
        div.innerHTML += '<b>TPM</b><br>';

        // Loop through the grades to create the circles with appropriate sizes
        grades.forEach((grade, index) => {
            const nextGrade = grades[index + 1];
            const circleSize = Math.pow(grade, 0.3) * 1/1; // size
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
map.on('zoomend', () => updateCircles(initialCsvFile));

// 地図更新ボタンのクリックイベント
document.getElementById('updateMap').addEventListener('click', () => {
    const ogNumber = document.getElementById('ogInput').value.trim();
    if (ogNumber) {
        const newCsvFile = `../data/env_corr/${ogNumber}.csv`;
        updateCircles(newCsvFile);
        resetUserPlot();
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

// Update plots
const updatePlots = (data) => {
    const temperature = data.map(row => parseFloat(row.Temperature)).filter(val => !isNaN(val));
    const tpm = data.map(row => parseFloat(row.TPM)).filter(val => !isNaN(val));
    const salinity = data.map(row => parseFloat(row.Salinity)).filter(val => !isNaN(val));
    const depth = data.map(row => parseFloat(row.Depth)).filter(val => !isNaN(val));
    const oxygen = data.map(row => parseFloat(row.Oxygen)).filter(val => !isNaN(val));

    // 相関計算
    const tempCorr = calculatePearsonCorrelation(temperature, tpm);
    const salinityCorr = calculatePearsonCorrelation(salinity, tpm);
    const depthCorr = calculatePearsonCorrelation(depth, tpm);
    const oxygenCorr = calculatePearsonCorrelation(oxygen, tpm);

    // プロット更新
    const temperatureData = {
        x: temperature,
        y: tpm,
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'blue', size: 10, opacity: 0.2 }
    };
    const salinityData = {
        x: salinity,
        y: tpm,
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'green', size: 10, opacity: 0.2 }
    };
    const depthData = {
        x: depth,
        y: tpm,
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'red', size: 10, opacity: 0.2 }
    };
    const oxygenData = {
        x: oxygen,
        y: tpm,
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'purple', size: 10, opacity: 0.2 }
    };

    const temperatureLayout = { title: `Temperature vs TPM (r = ${tempCorr !== null ? tempCorr.toFixed(2) : 'N/A'})`, xaxis: { title: 'Temperature' },yaxis: { title: 'TPM'}};
    const salinityLayout = { title: `Salinity vs TPM (r = ${salinityCorr !== null ? salinityCorr.toFixed(2) : 'N/A'})` , xaxis: { title: 'Salinity' },yaxis: { title: 'TPM'}};
    const depthLayout = { title: `Depth vs TPM (r = ${depthCorr !== null ? depthCorr.toFixed(2) : 'N/A'})` , xaxis: { title: 'Depth' },yaxis: { title: 'TPM'}};
    const oxygenLayout = { title: `Oxygen vs TPM (r = ${oxygenCorr !== null ? oxygenCorr.toFixed(2) : 'N/A'})` , xaxis: { title: 'Oxygen' },yaxis: { title: 'TPM'}};

    Plotly.newPlot('temperaturePlot', [temperatureData], temperatureLayout);
    Plotly.newPlot('salinityPlot', [salinityData], salinityLayout);
    Plotly.newPlot('depthPlot', [depthData], depthLayout);
    Plotly.newPlot('oxygenPlot', [oxygenData], oxygenLayout);
};

// ユーザー指定パラメータを基に相関プロット作成
document.getElementById('updateUserPlot').addEventListener('click', () => {
    // プルダウンメニューから選ばれたパラメータを取得
    const userParam = document.getElementById('userParameterSelect').value;
    const validParams = ['Temperature', 'Salinity', 'Depth', 'Oxygen', 'Latitude', 'Longitude', 'Sigma-theta', 'Nitrate', 'Chl_a', 'fCDOM']; // 使用可能なパラメータを定義

    // パラメータが有効かどうかをチェック
    if (validParams.includes(userParam)) {
        const ogId = document.getElementById('ogInput').value.trim();
        const csvFilePath = `../data/env_corr/${ogId}.csv`;

        // CSVファイルをパース
        Papa.parse(csvFilePath, {
            download: true,
            header: true,
            complete: function(results) {
                const data = results.data;

                // 指定されたパラメータとTPMデータを抽出
                const paramData = data.map(row => parseFloat(row[userParam])).filter(val => !isNaN(val));
                const tpm = data.map(row => parseFloat(row.TPM)).filter(val => !isNaN(val));

                // ピアソン相関係数を計算
                const correlation = calculatePearsonCorrelation(paramData, tpm);

                // プロットデータの作成
                const userPlotData = {
                    x: paramData,
                    y: tpm,
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