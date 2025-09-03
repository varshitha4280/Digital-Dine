const fs = require('fs'); // File system module for reading files
const csv = require('csv-parser'); // CSV parsing library
const sqlite3 = require('sqlite3').verbose(); // SQLite database library

// Connect to your SQLite database
const db = new sqlite3.Database('./restaurant.db');

fs.createReadStream('cspdata.csv')
    .pipe(csv()) // Parse the CSV data
    .on('data', (row) => {
        // Process each row of the CSV
        db.run(
            `INSERT INTO menu_items (item_name, price, container_name) VALUES (?, ?, ?)`,
            [row['Item Name'], parseFloat(row['Costs'].replace('Rs. ', '')), row['Container Name']],
            (err) => {
                if (err) {
                    console.error(err.message);
                }
            }
        );
    })
    .on('end', () => {
        // Called when the CSV file has been fully processed
        console.log('CSV file successfully processed');
        db.close(); // Close the database connection
    });