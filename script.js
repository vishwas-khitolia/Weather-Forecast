document.addEventListener("DOMContentLoaded", function () {
  const cityInput = document.getElementById("city");
  const searchBtn = document.getElementById("submit");
  const currentLocationBtn = document.getElementById("currentLocationBtn");
  const recentCitiesDropdown = document.getElementById("recentCitiesDropdown");
  const weatherInfo = document.getElementById("weather-info");
  const forecastContainer = document.getElementById("forecast");
  const errorContainer = document.getElementById("error");
  const errorMessage = document.getElementById("errorMessage");
  const cityOutput = document.getElementById("cityoutput");
  const description = document.getElementById("description");
  const temp = document.getElementById("temp");
  const wind = document.getElementById("wind");
  const humidity = document.getElementById("humidity");
  const weatherIcon = document.getElementById("weather-icon");

  const apiKey = "fcb1b1f3e6bec7a36ee1f44fd9eea71d";
  const baseUrl = "https://api.openweathermap.org/data/2.5";
  const iconUrl = "https://openweathermap.org/img/wn/";

  let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

  function kelvinToCelsius(kelvin) {
    return (kelvin - 273.15).toFixed(1);
  }

  function displayCurrentWeather(data) {
    const date = new Date(data.dt * 1000);
    cityOutput.textContent = `${data.name}, ${data.sys.country} (${formatDate(
      date
    )})`;
    temp.textContent = `${kelvinToCelsius(data.main.temp)}°C`;
    wind.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    description.textContent = data.weather[0].description;
    weatherIcon.src = `${iconUrl}${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    weatherInfo.classList.remove("hidden");
    hideError();
    updateRecentCities(data.name);
  }

  function displayForecast(data) {
    forecastContainer.innerHTML = "";
    const dailyForecasts = [];
    const seenDays = new Set();
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
    dailyForecasts.slice(0, 5).forEach((day) => {
      const date = new Date(day.dt * 1000);
      const card = document.createElement("div");
      card.className = "bg-white rounded-xl shadow-lg p-4 weather-card";
      card.innerHTML = `
              <h3 class="font-semibold text-gray-800 mb-2">${formatDate(
                date
              )}</h3>
              <img src="${iconUrl}${day.weather[0].icon}.png" alt="${
        day.weather[0].description
      }" class="mx-auto w-12 h-12 mb-2">
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

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function updateRecentCities(city) {
    if (!city || recentCities.includes(city)) return;
    recentCities.unshift(city);
    if (recentCities.length > 5) recentCities.pop();
    localStorage.setItem("recentCities", JSON.stringify(recentCities));
  }

  function populateRecentCitiesDropdown() {
    recentCitiesDropdown.innerHTML = "";
    recentCities.forEach((city) => {
      const cityElement = document.createElement("div");
      cityElement.className = "p-3 hover:bg-blue-50 cursor-pointer";
      cityElement.textContent = city;
      cityElement.addEventListener("click", () => {
        cityInput.value = city;
        fetchWeatherData(city);
        recentCitiesDropdown.classList.add("hidden");
      });
      recentCitiesDropdown.appendChild(cityElement);
    });
  }

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

  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove("hidden");
  }

  function hideError() {
    errorContainer.classList.add("hidden");
  }

  async function fetchWeatherData(city) {
    showLoading(true);
    try {
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

  searchBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city || !/^[a-zA-Z\s,]+$/.test(city)) {
      showError("Please enter a valid city name (letters and spaces only)");
      return;
    }
    fetchWeatherData(city);
  });

  cityInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });

  cityInput.addEventListener("focus", () => {
    if (recentCities.length > 0) {
      populateRecentCitiesDropdown();
      recentCitiesDropdown.classList.remove("hidden");
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !cityInput.contains(e.target) &&
      !recentCitiesDropdown.contains(e.target)
    ) {
      recentCitiesDropdown.classList.add("hidden");
    }
  });

  currentLocationBtn.addEventListener("click", function () {
    if (navigator.geolocation) {
      showLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `${baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
            );
            const data = await response.json();
            displayCurrentWeather(data);
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
