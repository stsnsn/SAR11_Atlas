// 地図を作成
const map = L.map('map').setView([20, 0], 2); // 初期位置を緯度20、経度0に設定

// OpenStreetMapのタイルレイヤー
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// TSVファイルのパス
const tsvFilePath = '../data/subclade.txt'; // ここにTSVファイルのパスを指定

// TSVファイルを読み込む
Papa.parse(tsvFilePath, {
    download: true, // ファイルをダウンロードして解析
    header: true, // 1行目をヘッダーとして使用
    skipEmptyLines: true, // 空行をスキップ
    complete: function(results) {
        // データ解析が完了した後に実行される
        const data = results.data;
        data.forEach(row => {
            const latitude = parseFloat(row.latitude); // 緯度
            const longitude = parseFloat(row.longitude); // 経度

            // 緯度経度が有効であればマーカーを追加
            if (!isNaN(latitude) && !isNaN(longitude)) {
                const marker = L.marker([latitude, longitude]).addTo(map);

                // ポップアップに表示する内容を動的に生成
                let popupContent = '<div class="popup-content">';
                for (let key in row) {
                    if (row.hasOwnProperty(key)) {
                        popupContent += `<strong>${key}:</strong> ${row[key] || 'N/A'}<br>`;
                    }
                }
                popupContent += '</div>';

                // クリック時にポップアップを表示
                marker.bindPopup(popupContent);
            }
        });
    },
    error: function(error) {
        console.error('TSV file loading error:', error);
    }
});
