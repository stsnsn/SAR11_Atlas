// CSVファイルを読み込む
function loadPCAData() {
    Papa.parse("../data/pca/PCA_expression_og.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            var pcaData = results.data;
            Papa.parse("../data/pca/PCA_env_vec.csv", {
                download: true,
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    var envData = results.data;
                    plot_3D_PCA(pcaData, envData);  // 関数名を修正
                }
            });
        }
    });
}

// PCAデータと環境パラメータを使って3D散布図をプロット
function plot_3D_PCA(pca_og_data, pca_env_data) {
    var x = pca_og_data.map(function(d) { return d.PC1; });
    var y = pca_og_data.map(function(d) { return d.PC2; });
    var z = pca_og_data.map(function(d) { return d.PC3; });
    var ogLabels = pca_og_data.map(function(d) { return d.Label; });

    // 環境パラメータのベクトル
    var envX = pca_env_data.map(function(d) { return d.PC1; });
    var envY = pca_env_data.map(function(d) { return d.PC2; });
    var envZ = pca_env_data.map(function(d) { return d.PC3; });
    var envLabels = pca_env_data.map(function(d) { return d.Label; });

    // PCAの散布図を作成
    var scatter = {
        x: x,
        y: y,
        z: z,
        mode: 'markers',
        type: 'scatter3d',
        marker: {
            size: 3,
            color: 'blue',
            opacity: 0.3
        },
        text: ogLabels,
        hoverinfo: 'text',
        name: 'PCA points'
    };

    // 環境パラメータのベクトルを描画
    var vectors = envX.map(function(d, i) {
        return {
            type: 'scatter3d',
            mode: 'lines+text',
            x: [0, d],
            y: [0, envY[i]],
            z: [0, envZ[i]],
            line: {
                color: 'red',
                width: 2
            },
            name: envLabels[i],
            text: envLabels[i],
            textposition: 'top center'
        };
    });

    // プロットのレイアウト設定
    var pca_layout = {
        title: "3D PCA plot of Expression data and Environmental Parameters",
        scene: {
            xaxis: { title: 'PC1' },
            yaxis: { title: 'PC2' },
            zaxis: { title: 'PC3' },
            camera: {
                eye: { x: 0, y: 2, z: 1 }, // 初期位置
                center: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 0, z: 1 }
            },
        },
        showlegend: false
    };

    // データを統合してプロット
    var data = [scatter].concat(vectors);
    Plotly.newPlot('plotly-3d-scatter', data, pca_layout);
}

// ページ読み込み時にデータをロード
window.onload = loadPCAData;
