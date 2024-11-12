package news

import (
	"backend/db" // Import Firestore database package
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

var newsAPIKey = "pub_58222250ec093e974f1315f04ef5e3cf8ac99"

// getCountryAndLanguageCode retrieves the country code and primary language code from the hardcoded map.
func getCountryAndLanguageCode(countryName string) (string, string, error) {
	// Check if the country is in the map
	if entry, exists := CountryLanguageMap[countryName]; exists {
		return entry.CountryCode, entry.LanguageCode, nil
	}

	// Return an error if the country is not found
	return "", "", fmt.Errorf("country not found in map: %s", countryName)
}

func FetchNewsHandler(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	country := r.URL.Query().Get("country")
	limit := 30
	query := r.URL.Query().Get("q")

	if limitParam := r.URL.Query().Get("limit"); limitParam != "" {
		fmt.Sscanf(limitParam, "%d", &limit)
	}

	log.Printf("Initial Country: %s, Mode: %s, Limit: %d, Query: %s\n", country, mode, limit, query)

	if mode == "local" && country == "" {
		userEmail, ok := r.Context().Value("userEmail").(string)
		if !ok || userEmail == "" {
			log.Println("User email not found in context")
			http.Error(w, "User email missing for local news", http.StatusBadRequest)
			return
		}

		doc, err := db.Client.Collection("users").Doc(userEmail).Get(context.Background())
		if err != nil {
			log.Printf("Error fetching user profile: %v\n", err)
			http.Error(w, "Failed to fetch user profile", http.StatusInternalServerError)
			return
		}

		if profileCountry, ok := doc.Data()["Country"].(string); ok && profileCountry != "" {
			country = profileCountry
			log.Printf("Retrieved Country from Profile: %s\n", country)
		} else {
			log.Println("Country not found in user profile")
			http.Error(w, "Country not found in user profile", http.StatusBadRequest)
			return
		}
	}

	// Build URL for NewsData API
	var url string
	if mode == "local" && country != "" {
		countryCode, languageCode, err := getCountryAndLanguageCode(country)
		if err != nil {
			log.Printf("Error getting country and language code: %v\n", err)
			http.Error(w, "Invalid country for local news", http.StatusBadRequest)
			return
		}
		url = fmt.Sprintf("https://newsdata.io/api/1/news?country=%s&language=%s&apikey=%s", countryCode, languageCode, newsAPIKey)
	} else {
		url = fmt.Sprintf("https://newsdata.io/api/1/news?language=en&apikey=%s", newsAPIKey)
	}

	// Only append the `q` parameter if `query` is not empty
	if query != "" {
		url += fmt.Sprintf("&q=%s", query)
	}

	log.Printf("Requesting URL: %s\n", url)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching news: %v\n", err)
		http.Error(w, "Failed to fetch news", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var result struct {
		Status       string                   `json:"status"`
		TotalResults int                      `json:"totalResults"`
		Results      []map[string]interface{} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Error decoding news data: %v\n", err)
		http.Error(w, "Failed to parse news data", http.StatusInternalServerError)
		return
	}

	if len(result.Results) > limit {
		result.Results = result.Results[:limit]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result.Results)
}
