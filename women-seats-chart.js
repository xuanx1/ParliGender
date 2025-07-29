// Global variables
let womenSeatsData = [];
let processedData = [];
let singaporeData = null;

// Chart dimensions
const margin = { top: 40, right: 80, bottom: 60, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Load and process data
async function loadData() {
    try {
        const response = await fetch('seats_by_women@1.json');
        womenSeatsData = await response.json();
        
        processData();
        createChart();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading women seats data. Please make sure seats_by_women@1.json is in the same directory.');
    }
}

function processData() {
    const years = [];
    
    for (let year = 1990; year <= 2019; year++) {
        years.push(year.toString());
    }
    
    processedData = [];
    
    womenSeatsData.forEach(country => {
        const countryData = {
            country: country["Country Name"],
            code: country["Country Code"],
            values: []
        };
        
        years.forEach(year => {
            const value = country[year];
            if (value !== null && value !== undefined && !isNaN(value)) {
                countryData.values.push({
                    year: parseInt(year),
                    value: parseFloat(value)
                });
            }
        });
        
        // Only include countries with at least 5 data points
        if (countryData.values.length >= 5) {
            processedData.push(countryData);
        }
        
        // Store Singapore data separately
        if (country["Country Name"] === "Singapore") {
            singaporeData = countryData;
        }
    });
    
    // Update country count
    const countElement = document.getElementById('country-count');
    if (countElement) {
        countElement.textContent = processedData.length;
    }
    
    console.log(`Processed data for ${processedData.length} countries`);
    console.log('Singapore data:', singaporeData);
}

// Create the line chart
function createChart() {
    // Clear any existing chart
    d3.select("#line-chart").selectAll("*").remove();
    
    // description
    // Add summary description with Singapore's ranking, highest and lowest ranking countries
    const latestYear = 2019;
    // Get latest value for each country
    const latestValues = processedData.map(d => {
        const latest = d.values.find(v => v.year === latestYear);
        return {
            country: d.country,
            value: latest ? latest.value : null
        };
    }).filter(d => d.value !== null);

    // Sort by value descending
    latestValues.sort((a, b) => b.value - a.value);

    // Find Singapore's ranking
    const sgRank = latestValues.findIndex(d => d.country === "Singapore") + 1;
    const sgValue = latestValues.find(d => d.country === "Singapore")?.value;

    // Highest and lowest ranking countries
    const highest = latestValues[0];
    const lowest = latestValues[latestValues.length - 1];

    // Calculate percentage change for Singapore
    let change = 'N/A';
    if (singaporeData && singaporeData.values.length > 0) {
        const firstValue = singaporeData.values[0]?.value;
        const lastValue = singaporeData.values[singaporeData.values.length - 1]?.value;
        if (firstValue !== undefined && lastValue !== undefined) {
            change = (lastValue - firstValue).toFixed(1) + '%';
        }
    }

    d3.select("#line-chart")
        .append("div")
        .style("position", "absolute")
        .style("left", "43%")
        .style("bottom", "-420px")
        .style("transform", "translateX(-50%)")
        .style("width", "320px")
        .style("text-align", "left")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("font-family", "Gotham, sans-serif")
        .style("color", "#666")
        .style("line-height", "1.4")
        .style("pointer-events", "none")
        .html(`
            <p>
                The percentage of Parliamentary Seats held by Women from 1990 to 2019, showing the evolution of gender representation in politics in each country.
                <br><br>
                In ${latestYear}, <span style="color:#e95247;">Singapore</span> ranked #${sgRank} at <span style="color:#0e77eeff;">${sgValue ? sgValue.toFixed(1) : 'N/A'}%</span> out of ${latestValues.length} countries with a percentage change of <span style="color:#0e77eeff;">${change}</span>. The parliament with highest female representation goes to
                <span style="color:#e95247;">${highest.country}</span> at <span style="color:#0e77eeff;">${highest.value.toFixed(1)}%</span>, and <span style="color:#e95247;">${lowest.country}</span> at the lowest with <span style="color:#0e77eeff;">${lowest.value.toFixed(1)}%</span>.<br><br>
                Hover over lines and points for details.
            </p>
        `);
    
    // Create SVG
    const svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("display", "block")
        .style("margin", "0 auto");
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain([1990, 2019])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 70]) 
        .range([height, 0]);
    
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
    
    const tooltip = d3.select("#tooltip");
    
    const xGridLines = g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`);
    
    xGridLines.selectAll("line")
        .data(xScale.ticks(6))
        .enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", -height);
    
    const yGridLines = g.append("g")
        .attr("class", "grid");
    
    yGridLines.selectAll("line")
        .data(yScale.ticks(6))
        .enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d));
    
    // Add axes
    const xAxis = g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")));
    
    const yAxis = g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d + "%"));
    
    //  axis labels
    // g.append("text")
    //     .attr("class", "axis-label")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 0 - margin.left)
    //     .attr("x", 0 - (height / 2))
    //     .attr("dy", "1em")
    //     .style("text-anchor", "middle")
    //     .text("Percentage of Parliamentary Seats Held by Women");
    
    // g.append("text")
    //     .attr("class", "axis-label")
    //     .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
    //     .style("text-anchor", "middle")
    //     .text("Year");
    
    // grey lines other countries, red for sg
    const otherCountries = processedData.filter(d => d.country !== "Singapore");
    const highestCountry = highest.country;
    const lowestCountry = lowest.country;
    
    const countryLines = g.selectAll(".country-line")
        .data(otherCountries)
        .enter()
        .append("g")
        .attr("class", "country-line");
    
    countryLines.append("path")
        .attr("class", d => {
            if (d.country === highestCountry) return "line highest";
            if (d.country === lowestCountry) return "line lowest";
            return "line other";
        })
        .attr("d", d => line(d.values))
        .style("stroke", d => {
            if (d.country === highestCountry) return "#8a8a8aff"; //highest
            if (d.country === lowestCountry) return "#8a8a8aff"; //lowest
            return "#ddd";
        })
        .style("stroke-width", d => (d.country === highestCountry || d.country === lowestCountry) ? "3px" : "1px")
        .style("opacity", d => (d.country === highestCountry || d.country === lowestCountry) ? 1 : 0.4)
        .on("mouseover", function(event, d) {
            const latestValue = d.values[d.values.length - 1];
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>${d.country}</strong><br/>
                Latest: ${latestValue ? latestValue.value.toFixed(1) : 'N/A'}% (${latestValue ? latestValue.year : 'N/A'})<br/>
                Data points: ${d.values.length}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add labels for highest and lowest lines
    [highest, lowest].forEach((countryObj, i) => {
        const lastValue = countryObj.value;
        g.append("text")
            .attr("x", xScale(latestYear) + 10)
            .attr("y", yScale(lastValue))
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", i === 0 ? "#8a8a8aff" : "#8a8a8aff")
            .style("text-anchor", "start")
            .text(i === 0 ? `${countryObj.country}` : `${countryObj.country}`);
    });
    

        if (singaporeData && singaporeData.values.length > 0) {
        const singaporeLine = g.append("g")
            .attr("class", "singapore-line");
        
        singaporeLine.append("path")
            .datum(singaporeData.values)
            .attr("class", "line singapore")
            .attr("d", line)
            .on("mouseover", function(event) {

                const latestValue = singaporeData.values[singaporeData.values.length - 1];
                const firstValue = singaporeData.values[0];
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`
                    <strong>Singapore</strong><br/>
                    Current: ${latestValue ? latestValue.value.toFixed(1) : 'N/A'}% (${latestValue ? latestValue.year : 'N/A'})<br/>
                    First recorded: ${firstValue ? firstValue.value.toFixed(1) : 'N/A'}% (${firstValue ? firstValue.year : 'N/A'})<br/>
                    Change: +${latestValue && firstValue ? (latestValue.value - firstValue.value).toFixed(1) : 'N/A'}%
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });        
        // sg data points dots
        singaporeLine.selectAll(".dot")
            .data(singaporeData.values)
            .enter()
            .append("circle")
            .attr("class", "highlight-dot")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.value))
            .attr("r", 4)
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 1);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`
                    <strong>Singapore ${d.year}</strong><br/>
                    ${d.value.toFixed(1)}% of parliamentary seats
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0);
                
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Add label for Singapore
        const lastPoint = singaporeData.values[singaporeData.values.length - 1];
        if (lastPoint) {
            g.append("text")
                .attr("x", xScale(lastPoint.year) + 10)
                .attr("y", yScale(lastPoint.value))
                .attr("dy", "0.35em")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("fill", "#e24a3f")
                .text("Singapore");
        }
    }
}

document.addEventListener('DOMContentLoaded', loadData);
