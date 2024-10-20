// Load environment variables from .env
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// MySQL connection configuration, now using environment variables
const connectionConfig = {
    host: 'localhost',
    user: process.env.DB_USER || 'amos',
    password: process.env.DB_PASSWORD || 'Darth777.',
    database: process.env.DB_NAME || 'dash',
};

// Function to create a MySQL table based on CSV file headers
async function createTableFromCSV(connection, tableName, headers) {
    try {
        const columns = headers.map(header => `\`${header}\` TEXT`).join(', ');
        const createTableQuery = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (${columns})`;
        
        await connection.query(createTableQuery);
        console.log(`Table "${tableName}" created successfully.`);
    } catch (error) {
        console.error(`Error creating table "${tableName}":`, error.message);
    }
}

// Function to insert data from CSV into MySQL table
async function insertDataIntoTable(connection, tableName, rowData) {
    try {
        const placeholders = rowData.map(() => '?').join(', ');
        const insertQuery = `INSERT INTO \`${tableName}\` VALUES (${placeholders})`;
        
        await connection.query(insertQuery, rowData);
    } catch (error) {
        console.error(`Error inserting data into "${tableName}":`, error.message);
    }
}

// Function to process and import a single CSV file
async function importCSVToMySQL(connection, csvFilePath) {
    return new Promise((resolve, reject) => {
        const tableName = path.basename(csvFilePath, '.csv'); // Extract table name from CSV file name
        const rows = [];
        let headers = [];

        // Read and parse the CSV file
        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('headers', (headerRow) => {
                headers = headerRow; // Save headers for table creation
            })
            .on('data', (row) => {
                rows.push(Object.values(row)); // Push row data (array of values)
            })
            .on('end', async () => {
                try {
                    await createTableFromCSV(connection, tableName, headers);
                    for (const row of rows) {
                        await insertDataIntoTable(connection, tableName, row);
                    }
                    console.log(`Data from "${csvFilePath}" imported successfully into "${tableName}".`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Main function to iterate through all CSV files and import them into MySQL
async function importCSVsIntoMySQL(csvDirectory) {
    let connection;

    try {
        connection = await mysql.createConnection(connectionConfig);
        const csvFiles = fs.readdirSync(csvDirectory).filter(file => file.endsWith('.csv'));

        // Import each CSV file
        for (const csvFile of csvFiles) {
            const csvFilePath = path.join(csvDirectory, csvFile);
            await importCSVToMySQL(connection, csvFilePath);
        }
        console.log('All CSV files have been imported successfully.');
    } catch (error) {
        console.error('Error during import process:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Example usage: Provide the path to the directory containing your CSV files
const csvDirectory = '../csv/';
importCSVsIntoMySQL(csvDirectory);

// Export the function
module.exports = { importCSVsIntoMySQL };
