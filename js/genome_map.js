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

const CLUSTER_TYPE_COLORS = {
    MAG: '#d84b4b',
    SAG: '#3b82f6',
    isolate: '#f2c94c',
    other: '#9ca3af'
};

function getClusterSize(childCount) {
    return Math.max(40, Math.min(76, 32 + Math.sqrt(childCount) * 4));
}

function getClusterComposition(cluster) {
    const counts = { MAG: 0, SAG: 0, isolate: 0, other: 0 };

    cluster.getAllChildMarkers().forEach((marker) => {
        const type = marker.options.genomeType;
        if (Object.prototype.hasOwnProperty.call(counts, type)) {
            counts[type] += 1;
        } else {
            counts.other += 1;
        }
    });

    return counts;
}

function buildClusterGradient(counts, total) {
    if (!total) {
        return CLUSTER_TYPE_COLORS.other;
    }

    const segments = [];
    let startPercent = 0;

    Object.entries(counts).forEach(([type, count]) => {
        if (!count) {
            return;
        }

        const endPercent = startPercent + (count / total) * 100;
        segments.push(
            `${CLUSTER_TYPE_COLORS[type]} ${startPercent}% ${endPercent}%`
        );
        startPercent = endPercent;
    });

    return `conic-gradient(${segments.join(', ')})`;
}

function createClusterIcon(cluster) {
    const childCount = cluster.getChildCount();
    const clusterSize = Math.round(getClusterSize(childCount));
    const innerSize = Math.round(clusterSize * 0.62);
    const counts = getClusterComposition(cluster);
    const gradient = buildClusterGradient(counts, childCount);

    return L.divIcon({
        html: `
            <div
                class="marker-cluster-pie__chart"
                style="--cluster-size:${clusterSize}px; --cluster-inner-size:${innerSize}px; --cluster-background:${gradient};"
            >
                <div class="marker-cluster-pie__count">
                    <span>${childCount}</span>
                </div>
            </div>
        `,
        className: 'marker-cluster marker-cluster-pie',
        iconSize: L.point(clusterSize, clusterSize)
    });
}

// MarkerClusterGroupの作成
const markers = L.markerClusterGroup({
    iconCreateFunction: createClusterIcon
});

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
        case 'isolate':
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
const tsvFilePath = '../data/phylogeny/subclade.txt'; // ここにTSVファイルのパスを指定
let originalData = []; // 全データを保持する配列

const mapFilterState = {
    type: 'all',
    family: 'all',
    genus: 'all'
};

function metadataCategory(value) {
    return value && value !== 'NA' ? value : 'Unassigned';
}

function uniqueSorted(values) {
    return Array.from(new Set(values)).sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return a.localeCompare(b, undefined, { numeric: true });
    });
}

function replaceMapFilterOptions(select, values, allLabel) {
    const previous = select.value;
    select.replaceChildren();
    select.add(new Option(allLabel, 'all'));
    values.forEach(value => select.add(new Option(value, value)));
    select.value = values.includes(previous) ? previous : 'all';
    return select.value;
}

function refreshMapTaxonomyFilters() {
    const sar11Rows = originalData.filter(row =>
        row.Clade1 !== 'outgroup' &&
        (mapFilterState.type === 'all' || row.type === mapFilterState.type)
    );
    const familySelect = document.getElementById('mapFamilyFilter');
    const genusSelect = document.getElementById('mapGenusFilter');

    mapFilterState.family = replaceMapFilterOptions(
        familySelect,
        uniqueSorted(sar11Rows.map(row => metadataCategory(row.Family))),
        'All families'
    );

    const familyRows = sar11Rows.filter(row =>
        mapFilterState.family === 'all' ||
        metadataCategory(row.Family) === mapFilterState.family
    );
    mapFilterState.genus = replaceMapFilterOptions(
        genusSelect,
        uniqueSorted(familyRows.map(row => metadataCategory(row.Genus))),
        'All genera'
    );
}

// 地図上のマーカーを更新する関数
function updateMarkers() {
    markers.clearLayers(); // 既存のマーカーを削除

    originalData.forEach(row => {
        const latitude = parseFloat(row.latitude); // 緯度
        const longitude = parseFloat(row.longitude); // 経度

        // 緯度経度が有効であり、フィルタ条件に一致する場合のみ表示
        if (
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            row.Clade1 !== 'outgroup' &&
            (mapFilterState.type === 'all' || row.type === mapFilterState.type) &&
            (mapFilterState.family === 'all' ||
                metadataCategory(row.Family) === mapFilterState.family) &&
            (mapFilterState.genus === 'all' ||
                metadataCategory(row.Genus) === mapFilterState.genus)
        ) {
            const marker = L.marker([latitude, longitude], {
                icon: getIconByType(row.type), // typeに基づいてアイコンを設定
                genomeType: row.type
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
        refreshMapTaxonomyFilters();
        updateMarkers(); // 初期状態で全データを表示
    },
    error: function(error) {
        console.error('TSV file loading error:', error);
    }
});

// プルダウンメニューの変更イベントを監視
document.getElementById('filter').addEventListener('change', (event) => {
    mapFilterState.type = event.target.value;
    refreshMapTaxonomyFilters();
    updateMarkers();
});

document.getElementById('mapFamilyFilter').addEventListener('change', (event) => {
    mapFilterState.family = event.target.value;
    refreshMapTaxonomyFilters();
    updateMarkers();
});

document.getElementById('mapGenusFilter').addEventListener('change', (event) => {
    mapFilterState.genus = event.target.value;
    refreshMapTaxonomyFilters();
    updateMarkers();
});

document.getElementById('resetMapFilters').addEventListener('click', () => {
    mapFilterState.type = 'all';
    mapFilterState.family = 'all';
    mapFilterState.genus = 'all';
    document.getElementById('filter').value = 'all';
    document.getElementById('mapFamilyFilter').value = 'all';
    document.getElementById('mapGenusFilter').value = 'all';
    refreshMapTaxonomyFilters();
    updateMarkers();
});
