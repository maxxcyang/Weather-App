import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { WeatherModel } from '../models/WeatherModel';
import { WeatherCreateDTO, WeatherQueryDTO } from '../dto/WeatherDTO';
import path from 'path';

export interface IDatabaseService {
    initialize(): Promise<void>;
    storeWeatherData(data: WeatherCreateDTO): Promise<void>;
    getLatestWeather(): Promise<WeatherModel[]>;
    getHistoricalWeather(query: WeatherQueryDTO): Promise<WeatherModel[]>;
}

export class DatabaseService implements IDatabaseService {
    private db: Database | null = null;

    async initialize(): Promise<void> {
        try {
            this.db = await open({
                filename: 'weather.db',
                driver: sqlite3.Database
            });

            // Read and execute schema.sql
            const schemaPath = path.join(__dirname, '../schema.sql');
            const schema = await this.db.exec(await import('fs').then(fs => fs.promises.readFile(schemaPath, 'utf8')));
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    async storeWeatherData(data: WeatherCreateDTO): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        
        await this.db.run(`
            INSERT INTO weather_records (city, temperature, feels_like, humidity, wind_speed, icon)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [data.city, data.temperature, data.feels_like, data.humidity, data.wind_speed, data.icon]);
    }

    async getLatestWeather(): Promise<WeatherModel[]> {
        if (!this.db) throw new Error('Database not initialized');
        
        return await this.db.all(`
            SELECT * FROM weather_records 
            WHERE timestamp = (
                SELECT MAX(timestamp) 
                FROM weather_records
            )
        `);
    }

    async getHistoricalWeather(query: WeatherQueryDTO): Promise<WeatherModel[]> {
        if (!this.db) throw new Error('Database not initialized');
        
        let sqlQuery = 'SELECT * FROM weather_records';
        const params: any[] = [];
        
        if (query.city || query.startDate || query.endDate) {
            sqlQuery += ' WHERE';
            if (query.city) {
                sqlQuery += ' city = ?';
                params.push(query.city);
            }
            if (query.startDate) {
                if (params.length > 0) sqlQuery += ' AND';
                sqlQuery += ' timestamp >= ?';
                params.push(query.startDate);
            }
            if (query.endDate) {
                if (params.length > 0) sqlQuery += ' AND';
                sqlQuery += ' timestamp <= ?';
                params.push(query.endDate);
            }
        }
        
        sqlQuery += ' ORDER BY timestamp DESC';
        
        return await this.db.all(sqlQuery, params);
    }
} 