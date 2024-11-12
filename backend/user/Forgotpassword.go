package user

import (
	"backend/db"
	"backend/email"
	"backend/function"
	"cloud.google.com/go/firestore"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Email string `json:"email"`
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

	doc, err := db.Client.Collection("users").Doc(requestData.Email).Get(db.Ctx)
	if err != nil || !doc.Exists() {
		// Do not reveal if the email exists
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "If the email exists, an OTP has been sent.",
		})
		return
	}

	userData := doc.Data()

	// Check if user is verified
	isVerified, ok := userData["IsVerified"].(bool)
	if !ok || !isVerified {
		http.Error(w, "Email not verified", http.StatusUnauthorized)
		return
	}

	// Generate OTP
	otpCode := function.GenerateOTP()
	otpExpiresAt := time.Now().Add(5 * time.Minute)

	// Update user document
	_, err = db.Client.Collection("users").Doc(requestData.Email).Update(db.Ctx, []firestore.Update{
		{Path: "OTP", Value: otpCode},
		{Path: "OTPExpiresAt", Value: otpExpiresAt},
	})
	if err != nil {
		http.Error(w, "Failed to generate OTP", http.StatusInternalServerError)
		return
	}

	// Send OTP email
	subject := "Your Password Reset Code"
	bodyText := fmt.Sprintf("Your OTP for password reset is: %s. It will expire in 5 minutes.", otpCode)
	err = email.SendOTPEmail(requestData.Email, subject, bodyText)
	if err != nil {
		log.Printf("Failed to send OTP email: %v", err)
		function.WriteJSONError(w, "Failed to send OTP email", http.StatusInternalServerError)
		return
	}

	// Respond to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "If the email exists, an OTP has been sent.",
	})
}
