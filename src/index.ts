import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from 'path';
import { DatabaseService } from './services/DatabaseService';
import { WeatherService } from './services/WeatherService';

dotenv.config();

const app = express();
const PORT = 3000;
const API_KEY = process.env.API_KEY;

//[city name, lat, lon]
const CITIES: [string, number, number][] = [
    ['NYC', 40.712776, -74.005974], 
    ['Beijing', 39.904202, 116.407394], 
    ['London', 51.507351, -0.127758], 
    ['Tokyo', 35.6764, 139.6500]
];

// Initialize services
const databaseService = new DatabaseService();
const weatherService = new WeatherService(databaseService, API_KEY || '');

// Initialize database
databaseService.initialize().catch(console.error);

// Function to fetch and store weather data
async function updateWeatherData(): Promise<void> {
    try {
        await weatherService.updateWeatherData(CITIES);
    } catch (error) {
        console.error('Error updating weather data:', error);
    }
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint for weather data
app.get('/api/weather', async (req: Request, res: Response): Promise<void> => {
    try {
        const weatherData = await weatherService.getLatestWeather();
        res.json(weatherData);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

// API endpoint for historical weather data
app.get('/api/weather/history', async (req: Request, res: Response): Promise<void> => {
    try {
        const { city, startDate, endDate } = req.query;
        const weatherData = await weatherService.getHistoricalWeather({
            city: city as string | undefined,
            startDate: startDate as string | undefined,
            endDate: endDate as string | undefined
        });
        res.json(weatherData);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Error fetching historical weather data' });
    }
});

// Serve the main page
app.get('/', (req: Request, res: Response): void => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Initial weather data fetch
updateWeatherData();

// Set up regular interval for weather updates
setInterval(updateWeatherData, 5 * 60 * 1000); // 5 minutes

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});