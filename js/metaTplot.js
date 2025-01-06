// ダウンロードボタンのクリックイベント
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

// CSVをダウンロードする関数
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

const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];

// 地図の円を更新する関数
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
                    const radius = Math.log10(tpm) * 100000; // Adjust size as needed
                    const circle = L.circle([lat, lon], {
                        color: 'blue',
                        fillColor: '#3388ff',
                        fillOpacity: 0.5,
                        radius: radius
                    }).addTo(map).bindPopup(`
                        <b>ENA_Run_ID:</b> ${row.sample || 'Unknown'}<br>
                        <b>TPM:</b> ${tpm.toFixed(2)}<br>
                        <b>Depth:</b> ${row.Depth || 'Unknown'}<br>
                        <b>Temperature:</b> ${row.Temperature || 'Unknown'}<br>
                    `);
                    markers.push(circle);
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
const initialCsvFile = '../data/env_corr/OG372.csv';
updateCircles(initialCsvFile);

// 凡例の追加
const addLegend = () => {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [10, 100, 1000, 10000]; // Define the TPM breakpoints
        div.innerHTML += '<b>TPM</b><br>';

        // Loop through the grades to create the circles with appropriate sizes
        grades.forEach((grade, index) => {
            const nextGrade = grades[index + 1];
            const circleSize = Math.sqrt(grade) * 0.5; // size
            div.innerHTML += `
                <i style="background: #3388ff; border-radius: 50%; width: ${circleSize}px; height: ${circleSize}px; display: inline-block;"></i>
                ${grade}<br>
            `;
        });

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

// プルダウンメニューの選択肢を設定
document.addEventListener('DOMContentLoaded', function () {
    const parameters = [
        { value: 'Oxygen', text: 'Oxygen' },
        { value: 'Temperature', text: 'Temperature' },
        { value: 'Salinity', text: 'Salinity' },
        { value: 'Nitrate', text: 'Nitrate' },
        { value: 'Chl_a', text: 'Chl_a' },
        { value: 'fCDOM', text: 'fCDOM' },
        { value: 'Depth', text: 'Depth' },
        { value: 'Latitude', text: 'Latitude' },
        { value: 'Longitude', text: 'Longitude' },
        { value: 'Sigma-theta', text: 'Sigma-theta' }
    ];

    // プルダウンメニューのDOM要素を取得
    const selectElement = document.getElementById('userParameterSelect');

    // 選択肢を追加
    parameters.forEach(function (param) {
        const option = document.createElement('option');
        option.value = param.value;
        option.textContent = param.text;
        selectElement.appendChild(option);
    });

    // プルダウンメニューが選択された後にプロットを描画する処理
    document.getElementById('updateUserPlot').addEventListener('click', function () {
        const selectedParam = selectElement.value;
        console.log('Selected parameter:', selectedParam);
        // ここで、選ばれたパラメータに基づいてプロットを更新する処理を追加
        // 例: updatePlot(selectedParam);
    });
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

    const temperatureLayout = { title: `Temperature vs TPM (r = ${tempCorr !== null ? tempCorr.toFixed(2) : 'N/A'})` };
    const salinityLayout = { title: `Salinity vs TPM (r = ${salinityCorr !== null ? salinityCorr.toFixed(2) : 'N/A'})` };
    const depthLayout = { title: `Depth vs TPM (r = ${depthCorr !== null ? depthCorr.toFixed(2) : 'N/A'})` };
    const oxygenLayout = { title: `Oxygen vs TPM (r = ${oxygenCorr !== null ? oxygenCorr.toFixed(2) : 'N/A'})` };

    Plotly.newPlot('temperaturePlot', [temperatureData], temperatureLayout);
    Plotly.newPlot('salinityPlot', [salinityData], salinityLayout);
    Plotly.newPlot('depthPlot', [depthData], depthLayout);
    Plotly.newPlot('oxygenPlot', [oxygenData], oxygenLayout);
};

// ユーザー指定パラメータを基に相関プロット作成
document.getElementById('updateUserPlot').addEventListener('click', () => {
    const userParam = document.getElementById('userParameterInput').value.trim();
    const validParams = ['Temperature', 'Salinity', 'Depth', 'Oxygen', 'Latitude', 'Longitude', 'Sigma-theta', 'Nitrate','Chl_a','fCDOM']; // 使用可能なパラメータを定義
    if (validParams.includes(userParam)) {
        const csvFilePath = `../data/env_corr/${document.getElementById('ogInput').value.trim()}.csv`;
        Papa.parse(csvFilePath, {
            download: true,
            header: true,
            complete: function(results) {
                const data = results.data;
                const paramData = data.map(row => parseFloat(row[userParam])).filter(val => !isNaN(val));
                const tpm = data.map(row => parseFloat(row.TPM)).filter(val => !isNaN(val));
                const correlation = calculatePearsonCorrelation(paramData, tpm);
                const userPlotData = {
                    x: paramData,
                    y: tpm,
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: 'brown', size: 10, opacity: 0.2 }
                };
                const userPlotLayout = {
                    title: `${userParam} vs TPM (r = ${correlation !== null ? correlation.toFixed(2) : 'N/A'})`,
                    xaxis: { title: userParam },
                    yaxis: { title: 'TPM' }
                };
                Plotly.newPlot('userPlot', [userPlotData], userPlotLayout);
            },
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