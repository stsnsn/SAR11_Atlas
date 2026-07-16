// Ego network prototype: load TSV, build adjacency, extract BFS ego-network, render with Cytoscape
(function(){
    let adjacency = new Map();
    let nodesSet = new Set();
    // annotation map: numeric id -> annotation object { og, COG_LETTER, COG_ID, ko_id }
    let annotMap = new Map();
    // record original directed pairs from TSV (a -> b as present in file) for rendering direction
    let originalDirected = new Set();
    // Track last extracted center (raw OG string) and maxNodes so we can disable exports when inputs change
    let lastExtractCenter = null;
    let lastExtractMaxNodes = null;
    function setExportButtonsEnabled(enabled) {
        const png = document.getElementById('exportPngBtn');
        const json = document.getElementById('exportJsonBtn');
        if (png) png.disabled = !enabled;
        if (json) json.disabled = !enabled;
    }

    // Helpers: convert between OG format (OG0000123) and numeric id used by Cosmograph/net TSV (e.g. 123)
    function ogToNumId(s) {
        if (!s) return s;
        // If already purely numeric (possibly zero-padded), strip leading zeros
        if (/^\d+$/.test(s)) return String(parseInt(s, 10));
        // Match OG followed by zeros and digits, capture the numeric suffix
        const m = String(s).match(/OG0*([0-9]+)$/i);
        if (m) return String(parseInt(m[1], 10));
        // Fallback: strip non-digits and leading zeros
        const digits = String(s).replace(/\D+/g, '');
        return digits ? String(parseInt(digits, 10)) : s;
    }

    function numIdToOg(num) {
        if (num === null || num === undefined) return num;
        const n = parseInt(String(num), 10);
        if (Number.isNaN(n)) return String(num);
        return 'OG' + String(n).padStart(7, '0');
    }

    // Load TSV into adjacency list (expects first two columns: source \t target)
    async function loadTSV() {
        try {
            const resp = await fetch('../data/network/251225_corgias_hit_net.tsv');
            if (!resp.ok) throw new Error('Failed to fetch network TSV');
            const text = await resp.text();
            const lines = text.split(/\r?\n/).filter(Boolean);

            lines.forEach((line, index) => {
                // ヘッダー行をスキップ
                if (index === 0) return;
                const parts = line.split(/\t/);
                // 必要な列（5列目のqvalueまで）があるかチェック
                if (parts.length < 5) return;
                const a0 = parts[0].trim(); // OG1
                const b0 = parts[1].trim(); // OG2
                // IDの変換を最初に行い、変数 a, b を定義
                const a = ogToNumId(a0);
                const b = ogToNumId(b0);

                const dirValue = parseFloat(parts[2].trim());
                const qValue = parseFloat(parts[4].trim());

                // 重み計算: -log10(qvalue)
                const weight = -Math.log10(qValue || 1);

                if (!a || !b || isNaN(weight)) return;

                nodesSet.add(a);
                nodesSet.add(b);

                // 隣接リストの初期化
                if (!adjacency.has(a)) adjacency.set(a, []);
                if (!adjacency.has(b)) adjacency.set(b, []);

                // 色
                const color = dirValue > 0 ? '#d62728' : '#1f77b4'; 
                adjacency.get(a).push({ to: b, weight, color });
                adjacency.get(b).push({ to: a, weight, color });
            });

        } catch (e) {
            // エラー
            console.error('Failed to load network TSV:', e);
        }
    }

    // Use the shared orthogroup summary for node labels, colors, and tooltips.
    async function loadAnnotations() {
        const candidates = ['../data/orthogroups/og_suggest.tsv'];
        for (const url of candidates) {
            try {
                const resp = await fetch(url);
                if (!resp.ok) continue;
                const text = await resp.text();
                const lines = text.split(/\r?\n/).filter(Boolean);
                const header = lines.shift().split(/\t/).map(h => h.trim());
                lines.forEach(line => {
                    const parts = line.split(/\t/);
                    if (parts.length < 1) return;
                    const obj = {};
                    header.forEach((h, i) => { obj[h] = (parts[i] || '').trim(); });
                    const og = obj.og_id || obj.Orthogroup || obj.orthogroup;
                    const key = og ? ogToNumId(og) : null;
                    if (!key) return;
                    // store parsed fields plus raw object for flexible lookups
                    annotMap.set(String(key), {
                        og: og || numIdToOg(key),
                        COG_LETTER: obj.cog_letter || obj.COG_LETTER || null,
                        COG_ID: obj.cog || obj.COG_ID || null,
                        COG_NAME: obj.cog_name || obj.COG_NAME || null,
                        ko_id: obj.ko || obj.ko_id || null,
                        ko_name: obj.ko_name || obj.ko_description || null,
                        // keep raw row so we can search for alternative name/description columns
                        raw: obj
                    });
                });
                // loaded successfully, stop trying others
                console.log('loadAnnotations: loaded', url, 'entries=', annotMap.size);
                return;
            } catch (e) {
                // try next candidate
                continue;
            }
        }
        console.warn('No annotation TSV found among candidates');
    }

    // If onlyBidirectional is true, only traverse edges that exist in both directions
    function extractEgo(start, maxDepth, maxNodes, onlyBidirectional = false, qValueThreshold = 0.05) {
        const visited = new Map();
        const q = [{ node: start, depth: 0 }];
        visited.set(start, 0);
        while (q.length) {
            const { node, depth } = q.shift();
            if (depth >= maxDepth) continue;
            const neighs = adjacency.get(node) || [];
            for (const nb of neighs) {
                const n = nb.to;
                // If onlyBidirectional mode is enabled, require that the original TSV
                // contains both directions for this pair (node -> n and n -> node).
                if (onlyBidirectional) {
                    const forward = `${node}___${n}`;
                    const backward = `${n}___${node}`;
                    if (!originalDirected.has(forward) || !originalDirected.has(backward)) {
                        continue;
                    }
                }

                // Filter by qValue threshold: skip if the edge weight (derived from qValue) is below the threshold
                if (nb.weight < qValueThreshold) continue;

                if (!visited.has(n)) {
                    visited.set(n, depth + 1);
                    q.push({ node: n, depth: depth + 1 });
                    if (visited.size >= maxNodes) return visited;
                }
            }
        }
        return visited;
    }

    // Extract without applying maxNodes limit (used to compute 'Selected node')
    function extractEgoNoLimit(start, maxDepth) {
        const visited = new Map();
        const q = [{ node: start, depth: 0 }];
        visited.set(start, 0);
        while (q.length) {
            const { node, depth } = q.shift();
            if (depth >= maxDepth) continue;
            const neighs = adjacency.get(node) || [];
            for (const nb of neighs) {
                const n = nb.to;
                if (!visited.has(n)) {
                    visited.set(n, depth + 1);
                    q.push({ node: n, depth: depth + 1 });
                }
            }
        }
        return visited;
    }

    function buildElements(visited, onlyBidirectional = false, center = null) {
        const ids = Array.from(visited.keys());
        const idSet = new Set(ids);

        const nodes = ids.map(id => {
            const n = parseInt(String(id), 10);
            const short = Number.isNaN(n) ? String(id).slice(-4) : String(n % 10000).padStart(4, '0');
            const ann = annotMap.get(String(id)) || {};
            const cogLetter = ann.COG_LETTER || ann.COG || null;
            const color = colorForCog(cogLetter);

            return {
                data: {
                    id: id,
                    label: short,
                    og: numIdToOg(id),
                    depth: visited.get(id),
                    color: color,
                    // --- 注釈情報を追加 ---
                    cogId: ann.COG_ID,
                    koId: ann.ko_id,
                    cogName: ann.raw ? (ann.raw.COG_NAME || ann.raw.cog_name) : null,
                    koDesc: ann.raw ? (ann.raw.ko_description || ann.raw.KO_NAME) : null
                }
            };
        });

        const edges = [];
        const added = new Set();
        ids.forEach(u => {
            (adjacency.get(u) || []).forEach(e => {
                const v = e.to;
                const weight = e.weight || 1;
                if (!idSet.has(v)) return;
                const k = pairKey(u, v);
                if (added.has(k)) return;
                added.add(k);

                edges.push({
                    data: {
                        id: k,
                        source: u,
                        target: v,
                        weight: weight,
                        color: e.color // 隣接リストから色を取得してデータに追加
                    }
                });
            });
        });

        return { nodes, edges };
    }

    // Render cytoscape with basic style and layout
    let cy = null;
    function renderCy(elements) {
        if (cy) { cy.destroy(); cy = null; }
        // ensure tooltip element exists
        let tip = document.getElementById('cyTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'cyTooltip';
            tip.style.position = 'absolute';
            tip.style.pointerEvents = 'none';
            tip.style.background = 'rgba(255,255,255,0.95)';
            tip.style.border = '1px solid #999';
            tip.style.padding = '6px 8px';
            tip.style.fontSize = '12px';
            tip.style.display = 'none';
            tip.style.zIndex = 10000;
            document.body.appendChild(tip);
        }

        cy = cytoscape({
            container: document.getElementById('cy'),
            // ensure crisp rendering on high-DPI displays
            pixelRatio: 'auto',
            elements: [].concat(elements.nodes, elements.edges),
            style: [
                // default node style: use data(color) for fill but no border by default
                { selector: 'node', style: { 'label': 'data(label)', 'width': 18, 'height': 18, 'background-color': 'data(color)', 'color': '#000', 'text-valign': 'center', 'text-halign': 'center', 'font-size': 12, 'border-width': 0 } },
                // center node (depth=0): highlight by adding an outline only (no background override)
                { selector: 'node[depth = 0]', style: { 'border-width': 2, 'border-color': '#ff7f0e', 'border-opacity': 1, 'border-style': 'solid' } },
                { selector: 'edge', style: {
                    'width': 'mapData(weight, 2, 25, 1, 8)', // 重みをエッジの太さにマッピング
                    'line-color': 'data(color)', // エッジの色を設定
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'none',
                    'source-arrow-shape': 'none',
                    'opacity': 0.8 // 少し透明にして重なりを見やすく
                }},
                // bidirectional edges: show arrows on both ends
                { selector: 'edge[bidirectional = "true"]', style: { 'source-arrow-shape': 'triangle', 'source-arrow-color': '#999', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#999', 'arrow-scale': 0.4 } }
            ],
            layout: {
                name: 'cose',
                animate: true,        // アニメーションあり
                randomize: true,       // 初期位置をバラけさせる（計算収束が早くなる）
                nodeRepulsion: 400000, // ノード間の反発力を強める（重なり防止）
                idealEdgeLength: 50   // エッジの理想的な長さ
            }
        });

        // expose cytoscape instance for external control (resize from outer scripts)
        try { window.cy = cy; } catch(e) { /* ignore if not allowed */ }

        cy.on('tap', 'node', evt => {
            const id = evt.target.id();
            // id is numeric internally; convert back to zero-padded OG when opening OG info
            const og = numIdToOg(id);
            window.open(`./SAR11_OG_info.html?ogInput=${encodeURIComponent(og)}`, '_blank');
        });

        // tooltip on hover: show COG_ID and ko_id
        cy.on('mouseover', 'node', evt => {
            const node = evt.target;
            const d = node.data();
            const cogId = d.cogId;
            const cogName = d.cogName;
            const koId = d.koId;
            const koDesc = d.koDesc;

            let parts = [];
            if (cogId) {
                const namePart = cogName ? `: ${cogName}` : '';
                parts.push(`${cogId}${namePart}`);
            }
            if (koId) {
                const descPart = koDesc ? `: ${koDesc}` : '';
                parts.push(`${koId}${descPart}`);
            }

            const txt = parts.length ? parts.join('<br>') : '(no annotation)';
            tip.innerHTML = txt;
            tip.style.display = 'block';
        });

        cy.on('mousemove', 'node', evt => {
            const e = evt.originalEvent;
            if (e && tip) {
                tip.style.left = (e.pageX + 12) + 'px';
                tip.style.top = (e.pageY + 12) + 'px';
            }
        });

        cy.on('mouseout', 'node', evt => {
            if (tip) tip.style.display = 'none';
        });
    }

    // Export PNG
    function exportPNG() {
        if (!cy) return alert('No graph to export');
        const data = cy.png({ full: true, scale: 1 });
        const a = document.createElement('a');
        a.href = data;
        a.download = 'ego_network.png';
        a.click();
    }

    // Export JSON (elements)
    function exportJSON() {
        if (!cy) return alert('No graph to export');
        const json = cy.json();
        const dataStr = JSON.stringify(json.elements, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ego_network.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Function to determine node color based on COG letter
    function colorForCog(letter) {
        if (!letter || String(letter).toLowerCase() === 'na') return '#999999'; // Default gray
        const c = String(letter).trim().charAt(0).toUpperCase();
        const hue = (c.charCodeAt(0) * 37) % 360; // Calculate hue based on character code
        return `hsl(${hue}, 60%, 50%)`;
    }

    // Helper function to generate a stable key for edge pairs
    function pairKey(a, b) {
        const na = parseInt(String(a), 10);
        const nb = parseInt(String(b), 10);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
            return na <= nb ? `${a}___${b}` : `${b}___${a}`;
        }
        return a <= b ? `${a}___${b}` : `${b}___${a}`;
    }

    // wire UI
    document.addEventListener('DOMContentLoaded', async () => {
        await Promise.all([loadTSV(), loadAnnotations()]);
        // update total node count display
        try {
            console.log('loadTSV/Annotations complete: nodesSet=', nodesSet.size, 'annotMap=', annotMap.size);
            const cyInfo = document.getElementById('cyInfo');
            if (cyInfo) cyInfo.textContent = `Selected nodes = 0; Visualized nodes = 0`;
        } catch (e) { /* ignore */ }
        // setup autocomplete for ego node using og_suggest.tsv
        try {
            const ogTxt = await (await fetch('../data/orthogroups/og_suggest.tsv')).text();
            const ogLines = ogTxt.split(/\r?\n/).filter(Boolean);
            const ogHeader = ogLines.shift().split('\t');
            const ogData = ogLines.map(line => {
                const parts = line.split('\t');
                const obj = {};
                ogHeader.forEach((h,i) => { obj[h] = parts[i] || ''; });
                return obj;
            }).map(d => ({ label: `${d.og_id} | ${d.ko}: ${d.ko_name} | ${d.cog}: ${d.cog_name} | ${d.pfams}: ${d.pfam_names}`, value: d.og_id }));

            $("#egoNode").autocomplete({
                source: function(request, response) {
                    const term = request.term.toLowerCase();
                    const hits = ogData.filter(d => d.label.toLowerCase().includes(term)).slice(0, 50);
                    response(hits);
                },
                minLength: 2,
                delay: 50,
                appendTo: 'body',
                select: function(event, ui) {
                    // set value, close the autocomplete menu to avoid immediate re-opening,
                    // then trigger the extract after a tiny delay so the menu has time to close
                    const $el = $(this);
                    $el.val(ui.item.value);
                    try { $el.autocomplete('close'); } catch (e) { /* ignore */ }
                    setTimeout(() => {
                        try { if (typeof runExtract === 'function') runExtract(); } catch (e) { console.warn('runExtract failed', e); }
                    }, 10);
                    return false;
                }
            });
            // Enter key triggers extract
            $("#egoNode").keydown(e => { if (e.key === 'Enter') { $('#extractBtn').click(); } });
        } catch (e) { console.warn('og_suggest autocomplete failed', e); }
        const depthRange = document.getElementById('depthRange');
        const depthVal = document.getElementById('depthVal');
        const egoInput = document.getElementById('egoNode');
        const maxNodesInput = document.getElementById('maxNodes');
        const qRange = document.getElementById('qValueRange');
        const qValDisp = document.getElementById('qValueVal');

        qRange.addEventListener('input', () => {
            qValDisp.textContent = qRange.value;
            runExtract(); // スライダーを動かすたびに再描画
        });

        function runExtract() {
            const centerRaw = (document.getElementById('egoNode').value || '').trim();
            if (!centerRaw) return alert('Enter center node OG ID');
            const center = ogToNumId(centerRaw);
            if (!adjacency.has(center)) {
                return alert(`Node not found in network: ${centerRaw} (tried ${center}). This OG has no hits in CORGIAS.`);
            }
            const maxDepth = parseInt(depthRange.value || '1', 10);
            const maxNodes = parseInt(document.getElementById('maxNodes').value || '500', 10) || 500;
            const qValueThreshold = parseFloat(qRange.value || '0.05');
            const onlyBidirectional = !!document.getElementById('onlyBidirectional') && document.getElementById('onlyBidirectional').checked;

            const selectedVisited = extractEgoNoLimit(center, maxDepth);
            const visited = extractEgo(center, maxDepth, maxNodes, onlyBidirectional, qValueThreshold);
            const elements = buildElements(visited, onlyBidirectional, center);
            renderCy(elements);

            lastExtractCenter = centerRaw;
            lastExtractMaxNodes = maxNodes;
            setExportButtonsEnabled(true);

            try {
                const cyInfo = document.getElementById('cyInfo');
                if (cyInfo) cyInfo.textContent = `Selected nodes = ${selectedVisited.size}; Visualized nodes = ${elements.nodes.length}`;
            } catch (e) { /* ignore */ }
        }

        depthRange.addEventListener('input', () => {
            depthVal.textContent = depthRange.value;
            // auto-update network when the slider changes
            runExtract();
        });

        // If user toggles the "Only show bidirectional edges" checkbox, re-run the extract automatically
        try {
            const onlyBidirectionalCheckbox = document.getElementById('onlyBidirectional');
            if (onlyBidirectionalCheckbox) {
                onlyBidirectionalCheckbox.addEventListener('change', () => {
                    try { runExtract(); } catch (e) { console.warn('runExtract on onlyBidirectional change failed', e); }
                });
            }
        } catch (e) { /* ignore */ }

        // disable export buttons when the center input changes from the last extracted
        if (egoInput) {
            egoInput.addEventListener('input', () => {
                const cur = (egoInput.value || '').trim();
                if (cur !== lastExtractCenter) {
                    setExportButtonsEnabled(false);
                } else {
                    // also check maxNodes equality
                    const curMax = parseInt((maxNodesInput && maxNodesInput.value) || '500', 10) || 500;
                    setExportButtonsEnabled(curMax === lastExtractMaxNodes);
                }
            });
        }

        // disable export buttons when maxNodes input changes from the last extracted
        if (maxNodesInput) {
            maxNodesInput.addEventListener('input', () => {
                const cur = parseInt(maxNodesInput.value || '500', 10) || 500;
                if (lastExtractMaxNodes === null) {
                    setExportButtonsEnabled(false);
                    return;
                }
                // only enable if both center and maxNodes match last extracted values
                const curCenter = (egoInput && egoInput.value || '').trim();
                const centerMatch = curCenter === lastExtractCenter;
                setExportButtonsEnabled(centerMatch && cur === lastExtractMaxNodes);
            });
        }

        document.getElementById('extractBtn').addEventListener('click', () => {
            const centerRaw = (document.getElementById('egoNode').value || '').trim();
            if (!centerRaw) return alert('Enter center node OG ID');
            const center = ogToNumId(centerRaw);
            if (!adjacency.has(center)) return alert('Node not found in network: ' + centerRaw + ' (tried ' + center + ')' + '\nThis OG has no hits in CORGIAS.');
            runExtract();
        });
        document.getElementById('exportPngBtn').addEventListener('click', exportPNG);
        document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);

        // Support deep-linking via URL: ?ogInput=OG0000123 or ?og=OG0000123 or #og=OG0000123
        try {
            const params = new URLSearchParams(window.location.search);
            let ogParam = params.get('ogInput') || params.get('og');
            if (!ogParam && window.location.hash) {
                const m = window.location.hash.match(/#og=(.+)/);
                if (m) ogParam = decodeURIComponent(m[1]);
            }
            if (ogParam) {
                document.getElementById('egoNode').value = ogParam;
                // update displayed depth value
                depthVal.textContent = depthRange.value;
                // run extract after a short delay to ensure UI is ready
                setTimeout(() => { runExtract(); }, 50);
            }
        } catch (e) { console.warn('URL ogInput handling failed', e); }
    });
})();
