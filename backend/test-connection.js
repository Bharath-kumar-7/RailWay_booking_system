// Quick Database Connection Test
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

console.log('🔍 Testing Database Connection...\n');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway_booking'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('\n💡 Common Solutions:');
        console.error('  1. Check if MySQL is running');
        console.error('  2. Verify DB_PASSWORD in .env file');
        console.error('  3. Ensure database exists: railway_booking');
        console.error('  4. Check MySQL port (default: 3306)');
        process.exit(1);
    }
    
    console.log('✅ Database Connected Successfully!');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    connection.end();
    console.log('\n✅ Connection test passed!');
});
