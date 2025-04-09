// DTO for creating/updating weather records
export interface WeatherCreateDTO {
    city: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    icon: string;
}

// DTO for weather response
export interface WeatherResponseDTO {
    city: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    icon: string;
    timestamp: string;
}

// DTO for weather query parameters
export interface WeatherQueryDTO {
    city?: string;
    startDate?: string;
    endDate?: string;
} 