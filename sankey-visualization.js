let candidatesData = [];
let filteredData = [];
let allParties = [];

const partyColors = {
    'PAP': '#FF6B6B',
    'WP': '#4ECDC4',
    'PSP': '#45B7D1',
    'SDP': '#96CEB4',
    'NSP': '#FFEAA7',
    'RP': '#DDA0DD',
    'PV': '#FFB347',
    'SDA': '#98D8C8',
    'RDU': '#F7DC6F',
    'SPP': '#BB8FCE'
};

const genderColors = {
    'M': '#74B9FF',
    'F': '#FD79A8'
};

const partyNames = {
    'PAP': 'People\'s Action Party',
    'WP': 'Workers\' Party',
    'PSP': 'Progress Singapore Party',
    'SDP': 'Singapore Democratic Party',
    'NSP': 'National Solidarity Party',
    'RP': 'Reform Party',
    'PV': 'People\'s Voice',
    'SDA': 'Singapore Democratic Alliance',
    'RDU': 'Red Dot United',
    'SPP': 'Singapore People\'s Party'
};

async function loadData() {
    try {
        const response = await fetch('candidates2020.json');
        candidatesData = await response.json();
        
        filteredData = [...candidatesData];
        updateChart();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading candidates data. Please make sure candidates2020.json is in the same directory.');
    }
}


// Sankey
function createSankeyData() {
    const partyCounts = {};
    const genderCounts = { 'M': 0, 'F': 0 };
    const partyGenderCounts = {};
    
    filteredData.forEach(candidate => {
        const party = candidate.party;
        const gender = candidate.gender;
        
        partyCounts[party] = (partyCounts[party] || 0) + 1;
        
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        
        const key = `${party}-${gender}`;
        partyGenderCounts[key] = (partyGenderCounts[key] || 0) + 1;
    });
    
    // create nodes
    const nodes = [];
    const nodeMap = {};
    let nodeIndex = 0;
    
    // party nodes - left 
    Object.keys(partyCounts).forEach(party => {
        nodes.push({
            id: nodeIndex,
            name: party,
            type: 'party',
            value: partyCounts[party],
            color: partyColors[party] || '#95A5A6'
        });
        nodeMap[party] = nodeIndex++;
    });
    
    // gender nodes - right 
    Object.keys(genderCounts).forEach(gender => {
        if (genderCounts[gender] > 0) {
            nodes.push({
                id: nodeIndex,
                name: gender === 'M' ? 'Male' : 'Female',
                type: 'gender',
                value: genderCounts[gender],
                color: genderColors[gender]
            });
            nodeMap[gender] = nodeIndex++;
        }
    });
    
    const links = [];
    Object.keys(partyGenderCounts).forEach(key => {
        const [party, gender] = key.split('-');
        if (partyGenderCounts[key] > 0) {
            links.push({
                source: nodeMap[party],
                target: nodeMap[gender],
                value: partyGenderCounts[key]
            });
        }
    });
    
    return { nodes, links };
}

