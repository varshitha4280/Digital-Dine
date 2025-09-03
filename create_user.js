// create_user.js
const db = require('./db'); // Your db.js file
const bcrypt = require('bcrypt');

async function createUser(email, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log(`User ${email} created.`);
            }
            db.close();
        });
    } catch (error) {
        console.error('Error creating user:', error);
    }
}

// Example usage:
createUser('99210041792@gmail.com', '99210041792');