package user

import (
	"backend/db"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// SearchUsersByUsername allows users to search for others by username (case-insensitive)
func SearchUsersByUsername(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	// Convert the query to lowercase for case-insensitive search
	queryLower := strings.ToLower(query)

	// Retrieve the current user's email from JWT token context
	currentUserEmail := r.Context().Value("userEmail").(string)

	// Log the search query for debugging
	log.Printf("Search query: %s", queryLower)

	// Firestore query to search for users whose UsernameLower field starts with the query (case-insensitive)
	docs, err := db.Client.Collection("users").
		Where("UsernameLower", ">=", queryLower).
		Where("UsernameLower", "<=", queryLower+"\uf8ff").
		Documents(db.Ctx).GetAll()

	// Log the search results for debugging
	log.Printf("Search results count: %d", len(docs))

	if err != nil || len(docs) == 0 {
		http.Error(w, "No users found", http.StatusNotFound)
		return
	}

	// Process the results
	var results []map[string]string
	for _, doc := range docs {
		data := doc.Data()
		username, ok := data["Username"].(string) // Get original casing
		if !ok {
			continue // Skip if Username field doesn't exist
		}
		email, ok := data["Email"].(string)
		if !ok {
			continue // Skip if Email field doesn't exist
		}

		// Determine the friend request status
		status := "none" // default status if no relationship is found

		// Check if the current user has already sent a friend request
		docRef := db.Client.Collection("friends").Doc(currentUserEmail + "_" + email)
		docSnapshot, _ := docRef.Get(db.Ctx)
		if docSnapshot.Exists() {
			status = docSnapshot.Data()["Status"].(string)
		} else {
			// Check if the searched user has already sent a friend request to the current user
			recipientToSenderDocRef := db.Client.Collection("friends").Doc(email + "_" + currentUserEmail)
			recipientToSenderDocSnapshot, _ := recipientToSenderDocRef.Get(db.Ctx)
			if recipientToSenderDocSnapshot.Exists() {
				status = recipientToSenderDocSnapshot.Data()["Status"].(string)
				// If the status is 'pending', allow the current user to accept/decline the request
				if status == "pending" {
					status = "received"
				}
			}
		}

		// Append the result with the relationship status
		results = append(results, map[string]string{
			"username": username,
			"email":    email,
			"status":   status, // Return the status of the friend request or relationship
		})
	}

	// Return the search results
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
