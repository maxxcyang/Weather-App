-- Weather database schema
CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    temperature REAL NOT NULL,
    feels_like REAL NOT NULL,
    humidity INTEGER NOT NULL,
    wind_speed REAL NOT NULL,
    icon TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_city ON weather_records(city);
CREATE INDEX IF NOT EXISTS idx_timestamp ON weather_records(timestamp); 