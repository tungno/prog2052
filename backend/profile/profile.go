package profile

import (
	"backend/db"
	"backend/function"
	"encoding/json"
	"net/http"

	"cloud.google.com/go/firestore"
)

func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		GetProfileHandler(w, r)
	case "PUT":
		UpdateProfileHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok {
		http.Error(w, "User email not found in context", http.StatusUnauthorized)
		return
	}

	doc, err := db.Client.Collection("users").Doc(userEmail).Get(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to get profile", http.StatusInternalServerError)
		return
	}

	var profileData map[string]interface{}
	doc.DataTo(&profileData)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profileData)
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	userEmail, ok := r.Context().Value("userEmail").(string)
	if !ok {
		http.Error(w, "User email not found in context", http.StatusUnauthorized)
		return
	}

	var updatedData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updatedData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	doc, err := db.Client.Collection("users").Doc(userEmail).Get(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to retrieve user data", http.StatusInternalServerError)
		return
	}
	userData := doc.Data()
	storedHashedPassword := userData["Password"].(string)

	// Ensure the current password is provided for all updates
	currentPassword, ok := updatedData["CurrentPassword"].(string)
	if !ok || function.HashPassword(currentPassword) != storedHashedPassword {
		http.Error(w, "Invalid current password", http.StatusUnauthorized)
		return
	}

	// Update password if new password is provided
	if newPassword, ok := updatedData["NewPassword"].(string); ok && newPassword != "" {
		if !function.IsValidPassword(newPassword) {
			http.Error(w, "Password does not meet complexity requirements", http.StatusBadRequest)
			return
		}
		updatedData["Password"] = function.HashPassword(newPassword)
	}

	delete(updatedData, "CurrentPassword")
	delete(updatedData, "NewPassword")
	delete(updatedData, "Email") // Prevent email from being updated

	_, err = db.Client.Collection("users").Doc(userEmail).Set(db.Ctx, updatedData, firestore.MergeAll)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Successfully updated profile"})
}
