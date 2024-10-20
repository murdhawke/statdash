const express = require('express');
const axios = require('axios');
const fs = require('fs');
const csvWriter = require('csv-write-stream');
require('dotenv').config(); // To load environment variables from a .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Configure the API settings (API-Sports)
const apiKey = process.env.API_KEY; // Set your API key here
const apiUrl = 'https://v3.football.api-sports.io/fixtures'; // Correct API URL
const config = {
    headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
    }
};

// Function to fetch the current Premier League results for the season
async function fetchPremierLeagueResults() {
    try {
        console.log(`Fetching fixtures for League ID ${39} and Season ${2024}`);

        // Make the API request
        const response = await axios.get(apiUrl, {
            headers: config.headers,
            params: {
                league: 39,  // Use league ID directly
                season: 2024,    // Specify the season
                // Uncomment the line below if the API supports a 'status' parameter
                // status: 'all', 
            },
        });

        // Log the full API response for debugging
        console.log(response.data); 

        const fixtures = response.data.response;

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
            const referee = fixture.fixture.referee ? fixture.fixture.referee.name : 'N/A'; // Check if referee info is available

            writer.write([date, homeTeam, score, awayTeam, venue, referee]);
            console.log(`Saved match: ${homeTeam} ${score} ${awayTeam}`);
        });

        writer.end();
        console.log('Scraping and saving completed.');
    } catch (error) {
        console.error('Error fetching Premier League results:', error.response ? error.response.data : error.message);
    }
}

// Route to manually trigger fetching results
app.get('/fetch-results', async (req, res) => {
    await fetchPremierLeagueResults();
    res.send('Premier League results fetched and saved to CSV.');
});

// Run server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
