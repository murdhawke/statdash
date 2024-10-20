const express = require('express');
const axios = require('axios');
const fs = require('fs');
const csvWriter = require('csv-write-stream');
require('dotenv').config(); // To load environment variables from a .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Configure the API settings (RapidAPI or API-Sports)
const apiProvider = process.env.API_PROVIDER // Set API provider ('api-sports' or 'rapidapi')
const apiKey = process.env.API_KEY  // Set your API key here

// Set the API URL based on provider
const apiUrl =
  apiProvider === 'rapidapi'
    ? 'https://api-football-v1.p.rapidapi.com/v3/fixtures'
    : 'https://v3.football.api-sports.io/fixtures';

// Set the headers based on the provider
const apiHeaders =
  apiProvider === 'rapidapi'
    ? {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      }
    : {
        'x-apisports-key': apiKey,
      };

// Premier League League ID and season
const leagueId = 39; // Premier League ID
const season = 2024; // The season you want to fetch data for

// Function to fetch the current gameweek Premier League results
async function fetchPremierLeagueResults() {
  try {
    const today = '2024-10-19'; // 'YYYY-MM-DD' format

    // Make the API request
    const response = await axios.get(apiUrl, {
      headers: apiHeaders,
      params: {
        league: leagueId,
        season: season,
        from: today,
        to: today, // Modify if you want a different date range
      },
    });

    const fixtures = response.data.response;

    if (fixtures.length === 0) {
      console.log('No results found for the current gameweek.');
      return;
    }

    // Create CSV writer with headers
    const writer = csvWriter({ headers: ['Date', 'Home Team', 'Score', 'Away Team', 'Venue', 'Referee'] });
    const csvFilePath = './premier_league_results.csv';

    // If the CSV file doesn't exist, create it with headers
    if (!fs.existsSync(csvFilePath)) {
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
      const referee = fixture.fixture.referee;

      writer.write([date, homeTeam, score, awayTeam, venue, referee]);
      console.log(`Saved match: ${homeTeam} ${score} ${awayTeam}`);
    });

    writer.end();
    console.log('Scraping and saving completed.');
  } catch (error) {
    console.error('Error fetching Premier League results:', error);
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

  