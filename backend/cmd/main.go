package main

import (
	"backend/city"
	"backend/country"
	"backend/db"
	"backend/email"
	"backend/event"
	"backend/friend"
	"backend/journal"
	"backend/middleware"
	"backend/news"
	"backend/profile"
	"backend/user"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"

	"github.com/rs/cors"
)

func init() {
	// Load the .env file at the start of the application
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error reading .env file")
	}

	db.InitFirestore()
	defer db.CloseFirestore()

	// Start the cleanup goroutine
	go func() {
		ticker := time.NewTicker(5 * time.Minute) // Run every 5 minutes
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				log.Println("Running cleanup of expired unverified users...")
				user.DeleteExpiredUnverifiedUsers()
			}
		}
	}()

	// User routes
	http.Handle("/api/signup", middleware.RateLimitMiddleware(http.HandlerFunc(user.UserSignup)))
	http.Handle("/api/login", middleware.RateLimitMiddleware(http.HandlerFunc(user.UserLogin)))
	http.Handle("/api/resend-otp", middleware.RateLimitMiddleware(http.HandlerFunc(user.ResendOTP)))
	http.HandleFunc("/api/verify-email", email.VerifyEmail)
	http.HandleFunc("/api/forgot-password", user.ForgotPassword)
	http.HandleFunc("/api/reset-password", user.ResetPassword)

	http.HandleFunc("/api/me", middleware.JwtAuthMiddleware(user.GetUserInfo))

	// Event routes
	http.HandleFunc("/api/events/create", middleware.JwtAuthMiddleware(event.CreateEventHandler))
	http.HandleFunc("/api/events/get", middleware.JwtAuthMiddleware(event.GetEventHandler))
	http.HandleFunc("/api/events/update", middleware.JwtAuthMiddleware(event.UpdateEventHandler))
	http.HandleFunc("/api/events/delete", middleware.JwtAuthMiddleware(event.DeleteEventHandler))
	http.HandleFunc("/api/events/all", middleware.JwtAuthMiddleware(event.GetAllEventsHandler))

	// NTNU Timetable import route
	http.HandleFunc("/api/import-ntnu-timetable", middleware.JwtAuthMiddleware(event.NTNUTimetableImportHandler))

	// Friend routes using username
	http.HandleFunc("/api/friends/add", middleware.JwtAuthMiddleware(friend.SendFriendRequestByUsername))
	http.HandleFunc("/api/friends/accept", middleware.JwtAuthMiddleware(friend.AcceptFriendRequestByUsername))
	http.HandleFunc("/api/friends/list", middleware.JwtAuthMiddleware(friend.GetFriendsList))
	http.HandleFunc("/api/friends/delete", middleware.JwtAuthMiddleware(friend.RemoveFriend))
	http.HandleFunc("/api/friends/requests", middleware.JwtAuthMiddleware(friend.GetPendingFriendRequests))
	http.HandleFunc("/api/friends/decline", middleware.JwtAuthMiddleware(friend.DeclineFriendRequestByUsername))
	http.HandleFunc("/api/friends/cancel", middleware.JwtAuthMiddleware(friend.CancelFriendRequest))

	// Search for users by username
	http.HandleFunc("/api/users/search", middleware.JwtAuthMiddleware(user.SearchUsersByUsername))

	http.Handle("/api/profile", middleware.JwtAuthMiddleware(profile.ProfileHandler))

	http.HandleFunc("/api/countries", country.GetCountries)
	http.HandleFunc("/api/cities", city.GetCities)

	http.Handle("/api/news", middleware.JwtAuthMiddleware(http.HandlerFunc(news.FetchNewsHandler)))

	// Journal routes
	http.HandleFunc("/api/journal/save", middleware.JwtAuthMiddleware(journal.CreateJournalHandler))
	http.HandleFunc("/api/journal/", middleware.JwtAuthMiddleware(journal.GetJournalHandler))
	http.HandleFunc("/api/journal/update/", middleware.JwtAuthMiddleware(journal.UpdateJournalHandler))
	http.HandleFunc("/api/journal/delete/", middleware.JwtAuthMiddleware(journal.DeleteJournalHandler))
	http.HandleFunc("/api/journals/", middleware.JwtAuthMiddleware(journal.GetAllJournalsHandler)) // Check here

	// Wrap handlers with CORS middleware
	c := cors.New(cors.Options{
		//AllowedOrigins:   []string{"http://localhost:3000"}, // Allow frontend
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	handler := c.Handler(http.DefaultServeMux)
	log.Printf("Server running on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
