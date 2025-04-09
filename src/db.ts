import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

// Database interface
export interface WeatherRecord {
    id?: number;
    city: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    icon: string;
    timestamp: string;
}

// Initialize database
export async function initializeDB() {
    const db = await open({
        filename: './weather.db',
        driver: sqlite3.Database
    });

    // Create table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS weather_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            temperature REAL NOT NULL,
            feels_like REAL NOT NULL,
            humidity INTEGER NOT NULL,
            wind_speed REAL NOT NULL,
            icon TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

// Store weather data
export async function storeWeatherData(data: WeatherRecord) {
    const db = await initializeDB();
    await db.run(`
        INSERT INTO weather_records (city, temperature, feels_like, humidity, wind_speed, icon)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [data.city, data.temperature, data.feels_like, data.humidity, data.wind_speed, data.icon]);
    await db.close();
}

// Get latest weather data
export async function getLatestWeatherData() {
    const db = await initializeDB();
    const records = await db.all(`
        SELECT * FROM weather_records 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM weather_records
        )
    `);
    await db.close();
    return records;
}

// Get historical weather data with optional filters
export async function getHistoricalWeatherData(city?: string, startDate?: string, endDate?: string) {
    const db = await initializeDB();
    let query = 'SELECT * FROM weather_records';
    const params: any[] = [];
    
    if (city || startDate || endDate) {
        query += ' WHERE';
        if (city) {
            query += ' city = ?';
            params.push(city);
        }
        if (startDate) {
            if (params.length > 0) query += ' AND';
            query += ' timestamp >= ?';
            params.push(startDate);
        }
        if (endDate) {
            if (params.length > 0) query += ' AND';
            query += ' timestamp <= ?';
            params.push(endDate);
        }
    }
    
    query += ' ORDER BY timestamp DESC';
    
    const records = await db.all(query, params);
    await db.close();
    return records;
}
