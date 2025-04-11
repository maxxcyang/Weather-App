import axios from "axios";

interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RATE_LIMIT_WINDOW = 60; // 60 seconds

// Cache for rate limit information
const rateLimitCache: Map<string, RateLimitInfo> = new Map();

// Function to handle rate limits
async function handleRateLimit(apiKey: string): Promise<void> {
    const rateInfo = rateLimitCache.get(apiKey);
    if (rateInfo && rateInfo.remaining <= 0) {
        const now = Math.floor(Date.now() / 1000);
        const waitTime = rateInfo.reset - now;
        if (waitTime > 0) {
            console.log(`Rate limit reached. Waiting ${waitTime} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
    }
}

// Function to update rate limit information
function updateRateLimitInfo(apiKey: string, headers: Headers): void {
    const limit = parseInt(headers.get('X-RateLimit-Limit') || '60');
    const remaining = parseInt(headers.get('X-RateLimit-Remaining') || '60');
    const reset = parseInt(headers.get('X-RateLimit-Reset') || '0');
    
    rateLimitCache.set(apiKey, { limit, remaining, reset });
}

//function to get weather data from Open Weather Map for a specific city
//city: name, lat, long
//weatherData: (temp, feels_like, humid, wind, icon)
export async function getWeather(city: [string, number, number], apiKey: string): Promise<[string, number, number, number, number, string]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await handleRateLimit(apiKey);
            
            const [cityName, lat, lon] = city;
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
            
            // Update rate limit information
            updateRateLimitInfo(apiKey, response.headers);
            
            if (!response.ok) {
                if (response.status === 429) { // Rate limit exceeded
                    await handleRateLimit(apiKey);
                    continue;
                }
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
            lastError = error as Error;
            console.error(`Attempt ${attempt} failed for ${city[0]}:`, error);
            
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            }
        }
    }
    
    throw lastError || new Error(`Failed to fetch weather data for ${city[0]} after ${MAX_RETRIES} attempts`);
}