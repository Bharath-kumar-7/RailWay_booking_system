// ═══════════════════════════════════════════════════════════════════════════════
// RAILWAY BOOKING SYSTEM - FIXED SERVER.JS
// ═══════════════════════════════════════════════════════════════════════════════
// All fixes implemented:
// ✅ Added 'fare' column to bookings table
// ✅ Updated INSERT query to include fare
// ✅ Improved error handling and response data
// ✅ Proper database transactions
// ✅ Better console logging
// ═══════════════════════════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'railway_booking';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const PORT = process.env.PORT || 5000;

// Create connection pool with promise support
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

console.log('📚 Database Configuration:');
console.log(`  Host: ${DB_HOST}`);
console.log(`  User: ${DB_USER}`);
console.log(`  Database: ${DB_NAME}`);
console.log(`  Port: ${PORT}`);

// Middleware for JWT authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Initialize Database with Proper Schema
// ═══════════════════════════════════════════════════════════════════════════════
async function initializeDatabase() {
    try {
        console.log('🔧 Initializing database...');
        
        // Create database if not exists
        const tempConn = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD
        });
        
        const tempPromise = tempConn.promise();
        await tempPromise.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        await tempPromise.end();
        console.log('✅ Database created/verified');
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // 🔴 FIX #3: CREATE USERS TABLE
        // ═══════════════════════════════════════════════════════════════════════════════
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            )
        `);
        console.log('✅ Users table verified');
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // CREATE TRAINS TABLE
        // ═══════════════════════════════════════════════════════════════════════════════
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trains (
                id INT AUTO_INCREMENT PRIMARY KEY,
                train_name VARCHAR(100) NOT NULL,
                source VARCHAR(50) NOT NULL,
                destination VARCHAR(50) NOT NULL,
                departure_time TIME NOT NULL,
                arrival_time TIME NOT NULL,
                total_seats INT DEFAULT 100,
                available_seats INT DEFAULT 100,
                fare DECIMAL(10,2) DEFAULT 0,
                INDEX idx_source (source),
                INDEX idx_destination (destination)
            )
        `);
        console.log('✅ Trains table verified');
        
        // ═══════════════════════════════════════════════════════════════════════════════
        // 🔴 FIX #3: CREATE BOOKINGS TABLE WITH FARE COLUMN
        // ═══════════════════════════════════════════════════════════════════════════════
        // PROBLEM: Original schema missing 'fare' column
        // SOLUTION: Added fare DECIMAL(10,2) column
        // ═══════════════════════════════════════════════════════════════════════════════
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                train_id INT NOT NULL,
                seats_booked INT NOT NULL,
                fare DECIMAL(10,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'confirmed',
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
                INDEX idx_user (user_id),
                INDEX idx_train (train_id),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ Bookings table verified (with fare column)');
        
        // Insert sample trains if empty
        const [trains] = await pool.query('SELECT COUNT(*) as count FROM trains');
        if (trains[0].count === 0) {
            console.log('📝 Inserting sample train data...');
            await pool.query(`
                INSERT INTO trains (train_name, source, destination, departure_time, arrival_time, total_seats, available_seats, fare)
                VALUES
                ('Rajdhani Express', 'New Delhi', 'Mumbai Central', '08:30:00', '16:45:00', 120, 120, 1850.00),
                ('Shatabdi Express', 'Chennai Central', 'Bangalore', '14:20:00', '21:15:00', 150, 150, 1520.00),
                ('Duronto Express', 'Kolkata', 'Delhi', '23:10:00', '06:30:00', 200, 200, 1320.00),
                ('Garib Rath Express', 'Mumbai', 'Ahmedabad', '06:15:00', '11:30:00', 180, 180, 850.00),
                ('Vande Bharat Express', 'Delhi', 'Varanasi', '06:00:00', '14:00:00', 160, 160, 2200.00),
                ('Tejas Express', 'Mumbai', 'Goa', '05:00:00', '12:30:00', 140, 140, 1680.00)
            `);
            console.log('✅ Sample train data inserted');
        }
        
        console.log('✅ Database initialization complete!\n');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.send('🚆 Railway Booking API - Backend Server');
});

app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'ok', timestamp: new Date() });
});