// update chart
function updateChart() {
    filteredData = candidatesData;
    
    d3.select("#chart").selectAll("*").remove();
    
    if (filteredData.length === 0) {
        d3.select("#chart")
            .append("div")
            .style("text-align", "center")
            .style("padding", "50px")
            .style("color", "#666")
            .text("No data available for the selected filters.");
        return;
    }
    
    // create Sankey data
    const sankeyData = createSankeyData();
    
    const partyNodes = sankeyData.nodes.filter(d => d.type === 'party');
    const genderNodes = sankeyData.nodes.filter(d => d.type === 'gender');
    
    if (partyNodes.length > 0 && genderNodes.length > 0) {
        const totalPartyValue = partyNodes.reduce((sum, d) => sum + d.value, 0);
        const totalGenderValue = genderNodes.reduce((sum, d) => sum + d.value, 0);
        
        const scaleFactor = (totalPartyValue * 8) / totalGenderValue; 
        
        genderNodes.forEach(node => {
            node.value = node.value * scaleFactor;
        });
        
        sankeyData.links.forEach(link => {
            const targetNode = sankeyData.nodes[link.target];
            if (targetNode.type === 'gender') {
                link.value = link.value * scaleFactor;
            }
        });
    }
    
    // dimensions for vertical Sankey
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", height + margin.top + margin.bottom)
        .attr("height", width + margin.left + margin.right)
        .style("display", "block")
        .style("margin", "0 auto");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.top},${margin.left}) rotate(-90 ${width/2} ${width/2})`);

    const sankey = d3.sankey()
        .nodeWidth(30)
        .nodePadding(2) 
        .extent([[1, 1], [width - 1, height - 1]])
        .nodeAlign(d3.sankeyJustify)
        .nodeSort((a, b) => {
            if (a.type === 'gender' && b.type === 'gender') {
                return b.name.localeCompare(a.name);
            }
            return 0;
        });
    
    const graph = sankey(sankeyData);
    
    // tooltip
    const tooltip = d3.select("#tooltip");

    const defs = svg.append("defs");
    
    // gradient for each link
    const gradients = defs.selectAll("linearGradient")
        .data(graph.links)
        .enter().append("linearGradient")
        .attr("id", (d, i) => `gradient-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", d => d.source.x1)
        .attr("y1", d => d.source.y0 + (d.source.y1 - d.source.y0) / 2)
        .attr("x2", d => d.target.x0)
        .attr("y2", d => d.target.y0 + (d.target.y1 - d.target.y0) / 2);
    
    // gradients color stops  
    gradients.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d => {
            const targetNode = graph.nodes[d.target.index];
            if (targetNode.name === 'Male') {
                return "#999999";
            }
            return partyColors[graph.nodes[d.source.index].name] || '#95A5A6';
        })
        .attr("stop-opacity", d => {
            const targetNode = graph.nodes[d.target.index];
            return targetNode.name === 'Male' ? 0.5 : 0.9;
        });
    
    gradients.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d => {
            const targetNode = graph.nodes[d.target.index];
            if (targetNode.name === 'Male') {
                return "#d3d3d3";
            }
            return genderColors[targetNode.name === 'Male' ? 'M' : 'F'];
        })
        .attr("stop-opacity", d => {
            const targetNode = graph.nodes[d.target.index];
            return targetNode.name === 'Male' ? 0.5 : 0.9;
        });

    // greyed out male  node
    const maleGradient = defs.append("linearGradient")
        .attr("id", "male-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", sankey.nodeWidth() * 3)
        .attr("y2", 0);
    
    maleGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#d3d3d3")
        .attr("stop-opacity", 0.5);
    
    maleGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#e8e8e8")
        .attr("stop-opacity", 0.5);
    
    maleGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#f5f5f5")
        .attr("stop-opacity", 0.5);

    // female node gradient
    const femaleGradient = defs.append("linearGradient")
        .attr("id", "female-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", sankey.nodeWidth() * 3)
        .attr("y2", 0);
    
    femaleGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#ff91b7ff")
        .attr("stop-opacity", 1);
    
    femaleGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#FF9FC4")
        .attr("stop-opacity", 1);
    
    femaleGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#ffffff")
        .attr("stop-opacity", 1);

    // party nodes gradients
    const actualParties = graph.nodes.filter(d => d.type === 'party').map(d => d.name);
    actualParties.forEach(party => {
        // Check if this party has any links to male nodes
        const hasLinksToMale = graph.links.some(link => 
            graph.nodes[link.source.index].name === party && 
            graph.nodes[link.target.index].name === 'Male'
        );
        
        const partyGradient = defs.append("linearGradient")
            .attr("id", `party-gradient-${party}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", sankey.nodeWidth())
            .attr("y2", 0);
        
        partyGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffff")
            .attr("stop-opacity", 1);
        
        partyGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", hasLinksToMale ? "#999999" : (partyColors[party] || '#95A5A6'))
            .attr("stop-opacity", hasLinksToMale ? 0.5 : 0.9);
    });

    const linkGroup = g.append("g");
    
    const maleLinks = linkGroup.selectAll(".link-male")
        .data(graph.links.filter(d => graph.nodes[d.target.index].name === 'Male'))
        .enter().append("path")
        .attr("class", "link link-male")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", (d, i) => {
            const originalIndex = graph.links.indexOf(d);
            return `url(#gradient-${originalIndex})`;
        })
        .attr("stroke-width", d => Math.max(1, d.width))
        .style("fill", "none")
        .style("stroke-opacity", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${graph.nodes[d.source.index].name} → ${graph.nodes[d.target.index].name}<br/>Candidates: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Draw female links on top
    const femaleLinks = linkGroup.selectAll(".link-female")
        .data(graph.links.filter(d => graph.nodes[d.target.index].name === 'Female'))
        .enter().append("path")
        .attr("class", "link link-female")
        .attr("id", (d, i) => `female-link-${i}`)
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", (d, i) => {
            // Find the original index for the gradient
            const originalIndex = graph.links.indexOf(d);
            return `url(#gradient-${originalIndex})`;
        })
        .attr("stroke-width", d => Math.max(1, d.width))
        .style("fill", "none")
        .style("stroke-opacity", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${graph.nodes[d.source.index].name} → ${graph.nodes[d.target.index].name}<br/>Candidates: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Add nodes - draw male nodes first, then female nodes for proper layering
    const nodeGroup = g.append("g");
    
    // Draw male nodes first (background)
    const maleNodes = nodeGroup.selectAll(".node-male")
        .data(graph.nodes.filter(d => d.type !== 'gender' || d.name === 'Male'))
        .enter().append("g")
        .attr("class", "node node-male")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    maleNodes.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.type === 'gender' ? sankey.nodeWidth() * 3 : sankey.nodeWidth())
        .style("fill", d => {
            if (d.type === 'gender' && d.name === 'Male') {
                return "url(#male-gradient)";
            }
            if (d.type === 'party') {
                return `url(#party-gradient-${d.name})`;
            }
            return d.color;
        })
        .style("stroke", "none")
        .style("stroke-width", "0")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.name}<br/>Candidates: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Draw female nodes on top
    const femaleNodes = nodeGroup.selectAll(".node-female")
        .data(graph.nodes.filter(d => d.type === 'gender' && d.name === 'Female'))
        .enter().append("g")
        .attr("class", "node node-female")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    femaleNodes.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => sankey.nodeWidth() * 3)
        .style("fill", "url(#female-gradient)")
        .style("stroke", "none")
        .style("stroke-width", "0")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.name}<br/>Candidates: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
