const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const xlsx = require('xlsx'); // Import the xlsx library
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const port = 3004;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index1.html'));
});

app.post('/api/login', async (req, res) => {
    console.log('Login request:', req.body);
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign({ userId: user.user_id }, 'your-secret-key', { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// In-memory storage for orders
let orders =[];

// Function to read XLSX and convert to JSON
function readMenuFromXLSX(containerName) {
    return new Promise((resolve, reject) => {
        try {
            const filePath = path.join(__dirname, 'containers', `${containerName}.xlsx`);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
            const worksheet = workbook.Sheets[sheetName];
            const menuData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Get data as array of arrays

            const formattedData =[];
            for (let i = 1; i < menuData.length; i++) { // Start from 1 to skip header
                const row = menuData[i];
                formattedData.push({
                    name: row[0], // Assuming item name is in the first column
                    price: parseFloat(row[1].replace('Rs. ', '')), // Assuming price is in the second column
                });
            }

            resolve(formattedData);
        } catch (error) {
            reject(error);
        }
    });
}

// Endpoint to get menu for a specific container
app.get('/api/menu/:containerName', async (req, res) => {
    try {
        const containerName = req.params.containerName;
        const menu = await readMenuFromXLSX(containerName);
        res.json(menu);
    } catch (error) {
        console.error('Error reading menu:', error);
        res.status(500).json({ error: 'Failed to read menu data' });
    }
});

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'your-secret-key');
        req.userId = decoded.userId; // Attach userId to request object
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

app.post('/api/orders', verifyToken, (req, res) => {
    console.log('Order request:', req.body);
    const order = req.body;
    const orderDateTime = new Date(order.orderDateTime);
    const formattedDateTime = orderDateTime.toLocaleString(); 
    const orderId = '#' + Math.floor(100000000 + Math.random() * 900000000); // Generate order ID

    const token = req.headers.authorization.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const userId = decoded.userId;

        const orderWithDateTime = {
            ...order, orderId: orderId,
            items: order.items.map(item => ({ ...item, formattedDateTime })),
        };

        // Insert into the database with user_id
        db.run('INSERT INTO orders (order_id, order_data, user_id) VALUES (?, ?, ?)', [orderId, JSON.stringify(orderWithDateTime), userId], (err) => {
            if (err) {
                console.error('Error saving order:', err);
                res.status(500).json({ error: 'Failed to save order' });
            } else {
                console.log('Order saved:', orderId);
                res.json({ orderId });
            }
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

app.get('/api/orders/history', verifyToken, (req, res) => {
    // Extract user_id from JWT
    const token = req.headers.authorization.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const userId = decoded.userId;

        db.all('SELECT order_data FROM orders WHERE user_id = ?', [userId], (err, rows) => {
            if (err) {
                console.error('Error fetching orders:', err);
                res.status(500).json({ error: 'Failed to fetch orders' });
            } else {
                const orders = rows.map(row => JSON.parse(row.order_data));
                res.json(orders);
            }
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

function logout() {
    localStorage.removeItem('token'); // Remove the token
    window.location.href = 'index1.html'; // Redirect to login page
}


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});