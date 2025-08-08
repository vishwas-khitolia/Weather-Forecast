// Wait for the DOM to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", function () {
  // Get all DOM elements needed for the application
  const cityInput = document.getElementById("city"); // City search input field
  const searchBtn = document.getElementById("submit"); // Search button
  const currentLocationBtn = document.getElementById("currentLocationBtn"); // Current location button
  const recentCitiesDropdown = document.getElementById("recentCitiesDropdown"); // Dropdown for recent cities
  const weatherInfo = document.getElementById("weather-info"); // Container for current weather info
  const forecastContainer = document.getElementById("forecast"); // Container for forecast cards
  const errorContainer = document.getElementById("error"); // Error message container
  const errorMessage = document.getElementById("errorMessage"); // Error message text
  const cityOutput = document.getElementById("cityoutput"); // City name display
  const description = document.getElementById("description"); // Weather description
  const temp = document.getElementById("temp"); // Temperature display
  const wind = document.getElementById("wind"); // Wind speed display
  const humidity = document.getElementById("humidity"); // Humidity display
  const weatherIcon = document.getElementById("weather-icon"); // Weather icon image

  // API configuration
  const apiKey = "fcb1b1f3e6bec7a36ee1f44fd9eea71d"; // OpenWeatherMap API key
  const baseUrl = "https://api.openweathermap.org/data/2.5"; // Base API URL
  const iconUrl = "https://openweathermap.org/img/wn/"; // Base URL for weather icons

  // Get recent cities from localStorage or initialize empty array
  let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

  /**
   * Convert temperature from Kelvin to Celsius
   * @param {number} kelvin - Temperature in Kelvin
   * @returns {string} - Temperature in Celsius with 1 decimal place
   */
  function kelvinToCelsius(kelvin) {
    return (kelvin - 273.15).toFixed(1);
  }

  /**
   * Display current weather data in the UI
   * @param {Object} data - Weather data from API
   */
  function displayCurrentWeather(data) {
    const date = new Date(data.dt * 1000); // Convert timestamp to Date object
    cityOutput.textContent = `${data.name}, ${data.sys.country} (${formatDate(
      date
    )})`;
    temp.textContent = `${kelvinToCelsius(data.main.temp)}°C`;
    wind.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`; // Convert m/s to km/h
    humidity.textContent = `${data.main.humidity}%`;
    description.textContent = data.weather[0].description;
    weatherIcon.src = `${iconUrl}${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    weatherInfo.classList.remove("hidden"); // Show weather info section
    hideError(); // Hide any previous errors
    updateRecentCities(data.name); // Update recent cities list
  }

  /**
   * Display 5-day forecast data in the UI
   * @param {Object} data - Forecast data from API
   */
  function displayForecast(data) {
    forecastContainer.innerHTML = ""; // Clear previous forecast
    const dailyForecasts = []; // Array to store one forecast per day
    const seenDays = new Set(); // Track days we've already processed

    // Filter to get one forecast per day (around noon time)
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateString = formatDate(date);
      if (
        !seenDays.has(dateString) &&
        date.getHours() >= 11 &&
        date.getHours() <= 13
      ) {
        seenDays.add(dateString);
        dailyForecasts.push(item);
      }
    });

    // Create forecast cards for the next 5 days
    dailyForecasts.slice(0, 5).forEach((day) => {
      const date = new Date(day.dt * 1000);
      const card = document.createElement("div");
      card.className = "bg-white rounded-xl shadow-lg p-4 weather-card";
      card.innerHTML = `
        <h3 class="font-semibold text-gray-800 mb-2">${formatDate(date)}</h3>
        <img src="${iconUrl}${day.weather[0].icon}.png" alt="${
        day.weather[0].description
      }" 
             class="mx-auto w-12 h-12 mb-2">
        <p class="text-gray-600">Temp: <span class="font-bold text-gray-800">${kelvinToCelsius(
          day.main.temp
        )}°C</span></p>
        <p class="text-gray-600">Wind: <span class="font-bold text-gray-800">${(
          day.wind.speed * 3.6
        ).toFixed(1)} km/h</span></p>
        <p class="text-gray-600">Humidity: <span class="font-bold text-gray-800">${
          day.main.humidity
        }%</span></p>
      `;
      forecastContainer.appendChild(card);
    });
  }

  /**
   * Format date to readable string (e.g., "Jan 1, 2023")
   * @param {Date} date - Date object to format
   * @returns {string} - Formatted date string
   */
  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Update recent cities list in localStorage
   * @param {string} city - City name to add to recent list
   */
  function updateRecentCities(city) {
    if (!city || recentCities.includes(city)) return; // Skip if city is empty or already exists
    recentCities.unshift(city); // Add to beginning of array
    if (recentCities.length > 5) recentCities.pop(); // Keep only 5 most recent
    localStorage.setItem("recentCities", JSON.stringify(recentCities)); // Save to localStorage
  }

  /**
   * Populate recent cities dropdown menu
   */
  function populateRecentCitiesDropdown() {
    recentCitiesDropdown.innerHTML = ""; // Clear previous items
    recentCities.forEach((city) => {
      const cityElement = document.createElement("div");
      cityElement.className = "p-3 hover:bg-blue-50 cursor-pointer";
      cityElement.textContent = city;
      // When a city is clicked from dropdown
      cityElement.addEventListener("click", () => {
        cityInput.value = city;
        fetchWeatherData(city);
        recentCitiesDropdown.classList.add("hidden");
      });
      recentCitiesDropdown.appendChild(cityElement);
    });
  }

  /**
   * Show/hide loading state
   * @param {boolean} show - Whether to show loading state
   */
  function showLoading(show) {
    if (show) {
      searchBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Searching...';
      searchBtn.disabled = true;
      currentLocationBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Locating...';
      currentLocationBtn.disabled = true;
    } else {
      searchBtn.innerHTML = "Search";
      searchBtn.disabled = false;
      currentLocationBtn.innerHTML =
        '<i class="fas fa-location-arrow"></i> Use Current Location';
      currentLocationBtn.disabled = false;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove("hidden");
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorContainer.classList.add("hidden");
  }

  /**
   * Fetch weather data from API
   * @param {string} city - City name to fetch weather for
   */
  async function fetchWeatherData(city) {
    showLoading(true);
    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `${baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`
      );
      if (!currentResponse.ok) {
        throw new Error(
          currentResponse.status === 404
            ? "City not found. Please try another location."
            : "Weather data unavailable"
        );
      }
      const currentData = await currentResponse.json();
      displayCurrentWeather(currentData);

      // Fetch forecast after current weather succeeds
      const forecastResponse = await fetch(
        `${baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}`
      );
      if (!forecastResponse.ok) {
        throw new Error("Forecast data unavailable");
      }
      const forecastData = await forecastResponse.json();
      displayForecast(forecastData);
    } catch (err) {
      showError(err.message || "Failed to fetch weather data");
    } finally {
      showLoading(false);
    }
  }

  // Event Listeners

  // Search button click handler
  searchBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();
    // Validate input (only letters, spaces and commas allowed)
    if (!city || !/^[a-zA-Z\s,]+$/.test(city)) {
      showError("Please enter a valid city name (letters and spaces only)");
      return;
    }
    fetchWeatherData(city);
  });

  // Handle Enter key in search input
  cityInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });

  // Show recent cities dropdown when input is focused
  cityInput.addEventListener("focus", () => {
    if (recentCities.length > 0) {
      populateRecentCitiesDropdown();
      recentCitiesDropdown.classList.remove("hidden");
    }
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !cityInput.contains(e.target) &&
      !recentCitiesDropdown.contains(e.target)
    ) {
      recentCitiesDropdown.classList.add("hidden");
    }
  });

  // Current location button handler
  currentLocationBtn.addEventListener("click", function () {
    if (navigator.geolocation) {
      showLoading(true);
      // Get user's current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Fetch weather for current coordinates
            const response = await fetch(
              `${baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
            );
            const data = await response.json();
            displayCurrentWeather(data);
            // Fetch forecast for current coordinates
            const forecastResponse = await fetch(
              `${baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
            );
            const forecastData = await forecastResponse.json();
            displayForecast(forecastData);
          } catch (err) {
            showError("Failed to fetch location weather");
          } finally {
            showLoading(false);
          }
        },
        (error) => {
          showError("Location access denied or failed");
          showLoading(false);
        }
      );
    } else {
      showError("Geolocation not supported by your browser");
    }
  });
});