// User Registration
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log(`📝 Registration attempt: ${email}`);
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        
        console.log(`✅ User registered: ${email} (ID: ${result.insertId})`);
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔐 Login attempt: ${email}`);
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        
        console.log(`✅ Login successful: ${email}`);
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user profile
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get all trains
app.get('/trains', async (req, res) => {
    try {
        const [trains] = await pool.query('SELECT * FROM trains');
        res.json(trains);
    } catch (error) {
        console.error('Error fetching trains:', error);
        res.status(500).json({ error: 'Failed to fetch trains' });
    }
});

// Search trains
app.get('/trains/search', async (req, res) => {
    try {
        const { source, destination } = req.query;
        
        console.log(`🔍 Train search: ${source} → ${destination}`);
        
        let query = 'SELECT * FROM trains WHERE available_seats > 0';
        const params = [];
        
        if (source) {
            query += ' AND LOWER(source) LIKE ?';
            params.push(`%${source.toLowerCase()}%`);
        }
        
        if (destination) {
            query += ' AND LOWER(destination) LIKE ?';
            params.push(`%${destination.toLowerCase()}%`);
        }
        
        const [trains] = await pool.query(query, params);
        console.log(`✅ Found ${trains.length} trains`);
        res.json(trains);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get specific train
app.get('/trains/:id', async (req, res) => {
    try {
        console.log(`📋 Fetching train ID: ${req.params.id}`);
        
        const [trains] = await pool.query('SELECT * FROM trains WHERE id = ?', [req.params.id]);
        if (trains.length === 0) {
            console.log(`❌ Train not found: ${req.params.id}`);
            return res.status(404).json({ error: 'Train not found' });
        }
        
        console.log(`✅ Train found: ${trains[0].train_name}`);
        res.json(trains[0]);
    } catch (error) {
        console.error('Error fetching train:', error);
        res.status(500).json({ error: 'Failed to fetch train details' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 FIX #3: BOOK TICKET WITH PROPER FARE HANDLING
// ═══════════════════════════════════════════════════════════════════════════════
// PROBLEM: Missing fare column, INSERT doesn't include fare
// SOLUTION: Calculate fare, include in INSERT, proper error handling
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/book', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        console.log(`\n🎫 BOOKING REQUEST`);
        console.log(`User ID: ${req.user.id}`);
        
        // Start transaction
        await connection.beginTransaction();
        
        const { train_id, seats_booked } = req.body;
        const user_id = req.user.id;
        
        console.log(`Train ID: ${train_id}, Seats: ${seats_booked}`);
        
        // Validate input
        if (!train_id || !seats_booked || seats_booked < 1) {
            await connection.rollback();
            console.log('❌ Invalid booking details');
            return res.status(400).json({ error: 'Invalid booking details' });
        }
        
        // Fetch train with lock
        console.log('🔒 Locking train record...');
        const [trains] = await connection.query(
            'SELECT * FROM trains WHERE id = ? FOR UPDATE',
            [train_id]
        );
        
        if (trains.length === 0) {
            await connection.rollback();
            console.log('❌ Train not found');
            return res.status(404).json({ error: 'Train not found' });
        }
        
        const train = trains[0];
        console.log(`Train: ${train.train_name}`);
        console.log(`Available seats: ${train.available_seats}`);
        
        // Check available seats
        if (train.available_seats < seats_booked) {
            await connection.rollback();
            console.log(`❌ Not enough seats. Requested: ${seats_booked}, Available: ${train.available_seats}`);
            return res.status(400).json({ 
                error: `Not enough seats available. Only ${train.available_seats} seats left.`, 
                available: train.available_seats,
                requested: seats_booked
            });
        }
        
        // ✅ Calculate total fare
        const totalFare = parseFloat(train.fare) * seats_booked;
        console.log(`Fare calculation: ${train.fare} × ${seats_booked} = ${totalFare}`);
        
        // ✅ Insert booking with fare (FIX #3)
        console.log('💾 Inserting booking record...');
        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (user_id, train_id, seats_booked, fare, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, train_id, seats_booked, totalFare, 'confirmed']
        );
        console.log(`✅ Booking inserted. ID: ${bookingResult.insertId}`);
        
        // Update available seats
        console.log('🔄 Updating train availability...');
        await connection.query(
            'UPDATE trains SET available_seats = available_seats - ? WHERE id = ?',
            [seats_booked, train_id]
        );
        console.log(`✅ Available seats updated: ${train.available_seats} → ${train.available_seats - seats_booked}`);
        
        // Commit transaction
        await connection.commit();
        console.log('✅ Transaction committed successfully\n');
        
        // ✅ Return complete booking data
        res.status(201).json({
            message: 'Booking successful',
            bookingId: bookingResult.insertId,
            seatsBooked: seats_booked,
            fare: totalFare,
            trainName: train.train_name,
            source: train.source,
            destination: train.destination
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Booking error:', error);
        res.status(500).json({ error: 'Booking failed: ' + error.message });
    } finally {
        connection.release();
    }
});

// Get all bookings (admin view)
app.get('/bookings', authenticateToken, async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT b.id, b.seats_booked, b.fare, b.status, b.booking_date,
                u.name as user_name, u.email as user_email,
                t.train_name, t.source, t.destination, t.departure_time
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN trains t ON b.train_id = t.id
            ORDER BY b.booking_date DESC
        `);
        res.json(bookings);
    } catch (error) {
        console.error('Bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get user's bookings
app.get('/bookings/user', authenticateToken, async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT b.id, b.seats_booked, b.fare, b.status, b.booking_date,
                t.id as train_id, t.train_name, t.source, t.destination, 
                t.departure_time, t.arrival_time
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC
        `, [req.user.id]);
        res.json(bookings);
    } catch (error) {
        console.error('User bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Cancel booking
app.delete('/bookings/:id', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const bookingId = req.params.id;
        const userId = req.user.id;
        
        console.log(`Cancelling booking: ${bookingId}`);
        
        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE',
            [bookingId, userId]
        );
        
        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookings[0];
        
        if (booking.status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({ error: 'Booking already cancelled' });
        }
        
        await connection.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            ['cancelled', bookingId]
        );
        
        await connection.query(
            'UPDATE trains SET available_seats = available_seats + ? WHERE id = ?',
            [booking.seats_booked, booking.train_id]
        );
        
        await connection.commit();
        console.log(`✅ Booking cancelled: ${bookingId}`);
        res.json({ message: 'Booking cancelled successfully' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    } finally {
        connection.release();
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 SERVER STARTED`);
            console.log(`📍 http://localhost:${PORT}`);
            console.log(`⏰ ${new Date().toLocaleString()}`);
            console.log(`✅ Ready to accept connections\n`);
        });
    })
    .catch((error) => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });