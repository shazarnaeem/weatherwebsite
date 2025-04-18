// API Key (in a real application, this should be secured)
const API_KEY = '4eb3703790b356562054106543b748b2';

// DOM Elements
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const locationButton = document.querySelector('.location-button');
const loadingIndicator = document.querySelector('.loading');
const errorMessage = document.querySelector('.error-message');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');

// Weather data elements
const locationElement = document.getElementById('location');
const dateElement = document.getElementById('date');
const temperatureElement = document.getElementById('temperature');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast');

// Global variables
let currentWeatherData = null;
let currentUnit = 'metric'; // Default to Celsius

// Event listeners
searchButton.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    }
});

locationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoordinates(lat, lon);
            },
            (error) => {
                hideLoading();
                showError("Unable to access your location. Please check your browser settings.");
                console.error(error);
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

// Temperature unit toggle
celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'metric' && currentWeatherData) {
        currentUnit = 'metric';
        updateUnitButtons();
        updateCurrentWeatherDisplay(currentWeatherData);
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'imperial' && currentWeatherData) {
        currentUnit = 'imperial';
        updateUnitButtons();
        updateCurrentWeatherDisplay(currentWeatherData);
    }
});

// Weather icon mapping using Font Awesome
const weatherIcons = {
    '01d': '<i class="fas fa-sun"></i>', // clear sky day
    '01n': '<i class="fas fa-moon"></i>', // clear sky night
    '02d': '<i class="fas fa-cloud-sun"></i>', // few clouds day
    '02n': '<i class="fas fa-cloud-moon"></i>', // few clouds night
    '03d': '<i class="fas fa-cloud"></i>', // scattered clouds
    '03n': '<i class="fas fa-cloud"></i>',
    '04d': '<i class="fas fa-cloud"></i>', // broken clouds
    '04n': '<i class="fas fa-cloud"></i>',
    '09d': '<i class="fas fa-cloud-showers-heavy"></i>', // shower rain
    '09n': '<i class="fas fa-cloud-showers-heavy"></i>',
    '10d': '<i class="fas fa-cloud-sun-rain"></i>', // rain day
    '10n': '<i class="fas fa-cloud-moon-rain"></i>', // rain night
    '11d': '<i class="fas fa-bolt"></i>', // thunderstorm
    '11n': '<i class="fas fa-bolt"></i>',
    '13d': '<i class="fas fa-snowflake"></i>', // snow
    '13n': '<i class="fas fa-snowflake"></i>',
    '50d': '<i class="fas fa-smog"></i>', // mist
    '50n': '<i class="fas fa-smog"></i>'
};

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format day
function formatDay(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Show loading indicator
function showLoading() {
    loadingIndicator.style.display = 'flex';
    errorMessage.style.display = 'none';
    document.querySelector('.weather-container').style.opacity = '0.5';
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.style.display = 'none';
    document.querySelector('.weather-container').style.opacity = '1';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.opacity = '0';
        setTimeout(() => {
            errorMessage.style.display = 'none';
            errorMessage.style.opacity = '1';
        }, 500);
    }, 5000);
}

// Update the unit toggle buttons
function updateUnitButtons() {
    if (currentUnit === 'metric') {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
    }
}

// Convert temperature based on the selected unit
function convertTemperature(temp, toUnit) {
    if (toUnit === 'imperial') {
        // Convert Celsius to Fahrenheit
        return (temp * 9/5) + 32;
    }
    return temp; // Already in Celsius
}

// Get weather by city name
async function getWeatherByCity(city) {
    showLoading();
    try {
        // Get coordinates from city name first (geocoding API)
        const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoResponse.json();
        
        if (geoData.length === 0) {
            throw new Error('City not found. Please check the spelling and try again.');
        }
        
        const { lat, lon, name, country } = geoData[0];
        
        // Save the last searched city
        saveLastSearch(city);
        
        // Now get weather using coordinates
        getWeatherByCoordinates(lat, lon, `${name}, ${country}`);
        
    } catch (error) {
        hideLoading();
        showError(error.message || 'Error fetching weather data. Please try again later.');
        console.error('Error fetching weather data:', error);
    }
}

