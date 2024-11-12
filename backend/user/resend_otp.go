// File: backend/user/resend_otp.go
package user

import (
	"backend/db"
	"backend/email"
	"backend/function"
	"cloud.google.com/go/firestore"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ResendOTP handles requests to resend the OTP for email verification.
func ResendOTP(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Email string `json:"email"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		function.WriteJSONError(w, "Unable to read request body", http.StatusBadRequest)
		return
	}

	err = json.Unmarshal(body, &requestData)
	if err != nil {
		function.WriteJSONError(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	// Get user document from Firestore
	doc, err := db.Client.Collection("users").Doc(requestData.Email).Get(db.Ctx)
	if err != nil || !doc.Exists() {
		function.WriteJSONError(w, "User not found", http.StatusNotFound)
		return
	}

	// Generate new OTP
	newOTP := function.GenerateOTP()
	newOTPExpireAt := time.Now().Add(5 * time.Minute)

	// Update user document with new OTP and expiry
	_, err = db.Client.Collection("users").Doc(requestData.Email).Update(db.Ctx, []firestore.Update{
		{Path: "OTP", Value: newOTP},
		{Path: "OTPExpiresAt", Value: newOTPExpireAt},
	})
	if err != nil {
		function.WriteJSONError(w, "Failed to update OTP", http.StatusInternalServerError)
		return
	}

	// Send new OTP email
	subject := "Your New Verification Code"
	bodyText := fmt.Sprintf("Your new OTP for email verification is: %s. It will expire in 5 minutes.", newOTP)
	err = email.SendOTPEmail(requestData.Email, subject, bodyText)
	if err != nil {
		function.WriteJSONError(w, "Failed to send OTP email", http.StatusInternalServerError)
		return
	}

	// Respond to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "A new OTP has been sent to your email address.",
	})
}
