// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for orders
let orders = [];

// Function to read CSV and convert to JSON
function readMenuFromCSV() {
    return new Promise((resolve, reject) => {
        const menuData = {};
        fs.createReadStream('cspdata.csv') // Replace 'menu.csv' with your CSV filename
            .pipe(csv())
            .on('data', (row) => {
                const containerName = row['Container Name'];
                if (!menuData[containerName]) {
                    menuData[containerName] = [];
                }
                menuData[containerName].push({
                    name: row['Item Name'],
                    price: parseFloat(row['Costs'].replace('Rs. ', '')), // Parse price as number
                });
            })
            .on('end', () => resolve(menuData))
            .on('error', (error) => reject(error));
    });
}

app.get('/api/menu', async (req, res) => {
    try {
        const menu = await readMenuFromCSV();
        res.json(menu);
    } catch (error) {
        console.error('Error reading menu:', error);
        res.status(500).json({ error: 'Failed to read menu data' });
    }
});

// ... (rest of your order-related endpoints)
app.post('/api/orders', (req, res) => {
    const order = req.body;
    const orderId = uuidv4(); // Generate a unique order ID
    orders.push({ ...order, orderId }); // Add order to the orders array
    res.json({ orderId }); // Send back the order ID
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});