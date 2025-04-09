export interface WeatherModel {
    id?: number;
    city: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    icon: string;
    timestamp: string;
} 