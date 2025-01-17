// 地図を作成
const map = L.map('map', {
    minZoom: 2,  // 最小ズームレベル
    maxZoom: 18  // 最大ズームレベル
}).setView([0, 0], 2); // 初期位置(緯度00度、経度0度, zoom 1）

// OpenStreetMapのタイルレイヤー
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const MapPrintPlugin = L.easyPrint({
    title: 'Save Map as Image',
    position: 'topright',
    exportOnly: true, // プレビューなしで直接ダウンロード
    sizeModes: ['Current'], // 選択肢
    filename: 'SAR11_Genome_Map',
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
            iconClass = 'acmarker_gray'; // その他の場合は灰色のアイコン
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
let originalData = []; // 全データを保持する配列


// 地図上のマーカーを更新する関数
function updateMarkers(filterType) {
    markers.clearLayers(); // 既存のマーカーを削除

    originalData.forEach(row => {
        const latitude = parseFloat(row.latitude); // 緯度
        const longitude = parseFloat(row.longitude); // 経度

        // 緯度経度が有効であり、フィルタ条件に一致する場合のみ表示
        if (
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            (filterType === 'all' || row.type === filterType)
        ) {
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
}

// TSVファイルを読み込む
Papa.parse(tsvFilePath, {
    download: true, // ファイルをダウンロードして解析
    header: true, // 1行目をヘッダーとして使用
    skipEmptyLines: true, // 空行をスキップ
    complete: function(results) {
        originalData = results.data; // データを保持
        updateMarkers('all'); // 初期状態で全データを表示
    },
    error: function(error) {
        console.error('TSV file loading error:', error);
    }
});

// プルダウンメニューの変更イベントを監視
document.getElementById('filter').addEventListener('change', (event) => {
    const selectedFilter = event.target.value; // 選択された値
    updateMarkers(selectedFilter); // 地図を更新
});
