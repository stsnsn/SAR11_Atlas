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
    let cy = null;

    async function loadTSV() {
        if (adjacency.size > 0) return;
        try {
            const resp = await fetch('../data/network/251203_net.tsv');
            if (!resp.ok) throw new Error('Failed to fetch network TSV');
            const text = await resp.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            lines.forEach(line => {
                const parts = line.split(/\t/);
                if (parts.length < 2) return;
                const a = ogToNumId(parts[0].trim());
                const b = ogToNumId(parts[1].trim());
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
        const candidates = ['../data/network/251202_nei_annot.tsv'];
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
                    let key = null;
                    if (obj.id && obj.id!=='') key = String(parseInt(obj.id,10));
                    else if (obj.Orthogroup) key = ogToNumId(obj.Orthogroup);
                    else if (obj.orthogroup) key = ogToNumId(obj.orthogroup);
                    if (!key) return;
                    annotMap.set(String(key), {
                        raw: obj,
                        COG_LETTER: obj.COG_LETTER || obj.Cog || obj.cog || null,
                        COG_ID: obj.COG_ID || obj.cog_id || obj.COG || null,
                        ko_id: obj.ko_id || obj.KO || obj.ko || null
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
        const edges = [];
        ids.forEach(u => {
            (adjacency.get(u)||[]).forEach(e => {
                const v = e.to;
                if (idSet.has(v)) {
                    const eid = `${u}___${v}`;
                    const eidRev = `${v}___${u}`;
                    if (!edges.find(x => x.data && (x.data.id===eid || x.data.id===eidRev))) {
                        edges.push({ data: { id: eid, source: u, target: v } });
                    }
                }
            });
        });
        return { nodes, edges };
    }

    function renderCySimple(elements, containerId) {
        try { if (cy) { cy.destroy(); cy = null; } } catch(e){}
        cy = cytoscape({
            container: document.getElementById(containerId),
            elements: [].concat(elements.nodes, elements.edges),
            style: [
                { selector: 'node', style: { 'label': 'data(label)', 'width': 16, 'height': 16, 'background-color': 'data(color)', 'font-size': 9, 'border-width': 0 } },
                { selector: 'node[depth = 0]', style: { 'border-width': 2, 'border-color': '#ff7f0e', 'border-opacity': 1, 'border-style': 'solid' } },
                { selector: 'edge', style: { 'width': 0.5, 'line-color': '#999', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#999', 'arrow-scale': 0.3 } }
            ],
            layout: { name: 'cose', animate: true, randomize: false }
        });
        // ensure tooltip element exists (same behavior as full ego view)
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
            tip.style.zIndex = 30000; // ensure tooltip is above maps/iframes
            tip.style.whiteSpace = 'pre-wrap';
            document.body.appendChild(tip);
        }

        // tooltip on hover: show COG_ID and ko_id (same as full ego)
        const showTipForNode = (node) => {
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
        };

        // primary listeners via cy.on
        cy.on('mouseover', 'node', evt => { showTipForNode(evt.target); });
        cy.on('mousemove', 'node', evt => {
            const e = evt.originalEvent || evt; // fallback
            if (e && tip) {
                tip.style.left = (e.pageX + 12) + 'px';
                tip.style.top = (e.pageY + 12) + 'px';
            }
        });
        cy.on('mouseout', 'node', evt => { if (tip) tip.style.display = 'none'; });

        // attach per-node listeners as a fallback (some Cytoscape builds/environments)
        try {
            cy.nodes().forEach(n => {
                n.on('mouseover', () => { showTipForNode(n); });
                n.on('mousemove', (evt) => {
                    const e = evt.originalEvent || evt;
                    if (e && tip) { tip.style.left = (e.pageX + 12) + 'px'; tip.style.top = (e.pageY + 12) + 'px'; }
                });
                n.on('mouseout', () => { if (tip) tip.style.display = 'none'; });
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
