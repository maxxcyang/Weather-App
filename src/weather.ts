import axios from "axios";

//function to get weather data from Open Weather Map for a specific city
//city: name, lat, long
//weatherData: (temp, feels_like, humid, wind, icon)
export async function getWeather(city: [string, number, number], apiKey: string): Promise<[string, number, number, number, number, string]> {
    try {
        const [cityName, lat, lon] = city;
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return [
            cityName,
            data.main.temp,
            data.main.feels_like,
            data.main.humidity,
            data.wind.speed,
            data.weather[0].icon
        ];
    } catch (error) {
        console.error(`Error fetching weather for ${city[0]}:`, error);
        throw error;
    }
}