// Get weather by coordinates
async function getWeatherByCoordinates(lat, lon, locationName = null) {
    showLoading();
    try {
        // Get current weather
        const currentWeatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error(`Weather data not available (${currentWeatherResponse.status})`);
        }
        
        const weatherData = await currentWeatherResponse.json();
        
        // Get forecast data
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error(`Forecast data not available (${forecastResponse.status})`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Store the current weather data globally
        currentWeatherData = {
            ...weatherData,
            customLocationName: locationName
        };
        
        // Update UI with weather data
        updateCurrentWeatherDisplay(currentWeatherData);
        updateForecast(forecastData);
        
        // Animate the weather card
        const weatherCard = document.querySelector('.weather-card');
        weatherCard.style.animation = 'none';
        void weatherCard.offsetWidth; // Trigger reflow
        weatherCard.style.animation = 'fadeIn 0.5s ease';
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError('Error fetching weather data. Please try again later.');
        console.error('Error fetching weather data:', error);
    }
}

// Update current weather UI
function updateCurrentWeatherDisplay(data) {
    const city = data.customLocationName || `${data.name}, ${data.sys.country}`;
    const date = formatDate(data.dt);
    
    let temp = data.main.temp;
    let feelsLikeTemp = data.main.feels_like;
    
    // Convert temperature if needed
    if (currentUnit === 'imperial') {
        temp = convertTemperature(temp, 'imperial');
        feelsLikeTemp = convertTemperature(feelsLikeTemp, 'imperial');
    }
    
    // Round temperatures
    temp = Math.round(temp);
    feelsLikeTemp = Math.round(feelsLikeTemp);
    
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const humidityValue = data.main.humidity;
    const windSpeedValue = data.wind.speed;
    const pressureValue = data.main.pressure;
    
    // Update DOM elements
    locationElement.textContent = city;
    dateElement.textContent = date;
    temperatureElement.textContent = `${temp}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    weatherIcon.innerHTML = weatherIcons[icon] || '<i class="fas fa-cloud-sun"></i>';
    weatherDesc.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    feelsLike.textContent = `${feelsLikeTemp}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    humidity.textContent = `${humidityValue}%`;
    
    // Update wind speed unit if needed
    if (currentUnit === 'imperial') {
        // Convert m/s to mph
        const windSpeedMph = (windSpeedValue * 2.237).toFixed(1);
        windSpeed.textContent = `${windSpeedMph} mph`;
    } else {
        windSpeed.textContent = `${windSpeedValue} m/s`;
    }
    
    pressure.textContent = `${pressureValue} hPa`;
}

// Update forecast UI
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Get one forecast per day (noon time)
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    // Limit to 5 days
    const fiveDayForecast = dailyData.slice(0, 5);
    
    fiveDayForecast.forEach((day, index) => {
        const dayName = formatDay(day.dt);
        const icon = day.weather[0].icon;
        
        // Get temperatures and convert if needed
        let maxTemp = day.main.temp_max;
        let minTemp = day.main.temp_min;
        
        if (currentUnit === 'imperial') {
            maxTemp = convertTemperature(maxTemp, 'imperial');
            minTemp = convertTemperature(minTemp, 'imperial');
        }
        
        // Round temperatures
        maxTemp = Math.round(maxTemp);
        minTemp = Math.round(minTemp);
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.style.opacity = '0';
        forecastCard.style.transform = 'translateY(20px)';
        forecastCard.style.transition = 'all 0.3s ease';
        forecastCard.style.transitionDelay = `${index * 0.1}s`;
        
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${weatherIcons[icon] || '<i class="fas fa-cloud-sun"></i>'}</div>
            <div class="forecast-temp">
                <span class="forecast-max">${maxTemp}°</span>
                <span class="forecast-min">${minTemp}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
        
        // Add a staggered animation effect
        setTimeout(() => {
            forecastCard.style.opacity = '1';
            forecastCard.style.transform = 'translateY(0)';
        }, 50);
    });
}

