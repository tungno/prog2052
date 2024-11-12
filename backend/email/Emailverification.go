package email

import (
	"backend/db"
	"backend/function"
	"cloud.google.com/go/firestore"
	"encoding/json"
	"fmt"
	"gopkg.in/gomail.v2"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

func SendOTPEmail(toEmail, subject, body string) error {
	emailUser := os.Getenv("EMAIL_USER")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")

	var emailPass string

	// Try to read EMAIL_PASS from Docker secret first
	emailPassBytes, err := ioutil.ReadFile("/run/secrets/EMAIL_PASS")
	if err == nil {
		// Successfully read from Docker secret
		emailPass = strings.TrimSpace(string(emailPassBytes))
	} else if os.IsNotExist(err) {
		// Secret file doesn't exist; try environment variable
		emailPass = os.Getenv("EMAIL_PASS")
		if emailPass == "" {
			return fmt.Errorf("EMAIL_PASS is not set in environment variables")
		}
	} else {
		// Some other error occurred
		return fmt.Errorf("Failed to read EMAIL_PASS: %v", err)
	}

	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return fmt.Errorf("Invalid SMTP_PORT: %v", err)
	}

	m := gomail.NewMessage()
	m.SetHeader("From", emailUser)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d := gomail.NewDialer(smtpHost, smtpPort, emailUser, emailPass)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("Failed to send email: %v", err)
	}

	return nil
}

func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
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

	doc, err := db.Client.Collection("users").Doc(requestData.Email).Get(db.Ctx)
	if err != nil || !doc.Exists() {
		function.WriteJSONError(w, "User not found", http.StatusNotFound)
		return
	}

	userData := doc.Data()

	// Check if user is already verified
	isVerified, ok := userData["IsVerified"].(bool)
	if ok && isVerified {
		function.WriteJSONError(w, "User already verified", http.StatusBadRequest)
		return
	}

	// Check OTP and expiry
	storedOTP, ok := userData["OTP"].(string)
	if !ok || storedOTP != requestData.OTP {
		function.WriteJSONError(w, "Invalid OTP", http.StatusBadRequest)
		return
	}

	otpExpiresAtInterface, ok := userData["OTPExpiresAt"]
	if !ok {
		function.WriteJSONError(w, "OTP expiry not found", http.StatusBadRequest)
		return
	}

	// Firestore stores time as `timestamp.Timestamp`
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
			function.WriteJSONError(w, "Invalid OTP expiry format", http.StatusBadRequest)
			return
		}
	}

	if time.Now().After(otpExpiresAt) {
		function.WriteJSONError(w, "OTP has expired", http.StatusBadRequest)
		return
	}

	// Update user to set IsVerified to true and remove OTP fields
	_, err = db.Client.Collection("users").Doc(requestData.Email).Update(db.Ctx, []firestore.Update{
		{Path: "IsVerified", Value: true},
		{Path: "OTP", Value: firestore.Delete},
		{Path: "OTPExpiresAt", Value: firestore.Delete},
	})
	if err != nil {
		function.WriteJSONError(w, "Failed to verify user", http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := function.GenerateJWT(requestData.Email)
	if err != nil {
		function.WriteJSONError(w, "Failed to generate JWT token", http.StatusInternalServerError)
		return
	}

	// Respond to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Email verified successfully",
		"token":   token,
	})
}
