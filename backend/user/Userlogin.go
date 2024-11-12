package user

import (
	"backend/db"
	"backend/function"
	"backend/model"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
)

// User Login Handler with failed attempts tracking and account lock logic
func UserLogin(w http.ResponseWriter, r *http.Request) {
	var loginData model.User
	body, err := io.ReadAll(r.Body)
	if err != nil {
		function.WriteJSONError(w, "Unable to read request body", http.StatusBadRequest)
		return
	}

	err = json.Unmarshal(body, &loginData)
	if err != nil {
		function.WriteJSONError(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	// Get user document from Firestore
	doc, err := db.Client.Collection("users").Doc(loginData.Email).Get(db.Ctx)

	// Check if email exists
	if err != nil || !doc.Exists() {
		// Simulate failed login attempts for non-existent emails
		handleNonExistentUserLogin(w)
		return
	}

	userData := doc.Data()

	// Check if the account is locked
	if lockedUntilInterface, ok := userData["AccountLockedUntil"]; ok && lockedUntilInterface != nil {
		lockedUntil, ok := lockedUntilInterface.(time.Time)
		if !ok {
			log.Printf("Unexpected type for AccountLockedUntil: %T, value: %v", lockedUntilInterface, lockedUntilInterface)
			function.WriteJSONError(w, "Invalid lock time format", http.StatusInternalServerError)
			return
		}
		if time.Now().Before(lockedUntil) {
			function.WriteJSONError(w, "Account is temporarily locked. Please try again later.", http.StatusUnauthorized)
			return
		}
	}

	// Check if user is verified
	isVerified, ok := userData["IsVerified"].(bool)
	if !ok || !isVerified {
		function.WriteJSONError(w, "Email not verified. Please verify your email before logging in.", http.StatusUnauthorized)
		return
	}

	storedPassword, ok := userData["Password"].(string)
	if !ok {
		function.WriteJSONError(w, "Invalid user data", http.StatusInternalServerError)
		return
	}

	// Verify if the password is correct
	if function.HashPassword(loginData.Password) != storedPassword {
		// Password is incorrect, handle the failed attempt
		failedAttempts, ok := userData["FailedLoginAttempts"].(int64)
		if !ok {
			// If 'FailedLoginAttempts' doesn't exist, initialize it to 0
			failedAttempts = 0
		}
		handleFailedLoginAttempt(w, loginData.Email, failedAttempts, "Email or password is incorrect. You have ")
		return
	}

	// Password is correct, reset failed attempts after successful login
	_, err = db.Client.Collection("users").Doc(loginData.Email).Update(db.Ctx, []firestore.Update{
		{Path: "FailedLoginAttempts", Value: 0},
		{Path: "AccountLockedUntil", Value: firestore.Delete}, // Correctly delete the field
	})

	if err != nil {
		function.WriteJSONError(w, "Error resetting login attempts", http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := function.GenerateJWT(loginData.Email)
	if err != nil {
		function.WriteJSONError(w, "Failed to generate JWT token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
	})
}
