(function () {
    "use strict";

    const WIKI_BASE_URL = "https://github.com/stsnsn/SAR11_Atlas/wiki/";

    // Edit this file to update citation information across the Atlas.
    const COMMON_CITATIONS = [
        {
            authors: "Nishino et al.",
            title: "SAR11 Genome Atlas.",
            publication: "in prep."
        },
        {
            authors: "Nishino et al.",
            title: "Functional Unknomics of the SAR11 clade using bioinformatics approaches.",
            publication: "bioRxiv 2025."
        }
    ];

    const PAGE_SETTINGS = {
        "Overview.html": { wiki: "Overview", wikiTitle: "Overview" },
        "SAR11_phylogeny.html": { wiki: "SAR11-Genome-Information", wikiTitle: "SAR11 Genome Information" },
        "SAR11_OG_info.html": { wiki: "OG-Information-Viewer", wikiTitle: "OG Information Viewer" },
        "og_list.html": { wiki: "All-OG-List", wikiTitle: "All OG List" },
        "SAR11_operon_vis.html": { wiki: "Neighboring-Genes", wikiTitle: "Neighboring Genes" },
        "Neighborhood_network.html": { wiki: "Neighboring-Network", wikiTitle: "Neighboring Network" },
        "Corgias_network.html": {
            wiki: "CORGIAS-Network",
            wikiTitle: "CORGIAS Network",
            citations: [
                {
                    authors: "Nishimura et al.",
                    title: "CORGIAS: identifying correlated gene pairs by considering evolutionary history in a large-scale prokaryotic genome dataset.",
                    publication: "NAR Genomics and Bioinformatics 7(4), lqaf182 (2025).",
                    doi: "https://doi.org/10.1093/nargab/lqaf182"
                }
            ],
            insertAdditionalAfter: 0
        },
        "metaT.html": { wiki: "Metatranscriptome-Viewer", wikiTitle: "Metatranscriptome Viewer" },
        "genes_linked_to_3d_structures.html": { wiki: "Protein-Structures", wikiTitle: "Protein Structures" },
        "SAR11_History.html": { wiki: "Literatures", wikiTitle: "Literature" },
        "download.html": { wiki: "Download", wikiTitle: "Download" }
    };

    function currentPageName() {
        const pathParts = window.location.pathname.split("/");
        return pathParts[pathParts.length - 1] || "Overview.html";
    }

    function citationParagraph(citation) {
        const paragraph = document.createElement("p");
        paragraph.append(document.createTextNode(`${citation.authors} `));

        const title = document.createElement("strong");
        title.textContent = `"${citation.title}"`;
        paragraph.append(title, document.createTextNode(" "));

        const publication = document.createElement("em");
        publication.textContent = citation.publication;
        paragraph.append(publication);

        if (citation.doi) {
            const doi = document.createElement("a");
            doi.href = citation.doi;
            doi.target = "_blank";
            doi.rel = "noopener noreferrer";
            doi.textContent = "DOI";
            paragraph.append(document.createTextNode(" "), doi);
        }

        return paragraph;
    }

    function citationsForPage(settings) {
        const citations = COMMON_CITATIONS.slice();
        if (!settings.citations) return citations;

        const insertAt = Number.isInteger(settings.insertAdditionalAfter)
            ? settings.insertAdditionalAfter + 1
            : citations.length;
        citations.splice(insertAt, 0, ...settings.citations);
        return citations;
    }

    function renderCitation(container, settings) {
        const wikiGuide = document.createElement("p");
        wikiGuide.className = "atlas-wiki-guide";

        const wikiLink = document.createElement("a");
        wikiLink.href = WIKI_BASE_URL + settings.wiki;
        wikiLink.target = "_blank";
        wikiLink.rel = "noopener noreferrer";
        wikiLink.textContent = `Read the ${settings.wikiTitle} guide on the Wiki`;
        wikiGuide.append(wikiLink);
        container.before(wikiGuide);

        const heading = document.createElement("h2");
        heading.textContent = "Citation information";
        container.replaceChildren(heading);
        citationsForPage(settings).forEach((citation) => {
            container.append(citationParagraph(citation));
        });
    }

    const pageName = currentPageName();
    const settings = PAGE_SETTINGS[pageName];
    if (!settings) return;

    document.querySelectorAll("[data-page-citation]").forEach((container) => {
        renderCitation(container, settings);
    });
}());
