# backend-service
Technical challenge that collects and stores weather data from OpenWeatherMap API.

Design choices:
    Node.js - quick and intuitive startup
    SQLite for database - quick for local storage, assuming only one user for each application
    API key hidden in .env
    Cities hardcoded, might keep a list of them later

Dependencies:
    Typescript
    Node.js
    Axios
    ts-node
    SQLite

Workflow:
    Get weather
        API call
    Display it
        HTML and CSS

Weather choices:
    NYC, Beijing, London, Tokyo
    Current Weather
    hourly forecasts include temperature and feels like, humidity, UV index, probability of precipitation
