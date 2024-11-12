package city

import (
	"backend/model"
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
)

func GetCities(w http.ResponseWriter, r *http.Request) {
	// Get the country parameter from the query string
	country := r.URL.Query().Get("country")
	if country == "" {
		http.Error(w, "Missing country parameter", http.StatusBadRequest)
		return
	}

	// Create the request body for the external API
	requestBody, err := json.Marshal(model.CityRequest{Country: country})
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Make a POST request to the external API
	resp, err := http.Post("https://countriesnow.space/api/v0.1/countries/cities", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		http.Error(w, "Error fetching cities", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error reading cities response", http.StatusInternalServerError)
		return
	}

	// Parse the response
	var cityResponse model.CityResponse
	if err := json.Unmarshal(body, &cityResponse); err != nil {
		http.Error(w, "Error decoding cities response", http.StatusInternalServerError)
		return
	}

	// Send the cities back to the frontend
	json.NewEncoder(w).Encode(cityResponse)
}
