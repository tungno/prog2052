package user

import (
	"backend/db"
	"backend/email"
	"backend/function"
	"backend/model"
	"encoding/json"
	"fmt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// User Signup Handler
func UserSignup(w http.ResponseWriter, r *http.Request) {
	var user model.User
	body, err := io.ReadAll(r.Body)
	if err != nil {
		function.WriteJSONError(w, "Unable to read request body", http.StatusBadRequest)
		return
	}

	err = json.Unmarshal(body, &user)
	if err != nil {
		function.WriteJSONError(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	// Validate that country, city, email, username, and password are provided
	if user.Country == "" || user.City == "" || user.Email == "" || user.Username == "" || user.Password == "" {
		function.WriteJSONError(w, "Country, City, Email, Username, and Password are required", http.StatusBadRequest)
		return
	}

	// Check if the email already exists in the database
	doc, err := db.Client.Collection("users").Doc(user.Email).Get(db.Ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			// Email not registered, proceed
		} else {
			// Log and return if there is any other error
			log.Printf("Error retrieving document for email %s: %v", user.Email, err)
			function.WriteJSONError(w, "Failed to check if email exists", http.StatusInternalServerError)
			return
		}
	} else if doc.Exists() {
		// If document exists, return conflict status
		function.WriteJSONError(w, "Email already registered", http.StatusConflict)
		return
	}

	// Validate password complexity
	if !function.IsValidPassword(user.Password) {
		function.WriteJSONError(w, "Password must be at least 8 characters long, contain at least one uppercase letter, one digit, and one special character", http.StatusBadRequest)
		return
	}

	// Hash the user's password
	user.Password = function.HashPassword(user.Password)

	// Set IsVerified to false
	user.IsVerified = false

	// Store the lowercase version of the username for case-insensitive search
	user.UsernameLower = strings.ToLower(user.Username)

	// Generate OTP
	otpCode := function.GenerateOTP()
	otpExpireAt := time.Now().Add(5 * time.Minute)

	user.OTP = otpCode
	user.OTPExpiresAt = otpExpireAt

	// Save the user to Firestore
	_, err = db.Client.Collection("users").Doc(user.Email).Set(db.Ctx, user)
	if err != nil {
		function.WriteJSONError(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Send OTP email
	subject := "Your Verification Code"
	bodyText := fmt.Sprintf("Your OTP for email verification is: %s. It will expire in 5 minutes.", otpCode)
	err = email.SendOTPEmail(user.Email, subject, bodyText)
	if err != nil {
		function.WriteJSONError(w, "Failed to send OTP email", http.StatusInternalServerError)
		return
	}

	// Respond to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Signup successful. Please verify your email using the OTP sent to your email address.",
	})
}
