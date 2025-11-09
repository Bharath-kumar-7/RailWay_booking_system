-- Railway Booking System Database
CREATE DATABASE IF NOT EXISTS railway_booking;
USE railway_booking;

-- Users table with timestamps
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Trains table with available_seats and fare
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
);

-- Bookings table with status field
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    train_id INT NOT NULL,
    seats_booked INT NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_train (train_id),
    INDEX idx_status (status)
);

-- Insert sample train data
INSERT INTO trains (train_name, source, destination, departure_time, arrival_time, total_seats, available_seats, fare)
VALUES
    ('Rajdhani Express', 'New Delhi', 'Mumbai Central', '08:30:00', '16:45:00', 120, 120, 1850.00),
    ('Shatabdi Express', 'Chennai Central', 'Bangalore', '14:20:00', '21:15:00', 150, 150, 1520.00),
    ('Duronto Express', 'Kolkata', 'Delhi', '23:10:00', '06:30:00', 200, 200, 1320.00),
    ('Garib Rath Express', 'Mumbai', 'Ahmedabad', '06:15:00', '11:30:00', 180, 180, 850.00),
    ('Vande Bharat Express', 'Delhi', 'Varanasi', '06:00:00', '14:00:00', 160, 160, 2200.00),
    ('Tejas Express', 'Mumbai', 'Goa', '05:00:00', '12:30:00', 140, 140, 1680.00);