// 地図を作成
const map = L.map('map').setView([20, 0], 2); // 初期位置を緯度20、経度0に設定

// OpenStreetMapのタイルレイヤー
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// MarkerClusterGroupの作成
const markers = L.markerClusterGroup();

// typeに基づくアイコン色
function getIconByType(type) {
    let iconClass;

    // typeに応じてアイコンのクラスを変更
    switch (type) {
        case 'MAG':
            iconClass = 'acmarker_red'; // MAGの場合は赤いアイコン
            break;
        case 'SAG':
            iconClass = 'acmarker_blue'; // SAGの場合は青いアイコン
            break;
        case 'Pure_culture':
            iconClass = 'acmarker_yellow'; // Pure_cultureの場合は黄色いアイコン
            break;
        default:
            iconClass = 'acmarker_gray'; // その他の場合は緑色のアイコン
            break;
    }

    return L.icon({
        iconUrl: '../css/images/marker-icon.png', // アイコン画像
        iconSize: [25, 41], // アイコンサイズ
        iconAnchor: [12, 41], // アイコンのアンカー位置
        popupAnchor: [1, -34], // ポップアップのアンカー位置
        className: iconClass // アイコンにクラスを追加
    });
}

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
                // マーカーを作成
                const marker = L.marker([latitude, longitude], {
                    icon: getIconByType(row.type) // typeに基づいてアイコンを設定
                });

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

                // MarkerClusterGroupにマーカーを追加
                markers.addLayer(marker);
            }
        });

        // マーカーを地図に追加
        map.addLayer(markers);
    },
    error: function(error) {
        console.error('TSV file loading error:', error);
    }
});

