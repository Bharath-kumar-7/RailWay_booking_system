-- Migration: Add journey_date to trains and bookings tables
-- Run this if you have existing database

USE railway_booking;

-- Add journey_date column to trains table if not exists
ALTER TABLE trains 
ADD COLUMN IF NOT EXISTS journey_date DATE NOT NULL DEFAULT (CURDATE() + INTERVAL 1 DAY);

-- Add index for journey_date
CREATE INDEX IF NOT EXISTS idx_journey_date ON trains(journey_date);

-- Add journey_date column to bookings table if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS journey_date DATE NOT NULL DEFAULT CURDATE();

-- Add index for journey_date in bookings
CREATE INDEX IF NOT EXISTS idx_journey_date ON bookings(journey_date);

-- Update existing trains with sample dates
UPDATE trains SET journey_date = CURDATE() + INTERVAL 1 DAY WHERE journey_date IS NULL OR journey_date = '0000-00-00';

-- Update existing bookings with journey date from their trains
UPDATE bookings b
JOIN trains t ON b.train_id = t.id
SET b.journey_date = t.journey_date
WHERE b.journey_date IS NULL OR b.journey_date = '0000-00-00';

SELECT 'Migration completed successfully!' as status;
