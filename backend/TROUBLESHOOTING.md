# 🔧 Backend Troubleshooting Guide

## Quick Fixes for Server Crashes

### 1️⃣ Test Database Connection
```bash
cd backend
node test-connection.js
```

### 2️⃣ Common Issues & Solutions

#### ❌ Error: "ECONNREFUSED" or "connect ECONNREFUSED"
**Problem:** MySQL is not running

**Solutions:**
```bash
# Windows - Start MySQL
net start MySQL80

# Or check MySQL service in Services app (Win + R → services.msc)
```

#### ❌ Error: "Access denied for user 'root'@'localhost'"
**Problem:** Wrong database password

**Solutions:**
1. Check `.env` file - verify `DB_PASSWORD=6305`
2. Test MySQL login:
```bash
mysql -u root -p6305
```

#### ❌ Error: "Unknown database 'railway_booking'"
**Problem:** Database doesn't exist

**Solutions:**
```bash
# Login to MySQL
mysql -u root -p6305

# Create database
CREATE DATABASE railway_booking;
exit;
```

#### ❌ Error: "Cannot find module 'express'" or similar
**Problem:** Missing dependencies

**Solutions:**
```bash
cd backend
npm install
```

### 3️⃣ Start Server with Detailed Logs
```bash
cd backend
npm start
```

### 4️⃣ Check if Port 5000 is Already in Use
```bash
# Windows
netstat -ano | findstr :5000

# If port is busy, kill the process or change PORT in .env
```

### 5️⃣ Verify All Environment Variables
Check your `.env` file has:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=6305
DB_NAME=railway_booking
JWT_SECRET=your-secret-key-change-this-to-random-string
PORT=5000
```

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Test database connection
node test-connection.js

# 3. Start server
npm start
```

## 📞 Still Having Issues?

Check the console output - the server now provides detailed error messages with solutions!
