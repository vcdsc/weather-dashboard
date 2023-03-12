// Since in order to use the 5 day weather forecast API call I need the correct latitude and longitude coordinates, I first need to make use of the Geocoding API (https://openweathermap.org/api/geocoding-api) to obtain those.
function getLocationCoordinates(city) {
  return `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${defaultLimit}&appid=${OpenWeatherAPIKey}`;
}

// Once coordinates have been obtained, they can be used in our main API call, the 5 day weather forecast (https://openweathermap.org/forecast5).
// (Since the mock-up for the challenge showed the temperature in Celsius, I adjusted my API call so that I can get the correct units of measure from the get-go.)
function getLocationForecast(latitude, longitude) {
  return `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OpenWeatherAPIKey}&units=metric`;
}

// The values below are query parameters, will need them to compose the query URL(s) to the OpenWeatherAPI.

// ===> API Key.
var OpenWeatherAPIKey = config.OpenWeatherAPIKey;

// ===> User input for location.
var userCitySelection = $("#search-input");

// ===> Number of locations in response.
var defaultLimit = 1;

// Will need these later on, to append/style the API results.
var weatherToday = $("#today");
var weather5DayForecast = $("#forecast");

// Once the user enters a location and hits "Enter" or clicks "Search", this will trigger a request to the OpenWeather API.
$("button").on("click", function () {
  event.preventDefault();

  // 1) Name of the city the user has typed in.
  var city = userCitySelection.val();
  // 2) Use this value in the helper function that computes the necessary variables into a query URL.
  var queryCoordinatesURL = getLocationCoordinates(city);

  $.ajax({
    // 3) Pass the query URL onto the Ajax request.
    url: queryCoordinatesURL,
    method: "GET",
  }).then(function (coordinatesResponse) {
    // console.log("coordinatesResponse ===>", coordinatesResponse);
    var latitude = coordinatesResponse[0].lat;
    var longitude = coordinatesResponse[0].lon;

    // 4) Use the results from the previous step (latitude and longitude) to construct the next query URL, as these values where needed as variables there too.
    var queryForecastURL = getLocationForecast(latitude, longitude);

    $.ajax({
      // 5) As before, pass the query URL onto the Ajax request.
      url: queryForecastURL,
      method: "GET",
    }).then(function (forecastResponse) {
      // 6) The necessary weather elements for a 5 day weather are in `forecastResponse.list`. Need to figure out a way
      //   console.log("forecastResponse ===>", forecastResponse);
      console.log("forecastResponse.list ===>", forecastResponse.list);
    });
  });
});
