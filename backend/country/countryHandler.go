package country

import (
	"backend/model"
	"encoding/json"
	"net/http"
	"strings"
)

func GetCountries(w http.ResponseWriter, r *http.Request) {
	resp, err := http.Get("https://restcountries.com/v3.1/all")
	if err != nil {
		http.Error(w, "Error fetching countries", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var countriesData []struct {
		Name struct {
			Common string `json:"common"`
		} `json:"name"`
		Cca2 string `json:"cca2"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&countriesData); err != nil {
		http.Error(w, "Error decoding response", http.StatusInternalServerError)
		return
	}

	// Get search query parameter
	searchQuery := strings.ToLower(r.URL.Query().Get("search"))

	// If search query is less than 3 characters, return an empty list
	if len(searchQuery) < 3 {
		json.NewEncoder(w).Encode([]model.Country{})
		return
	}

	var countries []model.Country
	for _, country := range countriesData {
		countryName := strings.ToLower(country.Name.Common)
		if strings.HasPrefix(countryName, searchQuery) {
			countries = append(countries, model.Country{
				Name: country.Name.Common,
				Code: country.Cca2,
			})
		}
	}

	// Send filtered countries
	json.NewEncoder(w).Encode(countries)
}
