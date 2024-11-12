package user

import (
	"backend/db"
	"backend/model"
	"encoding/json"
	"github.com/dgrijalva/jwt-go"
	"net/http"
	"os"
)

var jwtSecretKey = os.Getenv("JWT_SECRET_KEY")

// API to get user info based on JWT token
func GetUserInfo(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "Authorization token is missing", http.StatusUnauthorized)
		return
	}

	tokenString = tokenString[len("Bearer "):]

	claims := &model.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecretKey), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	doc, err := db.Client.Collection("users").Doc(claims.Email).Get(db.Ctx)
	if err != nil || !doc.Exists() {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	userData := doc.Data()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"username": userData["Username"].(string),
		"email":    claims.Email,
		"imageUrl": userData["ImageURL"].(string),
	})
}
