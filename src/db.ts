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

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 100;

// Cache for weather data
const weatherCache: Map<string, { data: WeatherRecord[]; timestamp: number }> = new Map();

// Initialize database with connection pooling
let dbInstance: Database | null = null;

// Initialize database
export async function initializeDB() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: './weather.db',
            driver: sqlite3.Database
        });

        // Create table if it doesn't exist
        await dbInstance.exec(`
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

        // Create indexes for better query performance
        await dbInstance.exec(`
            CREATE INDEX IF NOT EXISTS idx_city_timestamp ON weather_records(city, timestamp);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON weather_records(timestamp);
        `);
    }
    return dbInstance;
}

// Store weather data in batches
export async function storeWeatherData(data: WeatherRecord | WeatherRecord[]) {
    const db = await initializeDB();
    const records = Array.isArray(data) ? data : [data];
    
    // Process in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
        const values = batch.flatMap(record => [
            record.city,
            record.temperature,
            record.feels_like,
            record.humidity,
            record.wind_speed,
            record.icon
        ]);
        
        await db.run(`
            INSERT INTO weather_records (city, temperature, feels_like, humidity, wind_speed, icon)
            VALUES ${placeholders}
        `, values);
    }
    
    // Invalidate cache
    weatherCache.clear();
}

// Get latest weather data with caching
export async function getLatestWeatherData() {
    const cacheKey = 'latest';
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    const db = await initializeDB();
    const records = await db.all(`
        SELECT * FROM weather_records 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM weather_records
        )
    `);
    
    weatherCache.set(cacheKey, { data: records, timestamp: now });
    return records;
}

// Get historical weather data with caching and optimized queries
export async function getHistoricalWeatherData(city?: string, startDate?: string, endDate?: string) {
    const cacheKey = `historical:${city}:${startDate}:${endDate}`;
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
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
    weatherCache.set(cacheKey, { data: records, timestamp: now });
    return records;
}

// Cleanup function to close database connection
export async function closeDB() {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}
