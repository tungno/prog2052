package db

import (
	"cloud.google.com/go/firestore"
	"context"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
	"log"
)

var Ctx context.Context
var Client *firestore.Client

// Initialize Firebase Firestore client
func InitFirestore() {
	var err error
	Ctx = context.Background()

	// Log for debugging
	log.Println("Initializing Firestore...")

	sa := option.WithCredentialsFile("./db/prog2052-project-firebase-adminsdk-hfyvm-bb27e2ade7.json")
	app, err := firebase.NewApp(Ctx, &firebase.Config{ProjectID: "prog2052-project"}, sa)
	if err != nil {
		log.Fatalln("Failed to create Firebase app:", err)
	} else {
		log.Println("Firebase app initialized successfully.")
	}

	Client, err = app.Firestore(Ctx)
	if err != nil {
		log.Fatalln("Failed to connect to Firestore:", err)
	} else {
		log.Println("Connected to Firestore successfully.")
	}
}

// CloseFirestore closes the Firestore client when not in use
func CloseFirestore() {
	Client.Close()
}
