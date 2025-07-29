# Singapore 2020 Election Candidates - Sankey Diagram

This visualization creates an interactive vertical Sankey diagram showing the flow of candidates from political parties to gender categories for the 2020 Singapore General Election.

## Features

- **Interactive Filtering**: Filter candidates by party and/or gender
- **Hover Effects**: Hover over nodes and links to see detailed information
- **Statistics Panel**: Shows real-time statistics based on current filters
- **Responsive Design**: Works on different screen sizes
- **Color Coding**: Different colors for each party and gender

## Files

- `index.html` - Main HTML file with the visualization interface
- `sankey-visualization.js` - JavaScript code for data processing and D3.js visualization
- `candidates2020.json` - Source data file (already present)

## How to Use

1. Open `index.html` in a web browser
2. The visualization will automatically load the candidates data
3. Use the filter dropdowns to:
   - **Party Filter**: Select one or more political parties (hold Ctrl/Cmd to select multiple)
   - **Gender Filter**: Select Male, Female, or both
4. Click "Update Chart" to apply filters
5. Click "Reset Filters" to show all data
6. Hover over nodes and links to see detailed information

## Data Flow

The Sankey diagram shows:
- **Left side**: Political parties with the number of candidates
- **Right side**: Gender categories (Male/Female)
- **Links**: Flow lines showing how many candidates of each gender belong to each party

## Technical Details

- Built with D3.js v7 and d3-sankey
- Uses modern JavaScript (ES6+)
- Responsive CSS design
- No server required - runs entirely in the browser

## Browser Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for loading D3.js from CDN)

## Party Abbreviations

- PAP: People's Action Party
- WP: Workers' Party
- PSP: Progress Singapore Party
- SDP: Singapore Democratic Party
- NSP: National Solidarity Party
- RP: Reform Party
- PV: People's Voice
- SDA: Singapore Democratic Alliance
- RDU: Red Dot United
- SPP: Singapore People's Party