//  title
    const maleGenderNode = graph.nodes.find(d => d.type === 'gender' && d.name === 'Male');
    if (maleGenderNode) {
        const titleDiv = d3.select("#chart")
            .append("div")
            .style("position", "absolute")
            .style("left", "46%")
            .style("top", "72px")
            .style("transform", "translateX(-50%)")
            .style("text-align", "left")
            .style("font-size", "36px")
            .style("font-weight", "bold")
            .style("font-family", "Gotham, sans-serif")
            .style("color", "#666")
            .style("letter-spacing", "0px")
            .style("line-height", "1.2")
            .style("pointer-events", "none")
            .html("From Candidates to Seats: <br><span style='font-size: 32px; color: #e24a3fff; letter-spacing: -1px;'>How Singapore's Women  <br>Stack Up Globally</span>");

        // lorem description
        d3.select("#chart")
            .append("div")
            .style("position", "absolute")
            .style("left", "41.2%")
            .style("top", "225px")
            .style("transform", "translateX(-50%)")
            .style("width", "300px")
            .style("text-align", "left")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("font-family", "Gotham, sans-serif")
            .style("color", "#666")
            .style("line-height", "1.4")
            .style("pointer-events", "none")
            .html("<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>");

        // women percentage statement
        const totalCandidates = filteredData.length;
        const femaleCount = filteredData.filter(d => d.gender === 'F').length;
        const femalePercentage = ((femaleCount / totalCandidates) * 100).toFixed(1);
        const uniqueParties = new Set(filteredData.map(d => d.party)).size;
        
        d3.select("#chart")
            .append("div")
            .style("position", "absolute")
            .style("left", "51%")
            .style("top", "1010px")
            .style("transform", "translateX(-50%)")
            .style("width", "700px")
            .style("text-align", "left")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("font-family", "Gotham, sans-serif")
            .style("color", "#666666ff")
            .style("letter-spacing", "0.5px")
            .style("line-height", "1.5")
            .style("text-transform", "uppercase")
            .style("pointer-events", "none")
            .html(`*Women represent <span style="font-size: 12px; color: #e95247;">${femalePercentage}%</span> of all candidates in Singapore's 2020 election, with a total candidates of <span style="font-size: 12px; color: #0e77eeff;">${totalCandidates}</span>, from <span style="font-size: 12px; color: #0e77eeff;">${uniqueParties}</span> Parties.`);

    }
    

    const labelGroup = g.append("g").attr("class", "link-labels");
    
    // only show labels for female links
    const femaleLinksForLabels = graph.links.filter(d => graph.nodes[d.target.index].name === 'Female');
    
    //  text follow the curve of  female link
    labelGroup.selectAll("text")
        .data(femaleLinksForLabels)
        .enter().append("text")
        .attr("class", "link-label")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("font-family", "Gotham, sans-serif")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "2px")
        .style("fill", "#666")
        .style("opacity", 0.9)
        .attr("dy", d => {
            const sourceNode = graph.nodes[d.source.index];
            if (sourceNode.name === 'PAP') {
                return "-46px";
            } else if (sourceNode.name === 'PSP' || sourceNode.name === 'WP') {
                return "-12px";
            } else if (sourceNode.name === 'RDU') {
                return "-7px";
            } else {
                return "-5px";
            }
        })
        .append("textPath")
        .attr("href", (d, i) => `#female-link-${i}`)
        .attr("startOffset", "0.1%")
        .text(d => {
            const sourceNode = graph.nodes[d.source.index];
            return partyNames[sourceNode.name] || sourceNode.name;
        });
}

document.addEventListener('DOMContentLoaded', loadData);
