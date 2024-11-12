// File: backend/user/cleanup.go
package user

import (
	"backend/db"
	"context"
	"log"
	"time"
)

// DeleteExpiredUnverifiedUsers deletes users who have not verified their email within the OTP expiration time.
func DeleteExpiredUnverifiedUsers() {
	ctx := context.Background()
	cutoffTime := time.Now()

	// Query users where IsVerified is false and OTPExpiresAt is before or equal to cutoffTime
	iter := db.Client.Collection("users").
		Where("IsVerified", "==", false).
		Where("OTPExpiresAt", "<=", cutoffTime).
		Documents(ctx)
	defer iter.Stop()

	var deletedCount int
	for {
		doc, err := iter.Next()
		if err != nil {
			if err.Error() == "iterator.Done" {
				break
			}
			log.Printf("Error iterating documents: %v", err)
			return
		}

		// Delete the user document
		_, err = db.Client.Collection("users").Doc(doc.Ref.ID).Delete(ctx)
		if err != nil {
			log.Printf("Failed to delete user %s: %v", doc.Ref.ID, err)
			continue // Continue deleting other users
		}
		log.Printf("Deleted unverified user: %s", doc.Ref.ID)
		deletedCount++
	}

	log.Printf("Cleanup complete. Deleted %d unverified users.", deletedCount)
}
