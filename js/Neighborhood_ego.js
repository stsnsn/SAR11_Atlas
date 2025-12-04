// Ego network prototype: load TSV, build adjacency, extract BFS ego-network, render with Cytoscape
(function(){
    let adjacency = new Map();
    let nodesSet = new Set();
    // annotation map: numeric id -> annotation object { og, COG_LETTER, COG_ID, ko_id }
    let annotMap = new Map();
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

    function extractEgo(start, maxDepth, maxNodes) {
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

    function buildElements(visited) {
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
        const edges = [];
        ids.forEach(u => {
            (adjacency.get(u) || []).forEach(e => {
                const v = e.to;
                if (idSet.has(v)) {
                    // ensure single edge id
                    const eid = `${u}___${v}`;
                    const eidRev = `${v}___${u}`;
                    if (!edges.find(x => x.data && (x.data.id === eid || x.data.id === eidRev))) {
                        edges.push({ data: { id: eid, source: u, target: v } });
                    }
                }
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
            elements: [].concat(elements.nodes, elements.edges),
            style: [
                // default node style: use data(color) for fill but no border by default
                { selector: 'node', style: { 'label': 'data(label)', 'width': 18, 'height': 18, 'background-color': 'data(color)', 'color': '#000', 'text-valign': 'center', 'text-halign': 'center', 'font-size': 10, 'border-width': 0 } },
                // center node (depth=0): highlight by adding an outline only (no background override)
                { selector: 'node[depth = 0]', style: { 'border-width': 2, 'border-color': '#ff7f0e', 'border-opacity': 1, 'border-style': 'solid' } },
                { selector: 'edge', style: { 'width': 1, 'line-color': '#999', 'curve-style': 'bezier' } }
            ],
            layout: { name: 'cose', animate: true, randomize: false }
        });

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
            if (cyInfo) cyInfo.textContent = `Selected node = 0; Visualized node = 0`;
        } catch (e) { /* ignore */ }
        // setup autocomplete for ego node using og_suggest.tsv
        try {
            const ogTxt = await (await fetch('../data/og_suggest.tsv')).text();
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
            const selectedVisited = extractEgoNoLimit(center, maxDepth);
            const visited = extractEgo(center, maxDepth, maxNodes);
            const elements = buildElements(visited);
            renderCy(elements);
            // mark this center and maxNodes as the last extracted and enable exports
            lastExtractCenter = centerRaw;
            lastExtractMaxNodes = maxNodes;
            setExportButtonsEnabled(true);
            // update cyInfo with selected and visualized node counts
            try {
                const cyInfo = document.getElementById('cyInfo');
                if (cyInfo) cyInfo.textContent = `Selected node = ${selectedVisited.size}; Visualized node = ${elements.nodes.length}`;
            } catch (e) { /* ignore */ }
        }

        depthRange.addEventListener('input', () => {
            depthVal.textContent = depthRange.value;
            // auto-update network when the slider changes
            runExtract();
        });

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
