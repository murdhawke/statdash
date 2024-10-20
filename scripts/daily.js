const axios = require('axios');
const fs = require('fs');
const csvWriter = require('csv-write-stream');
require('dotenv').config();

const apiUrl = 'https://v3.football.api-sports.io/fixtures'; // Ensure the correct API URL

const config = {
    headers: {
        'x-apisports-key': process.env.API_KEY, // Use the correct header for API Sports
    },
};

// Function to fetch the latest Premier League results
async function fetchPremierLeagueResults() {
    try {
        // Make the API request to get the latest fixtures
        const response = await axios.get(apiUrl, {
            headers: config.headers,
            params: {
                league: 39, // Use league ID directly
                season: 2024, // Specify the season
            },
        });

        const fixtures = response.data.response;

        if (fixtures.length === 0) {
            console.log('No results found for the latest fixtures.');
            return;
        }

        // Create CSV writer with headers
        const csvFilePath = './premier_league_results.csv';
        let writer;

        if (!fs.existsSync(csvFilePath)) {
            writer = csvWriter({ headers: ['Date', 'Home Team', 'Score', 'Away Team', 'Venue', 'Referee'] });
            writer.pipe(fs.createWriteStream(csvFilePath));
        } else {
            writer = csvWriter({ sendHeaders: false });
            writer.pipe(fs.createWriteStream(csvFilePath, { flags: 'a' }));
        }

        // Iterate over fixtures and write data to CSV
        fixtures.forEach((fixture) => {
            const date = fixture.fixture.date;
            const homeTeam = fixture.teams.home.name;
            const awayTeam = fixture.teams.away.name;
            const score = `${fixture.goals.home} - ${fixture.goals.away}`;
            const venue = fixture.fixture.venue.name;
            const referee = fixture.fixture.referee ? fixture.fixture.referee.name : 'N/A';

            writer.write([date, homeTeam, score, awayTeam, venue, referee]);
            console.log(`Saved match: ${homeTeam} ${score} ${awayTeam}`);
        });

        writer.end();
        console.log('Scraping and saving completed.');
        // Removed process.exit(0); to keep the script running
    } catch (error) {
        console.error('Error fetching Premier League results:', error.response ? error.response.data : error.message);
    }
}

// Export the function to use in main.js
module.exports = { fetchPremierLeagueResults };
