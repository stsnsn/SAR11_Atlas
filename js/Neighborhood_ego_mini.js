// Minimal ego network for OG viewer (no controls)
(function(){
    // reuse small helpers
    function ogToNumId(s) {
        if (!s) return s;
        if (/^\d+$/.test(s)) return String(parseInt(s, 10));
        const m = String(s).match(/OG0*([0-9]+)$/i);
        if (m) return String(parseInt(m[1], 10));
        const digits = String(s).replace(/\D+/g, '');
        return digits ? String(parseInt(digits, 10)) : s;
    }
    function numIdToOg(num) {
        if (num === null || num === undefined) return num;
        const n = parseInt(String(num), 10);
        if (Number.isNaN(n)) return String(num);
        return 'OG' + String(n).padStart(7, '0');
    }

    let adjacency = new Map();
    let annotMap = new Map();
    // record original directed pairs from TSV (a -> b as present in file)
    let originalDirected = new Set();
    let cy = null;

    function networkThemeColors() {
        const dark = document.body.classList.contains('dark-mode');
        return dark
            ? { text: '#e8f6fa', edge: '#668492', tooltipBg: 'rgba(12,32,42,0.97)', tooltipBorder: '#557582', tooltipText: '#eefbfe' }
            : { text: '#000000', edge: '#999999', tooltipBg: 'rgba(255,255,255,0.95)', tooltipBorder: '#999999', tooltipText: '#142b36' };
    }

    function applyNetworkTheme() {
        const colors = networkThemeColors();
        if (cy) {
            cy.style()
                .selector('node').style('color', colors.text)
                .selector('edge').style({ 'line-color': colors.edge, 'target-arrow-color': colors.edge })
                .selector('edge[bidirectional = "true"]').style({ 'source-arrow-color': colors.edge, 'target-arrow-color': colors.edge })
                .update();
        }
        const tip = document.getElementById('cyTooltip');
        if (tip) {
            tip.style.background = colors.tooltipBg;
            tip.style.borderColor = colors.tooltipBorder;
            tip.style.color = colors.tooltipText;
        }
    }

    async function loadTSV() {
        if (adjacency.size > 0) return;
        try {
            const resp = await fetch('../data/network/neighbor_network.tsv');
            if (!resp.ok) throw new Error('Failed to fetch network TSV');
            const text = await resp.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            const header = lines.shift().split('\t').map(h => h.trim());
            const sourceIndex = header.indexOf('source');
            const targetIndex = header.indexOf('target');
            if (sourceIndex < 0 || targetIndex < 0) {
                throw new Error('Network TSV must contain source and target columns');
            }
            lines.forEach(line => {
                const parts = line.split(/\t/);
                const a = ogToNumId((parts[sourceIndex] || '').trim());
                const b = ogToNumId((parts[targetIndex] || '').trim());
                if (!a || !b) return;
                // record original direction a->b for rendering decisions
                try { originalDirected.add(`${a}___${b}`); } catch (e) {}
                if (!adjacency.has(a)) adjacency.set(a, []);
                if (!adjacency.has(b)) adjacency.set(b, []);
                adjacency.get(a).push({ to: b });
                adjacency.get(b).push({ to: a });
            });
            console.log('mini loadTSV done nodes=', adjacency.size);
        } catch (e) { console.warn('mini loadTSV failed', e); }
    }

    async function loadAnnotations() {
        if (annotMap.size > 0) return;
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
                    header.forEach((h,i) => { obj[h] = (parts[i]||'').trim(); });
                    const og = obj.og_id || obj.Orthogroup || obj.orthogroup;
                    const key = og ? ogToNumId(og) : null;
                    if (!key) return;
                    annotMap.set(String(key), {
                        raw: obj,
                        COG_LETTER: obj.cog_letter || obj.COG_LETTER || null,
                        COG_ID: obj.cog || obj.COG_ID || null,
                        COG_NAME: obj.cog_name || obj.COG_NAME || null,
                        ko_id: obj.ko || obj.ko_id || null,
                        ko_name: obj.ko_name || obj.ko_description || null
                    });
                });
                console.log('mini loadAnnotations loaded', annotMap.size);
                return;
            } catch (e) { continue; }
        }
        console.warn('mini no annotations found');
    }

    function colorForCog(letter) {
        if (!letter || String(letter).toLowerCase()==='na') return '#999999';
        const c = String(letter).trim().charAt(0).toUpperCase();
        const hue = (c.charCodeAt(0)*37) % 360;
        return `hsl(${hue},60%,50%)`;
    }

    function extractEgo(start, maxDepth, maxNodes) {
        const visited = new Map();
        const q = [{node:start, depth:0}];
        visited.set(start,0);
        while(q.length) {
            const {node, depth} = q.shift();
            if (depth >= maxDepth) continue;
            const neighs = adjacency.get(node) || [];
            for (const nb of neighs) {
                const n = nb.to;
                if (!visited.has(n)) {
                    visited.set(n, depth+1);
                    q.push({node:n, depth: depth+1});
                    if (visited.size >= maxNodes) return visited;
                }
            }
        }
        return visited;
    }

    function buildElements(visited) {
        const ids = Array.from(visited.keys());
        const idSet = new Set(ids);
        const nodes = ids.map(id => {
            const n = parseInt(String(id),10);
            const short = Number.isNaN(n) ? String(id).slice(-4) : String(n % 10000).padStart(4,'0');
            const ann = annotMap.get(String(id)) || {};
            const cogLetter = ann.COG_LETTER || ann.COG || null;
            const color = colorForCog(cogLetter);
            // try to extract descriptive fields similar to full ego script
            const raw = ann.raw || {};
            const cogName = ann.COG_NAME || ann.cog_name || (raw && (raw.COG_NAME || raw.cog_name || raw['COG name'] || raw['cog name'])) || null;
            const koDesc = ann.ko_name || ann.KO_NAME || (raw && (raw.ko_name || raw.KO_NAME || raw.ko_description || raw.KO_DESCRIPTION)) || null;
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

        // helper to create a canonical undirected key (min_max) for dedup
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

                // pairKey ensures p1 <= p2; determine actual direction using `directed`
                const parts = k.split('___');
                const p1 = String(parts[0]);
                const p2 = String(parts[1]);

                const hasP1toP2 = directed.has(`${p1}___${p2}`);
                const hasP2toP1 = directed.has(`${p2}___${p1}`);

                if (hasP1toP2 && hasP2toP1) {
                    // bidirectional: use stable p1->p2 and mark
                    const data = { id: k, source: p1, target: p2 };
                    data.bidirectional = 'true';
                    edges.push({ data });
                } else {
                    // single direction: prefer the actual directed pair if present
                    if (hasP1toP2) {
                        edges.push({ data: { id: `${p1}___${p2}`, source: p1, target: p2 } });
                    } else if (hasP2toP1) {
                        edges.push({ data: { id: `${p2}___${p1}`, source: p2, target: p1 } });
                    } else {
                        // Fallback: no recorded directed info (shouldn't happen) — use canonical order
                        edges.push({ data: { id: k, source: p1, target: p2 } });
                    }
                }
            });
        });
        return { nodes, edges };
    }

    function renderCySimple(elements, containerId) {
        try { if (cy) { cy.destroy(); cy = null; } } catch(e){}
        const container = document.getElementById(containerId);
        if (!container) return;
        cy = cytoscape({
            container: container,
            // ensure crisp rendering on high-DPI displays
            pixelRatio: 'auto',
            elements: [].concat(elements.nodes, elements.edges),
            style: [
                // center labels on nodes to avoid baseline/offset issues
                { selector: 'node', style: { 'label': 'data(label)', 'width': 16, 'height': 16, 'background-color': 'data(color)', 'font-size': 10, 'border-width': 0, 'text-valign': 'center', 'text-halign': 'center', 'color': networkThemeColors().text, 'text-wrap': 'none' } },
                { selector: 'node[depth = 0]', style: { 'border-width': 2, 'border-color': '#ff7f0e', 'border-opacity': 1, 'border-style': 'solid' } },
                { selector: 'node.is-hovered', style: { 'border-width': 3, 'border-color': '#087d82', 'border-opacity': 1, 'overlay-color': '#087d82', 'overlay-opacity': 0.14, 'overlay-padding': 5 } },
                    { selector: 'edge', style: { 'width': 0.5, 'line-color': '#999', 'curve-style': 'bezier', 'source-arrow-shape': 'none', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#999', 'arrow-scale': 0.3 } },
                    // bidirectional edges: arrows on both ends
                    { selector: 'edge[bidirectional = "true"]', style: { 'source-arrow-shape': 'triangle', 'source-arrow-color': '#999', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#999', 'arrow-scale': 0.3 } }
            ],
            layout: { 
                name: 'cose', 
                animate: false,        // アニメーションなしで即座に結果を表示
                randomize: true,       // 初期位置をバラけさせる（計算収束が早くなる）
                nodeRepulsion: 40000, // ノード間の反発力を強める（重なり防止）
                idealEdgeLength: 30   // エッジの理想的な長さ
            }
        });
        const setNetworkCursor = cursor => {
            const value = cursor || 'default';
            container.style.setProperty('cursor', value, 'important');
            container.querySelectorAll('canvas').forEach(canvas => {
                canvas.style.setProperty('cursor', value, 'important');
            });
        };
        // ensure tooltip element exists (same behavior as full ego view)
        let tip = document.getElementById('cyTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'cyTooltip';
            tip.style.position = 'absolute';
            tip.style.pointerEvents = 'none';
            tip.style.background = networkThemeColors().tooltipBg;
            tip.style.border = '1px solid #999';
            tip.style.padding = '6px 8px';
            tip.style.fontSize = '12px';
            tip.style.display = 'none';
            tip.style.zIndex = 30000; // ensure tooltip is above maps/iframes
            tip.style.whiteSpace = 'pre-wrap';
            document.body.appendChild(tip);
        }
        applyNetworkTheme();

        // tooltip on hover: show COG_ID and ko_id (same as full ego)
        const showTipForNode = (node) => {
            const d = node.data();
            const cogId = d.cogId || d.COG_ID || null;
            const cogName = d.cogName || d.COG_NAME || null;
            const koId = d.ko_id || d.ko || null;
            const koDesc = d.koDesc || d.ko_description || null;
            let parts = [`<strong>Click to open ${d.og}</strong>`];
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
        };

        // primary listeners via cy.on
        cy.on('mouseover', 'node', evt => {
            evt.target.addClass('is-hovered');
            setNetworkCursor('pointer');
            showTipForNode(evt.target);
        });
        cy.on('mousemove', 'node', evt => {
            const e = evt.originalEvent || evt; // fallback
            if (e && tip) {
                tip.style.left = (e.pageX + 12) + 'px';
                tip.style.top = (e.pageY + 12) + 'px';
            }
        });
        cy.on('mouseout', 'node', evt => {
            evt.target.removeClass('is-hovered');
            setNetworkCursor('default');
            if (tip) tip.style.display = 'none';
        });

        // attach per-node listeners as a fallback (some Cytoscape builds/environments)
        try {
            cy.nodes().forEach(n => {
                n.on('mouseover', () => {
                    n.addClass('is-hovered');
                    setNetworkCursor('pointer');
                    showTipForNode(n);
                });
                n.on('mousemove', (evt) => {
                    const e = evt.originalEvent || evt;
                    if (e && tip) { tip.style.left = (e.pageX + 12) + 'px'; tip.style.top = (e.pageY + 12) + 'px'; }
                });
                n.on('mouseout', () => {
                    n.removeClass('is-hovered');
                    setNetworkCursor('default');
                    if (tip) tip.style.display = 'none';
                });
            });
        } catch(e) { /* non-fatal fallback */ }
        cy.on('tap', 'node', evt => {
            const id = evt.target.id();
            const og = numIdToOg(id);
            window.open(`./SAR11_OG_info.html?ogInput=${encodeURIComponent(og)}`, '_blank');
        });
    }

    async function renderEgoForOG(og) {
        if (!og) return;
        await Promise.all([loadTSV(), loadAnnotations()]);
        const center = ogToNumId(og);
        if (!adjacency.has(center)) {
            const el = document.getElementById('egoMini');
            if (el) el.innerHTML = '<p style="color:gray; padding:8px;">No neighborhood data for this OG</p>';
            return;
        }
    const maxDepth = 1; const maxNodes = 500;
    const visited = extractEgo(center, maxDepth, maxNodes);
    const elements = buildElements(visited);
        // ensure egoMini height matches metaT_map
        try {
            const map = document.getElementById('metaT_map');
            const ego = document.getElementById('egoMini');
            if (map && ego) {
                ego.style.height = map.clientHeight + 'px';
                // set ego width to 60% of parent container
                ego.style.width = '100%';
            }
        } catch(e){}
        renderCySimple(elements, 'egoMini');
    }

    // expose globally so page can call it
    window.renderEgoForOG = renderEgoForOG;
    window.addEventListener('sar11:themechange', applyNetworkTheme);

    // adjust size on window resize
    window.addEventListener('resize', () => {
        try {
            const map = document.getElementById('metaT_map');
            const ego = document.getElementById('egoMini');
            if (map && ego) ego.style.height = map.clientHeight + 'px';
        } catch(e){}
    });

    // initialize height on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        try {
            const map = document.getElementById('metaT_map');
            const ego = document.getElementById('egoMini');
            if (map && ego) ego.style.height = map.clientHeight + 'px';
        } catch(e){}
    });
})();
