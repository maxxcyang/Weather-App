import { IDatabaseService } from './DatabaseService';
import { WeatherModel } from '../models/WeatherModel';
import { WeatherCreateDTO, WeatherQueryDTO, WeatherResponseDTO } from '../dto/WeatherDTO';
import { getWeather } from '../weather';

export interface IWeatherService {
    updateWeatherData(cities: [string, number, number][]): Promise<void>;
    getLatestWeather(): Promise<WeatherResponseDTO[]>;
    getHistoricalWeather(query: WeatherQueryDTO): Promise<WeatherResponseDTO[]>;
}

export class WeatherService implements IWeatherService {
    constructor(
        private readonly databaseService: IDatabaseService,
        private readonly apiKey: string
    ) {}

    async updateWeatherData(cities: [string, number, number][]): Promise<void> {
        try {
            const weatherData = await Promise.all(cities.map(async ([city, lat, lon]) => {
                const [cityName, temp, feelsLike, humidity, wind, icon] = await getWeather([city, lat, lon], this.apiKey);
                const weatherDTO: WeatherCreateDTO = {
                    city: cityName,
                    temperature: temp,
                    feels_like: feelsLike,
                    humidity,
                    wind_speed: wind,
                    icon
                };
                await this.databaseService.storeWeatherData(weatherDTO);
                return weatherDTO;
            }));
            
            console.log('Weather data updated successfully');
        } catch (error) {
            console.error('Error updating weather data:', error);
            throw error;
        }
    }

    async getLatestWeather(): Promise<WeatherResponseDTO[]> {
        const weatherData = await this.databaseService.getLatestWeather();
        return this.mapToResponseDTO(weatherData);
    }

    async getHistoricalWeather(query: WeatherQueryDTO): Promise<WeatherResponseDTO[]> {
        const weatherData = await this.databaseService.getHistoricalWeather(query);
        return this.mapToResponseDTO(weatherData);
    }

    private mapToResponseDTO(weatherData: WeatherModel[]): WeatherResponseDTO[] {
        return weatherData.map(data => ({
            city: data.city,
            temperature: data.temperature,
            feels_like: data.feels_like,
            humidity: data.humidity,
            wind_speed: data.wind_speed,
            icon: data.icon,
            timestamp: data.timestamp
        }));
    }
} 