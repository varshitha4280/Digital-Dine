const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./restaurant.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the restaurant database.');

    // Create the menu_items table if it doesn't exist
    db.run(`
        CREATE TABLE IF NOT EXISTS menu_items (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT,
            price REAL,
            container_name TEXT
        )
    `, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('menu_items table created or already exists.');
        }
    });


db.run(`
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('users table created or already exists.');
    }
});
// Create the orders table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT,
        order_data TEXT,
        user_id INTEGER
    )
`, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('orders table created or already exists.');
    }
});

// Add the user_id column to the orders table if it doesn't exist
db.run(`
    ALTER TABLE orders ADD COLUMN user_id INTEGER;
`, (err) => {
    if (err) {
        // Ignore error if column already exists
        if (err.message.indexOf('duplicate column name') === -1) {
            console.error(err.message);
        } else {
            console.log('user_id column already exists in orders table.');
        }
    } else {
        console.log('user_id column added to orders table.');
    }
});

});

module.exports = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    },
    close: () => {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
};

module.exports = db;