// Function to detect user's preferred units based on locale
function detectUserPreferredUnits() {
    // Countries that use Fahrenheit (primarily US)
    const fahrenheitCountries = ['US', 'BS', 'KY', 'LR', 'PW', 'FM', 'MH'];
    
    try {
        const userLocale = navigator.language || navigator.userLanguage;
        const userCountry = userLocale.split('-')[1] || '';
        
        if (fahrenheitCountries.includes(userCountry.toUpperCase())) {
            currentUnit = 'imperial';
            updateUnitButtons();
        }
    } catch (error) {
        console.log('Could not detect user preferred units');
    }
}

// Handle resize events for responsive design
function handleResize() {
    const width = window.innerWidth;
    
    // Adjust UI elements based on screen size
    if (width <= 576) {
        // Extra small screens
        locationButton.querySelector('span').style.display = 'none';
    } else {
        locationButton.querySelector('span').style.display = 'inline';
    }
}

// Function to check if weather data needs refreshing (if older than 10 minutes)
function needsRefresh(timestamp) {
    const now = new Date().getTime() / 1000; // Convert to seconds
    const dataTime = timestamp;
    const tenMinutes = 10 * 60; // 10 minutes in seconds
    
    return (now - dataTime) > tenMinutes;
}

// Save last searched city to localStorage
function saveLastSearch(city) {
    try {
        localStorage.setItem('lastSearchedCity', city);
    } catch (error) {
        console.log('Could not save to localStorage');
    }
}

// Get last searched city from localStorage
function getLastSearch() {
    try {
        return localStorage.getItem('lastSearchedCity');
    } catch (error) {
        console.log('Could not retrieve from localStorage');
        return null;
    }
}

// Add CSS animation class
function addCSSAnimation(element, animationClass, duration = 1000) {
    element.classList.add(animationClass);
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
}

// Initialize app
window.addEventListener('load', () => {
    // Set up resize handler
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Detect user's preferred units
    detectUserPreferredUnits();
    
    // Try to get last searched city
    const lastCity = getLastSearch();
    
    if (lastCity) {
        // Use the last searched city
        searchInput.value = lastCity;
        getWeatherByCity(lastCity);
    } else {
        // Start with a default city if no location access or last search
        getWeatherByCity('London');
    }
    
    // Try to get user's location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoordinates(lat, lon);
            },
            (error) => {
                console.log('Location access denied, using default city or last search.');
                // We already loaded a city above, so no action needed
            }
        );
    }
});

// Add event delegation for forecast cards to show detailed info
forecastContainer.addEventListener('click', (e) => {
    const forecastCard = e.target.closest('.forecast-card');
    if (forecastCard) {
        // Add a pulse animation when clicked
        forecastCard.style.transform = 'scale(1.05)';
        setTimeout(() => {
            forecastCard.style.transform = 'scale(1)';
        }, 200);
    }
});

// Add animation effects when hovering over detail boxes
const detailBoxes = document.querySelectorAll('.detail-box');
detailBoxes.forEach(box => {
    box.addEventListener('mouseenter', () => {
        box.querySelector('i').style.transform = 'scale(1.2)';
    });
    
    box.addEventListener('mouseleave', () => {
        box.querySelector('i').style.transform = 'scale(1)';
    });
});

// Add smooth animations to other interactive elements
document.querySelectorAll('.search-button, .location-button').forEach(button => {
    button.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });
});

// Add pulse animation to temperature on hover
temperatureElement.addEventListener('mouseenter', () => {
    temperatureElement.style.textShadow = '0 0 15px rgba(58, 134, 255, 0.5)';
});

temperatureElement.addEventListener('mouseleave', () => {
    temperatureElement.style.textShadow = 'none';
});

// Handle errors in a more user-friendly way
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Only show user-facing error if it's related to our app functions
    if (event.filename.includes(window.location.hostname)) {
        showError('Something went wrong. Please try again later.');
    }
});