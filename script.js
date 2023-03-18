// API Key that needs to be passed into the URL in the ajax call(s).
var OpenWeatherAPIKey = config.OpenWeatherAPIKey;

var OpenWeatherDateFormat = "YYYY-MM-DD HH:mm:ss";

// Number of locations in response.
var defaultLimit = 1;

$("#search-button").addClass("btn-dark");

// Will need this later to display city name in jumbotron.
var displayLocation;

// Will need this later to display list of previously searched city names.
var previouslySearchedLocations = [];

function filterForecast(list) {
  // Since the API call (https://openweathermap.org/forecast5) returns 5 days of results spread across 3 hour intervals, the very first result can be used as a guide. Hours are displayed in the 24 hour format, so these will not repeat. Following that logic, can filter all the results in the API response that have the same time as that first result, which will get me (on a best case scenario) 5 days worth of weather forecast to display. Can achieve this by targeting the API response field that holds the date and time, `dt_txt`.
  var initialForecastDate = moment(list[0].dt_txt, OpenWeatherDateFormat);

  var forecastDates = [];

  for (let i = 0; i < 6; i++) {
    forecastDates.push(
      // `.clone()` (https://momentjscom.readthedocs.io/en/latest/moment/01-parsing/12-moment-clone/) needs to be used to avoid mutating the date.
      initialForecastDate.clone().add(i, "days").format(OpenWeatherDateFormat)
    );
  }

  // If the dates saved in the `forecastDates` array are found in the filter that runs through the API response (list), then save the corresponding weather object into the `result` array.
  var result = list.filter(function (forecast) {
    return forecastDates.includes(forecast.dt_txt);
  });

  if (result.length < 6) {
    // In the event that the hour we are using as a guide does not yeld 6 (daily and 5 day forecast) results, go get the last available result(s) to complete the `result` array.
    result.push(list[list.length - 1]);
  }

  // console.log("result (6 day forecast, all response fields) ===>", result);
  return result;
}

// Dynamically creating an objet with just the handful of response fields that need to be displayed.
function forecastDetails(list) {
  return list.map(function (forecast) {
    return {
      date: moment(forecast.dt_txt, OpenWeatherDateFormat).format("DD/M/YYYY"),
      // https://openweathermap.org/weather-conditions
      icon: `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`,
      temperature: forecast.main.temp,
      wind: (forecast.wind.speed * 3.6).toFixed(2),
      humidity: forecast.main.humidity,
    };
  });
}

// Populating the jumbotron with current weather forecast.
function jumbotronElement(element, contents) {
  $(element).append(`
  <div class="jumbotron">
    <h1 class="display-6"> (${contents.date})<img src="${contents.icon}" /></h1>
      <br>
        <p>Temperature: ${contents.temperature} °C</p>
        <p>Wind: ${contents.wind} KPH</p>
        <p>Humidity: ${contents.humidity} %</p>
  </div>
  `);

  $(".display-6").prepend(`${displayLocation}`);
}

// Populating the cards with the 5 day forecast.
function cardElement(element, contents) {
  $(element).append(`
  <div class="col">
    <div class="card bg-secondary text-light">
      <div class="card-body">
        <h6 class="card-title">${contents.date}<img src="${contents.icon}" /></h6>
          <p>Temperature: ${contents.temperature} °C</p>
          <p>Wind: ${contents.wind} KPH</p>
          <p>Humidity: ${contents.humidity} %</p>
      </div>
    </div>
  </div>
    `);
}

function dashboard(location) {
  // If the user simply hits "Enter" or clicks "Search" (without entering any text) they need to be prompted to complete the necessary field.
  if (location === "") {
    // !!! Currently only logging in browser console.
    throw new Error("Sorry, city name cannot be empty. Care to try again?");
  }

  $.ajax({
    // Since in order to use the 5 day weather forecast API call I need the correct latitude and longitude coordinates, I first need to make use of the Geocoding API (https://openweathermap.org/api/geocoding-api) to obtain those.
    url: `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=${defaultLimit}&appid=${OpenWeatherAPIKey}`,
    method: "GET",
  }).then(function (coordinatesResponse) {
    // console.log("coordinatesResponse ===>", coordinatesResponse);

    // If the user types an invalid location, they need to be prompted to re-type the city name. We know this will be an invalid location when our coordinatesResponse comes back as an empty array.
    if (!coordinatesResponse.length) {
      // !!! Currently not working.
      throw new Error(
        "Sorry, unable to find selected location. Care to try again?"
      );
    } else {
      // Using the first available values.
      var latitude = coordinatesResponse[0].lat;
      var longitude = coordinatesResponse[0].lon;

      $.ajax({
        // Once coordinates have been obtained, they can be used in our main API call, the 5 day weather forecast (https://openweathermap.org/forecast5).
        // (Since the mock-up for the challenge showed the temperature in Celsius, I adjusted my API call so that I can get the correct units of measure (metric) from the get-go.)
        url: `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OpenWeatherAPIKey}&units=metric`,
        method: "GET",
      }).then(function (forecastResponse) {
        // console.log(
        //   "forecastResponse ===>",
        //   forecastResponse);

        displayLocation = forecastResponse.city.name;

        var filteredForecast = filterForecast(forecastResponse.list);
        // console.log("filtered list ===>", filteredForecast);

        var details = forecastDetails(filteredForecast);
        // console.log("details ===>", details);

        $("#forecast").append(`
        <div class="container">
          <h2>5 Day Forecast</h2>
            <div class="row">
            </div>
        </div>
          `);

        // display current weather forecast
        jumbotronElement("#today", details[0]);

        // display 5 day weather forecast
        for (let i = 1; i < 6; i++) {
          cardElement("#forecast", details[i]);
        }
      });
    }
  });
}

function storeLocationSearch() {
  localStorage.setItem(
    "previouslySearchedLocations",
    JSON.stringify(previouslySearchedLocations)
  );
}

// Once the user enters a location and hits "Enter" or clicks "Search", this will trigger the dashboard function, which will trigger the necessary requests to the OpenWeather API.
$("button").on("click", function () {
  event.preventDefault();

  // Name of the city the user has typed in.
  var userCitySelection = $("#search-input");
  var location = userCitySelection.val();

  dashboard(location);
  clearPreviousSearch();
});

function clearPreviousSearch() {
  $("#today").children().remove();
  $("#forecast").children().remove();
}
