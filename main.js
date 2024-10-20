const express = require('express');
const { fetchPremierLeagueResults } = require('./scripts/daily'); // Adjust path if necessary
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Route to manually trigger fetching results
app.get('/fetch-results', async (req, res) => {
    await fetchPremierLeagueResults();
    res.send('Premier League results fetched and saved to CSV.');
});

// Run server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
