package user

import (
	"backend/db"
	"backend/function"
	"cloud.google.com/go/firestore"
	"net/http"
	"strconv"
	"time"
)

// Maximum failed attempts before locking
const maxFailedAttempts = 5

// Lock duration in minutes
const lockDurationMinutes = 30

// Function to handle failed login attempts for non-existent users
func handleNonExistentUserLogin(w http.ResponseWriter) {
	// Simulate failed attempts by always starting from 0
	failedAttempts := int64(0)

	handleFailedLoginAttempt(w, "", failedAttempts, "Email or password is incorrect. You have ")
}

// Function to handle failed login attempts
func handleFailedLoginAttempt(w http.ResponseWriter, email string, failedAttempts int64, messagePrefix string) {
	// Increment failed attempts
	failedAttempts++

	var warningMessage string
	if failedAttempts >= maxFailedAttempts {
		if email != "" {
			// Lock the account for a certain duration if email exists
			lockUntilTime := time.Now().Add(time.Duration(lockDurationMinutes) * time.Minute)

			_, err := db.Client.Collection("users").Doc(email).Update(db.Ctx, []firestore.Update{
				{Path: "FailedLoginAttempts", Value: 0},
				{Path: "AccountLockedUntil", Value: lockUntilTime},
			})
			if err != nil {
				function.WriteJSONError(w, "Error updating lock status", http.StatusInternalServerError)
				return
			}
		}

		// Show lock message
		function.WriteJSONError(w, "Too many failed login attempts. Account is locked for 30 minutes.", http.StatusUnauthorized)
		return
	} else {
		// Update failed attempts in the database if email exists
		if email != "" {
			_, err := db.Client.Collection("users").Doc(email).Update(db.Ctx, []firestore.Update{
				{Path: "FailedLoginAttempts", Value: failedAttempts},
			})
			if err != nil {
				function.WriteJSONError(w, "Error updating login attempts", http.StatusInternalServerError)
				return
			}
		}

		// Inform the user about the remaining attempts
		remainingAttempts := maxFailedAttempts - int(failedAttempts)
		if remainingAttempts > 0 {
			warningMessage = messagePrefix + strconv.Itoa(remainingAttempts) + " attempts remaining."
		} else {
			warningMessage = messagePrefix + "This is your last attempt."
		}

		function.WriteJSONError(w, warningMessage, http.StatusUnauthorized)
		return
	}
}
