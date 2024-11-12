package friend

import (
	"backend/db"
	"backend/model"
	"cloud.google.com/go/firestore"
	"encoding/json"
	"net/http"
)

// SendFriendRequestByUsername allows users to send friend requests using a username
func SendFriendRequestByUsername(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Username string `json:"username"` // Target user's username (friend to add)
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Retrieve the sender email from context (JWT claims)
	requesterEmail := r.Context().Value("userEmail").(string)

	// Retrieve the email of the user by username
	doc, err := db.Client.Collection("users").Where("Username", "==", requestBody.Username).Limit(1).Documents(db.Ctx).Next()
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	friendEmail := doc.Data()["Email"].(string)

	// Prevent sending a friend request to self
	if requesterEmail == friendEmail {
		http.Error(w, "You cannot send a friend request to yourself", http.StatusBadRequest)
		return
	}

	// Check if a friend request or relationship already exists (from sender to recipient)
	senderToRecipientDocRef := db.Client.Collection("friends").Doc(requesterEmail + "_" + friendEmail)
	senderToRecipientDocSnapshot, err := senderToRecipientDocRef.Get(db.Ctx)
	if err == nil && senderToRecipientDocSnapshot.Exists() {
		http.Error(w, "Friend request already exists or you are already friends", http.StatusConflict)
		return
	}

	// Check if a friend request exists from the recipient to the sender (recipient already sent a request)
	recipientToSenderDocRef := db.Client.Collection("friends").Doc(friendEmail + "_" + requesterEmail)
	recipientToSenderDocSnapshot, err := recipientToSenderDocRef.Get(db.Ctx)
	if err == nil && recipientToSenderDocSnapshot.Exists() {
		status := recipientToSenderDocSnapshot.Data()["Status"].(string)
		if status == "pending" {
			http.Error(w, "This user has already sent you a friend request. You can accept or decline it.", http.StatusConflict)
			return
		}
	}

	// Create new friend request (pending)
	friendRequest := model.Friend{
		Email:       requesterEmail,
		FriendEmail: friendEmail,
		Status:      "pending",
	}
	_, err = senderToRecipientDocRef.Set(db.Ctx, friendRequest)
	if err != nil {
		http.Error(w, "Failed to send friend request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Friend request sent"})
}

