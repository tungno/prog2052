package user

import (
	"backend/db"
	"backend/function"
	"cloud.google.com/go/firestore"
	"encoding/json"
	"io"
	"net/http"
	"time"
)

func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Email       string `json:"email"`
		OTP         string `json:"otp"`
		NewPassword string `json:"newPassword"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Unable to read request body", http.StatusBadRequest)
		return
	}

	err = json.Unmarshal(body, &requestData)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	// Validate new password
	if !function.IsValidPassword(requestData.NewPassword) {
		http.Error(w, "Password must be at least 8 characters long, contain at least one uppercase letter, one digit, and one special character", http.StatusBadRequest)
		return
	}

	doc, err := db.Client.Collection("users").Doc(requestData.Email).Get(db.Ctx)
	if err != nil || !doc.Exists() {
		http.Error(w, "Invalid email or OTP", http.StatusBadRequest)
		return
	}

	userData := doc.Data()

	// Check OTP and expiry
	storedOTP, ok := userData["OTP"].(string)
	if !ok || storedOTP != requestData.OTP {
		http.Error(w, "Invalid OTP", http.StatusBadRequest)
		return
	}

	otpExpiresAtInterface, ok := userData["OTPExpiresAt"]
	if !ok {
		http.Error(w, "OTP expiry not found", http.StatusBadRequest)
		return
	}

	var otpExpiresAt time.Time
	switch v := otpExpiresAtInterface.(type) {
	case time.Time:
		otpExpiresAt = v
	case *time.Time:
		otpExpiresAt = *v
	default:
		// Handle Firestore timestamp
		if t, ok := otpExpiresAtInterface.(interface{ Time() time.Time }); ok {
			otpExpiresAt = t.Time()
		} else {
			http.Error(w, "Invalid OTP expiry format", http.StatusBadRequest)
			return
		}
	}

	if time.Now().After(otpExpiresAt) {
		http.Error(w, "OTP has expired", http.StatusBadRequest)
		return
	}

	// Hash new password
	hashedPassword := function.HashPassword(requestData.NewPassword)

	// Update user's password and remove OTP fields
	_, err = db.Client.Collection("users").Doc(requestData.Email).Update(db.Ctx, []firestore.Update{
		{Path: "Password", Value: hashedPassword},
		{Path: "OTP", Value: firestore.Delete},
		{Path: "OTPExpiresAt", Value: firestore.Delete},
	})
	if err != nil {
		http.Error(w, "Failed to reset password", http.StatusInternalServerError)
		return
	}

	// Respond to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password has been reset successfully.",
	})
}
