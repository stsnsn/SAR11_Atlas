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
            const resp = await fetch('../data/network/251203_net.tsv');
            if (!resp.ok) throw new Error('Failed to fetch network TSV');
            const text = await resp.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            lines.forEach(line => {
                const parts = line.split(/\t/);
                if (parts.length < 2) return;
                // Normalize IDs to numeric suffix strings (no leading zeros)
                const a0 = parts[0].trim();
                const b0 = parts[1].trim();
                if (!a0 || !b0) return;
                const a = ogToNumId(a0);
                const b = ogToNumId(b0);
                nodesSet.add(a); nodesSet.add(b);
                // record original directed pair a->b for rendering decisions
                try { originalDirected.add(`${a}___${b}`); } catch (e) {}
                if (!adjacency.has(a)) adjacency.set(a, []);
                if (!adjacency.has(b)) adjacency.set(b, []);
                adjacency.get(a).push({ to: b });
                adjacency.get(b).push({ to: a });
            });
        } catch (e) {
            console.warn('Failed to load network TSV', e);
        }
    }

    // Load annotation TSV (try a couple of likely filenames) and populate annotMap
    async function loadAnnotations() {
        const candidates = [
            '../data/network/251202_nei_annot.tsv'
        ];
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
                    // prefer numeric id column 'id' if present, otherwise use Orthogroup
                    let key = null;
                    if (obj.id && obj.id !== '') key = String(parseInt(obj.id, 10));
                    else if (obj.Orthogroup) key = ogToNumId(obj.Orthogroup);
                    else if (obj.orthogroup) key = ogToNumId(obj.orthogroup);
                    if (!key) return;
                    // store parsed fields plus raw object for flexible lookups
                    annotMap.set(String(key), {
                        og: obj.Orthogroup || obj.orthogroup || numIdToOg(key),
                        COG_LETTER: obj.COG_LETTER || obj.Cog || obj.cog || null,
                        COG_ID: obj.COG_ID || obj.cog_id || obj.COG || null,
                        ko_id: obj.ko_id || obj.KO || obj.ko || null,
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
    function extractEgo(start, maxDepth, maxNodes, onlyBidirectional = false) {
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
        // Show shortened labels (last 4 digits) to keep the display compact.
        // Keep full OG in data.og so clicks/exports can use the full identifier.
        // compute color from COG_LETTER (NA -> gray)
        function colorForCog(letter) {
            if (!letter || String(letter).toLowerCase() === 'na') return '#999999';
            const c = String(letter).trim().charAt(0).toUpperCase();
            const hue = (c.charCodeAt(0) * 37) % 360;
            return `hsl(${hue},60%,50%)`;
        }

        // helper to pick a field from raw annotation using candidate keys
        function pickField(rawObj, candidates) {
            if (!rawObj) return null;
            for (const k of candidates) {
                if (rawObj[k] && rawObj[k] !== '') return rawObj[k];
                // try case-insensitive key match
                const foundKey = Object.keys(rawObj).find(x => x && x.toLowerCase() === k.toLowerCase());
                if (foundKey && rawObj[foundKey] !== '') return rawObj[foundKey];
            }
            return null;
        }

        const nodes = ids.map(id => {
            const n = parseInt(String(id), 10);
            const short = Number.isNaN(n) ? String(id).slice(-4) : String(n % 10000).padStart(4, '0');
            const ann = annotMap.get(String(id)) || {};
            const raw = ann.raw || {};
            const cogLetter = ann.COG_LETTER || ann.COG || null;
            const color = colorForCog(cogLetter);
            // try to find COG name and KO description from common header names
            const cogName = ann.COG_NAME || ann.cog_name || pickField(raw, ['COG_NAME', 'cog_name', 'COG name', 'cog name', 'COG_DESCRIPTION', 'cog_description']);
            const koDesc = ann.ko_name || ann.KO_NAME || pickField(raw, ['ko_name', 'KO_NAME', 'ko_description', 'KO_DESCRIPTION', 'ko_desc', 'KO_DESC']);
            return { data: { id: id, label: short, og: numIdToOg(id), depth: visited.get(id), cogLetter: cogLetter, cogId: ann.COG_ID || null, cogName: cogName || null, ko_id: ann.ko_id || ann.ko || null, koDesc: koDesc || null, color: color } };
        });
        // Use originalDirected to determine true directions (recorded when TSV loaded)
        const directed = new Set();
        for (const p of originalDirected) {
            const parts = p.split('___');
            if (parts.length !== 2) continue;
            const u = parts[0];
            const v = parts[1];
            if (idSet.has(u) && idSet.has(v)) directed.add(p);
        }

        function pairKey(a,b){
            const na = parseInt(String(a),10);
            const nb = parseInt(String(b),10);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) {
                return na <= nb ? `${a}___${b}` : `${b}___${a}`;
            }
            return a <= b ? `${a}___${b}` : `${b}___${a}`;
        }

        const edges = [];
        const added = new Set();
        ids.forEach(u => {
            (adjacency.get(u) || []).forEach(e => {
                const v = e.to;
                if (!idSet.has(v)) return;
                const k = pairKey(u, v);
                if (added.has(k)) return;
                added.add(k);

                // pairKey ensures p1 <= p2 (lexicographic/numeric), but actual data direction
                // may be p2 -> p1. Use the `directed` set to pick source/target correctly.
                const parts = k.split('___');
                const p1 = String(parts[0]);
                const p2 = String(parts[1]);

                const hasP1toP2 = directed.has(`${p1}___${p2}`);
                const hasP2toP1 = directed.has(`${p2}___${p1}`);

                // If both directions exist, mark bidirectional and choose stable order p1->p2
                if (hasP1toP2 && hasP2toP1) {
                    const data = { id: k, source: p1, target: p2 };
                    data.bidirectional = 'true';
                    edges.push({ data });
                } else if (!onlyBidirectional) {
                    // Not filtering to bidirectional-only: include the single directed edge
                    if (hasP1toP2) {
                        edges.push({ data: { id: `${p1}___${p2}`, source: p1, target: p2 } });
                    } else if (hasP2toP1) {
                        edges.push({ data: { id: `${p2}___${p1}`, source: p2, target: p1 } });
                    }
                    // If neither is present in directed (shouldn't happen), skip
                }
            });
        });
        // If onlyBidirectional is true and a center is provided, filter nodes to those connected
        // to the center via the retained edges (treat edges as undirected for connectivity)
        if (onlyBidirectional && center) {
            const reach = new Set();
            const adj = new Map();
            edges.forEach(en => {
                const s = String(en.data.source);
                const t = String(en.data.target);
                if (!adj.has(s)) adj.set(s, new Set());
                if (!adj.has(t)) adj.set(t, new Set());
                adj.get(s).add(t);
                adj.get(t).add(s);
            });
            // BFS from center
            const q = [String(center)];
            reach.add(String(center));
            while (q.length) {
                const n = q.shift();
                const neigh = adj.get(n) || new Set();
                for (const m of neigh) {
                    if (!reach.has(m)) {
                        reach.add(m);
                        q.push(m);
                    }
                }
            }
            // filter edges and nodes to reachable set
            const fedges = edges.filter(en => reach.has(String(en.data.source)) && reach.has(String(en.data.target)));
            const fnodes = nodes.filter(nd => reach.has(String(nd.data.id)));
            return { nodes: fnodes, edges: fedges };
        }

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
                { selector: 'edge', style: { 'width': 0.5, 'line-color': '#999', 'curve-style': 'bezier', 'source-arrow-shape': 'none', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#999', 'arrow-scale': 0.4 } },
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
            const cogId = d.cogId || d.COG_ID || null;
            const cogName = d.cogName || d.COG_NAME || null;
            const koId = d.ko_id || d.ko || null;
            const koDesc = d.koDesc || d.ko_description || null;
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

        function runExtract() {
            const centerRaw = (document.getElementById('egoNode').value || '').trim();
            if (!centerRaw) return; // nothing to do
            const center = ogToNumId(centerRaw);
            const maxDepth = parseInt(depthRange.value || '1', 10);
            const maxNodes = parseInt(document.getElementById('maxNodes').value || '500', 10) || 500;
            if (!adjacency.has(center)) {
                // don't spam alerts when slider is moved; only show alert when user explicitly clicks Extract
                return;
            }
            // compute selected nodes (ignoring maxNodes) and visualized nodes (applying maxNodes)
            const onlyBidirectional = !!document.getElementById('onlyBidirectional') && document.getElementById('onlyBidirectional').checked;
            const selectedVisited = extractEgoNoLimit(center, maxDepth);
            const visited = extractEgo(center, maxDepth, maxNodes, onlyBidirectional);
            const elements = buildElements(visited, onlyBidirectional, center);
            renderCy(elements);
            // mark this center and maxNodes as the last extracted and enable exports
            lastExtractCenter = centerRaw;
            lastExtractMaxNodes = maxNodes;
            setExportButtonsEnabled(true);
            // update cyInfo with selected and visualized node counts
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
            if (!adjacency.has(center)) return alert('Node not found in network: ' + centerRaw + ' (tried ' + center + ')');
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