// AcceptFriendRequestByUsername allows users to accept friend requests using a username
func AcceptFriendRequestByUsername(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Username string `json:"username"` // Username of the person who sent the friend request
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the acceptor's email from the JWT token context
	requesterEmail := r.Context().Value("userEmail").(string)

	// Retrieve the email of the friend request sender by username
	senderDoc, err := db.Client.Collection("users").Where("Username", "==", requestBody.Username).Limit(1).Documents(db.Ctx).Next()
	if err != nil {
		http.Error(w, "Friend request sender not found", http.StatusNotFound)
		return
	}
	senderEmail := senderDoc.Data()["Email"].(string)

	// Check if there is a pending friend request from the sender
	docRef := db.Client.Collection("friends").Doc(senderEmail + "_" + requesterEmail)
	docSnapshot, err := docRef.Get(db.Ctx)
	if err != nil || !docSnapshot.Exists() || docSnapshot.Data()["Status"].(string) != "pending" {
		http.Error(w, "Friend request not found", http.StatusNotFound)
		return
	}

	// Update the friend request status to accepted
	_, err = docRef.Update(db.Ctx, []firestore.Update{
		{Path: "Status", Value: "accepted"},
	})
	if err != nil {
		http.Error(w, "Failed to accept friend request", http.StatusInternalServerError)
		return
	}

	// Create the reciprocal relationship in the database
	reciprocalDocRef := db.Client.Collection("friends").Doc(requesterEmail + "_" + senderEmail)
	reciprocalFriend := model.Friend{
		Email:       requesterEmail,
		FriendEmail: senderEmail,
		Status:      "accepted",
	}
	_, err = reciprocalDocRef.Set(db.Ctx, reciprocalFriend)
	if err != nil {
		http.Error(w, "Failed to create reciprocal friend relationship", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Friend request accepted"})
}

// RemoveFriend allows users to remove friends
func RemoveFriend(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Username string `json:"username"` // Username of the friend to remove
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the remover's email from the JWT token context
	requesterEmail := r.Context().Value("userEmail").(string)

	// Retrieve the email of the friend by username
	friendDoc, err := db.Client.Collection("users").Where("Username", "==", requestBody.Username).Limit(1).Documents(db.Ctx).Next()
	if err != nil {
		http.Error(w, "Friend not found", http.StatusNotFound)
		return
	}
	friendEmail := friendDoc.Data()["Email"].(string)

	// Remove both relationships from the database
	docRef := db.Client.Collection("friends").Doc(requesterEmail + "_" + friendEmail)
	_, err = docRef.Delete(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to remove friend", http.StatusInternalServerError)
		return
	}

	reciprocalDocRef := db.Client.Collection("friends").Doc(friendEmail + "_" + requesterEmail)
	_, err = reciprocalDocRef.Delete(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to remove reciprocal friend", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Friend removed successfully"})
}

// GetFriendsList fetches all friends of the logged-in user
func GetFriendsList(w http.ResponseWriter, r *http.Request) {
	// Retrieve the user's email from JWT token context
	userEmail := r.Context().Value("userEmail").(string)

	// Query accepted friends
	docs, err := db.Client.Collection("friends").Where("Email", "==", userEmail).Where("Status", "==", "accepted").Documents(db.Ctx).GetAll()
	if err != nil {
		http.Error(w, "Failed to fetch friends", http.StatusInternalServerError)
		return
	}

	var friends []string
	for _, doc := range docs {
		friendEmail := doc.Data()["FriendEmail"].(string)

		// Fetch the friend's username using their email
		friendDoc, err := db.Client.Collection("users").Doc(friendEmail).Get(db.Ctx)
		if err != nil {
			http.Error(w, "Failed to fetch friend's username", http.StatusInternalServerError)
			return
		}
		friendUsername := friendDoc.Data()["Username"].(string)

		friends = append(friends, friendUsername) // Return username instead of email
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(friends)
}

// GetPendingFriendRequests retrieves all pending friend requests for the logged-in user
func GetPendingFriendRequests(w http.ResponseWriter, r *http.Request) {
	// Get the user's email from the JWT token context
	userEmail := r.Context().Value("userEmail").(string)

	// Query for pending friend requests where the current user is the friendEmail (recipient)
	docs, err := db.Client.Collection("friends").
		Where("FriendEmail", "==", userEmail).
		Where("Status", "==", "pending").
		Documents(db.Ctx).GetAll()

	if err != nil || len(docs) == 0 {
		http.Error(w, "No pending friend requests found", http.StatusNotFound)
		return
	}

	var pendingRequests []map[string]string
	for _, doc := range docs {
		data := doc.Data()

		// Query to get the sender's username from their email
		senderEmail := data["Email"].(string)
		senderDoc, err := db.Client.Collection("users").Doc(senderEmail).Get(db.Ctx)
		if err != nil {
			http.Error(w, "Failed to fetch sender's username", http.StatusInternalServerError)
			return
		}
		senderUsername := senderDoc.Data()["Username"].(string)

		// Append the request
		pendingRequests = append(pendingRequests, map[string]string{
			"username": senderUsername, // Return original case username
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pendingRequests)
}

// DeclineFriendRequestByUsername allows users to decline friend requests using a username
func DeclineFriendRequestByUsername(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Username string `json:"username"` // Username of the person who sent the friend request
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the current user's email from JWT token context
	requesterEmail := r.Context().Value("userEmail").(string)

	// Retrieve the email of the friend request sender by username
	senderDoc, err := db.Client.Collection("users").Where("Username", "==", requestBody.Username).Limit(1).Documents(db.Ctx).Next()
	if err != nil {
		http.Error(w, "Friend request sender not found", http.StatusNotFound)
		return
	}
	senderEmail := senderDoc.Data()["Email"].(string)

	// Check if there is a pending friend request from the sender
	docRef := db.Client.Collection("friends").Doc(senderEmail + "_" + requesterEmail)
	docSnapshot, err := docRef.Get(db.Ctx)
	if err != nil || !docSnapshot.Exists() || docSnapshot.Data()["Status"].(string) != "pending" {
		http.Error(w, "Friend request not found", http.StatusNotFound)
		return
	}

	// Remove the friend request from the database (or alternatively, update its status to 'declined')
	_, err = docRef.Delete(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to decline friend request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Friend request declined"})
}

// CancelFriendRequest allows users to cancel a pending friend request
func CancelFriendRequest(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Username string `json:"username"` // The username of the recipient of the friend request to cancel
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Retrieve the sender's email from JWT token context
	requesterEmail := r.Context().Value("userEmail").(string)

	// Retrieve the email of the friend by username
	doc, err := db.Client.Collection("users").Where("Username", "==", requestBody.Username).Limit(1).Documents(db.Ctx).Next()
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	friendEmail := doc.Data()["Email"].(string)

	// Check if a pending friend request exists
	docRef := db.Client.Collection("friends").Doc(requesterEmail + "_" + friendEmail)
	docSnapshot, err := docRef.Get(db.Ctx)
	if err != nil || !docSnapshot.Exists() || docSnapshot.Data()["Status"].(string) != "pending" {
		http.Error(w, "Pending friend request not found", http.StatusNotFound)
		return
	}

	// Delete the friend request
	_, err = docRef.Delete(db.Ctx)
	if err != nil {
		http.Error(w, "Failed to cancel friend request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Friend request canceled"})
}
